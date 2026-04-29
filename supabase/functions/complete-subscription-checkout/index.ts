import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COMPLETE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
};

// Pro plan price ID
const PRO_PRICE_ID = "price_1SipMGF2gaEq7adwAGMICdO5";

/**
 * Best-effort auto-refund for an orphaned PaymentIntent.
 * Called whenever something goes wrong AFTER the customer was charged
 * but BEFORE we successfully created an active subscription. Without this,
 * customers end up paying for service they never receive (and the only
 * record of it lives in standalone PIs with no invoice/subscription link).
 */
async function autoRefund(
  stripe: Stripe,
  paymentIntentId: string,
  reason: string,
): Promise<string | null> {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
      metadata: {
        auto_refund: "true",
        auto_refund_reason: reason,
      },
    });
    logStep("Auto-refund issued", { paymentIntentId, refundId: refund.id, reason });
    return refund.id;
  } catch (refundErr) {
    // Already refunded, etc. — not fatal, just log.
    logStep("Auto-refund failed (continuing)", {
      paymentIntentId,
      reason,
      error: refundErr instanceof Error ? refundErr.message : String(refundErr),
    });
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Read body once as text so we can recover gracefully from empty/invalid JSON.
  let body: Record<string, unknown> = {};
  try {
    const raw = await req.text();
    if (raw) body = JSON.parse(raw);
  } catch (parseErr) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON body" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response(
      JSON.stringify({ success: false, error: "STRIPE_SECRET_KEY is not set" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const paymentIntentId = body.paymentIntentId as string | undefined;

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const email = body.email as string | undefined;
    const firstName = body.firstName as string | undefined;
    const lastName = body.lastName as string | undefined;
    const password = body.password as string | undefined;
    const couponCode = body.couponCode as string | undefined;
    const isUpgrade = !!body.isUpgrade;
    const userId = body.userId as string | undefined;

    logStep("Received request", {
      paymentIntentId,
      email,
      firstName,
      lastName,
      isUpgrade,
      hasCoupon: !!couponCode
    });

    if (!paymentIntentId) throw new Error("Payment intent ID is required");
    if (!email) throw new Error("Email is required");
    if (!isUpgrade && !password) throw new Error("Password is required for new users");

    // Verify the payment intent succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
    }
    logStep("Payment intent verified", { status: paymentIntent.status });

    let supabaseUserId = userId;
    let stripeCustomerId: string | undefined;

    // For new users, create Supabase account
    if (!isUpgrade) {
      logStep("Creating new Supabase user");

      const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);

      if (existingUser) {
        // Account already exists -> we just charged them but cannot create the
        // subscription under a fresh account. Refund and bail out.
        logStep("User already exists - auto-refunding", { userId: existingUser.id });
        const refundId = await autoRefund(stripe, paymentIntentId, "user_already_exists");
        return new Response(
          JSON.stringify({
            success: false,
            error: "An account with this email already exists. Your payment has been automatically refunded — please log in to upgrade.",
            code: "account_exists",
            refund_id: refundId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 },
        );
      }

      // Create user in Supabase
      const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
        email,
        password: password!,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        }
      });

      if (createUserError) {
        logStep("Failed to create user - auto-refunding", { error: createUserError.message });
        const refundId = await autoRefund(stripe, paymentIntentId, "supabase_user_creation_failed");
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to create account: ${createUserError.message}. Your payment has been refunded.`,
            refund_id: refundId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
        );
      }

      supabaseUserId = newUser.user.id;
      logStep("Created Supabase user", { userId: supabaseUserId });

      await supabaseClient.from('user_activity').insert({
        user_id: supabaseUserId,
        event_type: 'signup',
        metadata: { source: 'checkout', is_upgrade: false },
      });

      const { error: profileError } = await supabaseClient
        .from('profiles')
        .upsert({
          user_id: supabaseUserId,
          first_name: firstName,
          last_name: lastName,
        }, { onConflict: 'user_id' });

      if (profileError) {
        logStep("Profile creation warning", { error: profileError.message });
      }
    } else {
      if (!userId) throw new Error("User ID is required for upgrades");
      logStep("Processing upgrade for existing user", { userId });
    }

    // Create or find Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId: stripeCustomerId });
    } else {
      const customer = await stripe.customers.create({
        email,
        name: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
        metadata: { supabase_user_id: supabaseUserId || '' }
      });
      stripeCustomerId = customer.id;
      logStep("Created Stripe customer", { customerId: stripeCustomerId });
    }

    // Attach the payment method from the PaymentIntent to the customer
    if (paymentIntent.payment_method) {
      const paymentMethodId = typeof paymentIntent.payment_method === 'string'
        ? paymentIntent.payment_method
        : paymentIntent.payment_method.id;

      try {
        await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomerId });
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        });
        logStep("Attached payment method to customer", { paymentMethodId });
      } catch (attachErr) {
        // PM may already be attached if the customer existed — non-fatal.
        logStep("PM attach warning (continuing)", {
          error: attachErr instanceof Error ? attachErr.message : String(attachErr),
        });
      }
    }

    // Build subscription options
    const subscriptionOptions: Stripe.SubscriptionCreateParams = {
      customer: stripeCustomerId,
      items: [{ price: PRO_PRICE_ID }],
      default_payment_method: paymentIntent.payment_method
        ? (typeof paymentIntent.payment_method === 'string'
            ? paymentIntent.payment_method
            : paymentIntent.payment_method.id)
        : undefined,
      metadata: {
        supabase_user_id: supabaseUserId || '',
        is_upgrade: isUpgrade ? 'true' : 'false',
        source_payment_intent: paymentIntentId,
      },
    };

    if (couponCode) {
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) {
          subscriptionOptions.coupon = couponCode;
          logStep("Applied coupon to subscription", { couponId: couponCode });
        }
      } catch (_) {
        logStep("Coupon not valid for subscription, skipping", { code: couponCode });
      }
    }

    // === Critical block: create subscription, refund on any failure ===
    let subscription: Stripe.Subscription;
    try {
      subscription = await stripe.subscriptions.create(subscriptionOptions);
      logStep("Created subscription", { subscriptionId: subscription.id, status: subscription.status });
    } catch (subErr) {
      const msg = subErr instanceof Error ? subErr.message : String(subErr);
      logStep("Subscription creation threw - auto-refunding", { error: msg });
      const refundId = await autoRefund(stripe, paymentIntentId, "subscription_creation_threw");
      return new Response(
        JSON.stringify({
          success: false,
          error: `We couldn't activate your subscription (${msg}). Your payment has been automatically refunded.`,
          refund_id: refundId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 },
      );
    }

    // Validate subscription is actually active
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      logStep("Subscription not active - retrying once", { status: subscription.status });
      const refreshed = await stripe.subscriptions.retrieve(subscription.id);
      if (refreshed.status !== 'active' && refreshed.status !== 'trialing') {
        logStep("Subscription still not active - auto-refunding & cancelling", {
          subscriptionId: refreshed.id,
          status: refreshed.status,
        });
        const refundId = await autoRefund(stripe, paymentIntentId, `subscription_${refreshed.status}`);
        // Cancel the dead subscription so it doesn't linger
        try { await stripe.subscriptions.cancel(refreshed.id); } catch (_) { /* ignore */ }
        return new Response(
          JSON.stringify({
            success: false,
            error: `Your subscription couldn't be activated (status: ${refreshed.status}). Your payment has been automatically refunded — please try again or contact support.`,
            refund_id: refundId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 },
        );
      }
      logStep("Subscription became active after refresh", { status: refreshed.status });
    }

    logStep("Checkout completed successfully", {
      subscriptionId: subscription.id,
      customerId: stripeCustomerId,
      userId: supabaseUserId,
    });

    return new Response(JSON.stringify({
      success: true,
      subscriptionId: subscription.id,
      customerId: stripeCustomerId,
      userId: supabaseUserId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    // For any unexpected error after the PI was charged, attempt a refund as a safety net.
    let refundId: string | null = null;
    if (paymentIntentId) {
      refundId = await autoRefund(stripe, paymentIntentId, "unexpected_error");
    }
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      refund_id: refundId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

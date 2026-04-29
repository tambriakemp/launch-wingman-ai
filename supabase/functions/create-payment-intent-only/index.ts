import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-INTENT-ONLY] ${step}${detailsStr}`);
};

// Price IDs for subscription tiers
const PRICE_IDS: Record<string, string> = {
  content_vault: 'price_1StiayF2gaEq7adwKHe9AbQF',
  pro: 'price_1SipMGF2gaEq7adwAGMICdO5',
  advanced: 'price_1TEznFF2gaEq7adwpTfGefLX',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Read raw body to survive empty/malformed input
    let body: Record<string, unknown> = {};
    try {
      const raw = await req.text();
      if (raw) body = JSON.parse(raw);
    } catch (_) {
      body = {};
    }

    const couponCode = body.couponCode as string | undefined;
    const tierInput = body.tier as string | undefined;
    const email = (body.email as string | undefined)?.toLowerCase().trim();
    const isUpgrade = !!body.isUpgrade;

    const selectedTier = (tierInput && PRICE_IDS[tierInput]) ? tierInput : 'pro';
    const priceId = PRICE_IDS[selectedTier];

    logStep("Received request", { hasCoupon: !!couponCode, tier: selectedTier, priceId, hasEmail: !!email, isUpgrade });

    // === Pre-charge guards ===
    // Only run guards for NEW signups where we can identify the customer by email.
    // Upgrades are authenticated and already have a known user/customer.
    if (email && !isUpgrade) {
      // 1. Block if a Supabase account already exists for this email.
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      if (supabaseUrl && supabaseServiceKey) {
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false },
        });
        try {
          const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(
            (u) => u.email?.toLowerCase() === email
          );
          if (existingUser) {
            logStep("Blocked: account already exists for email", { email });
            return new Response(
              JSON.stringify({
                success: false,
                error: "An account with this email already exists. Please log in to upgrade.",
                code: "account_exists",
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 },
            );
          }
        } catch (e) {
          // Don't fail the whole request if user lookup hiccups — just log.
          logStep("User existence check failed (continuing)", {
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }

      // 2. Block if this email already has a recent succeeded subscription_checkout PI
      //    that isn't tied to an active subscription. This catches users who are
      //    re-attempting checkout after a previous failure left an orphan charge.
      try {
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;

          // Active subs?
          const subs = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1,
          });
          const trialing = await stripe.subscriptions.list({
            customer: customerId,
            status: "trialing",
            limit: 1,
          });
          const hasActiveSub = subs.data.length > 0 || trialing.data.length > 0;

          if (hasActiveSub) {
            logStep("Blocked: customer already has active subscription", { customerId });
            return new Response(
              JSON.stringify({
                success: false,
                error: "You already have an active subscription. Please log in.",
                code: "already_subscribed",
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 },
            );
          }

          // Recent orphan PI?
          const cutoff = Math.floor(Date.now() / 1000) - 35 * 24 * 60 * 60; // 35 days
          const recentPIs = await stripe.paymentIntents.list({
            customer: customerId,
            limit: 20,
            created: { gte: cutoff },
          });
          const orphanPI = recentPIs.data.find((pi) =>
            pi.status === "succeeded" &&
            pi.metadata?.type === "subscription_checkout" &&
            !pi.invoice
          );
          if (orphanPI) {
            logStep("Blocked: orphan PI from previous attempt detected", {
              customerId,
              paymentIntentId: orphanPI.id,
            });
            return new Response(
              JSON.stringify({
                success: false,
                error: "We found a recent payment from you that didn't finish setting up your subscription. Please contact support so we can resolve it — do not pay again.",
                code: "orphan_payment_pending",
                payment_intent_id: orphanPI.id,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 },
            );
          }
        }
      } catch (e) {
        // Lookup failure shouldn't block legitimate signups — just log.
        logStep("Stripe pre-charge guard failed (continuing)", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
    // === End pre-charge guards ===

    // Get the price details to calculate amount
    const price = await stripe.prices.retrieve(priceId);
    let amount = price.unit_amount || 0;
    const currency = price.currency || 'usd';
    logStep("Retrieved price", { priceId, amount, currency });

    if (couponCode) {
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) {
          if (coupon.percent_off) {
            amount = Math.round(amount * (1 - coupon.percent_off / 100));
          } else if (coupon.amount_off) {
            amount = Math.max(0, amount - coupon.amount_off);
          }
          logStep("Applied coupon", { couponId: couponCode, finalAmount: amount });
        }
      } catch (_) {
        logStep("Coupon not valid, using original price", { code: couponCode });
      }
    }

    if (amount === 0) {
      logStep("Free subscription - no payment intent needed");
      return new Response(JSON.stringify({
        success: true,
        clientSecret: "free_subscription",
        amount: 0,
        currency,
        tier: selectedTier,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        price_id: priceId,
        tier: selectedTier,
        type: 'subscription_checkout',
        signup_email: email || '',
        is_upgrade: isUpgrade ? 'true' : 'false',
      },
    });

    logStep("Created payment intent", {
      paymentIntentId: paymentIntent.id,
      amount,
      tier: selectedTier,
      hasClientSecret: !!paymentIntent.client_secret
    });

    return new Response(JSON.stringify({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      tier: selectedTier,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

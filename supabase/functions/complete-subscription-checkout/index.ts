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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { 
      paymentIntentId, 
      email, 
      firstName, 
      lastName, 
      password, 
      couponCode, 
      isUpgrade, 
      userId 
    } = await req.json();
    
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

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
      
      // Check if user already exists
      const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);
      
      if (existingUser) {
        logStep("User already exists", { userId: existingUser.id });
        throw new Error("An account with this email already exists. Please log in instead.");
      }

      // Create user in Supabase
      const { data: newUser, error: createUserError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        }
      });

      if (createUserError) {
        logStep("Failed to create user", { error: createUserError.message });
        throw new Error(`Failed to create account: ${createUserError.message}`);
      }

      supabaseUserId = newUser.user.id;
      logStep("Created Supabase user", { userId: supabaseUserId });

      // Track signup activity
      await supabaseClient.from('user_activity').insert({
        user_id: supabaseUserId,
        event_type: 'signup',
        metadata: { source: 'checkout', is_upgrade: false },
      });
      logStep("Signup activity tracked", { userId: supabaseUserId });

      // Create profile
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
      // For upgrades, verify the user exists
      if (!userId) throw new Error("User ID is required for upgrades");
      logStep("Processing upgrade for existing user", { userId });
    }

    // Create or find Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId: stripeCustomerId });
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email,
        name: `${firstName || ''} ${lastName || ''}`.trim() || undefined,
        metadata: {
          supabase_user_id: supabaseUserId || '',
        }
      });
      stripeCustomerId = customer.id;
      logStep("Created Stripe customer", { customerId: stripeCustomerId });
    }

    // Attach the payment method from the PaymentIntent to the customer
    if (paymentIntent.payment_method) {
      const paymentMethodId = typeof paymentIntent.payment_method === 'string' 
        ? paymentIntent.payment_method 
        : paymentIntent.payment_method.id;
      
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });
      
      // Set as default payment method
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
      logStep("Attached payment method to customer", { paymentMethodId });
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
      },
    };

    // Apply coupon if provided
    if (couponCode) {
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) {
          subscriptionOptions.coupon = couponCode;
          logStep("Applied coupon to subscription", { couponId: couponCode });
        }
      } catch (couponError) {
        logStep("Coupon not valid for subscription, skipping", { code: couponCode });
      }
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create(subscriptionOptions);
    logStep("Created subscription", { subscriptionId: subscription.id, status: subscription.status });

    // Validate subscription is actually active
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      logStep("WARNING: Subscription not active after creation", {
        subscriptionId: subscription.id,
        status: subscription.status,
        customerId: stripeCustomerId,
        userId: supabaseUserId,
      });
      // Try to retrieve updated status after a brief moment
      const refreshed = await stripe.subscriptions.retrieve(subscription.id);
      if (refreshed.status !== 'active' && refreshed.status !== 'trialing') {
        logStep("ERROR: Subscription still not active after refresh", {
          subscriptionId: refreshed.id,
          status: refreshed.status,
        });
        throw new Error(`Subscription created but not active. Status: ${refreshed.status}. Please contact support.`);
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
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

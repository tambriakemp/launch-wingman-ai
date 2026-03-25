import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION-INTENT] ${step}${detailsStr}`);
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { email, firstName, lastName, password, couponCode, isUpgrade, userId } = await req.json();
    logStep("Received request", { email, firstName, lastName, isUpgrade, hasCoupon: !!couponCode });

    if (!email) throw new Error("Email is required");
    if (!isUpgrade && !password) throw new Error("Password is required for new users");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let supabaseUserId = userId;
    let stripeCustomerId: string | undefined;

    // For new users, create Supabase account first
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

      // Create profile (trigger might handle this, but let's ensure)
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

    // Check for existing Stripe customer
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

    // Get the price details to calculate amount
    const price = await stripe.prices.retrieve(PRO_PRICE_ID);
    let amount = price.unit_amount || 0;
    const currency = price.currency || 'usd';
    logStep("Retrieved price", { priceId: PRO_PRICE_ID, amount, currency });

    // Check if coupon applies and calculate final amount
    let appliedCoupon: string | undefined;
    if (couponCode) {
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) {
          appliedCoupon = couponCode;
          if (coupon.percent_off) {
            amount = Math.round(amount * (1 - coupon.percent_off / 100));
          } else if (coupon.amount_off) {
            amount = Math.max(0, amount - coupon.amount_off);
          }
          logStep("Applied coupon", { couponId: couponCode, finalAmount: amount });
        }
      } catch (couponError) {
        logStep("Coupon not valid, skipping", { code: couponCode });
      }
    }

    let clientSecret: string | null = null;

    // Only create payment intent if amount > 0
    if (amount > 0) {
      // Create PaymentIntent explicitly
      const paymentIntent = await stripe.paymentIntents.create({
        customer: stripeCustomerId,
        amount,
        currency,
        automatic_payment_methods: { enabled: true },
        setup_future_usage: 'off_session',
        metadata: {
          supabase_user_id: supabaseUserId || '',
          price_id: PRO_PRICE_ID,
          is_upgrade: isUpgrade ? 'true' : 'false',
        },
      });
      clientSecret = paymentIntent.client_secret;
      logStep("Created payment intent", { 
        paymentIntentId: paymentIntent.id, 
        hasClientSecret: !!clientSecret 
      });
    } else {
      // Free subscription due to 100% coupon
      clientSecret = "free_subscription";
      logStep("Free subscription - no payment required");
    }

    // Build subscription options
    const subscriptionOptions: Stripe.SubscriptionCreateParams = {
      customer: stripeCustomerId,
      items: [{ price: PRO_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      metadata: {
        supabase_user_id: supabaseUserId || '',
        is_upgrade: isUpgrade ? 'true' : 'false',
      },
    };

    if (appliedCoupon) {
      subscriptionOptions.coupon = appliedCoupon;
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create(subscriptionOptions);
    logStep("Created subscription", { subscriptionId: subscription.id, status: subscription.status });

    if (!clientSecret) {
      throw new Error("Failed to create payment intent - no client secret returned");
    }

    logStep("Subscription created successfully", {
      subscriptionId: subscription.id,
      hasClientSecret: !!clientSecret,
    });

    return new Response(JSON.stringify({
      success: true,
      subscriptionId: subscription.id,
      clientSecret,
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

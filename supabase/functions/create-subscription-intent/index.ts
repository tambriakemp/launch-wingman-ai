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

    // Build subscription options
    const subscriptionOptions: Stripe.SubscriptionCreateParams = {
      customer: stripeCustomerId,
      items: [{ price: PRO_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        supabase_user_id: supabaseUserId || '',
        is_upgrade: isUpgrade ? 'true' : 'false',
      }
    };

    // Apply coupon if provided
    if (couponCode) {
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) {
          subscriptionOptions.coupon = couponCode;
          logStep("Applied coupon", { couponId: couponCode });
        }
      } catch (couponError) {
        logStep("Coupon not valid, skipping", { code: couponCode });
      }
    }

    // Create subscription with incomplete payment
    const subscription = await stripe.subscriptions.create(subscriptionOptions);
    logStep("Created subscription", { subscriptionId: subscription.id, status: subscription.status });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    logStep("Invoice details", { 
      invoiceId: invoice?.id, 
      invoiceStatus: invoice?.status,
      paymentIntentType: typeof invoice?.payment_intent,
      paymentIntentValue: invoice?.payment_intent
    });

    // Handle different payment_intent states
    let clientSecret: string | null = null;
    
    if (invoice?.payment_intent) {
      if (typeof invoice.payment_intent === 'string') {
        // payment_intent is just an ID, need to retrieve it
        logStep("Payment intent is string ID, retrieving...", { id: invoice.payment_intent });
        const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
        clientSecret = paymentIntent.client_secret;
      } else {
        // payment_intent is expanded object
        clientSecret = (invoice.payment_intent as Stripe.PaymentIntent).client_secret;
      }
    }

    if (!clientSecret) {
      logStep("No client secret available", { 
        hasInvoice: !!invoice, 
        hasPaymentIntent: !!invoice?.payment_intent 
      });
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

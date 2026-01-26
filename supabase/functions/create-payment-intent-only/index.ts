import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT-INTENT-ONLY] ${step}${detailsStr}`);
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

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { couponCode } = await req.json().catch(() => ({}));
    logStep("Received request", { hasCoupon: !!couponCode });

    // Get the price details to calculate amount
    const price = await stripe.prices.retrieve(PRO_PRICE_ID);
    let amount = price.unit_amount || 0;
    const currency = price.currency || 'usd';
    logStep("Retrieved price", { priceId: PRO_PRICE_ID, amount, currency });

    // Check if coupon applies and calculate final amount
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
      } catch (couponError) {
        logStep("Coupon not valid, using original price", { code: couponCode });
      }
    }

    // Handle 100% discount (free subscription)
    if (amount === 0) {
      logStep("Free subscription - no payment intent needed");
      return new Response(JSON.stringify({
        success: true,
        clientSecret: "free_subscription",
        amount: 0,
        currency,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create a PaymentIntent without a customer (will attach customer later)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        price_id: PRO_PRICE_ID,
        type: 'subscription_checkout',
      },
    });

    logStep("Created payment intent", { 
      paymentIntentId: paymentIntent.id, 
      amount,
      hasClientSecret: !!paymentIntent.client_secret 
    });

    return new Response(JSON.stringify({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
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

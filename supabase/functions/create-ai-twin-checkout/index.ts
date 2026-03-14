import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_TWIN_PRICE_ID = "price_1TAfjcF2gaEq7adw7vG5yzn5";
const SKOOL_WEBHOOK_URL = "https://api2.skool.com/groups/launchely/webhooks/9f070ee6bddb4a8395df1bbd83de470a";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-TWIN-CHECKOUT] ${step}${detailsStr}`);
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

    // Parse body for email (this is a guest checkout - no auth required)
    const { email, coupon_code } = await req.json();
    if (!email) throw new Error("Email is required");
    logStep("Request received", { email, hasCoupon: !!coupon_code });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Build session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : email,
      customer_creation: customerId ? undefined : "always",
      line_items: [{ price: AI_TWIN_PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/ai-twin-formula?checkout=success`,
      cancel_url: `${req.headers.get("origin")}/ai-twin-formula?canceled=true`,
      metadata: {
        product: "ai_twin_formula",
        buyer_email: email,
      },
    };

    // Apply coupon if provided
    if (coupon_code) {
      try {
        const coupon = await stripe.coupons.retrieve(coupon_code);
        if (coupon.valid) {
          sessionParams.discounts = [{ coupon: coupon.id }];
          logStep("Coupon applied", { couponId: coupon.id });
        }
      } catch {
        logStep("Coupon not found, trying as promo code", { coupon_code });
        try {
          const promos = await stripe.promotionCodes.list({ code: coupon_code, active: true, limit: 1 });
          if (promos.data.length > 0) {
            sessionParams.discounts = [{ promotion_code: promos.data[0].id }];
            logStep("Promo code applied", { promoId: promos.data[0].id });
          }
        } catch {
          logStep("Promo code also not found, proceeding without discount");
        }
      }
    }

    if (!sessionParams.discounts) {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

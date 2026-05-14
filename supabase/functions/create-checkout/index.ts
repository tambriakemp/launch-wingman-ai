import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tier → Stripe price ID. 3-tier model after Advanced was folded into Pro
// at $49. Both surfaces (web + native) can drive Stripe Hosted Checkout
// for either paid tier now.
const TIER_PRICE_MAP: Record<string, string> = {
  pro: "price_1TEznFF2gaEq7adwpTfGefLX",
  content_vault: "price_1StiayF2gaEq7adwKHe9AbQF",
};
const DEFAULT_TIER = "pro";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    // Parse request body
    let couponCode: string | undefined;
    let tier: string = DEFAULT_TIER;
    let successUrlOverride: string | undefined;
    let cancelUrlOverride: string | undefined;
    try {
      const body = await req.json();
      couponCode = body?.coupon_code;
      if (typeof body?.tier === "string" && TIER_PRICE_MAP[body.tier]) {
        tier = body.tier;
      }
      successUrlOverride = body?.success_url;
      cancelUrlOverride = body?.cancel_url;
    } catch {
      // No body or invalid JSON, that's fine — defaults apply
    }
    const priceId = TIER_PRICE_MAP[tier];
    logStep("Resolved tier", { tier, priceId });

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Validate coupon if provided
    let discounts: Stripe.Checkout.SessionCreateParams['discounts'] = undefined;
    if (couponCode) {
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        if (coupon.valid) {
          discounts = [{ coupon: coupon.id }];
          logStep("Coupon applied", { couponId: coupon.id });
        } else {
          logStep("Coupon is invalid/expired", { couponCode });
        }
      } catch (couponError) {
        logStep("Coupon not found, proceeding without discount", { couponCode });
      }
    }

    const origin = req.headers.get("origin") || "";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      discounts,
      allow_promotion_codes: !discounts, // Allow promo codes only if no coupon pre-applied
      success_url: successUrlOverride || `${origin}/projects?checkout=success`,
      cancel_url: cancelUrlOverride || `${origin}/settings?canceled=true`,
    });

    logStep("Checkout session created", { sessionId: session.id, hasDiscount: !!discounts });

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

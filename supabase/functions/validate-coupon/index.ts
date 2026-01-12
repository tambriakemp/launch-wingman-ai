import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-COUPON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { coupon_code } = await req.json();
    if (!coupon_code) {
      throw new Error("Coupon code is required");
    }
    logStep("Validating coupon", { code: coupon_code });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Try to retrieve the coupon by ID (coupon codes in Stripe are the coupon ID)
    let coupon: Stripe.Coupon;
    try {
      coupon = await stripe.coupons.retrieve(coupon_code);
    } catch (stripeError) {
      logStep("Coupon not found", { code: coupon_code });
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid coupon code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if coupon is valid (not expired, still active)
    if (!coupon.valid) {
      logStep("Coupon is not valid/expired", { code: coupon_code });
      return new Response(
        JSON.stringify({ valid: false, error: "This coupon has expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Build discount description
    let discountDescription = "";
    let discountedPrice: number | null = null;
    const originalPrice = 25; // $25/month

    if (coupon.percent_off) {
      discountedPrice = originalPrice * (1 - coupon.percent_off / 100);
      discountDescription = `${coupon.percent_off}% off`;
    } else if (coupon.amount_off) {
      // amount_off is in cents
      const amountOffDollars = coupon.amount_off / 100;
      discountedPrice = Math.max(0, originalPrice - amountOffDollars);
      discountDescription = `$${amountOffDollars} off`;
    }

    // Add duration info
    if (coupon.duration === "forever") {
      discountDescription += " forever";
    } else if (coupon.duration === "once") {
      discountDescription += " (first payment only)";
    } else if (coupon.duration === "repeating" && coupon.duration_in_months) {
      discountDescription += ` for ${coupon.duration_in_months} months`;
    }

    logStep("Coupon validated successfully", { 
      code: coupon_code, 
      percentOff: coupon.percent_off, 
      amountOff: coupon.amount_off,
      duration: coupon.duration 
    });

    return new Response(
      JSON.stringify({
        valid: true,
        coupon_id: coupon.id,
        name: coupon.name || coupon.id,
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off ? coupon.amount_off / 100 : null, // Convert to dollars
        duration: coupon.duration,
        duration_in_months: coupon.duration_in_months,
        discount_description: discountDescription,
        discounted_price: discountedPrice,
        original_price: originalPrice,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ valid: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-MANAGE-COUPON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Verify admin access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Unauthorized");

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Admin access required");
    }
    logStep("Admin verified", { userId: userData.user.id });

    const body = await req.json();
    const { action, coupon_id, name, percent_off, amount_off, currency, duration, duration_in_months, max_redemptions, redeem_by } = body;

    if (!action) throw new Error("Action is required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    if (action === "create") {
      if (!coupon_id) throw new Error("Coupon ID is required");
      if (!percent_off && !amount_off) throw new Error("Either percent_off or amount_off is required");

      const couponParams: Stripe.CouponCreateParams = {
        id: coupon_id,
        name: name || coupon_id,
        duration: duration || "once",
      };

      if (percent_off) {
        couponParams.percent_off = percent_off;
      } else if (amount_off) {
        couponParams.amount_off = amount_off;
        couponParams.currency = currency || "usd";
      }

      if (duration === "repeating" && duration_in_months) {
        couponParams.duration_in_months = duration_in_months;
      }

      if (max_redemptions) {
        couponParams.max_redemptions = max_redemptions;
      }

      if (redeem_by) {
        couponParams.redeem_by = redeem_by;
      }

      logStep("Creating coupon", couponParams);
      const coupon = await stripe.coupons.create(couponParams);
      logStep("Coupon created", { id: coupon.id });

      return new Response(
        JSON.stringify({ success: true, coupon: { id: coupon.id, name: coupon.name } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "delete") {
      if (!coupon_id) throw new Error("Coupon ID is required");

      logStep("Deleting coupon", { coupon_id });
      await stripe.coupons.del(coupon_id);
      logStep("Coupon deleted", { coupon_id });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

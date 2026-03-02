import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Missing session ID");

    // Verify with Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Verify this session belongs to this user
    if (session.metadata?.user_id !== user.id) {
      throw new Error("Session does not belong to this user");
    }

    const credits = parseInt(session.metadata?.credits || "0");
    if (credits <= 0) throw new Error("Invalid credit amount");

    // Check if already fulfilled (idempotency)
    const { data: existing } = await supabase
      .from("video_credit_transactions")
      .select("id")
      .eq("description", `stripe:${sessionId}`)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, credits, alreadyFulfilled: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add credits to balance
    const { data: creditRow } = await supabase
      .from("video_credits")
      .select("id, balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (creditRow) {
      await supabase
        .from("video_credits")
        .update({ balance: creditRow.balance + credits })
        .eq("id", creditRow.id);
    } else {
      await supabase
        .from("video_credits")
        .insert({ user_id: user.id, balance: credits });
    }

    // Log transaction
    await supabase.from("video_credit_transactions").insert({
      user_id: user.id,
      type: "purchased",
      amount: credits,
      description: `stripe:${sessionId}`,
    });

    return new Response(JSON.stringify({ success: true, credits }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[fulfill-video-credits]", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

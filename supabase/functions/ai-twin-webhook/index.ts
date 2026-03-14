import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SKOOL_WEBHOOK_BASE = "https://api2.skool.com/groups/launchely/webhooks/9f070ee6bddb4a8395df1bbd83de470a";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-TWIN-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Webhook signature verified");
    } else {
      // Fallback: parse without signature verification (for testing)
      event = JSON.parse(body) as Stripe.Event;
      logStep("Webhook parsed without signature verification");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Checkout session completed", { sessionId: session.id, paymentStatus: session.payment_status });

      // Only process if payment was actually made
      if (session.payment_status !== "paid") {
        logStep("Payment not yet confirmed, skipping webhook", { status: session.payment_status });
        return new Response(JSON.stringify({ received: true, action: "skipped_unpaid" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Check if this is an AI Twin Formula purchase
      const isAiTwinPurchase = session.metadata?.product === "ai_twin_formula";
      if (!isAiTwinPurchase) {
        logStep("Not an AI Twin Formula purchase, skipping");
        return new Response(JSON.stringify({ received: true, action: "skipped_wrong_product" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Get buyer email
      const buyerEmail = session.metadata?.buyer_email || session.customer_email || session.customer_details?.email;
      if (!buyerEmail) {
        logStep("ERROR: No email found on session");
        return new Response(JSON.stringify({ received: true, action: "error_no_email" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Send webhook to Skool to grant community access
      const skoolUrl = `${SKOOL_WEBHOOK_BASE}?email=${encodeURIComponent(buyerEmail)}`;
      logStep("Sending Skool webhook", { url: skoolUrl, email: buyerEmail });

      const skoolResponse = await fetch(skoolUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: buyerEmail }),
      });

      logStep("Skool webhook response", { status: skoolResponse.status, ok: skoolResponse.ok });

      if (!skoolResponse.ok) {
        const responseText = await skoolResponse.text();
        logStep("Skool webhook failed", { status: skoolResponse.status, body: responseText });
        // Don't throw — we still want to acknowledge the Stripe webhook
      } else {
        logStep("Skool community access granted", { email: buyerEmail });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
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

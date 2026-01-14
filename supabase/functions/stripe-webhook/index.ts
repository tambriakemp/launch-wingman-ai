import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Declare EdgeRuntime for Deno
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Trigger SureContact sync in background
async function triggerSureContactSync(email: string, eventType: string) {
  const baseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  try {
    const response = await fetch(`${baseUrl}/functions/v1/surecontact-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        action: "sync_user",
        email: email,
        event_type: eventType,
      }),
    });
    
    logStep("SureContact sync triggered", { email, eventType, status: response.status });
  } catch (error) {
    logStep("SureContact sync error", { email, eventType, error: String(error) });
  }
}

// Trigger Marketing webhook sync in background  
async function triggerMarketingSync(userId: string, eventType: string) {
  const baseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  try {
    const response = await fetch(`${baseUrl}/functions/v1/marketing-webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        action: "sync_user",
        user_id: userId,
        event_type: eventType,
      }),
    });
    
    logStep("Marketing sync triggered", { userId, eventType, status: response.status });
  } catch (error) {
    logStep("Marketing sync error", { userId, eventType, error: String(error) });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: String(err) });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      // Parse without verification (development mode)
      event = JSON.parse(body);
      logStep("Webhook parsed without signature verification");
    }

    logStep("Processing event", { type: event.type, id: event.id });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Log webhook to database
    await supabaseClient.from("webhook_logs").insert({
      provider: "stripe",
      event_type: event.type,
      payload: event.data.object,
      status: "processing",
    });

    let customerEmail: string | null = null;
    let userId: string | null = null;
    let eventType: string | null = null;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        customerEmail = session.customer_email || null;
        
        // If no email on session, fetch from customer
        if (!customerEmail && session.customer) {
          const customer = await stripe.customers.retrieve(session.customer as string);
          if (customer && !customer.deleted) {
            customerEmail = customer.email;
          }
        }
        
        eventType = "subscription_started";
        logStep("Checkout completed", { customerEmail, mode: session.mode });
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer && !customer.deleted) {
          customerEmail = customer.email;
        }
        eventType = "subscription_started";
        logStep("Subscription created", { customerEmail, subscriptionId: subscription.id });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer && !customer.deleted) {
          customerEmail = customer.email;
        }
        
        // Check if subscription was reactivated or status changed
        if (subscription.status === "active") {
          eventType = "subscription_started";
        } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
          eventType = "subscription_cancelled";
        }
        logStep("Subscription updated", { customerEmail, status: subscription.status });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (customer && !customer.deleted) {
          customerEmail = customer.email;
        }
        eventType = "subscription_cancelled";
        logStep("Subscription deleted", { customerEmail, subscriptionId: subscription.id });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        customerEmail = invoice.customer_email;
        // Only sync if this is a subscription renewal
        if (invoice.subscription) {
          eventType = "subscription_started";
          logStep("Invoice paid", { customerEmail, invoiceId: invoice.id });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        customerEmail = invoice.customer_email;
        logStep("Invoice payment failed", { customerEmail, invoiceId: invoice.id });
        // Don't sync - just log
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    // If we have an email and event type, trigger syncs in background
    if (customerEmail && eventType) {
      // Find user by email to get user_id for marketing webhook
      const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
      const user = authUsers?.users?.find(u => u.email === customerEmail);
      userId = user?.id || null;

      // Use background tasks for the sync operations
      EdgeRuntime.waitUntil(
        Promise.all([
          triggerSureContactSync(customerEmail, eventType),
          userId ? triggerMarketingSync(userId, eventType) : Promise.resolve(),
        ])
      );
      
      logStep("Background syncs queued", { customerEmail, userId, eventType });
    }

    // Update webhook log status
    await supabaseClient.from("webhook_logs").insert({
      provider: "stripe",
      event_type: event.type,
      payload: { email: customerEmail, eventType, processed: true },
      status: "completed",
      processed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ received: true, event_type: event.type }), {
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

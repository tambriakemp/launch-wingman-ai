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

// Trigger SureContact order sync in background
interface OrderData {
  email: string;
  order_id: string;
  total: number;
  currency: string;
  status: 'completed' | 'refunded' | 'pending';
  products: Array<{ name: string; price_id: string; quantity: number; amount: number }>;
  created_at: string;
  price_id?: string;
}

async function triggerSureContactOrderSync(orderData: OrderData) {
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
        action: "sync_order",
        ...orderData,
      }),
    });
    
    logStep("SureContact order sync triggered", { 
      email: orderData.email, 
      orderId: orderData.order_id, 
      total: orderData.total,
      status: response.status 
    });
  } catch (error) {
    logStep("SureContact order sync error", { 
      email: orderData.email, 
      orderId: orderData.order_id, 
      error: String(error) 
    });
  }
}

// Fire SureContact incoming webhooks for a given trigger event
async function fireIncomingWebhooks(
  supabaseClient: ReturnType<typeof createClient>,
  triggerEvent: string,
  email: string,
  firstName: string,
  lastName: string
) {
  try {
    const { data: webhooks } = await supabaseClient
      .from('surecontact_incoming_webhooks')
      .select('id, name, webhook_url, webhook_secret')
      .eq('trigger_event', triggerEvent)
      .eq('is_active', true);

    if (!webhooks || webhooks.length === 0) {
      logStep(`No active incoming webhooks for ${triggerEvent}`);
      return;
    }

    for (const wh of webhooks) {
      try {
        const whHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (wh.webhook_secret) {
          whHeaders['Authorization'] = `Bearer ${wh.webhook_secret}`;
        }
        const resp = await fetch(wh.webhook_url, {
          method: 'POST',
          headers: whHeaders,
          body: JSON.stringify({ email, first_name: firstName, last_name: lastName }),
        });
        logStep(`Incoming webhook fired`, { name: wh.name, triggerEvent, status: resp.status });
      } catch (err) {
        logStep(`Incoming webhook error`, { name: wh.name, error: String(err) });
      }
    }
  } catch (error) {
    logStep(`fireIncomingWebhooks error`, { triggerEvent, error: String(error) });
  }
}

const SKOOL_WEBHOOK_BASE = "https://api2.skool.com/groups/launchely/webhooks/9f070ee6bddb4a8395df1bbd83de470a";

// Send Skool community access webhook after AI Twin Formula purchase
async function triggerSkoolAccess(email: string) {
  try {
    const skoolUrl = `${SKOOL_WEBHOOK_BASE}?email=${encodeURIComponent(email)}`;
    const response = await fetch(skoolUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    logStep("Skool webhook sent", { email, status: response.status, ok: response.ok });
  } catch (error) {
    logStep("Skool webhook error", { email, error: String(error) });
  }
}

// Notify admins about subscription events
async function notifyAdmins(type: 'pro_signup' | 'pro_cancellation', email: string, userName?: string) {
  const baseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  try {
    const response = await fetch(`${baseUrl}/functions/v1/admin-notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        type,
        user_email: email,
        details: {
          user_name: userName,
        },
      }),
    });
    
    logStep("Admin notification sent", { type, email, status: response.status });
  } catch (error) {
    logStep("Admin notification error", { type, email, error: String(error) });
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
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, Stripe.createSubtleCryptoProvider());
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
    let eventType: string | null = null;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        customerEmail = session.customer_email || session.customer_details?.email || null;
        
        // If no email on session, fetch from customer
        if (!customerEmail && session.customer) {
          const customer = await stripe.customers.retrieve(session.customer as string);
          if (customer && !customer.deleted) {
            customerEmail = customer.email;
          }
        }
        
        eventType = "subscription_started";
        logStep("Checkout completed", { customerEmail, mode: session.mode, metadata: session.metadata, paymentStatus: session.payment_status });

        // If this is an AI Twin Formula purchase, trigger Skool community access
        if (
          session.metadata?.product === "ai_twin_formula" &&
          customerEmail &&
          (session.payment_status === "paid" || session.payment_status === "no_payment_required")
        ) {
          logStep("AI Twin Formula purchase detected, triggering Skool access", { email: customerEmail, paymentStatus: session.payment_status });
          EdgeRuntime.waitUntil(triggerSkoolAccess(customerEmail));
        }

        // Sync order to SureContact E-Commerce tab and notify admins
        if (customerEmail) {
          // Notify admins of new Pro signup
          EdgeRuntime.waitUntil(notifyAdmins('pro_signup', customerEmail));
          
          // Fire pro_signup incoming webhooks for SureContact sequences
          let firstName = '';
          let lastName = '';
          if (session.customer) {
            try {
              const cust = await stripe.customers.retrieve(session.customer as string);
              if (cust && !cust.deleted && cust.name) {
                const parts = cust.name.split(' ');
                firstName = parts[0] || '';
                lastName = parts.slice(1).join(' ') || '';
              }
            } catch (_) { /* ignore */ }
          }
          EdgeRuntime.waitUntil(fireIncomingWebhooks(supabaseClient, 'pro_signup', customerEmail, firstName, lastName));
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            const firstPriceId = lineItems.data[0]?.price?.id || '';
            const orderData: OrderData = {
              email: customerEmail,
              order_id: `STR-${session.id.substring(0, 20)}`,
              total: (session.amount_total || 0) / 100,
              currency: session.currency?.toUpperCase() || 'USD',
              status: 'completed',
              products: lineItems.data.map((item: Stripe.LineItem) => ({
                name: item.description || 'Launchely Pro',
                price_id: item.price?.id || '',
                quantity: item.quantity || 1,
                amount: (item.amount_total || 0) / 100
              })),
              created_at: new Date(session.created * 1000).toISOString(),
              price_id: firstPriceId,
            };
            EdgeRuntime.waitUntil(triggerSureContactOrderSync(orderData));
          } catch (lineItemsError) {
            logStep("Failed to fetch line items for order sync", { error: String(lineItemsError) });
          }
        }
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
        
        // Notify admins of Pro cancellation and log activity
        if (customerEmail) {
          EdgeRuntime.waitUntil(notifyAdmins('pro_cancellation', customerEmail));
          
          // Log plan_cancelled activity for the user
          try {
            const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
            const matchedUser = authUsers?.users?.find(u => u.email === customerEmail);
            if (matchedUser) {
              await supabaseClient.from('user_activity').insert({
                user_id: matchedUser.id,
                event_type: 'plan_cancelled',
                metadata: { subscription_id: subscription.id },
              });
              logStep("Plan cancelled activity logged", { userId: matchedUser.id });
            }
          } catch (activityError) {
            logStep("Failed to log cancellation activity", { error: String(activityError) });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        customerEmail = invoice.customer_email;
        // Only sync if this is a subscription renewal
        if (invoice.subscription) {
          eventType = "subscription_started";
          logStep("Invoice paid", { customerEmail, invoiceId: invoice.id });

          // Sync renewal order to SureContact E-Commerce tab
          if (customerEmail && invoice.lines?.data?.length > 0) {
            const renewalPriceId = invoice.lines.data[0]?.price?.id || '';
            const orderData: OrderData = {
              email: customerEmail,
              order_id: `STR-INV-${invoice.id?.substring(0, 15) || Date.now()}`,
              total: (invoice.amount_paid || 0) / 100,
              currency: invoice.currency?.toUpperCase() || 'USD',
              status: 'completed',
              products: invoice.lines.data.map((line: Stripe.InvoiceLineItem) => ({
                name: line.description || 'Launchely Pro',
                price_id: line.price?.id || '',
                quantity: line.quantity || 1,
                amount: (line.amount || 0) / 100
              })),
              created_at: new Date((invoice.created || Date.now() / 1000) * 1000).toISOString(),
              price_id: renewalPriceId,
            };
            EdgeRuntime.waitUntil(triggerSureContactOrderSync(orderData));
          }
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

    // If we have an email and event type, trigger SureContact sync in background
    if (customerEmail && eventType) {
      // Use background tasks for the sync operation
      EdgeRuntime.waitUntil(triggerSureContactSync(customerEmail, eventType));
      
      logStep("Background sync queued", { customerEmail, eventType });
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

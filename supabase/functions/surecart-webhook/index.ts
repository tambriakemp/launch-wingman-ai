import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SURECART-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    // Get raw body for signature verification
    const rawBody = await req.text();
    let event: Record<string, unknown>;
    
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new Error("Invalid JSON payload");
    }

    const eventType = event.type as string;
    const eventData = event.data as Record<string, unknown>;
    
    logStep("Event parsed", { type: eventType });

    // Log webhook to database
    const { data: logEntry, error: logError } = await supabaseClient
      .from('webhook_logs')
      .insert({
        provider: 'surecart',
        event_type: eventType,
        payload: event,
        status: 'processing'
      })
      .select('id')
      .single();

    if (logError) {
      logStep("Failed to log webhook", { error: logError.message });
    }

    // Extract relevant data based on event type
    let customerEmail: string | null = null;
    let customerId: string | null = null;
    let subscriptionId: string | null = null;
    let subscriptionStatus: string | null = null;

    // Handle different event types
    switch (eventType) {
      case 'checkout.completed': {
        const checkout = eventData.object as Record<string, unknown>;
        const customer = checkout.customer as Record<string, unknown> | string;
        
        if (typeof customer === 'object') {
          customerId = customer.id as string;
          customerEmail = customer.email as string;
        } else {
          customerId = customer;
        }
        
        const subscription = checkout.subscription as Record<string, unknown>;
        if (subscription) {
          subscriptionId = subscription.id as string;
          subscriptionStatus = 'active';
        }
        
        logStep("Checkout completed", { customerId, customerEmail, subscriptionId });
        break;
      }

      case 'subscription.created':
      case 'subscription.activated': {
        const subscription = eventData.object as Record<string, unknown>;
        subscriptionId = subscription.id as string;
        subscriptionStatus = 'active';
        
        const customer = subscription.customer as Record<string, unknown> | string;
        if (typeof customer === 'object') {
          customerId = customer.id as string;
          customerEmail = customer.email as string;
        } else {
          customerId = customer;
        }
        
        logStep("Subscription activated", { subscriptionId, customerId });
        break;
      }

      case 'subscription.canceled': {
        const subscription = eventData.object as Record<string, unknown>;
        subscriptionId = subscription.id as string;
        subscriptionStatus = 'canceled';
        
        const customer = subscription.customer as Record<string, unknown> | string;
        if (typeof customer === 'object') {
          customerId = customer.id as string;
          customerEmail = customer.email as string;
        } else {
          customerId = customer;
        }
        
        logStep("Subscription canceled", { subscriptionId, customerId });
        break;
      }

      case 'subscription.updated': {
        const subscription = eventData.object as Record<string, unknown>;
        subscriptionId = subscription.id as string;
        subscriptionStatus = subscription.status as string;
        
        const customer = subscription.customer as Record<string, unknown> | string;
        if (typeof customer === 'object') {
          customerId = customer.id as string;
          customerEmail = customer.email as string;
        } else {
          customerId = customer;
        }
        
        logStep("Subscription updated", { subscriptionId, status: subscriptionStatus });
        break;
      }

      case 'payment.succeeded': {
        const payment = eventData.object as Record<string, unknown>;
        const customer = payment.customer as Record<string, unknown> | string;
        
        if (typeof customer === 'object') {
          customerId = customer.id as string;
          customerEmail = customer.email as string;
        }
        
        logStep("Payment succeeded", { customerId });
        break;
      }

      case 'payment.failed': {
        const payment = eventData.object as Record<string, unknown>;
        const customer = payment.customer as Record<string, unknown> | string;
        
        if (typeof customer === 'object') {
          customerId = customer.id as string;
          customerEmail = customer.email as string;
        }
        
        logStep("Payment failed", { customerId });
        break;
      }

      default:
        logStep("Unhandled event type", { type: eventType });
    }

    // Update user profile if we have customer info
    if (customerId) {
      // Find user by SureCart customer ID or email
      let userId: string | null = null;

      // First try by customer ID
      const { data: profileByCustomer } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('surecart_customer_id', customerId)
        .single();

      if (profileByCustomer) {
        userId = profileByCustomer.user_id;
      } else if (customerEmail) {
        // Try by email via auth.users
        const { data: userData } = await supabaseClient.auth.admin.listUsers();
        const user = userData?.users?.find(u => u.email === customerEmail);
        if (user) {
          userId = user.id;
        }
      }

      if (userId) {
        const updateData: Record<string, unknown> = {
          surecart_customer_id: customerId,
        };

        if (subscriptionId) {
          updateData.surecart_subscription_id = subscriptionId;
        }

        if (subscriptionStatus) {
          updateData.surecart_subscription_status = subscriptionStatus;
        }

        await supabaseClient
          .from('profiles')
          .update(updateData)
          .eq('user_id', userId);

        logStep("Profile updated", { userId, ...updateData });
      } else {
        logStep("Could not find user for customer", { customerId, customerEmail });
      }
    }

    // Update webhook log status
    if (logEntry?.id) {
      await supabaseClient
        .from('webhook_logs')
        .update({ status: 'completed' })
        .eq('id', logEntry.id);
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

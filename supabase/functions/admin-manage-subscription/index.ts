import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-MANAGE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const adminUser = userData.user;
    if (!adminUser?.email) throw new Error("User not authenticated");
    
    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .single();
    
    if (roleError || !roleData) {
      throw new Error("Unauthorized: Admin access required");
    }
    logStep("Admin verified", { adminEmail: adminUser.email });

    const { action, user_email, stripe_subscription_id } = await req.json();
    logStep("Request params", { action, user_email, stripe_subscription_id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Price IDs for different tiers
    const PRICE_IDS = {
      content_vault: 'price_1StiayF2gaEq7adwKHe9AbQF',
      pro: 'price_1SipMGF2gaEq7adwAGMICdO5',
    };

    if (action === 'cancel') {
      if (!stripe_subscription_id) throw new Error("Subscription ID required for cancellation");
      
      await stripe.subscriptions.cancel(stripe_subscription_id);
      logStep("Subscription cancelled", { stripe_subscription_id });
      
      // Log to admin_action_logs
      await supabaseClient.from('admin_action_logs').insert({
        admin_user_id: adminUser.id,
        admin_email: adminUser.email,
        target_email: user_email,
        action_type: 'subscription_cancelled',
        action_details: { stripe_subscription_id }
      });

      // Trigger marketing and surecontact webhooks to update tags
      if (user_email) {
        const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
        const targetUser = authUsers?.users?.find(u => u.email === user_email);
        if (targetUser) {
          const baseUrl = Deno.env.get("SUPABASE_URL");
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
          

          // Trigger SureContact webhook
          await fetch(`${baseUrl}/functions/v1/surecontact-webhook`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              action: "sync_user",
              email: user_email,
              event_type: "subscription_cancelled",
            }),
          });
          logStep("Contact webhook triggered for subscription_cancelled", { email: user_email });
        }
      }
      
      return new Response(JSON.stringify({ success: true, message: "Subscription cancelled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Helper function to grant a subscription with a specific price
    const grantSubscription = async (tierName: string, priceId: string) => {
      if (!user_email) throw new Error(`User email required to grant ${tierName} access`);
      
      // Find or create customer
      let customerId;
      const customers = await stripe.customers.list({ email: user_email, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        
        // Check if already has active subscription for this price
        const existingSubs = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 10,
        });
        
        // Check if user already has this specific tier
        const hasSameTier = existingSubs.data.some((s: Stripe.Subscription) => 
          s.items.data[0]?.price?.id === priceId
        );
        
        if (hasSameTier) {
          throw new Error(`User already has an active ${tierName} subscription`);
        }
      } else {
        const customer = await stripe.customers.create({ email: user_email });
        customerId = customer.id;
        logStep("Created new Stripe customer", { customerId });
      }

      // Create a 100% off coupon for this specific case
      const coupon = await stripe.coupons.create({
        percent_off: 100,
        duration: 'forever',
        name: `${tierName} - ${user_email}`.substring(0, 40),
        metadata: {
          granted_to: user_email,
          granted_by: adminUser.email,
          granted_at: new Date().toISOString(),
          tier: tierName,
        }
      });

      // Create subscription with the coupon
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        discounts: [{ coupon: coupon.id }],
      });

      logStep(`${tierName} subscription granted`, { customerId, subscriptionId: subscription.id });
      
      // Log to admin_action_logs
      await supabaseClient.from('admin_action_logs').insert({
        admin_user_id: adminUser.id,
        admin_email: adminUser.email,
        target_email: user_email,
        action_type: `${tierName.toLowerCase()}_granted`,
        action_details: { subscription_id: subscription.id, customer_id: customerId }
      });

      // Trigger webhooks
      const baseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      await fetch(`${baseUrl}/functions/v1/surecontact-webhook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          action: "sync_user",
          email: user_email,
          event_type: "subscription_started",
        }),
      });
      logStep("Contact webhook triggered for subscription_started", { email: user_email });
      
      return subscription;
    };

    if (action === 'grant_pro') {
      const subscription = await grantSubscription('Pro', PRICE_IDS.pro);
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Pro access granted",
        subscription_id: subscription.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'grant_content_vault') {
      const subscription = await grantSubscription('Content Vault', PRICE_IDS.content_vault);
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Content Vault access granted",
        subscription_id: subscription.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'upgrade_to_pro') {
      if (!stripe_subscription_id) throw new Error("No existing subscription to upgrade");
      
      // Cancel existing Vault subscription
      await stripe.subscriptions.cancel(stripe_subscription_id);
      logStep("Cancelled existing Vault subscription for upgrade", { stripe_subscription_id });
      
      // Grant Pro subscription
      const subscription = await grantSubscription('Pro', PRICE_IDS.pro);
      
      // Log the upgrade action
      await supabaseClient.from('admin_action_logs').insert({
        admin_user_id: adminUser.id,
        admin_email: adminUser.email,
        target_email: user_email,
        action_type: 'upgraded_to_pro',
        action_details: { 
          old_subscription_id: stripe_subscription_id,
          new_subscription_id: subscription.id 
        }
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Upgraded to Pro",
        subscription_id: subscription.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'downgrade_to_vault') {
      if (!stripe_subscription_id) throw new Error("No existing subscription to downgrade");
      
      // Cancel existing Pro subscription
      await stripe.subscriptions.cancel(stripe_subscription_id);
      logStep("Cancelled existing Pro subscription for downgrade", { stripe_subscription_id });
      
      // Grant Vault subscription
      const subscription = await grantSubscription('Content Vault', PRICE_IDS.content_vault);
      
      // Log the downgrade action
      await supabaseClient.from('admin_action_logs').insert({
        admin_user_id: adminUser.id,
        admin_email: adminUser.email,
        target_email: user_email,
        action_type: 'downgraded_to_vault',
        action_details: { 
          old_subscription_id: stripe_subscription_id,
          new_subscription_id: subscription.id 
        }
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Downgraded to Content Vault",
        subscription_id: subscription.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: errorMessage.includes("Unauthorized") ? 403 : 500,
    });
  }
});

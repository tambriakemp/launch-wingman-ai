import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-MANAGE-SURECART-SUBSCRIPTION] ${step}${detailsStr}`);
};

const SURECART_API_BASE = "https://api.surecart.com/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const surecartApiKey = Deno.env.get("SURECART_API_KEY");
    if (!surecartApiKey) throw new Error("SURECART_API_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Authentication failed");

    const adminUserId = claimsData.claims.sub as string;
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .limit(1);

    if (!roleData || roleData.length === 0) {
      throw new Error("Admin access required");
    }
    logStep("Admin verified", { adminUserId });

    const { action, user_email, surecart_subscription_id } = await req.json();
    logStep("Action requested", { action, user_email, surecart_subscription_id });

    const headers = {
      "Authorization": `Bearer ${surecartApiKey}`,
      "Content-Type": "application/json",
    };

    if (action === "cancel") {
      if (!surecart_subscription_id) {
        throw new Error("Subscription ID is required for cancellation");
      }

      // Cancel the subscription
      const cancelResponse = await fetch(
        `${SURECART_API_BASE}/subscriptions/${surecart_subscription_id}/cancel`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            behavior: "at_period_end", // Cancel at end of billing period
          }),
        }
      );

      if (!cancelResponse.ok) {
        const errorText = await cancelResponse.text();
        throw new Error(`Failed to cancel subscription: ${errorText}`);
      }

      const cancelResult = await cancelResponse.json();
      logStep("Subscription canceled", { subscriptionId: surecart_subscription_id });

      // Update profile
      const { data: userData } = await supabaseClient.auth.admin.listUsers();
      const user = userData?.users?.find(u => u.email === user_email);
      
      if (user) {
        await supabaseClient
          .from('profiles')
          .update({ surecart_subscription_status: 'canceling' })
          .eq('user_id', user.id);
      }

      // Log admin action
      await supabaseClient.from('admin_action_logs').insert({
        admin_user_id: adminUserId,
        action_type: 'subscription_canceled',
        target_user_email: user_email,
        details: { subscription_id: surecart_subscription_id, provider: 'surecart' }
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Subscription will be canceled at end of billing period",
        data: cancelResult
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === "grant_pro") {
      if (!user_email) {
        throw new Error("User email is required");
      }

      // Find or create customer
      let customerId: string | null = null;

      // Search for existing customer
      const searchResponse = await fetch(
        `${SURECART_API_BASE}/customers?email=${encodeURIComponent(user_email)}`,
        { headers }
      );

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.data && searchResult.data.length > 0) {
          customerId = searchResult.data[0].id;
          logStep("Found existing customer", { customerId });
        }
      }

      // Create customer if not found
      if (!customerId) {
        const createCustomerResponse = await fetch(`${SURECART_API_BASE}/customers`, {
          method: "POST",
          headers,
          body: JSON.stringify({ email: user_email }),
        });

        if (!createCustomerResponse.ok) {
          const errorText = await createCustomerResponse.text();
          throw new Error(`Failed to create customer: ${errorText}`);
        }

        const newCustomer = await createCustomerResponse.json();
        customerId = newCustomer.id;
        logStep("Created new customer", { customerId });
      }

      // Get price ID from config
      const { data: configData } = await supabaseClient
        .from('payment_config')
        .select('value')
        .eq('provider', 'surecart')
        .eq('key', 'price_id')
        .single();

      if (!configData?.value) {
        throw new Error("SureCart not configured. Please run admin setup first.");
      }
      const priceId = configData.value;

      // Create a 100% off coupon for this grant
      const couponResponse = await fetch(`${SURECART_API_BASE}/coupons`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: `Admin Grant - ${user_email}`,
          percent_off: 100,
          duration: "forever",
          max_redemptions: 1,
        }),
      });

      if (!couponResponse.ok) {
        const errorText = await couponResponse.text();
        throw new Error(`Failed to create coupon: ${errorText}`);
      }

      const coupon = await couponResponse.json();
      logStep("Created 100% off coupon", { couponId: coupon.id });

      // Create subscription with the coupon
      const subscriptionResponse = await fetch(`${SURECART_API_BASE}/subscriptions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          customer: customerId,
          price: priceId,
          coupon: coupon.id,
        }),
      });

      if (!subscriptionResponse.ok) {
        const errorText = await subscriptionResponse.text();
        throw new Error(`Failed to create subscription: ${errorText}`);
      }

      const subscription = await subscriptionResponse.json();
      logStep("Created free subscription", { subscriptionId: subscription.id });

      // Update user profile
      const { data: userData } = await supabaseClient.auth.admin.listUsers();
      const user = userData?.users?.find(u => u.email === user_email);

      if (user) {
        await supabaseClient
          .from('profiles')
          .update({
            surecart_customer_id: customerId,
            surecart_subscription_id: subscription.id,
            surecart_subscription_status: 'active'
          })
          .eq('user_id', user.id);
      }

      // Log admin action
      await supabaseClient.from('admin_action_logs').insert({
        admin_user_id: adminUserId,
        action_type: 'pro_granted',
        target_user_email: user_email,
        details: {
          subscription_id: subscription.id,
          customer_id: customerId,
          coupon_id: coupon.id,
          provider: 'surecart'
        }
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Pro access granted successfully",
        data: {
          subscription_id: subscription.id,
          customer_id: customerId
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

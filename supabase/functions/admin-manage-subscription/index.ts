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

    if (action === 'cancel') {
      if (!stripe_subscription_id) throw new Error("Subscription ID required for cancellation");
      
      await stripe.subscriptions.cancel(stripe_subscription_id);
      logStep("Subscription cancelled", { stripe_subscription_id });
      
      return new Response(JSON.stringify({ success: true, message: "Subscription cancelled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'grant_pro') {
      if (!user_email) throw new Error("User email required to grant pro access");
      
      // Find or create customer
      let customerId;
      const customers = await stripe.customers.list({ email: user_email, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        
        // Check if already has active subscription
        const existingSubs = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1,
        });
        
        if (existingSubs.data.length > 0) {
          throw new Error("User already has an active subscription");
        }
      } else {
        const customer = await stripe.customers.create({ email: user_email });
        customerId = customer.id;
        logStep("Created new Stripe customer", { customerId });
      }

      // Create a free subscription (100% off coupon or $0 price)
      // First, find the pro price
      const prices = await stripe.prices.list({ limit: 10, active: true });
      const proPrice = prices.data.find((p: Stripe.Price) => p.unit_amount && p.unit_amount > 0 && p.recurring);
      
      if (!proPrice) {
        throw new Error("No pro subscription price found in Stripe");
      }

      // Create a 100% off coupon for this specific case
      const coupon = await stripe.coupons.create({
        percent_off: 100,
        duration: 'forever',
        name: `Pro grant - ${user_email.substring(0, 25)}`,
        metadata: {
          granted_to: user_email,
          granted_by: adminUser.email,
          granted_at: new Date().toISOString(),
        }
      });

      // Create subscription with the coupon
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: proPrice.id }],
        coupon: coupon.id,
      });

      logStep("Pro subscription granted", { customerId, subscriptionId: subscription.id });
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Pro access granted",
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

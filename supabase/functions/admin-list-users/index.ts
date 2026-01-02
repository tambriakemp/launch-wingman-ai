import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sanitize user ID for logging (show only first 8 chars)
const sanitizeId = (id: string) => id ? `${id.substring(0, 8)}...` : 'unknown';

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-LIST-USERS] ${step}${detailsStr}`);
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
    logStep("Admin verified", { adminId: sanitizeId(adminUser.id) });

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers();
    if (authError) throw new Error(`Failed to list users: ${authError.message}`);
    logStep("Fetched auth users", { count: authUsers.users.length });

    // Get all profiles with last_active
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('user_id, first_name, last_name, last_active');

    // Get all admin and manager roles
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('user_id, role');

    // Get Stripe subscription info for each user
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const usersWithSubscriptions = await Promise.all(
      authUsers.users.map(async (user) => {
        const profile = profiles?.find(p => p.user_id === user.id);
        const userRolesForUser = userRoles?.filter(r => r.user_id === user.id) || [];
        const isAdmin = userRolesForUser.some(r => r.role === 'admin');
        const isManager = userRolesForUser.some(r => r.role === 'manager');
        
        let subscriptionStatus = 'free';
        let subscriptionEnd = null;
        let stripeCustomerId = null;
        let stripeSubscriptionId = null;
        let subscriptionAmountCents = 0;

        if (user.email) {
          try {
            const customers = await stripe.customers.list({ email: user.email, limit: 1 });
            if (customers.data.length > 0) {
              stripeCustomerId = customers.data[0].id;
              const subscriptions = await stripe.subscriptions.list({
                customer: stripeCustomerId,
                status: "active",
                limit: 1,
              });
              
              if (subscriptions.data.length > 0) {
                const subscription = subscriptions.data[0];
                subscriptionStatus = 'pro';
                subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
                stripeSubscriptionId = subscription.id;
                
                // Get actual amount from subscription item (handles discounts, free upgrades, etc.)
                const priceAmount = subscription.items.data[0]?.price?.unit_amount || 0;
                subscriptionAmountCents = priceAmount;
              }
            }
          } catch (err: unknown) {
            // Log error without user-identifying information
            logStep("Error fetching Stripe data for user", { userId: sanitizeId(user.id) });
          }
        }

        return {
          id: user.id,
          email: user.email,
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
          created_at: user.created_at,
          subscription_status: subscriptionStatus,
          subscription_end: subscriptionEnd,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          subscription_amount_cents: subscriptionAmountCents,
          last_active: profile?.last_active || null,
          is_admin: isAdmin,
          is_manager: isManager,
        };
      })
    );

    logStep("Processed all users", { count: usersWithSubscriptions.length });

    return new Response(JSON.stringify({ users: usersWithSubscriptions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: errorMessage.includes("Unauthorized") ? 403 : 500,
    });
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Subscription tier price IDs
const PRICE_IDS = {
  content_vault: 'price_1StiayF2gaEq7adwKHe9AbQF',
  pro: 'price_1SipMGF2gaEq7adwAGMICdO5',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Determine subscription tier from price ID
const getTierFromPriceId = (priceId: string | null): 'free' | 'content_vault' | 'pro' => {
  if (!priceId) return 'free';
  if (priceId === PRICE_IDS.content_vault) return 'content_vault';
  if (priceId === PRICE_IDS.pro) return 'pro';
  return 'pro'; // Default to pro for any other paid subscription
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
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      logStep("No authorization header - returning unsubscribed");
      return new Response(JSON.stringify({ subscribed: false, subscription_tier: 'free' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Extract token safely
    const token = authHeader.split(/\s+/)[1]?.trim();
    if (!token) {
      logStep("Could not extract token from header");
      return new Response(JSON.stringify({ subscribed: false, subscription_tier: 'free' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Token extracted", { length: token.length, prefix: token.substring(0, 10) + "..." });

    // Use getClaims for reliable server-side token validation
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      logStep("Claims error - returning unsubscribed", { error: claimsError?.message || "No claims data" });
      return new Response(JSON.stringify({ subscribed: false, subscription_tier: 'free' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userId = claimsData.claims.sub;
    const email = claimsData.claims.email as string;

    if (!userId || !email) {
      logStep("Missing user ID or email in claims");
      return new Response(JSON.stringify({ subscribed: false, subscription_tier: 'free' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    logStep("User authenticated", { userId, email });

    // Check if user has admin or manager role - they get full access without Stripe lookup
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'manager'])
      .limit(1);

    if (roleData && roleData.length > 0) {
      logStep("User has staff role - granting full access", { role: roleData[0].role });
      return new Response(JSON.stringify({
        subscribed: true,
        subscription_tier: 'pro',
        subscription_end: null,
        source: "role"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ subscribed: false, subscription_tier: 'free' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10, // Get all active subscriptions to find the highest tier
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd: string | null = null;
    let subscriptionTier: 'free' | 'content_vault' | 'pro' = 'free';
    let priceId: string | null = null;

    if (hasActiveSub) {
      // Check all subscriptions and find the highest tier
      for (const subscription of subscriptions.data) {
        const subPriceId = subscription.items.data[0]?.price?.id || null;
        const subTier = getTierFromPriceId(subPriceId);
        
        // Priority: pro > content_vault > free
        if (subTier === 'pro') {
          subscriptionTier = 'pro';
          priceId = subPriceId;
          
          // Get subscription end date
          let periodEnd = subscription.current_period_end;
          if (!periodEnd && subscription.items?.data?.[0]?.current_period_end) {
            periodEnd = subscription.items.data[0].current_period_end;
          }
          if (periodEnd && typeof periodEnd === 'number') {
            subscriptionEnd = new Date(periodEnd * 1000).toISOString();
          }
          break; // Pro is highest tier
        } else if (subTier === 'content_vault' && subscriptionTier === 'free') {
          subscriptionTier = 'content_vault';
          priceId = subPriceId;
          
          let periodEnd = subscription.current_period_end;
          if (!periodEnd && subscription.items?.data?.[0]?.current_period_end) {
            periodEnd = subscription.items.data[0].current_period_end;
          }
          if (periodEnd && typeof periodEnd === 'number') {
            subscriptionEnd = new Date(periodEnd * 1000).toISOString();
          }
        }
      }
      
      logStep("Active subscription found", { 
        subscriptionTier,
        priceId,
        endDate: subscriptionEnd 
      });
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
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

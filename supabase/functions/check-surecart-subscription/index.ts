import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SURECART-SUBSCRIPTION] ${step}${detailsStr}`);
};

const SURECART_API_BASE = "https://api.surecart.com/v1";

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

    const surecartApiKey = Deno.env.get("SURECART_API_KEY");
    if (!surecartApiKey) throw new Error("SURECART_API_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      logStep("No authorization header - returning unsubscribed");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.split(/\s+/)[1]?.trim();
    if (!token) {
      logStep("Could not extract token from header");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      logStep("Claims error - returning unsubscribed", { error: claimsError?.message });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userId = claimsData.claims.sub as string;
    const email = claimsData.claims.email as string;
    if (!userId || !email) {
      logStep("Missing user ID or email in claims");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    logStep("User authenticated", { userId, email });

    // Check if user has admin or manager role
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
        subscription_end: null,
        source: "role"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check cached subscription status in profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('surecart_customer_id, surecart_subscription_id, surecart_subscription_status')
      .eq('user_id', userId)
      .single();

    // If we have a cached active status, use it (with optional fresh check)
    if (profile?.surecart_subscription_status === 'active' && profile?.surecart_subscription_id) {
      logStep("Found cached active subscription", { 
        subscriptionId: profile.surecart_subscription_id 
      });
      
      // Optionally verify with SureCart API (can be disabled for performance)
      const verifyWithApi = false; // Set to true to always verify
      
      if (!verifyWithApi) {
        return new Response(JSON.stringify({
          subscribed: true,
          subscription_end: null,
          source: "cache"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Check with SureCart API
    const headers = {
      "Authorization": `Bearer ${surecartApiKey}`,
      "Content-Type": "application/json",
    };

    // Find customer by email
    let customerId = profile?.surecart_customer_id;
    
    if (!customerId) {
      const searchResponse = await fetch(
        `${SURECART_API_BASE}/customers?email=${encodeURIComponent(email)}`,
        { headers }
      );
      
      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.data && searchResult.data.length > 0) {
          customerId = searchResult.data[0].id;
          logStep("Found customer by email", { customerId });
          
          // Cache customer ID
          await supabaseClient
            .from('profiles')
            .update({ surecart_customer_id: customerId })
            .eq('user_id', userId);
        }
      }
    }

    if (!customerId) {
      logStep("No SureCart customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check for active subscriptions
    const subsResponse = await fetch(
      `${SURECART_API_BASE}/subscriptions?customer=${customerId}&status=active`,
      { headers }
    );

    if (!subsResponse.ok) {
      logStep("Failed to fetch subscriptions");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subsResult = await subsResponse.json();
    const hasActiveSub = subsResult.data && subsResult.data.length > 0;
    let subscriptionEnd: string | null = null;
    let subscriptionId: string | null = null;

    if (hasActiveSub) {
      const subscription = subsResult.data[0];
      subscriptionId = subscription.id;
      
      // Get subscription end date if available
      if (subscription.current_period_end) {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      }
      
      logStep("Active subscription found", { subscriptionId, subscriptionEnd });

      // Update cache
      await supabaseClient
        .from('profiles')
        .update({
          surecart_subscription_id: subscriptionId,
          surecart_subscription_status: 'active'
        })
        .eq('user_id', userId);
    } else {
      logStep("No active subscription found");
      
      // Clear cache if subscription is no longer active
      if (profile?.surecart_subscription_status === 'active') {
        await supabaseClient
          .from('profiles')
          .update({
            surecart_subscription_status: 'inactive'
          })
          .eq('user_id', userId);
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
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

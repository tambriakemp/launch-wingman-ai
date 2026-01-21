import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SURECART-PORTAL] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Authentication failed");

    const userId = claimsData.claims.sub as string;
    const email = claimsData.claims.email as string;
    if (!email) throw new Error("User email not available");
    logStep("User authenticated", { userId, email });

    const headers = {
      "Authorization": `Bearer ${surecartApiKey}`,
      "Content-Type": "application/json",
    };

    // Get customer ID from profile or find by email
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('surecart_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = profile?.surecart_customer_id;

    if (!customerId) {
      // Find customer by email
      const searchResponse = await fetch(
        `${SURECART_API_BASE}/customers?email=${encodeURIComponent(email)}`,
        { headers }
      );
      
      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.data && searchResult.data.length > 0) {
          customerId = searchResult.data[0].id;
          
          // Cache customer ID
          await supabaseClient
            .from('profiles')
            .update({ surecart_customer_id: customerId })
            .eq('user_id', userId);
        }
      }
    }

    if (!customerId) {
      throw new Error("No SureCart customer found for this user");
    }
    logStep("Found customer", { customerId });

    // Create portal session
    const origin = req.headers.get("origin") || "https://launch-wingman-ai.lovable.app";
    
    const portalResponse = await fetch(`${SURECART_API_BASE}/customers/${customerId}/portal_session`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        return_url: `${origin}/settings`,
      }),
    });

    if (!portalResponse.ok) {
      const errorText = await portalResponse.text();
      throw new Error(`Failed to create portal session: ${errorText}`);
    }

    const portalSession = await portalResponse.json();
    logStep("Portal session created", { url: portalSession.url });

    return new Response(JSON.stringify({ url: portalSession.url }), {
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

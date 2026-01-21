import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SURECART-CHECKOUT] ${step}${detailsStr}`);
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Authentication failed");

    const userId = claimsData.claims.sub as string;
    const email = claimsData.claims.email as string;
    if (!email) throw new Error("User email not available");
    logStep("User authenticated", { userId, email });

    // Parse request body for optional coupon
    let couponCode: string | undefined;
    try {
      const body = await req.json();
      couponCode = body?.coupon_code;
    } catch {
      // No body or invalid JSON
    }

    const headers = {
      "Authorization": `Bearer ${surecartApiKey}`,
      "Content-Type": "application/json",
    };

    // Get price_id from payment_config
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
    logStep("Got price ID from config", { priceId });

    // Check for existing SureCart customer
    let customerId: string | undefined;
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('surecart_customer_id')
      .eq('user_id', userId)
      .single();

    if (profile?.surecart_customer_id) {
      customerId = profile.surecart_customer_id;
      logStep("Found existing customer", { customerId });
    } else {
      // Try to find customer by email in SureCart
      const searchResponse = await fetch(
        `${SURECART_API_BASE}/customers?email=${encodeURIComponent(email)}`,
        { headers }
      );
      
      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.data && searchResult.data.length > 0) {
          customerId = searchResult.data[0].id;
          logStep("Found customer by email", { customerId });
          
          // Update profile with customer ID
          await supabaseClient
            .from('profiles')
            .update({ surecart_customer_id: customerId })
            .eq('user_id', userId);
        }
      }
    }

    // Build checkout request
    const origin = req.headers.get("origin") || "https://launch-wingman-ai.lovable.app";
    
    const checkoutPayload: Record<string, unknown> = {
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${origin}/projects?checkout=success`,
      cancel_url: `${origin}/settings?canceled=true`,
      metadata: {
        user_id: userId,
      },
    };

    // Add customer or email
    if (customerId) {
      checkoutPayload.customer = customerId;
    } else {
      checkoutPayload.customer_email = email;
    }

    // Add coupon if provided
    if (couponCode) {
      checkoutPayload.discount = { coupon: couponCode };
      logStep("Applying coupon", { couponCode });
    }

    logStep("Creating checkout session...", { hasCustomer: !!customerId });

    const checkoutResponse = await fetch(`${SURECART_API_BASE}/checkouts`, {
      method: "POST",
      headers,
      body: JSON.stringify(checkoutPayload),
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      throw new Error(`Failed to create checkout: ${errorText}`);
    }

    const checkout = await checkoutResponse.json();
    logStep("Checkout created", { checkoutId: checkout.id, url: checkout.url });

    return new Response(JSON.stringify({ url: checkout.url }), {
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

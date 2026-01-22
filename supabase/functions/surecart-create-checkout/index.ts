import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SURECART-CREATE-CHECKOUT] ${step}${detailsStr}`);
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
    logStep("Creating checkout session");

    const { email, firstName, lastName, couponCode, isUpgrade } = await req.json();

    // Validate required fields
    if (!email) {
      throw new Error("Email is required");
    }

    logStep("Request data", { email, firstName, lastName, isUpgrade, hasCoupon: !!couponCode });

    // Get SureCart API key
    const SURECART_API_KEY = Deno.env.get("SURECART_API_KEY");
    if (!SURECART_API_KEY) {
      throw new Error("SureCart API key not configured");
    }

    // Get price ID from payment_config
    const { data: paymentConfig, error: configError } = await supabaseClient
      .from('payment_config')
      .select('value')
      .eq('provider', 'surecart')
      .eq('key', 'price_id')
      .single();

    if (configError || !paymentConfig?.value) {
      logStep("Payment config error", { error: configError?.message });
      throw new Error("Price configuration not found");
    }

    const priceId = paymentConfig.value;
    logStep("Price ID retrieved", { priceId });

    // For new users, check if email already exists
    if (!isUpgrade) {
      const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        logStep("Email already exists", { email });
        throw new Error("An account with this email already exists. Please sign in first to upgrade.");
      }
    }

    // Check for existing SureCart customer by email
    let customerId: string | null = null;
    
    const customerSearchRes = await fetch(
      `https://api.surecart.com/v1/customers?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${SURECART_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (customerSearchRes.ok) {
      const customerSearchData = await customerSearchRes.json();
      if (customerSearchData.data && customerSearchData.data.length > 0) {
        customerId = customerSearchData.data[0].id;
        logStep("Found existing customer", { customerId });
      }
    }

    // Get app URL for redirects
    const appUrl = Deno.env.get("APP_URL") || "https://launch-wingman-ai.lovable.app";
    
    // Build checkout payload
    const checkoutPayload: Record<string, unknown> = {
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app?checkout=success`,
      cancel_url: `${appUrl}/checkout${isUpgrade ? '?upgrade=true' : ''}`,
      metadata: {
        first_name: firstName || '',
        last_name: lastName || '',
        source: 'launchely_checkout',
        is_new_user: !isUpgrade,
      },
    };

    // Attach customer or email
    if (customerId) {
      checkoutPayload.customer = customerId;
    } else {
      checkoutPayload.customer_email = email;
      checkoutPayload.customer_first_name = firstName || undefined;
      checkoutPayload.customer_last_name = lastName || undefined;
    }

    // Add coupon if provided
    if (couponCode) {
      checkoutPayload.coupon = couponCode;
    }

    logStep("Creating SureCart checkout", { payload: checkoutPayload });

    // Create checkout session with SureCart
    const checkoutRes = await fetch("https://api.surecart.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SURECART_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutPayload),
    });

    const checkoutData = await checkoutRes.json();

    if (!checkoutRes.ok) {
      logStep("SureCart checkout error", { status: checkoutRes.status, data: checkoutData });
      throw new Error(checkoutData.message || "Failed to create checkout session");
    }

    // Extract checkout URL
    const checkoutUrl = checkoutData.url || checkoutData.checkout_url;
    
    if (!checkoutUrl) {
      logStep("No checkout URL in response", { data: checkoutData });
      throw new Error("Checkout URL not returned from SureCart");
    }

    logStep("Checkout created successfully", { checkoutUrl });

    return new Response(JSON.stringify({ 
      success: true,
      checkout_url: checkoutUrl,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

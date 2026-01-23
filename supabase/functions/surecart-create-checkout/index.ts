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

// Retry helper with exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Don't retry on client errors (4xx), only server errors (5xx) or network issues
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // Server error - worth retrying
      logStep(`Attempt ${attempt} failed with status ${response.status}`, { url });
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      // Network error - worth retrying
      logStep(`Attempt ${attempt} network error`, { url, error: String(error) });
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    
    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      logStep(`Waiting ${delay}ms before retry ${attempt + 1}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}

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
    
    const customerSearchRes = await fetchWithRetry(
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

    // Get app URL for redirects - default to launchely.com
    const appUrl = Deno.env.get("APP_URL") || "https://launchely.com";
    logStep("Using app URL", { appUrl });

    // Get processor/store ID from payment_config
    const { data: storeConfig } = await supabaseClient
      .from('payment_config')
      .select('value')
      .eq('provider', 'surecart')
      .eq('key', 'store_id')
      .single();

    const processorId = storeConfig?.value;
    logStep("Processor ID", { processorId });
    
    // STEP 1: Create draft checkout WITHOUT line items
    logStep("Step 1: Creating draft checkout (no line items)");
    
    const checkoutPayload: Record<string, unknown> = {
      live_mode: true,
      currency: "usd",
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
      checkoutPayload.email = email;
      checkoutPayload.first_name = firstName || undefined;
      checkoutPayload.last_name = lastName || undefined;
    }

    // Add processor if available
    if (processorId) {
      checkoutPayload.processor_id = processorId;
    }

    // Add discount/coupon if provided
    if (couponCode) {
      checkoutPayload.discount = couponCode;
    }

    logStep("Draft checkout payload", { payload: checkoutPayload });

    // Create draft checkout with retry
    const draftRes = await fetchWithRetry(
      "https://api.surecart.com/v1/checkouts",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SURECART_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutPayload),
      }
    );

    const draftData = await draftRes.json();
    logStep("Draft checkout response", { status: draftRes.status, id: draftData.id });

    if (!draftRes.ok) {
      logStep("Draft checkout error", { status: draftRes.status, data: draftData });
      throw new Error(draftData.message || draftData.error || "Failed to create draft checkout");
    }

    const checkoutId = draftData.id;
    logStep("Draft checkout created", { checkoutId, status: draftData.status });

    // STEP 2: Add line item using 'price' field (not 'price_id')
    logStep("Step 2: Adding line item via line_items create", { checkoutId, priceId });

    const lineItemPayload = {
      line_item: {
        checkout: checkoutId,
        price: priceId,  // SureCart uses 'price' not 'price_id'
        quantity: 1,
      },
    };

    logStep("Line item payload", { payload: lineItemPayload });

    const lineItemRes = await fetchWithRetry(
      "https://api.surecart.com/v1/line_items",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SURECART_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lineItemPayload),
      }
    );

    const lineItemData = await lineItemRes.json();
    logStep("Line item create response", { status: lineItemRes.status, id: lineItemData.id });

    if (!lineItemRes.ok) {
      logStep("Line item create error", { status: lineItemRes.status, data: lineItemData });
      throw new Error(lineItemData.message || lineItemData.error || "Failed to add line item to checkout");
    }

    logStep("Line item added", { lineItemId: lineItemData.id });

    // STEP 3: Finalize checkout to get the hosted URL
    logStep("Step 3: Finalizing checkout with return URL");

    const finalizeRes = await fetchWithRetry(
      `https://api.surecart.com/v1/checkouts/${checkoutId}/finalize`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${SURECART_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          return_url: `${appUrl}/checkout/success?checkout_id=${checkoutId}`,
          checkout_type: "hosted",
        }),
      }
    );

    const finalizeData = await finalizeRes.json();
    logStep("Finalize response", { 
      status: finalizeRes.status, 
      total: finalizeData.total_amount,
      paymentRequired: finalizeData.payment_method_required,
      hosted_checkout_url: finalizeData.hosted_checkout_url,
      url: finalizeData.url,
      portal_url: finalizeData.portal_url,
    });

    if (!finalizeRes.ok) {
      logStep("Finalize error", { status: finalizeRes.status, data: finalizeData });
      throw new Error(finalizeData.message || finalizeData.error || "Failed to finalize checkout");
    }

    // URL Selection Priority:
    // 1. hosted_checkout_url (preferred - direct hosted checkout)
    // 2. url / checkout_url (alternative direct URL)
    // 3. portal_url (SureCart's redirect URL - only if on surecart.com domain)
    // 4. Constructed fallback using checkout.surecart.com format
    
    let checkoutUrl = finalizeData.hosted_checkout_url || 
                      finalizeData.url || 
                      finalizeData.checkout_url;
    let urlSource = "direct";

    // Use portal_url if it's on a SureCart domain
    if (!checkoutUrl && finalizeData.portal_url) {
      const portalUrl = finalizeData.portal_url;
      if (portalUrl.includes('surecart.com')) {
        checkoutUrl = portalUrl;
        urlSource = "portal_url";
        logStep("Using portal_url (SureCart domain)", { checkoutUrl });
      } else {
        logStep("Skipping portal_url (non-SureCart domain)", { portalUrl });
      }
    }

    // Fallback: Construct checkout URL using SureCart's hosted checkout format
    if (!checkoutUrl && checkoutId) {
      checkoutUrl = `https://checkout.surecart.com/checkout/${checkoutId}`;
      urlSource = "constructed_fallback";
      logStep("Using constructed checkout URL", { checkoutUrl });
    }
    
    if (!checkoutUrl) {
      logStep("No checkout URL found", { finalizeData });
      throw new Error("Checkout URL not available from SureCart");
    }

    logStep("Checkout ready", { 
      checkoutUrl,
      urlSource,
      total: finalizeData.total_amount,
      paymentRequired: finalizeData.payment_method_required,
    });

    return new Response(JSON.stringify({ 
      success: true,
      checkout_url: checkoutUrl,
      checkout_id: checkoutId,
      url_source: urlSource,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logStep("ERROR", { message: errorMessage, stack: errorStack });
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      retryable: errorMessage.includes("network") || errorMessage.includes("timeout"),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

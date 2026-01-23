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
    logStep("Creating checkout session (WordPress-hosted)");

    const { email, firstName, lastName, couponCode, isUpgrade } = await req.json();

    // Validate required fields
    if (!email) {
      throw new Error("Email is required");
    }

    logStep("Request data", { email, firstName, lastName, isUpgrade, hasCoupon: !!couponCode });

    // Get payment config: buy_link_slug, test_buy_link_slug, checkout_base_url, test_mode
    const { data: paymentConfigs, error: configError } = await supabaseClient
      .from('payment_config')
      .select('key, value')
      .eq('provider', 'surecart')
      .in('key', ['buy_link_slug', 'test_buy_link_slug', 'checkout_base_url', 'test_mode']);

    if (configError) {
      logStep("Payment config error", { error: configError.message });
      throw new Error("Failed to fetch payment configuration");
    }

    // Parse config into key-value object
    const config: Record<string, string> = {};
    paymentConfigs?.forEach(item => {
      config[item.key] = item.value;
    });

    // Determine if we're in test mode
    const isTestMode = config.test_mode === 'true';
    
    // Select appropriate buy link slug based on mode
    const buyLinkSlug = isTestMode 
      ? (config.test_buy_link_slug || config.buy_link_slug)
      : config.buy_link_slug;
    const checkoutBaseUrl = config.checkout_base_url || 'https://store.launchely.com';

    if (!buyLinkSlug) {
      throw new Error("Buy link slug not configured");
    }

    logStep("Config retrieved", { buyLinkSlug, checkoutBaseUrl, isTestMode });

    // For new users, check if email already exists
    if (!isUpgrade) {
      const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        logStep("Email already exists", { email });
        throw new Error("An account with this email already exists. Please sign in first to upgrade.");
      }
    }

    // Construct SureCart buy link URL (minimal checkout page)
    // Format: https://store.launchely.com/buy/product-slug/?email=xxx&first_name=xxx
    const checkoutUrl = new URL(`${checkoutBaseUrl}/buy/${buyLinkSlug}/`);

    // Pre-fill customer info
    if (email) {
      checkoutUrl.searchParams.set('email', email);
    }
    if (firstName) {
      checkoutUrl.searchParams.set('first_name', firstName);
    }
    if (lastName) {
      checkoutUrl.searchParams.set('last_name', lastName);
    }

    // Apply coupon if provided
    if (couponCode) {
      checkoutUrl.searchParams.set('coupon', couponCode);
    }

    // Add success and cancel URLs for redirect after payment
    const appUrl = Deno.env.get("APP_URL") || "https://launchely.com";
    checkoutUrl.searchParams.set('success_url', `${appUrl}/checkout/success`);
    checkoutUrl.searchParams.set('cancel_url', `${appUrl}/checkout?canceled=true`);

    const finalUrl = checkoutUrl.toString();
    logStep("Buy link URL constructed", { 
      url: finalUrl,
      buyLinkSlug,
      email,
      hasCoupon: !!couponCode 
    });

    return new Response(JSON.stringify({ 
      success: true,
      checkout_url: finalUrl,
      url_source: "wordpress_hosted",
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
      retryable: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SURECART-ADMIN-SETUP] ${step}${detailsStr}`);
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

    const userId = claimsData.claims.sub as string;
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .limit(1);

    if (!roleData || roleData.length === 0) {
      throw new Error("Admin access required");
    }
    logStep("Admin verified", { userId });

    // Parse request body for action
    const body = await req.json().catch(() => ({}));
    const action = body.action || "setup";

    const headers = {
      "Authorization": `Bearer ${surecartApiKey}`,
      "Content-Type": "application/json",
    };

    if (action === "setup") {
      // Check if already configured
      const { data: existingConfig } = await supabaseClient
        .from('payment_config')
        .select('*')
        .eq('provider', 'surecart');

      if (existingConfig && existingConfig.length > 0) {
        logStep("SureCart already configured", { configCount: existingConfig.length });
        return new Response(JSON.stringify({
          success: true,
          message: "SureCart is already configured",
          config: existingConfig.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {})
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Step 1: Create the product
      logStep("Creating product...");
      const productResponse = await fetch(`${SURECART_API_BASE}/products`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "Launchely Pro",
          description: "Unlimited projects, full platform access, AI-powered content creation tools",
          recurring: true,
        }),
      });

      if (!productResponse.ok) {
        const errorText = await productResponse.text();
        throw new Error(`Failed to create product: ${errorText}`);
      }

      const product = await productResponse.json();
      logStep("Product created", { productId: product.id });

      // Step 2: Create the price separately
      logStep("Creating price...");
      const priceResponse = await fetch(`${SURECART_API_BASE}/prices`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          product_id: product.id,
          amount: 2500, // $25.00 in cents
          currency: "usd",
          recurring_interval: "month",
          recurring_interval_count: 1,
        }),
      });

      if (!priceResponse.ok) {
        const errorText = await priceResponse.text();
        throw new Error(`Failed to create price: ${errorText}`);
      }

      const price = await priceResponse.json();
      const priceId = price.id;
      logStep("Price created", { priceId });

      // Step 3: Register webhook endpoint
      logStep("Registering webhook...");
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/surecart-webhook`;
      const webhookResponse = await fetch(`${SURECART_API_BASE}/webhook_endpoints`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: webhookUrl,
          events: [
            "checkout.completed",
            "subscription.created",
            "subscription.activated",
            "subscription.canceled",
            "subscription.updated",
            "payment.succeeded",
            "payment.failed",
          ],
        }),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        logStep("Webhook registration failed (may already exist)", { error: errorText });
        // Don't throw - webhook might already exist
      } else {
        const webhook = await webhookResponse.json();
        logStep("Webhook registered", { webhookId: webhook.id });
      }

      // Step 4: Store configuration in database
      const configItems = [
        { provider: 'surecart', key: 'product_id', value: product.id },
        { provider: 'surecart', key: 'price_id', value: priceId },
        { provider: 'surecart', key: 'product_name', value: product.name },
      ];

      for (const item of configItems) {
        await supabaseClient.from('payment_config').upsert(item, {
          onConflict: 'provider,key'
        });
      }
      logStep("Configuration saved to database");

      return new Response(JSON.stringify({
        success: true,
        message: "SureCart setup completed successfully",
        config: {
          product_id: product.id,
          price_id: priceId,
          product_name: product.name,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === "list-products") {
      // List existing products
      const response = await fetch(`${SURECART_API_BASE}/products`, { headers });
      if (!response.ok) throw new Error("Failed to list products");
      const products = await response.json();
      
      return new Response(JSON.stringify({ products }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === "list-prices") {
      // List existing prices
      const response = await fetch(`${SURECART_API_BASE}/prices`, { headers });
      if (!response.ok) throw new Error("Failed to list prices");
      const prices = await response.json();
      
      return new Response(JSON.stringify({ prices }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === "get-config") {
      // Get current configuration
      const { data: config } = await supabaseClient
        .from('payment_config')
        .select('*')
        .eq('provider', 'surecart');
      
      return new Response(JSON.stringify({
        config: config?.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {}) || {}
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === "configure") {
      // Manually configure existing product/price IDs
      const { product_id, price_id, product_name, store_id } = body;
      
      if (!product_id || !price_id) {
        throw new Error("Both product_id and price_id are required");
      }

      const configItems = [
        { provider: 'surecart', key: 'product_id', value: product_id },
        { provider: 'surecart', key: 'price_id', value: price_id },
        { provider: 'surecart', key: 'product_name', value: product_name || 'Launchely Pro' },
      ];

      // Only add store_id if provided
      if (store_id) {
        configItems.push({ provider: 'surecart', key: 'store_id', value: store_id });
      }

      for (const item of configItems) {
        await supabaseClient.from('payment_config').upsert(item, {
          onConflict: 'provider,key'
        });
      }
      logStep("Manual configuration saved", { product_id, price_id, store_id: store_id || 'not set' });

      return new Response(JSON.stringify({
        success: true,
        message: "SureCart configuration saved successfully",
        config: { product_id, price_id, product_name: product_name || 'Launchely Pro', store_id: store_id || null }
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

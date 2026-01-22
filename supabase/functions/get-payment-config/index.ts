import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch public payment config
    const { data: configs, error } = await supabaseClient
      .from('payment_config')
      .select('key, value')
      .eq('provider', 'surecart')
      .in('key', ['store_id', 'product_name', 'price_id']);

    if (error) throw error;

    const config: Record<string, string> = {};
    configs?.forEach(c => { config[c.key] = c.value; });

    if (!config.store_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Store ID not configured', 
          configured: false 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Validate that this is not a Stripe Account ID
    if (config.store_id.startsWith('acct_')) {
      console.warn('[GET-PAYMENT-CONFIG] Invalid processor ID - Stripe account ID detected:', config.store_id);
      return new Response(
        JSON.stringify({ 
          error: `Invalid Processor ID. "${config.store_id}" is a Stripe Account ID, not a SureCart Processor ID. Please update in Admin → Config using "Fetch from SureCart" button.`, 
          configured: false 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({
        configured: true,
        store_id: config.store_id,
        product_name: config.product_name || 'Pro Plan',
        price_id: config.price_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[GET-PAYMENT-CONFIG] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, configured: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

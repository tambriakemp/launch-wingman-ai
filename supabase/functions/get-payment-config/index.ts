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

    // Fetch Stripe payment config
    const { data: configs, error } = await supabaseClient
      .from('payment_config')
      .select('key, value')
      .eq('provider', 'stripe')
      .in('key', ['price_id', 'product_name']);

    if (error) throw error;

    const config: Record<string, string> = {};
    configs?.forEach(c => { config[c.key] = c.value; });

    if (!config.price_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Stripe price_id not configured', 
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
        price_id: config.price_id,
        product_name: config.product_name || 'Launchely Pro',
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

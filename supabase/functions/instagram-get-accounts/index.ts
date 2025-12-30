import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("User verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Getting Instagram accounts for user ${user.id.substring(0, 8)}...`);

    // Get Instagram connection from database
    const { data: connection, error: connError } = await supabase
      .from("social_connections")
      .select("account_id, account_name, page_id, token_expires_at")
      .eq("user_id", user.id)
      .eq("platform", "instagram")
      .single();

    if (connError || !connection) {
      console.log("No Instagram connection found");
      return new Response(
        JSON.stringify({ accounts: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired
    let isExpired = false;
    if (connection.token_expires_at) {
      const expiresAt = new Date(connection.token_expires_at);
      isExpired = expiresAt < new Date();
    }

    const account = {
      id: connection.account_id,
      username: connection.account_name,
      page_id: connection.page_id,
      is_expired: isExpired,
    };

    console.log(`Found Instagram account: ${connection.account_name}`);

    return new Response(
      JSON.stringify({ accounts: [account] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Get Instagram accounts error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

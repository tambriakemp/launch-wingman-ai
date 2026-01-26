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
    const FACEBOOK_APP_ID = Deno.env.get("FACEBOOK_APP_ID");
    const FACEBOOK_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error("Missing Facebook credentials");
      return new Response(
        JSON.stringify({ error: "Facebook credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the authorization header
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

    console.log(`Refreshing Instagram token for user ${user.id.substring(0, 8)}...`);

    // Get existing Instagram connection using RPC function (bypasses auth.uid() issue with service role)
    const { data: connections, error: connError } = await supabase
      .rpc("get_social_connections_for_user", { p_user_id: user.id });

    if (connError) {
      console.error("Error fetching connections:", connError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch social connections" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const connection = connections?.find((c: any) => c.platform === "instagram");

    if (!connection) {
      console.error("No Instagram connection found for user");
      return new Response(
        JSON.stringify({ error: "No Instagram connection found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is already expired
    if (connection.token_expires_at) {
      const expiresAt = new Date(connection.token_expires_at);
      if (expiresAt < new Date()) {
        console.log("Token is already expired, cannot refresh");
        return new Response(
          JSON.stringify({ 
            error: "Token expired", 
            needs_reconnect: true,
            message: "Your Instagram connection has expired. Please reconnect your account."
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const currentAccessToken = connection.access_token;

    // Exchange for new long-lived token
    // Facebook allows refreshing long-lived tokens that haven't expired yet
    console.log("Exchanging for new long-lived token...");
    const refreshResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${FACEBOOK_APP_ID}` +
      `&client_secret=${FACEBOOK_APP_SECRET}` +
      `&fb_exchange_token=${currentAccessToken}`
    );

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error("Token refresh failed:", errorText);
      
      // Parse the error to check if it's an expired token error
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.code === 190) {
          return new Response(
            JSON.stringify({ 
              error: "Token expired", 
              needs_reconnect: true,
              message: "Your Instagram connection has expired. Please reconnect your account."
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to refresh token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData.access_token;
    const expiresIn = refreshData.expires_in || 5184000; // Default 60 days

    console.log("Got new long-lived token, expires in:", expiresIn, "seconds");

    // We need to get the page access token from the new user token
    // First get the page to refresh its token as well
    const pageResponse = await fetch(
      `https://graph.facebook.com/v21.0/${connection.page_id}?fields=access_token&access_token=${newAccessToken}`
    );

    let pageAccessToken = newAccessToken;
    if (pageResponse.ok) {
      const pageData = await pageResponse.json();
      if (pageData.access_token) {
        pageAccessToken = pageData.access_token;
        console.log("Got refreshed page access token");
      }
    } else {
      console.warn("Failed to get page access token, using user token");
    }

    // Encrypt the new token
    const { data: encryptedToken, error: encryptError } = await supabase.rpc(
      "encrypt_token",
      { plain_token: pageAccessToken }
    );

    if (encryptError) {
      console.error("Token encryption failed:", encryptError);
      return new Response(
        JSON.stringify({ error: "Failed to encrypt token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate new expiry
    const newExpiresAt = new Date();
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + expiresIn);

    // Update the connection
    const { error: updateError } = await supabase
      .from("social_connections")
      .update({
        access_token: encryptedToken,
        token_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    if (updateError) {
      console.error("Failed to update connection:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to save refreshed token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Instagram token refreshed successfully for user ${user.id.substring(0, 8)}...`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        expires_at: newExpiresAt.toISOString(),
        message: "Token refreshed successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Instagram refresh token error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FACEBOOK_APP_ID) {
      console.error("Missing FACEBOOK_APP_ID");
      return new Response(
        JSON.stringify({ error: "Facebook App ID not configured" }),
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

    // Get optional redirect URL
    let redirectUrl = "/settings";
    try {
      const body = await req.json();
      if (body.redirect_url) {
        redirectUrl = body.redirect_url;
      }
    } catch (e) {
      // No body or invalid JSON - use default redirect
    }

    // Build the callback URL
    const callbackUrl = `${SUPABASE_URL}/functions/v1/threads-auth-callback`;

    // Build state object with user ID and redirect URL
    const state = btoa(JSON.stringify({
      user_id: user.id,
      redirect_url: redirectUrl,
    }));

    // Threads API scopes
    const scopes = [
      "threads_basic",
      "threads_content_publish",
      "threads_manage_insights",
      "threads_manage_replies",
    ].join(",");

    // Build Threads OAuth URL
    const authUrl = new URL("https://threads.net/oauth/authorize");
    authUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", state);

    console.log(`Threads auth started for user ${user.id.substring(0, 8)}... with scopes: ${scopes}`);

    return new Response(
      JSON.stringify({ url: authUrl.toString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Threads auth start error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

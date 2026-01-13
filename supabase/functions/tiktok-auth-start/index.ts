import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a random code verifier for PKCE
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Generate code challenge from verifier (S256)
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    
    // Use the anon key to create a client that can verify the user token
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseAnonKey) {
      console.error("Missing SUPABASE_ANON_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Create a client with the user's token to verify their identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Use admin client for database operations
    const supabase = supabaseAdmin;

    // Parse request body for redirect URL and environment
    let redirectUrl = "";
    let environment = "production";
    try {
      const body = await req.json();
      redirectUrl = body.redirect_url || "";
      environment = body.environment || "production";
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Get client key based on environment
    const clientKey = environment === "sandbox" 
      ? Deno.env.get("TIKTOK_SANDBOX_CLIENT_KEY")
      : Deno.env.get("TIKTOK_CLIENT_KEY");

    if (!clientKey) {
      console.error(`Missing TIKTOK_${environment === "sandbox" ? "SANDBOX_" : ""}CLIENT_KEY`);
      return new Response(
        JSON.stringify({ error: `TikTok ${environment} client key not configured` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate PKCE values
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code verifier in database with environment info
    const { error: storeError } = await supabase
      .from("oauth_state")
      .insert({
        user_id: user.id,
        provider: environment === "sandbox" ? "tiktok_sandbox" : "tiktok",
        code_verifier: codeVerifier,
      });

    if (storeError) {
      console.error("Error storing code verifier:", storeError);
      return new Response(
        JSON.stringify({ error: "Failed to initialize OAuth flow" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build state parameter (include environment)
    const state = btoa(JSON.stringify({
      user_id: user.id,
      redirect_url: redirectUrl,
      environment: environment,
    }));

    // Get the callback URL - using Supabase function URL
    const callbackUrl = `${supabaseUrl}/functions/v1/tiktok-auth-callback`;

    // Build TikTok OAuth URL - both sandbox and production use the same domain
    // The sandbox distinction is determined by the client_key used (sandbox vs production app)
    const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
    authUrl.searchParams.set("client_key", clientKey);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "user.info.basic,video.publish");
    authUrl.searchParams.set("redirect_uri", callbackUrl);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    console.log("Generated TikTok auth URL for user:", user.id);

    return new Response(
      JSON.stringify({ url: authUrl.toString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in tiktok-auth-start:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

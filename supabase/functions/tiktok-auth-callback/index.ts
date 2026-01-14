import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Default redirect for errors
    const defaultRedirect = `${supabaseUrl?.replace('.supabase.co', '.lovable.app')}/settings`;

    if (error) {
      console.error("OAuth error from TikTok:", error, errorDescription);
      return Response.redirect(`${defaultRedirect}?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
      console.error("Missing code or state parameter");
      return Response.redirect(`${defaultRedirect}?error=missing_parameters`);
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return Response.redirect(`${defaultRedirect}?error=server_configuration_error`);
    }

    // Decode state
    let userId: string;
    let redirectUrl: string;
    let environment: string;
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.user_id;
      // Ensure redirectUrl is always a full URL (not a relative path)
      const rawRedirectUrl = stateData.redirect_url || defaultRedirect;
      if (rawRedirectUrl.startsWith('/')) {
        const baseUrl = supabaseUrl?.replace('.supabase.co', '.lovable.app');
        redirectUrl = `${baseUrl}${rawRedirectUrl}`;
      } else {
        redirectUrl = rawRedirectUrl;
      }
      environment = stateData.environment || "production";
    } catch (e) {
      console.error("Failed to decode state:", e);
      return Response.redirect(`${defaultRedirect}?error=invalid_state`);
    }

    // Get credentials based on environment
    const clientKey = environment === "sandbox" 
      ? Deno.env.get("TIKTOK_SANDBOX_CLIENT_KEY")
      : Deno.env.get("TIKTOK_CLIENT_KEY");
    const clientSecret = environment === "sandbox"
      ? Deno.env.get("TIKTOK_SANDBOX_CLIENT_SECRET")
      : Deno.env.get("TIKTOK_CLIENT_SECRET");

    if (!clientKey || !clientSecret) {
      console.error(`Missing TikTok ${environment} credentials`);
      return Response.redirect(`${defaultRedirect}?error=missing_credentials`);
    }

    const providerName = environment === "sandbox" ? "tiktok_sandbox" : "tiktok";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve code verifier from database
    const { data: oauthStateData, error: stateError } = await supabase
      .from("oauth_state")
      .select("code_verifier")
      .eq("user_id", userId)
      .eq("provider", providerName)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (stateError || !oauthStateData) {
      console.error("Failed to retrieve code verifier:", stateError);
      return Response.redirect(`${redirectUrl}?error=oauth_state_not_found`);
    }

    const codeVerifier = oauthStateData.code_verifier;

    // Clean up used state
    await supabase
      .from("oauth_state")
      .delete()
      .eq("user_id", userId)
      .eq("provider", providerName);

    // Exchange code for access token
    // Use sandbox API domain for sandbox environment
    const callbackUrl = `${supabaseUrl}/functions/v1/tiktok-auth-callback`;
    const tokenApiUrl = environment === "sandbox"
      ? "https://open.tiktokapis.com/v2/oauth/token/"  // Sandbox uses same token endpoint
      : "https://open.tiktokapis.com/v2/oauth/token/";
    
    const tokenResponse = await fetch(tokenApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: callbackUrl,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return Response.redirect(`${redirectUrl}?error=${encodeURIComponent(tokenData.error_description || "token_exchange_failed")}`);
    }

    const { access_token, refresh_token, expires_in, open_id } = tokenData;

    // Fetch user info
    let username = open_id;
    let avatarUrl: string | null = null;
    try {
      const userResponse = await fetch(
        "https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      const userData = await userResponse.json();
      console.log('[TIKTOK-AUTH-CALLBACK] User data received:', JSON.stringify(userData));
      if (userData.data?.user) {
        username = userData.data.user.display_name || userData.data.user.username || open_id;
        avatarUrl = userData.data.user.avatar_url || null;
        console.log(`[TIKTOK-AUTH-CALLBACK] Got user info: ${username}, avatar: ${avatarUrl ? 'yes' : 'no'}`);
      }
    } catch (e) {
      console.error("Failed to fetch user info:", e);
      // Continue with open_id as username
    }

    // Encrypt tokens
    const { data: encryptedAccessToken, error: encryptAccessError } = await supabase
      .rpc("encrypt_token", { plain_token: access_token });

    if (encryptAccessError) {
      console.error("Failed to encrypt access token:", encryptAccessError);
      return Response.redirect(`${redirectUrl}?error=encryption_failed`);
    }

    const { data: encryptedRefreshToken, error: encryptRefreshError } = await supabase
      .rpc("encrypt_token", { plain_token: refresh_token });

    if (encryptRefreshError) {
      console.error("Failed to encrypt refresh token:", encryptRefreshError);
      return Response.redirect(`${redirectUrl}?error=encryption_failed`);
    }

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + expires_in * 1000).toISOString();

    // Upsert social connection (use platform name based on environment)
    const platformName = environment === "sandbox" ? "tiktok_sandbox" : "tiktok";
    
    const { error: upsertError } = await supabase
      .from("social_connections")
      .upsert({
        user_id: userId,
        platform: platformName,
        account_id: open_id,
        account_name: username,
        avatar_url: avatarUrl,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: tokenExpiry,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,platform",
      });

    if (upsertError) {
      console.error("Failed to save connection:", upsertError);
      return Response.redirect(`${redirectUrl}?error=save_failed`);
    }

    console.log(`TikTok ${environment} connection saved for user:`, userId);

    return Response.redirect(`${redirectUrl}?tiktok_connected=true&environment=${environment}`);
  } catch (error) {
    console.error("Error in tiktok-auth-callback:", error);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const defaultRedirect = `${supabaseUrl?.replace('.supabase.co', '.lovable.app')}/settings`;
    return Response.redirect(`${defaultRedirect}?error=internal_error`);
  }
});

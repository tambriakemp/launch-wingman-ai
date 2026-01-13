import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    const clientKey = Deno.env.get("TIKTOK_CLIENT_KEY");
    const clientSecret = Deno.env.get("TIKTOK_CLIENT_SECRET");
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

    if (!clientKey || !clientSecret || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      return Response.redirect(`${defaultRedirect}?error=server_configuration_error`);
    }

    // Decode state
    let userId: string;
    let redirectUrl: string;
    try {
      const stateData = JSON.parse(atob(state));
      userId = stateData.user_id;
      redirectUrl = stateData.redirect_url || defaultRedirect;
    } catch (e) {
      console.error("Failed to decode state:", e);
      return Response.redirect(`${defaultRedirect}?error=invalid_state`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve code verifier from database
    const { data: stateData, error: stateError } = await supabase
      .from("oauth_state")
      .select("code_verifier")
      .eq("user_id", userId)
      .eq("provider", "tiktok")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (stateError || !stateData) {
      console.error("Failed to retrieve code verifier:", stateError);
      return Response.redirect(`${redirectUrl}?error=oauth_state_not_found`);
    }

    const codeVerifier = stateData.code_verifier;

    // Clean up used state
    await supabase
      .from("oauth_state")
      .delete()
      .eq("user_id", userId)
      .eq("provider", "tiktok");

    // Exchange code for access token
    const callbackUrl = `${supabaseUrl}/functions/v1/tiktok-auth-callback`;
    
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
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
      if (userData.data?.user) {
        username = userData.data.user.display_name || userData.data.user.username || open_id;
      }
    } catch (e) {
      console.error("Failed to fetch user info:", e);
      // Continue with open_id as username
    }

    // Encrypt tokens
    const { data: encryptedAccessToken, error: encryptAccessError } = await supabase
      .rpc("encrypt_token", { token: access_token });

    if (encryptAccessError) {
      console.error("Failed to encrypt access token:", encryptAccessError);
      return Response.redirect(`${redirectUrl}?error=encryption_failed`);
    }

    const { data: encryptedRefreshToken, error: encryptRefreshError } = await supabase
      .rpc("encrypt_token", { token: refresh_token });

    if (encryptRefreshError) {
      console.error("Failed to encrypt refresh token:", encryptRefreshError);
      return Response.redirect(`${redirectUrl}?error=encryption_failed`);
    }

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + expires_in * 1000).toISOString();

    // Upsert social connection
    const { error: upsertError } = await supabase
      .from("social_connections")
      .upsert({
        user_id: userId,
        platform: "tiktok",
        account_id: open_id,
        account_name: username,
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

    console.log("TikTok connection saved for user:", userId);

    return Response.redirect(`${redirectUrl}?tiktok_connected=true`);
  } catch (error) {
    console.error("Error in tiktok-auth-callback:", error);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const defaultRedirect = `${supabaseUrl?.replace('.supabase.co', '.lovable.app')}/settings`;
    return Response.redirect(`${defaultRedirect}?error=internal_error`);
  }
});

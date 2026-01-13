import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL = Deno.env.get("APP_URL") || "https://launchely.com";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    console.log("Threads callback received:", { 
      hasCode: !!code, 
      hasState: !!stateParam, 
      error, 
      errorDescription 
    });

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorDescription);
      return Response.redirect(`${APP_URL}/settings?threads_error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !stateParam) {
      console.error("Missing code or state");
      return Response.redirect(`${APP_URL}/settings?threads_error=missing_params`);
    }

    // Decode state
    let userId: string;
    let redirectUrl = "/settings";
    try {
      const stateData = JSON.parse(atob(stateParam));
      userId = stateData.user_id;
      redirectUrl = stateData.redirect_url || "/settings";
    } catch (e) {
      console.error("Failed to parse state:", e);
      return Response.redirect(`${APP_URL}/settings?threads_error=invalid_state`);
    }

    const FACEBOOK_APP_ID = Deno.env.get("FACEBOOK_APP_ID");
    const FACEBOOK_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error("Missing Facebook/Threads credentials");
      return Response.redirect(`${APP_URL}/settings?threads_error=config_error`);
    }

    const callbackUrl = `${SUPABASE_URL}/functions/v1/threads-auth-callback`;

    // Exchange code for short-lived access token
    console.log("Exchanging code for access token...");
    const tokenResponse = await fetch(
      `https://graph.threads.net/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          grant_type: "authorization_code",
          redirect_uri: callbackUrl,
          code: code,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return Response.redirect(`${APP_URL}/settings?threads_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const shortLivedToken = tokenData.access_token;
    const threadsUserId = tokenData.user_id;

    console.log("Got short-lived token for user:", threadsUserId);

    // Exchange for long-lived token (60 days)
    console.log("Exchanging for long-lived token...");
    const longLivedResponse = await fetch(
      `https://graph.threads.net/access_token?` +
      `grant_type=th_exchange_token` +
      `&client_secret=${FACEBOOK_APP_SECRET}` +
      `&access_token=${shortLivedToken}`
    );

    let accessToken = shortLivedToken;
    let expiresIn = 3600; // 1 hour default for short-lived

    if (longLivedResponse.ok) {
      const longLivedData = await longLivedResponse.json();
      accessToken = longLivedData.access_token;
      expiresIn = longLivedData.expires_in || 5184000; // 60 days default
      console.log("Got long-lived token, expires in:", expiresIn, "seconds");
    } else {
      console.warn("Failed to get long-lived token, using short-lived:", await longLivedResponse.text());
    }

    // Get Threads profile info
    console.log("Fetching Threads profile...");
    const profileResponse = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${accessToken}`
    );

    let username = null;
    if (profileResponse.ok) {
      const profileData = await profileResponse.json();
      username = profileData.username;
      console.log("Got Threads profile:", profileData.username);
    } else {
      console.warn("Failed to get profile:", await profileResponse.text());
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Encrypt token
    const { data: encryptedAccessToken, error: encryptError } = await supabase.rpc(
      "encrypt_token",
      { plain_token: accessToken }
    );

    if (encryptError) {
      console.error("Token encryption failed:", encryptError);
      return Response.redirect(`${APP_URL}/settings?threads_error=encryption_failed`);
    }

    // Calculate token expiry
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Upsert social connection
    const { error: upsertError } = await supabase
      .from("social_connections")
      .upsert(
        {
          user_id: userId,
          platform: "threads",
          account_id: threadsUserId,
          account_name: username,
          access_token: encryptedAccessToken,
          token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform",
        }
      );

    if (upsertError) {
      console.error("Failed to save connection:", upsertError);
      return Response.redirect(`${APP_URL}/settings?threads_error=save_failed`);
    }

    console.log(`Threads connected successfully for user ${userId.substring(0, 8)}...`);
    return Response.redirect(`${APP_URL}${redirectUrl}?threads_connected=true`);
  } catch (error) {
    console.error("Threads callback error:", error);
    return Response.redirect(`${APP_URL}/settings?threads_error=internal_error`);
  }
});

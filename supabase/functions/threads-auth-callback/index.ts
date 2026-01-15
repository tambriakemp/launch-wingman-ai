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

    const THREADS_APP_ID = Deno.env.get("THREADS_APP_ID");
    const THREADS_APP_SECRET = Deno.env.get("THREADS_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!THREADS_APP_ID || !THREADS_APP_SECRET) {
      console.error("Missing Threads credentials (THREADS_APP_ID or THREADS_APP_SECRET)");
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
          client_id: THREADS_APP_ID,
          client_secret: THREADS_APP_SECRET,
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
      `&client_secret=${THREADS_APP_SECRET}` +
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
    let username = null;
    let avatarUrl = null;
    
    try {
      const profileResponse = await fetch(
        `https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${accessToken}`
      );

      console.log("Profile response status:", profileResponse.status);
      const profileText = await profileResponse.text();
      console.log("Profile response body:", profileText);

      if (profileResponse.ok) {
        try {
          const profileData = JSON.parse(profileText);
          username = profileData.username || profileData.name || null;
          avatarUrl = profileData.threads_profile_picture_url || null;
          console.log("Got Threads profile - username:", username, "avatar:", avatarUrl);
        } catch (parseError) {
          console.warn("Failed to parse profile response:", parseError);
        }
      } else {
        console.warn("Profile fetch failed with status:", profileResponse.status, "body:", profileText);
        // Try alternative endpoint to get user info
        console.log("Trying alternative profile fetch with threadsUserId:", threadsUserId);
        const altProfileResponse = await fetch(
          `https://graph.threads.net/v1.0/${threadsUserId}?fields=id,username,name,threads_profile_picture_url&access_token=${accessToken}`
        );
        if (altProfileResponse.ok) {
          const altProfileData = await altProfileResponse.json();
          username = altProfileData.username || altProfileData.name || null;
          avatarUrl = altProfileData.threads_profile_picture_url || null;
          console.log("Got Threads profile (alt) - username:", username);
        } else {
          console.warn("Alt profile fetch also failed:", await altProfileResponse.text());
        }
      }
    } catch (profileError) {
      console.error("Error fetching profile:", profileError);
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
          avatar_url: avatarUrl,
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL = Deno.env.get("APP_URL") || "https://launchely.com";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorReason = url.searchParams.get("error_reason");

    console.log("Facebook callback received:", { 
      hasCode: !!code, 
      hasState: !!stateParam, 
      error, 
      errorReason 
    });

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorReason);
      return Response.redirect(`${APP_URL}/settings?facebook_error=${encodeURIComponent(errorReason || error)}`);
    }

    if (!code || !stateParam) {
      console.error("Missing code or state");
      return Response.redirect(`${APP_URL}/settings?facebook_error=missing_params`);
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
      return Response.redirect(`${APP_URL}/settings?facebook_error=invalid_state`);
    }

    const FACEBOOK_APP_ID = Deno.env.get("FACEBOOK_APP_ID");
    const FACEBOOK_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error("Missing Facebook credentials");
      return Response.redirect(`${APP_URL}/settings?facebook_error=config_error`);
    }

    const callbackUrl = `${SUPABASE_URL}/functions/v1/facebook-auth-callback`;

    // Exchange code for access token
    console.log("Exchanging code for access token...");
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&client_secret=${FACEBOOK_APP_SECRET}` +
      `&code=${code}`
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return Response.redirect(`${APP_URL}/settings?facebook_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    let userAccessToken = tokenData.access_token;

    console.log("Got short-lived token, exchanging for long-lived...");

    // Exchange for long-lived token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${FACEBOOK_APP_ID}` +
      `&client_secret=${FACEBOOK_APP_SECRET}` +
      `&fb_exchange_token=${userAccessToken}`
    );

    if (longLivedResponse.ok) {
      const longLivedData = await longLivedResponse.json();
      userAccessToken = longLivedData.access_token;
      console.log("Got long-lived token, expires in:", longLivedData.expires_in, "seconds");
    } else {
      console.warn("Failed to get long-lived token, using short-lived");
    }

    // Get user's Facebook Pages
    console.log("Fetching user's Facebook pages...");
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&limit=200&access_token=${userAccessToken}`
    );

    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text();
      console.error("Failed to get pages:", errorText);
      return Response.redirect(`${APP_URL}/settings?facebook_error=no_pages_access`);
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];
    console.log(`Found ${pages.length} Facebook pages`);

    if (pages.length === 0) {
      console.error("No pages found");
      return Response.redirect(`${APP_URL}/settings?facebook_error=no_pages_found`);
    }

    // Use the first page (user can select different page later if needed)
    const selectedPage = pages[0];
    const pageId = selectedPage.id;
    const pageName = selectedPage.name;
    const pageAccessToken = selectedPage.access_token;

    console.log(`Using page: ${pageName} (${pageId})`);

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Encrypt the page access token
    const { data: encryptedAccessToken, error: encryptError } = await supabase.rpc(
      "encrypt_token",
      { plain_token: pageAccessToken }
    );

    if (encryptError) {
      console.error("Token encryption failed:", encryptError);
      return Response.redirect(`${APP_URL}/settings?facebook_error=encryption_failed`);
    }

    // Calculate token expiry (page tokens don't expire if long-lived user token was used)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    // Upsert social connection
    const { error: upsertError } = await supabase
      .from("social_connections")
      .upsert(
        {
          user_id: userId,
          platform: "facebook",
          account_id: pageId,
          account_name: pageName,
          page_id: pageId,
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
      return Response.redirect(`${APP_URL}/settings?facebook_error=save_failed`);
    }

    console.log(`Facebook connected successfully for user ${userId.substring(0, 8)}...`);
    return Response.redirect(`${APP_URL}${redirectUrl}?facebook_connected=true`);
  } catch (error) {
    console.error("Facebook callback error:", error);
    return Response.redirect(`${APP_URL}/settings?facebook_error=internal_error`);
  }
});

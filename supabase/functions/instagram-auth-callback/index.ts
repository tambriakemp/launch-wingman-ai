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

    console.log("Instagram callback received:", { hasCode: !!code, hasState: !!stateParam, error, errorReason });

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error, errorReason);
      return Response.redirect(`${APP_URL}/settings?instagram_error=${encodeURIComponent(errorReason || error)}`);
    }

    if (!code || !stateParam) {
      console.error("Missing code or state");
      return Response.redirect(`${APP_URL}/settings?instagram_error=missing_params`);
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
      return Response.redirect(`${APP_URL}/settings?instagram_error=invalid_state`);
    }

    const FACEBOOK_APP_ID = Deno.env.get("FACEBOOK_APP_ID");
    const FACEBOOK_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      console.error("Missing Facebook credentials");
      return Response.redirect(`${APP_URL}/settings?instagram_error=config_error`);
    }

    const callbackUrl = `${SUPABASE_URL}/functions/v1/instagram-auth-callback`;

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
      return Response.redirect(`${APP_URL}/settings?instagram_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    let accessToken = tokenData.access_token;

    console.log("Got short-lived token, exchanging for long-lived...");

    // Exchange for long-lived token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${FACEBOOK_APP_ID}` +
      `&client_secret=${FACEBOOK_APP_SECRET}` +
      `&fb_exchange_token=${accessToken}`
    );

    if (longLivedResponse.ok) {
      const longLivedData = await longLivedResponse.json();
      accessToken = longLivedData.access_token;
      console.log("Got long-lived token, expires in:", longLivedData.expires_in, "seconds");
    } else {
      console.warn("Failed to get long-lived token, using short-lived");
    }

    // Get user's Facebook Pages
    console.log("Fetching user's Facebook pages...");
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`
    );

    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text();
      console.error("Failed to get pages:", errorText);
      return Response.redirect(`${APP_URL}/settings?instagram_error=pages_fetch_failed`);
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    console.log(`Found ${pages.length} Facebook pages`);

    if (pages.length === 0) {
      return Response.redirect(`${APP_URL}/settings?instagram_error=no_pages_found`);
    }

    // For each page, check for Instagram Business Account
    let instagramAccountId: string | null = null;
    let instagramUsername: string | null = null;
    let pageId: string | null = null;
    let pageAccessToken: string | null = null;

    for (const page of pages) {
      console.log(`Checking page "${page.name}" for Instagram account...`);
      
      const igResponse = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );

      if (igResponse.ok) {
        const igData = await igResponse.json();
        if (igData.instagram_business_account) {
          instagramAccountId = igData.instagram_business_account.id;
          pageId = page.id;
          pageAccessToken = page.access_token;
          
          // Get Instagram username
          const usernameResponse = await fetch(
            `https://graph.facebook.com/v21.0/${instagramAccountId}?fields=username&access_token=${page.access_token}`
          );
          if (usernameResponse.ok) {
            const usernameData = await usernameResponse.json();
            instagramUsername = usernameData.username;
          }
          
          console.log(`Found Instagram account: ${instagramUsername} (${instagramAccountId})`);
          break;
        }
      }
    }

    if (!instagramAccountId || !pageAccessToken) {
      console.error("No Instagram Business Account found on any page");
      return Response.redirect(`${APP_URL}/settings?instagram_error=no_instagram_account`);
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Encrypt tokens
    const { data: encryptedAccessToken, error: encryptError } = await supabase.rpc(
      "encrypt_token",
      { plain_token: pageAccessToken }
    );

    if (encryptError) {
      console.error("Token encryption failed:", encryptError);
      return Response.redirect(`${APP_URL}/settings?instagram_error=encryption_failed`);
    }

    // Calculate token expiry (60 days for long-lived tokens)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    // Upsert social connection
    const { error: upsertError } = await supabase
      .from("social_connections")
      .upsert(
        {
          user_id: userId,
          platform: "instagram",
          account_id: instagramAccountId,
          account_name: instagramUsername,
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
      return Response.redirect(`${APP_URL}/settings?instagram_error=save_failed`);
    }

    console.log(`Instagram connected successfully for user ${userId.substring(0, 8)}...`);
    return Response.redirect(`${APP_URL}${redirectUrl}?instagram_connected=true`);
  } catch (error) {
    console.error("Instagram callback error:", error);
    return Response.redirect(`${APP_URL}/settings?instagram_error=internal_error`);
  }
});

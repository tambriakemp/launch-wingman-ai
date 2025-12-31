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
    const grantedScopes = url.searchParams.get("granted_scopes");

    console.log("Instagram callback received:", { 
      hasCode: !!code, 
      hasState: !!stateParam, 
      error, 
      errorReason,
      grantedScopes 
    });

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

    // Debug token to inspect permissions and granular scopes
    console.log("Debugging token permissions...");
    const debugResponse = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`
    );
    
    let granularScopes: Array<{ scope: string; target_ids?: string[] }> = [];
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log("Token debug info:", JSON.stringify({
        scopes: debugData.data?.scopes,
        granular_scopes: debugData.data?.granular_scopes,
        is_valid: debugData.data?.is_valid,
        user_id: debugData.data?.user_id
      }));
      granularScopes = debugData.data?.granular_scopes || [];
    } else {
      console.warn("Failed to debug token:", await debugResponse.text());
    }

    // Get user's Facebook Pages
    console.log("Fetching user's Facebook pages...");
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&limit=200&access_token=${accessToken}`
    );

    let pages: Array<{ id: string; name: string; access_token: string }> = [];

    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      pages = pagesData.data || [];
      console.log(`Found ${pages.length} Facebook pages from /me/accounts`);
    } else {
      console.warn("Failed to get pages from /me/accounts:", await pagesResponse.text());
    }

    // Fallback: If /me/accounts is empty, extract page IDs from granular_scopes
    if (pages.length === 0 && granularScopes.length > 0) {
      console.log("No pages from /me/accounts, trying granular_scopes fallback...");
      
      // Find page IDs from granular scopes (pages_show_list, pages_read_engagement, etc.)
      const pageIds = new Set<string>();
      for (const gs of granularScopes) {
        if (gs.target_ids && gs.target_ids.length > 0) {
          for (const id of gs.target_ids) {
            pageIds.add(id);
          }
        }
      }
      
      console.log(`Found ${pageIds.size} page IDs from granular_scopes:`, Array.from(pageIds));
      
      // Fetch each page directly
      for (const pageId of pageIds) {
        try {
          const pageResponse = await fetch(
            `https://graph.facebook.com/v21.0/${pageId}?fields=id,name,access_token&access_token=${accessToken}`
          );
          
          if (pageResponse.ok) {
            const pageData = await pageResponse.json();
            if (pageData.id && pageData.access_token) {
              pages.push({
                id: pageData.id,
                name: pageData.name || "Unknown Page",
                access_token: pageData.access_token
              });
              console.log(`Successfully fetched page: ${pageData.name} (${pageData.id})`);
            }
          } else {
            const errorText = await pageResponse.text();
            console.warn(`Failed to fetch page ${pageId}:`, errorText);
          }
        } catch (e) {
          console.warn(`Error fetching page ${pageId}:`, e);
        }
      }
      
      console.log(`Total pages after granular_scopes fallback: ${pages.length}`);
    }

    if (pages.length === 0) {
      console.error("No pages found after all attempts. granular_scopes:", JSON.stringify(granularScopes));
      return Response.redirect(`${APP_URL}/settings?instagram_error=no_pages_found`);
    }

    // For each page, check for Instagram Business Account
    let instagramAccountId: string | null = null;
    let instagramUsername: string | null = null;
    let pageId: string | null = null;
    let pageAccessToken: string | null = null;

    for (const page of pages) {
      console.log(`Checking page "${page.name}" (${page.id}) for Instagram account...`);
      
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
        } else {
          console.log(`Page "${page.name}" has no Instagram Business Account`);
        }
      } else {
        console.warn(`Failed to check IG for page ${page.id}:`, await igResponse.text());
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Refresh tokens that expire within this many days
const REFRESH_THRESHOLD_DAYS = 7;

interface RefreshResult {
  platform: string;
  userId: string;
  success: boolean;
  error?: string;
}

async function refreshInstagramToken(
  supabase: any,
  connection: any,
  FACEBOOK_APP_ID: string,
  FACEBOOK_APP_SECRET: string
): Promise<RefreshResult> {
  const result: RefreshResult = {
    platform: 'instagram',
    userId: connection.user_id.substring(0, 8),
    success: false,
  };

  try {
    // Exchange for new long-lived token
    const refreshResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${FACEBOOK_APP_ID}` +
      `&client_secret=${FACEBOOK_APP_SECRET}` +
      `&fb_exchange_token=${connection.access_token}`
    );

    if (!refreshResponse.ok) {
      result.error = `API error: ${refreshResponse.status}`;
      return result;
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData.access_token;
    const expiresIn = refreshData.expires_in || 5184000;

    // Get page access token if we have a page_id
    let pageAccessToken = newAccessToken;
    if (connection.page_id) {
      const pageResponse = await fetch(
        `https://graph.facebook.com/v21.0/${connection.page_id}?fields=access_token&access_token=${newAccessToken}`
      );
      if (pageResponse.ok) {
        const pageData = await pageResponse.json();
        if (pageData.access_token) {
          pageAccessToken = pageData.access_token;
        }
      }
    }

    // Encrypt the new token
    const { data: encryptedToken, error: encryptError } = await supabase.rpc(
      "encrypt_token",
      { plain_token: pageAccessToken }
    );

    if (encryptError) {
      result.error = "Encryption failed";
      return result;
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
      result.error = "Database update failed";
      return result;
    }

    result.success = true;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    return result;
  }
}

async function refreshFacebookToken(
  supabase: any,
  connection: any,
  FACEBOOK_APP_ID: string,
  FACEBOOK_APP_SECRET: string
): Promise<RefreshResult> {
  const result: RefreshResult = {
    platform: 'facebook',
    userId: connection.user_id.substring(0, 8),
    success: false,
  };

  try {
    // Exchange for new long-lived token
    const refreshResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${FACEBOOK_APP_ID}` +
      `&client_secret=${FACEBOOK_APP_SECRET}` +
      `&fb_exchange_token=${connection.access_token}`
    );

    if (!refreshResponse.ok) {
      result.error = `API error: ${refreshResponse.status}`;
      return result;
    }

    const refreshData = await refreshResponse.json();
    const expiresIn = refreshData.expires_in || 5184000;

    // Get page access token
    let pageAccessToken = refreshData.access_token;
    if (connection.page_id) {
      const pageResponse = await fetch(
        `https://graph.facebook.com/v21.0/${connection.page_id}?fields=access_token&access_token=${refreshData.access_token}`
      );
      if (pageResponse.ok) {
        const pageData = await pageResponse.json();
        if (pageData.access_token) {
          pageAccessToken = pageData.access_token;
        }
      }
    }

    // Encrypt the new token
    const { data: encryptedToken, error: encryptError } = await supabase.rpc(
      "encrypt_token",
      { plain_token: pageAccessToken }
    );

    if (encryptError) {
      result.error = "Encryption failed";
      return result;
    }

    const newExpiresAt = new Date();
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + expiresIn);

    const { error: updateError } = await supabase
      .from("social_connections")
      .update({
        access_token: encryptedToken,
        token_expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    if (updateError) {
      result.error = "Database update failed";
      return result;
    }

    result.success = true;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    return result;
  }
}

async function refreshPinterestToken(
  supabase: any,
  connection: any,
  PINTEREST_APP_ID: string,
  PINTEREST_APP_SECRET: string,
  PINTEREST_SANDBOX_APP_ID?: string,
  PINTEREST_SANDBOX_APP_SECRET?: string
): Promise<RefreshResult> {
  const isSandbox = connection.platform === 'pinterest_sandbox';
  const result: RefreshResult = {
    platform: connection.platform,
    userId: connection.user_id.substring(0, 8),
    success: false,
  };

  try {
    if (!connection.refresh_token) {
      result.error = "No refresh token available";
      return result;
    }

    // Use sandbox credentials if it's a sandbox connection
    const appId = isSandbox ? PINTEREST_SANDBOX_APP_ID : PINTEREST_APP_ID;
    const appSecret = isSandbox ? PINTEREST_SANDBOX_APP_SECRET : PINTEREST_APP_SECRET;
    const apiBase = isSandbox ? 'https://api-sandbox.pinterest.com' : 'https://api.pinterest.com';

    if (!appId || !appSecret) {
      result.error = `Missing Pinterest ${isSandbox ? 'sandbox ' : ''}credentials`;
      return result;
    }

    const credentials = btoa(`${appId}:${appSecret}`);

    const response = await fetch(`${apiBase}/v5/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
      }),
    });

    if (!response.ok) {
      result.error = `API error: ${response.status}`;
      return result;
    }

    const tokenData = await response.json();

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    // Encrypt the new tokens
    const { data: encryptedAccessToken } = await supabase.rpc('encrypt_token', {
      plain_token: tokenData.access_token,
    });

    const { data: encryptedRefreshToken } = tokenData.refresh_token
      ? await supabase.rpc('encrypt_token', { plain_token: tokenData.refresh_token })
      : await supabase.rpc('encrypt_token', { plain_token: connection.refresh_token });

    const { error: updateError } = await supabase
      .from('social_connections')
      .update({
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    if (updateError) {
      result.error = "Database update failed";
      return result;
    }

    result.success = true;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    return result;
  }
}

async function refreshTikTokToken(
  supabase: any,
  connection: any,
  TIKTOK_CLIENT_KEY: string,
  TIKTOK_CLIENT_SECRET: string,
  TIKTOK_SANDBOX_CLIENT_KEY?: string,
  TIKTOK_SANDBOX_CLIENT_SECRET?: string
): Promise<RefreshResult> {
  const isSandbox = connection.platform === 'tiktok_sandbox';
  const platform = connection.platform;
  const result: RefreshResult = {
    platform,
    userId: connection.user_id.substring(0, 8),
    success: false,
  };

  try {
    if (!connection.refresh_token) {
      result.error = "No refresh token available";
      return result;
    }

    // Use sandbox credentials if it's a sandbox connection
    const clientKey = isSandbox ? (TIKTOK_SANDBOX_CLIENT_KEY || TIKTOK_CLIENT_KEY) : TIKTOK_CLIENT_KEY;
    const clientSecret = isSandbox ? (TIKTOK_SANDBOX_CLIENT_SECRET || TIKTOK_CLIENT_SECRET) : TIKTOK_CLIENT_SECRET;

    const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: connection.refresh_token,
      }),
    });

    const data = await response.json();

    if (data.error || !data.access_token) {
      result.error = data.error_description || data.error || "Token refresh failed";
      return result;
    }

    const { data: encryptedAccess } = await supabase.rpc("encrypt_token", {
      plain_token: data.access_token,
    });

    const { data: encryptedRefresh } = await supabase.rpc("encrypt_token", {
      plain_token: data.refresh_token,
    });

    const tokenExpiry = new Date(Date.now() + data.expires_in * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("social_connections")
      .update({
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        token_expires_at: tokenExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    if (updateError) {
      result.error = "Database update failed";
      return result;
    }

    result.success = true;
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : "Unknown error";
    return result;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID');
    const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET');
    const PINTEREST_APP_ID = Deno.env.get('PINTEREST_APP_ID');
    const PINTEREST_APP_SECRET = Deno.env.get('PINTEREST_APP_SECRET');
    const PINTEREST_SANDBOX_APP_ID = Deno.env.get('PINTEREST_SANDBOX_APP_ID');
    const PINTEREST_SANDBOX_APP_SECRET = Deno.env.get('PINTEREST_SANDBOX_APP_SECRET');
    const TIKTOK_CLIENT_KEY = Deno.env.get('TIKTOK_CLIENT_KEY');
    const TIKTOK_CLIENT_SECRET = Deno.env.get('TIKTOK_CLIENT_SECRET');
    const TIKTOK_SANDBOX_CLIENT_KEY = Deno.env.get('TIKTOK_SANDBOX_CLIENT_KEY');
    const TIKTOK_SANDBOX_CLIENT_SECRET = Deno.env.get('TIKTOK_SANDBOX_CLIENT_SECRET');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Calculate the threshold date (tokens expiring within X days)
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + REFRESH_THRESHOLD_DAYS);

    console.log(`[AUTO-REFRESH] Starting token refresh job. Threshold: ${thresholdDate.toISOString()}`);

    // Get all connections that need refreshing (expiring soon but not expired)
    const { data: connections, error: fetchError } = await supabase
      .from('social_connections_decrypted')
      .select('id, user_id, platform, access_token, refresh_token, token_expires_at, page_id')
      .not('token_expires_at', 'is', null)
      .gt('token_expires_at', new Date().toISOString()) // Not already expired
      .lte('token_expires_at', thresholdDate.toISOString()); // Expiring within threshold

    if (fetchError) {
      console.error('[AUTO-REFRESH] Error fetching connections:', fetchError);
      throw new Error('Failed to fetch connections');
    }

    console.log(`[AUTO-REFRESH] Found ${connections?.length || 0} connections to refresh`);

    const results: RefreshResult[] = [];

    if (connections && connections.length > 0) {
      for (const connection of connections) {
        console.log(`[AUTO-REFRESH] Processing ${connection.platform} for user ${connection.user_id.substring(0, 8)}...`);

        let result: RefreshResult;

        switch (connection.platform) {
          case 'instagram':
            if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
              result = await refreshInstagramToken(supabase, connection, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET);
            } else {
              result = { platform: 'instagram', userId: connection.user_id.substring(0, 8), success: false, error: 'Missing Facebook credentials' };
            }
            break;

          case 'facebook':
            if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
              result = await refreshFacebookToken(supabase, connection, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET);
            } else {
              result = { platform: 'facebook', userId: connection.user_id.substring(0, 8), success: false, error: 'Missing Facebook credentials' };
            }
            break;

          case 'pinterest':
          case 'pinterest_sandbox':
            if (PINTEREST_APP_ID && PINTEREST_APP_SECRET) {
              result = await refreshPinterestToken(
                supabase, 
                connection, 
                PINTEREST_APP_ID, 
                PINTEREST_APP_SECRET,
                PINTEREST_SANDBOX_APP_ID,
                PINTEREST_SANDBOX_APP_SECRET
              );
            } else {
              result = { platform: connection.platform, userId: connection.user_id.substring(0, 8), success: false, error: 'Missing Pinterest credentials' };
            }
            break;

          case 'tiktok':
          case 'tiktok_sandbox':
            if (TIKTOK_CLIENT_KEY && TIKTOK_CLIENT_SECRET) {
              result = await refreshTikTokToken(
                supabase, 
                connection, 
                TIKTOK_CLIENT_KEY, 
                TIKTOK_CLIENT_SECRET,
                TIKTOK_SANDBOX_CLIENT_KEY,
                TIKTOK_SANDBOX_CLIENT_SECRET
              );
            } else {
              result = { platform: connection.platform, userId: connection.user_id.substring(0, 8), success: false, error: 'Missing TikTok credentials' };
            }
            break;

          default:
            result = { platform: connection.platform, userId: connection.user_id.substring(0, 8), success: false, error: 'Unsupported platform' };
        }

        results.push(result);

        if (result.success) {
          console.log(`[AUTO-REFRESH] ✓ ${result.platform} refreshed for user ${result.userId}`);
        } else {
          console.error(`[AUTO-REFRESH] ✗ ${result.platform} failed for user ${result.userId}: ${result.error}`);
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[AUTO-REFRESH] Job complete. Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        successful: successCount,
        failed: failCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[AUTO-REFRESH] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

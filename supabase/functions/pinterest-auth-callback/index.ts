import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('[PINTEREST-AUTH-CALLBACK] Received callback');

    // Get app origin for redirects
    const APP_URL = Deno.env.get('APP_URL') || 'https://launchely.lovable.app';

    if (error) {
      console.error('[PINTEREST-AUTH-CALLBACK] OAuth error:', error);
      return Response.redirect(`${APP_URL}/settings?pinterest_error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      console.error('[PINTEREST-AUTH-CALLBACK] Missing code or state');
      return Response.redirect(`${APP_URL}/settings?pinterest_error=missing_params`);
    }

    // Decode state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch (e) {
      console.error('[PINTEREST-AUTH-CALLBACK] Invalid state:', e);
      return Response.redirect(`${APP_URL}/settings?pinterest_error=invalid_state`);
    }

    const { user_id, redirect_url, environment = 'production' } = stateData;
    const isSandbox = environment === 'sandbox';
    const platform = isSandbox ? 'pinterest_sandbox' : 'pinterest';
    
    console.log('[PINTEREST-AUTH-CALLBACK] Processing for user:', user_id, 'environment:', environment);

    // Pinterest uses SAME credentials for both production and sandbox
    const PINTEREST_APP_ID = Deno.env.get('PINTEREST_APP_ID');
    const PINTEREST_APP_SECRET = Deno.env.get('PINTEREST_APP_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    if (!PINTEREST_APP_ID || !PINTEREST_APP_SECRET) {
      console.error('[PINTEREST-AUTH-CALLBACK] Missing Pinterest credentials');
      return Response.redirect(`${APP_URL}/settings?pinterest_error=config_error`);
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/pinterest-auth-callback`;
    
    // Create Basic auth header
    const credentials = btoa(`${PINTEREST_APP_ID}:${PINTEREST_APP_SECRET}`);
    
    // Token exchange ALWAYS uses production API endpoint
    // Pinterest's OAuth tokens are issued from production - sandbox API is only for subsequent API calls
    console.log('[PINTEREST-AUTH-CALLBACK] Exchanging code at production token endpoint');
    
    const tokenResponse = await fetch(`https://api.pinterest.com/v5/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[PINTEREST-AUTH-CALLBACK] Token exchange failed:', tokenResponse.status, errorText);
      return Response.redirect(`${APP_URL}/settings?pinterest_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    console.log('[PINTEREST-AUTH-CALLBACK] Token exchange successful');

    // Use sandbox API for user info and subsequent API calls if in sandbox mode
    const apiBase = isSandbox ? 'https://api-sandbox.pinterest.com' : 'https://api.pinterest.com';
    
    console.log('[PINTEREST-AUTH-CALLBACK] Fetching user info from:', apiBase);
    
    const userResponse = await fetch(`${apiBase}/v5/user_account`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    let accountName = 'Pinterest User';
    let accountId = '';
    let avatarUrl: string | null = null;
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('[PINTEREST-AUTH-CALLBACK] User data received:', JSON.stringify(userData));
      accountName = userData.username || userData.business_name || 'Pinterest User';
      accountId = userData.id || '';
      avatarUrl = userData.profile_image || null;
      console.log('[PINTEREST-AUTH-CALLBACK] Got user info:', accountName, avatarUrl ? 'with avatar' : 'no avatar');
    } else {
      const errorText = await userResponse.text();
      console.error('[PINTEREST-AUTH-CALLBACK] Failed to get user info:', userResponse.status, errorText);
    }

    // Store tokens in database with encryption
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Calculate token expiry
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    // Encrypt tokens using database function
    const { data: encryptedAccessToken, error: encryptAccessError } = await supabase.rpc('encrypt_token', { 
      plain_token: tokenData.access_token 
    });
    
    if (encryptAccessError || !encryptedAccessToken) {
      console.error('[PINTEREST-AUTH-CALLBACK] Failed to encrypt access token:', encryptAccessError);
      return Response.redirect(`${APP_URL}/settings?pinterest_error=encryption_failed`);
    }
    
    let encryptedRefreshToken = null;
    if (tokenData.refresh_token) {
      const { data: encryptedRefresh, error: encryptRefreshError } = await supabase.rpc('encrypt_token', { 
        plain_token: tokenData.refresh_token 
      });
      if (encryptRefreshError) {
        console.error('[PINTEREST-AUTH-CALLBACK] Failed to encrypt refresh token:', encryptRefreshError);
      } else {
        encryptedRefreshToken = encryptedRefresh;
      }
    }

    console.log('[PINTEREST-AUTH-CALLBACK] Tokens encrypted successfully');

    // Upsert the connection with encrypted tokens and avatar
    // Use the appropriate platform based on environment
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        user_id,
        platform,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expires_at: expiresAt,
        account_name: accountName,
        account_id: accountId,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform',
      });

    if (dbError) {
      console.error('[PINTEREST-AUTH-CALLBACK] Database error:', dbError);
      return Response.redirect(`${APP_URL}/settings?pinterest_error=db_error`);
    }

    console.log('[PINTEREST-AUTH-CALLBACK] Connection saved successfully for platform:', platform);
    
    // Redirect back to app with success
    const finalRedirect = redirect_url || '/settings';
    return Response.redirect(`${APP_URL}${finalRedirect}?pinterest_connected=true`);

  } catch (error) {
    console.error('[PINTEREST-AUTH-CALLBACK] Unexpected error:', error);
    const APP_URL = Deno.env.get('APP_URL') || 'https://launchely.lovable.app';
    return Response.redirect(`${APP_URL}/settings?pinterest_error=unexpected`);
  }
});

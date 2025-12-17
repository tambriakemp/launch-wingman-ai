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
    const APP_URL = Deno.env.get('APP_URL') || 'https://coach-hub.lovable.app';

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

    const { user_id, redirect_url } = stateData;
    console.log('[PINTEREST-AUTH-CALLBACK] Processing for user:', user_id);

    // Exchange code for tokens
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
    
    const tokenResponse = await fetch('https://api.pinterest.com/v5/oauth/token', {
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
      console.error('[PINTEREST-AUTH-CALLBACK] Token exchange failed:', errorText);
      return Response.redirect(`${APP_URL}/settings?pinterest_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    console.log('[PINTEREST-AUTH-CALLBACK] Token exchange successful');

    // Get Pinterest user info
    const userResponse = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    let accountName = 'Pinterest User';
    let accountId = '';
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      accountName = userData.username || userData.business_name || 'Pinterest User';
      accountId = userData.id || '';
      console.log('[PINTEREST-AUTH-CALLBACK] Got user info:', accountName);
    }

    // Store tokens in database
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Calculate token expiry
    const expiresAt = tokenData.expires_in 
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;

    // Upsert the connection
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        user_id,
        platform: 'pinterest',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: expiresAt,
        account_name: accountName,
        account_id: accountId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform',
      });

    if (dbError) {
      console.error('[PINTEREST-AUTH-CALLBACK] Database error:', dbError);
      return Response.redirect(`${APP_URL}/settings?pinterest_error=db_error`);
    }

    console.log('[PINTEREST-AUTH-CALLBACK] Connection saved successfully');
    
    // Redirect back to app with success
    const finalRedirect = redirect_url || '/settings';
    return Response.redirect(`${APP_URL}${finalRedirect}?pinterest_connected=true`);

  } catch (error) {
    console.error('[PINTEREST-AUTH-CALLBACK] Unexpected error:', error);
    const APP_URL = Deno.env.get('APP_URL') || 'https://coach-hub.lovable.app';
    return Response.redirect(`${APP_URL}/settings?pinterest_error=unexpected`);
  }
});

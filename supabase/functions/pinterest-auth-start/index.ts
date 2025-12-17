import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PINTEREST_APP_ID = Deno.env.get('PINTEREST_APP_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    
    if (!PINTEREST_APP_ID) {
      console.error('[PINTEREST-AUTH-START] Missing PINTEREST_APP_ID');
      throw new Error('Pinterest App ID not configured');
    }

    // Get user_id from request body to pass as state
    const { user_id, redirect_url } = await req.json();
    
    if (!user_id) {
      throw new Error('User ID is required');
    }

    console.log('[PINTEREST-AUTH-START] Starting OAuth for user:', user_id);

    // Build state parameter with user info
    const state = btoa(JSON.stringify({ user_id, redirect_url: redirect_url || '/settings' }));
    
    // Pinterest OAuth scopes
    const scopes = 'boards:read,pins:read,pins:write';
    
    // Pinterest OAuth URL
    const redirectUri = `${SUPABASE_URL}/functions/v1/pinterest-auth-callback`;
    const authUrl = new URL('https://www.pinterest.com/oauth/');
    authUrl.searchParams.set('client_id', PINTEREST_APP_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('state', state);

    console.log('[PINTEREST-AUTH-START] Generated auth URL, redirecting...');

    return new Response(
      JSON.stringify({ url: authUrl.toString() }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('[PINTEREST-AUTH-START] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!PINTEREST_APP_ID) {
      console.error('[PINTEREST-AUTH-START] Missing PINTEREST_APP_ID');
      throw new Error('Pinterest App ID not configured');
    }

    // SECURITY: Validate the user's JWT token instead of accepting user_id from client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[PINTEREST-AUTH-START] No authorization header');
      throw new Error('Unauthorized');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Verify the JWT and get the authenticated user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[PINTEREST-AUTH-START] Invalid token:', authError?.message);
      throw new Error('Unauthorized');
    }

    // Get optional redirect_url from request body (but NOT user_id - we use the authenticated user)
    let redirect_url = '/settings';
    try {
      const body = await req.json();
      if (body.redirect_url) {
        redirect_url = body.redirect_url;
      }
    } catch {
      // No body or invalid JSON is fine, use defaults
    }

    console.log('[PINTEREST-AUTH-START] Starting OAuth for authenticated user:', user.id);

    // Build state parameter with authenticated user info
    const state = btoa(JSON.stringify({ user_id: user.id, redirect_url }));
    
    // Pinterest OAuth scopes - need boards:write to create pins on boards, user_accounts:read for profile info
    const scopes = 'boards:read,boards:write,pins:read,pins:write,user_accounts:read';
    
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
    const status = message === 'Unauthorized' ? 401 : 400;
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status
      }
    );
  }
});

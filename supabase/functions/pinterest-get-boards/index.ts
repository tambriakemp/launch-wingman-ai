import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshPinterestToken(
  supabase: any, 
  userId: string, 
  currentRefreshToken: string
) {
  const PINTEREST_APP_ID = Deno.env.get('PINTEREST_APP_ID');
  const PINTEREST_APP_SECRET = Deno.env.get('PINTEREST_APP_SECRET');

  const credentials = btoa(`${PINTEREST_APP_ID}:${PINTEREST_APP_SECRET}`);
  
  console.log('[PINTEREST-GET-BOARDS] Refreshing token');
  
  const response = await fetch(`https://api.pinterest.com/v5/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentRefreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[PINTEREST-GET-BOARDS] Token refresh failed:', response.status, errorText);
    return null;
  }

  const tokenData = await response.json();
  console.log('[PINTEREST-GET-BOARDS] Token refreshed successfully');
  
  const expiresAt = tokenData.expires_in 
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  // Encrypt the new tokens
  const { data: encryptedAccessToken } = await supabase.rpc('encrypt_token', { 
    plain_token: tokenData.access_token 
  });
  
  const { data: encryptedRefreshToken } = tokenData.refresh_token 
    ? await supabase.rpc('encrypt_token', { plain_token: tokenData.refresh_token })
    : await supabase.rpc('encrypt_token', { plain_token: currentRefreshToken });

  await supabase
    .from('social_connections')
    .update({
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('platform', 'pinterest');

  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid token');
    }

    // Parse request body for environment parameter
    let environment = "production";
    let sandboxToken = "";
    try {
      const body = await req.json();
      environment = body.environment || "production";
      sandboxToken = body.sandboxToken || "";
    } catch {
      // If no body, default to production
    }

    const apiBase = environment === "sandbox" 
      ? "https://api-sandbox.pinterest.com" 
      : "https://api.pinterest.com";

    console.log('[PINTEREST-GET-BOARDS] Fetching boards for user:', user.id, 'environment:', environment);

    let accessToken: string;

    // In sandbox mode with a manual sandbox token, use that directly
    if (environment === "sandbox" && sandboxToken) {
      console.log('[PINTEREST-GET-BOARDS] Using manual sandbox token');
      accessToken = sandboxToken;
    } else {
      // Get Pinterest connection (always production)
      const { data: connection, error: connError } = await supabase
        .from('social_connections')
        .select('platform, access_token, refresh_token, token_expires_at')
        .eq('user_id', user.id)
        .eq('platform', 'pinterest')
        .single();

      if (connError || !connection) {
        console.error('[PINTEREST-GET-BOARDS] Connection not found');
        throw new Error('Pinterest not connected. Go to Settings and connect Pinterest.');
      }

      console.log('[PINTEREST-GET-BOARDS] Using', environment, 'API at', apiBase);

      // Decrypt the access token
      const { data: decryptedAccessToken, error: decryptError } = await supabase.rpc('decrypt_token', { 
        encrypted_token: connection.access_token 
      });

      if (decryptError || !decryptedAccessToken) {
        console.error('[PINTEREST-GET-BOARDS] Decrypt error:', decryptError);
        throw new Error('Failed to decrypt token');
      }

      accessToken = decryptedAccessToken;

      // Check if token is expired
      const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
      const isExpired = expiresAt && expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

      if (isExpired && connection.refresh_token) {
        console.log('[PINTEREST-GET-BOARDS] Token expired, refreshing...');
        
        // Decrypt the refresh token
        const { data: decryptedRefreshToken } = await supabase.rpc('decrypt_token', { 
          encrypted_token: connection.refresh_token 
        });
        
        if (decryptedRefreshToken) {
          const newToken = await refreshPinterestToken(supabase, user.id, decryptedRefreshToken);
          if (newToken) {
            accessToken = newToken;
          } else {
            throw new Error('Failed to refresh token');
          }
        }
      }
    }

    // Fetch boards from Pinterest (use environment-specific API)
    const boardsResponse = await fetch(`${apiBase}/v5/boards`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!boardsResponse.ok) {
      const errorText = await boardsResponse.text();
      console.error('[PINTEREST-GET-BOARDS] API error:', boardsResponse.status, errorText);
      throw new Error('Failed to fetch boards');
    }

    const boardsData = await boardsResponse.json();
    console.log('[PINTEREST-GET-BOARDS] Found', boardsData.items?.length || 0, 'boards');

    const boards = (boardsData.items || []).map((board: any) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      privacy: board.privacy,
    }));

    return new Response(
      JSON.stringify({ boards }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PINTEREST-GET-BOARDS] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

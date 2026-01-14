import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize ID for logging (show only first 8 chars)
const sanitizeId = (id: string) => id ? `${id.substring(0, 8)}...` : 'unknown';

async function refreshPinterestToken(
  supabase: any, 
  userId: string, 
  currentRefreshToken: string, 
  isSandbox: boolean
) {
  const PINTEREST_APP_ID = isSandbox 
    ? Deno.env.get('PINTEREST_SANDBOX_APP_ID')
    : Deno.env.get('PINTEREST_APP_ID');
  const PINTEREST_APP_SECRET = isSandbox
    ? Deno.env.get('PINTEREST_SANDBOX_APP_SECRET')
    : Deno.env.get('PINTEREST_APP_SECRET');

  const credentials = btoa(`${PINTEREST_APP_ID}:${PINTEREST_APP_SECRET}`);
  const apiBase = isSandbox ? 'https://api-sandbox.pinterest.com' : 'https://api.pinterest.com';
  const platform = isSandbox ? 'pinterest_sandbox' : 'pinterest';
  
  const response = await fetch(`${apiBase}/v5/oauth/token`, {
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
    return null;
  }

  const tokenData = await response.json();
  
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
    .eq('platform', platform);

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

    const { board_id, title, description, media_url, link } = await req.json();

    if (!board_id) {
      throw new Error('Board ID is required');
    }

    if (!media_url) {
      throw new Error('Media URL is required for Pinterest pins');
    }

    console.log('[POST-TO-PINTEREST] Creating pin for user:', sanitizeId(user.id));

    // Get Pinterest connection from social_connections table (check both production and sandbox)
    const { data: connections, error: connError } = await supabase
      .from('social_connections')
      .select('platform, access_token, refresh_token, token_expires_at')
      .eq('user_id', user.id)
      .in('platform', ['pinterest', 'pinterest_sandbox']);

    if (connError || !connections || connections.length === 0) {
      console.error('[POST-TO-PINTEREST] Connection error:', connError);
      throw new Error('Pinterest not connected');
    }

    // Prefer sandbox if available, otherwise use production
    const connection = connections.find(c => c.platform === 'pinterest_sandbox') || connections[0];
    const isSandbox = connection.platform === 'pinterest_sandbox';
    const apiBase = isSandbox ? 'https://api-sandbox.pinterest.com' : 'https://api.pinterest.com';

    console.log('[POST-TO-PINTEREST] Using', isSandbox ? 'sandbox' : 'production', 'API');

    // Decrypt the access token
    const { data: decryptedAccessToken, error: decryptError } = await supabase.rpc('decrypt_token', { 
      encrypted_token: connection.access_token 
    });

    if (decryptError || !decryptedAccessToken) {
      console.error('[POST-TO-PINTEREST] Decrypt error:', decryptError);
      throw new Error('Failed to decrypt token');
    }

    let accessToken = decryptedAccessToken;

    // Check if token is expired
    const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
    const isExpired = expiresAt && expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

    if (isExpired && connection.refresh_token) {
      console.log('[POST-TO-PINTEREST] Token expired, refreshing...');
      
      // Decrypt the refresh token
      const { data: decryptedRefreshToken } = await supabase.rpc('decrypt_token', { 
        encrypted_token: connection.refresh_token 
      });
      
      if (decryptedRefreshToken) {
        const newToken = await refreshPinterestToken(supabase, user.id, decryptedRefreshToken, isSandbox);
        if (newToken) {
          accessToken = newToken;
        } else {
          throw new Error('Failed to refresh token. Please reconnect Pinterest.');
        }
      }
    }

    // Create the pin
    const pinData: any = {
      board_id,
      media_source: {
        source_type: 'image_url',
        url: media_url,
      },
    };

    if (title) {
      pinData.title = title.substring(0, 100); // Pinterest title limit
    }

    if (description) {
      pinData.description = description.substring(0, 500); // Pinterest description limit
    }

    if (link) {
      pinData.link = link;
    }

    console.log('[POST-TO-PINTEREST] Creating pin via', apiBase);

    const pinResponse = await fetch(`${apiBase}/v5/pins`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pinData),
    });

    if (!pinResponse.ok) {
      const errorText = await pinResponse.text();
      console.error('[POST-TO-PINTEREST] API error:', pinResponse.status, errorText);
      
      // Check if it's an auth error that might need reconnection
      if (pinResponse.status === 401) {
        throw new Error('Pinterest authorization expired. Please reconnect your account.');
      }
      
      throw new Error(`Failed to create pin: ${errorText}`);
    }

    const pinResult = await pinResponse.json();
    console.log('[POST-TO-PINTEREST] Pin created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        pin_id: pinResult.id,
        pin_url: `https://www.pinterest.com/pin/${pinResult.id}/`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[POST-TO-PINTEREST] Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

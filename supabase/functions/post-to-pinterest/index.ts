import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize ID for logging (show only first 8 chars)
const sanitizeId = (id: string) => id ? `${id.substring(0, 8)}...` : 'unknown';

async function refreshPinterestToken(supabase: any, userId: string, currentRefreshToken: string) {
  const PINTEREST_APP_ID = Deno.env.get('PINTEREST_APP_ID');
  const PINTEREST_APP_SECRET = Deno.env.get('PINTEREST_APP_SECRET');

  const credentials = btoa(`${PINTEREST_APP_ID}:${PINTEREST_APP_SECRET}`);
  
  const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
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

    const { board_id, title, description, media_url, link } = await req.json();

    if (!board_id) {
      throw new Error('Board ID is required');
    }

    if (!media_url) {
      throw new Error('Media URL is required for Pinterest pins');
    }

    console.log('[POST-TO-PINTEREST] Creating pin for user:', sanitizeId(user.id));

    // Get Pinterest connection using decrypted view
    const { data: connection, error: connError } = await supabase
      .from('social_connections_decrypted')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', user.id)
      .eq('platform', 'pinterest')
      .single();

    if (connError || !connection) {
      throw new Error('Pinterest not connected');
    }

    let accessToken = connection.access_token;

    // Check if token is expired
    const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
    const isExpired = expiresAt && expiresAt.getTime() < Date.now() + 5 * 60 * 1000;

    if (isExpired && connection.refresh_token) {
      console.log('[POST-TO-PINTEREST] Token expired, refreshing...');
      const newToken = await refreshPinterestToken(supabase, user.id, connection.refresh_token);
      if (newToken) {
        accessToken = newToken;
      } else {
        throw new Error('Failed to refresh token. Please reconnect Pinterest.');
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

    console.log('[POST-TO-PINTEREST] Creating pin');

    const pinResponse = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pinData),
    });

    if (!pinResponse.ok) {
      const errorText = await pinResponse.text();
      console.error('[POST-TO-PINTEREST] API error:', pinResponse.status);
      
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
    console.error('[POST-TO-PINTEREST] Error occurred');
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

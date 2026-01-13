import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Use anon key client for auth verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user from JWT
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { platform } = await req.json();
    const platformName = platform || 'tiktok';
    
    console.log(`Revoking TikTok token for user ${user.id}, platform: ${platformName}`);

    // Determine environment based on platform
    const isSandbox = platformName === 'tiktok_sandbox';
    
    // Get credentials based on environment
    const clientKey = isSandbox 
      ? Deno.env.get('TIKTOK_SANDBOX_CLIENT_KEY')
      : Deno.env.get('TIKTOK_CLIENT_KEY');
    const clientSecret = isSandbox 
      ? Deno.env.get('TIKTOK_SANDBOX_CLIENT_SECRET')
      : Deno.env.get('TIKTOK_CLIENT_SECRET');

    if (!clientKey || !clientSecret) {
      console.error('Missing TikTok credentials for environment:', isSandbox ? 'sandbox' : 'production');
      // Still delete the connection even if we can't revoke
      const { error: deleteError } = await supabase
        .from('social_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', platformName);
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to disconnect' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Connection removed (token not revoked - missing credentials)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the connection with access token (using service role to bypass RLS)
    const { data: connection, error: fetchError } = await supabase
      .from('social_connections')
      .select('id, access_token')
      .eq('user_id', user.id)
      .eq('platform', platformName)
      .single();

    if (fetchError || !connection) {
      console.error('Fetch connection error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Connection not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the access token - try to decrypt if it's encrypted, otherwise use directly
    let accessToken = null;
    if (connection.access_token) {
      // Try to decrypt the token first
      const { data: decryptedToken, error: decryptError } = await supabase
        .rpc('decrypt_token', { encrypted_token: connection.access_token });
      
      if (decryptError) {
        console.log('Token not encrypted or decrypt failed, using raw token');
        accessToken = connection.access_token;
      } else {
        accessToken = decryptedToken;
      }
    }

    // Revoke token with TikTok API if we have the token
    if (accessToken) {
      try {
        console.log('Calling TikTok revoke API...');
        const revokeResponse = await fetch('https://open.tiktokapis.com/v2/oauth/revoke/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            token: accessToken,
          }).toString(),
        });

        const revokeData = await revokeResponse.json();
        console.log('TikTok revoke response:', JSON.stringify(revokeData));

        if (revokeData.error?.code && revokeData.error.code !== 'ok') {
          console.warn('TikTok revoke warning:', revokeData.error);
          // Continue to delete the connection even if revoke fails
        }
      } catch (revokeError) {
        console.error('TikTok API revoke error:', revokeError);
        // Continue to delete the connection even if revoke fails
      }
    } else {
      console.log('No access token to revoke, proceeding with deletion');
    }

    // Delete the connection from database
    const { error: deleteError } = await supabase
      .from('social_connections')
      .delete()
      .eq('id', connection.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to remove connection' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully revoked and deleted TikTok connection');

    return new Response(
      JSON.stringify({ success: true, message: 'TikTok connection revoked and removed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

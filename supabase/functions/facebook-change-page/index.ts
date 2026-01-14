import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageId } = await req.json();
    
    if (!pageId) {
      return new Response(
        JSON.stringify({ error: 'Missing pageId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[FACEBOOK-CHANGE-PAGE] User ${user.id.substring(0, 8)}... changing to page ${pageId}`);

    // Get the user's Facebook connection with decrypted token
    const { data: connection, error: connectionError } = await supabase
      .from('social_connections_decrypted')
      .select('id, access_token')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .single();

    if (connectionError || !connection) {
      console.error('No Facebook connection found:', connectionError);
      return new Response(
        JSON.stringify({ error: 'Facebook not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user's pages to find the new page's access token
    const currentToken = connection.access_token;
    
    // Fetch accounts using current token
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,picture&limit=200&access_token=${currentToken}`
    );

    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text();
      console.error('Failed to fetch pages:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pages. Please reconnect Facebook.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];
    
    // Find the selected page
    const selectedPage = pages.find((p: any) => p.id === pageId);
    
    if (!selectedPage) {
      console.error('Page not found:', pageId);
      return new Response(
        JSON.stringify({ error: 'Page not found. Please reconnect Facebook.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[FACEBOOK-CHANGE-PAGE] Found page: ${selectedPage.name}`);

    // Encrypt the new page access token
    const { data: encryptedAccessToken, error: encryptError } = await supabase.rpc(
      "encrypt_token",
      { plain_token: selectedPage.access_token }
    );

    if (encryptError) {
      console.error("Token encryption failed:", encryptError);
      return new Response(
        JSON.stringify({ error: 'Failed to encrypt token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate new token expiry (page tokens don't expire if from long-lived user token)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    // Update the connection with new page info
    const { error: updateError } = await supabase
      .from('social_connections')
      .update({
        account_id: selectedPage.id,
        account_name: selectedPage.name,
        avatar_url: selectedPage.picture?.data?.url || null,
        page_id: selectedPage.id,
        access_token: encryptedAccessToken,
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    if (updateError) {
      console.error('Failed to update connection:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update connection' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[FACEBOOK-CHANGE-PAGE] Successfully changed to page: ${selectedPage.name}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        page: {
          id: selectedPage.id,
          name: selectedPage.name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Facebook change page error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

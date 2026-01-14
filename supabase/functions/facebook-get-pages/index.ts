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

    console.log(`[FACEBOOK-GET-PAGES] Fetching pages for user ${user.id.substring(0, 8)}...`);

    // Get the user's Facebook connection with decrypted token
    const { data: connection, error: connectionError } = await supabase
      .from('social_connections_decrypted')
      .select('access_token, page_id')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .single();

    if (connectionError || !connection) {
      console.error('No Facebook connection found:', connectionError);
      return new Response(
        JSON.stringify({ error: 'Facebook not connected', pages: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The stored token is the page access token, we need the user token
    // For now, we'll use the user token stored during initial auth
    // But since we only have the page token, we need to get it differently
    
    // Actually, for fetching pages we need a user access token, not page token
    // The page token is what we store for posting
    // We'll need to fetch the parent user token if we have it
    
    // Since we exchanged to page token during auth, we don't have the user token stored
    // The workaround is to just return the current page as the only option
    // Or we can use the page token to get info about the current page
    
    // Let's use the Graph API to get the current page info
    const pageAccessToken = connection.access_token;
    
    // Get info about the current page using the page access token
    const pageResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,picture&access_token=${pageAccessToken}`
    );

    if (!pageResponse.ok) {
      const errorText = await pageResponse.text();
      console.error('Failed to get current page:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch page info', pages: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pageData = await pageResponse.json();
    console.log(`[FACEBOOK-GET-PAGES] Current page: ${pageData.name}`);

    // For a proper implementation, we'd need to store the user access token
    // and use it to fetch all pages. For now, we show the current page
    // and guide users to reconnect if they want to switch pages
    
    // Try to get other pages if we have access
    // Note: This won't work with just the page token, but let's try
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,picture&limit=200&access_token=${pageAccessToken}`
    );

    let pages = [pageData];
    
    if (pagesResponse.ok) {
      const pagesData = await pagesResponse.json();
      if (pagesData.data && pagesData.data.length > 0) {
        pages = pagesData.data;
        console.log(`[FACEBOOK-GET-PAGES] Found ${pages.length} pages`);
      }
    } else {
      console.log('[FACEBOOK-GET-PAGES] Could not fetch additional pages (need user token)');
    }

    return new Response(
      JSON.stringify({ 
        pages,
        currentPageId: connection.page_id,
        note: pages.length === 1 ? 'To access more pages, please reconnect Facebook' : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Facebook get pages error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', pages: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

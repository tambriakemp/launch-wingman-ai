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
    const { url } = await req.json();
    
    if (!url) {
      console.error('[vault-download] No URL provided');
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[vault-download] Request received:', { urlPreview: url.substring(0, 80) });

    // Validate URL exists in the vault database (prevents SSRF)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: resource, error: dbError } = await supabase
      .from('content_vault_resources')
      .select('id')
      .eq('resource_url', url)
      .maybeSingle();

    if (dbError) {
      console.error('[vault-download] Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate resource' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!resource) {
      console.error('[vault-download] URL not found in vault:', { urlPreview: url.substring(0, 80) });
      return new Response(
        JSON.stringify({ error: 'Resource not found in vault' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encode the URL to handle spaces and special characters
    const encodedUrl = encodeURI(url);
    console.log('[vault-download] Fetching file:', encodedUrl.substring(0, 80));

    // Fetch the file from R2
    const response = await fetch(encodedUrl);
    
    if (!response.ok) {
      console.error('[vault-download] Failed to fetch file:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch file' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract filename from URL
    const urlParts = url.split('/');
    let filename = urlParts[urlParts.length - 1] || 'download';
    filename = decodeURIComponent(filename);

    console.log('[vault-download] Serving file:', filename);

    // Stream the response with download headers
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[vault-download] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Download failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

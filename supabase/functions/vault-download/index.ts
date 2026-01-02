import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      console.error('No URL provided');
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get and normalize R2_PUBLIC_URL
    let r2PublicUrl = Deno.env.get('R2_PUBLIC_URL');
    if (!r2PublicUrl) {
      console.error('R2_PUBLIC_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize R2_PUBLIC_URL - ensure it has https:// prefix
    if (!r2PublicUrl.startsWith('http://') && !r2PublicUrl.startsWith('https://')) {
      r2PublicUrl = `https://${r2PublicUrl}`;
    }

    // Parse allowed host from R2_PUBLIC_URL
    let allowedHost: string;
    try {
      allowedHost = new URL(r2PublicUrl).host;
    } catch {
      console.error('Invalid R2_PUBLIC_URL format:', r2PublicUrl);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encode the URL to handle spaces and special characters
    const encodedUrl = encodeURI(url);
    
    // Validate URL is from allowed R2 bucket host
    let requestedHost: string;
    try {
      requestedHost = new URL(encodedUrl).host;
    } catch {
      console.error('Invalid URL format:', url);
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('URL validation:', { allowedHost, requestedHost, urlPreview: url.substring(0, 100) });

    if (requestedHost !== allowedHost) {
      console.error('URL host not allowed:', { requestedHost, allowedHost });
      return new Response(
        JSON.stringify({ error: 'Invalid URL domain' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Downloading file:', encodedUrl);

    // Fetch the file from R2
    const response = await fetch(encodedUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch file:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch file' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract filename from URL
    const urlParts = url.split('/');
    let filename = urlParts[urlParts.length - 1] || 'download';
    // Decode URL-encoded characters
    filename = decodeURIComponent(filename);

    console.log('Serving file:', filename);

    // Stream the response with download headers
    // Use application/octet-stream to ensure Supabase client returns a Blob
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
    console.error('Download error:', error);
    return new Response(
      JSON.stringify({ error: 'Download failed', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

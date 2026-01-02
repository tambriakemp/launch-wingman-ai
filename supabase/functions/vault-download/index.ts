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

    // Validate URL is from allowed R2 bucket
    const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL');
    if (!R2_PUBLIC_URL || !url.startsWith(R2_PUBLIC_URL)) {
      console.error('URL not from allowed domain:', url);
      return new Response(
        JSON.stringify({ error: 'Invalid URL domain' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Downloading file:', url);

    // Fetch the file from R2
    const response = await fetch(url);
    
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

    // Get content type from response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    console.log('Serving file:', filename, 'Content-Type:', contentType);

    // Stream the response with download headers
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
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

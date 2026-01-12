const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map extensions to MIME types for inline viewing
const INLINE_MIME_TYPES: Record<string, string> = {
  'pdf': 'application/pdf',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
};

function getFileExtension(url: string): string {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1].toLowerCase() : '';
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let url: string | null = null;
    
    // Support both GET with query param and POST with body
    if (req.method === "GET") {
      const urlObj = new URL(req.url);
      url = urlObj.searchParams.get("url");
    } else {
      const body = await req.json();
      url = body.url;
    }

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Missing url parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[VAULT-PREVIEW] Fetching for preview: ${url}`);

    // Fetch the document from R2/source
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[VAULT-PREVIEW] Failed to fetch: ${response.status}`);
      return new Response(
        JSON.stringify({ error: `Failed to fetch document: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const ext = getFileExtension(url);
    
    // Use known MIME type for inline viewing if available
    const inlineMimeType = INLINE_MIME_TYPES[ext] || contentType;
    
    // Get the file content
    const data = await response.arrayBuffer();

    console.log(`[VAULT-PREVIEW] Serving ${data.byteLength} bytes as ${inlineMimeType}`);

    // Return with Content-Disposition: inline for in-browser viewing
    return new Response(data, {
      headers: {
        ...corsHeaders,
        "Content-Type": inlineMimeType,
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[VAULT-PREVIEW] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

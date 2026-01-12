import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// AWS Signature V4 helpers
async function hmacSha256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const keyBuffer = key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  return new Uint8Array(signature);
}

async function sha256(message: string | Uint8Array): Promise<string> {
  let data: ArrayBuffer;
  if (typeof message === "string") {
    data = new TextEncoder().encode(message).buffer as ArrayBuffer;
  } else {
    data = message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength) as ArrayBuffer;
  }
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function uploadToR2(
  bucket: string,
  objectKey: string,
  data: Uint8Array,
  contentType: string,
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  const region = "auto";
  const service = "s3";
  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
  const url = `https://${host}/${objectKey}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash = await sha256(data);

  const canonicalHeaders = 
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = 
    `PUT\n/${objectKey}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = 
    `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;

  const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + secretAccessKey), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");
  const signature = toHex(await hmacSha256(kSigning, stringToSign));

  const authHeader = 
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": payloadHash,
      Authorization: authHeader,
    },
    body: dataBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[VAULT-PREVIEW] R2 upload failed: ${response.status} - ${errorText}`);
    return { success: false, error: `R2 upload failed: ${response.status}` };
  }

  // Return public URL using environment variable
  const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL") || "";
  const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${objectKey}`;
  return { success: true, url: publicUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle POST for actions
    if (req.method === "POST") {
      const body = await req.json();
      
      // Handle upload-preview action
      if (body.action === "upload-preview") {
        console.log(`[VAULT-PREVIEW] Uploading preview for resource ${body.resourceId}`);

        // Verify admin auth
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "Missing authorization" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Verify user is admin
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();

        if (!roleData) {
          return new Response(
            JSON.stringify({ error: "Admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get R2 credentials
        const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID");
        const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID");
        const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY");
        const R2_BUCKET = Deno.env.get("R2_BUCKET_NAME") || "launchely-vault";

        if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
          return new Response(
            JSON.stringify({ error: "R2 credentials not configured" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { pdfBase64, previewKey } = body;
        if (!pdfBase64 || !previewKey) {
          return new Response(
            JSON.stringify({ error: "Missing pdfBase64 or previewKey" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Decode base64 to bytes
        const pdfBytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

        // Upload to R2
        const uploadResult = await uploadToR2(
          R2_BUCKET,
          previewKey,
          pdfBytes,
          "application/pdf",
          R2_ACCOUNT_ID,
          R2_ACCESS_KEY_ID,
          R2_SECRET_ACCESS_KEY
        );

        if (!uploadResult.success) {
          return new Response(
            JSON.stringify({ error: uploadResult.error }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[VAULT-PREVIEW] Preview uploaded: ${uploadResult.url}`);

        return new Response(
          JSON.stringify({ success: true, previewUrl: uploadResult.url }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Handle regular preview fetch via POST
      const url = body.url;
      if (!url) {
        return new Response(
          JSON.stringify({ error: "Missing url parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return await fetchAndServe(url);
    }
    
    // Handle GET for simple preview fetch
    if (req.method === "GET") {
      const urlObj = new URL(req.url);
      const url = urlObj.searchParams.get("url");
      
      if (!url) {
        return new Response(
          JSON.stringify({ error: "Missing url parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return await fetchAndServe(url);
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[VAULT-PREVIEW] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function normalizeR2PublicUrl(inputUrl: string): string {
  try {
    const parsed = new URL(inputUrl);

    const R2_PUBLIC_URL = Deno.env.get("R2_PUBLIC_URL") || "";
    if (!R2_PUBLIC_URL) return inputUrl;

    const r2Public = new URL(R2_PUBLIC_URL);

    const isR2Dev = parsed.hostname.endsWith(".r2.dev");
    const isR2S3Host = parsed.hostname.endsWith(".r2.cloudflarestorage.com");

    // If the client has a stale/incorrect R2 public domain (or a private S3-style host),
    // rewrite it to the configured public domain while keeping the path/query.
    const shouldRewrite = (isR2Dev && parsed.hostname !== r2Public.hostname) || isR2S3Host;

    if (!shouldRewrite) return inputUrl;

    const rewritten = new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, r2Public.origin);
    return rewritten.toString();
  } catch {
    return inputUrl;
  }
}

async function fetchAndServe(url: string): Promise<Response> {
  const normalizedUrl = normalizeR2PublicUrl(url);

  if (normalizedUrl !== url) {
    console.log(`[VAULT-PREVIEW] Rewriting URL for preview: ${url} -> ${normalizedUrl}`);
  }

  console.log(`[VAULT-PREVIEW] Fetching for preview: ${normalizedUrl}`);

  // Fetch the document from R2/source
  const response = await fetch(normalizedUrl);

  if (!response.ok) {
    console.error(`[VAULT-PREVIEW] Failed to fetch: ${response.status}`);
    return new Response(
      JSON.stringify({ error: `Failed to fetch document: ${response.status}` }),
      { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const ext = getFileExtension(normalizedUrl);

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
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AWS Signature V4 implementation
async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
}

async function sha256(data: ArrayBuffer | string): Promise<string> {
  const buffer = typeof data === "string" 
    ? new TextEncoder().encode(data) 
    : new Uint8Array(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSignatureKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + secretKey).buffer as ArrayBuffer, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  const kSigning = await hmacSha256(kService, "aws4_request");
  return kSigning;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

function sanitizeFilename(filename: string): string {
  // Remove path separators and other problematic characters
  return filename
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

interface UploadResult {
  url: string;
  key: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[UPLOAD-R2] Function started");

    // Parse request
    const { imageBase64, filename, subcategory } = await req.json();

    if (!imageBase64 || !filename || !subcategory) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: imageBase64, filename, subcategory" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("[UPLOAD-R2] Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
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
    const r2AccountId = Deno.env.get("R2_ACCOUNT_ID");
    const r2AccessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const r2SecretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const r2BucketName = Deno.env.get("R2_BUCKET_NAME");
    const r2PublicUrl = Deno.env.get("R2_PUBLIC_URL");

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName || !r2PublicUrl) {
      return new Response(
        JSON.stringify({ error: "Missing R2 configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare file data
    const sanitizedFilename = sanitizeFilename(filename);
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`;
    const objectKey = `Photos/${subcategory}/${uniqueFilename}`;
    
    const fileData = base64ToArrayBuffer(imageBase64);
    const contentType = getContentType(filename);

    // Dedup: hash file bytes and check for an existing resource with the same content_hash
    const contentHash = await sha256(fileData);
    const { data: existingDup } = await supabase
      .from("content_vault_resources")
      .select("id, resource_url, title, subcategory_id")
      .eq("content_hash", contentHash)
      .maybeSingle();

    if (existingDup) {
      console.log(`[UPLOAD-R2] Duplicate detected (hash=${contentHash.slice(0, 12)}…), skipping upload. Linking to ${existingDup.id}`);
      return new Response(
        JSON.stringify({
          url: existingDup.resource_url,
          key: null,
          duplicate: true,
          existingResourceId: existingDup.id,
          existingTitle: existingDup.title,
          contentHash,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[UPLOAD-R2] Uploading to: ${objectKey} (${fileData.byteLength} bytes)`);

    // AWS Signature V4 for PUT request
    const region = "auto";
    const service = "s3";
    const host = `${r2AccountId}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${r2BucketName}/${objectKey}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);

    // Create canonical request
    const method = "PUT";
    const canonicalUri = `/${r2BucketName}/${objectKey}`;
    const canonicalQueryString = "";
    const payloadHash = await sha256(fileData);
    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    // Create string to sign
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      await sha256(canonicalRequest),
    ].join("\n");

    // Calculate signature
    const signingKey = await getSignatureKey(r2SecretAccessKey, dateStamp, region, service);
    const signatureBuffer = await hmacSha256(signingKey, stringToSign);
    const signature = toHex(signatureBuffer);

    // Create authorization header
    const authorizationHeader = `${algorithm} Credential=${r2AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Upload to R2
    const uploadResponse = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Host": host,
        "Content-Type": contentType,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate,
        "Authorization": authorizationHeader,
      },
      body: new Uint8Array(fileData),
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[UPLOAD-R2] R2 upload error: ${uploadResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `R2 upload failed: ${uploadResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publicUrl = `${r2PublicUrl.replace(/\/$/, "")}/${objectKey}`;
    console.log(`[UPLOAD-R2] Upload successful: ${publicUrl}`);

    const result: UploadResult & { duplicate?: boolean; contentHash?: string } = {
      url: publicUrl,
      key: objectKey,
      duplicate: false,
      contentHash,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[UPLOAD-R2] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
    'zip': 'application/zip',
    'dng': 'image/x-adobe-dng',
    'xmp': 'application/rdf+xml',
    'lrtemplate': 'application/octet-stream',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

// Detect preset type from filename
function detectPresetType(filename: string): 'mobile' | 'desktop' {
  const lowerName = filename.toLowerCase();
  
  // Mobile indicators
  const mobileKeywords = ['mobile', 'dng', 'iphone', 'ios', 'phone', 'android'];
  if (mobileKeywords.some(kw => lowerName.includes(kw))) {
    return 'mobile';
  }
  
  // Desktop indicators
  const desktopKeywords = ['desktop', 'xmp', 'lightroom classic', 'lr classic', 'lrtemplate'];
  if (desktopKeywords.some(kw => lowerName.includes(kw))) {
    return 'desktop';
  }
  
  // Default based on extension
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'dng') return 'mobile';
  if (ext === 'xmp' || ext === 'lrtemplate') return 'desktop';
  
  // Default to desktop if unclear
  return 'desktop';
}

interface UploadResult {
  url: string;
  key: string;
  presetType: 'mobile' | 'desktop';
  resourceId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[UPLOAD-PRESET] Function started");

    // Parse request
    const { fileBase64, filename, presetType: overrideType } = await req.json();

    if (!fileBase64 || !filename) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: fileBase64, filename" }),
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
      console.error("[UPLOAD-PRESET] Auth error:", userError);
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

    // Determine preset type
    const presetType = overrideType || detectPresetType(filename);
    
    // Prepare file data
    const sanitizedFilename = sanitizeFilename(filename);
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`;
    const objectKey = `lightroom-presets/${presetType}/${uniqueFilename}`;
    
    const fileData = base64ToArrayBuffer(fileBase64);
    const contentType = getContentType(filename);

    // Dedup check
    const contentHash = await sha256(fileData);
    const { data: existingDup } = await supabase
      .from("content_vault_resources")
      .select("id, resource_url, title")
      .eq("content_hash", contentHash)
      .maybeSingle();

    if (existingDup) {
      console.log(`[UPLOAD-PRESET] Duplicate detected, linking to ${existingDup.id}`);
      return new Response(
        JSON.stringify({
          url: existingDup.resource_url,
          key: null,
          presetType,
          duplicate: true,
          existingResourceId: existingDup.id,
          existingTitle: existingDup.title,
          contentHash,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[UPLOAD-PRESET] Uploading to: ${objectKey} (${fileData.byteLength} bytes, type: ${presetType})`);

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
      console.error(`[UPLOAD-PRESET] R2 upload error: ${uploadResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `R2 upload failed: ${uploadResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publicUrl = `${r2PublicUrl.replace(/\/$/, "")}/${objectKey}`;
    console.log(`[UPLOAD-PRESET] Upload successful: ${publicUrl}`);

    // Now add to content vault database
    // First, find the Lightroom Presets category
    const { data: category } = await supabase
      .from("content_vault_categories")
      .select("id")
      .eq("slug", "lightroom-presets")
      .single();

    if (!category) {
      console.error("[UPLOAD-PRESET] Lightroom Presets category not found");
      return new Response(
        JSON.stringify({ 
          url: publicUrl, 
          key: objectKey, 
          presetType,
          warning: "Category not found, file uploaded but not added to vault" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the subcategory (mobile or desktop)
    const subcategorySlug = presetType === 'mobile' ? 'mobile' : 'desktop';
    const { data: subcategory } = await supabase
      .from("content_vault_subcategories")
      .select("id")
      .eq("category_id", category.id)
      .eq("slug", subcategorySlug)
      .single();

    if (!subcategory) {
      console.error(`[UPLOAD-PRESET] Subcategory ${subcategorySlug} not found`);
      return new Response(
        JSON.stringify({ 
          url: publicUrl, 
          key: objectKey, 
          presetType,
          warning: "Subcategory not found, file uploaded but not added to vault" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get max position
    const { data: maxPosData } = await supabase
      .from("content_vault_resources")
      .select("position")
      .eq("subcategory_id", subcategory.id)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = (maxPosData?.[0]?.position ?? 0) + 1;

    // Create a clean title from the filename
    const cleanTitle = filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[-_]/g, ' ')   // Replace dashes/underscores with spaces
      .replace(/\b\w/g, (c: string) => c.toUpperCase()) // Title case
      .replace(/\s+(mobile|desktop|dng|xmp)\s*/gi, ' ') // Remove type indicators
      .trim();

    // Insert resource
    const { data: resource, error: insertError } = await supabase
      .from("content_vault_resources")
      .insert({
        subcategory_id: subcategory.id,
        title: cleanTitle || filename,
        resource_url: publicUrl,
        resource_type: "download",
        position: nextPosition,
        content_hash: contentHash,
        tags: ['lightroom', 'preset', presetType],
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[UPLOAD-PRESET] Database insert error:", insertError);
      return new Response(
        JSON.stringify({ 
          url: publicUrl, 
          key: objectKey, 
          presetType,
          warning: `File uploaded but database insert failed: ${insertError.message}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: UploadResult & { duplicate?: boolean; contentHash?: string } = {
      url: publicUrl,
      key: objectKey,
      presetType,
      resourceId: resource?.id,
      duplicate: false,
      contentHash,
    };

    console.log(`[UPLOAD-PRESET] Complete: ${publicUrl}, resourceId: ${resource?.id}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[UPLOAD-PRESET] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

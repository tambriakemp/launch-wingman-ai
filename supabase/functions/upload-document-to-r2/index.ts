import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Document file extensions and MIME types
const DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".doc", ".rtf"];
const DOCUMENT_MIME_TYPES: Record<string, string> = {
  'pdf': 'application/pdf',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'doc': 'application/msword',
  'rtf': 'application/rtf',
};

// Type colors for thumbnail generation
const TYPE_COLORS: Record<string, { bg: string; fg: string; icon: string }> = {
  'pdf': { bg: '#DC2626', fg: '#FFFFFF', icon: 'PDF' },
  'docx': { bg: '#2563EB', fg: '#FFFFFF', icon: 'DOCX' },
  'doc': { bg: '#2563EB', fg: '#FFFFFF', icon: 'DOC' },
  'rtf': { bg: '#059669', fg: '#FFFFFF', icon: 'RTF' },
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
  return DOCUMENT_MIME_TYPES[ext || ''] || 'application/octet-stream';
}

function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return ext;
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function isValidDocumentFile(filename: string): boolean {
  const ext = '.' + getFileExtension(filename);
  return DOCUMENT_EXTENSIONS.includes(ext);
}

// Generate a styled SVG thumbnail for the document
function generateDocumentThumbnailSVG(title: string, fileType: string): string {
  const colors = TYPE_COLORS[fileType] || TYPE_COLORS['pdf'];
  const truncatedTitle = title.length > 40 ? title.substring(0, 37) + '...' : title;
  
  // Split title into lines for better display
  const words = truncatedTitle.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length > 20) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  // Limit to 3 lines
  const displayLines = lines.slice(0, 3);
  if (lines.length > 3) {
    displayLines[2] = displayLines[2].substring(0, displayLines[2].length - 3) + '...';
  }
  
  const lineHeight = 24;
  const startY = 130 - (displayLines.length * lineHeight) / 2;
  
  const titleLines = displayLines.map((line, i) => 
    `<text x="120" y="${startY + i * lineHeight}" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#374151" text-anchor="middle" font-weight="500">${escapeXml(line)}</text>`
  ).join('\n    ');

  return `<svg width="240" height="180" viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F9FAFB"/>
      <stop offset="100%" style="stop-color:#F3F4F6"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.1"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="240" height="180" fill="url(#bgGrad)" rx="12"/>
  
  <!-- Document icon -->
  <g transform="translate(85, 20)" filter="url(#shadow)">
    <rect width="70" height="85" fill="white" rx="4"/>
    <path d="M50 0 L70 20 L70 85 L0 85 L0 0 Z M50 0 L50 20 L70 20" fill="#E5E7EB"/>
    <rect x="10" y="35" width="50" height="4" fill="#D1D5DB" rx="2"/>
    <rect x="10" y="45" width="40" height="4" fill="#D1D5DB" rx="2"/>
    <rect x="10" y="55" width="45" height="4" fill="#D1D5DB" rx="2"/>
    <rect x="10" y="65" width="35" height="4" fill="#D1D5DB" rx="2"/>
  </g>
  
  <!-- File type badge -->
  <rect x="145" y="75" width="50" height="24" fill="${colors.bg}" rx="4"/>
  <text x="170" y="92" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="${colors.fg}" text-anchor="middle" font-weight="700">${colors.icon}</text>
  
  <!-- Title -->
  ${titleLines}
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface UploadResult {
  url: string;
  key: string;
  thumbnailUrl?: string;
  resourceId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[UPLOAD-DOCUMENT] Function started");

    // Parse request
    const { fileBase64, filename, subcategory, subcategoryName, title } = await req.json();

    if (!fileBase64 || !filename || !subcategory) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: fileBase64, filename, subcategory" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidDocumentFile(filename)) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Supported: PDF, DOCX, DOC, RTF" }),
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
      console.error("[UPLOAD-DOCUMENT] Auth error:", userError);
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
    const objectKey = `business-documents/${subcategory}/${uniqueFilename}`;
    
    const fileData = base64ToArrayBuffer(fileBase64);
    const contentType = getContentType(filename);
    const fileExtension = getFileExtension(filename);

    console.log(`[UPLOAD-DOCUMENT] Uploading to: ${objectKey} (${fileData.byteLength} bytes)`);

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
      console.error(`[UPLOAD-DOCUMENT] R2 upload error: ${uploadResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `R2 upload failed: ${uploadResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publicUrl = `${r2PublicUrl.replace(/\/$/, "")}/${objectKey}`;
    console.log(`[UPLOAD-DOCUMENT] Upload successful: ${publicUrl}`);

    // Generate and upload thumbnail
    const docTitle = title || filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const thumbnailSVG = generateDocumentThumbnailSVG(docTitle, fileExtension);
    const thumbnailBlob = new Blob([thumbnailSVG], { type: 'image/svg+xml' });
    const thumbnailPath = `document-thumbnails/${timestamp}-${sanitizedFilename.replace(/\.[^/.]+$/, '')}.svg`;

    let thumbnailUrl: string | undefined;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('content-media')
      .upload(thumbnailPath, thumbnailBlob, {
        contentType: 'image/svg+xml',
        upsert: true,
      });

    if (uploadError) {
      console.error("[UPLOAD-DOCUMENT] Thumbnail upload error:", uploadError);
    } else {
      const { data: urlData } = supabase.storage
        .from('content-media')
        .getPublicUrl(thumbnailPath);
      thumbnailUrl = urlData.publicUrl;
      console.log(`[UPLOAD-DOCUMENT] Thumbnail uploaded: ${thumbnailUrl}`);
    }

    // Add to content vault database
    const { data: category } = await supabase
      .from("content_vault_categories")
      .select("id")
      .eq("slug", "business-documents")
      .single();

    if (!category) {
      console.error("[UPLOAD-DOCUMENT] Business Documents category not found");
      return new Response(
        JSON.stringify({ 
          url: publicUrl, 
          key: objectKey,
          thumbnailUrl,
          warning: "Category not found, file uploaded but not added to vault" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find or create the subcategory
    let { data: subcategoryData } = await supabase
      .from("content_vault_subcategories")
      .select("id")
      .eq("category_id", category.id)
      .eq("slug", subcategory)
      .single();

    // If subcategory doesn't exist, create it
    if (!subcategoryData) {
      console.log(`[UPLOAD-DOCUMENT] Creating new subcategory: ${subcategory} (${subcategoryName || subcategory})`);
      
      // Get max position for subcategories in this category
      const { data: maxPosSubcat } = await supabase
        .from("content_vault_subcategories")
        .select("position")
        .eq("category_id", category.id)
        .order("position", { ascending: false })
        .limit(1);
      
      const nextSubcatPosition = (maxPosSubcat?.[0]?.position ?? 0) + 1;
      
      // Create the subcategory
      const displayName = subcategoryName || subcategory.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      
      const { data: newSubcat, error: subcatError } = await supabase
        .from("content_vault_subcategories")
        .insert({
          category_id: category.id,
          slug: subcategory,
          name: displayName,
          position: nextSubcatPosition,
        })
        .select("id")
        .single();
      
      if (subcatError) {
        console.error("[UPLOAD-DOCUMENT] Failed to create subcategory:", subcatError);
        return new Response(
          JSON.stringify({ 
            url: publicUrl, 
            key: objectKey,
            thumbnailUrl,
            warning: `File uploaded but failed to create subcategory: ${subcatError.message}` 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      subcategoryData = newSubcat;
      console.log(`[UPLOAD-DOCUMENT] Created subcategory: ${displayName} (id: ${newSubcat?.id})`);
    }

    // Get max position
    const { data: maxPosData } = await supabase
      .from("content_vault_resources")
      .select("position")
      .eq("subcategory_id", subcategoryData.id)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = (maxPosData?.[0]?.position ?? 0) + 1;

    // Insert resource
    const { data: resource, error: insertError } = await supabase
      .from("content_vault_resources")
      .insert({
        subcategory_id: subcategoryData.id,
        title: docTitle,
        resource_url: publicUrl,
        resource_type: "document",
        cover_image_url: thumbnailUrl,
        position: nextPosition,
        tags: ['document', fileExtension, subcategory],
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[UPLOAD-DOCUMENT] Database insert error:", insertError);
      return new Response(
        JSON.stringify({ 
          url: publicUrl, 
          key: objectKey,
          thumbnailUrl,
          warning: `File uploaded but database insert failed: ${insertError.message}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: UploadResult = {
      url: publicUrl,
      key: objectKey,
      thumbnailUrl,
      resourceId: resource?.id
    };

    console.log(`[UPLOAD-DOCUMENT] Complete: ${publicUrl}, resourceId: ${resource?.id}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[UPLOAD-DOCUMENT] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
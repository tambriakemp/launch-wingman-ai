import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PhotoInput {
  id: string;
  imageBase64: string;
  filename: string;
  subcategory?: string; // If provided, skip AI analysis
}

interface PhotoResult {
  id: string;
  success: boolean;
  url?: string;
  subcategory?: string;
  confidence?: number;
  error?: string;
  duplicate?: boolean;
  existingResourceId?: string;
}

interface BatchResult {
  results: PhotoResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// AWS Signature V4 implementation (duplicated for edge function isolation)
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
  return filename
    .replace(/[\/\\]/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function cleanFilename(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, "");
  return withoutExt
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Photo categories for AI analysis
const PHOTO_CATEGORIES = {
  "lifestyle": "Lifestyle photos - people using products, candid moments, real-life scenarios",
  "flat-lays": "Flat lay photos - top-down shots of arranged items on a flat surface",
  "workspace": "Workspace photos - desk setups, office environments, work-from-home scenes",
  "nature": "Nature photos - outdoor scenes, plants, landscapes, natural elements",
  "mockups": "Mockup photos - product mockups, device frames, template-style images",
  "dark-aesthetic": "Dark aesthetic photos - moody, dark-toned images with dramatic lighting"
};

async function analyzePhoto(
  imageBase64: string,
  filename: string,
  lovableApiKey: string
): Promise<{ subcategory: string; confidence: number }> {
  const categoryDescriptions = Object.entries(PHOTO_CATEGORIES)
    .map(([slug, desc]) => `- ${slug}: ${desc}`)
    .join("\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are an expert photo categorization assistant." },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Categorize this photo into ONE of these categories:\n${categoryDescriptions}\n\nFilename: ${filename}` 
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            }
          ]
        }
      ],
      tools: [{
        type: "function",
        function: {
          name: "categorize_photo",
          description: "Categorize the photo",
          parameters: {
            type: "object",
            properties: {
              subcategory: {
                type: "string",
                enum: ["lifestyle", "flat-lays", "workspace", "nature", "mockups", "dark-aesthetic"]
              },
              confidence: { type: "number", minimum: 0, maximum: 100 }
            },
            required: ["subcategory", "confidence"],
            additionalProperties: false
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "categorize_photo" } }
    }),
  });

  if (!response.ok) {
    throw new Error(`AI analysis failed: ${response.status}`);
  }

  const aiResponse = await response.json();
  const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
  
  if (toolCall?.function?.arguments) {
    const parsed = JSON.parse(toolCall.function.arguments);
    return {
      subcategory: parsed.subcategory || "lifestyle",
      confidence: parsed.confidence || 50
    };
  }
  
  return { subcategory: "lifestyle", confidence: 50 };
}

async function uploadToR2(
  imageBase64: string,
  filename: string,
  subcategory: string,
  r2Config: { accountId: string; accessKeyId: string; secretAccessKey: string; bucketName: string; publicUrl: string }
): Promise<{ url: string; key: string }> {
  const sanitizedFilename = sanitizeFilename(filename);
  const timestamp = Date.now();
  const uniqueFilename = `${timestamp}-${sanitizedFilename}`;
  const objectKey = `Photos/${subcategory}/${uniqueFilename}`;
  
  const fileData = base64ToArrayBuffer(imageBase64);
  const contentType = getContentType(filename);

  const region = "auto";
  const service = "s3";
  const host = `${r2Config.accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${r2Config.bucketName}/${objectKey}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const method = "PUT";
  const canonicalUri = `/${r2Config.bucketName}/${objectKey}`;
  const payloadHash = await sha256(fileData);
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [method, canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [algorithm, amzDate, credentialScope, await sha256(canonicalRequest)].join("\n");

  const signingKey = await getSignatureKey(r2Config.secretAccessKey, dateStamp, region, service);
  const signatureBuffer = await hmacSha256(signingKey, stringToSign);
  const signature = toHex(signatureBuffer);
  const authorizationHeader = `${algorithm} Credential=${r2Config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

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
    throw new Error(`R2 upload failed: ${uploadResponse.status}`);
  }

  return {
    url: `${r2Config.publicUrl.replace(/\/$/, "")}/${objectKey}`,
    key: objectKey
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[PROCESS-BATCH] Function started");

    const { photos } = await req.json() as { photos: PhotoInput[] };

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or empty photos array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (photos.length > 20) {
      return new Response(
        JSON.stringify({ error: "Maximum 20 photos per batch" }),
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

    // Get required credentials
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const r2Config = {
      accountId: Deno.env.get("R2_ACCOUNT_ID")!,
      accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
      secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
      bucketName: Deno.env.get("R2_BUCKET_NAME")!,
      publicUrl: Deno.env.get("R2_PUBLIC_URL")!
    };

    if (!lovableApiKey || !r2Config.accountId || !r2Config.accessKeyId || !r2Config.secretAccessKey || !r2Config.bucketName || !r2Config.publicUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get photos category and subcategories
    const { data: photosCategory } = await supabase
      .from("content_vault_categories")
      .select("id")
      .eq("slug", "photos")
      .single();

    if (!photosCategory) {
      return new Response(
        JSON.stringify({ error: "Photos category not found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create subcategories
    const { data: existingSubcategories } = await supabase
      .from("content_vault_subcategories")
      .select("id, slug")
      .eq("category_id", photosCategory.id);

    const subcategoryMap = new Map<string, string>();
    existingSubcategories?.forEach(sub => subcategoryMap.set(sub.slug, sub.id));

    // Process each photo
    const results: PhotoResult[] = [];

    for (const photo of photos) {
      try {
        console.log(`[PROCESS-BATCH] Processing photo: ${photo.id}`);

        // Step 0: Compute content hash and dedup-check up front
        const fileBytes = base64ToArrayBuffer(photo.imageBase64);
        const contentHash = await sha256(fileBytes);

        const { data: existingDup } = await supabase
          .from("content_vault_resources")
          .select("id, resource_url, subcategory_id, content_vault_subcategories(slug)")
          .eq("content_hash", contentHash)
          .maybeSingle();

        if (existingDup) {
          console.log(`[PROCESS-BATCH] Duplicate ${photo.id} → existing ${existingDup.id}`);
          results.push({
            id: photo.id,
            success: true,
            duplicate: true,
            existingResourceId: existingDup.id,
            url: existingDup.resource_url,
            subcategory: (existingDup as any).content_vault_subcategories?.slug,
            confidence: 100,
          });
          continue;
        }

        // Step 1: Analyze if no subcategory provided
        let subcategory: string = photo.subcategory || "";
        let confidence = 100;

        if (!subcategory) {
          const analysis = await analyzePhoto(photo.imageBase64, photo.filename, lovableApiKey);
          subcategory = analysis.subcategory;
          confidence = analysis.confidence;
          console.log(`[PROCESS-BATCH] AI categorized as: ${subcategory} (${confidence}%)`);
        }

        // Step 2: Ensure subcategory exists
        let subcategoryId = subcategoryMap.get(subcategory);
        if (!subcategoryId) {
          const { data: newSubcategory, error: subError } = await supabase
            .from("content_vault_subcategories")
            .insert({
              name: subcategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              slug: subcategory,
              category_id: photosCategory.id,
              position: subcategoryMap.size
            })
            .select("id")
            .single();

          if (subError) {
            throw new Error(`Failed to create subcategory: ${subError.message}`);
          }
          subcategoryId = newSubcategory.id;
          subcategoryMap.set(subcategory, subcategoryId!);
        }

        // Step 3: Upload to R2
        const uploadResult = await uploadToR2(photo.imageBase64, photo.filename, subcategory, r2Config);
        console.log(`[PROCESS-BATCH] Uploaded to: ${uploadResult.url}`);

        // Step 4: Get max position for ordering
        const { data: maxPosData } = await supabase
          .from("content_vault_resources")
          .select("position")
          .eq("subcategory_id", subcategoryId)
          .order("position", { ascending: false })
          .limit(1)
          .single();

        const nextPosition = (maxPosData?.position ?? -1) + 1;

        // Step 5: Insert into content vault
        const { error: insertError } = await supabase
          .from("content_vault_resources")
          .insert({
            title: cleanFilename(photo.filename),
            resource_url: uploadResult.url,
            resource_type: "image",
            subcategory_id: subcategoryId,
            position: nextPosition,
            content_hash: contentHash,
            tags: [subcategory, "bulk-upload"]
          });

        if (insertError) {
          throw new Error(`Failed to insert resource: ${insertError.message}`);
        }

        results.push({
          id: photo.id,
          success: true,
          url: uploadResult.url,
          subcategory,
          confidence
        });

      } catch (error) {
        console.error(`[PROCESS-BATCH] Error processing ${photo.id}:`, error);
        results.push({
          id: photo.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    const batchResult: BatchResult = {
      results,
      summary: {
        total: photos.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };

    console.log(`[PROCESS-BATCH] Batch complete: ${batchResult.summary.successful}/${batchResult.summary.total} successful`);

    return new Response(
      JSON.stringify(batchResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[PROCESS-BATCH] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

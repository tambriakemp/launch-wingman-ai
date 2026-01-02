import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// File extension helpers
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm", ".mkv", ".m4v"];

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.slice(lastDot).toLowerCase() : "";
}

function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.includes(getFileExtension(filename));
}

function isVideoFile(filename: string): boolean {
  return VIDEO_EXTENSIONS.includes(getFileExtension(filename));
}

function cleanFilename(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, "");
  return withoutExt
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function parsePath(key: string): { category: string; subcategory: string; filename: string } | null {
  const parts = key.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  const filename = parts[parts.length - 1];
  if (parts.length === 1) {
    return { category: "general", subcategory: "general", filename };
  }
  if (parts.length === 2) {
    return { category: parts[0].toLowerCase(), subcategory: "general", filename };
  }
  return {
    category: parts[0].toLowerCase(),
    subcategory: parts[1].toLowerCase(),
    filename,
  };
}

// AWS Signature V4 implementation using Web Crypto API
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

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
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

interface R2ListResult {
  keys: string[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}

async function listR2Objects(
  accountId: string,
  bucketName: string,
  accessKeyId: string,
  secretAccessKey: string,
  continuationToken?: string
): Promise<R2ListResult> {
  const region = "auto";
  const service = "s3";
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${bucketName}`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.set("list-type", "2");
  queryParams.set("max-keys", "1000");
  if (continuationToken) {
    queryParams.set("continuation-token", continuationToken);
  }
  const queryString = queryParams.toString();

  // Create canonical request
  const method = "GET";
  const canonicalUri = `/${bucketName}`;
  const canonicalQueryString = queryString
    .split("&")
    .sort()
    .join("&");
  const payloadHash = await sha256("");
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";

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
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signatureBuffer = await hmacSha256(signingKey, stringToSign);
  const signature = toHex(signatureBuffer);

  // Create authorization header
  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  // Make request
  const url = `${endpoint}?${queryString}`;
  console.log(`[SYNC-R2] Listing objects from R2...`);
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Host: host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorizationHeader,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[SYNC-R2] R2 API error: ${response.status} - ${errorText.slice(0, 500)}`);
    throw new Error(`R2 API error: ${response.status} - ${errorText.slice(0, 200)}`);
  }

  const xmlText = await response.text();
  
  // Parse XML response
  const keys: string[] = [];
  const keyMatches = xmlText.matchAll(/<Key>([^<]+)<\/Key>/g);
  for (const match of keyMatches) {
    keys.push(match[1]);
  }

  const isTruncatedMatch = xmlText.match(/<IsTruncated>(true|false)<\/IsTruncated>/);
  const isTruncated = isTruncatedMatch?.[1] === "true";

  const tokenMatch = xmlText.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
  const nextToken = tokenMatch?.[1];

  console.log(`[SYNC-R2] Found ${keys.length} objects, truncated: ${isTruncated}`);

  return {
    keys,
    isTruncated,
    nextContinuationToken: nextToken,
  };
}

async function listAllR2Objects(
  accountId: string,
  bucketName: string,
  accessKeyId: string,
  secretAccessKey: string
): Promise<string[]> {
  const allKeys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const result = await listR2Objects(
      accountId,
      bucketName,
      accessKeyId,
      secretAccessKey,
      continuationToken
    );
    allKeys.push(...result.keys);
    continuationToken = result.isTruncated ? result.nextContinuationToken : undefined;
  } while (continuationToken);

  return allKeys;
}

interface SyncResult {
  added: number;
  skipped: number;
  errors: string[];
  files: { path: string; action: string }[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[SYNC-R2] Function started");

    // Get R2 credentials from environment
    const r2AccountId = Deno.env.get("R2_ACCOUNT_ID");
    const r2AccessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const r2SecretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const r2BucketName = Deno.env.get("R2_BUCKET_NAME");
    const r2PublicUrl = Deno.env.get("R2_PUBLIC_URL");

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName || !r2PublicUrl) {
      console.error("[SYNC-R2] Missing R2 configuration");
      return new Response(
        JSON.stringify({ error: "Missing R2 configuration. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      console.error("[SYNC-R2] Auth error:", userError);
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
      console.error("[SYNC-R2] User is not admin");
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[SYNC-R2] Admin verified, listing R2 objects...");

    // Define allowed folder prefixes (only sync from these folders)
    const ALLOWED_PREFIXES = ["Photos/", "Videos/", "photos/", "videos/"];

    // List all objects from R2
    const allKeys = await listAllR2Objects(r2AccountId, r2BucketName, r2AccessKeyId, r2SecretAccessKey);
    console.log(`[SYNC-R2] Total objects found: ${allKeys.length}`);

    // Filter to only media files within allowed folders
    const mediaKeys = allKeys.filter((key) => {
      // Check if file is in an allowed folder
      const isInAllowedFolder = ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix));
      if (!isInAllowedFolder) {
        return false;
      }
      // Check if it's a media file
      return isImageFile(key) || isVideoFile(key);
    });
    console.log(`[SYNC-R2] Media files in allowed folders: ${mediaKeys.length}`);

    // Get existing categories
    const { data: categories } = await supabase
      .from("content_vault_categories")
      .select("id, slug");

    const photosCategory = categories?.find((c) => c.slug === "photos");
    const videosCategory = categories?.find((c) => c.slug === "videos");

    if (!photosCategory || !videosCategory) {
      return new Response(
        JSON.stringify({ error: "Photos or Videos category not found in vault" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing subcategories
    const { data: existingSubcategories } = await supabase
      .from("content_vault_subcategories")
      .select("id, slug, category_id");

    // Get existing resources to avoid duplicates
    const { data: existingResources } = await supabase
      .from("content_vault_resources")
      .select("resource_url");

    const existingUrls = new Set(existingResources?.map((r) => r.resource_url) || []);

    const result: SyncResult = { added: 0, skipped: 0, errors: [], files: [] };
    const subcategoryCache = new Map<string, string>();

    // Pre-populate cache with existing subcategories
    existingSubcategories?.forEach((sub) => {
      const key = `${sub.category_id}:${sub.slug}`;
      subcategoryCache.set(key, sub.id);
    });

    for (const key of mediaKeys) {
      try {
        const resourceUrl = `${r2PublicUrl.replace(/\/$/, "")}/${key}`;

        if (existingUrls.has(resourceUrl)) {
          result.skipped++;
          result.files.push({ path: key, action: "skipped (exists)" });
          continue;
        }

        const parsed = parsePath(key);
        if (!parsed) {
          result.skipped++;
          result.files.push({ path: key, action: "skipped (invalid path)" });
          continue;
        }

        const isImage = isImageFile(parsed.filename);
        const targetCategoryId = isImage ? photosCategory.id : videosCategory.id;
        const subcategorySlug = parsed.subcategory.replace(/\s+/g, "-").toLowerCase();

        // Get or create subcategory
        const cacheKey = `${targetCategoryId}:${subcategorySlug}`;
        let subcategoryId = subcategoryCache.get(cacheKey);

        if (!subcategoryId) {
          // Get max position
          const { data: maxPosData } = await supabase
            .from("content_vault_subcategories")
            .select("position")
            .eq("category_id", targetCategoryId)
            .order("position", { ascending: false })
            .limit(1);

          const nextPosition = (maxPosData?.[0]?.position ?? 0) + 1;

          const { data: newSub, error: subError } = await supabase
            .from("content_vault_subcategories")
            .insert({
              category_id: targetCategoryId,
              name: parsed.subcategory.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              slug: subcategorySlug,
              position: nextPosition,
            })
            .select("id")
            .single();

          if (subError) {
            result.errors.push(`Failed to create subcategory for ${key}: ${subError.message}`);
            continue;
          }

          subcategoryId = newSub.id;
          subcategoryCache.set(cacheKey, subcategoryId!);
        }

        // Get max position for resource
        const { data: maxResPos } = await supabase
          .from("content_vault_resources")
          .select("position")
          .eq("subcategory_id", subcategoryId)
          .order("position", { ascending: false })
          .limit(1);

        const resourcePosition = (maxResPos?.[0]?.position ?? 0) + 1;

        // Insert resource
        const { error: insertError } = await supabase.from("content_vault_resources").insert({
          subcategory_id: subcategoryId,
          title: cleanFilename(parsed.filename),
          resource_url: resourceUrl,
          resource_type: isImage ? "image" : "video",
          position: resourcePosition,
        });

        if (insertError) {
          result.errors.push(`Failed to insert ${key}: ${insertError.message}`);
          continue;
        }

        result.added++;
        result.files.push({ path: key, action: "added" });
        existingUrls.add(resourceUrl);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        result.errors.push(`Error processing ${key}: ${errorMessage}`);
      }
    }

    console.log(`[SYNC-R2] Sync complete: added=${result.added}, skipped=${result.skipped}, errors=${result.errors.length}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("[SYNC-R2] Fatal error:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: errorMessage || "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

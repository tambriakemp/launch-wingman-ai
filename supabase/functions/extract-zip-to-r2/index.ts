import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { unzipSync, strFromU8 } from "npm:fflate@0.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- AWS SigV4 ----------
async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
}
async function sha256Hex(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  const buf = typeof data === "string" ? new TextEncoder().encode(data) : data instanceof Uint8Array ? data : new Uint8Array(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}
async function getSignatureKey(secretKey: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + secretKey).buffer as ArrayBuffer, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return await hmacSha256(kService, "aws4_request");
}

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[\/\\]/g, '-').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').toLowerCase();
}

function cleanTitle(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()).trim();
}

// ---------- Type detection ----------
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
const VIDEO_EXTS = ["mp4", "mov", "webm", "m4v", "avi"];
const PRESET_EXTS = ["dng", "xmp", "lrtemplate"];
const LUT_EXTS = ["cube", "3dl", "look", "lut", "mga", "m3d", "csp", "vlt"];
const DOC_EXTS = ["pdf", "docx", "doc", "rtf"];

type FileKind = "image" | "video" | "preset" | "lut" | "document" | "unknown";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif",
  webp: "image/webp", bmp: "image/bmp", svg: "image/svg+xml",
  mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", m4v: "video/x-m4v", avi: "video/x-msvideo",
  dng: "image/x-adobe-dng", xmp: "application/rdf+xml", lrtemplate: "application/octet-stream",
  cube: "application/octet-stream", "3dl": "application/octet-stream", look: "application/octet-stream",
  lut: "application/octet-stream", mga: "application/octet-stream", m3d: "application/octet-stream",
  csp: "application/octet-stream", vlt: "application/octet-stream",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  rtf: "application/rtf",
};

function getExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}
function classify(name: string): FileKind {
  const ext = getExt(name);
  if (IMAGE_EXTS.includes(ext)) return "image";
  if (VIDEO_EXTS.includes(ext)) return "video";
  if (PRESET_EXTS.includes(ext)) return "preset";
  if (LUT_EXTS.includes(ext)) return "lut";
  if (DOC_EXTS.includes(ext)) return "document";
  return "unknown";
}
function detectPresetType(name: string): "mobile" | "desktop" {
  const lower = name.toLowerCase();
  if (["mobile", "dng", "iphone", "ios", "phone", "android"].some(k => lower.includes(k))) return "mobile";
  if (["desktop", "xmp", "lightroom classic", "lr classic", "lrtemplate"].some(k => lower.includes(k))) return "desktop";
  const ext = getExt(name);
  if (ext === "dng") return "mobile";
  return "desktop";
}

// Slugify a folder name into a subcategory slug
function slugifyFolder(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Derive subcategory slug from the folder path inside the zip.
// Uses the deepest folder containing the file (e.g. "LUTs/Cinematic/Warm/file.cube" -> "warm").
// Returns null if file is at the root.
function deriveFolderSubcategory(entryPath: string): string | null {
  const parts = entryPath.split("/").filter(Boolean);
  if (parts.length < 2) return null; // file is at root
  const folder = parts[parts.length - 2];
  // Skip generic top-level wrappers
  if (["luts", "lut", "presets", "preset", "photos", "videos", "documents"].includes(folder.toLowerCase())) {
    if (parts.length < 3) return null;
    return slugifyFolder(parts[parts.length - 3] || folder);
  }
  return slugifyFolder(folder);
}

// ---------- R2 upload ----------
interface R2Config {
  accountId: string; accessKeyId: string; secretAccessKey: string; bucketName: string; publicUrl: string;
}

async function putToR2(bytes: Uint8Array, objectKey: string, contentType: string, cfg: R2Config): Promise<string> {
  const region = "auto";
  const service = "s3";
  const host = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${cfg.bucketName}/${objectKey}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(bytes);
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", `/${cfg.bucketName}/${objectKey}`, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256Hex(canonicalRequest)].join("\n");
  const signingKey = await getSignatureKey(cfg.secretAccessKey, dateStamp, region, service);
  const signature = toHex(await hmacSha256(signingKey, stringToSign));
  const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Host: host,
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    },
    body: bytes,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`R2 PUT ${objectKey} failed: ${res.status} ${t.slice(0, 200)}`);
  }
  return `${cfg.publicUrl.replace(/\/$/, "")}/${objectKey}`;
}

interface FileResult {
  name: string;
  status: "uploaded" | "skipped_duplicate" | "failed" | "skipped_unsupported";
  url?: string;
  existingResourceId?: string;
  category?: string;
  subcategory?: string;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const zipBase64: string | undefined = body.zipBase64;
    const filename: string = body.filename || "upload.zip";
    // Optional: caller can pass a default subcategory slug for routing
    const defaultSubcategorySlug: string | undefined = body.defaultSubcategorySlug;

    if (!zipBase64) {
      return new Response(JSON.stringify({ error: "Missing zipBase64" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleData } = await supabase
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const r2: R2Config = {
      accountId: Deno.env.get("R2_ACCOUNT_ID")!,
      accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
      secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
      bucketName: Deno.env.get("R2_BUCKET_NAME")!,
      publicUrl: Deno.env.get("R2_PUBLIC_URL")!,
    };
    if (!r2.accountId || !r2.accessKeyId || !r2.secretAccessKey || !r2.bucketName || !r2.publicUrl) {
      return new Response(JSON.stringify({ error: "Missing R2 configuration" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---------- Unzip ----------
    console.log(`[EXTRACT-ZIP] Unzipping ${filename} (${Math.round(zipBase64.length * 0.75 / 1024)} KB)`);
    const zipBytes = base64ToUint8Array(zipBase64);
    let entries: Record<string, Uint8Array>;
    try {
      entries = unzipSync(zipBytes);
    } catch (e) {
      return new Response(JSON.stringify({ error: `Failed to unzip: ${e instanceof Error ? e.message : String(e)}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pre-fetch category/subcategory id lookups
    const categoriesBySlug = new Map<string, string>();
    const { data: cats } = await supabase
      .from("content_vault_categories")
      .select("id, slug");
    cats?.forEach((c: any) => categoriesBySlug.set(c.slug, c.id));

    // Cache subcategory ids: key = `${categoryId}:${slug}`
    const subcatCache = new Map<string, string>();
    async function getOrCreateSubcategory(categoryId: string, slug: string): Promise<string | null> {
      const key = `${categoryId}:${slug}`;
      if (subcatCache.has(key)) return subcatCache.get(key)!;
      const { data: existing } = await supabase
        .from("content_vault_subcategories")
        .select("id")
        .eq("category_id", categoryId).eq("slug", slug).maybeSingle();
      if (existing?.id) {
        subcatCache.set(key, existing.id);
        return existing.id;
      }
      // Create new subcategory
      const { data: maxPos } = await supabase
        .from("content_vault_subcategories")
        .select("position").eq("category_id", categoryId)
        .order("position", { ascending: false }).limit(1);
      const nextPos = (maxPos?.[0]?.position ?? 0) + 1;
      const name = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      const { data: created, error: createErr } = await supabase
        .from("content_vault_subcategories")
        .insert({ category_id: categoryId, slug, name, position: nextPos })
        .select("id").single();
      if (createErr || !created) {
        console.error(`[EXTRACT-ZIP] Failed to create subcategory ${slug}:`, createErr);
        return null;
      }
      subcatCache.set(key, created.id);
      return created.id;
    }

    const results: FileResult[] = [];
    let uploaded = 0, skippedDup = 0, failed = 0, unsupported = 0;

    for (const [entryName, entryBytes] of Object.entries(entries)) {
      // Skip directories and macOS metadata
      if (entryName.endsWith("/") || entryName.includes("__MACOSX/") || entryName.split("/").pop()?.startsWith("._")) continue;

      const baseName = entryName.split("/").pop() || entryName;
      const kind = classify(baseName);
      if (kind === "unknown") {
        unsupported++;
        results.push({ name: entryName, status: "skipped_unsupported" });
        continue;
      }

      try {
        // Derive subcategory from folder structure inside the zip (if any)
        const folderSubcat = deriveFolderSubcategory(entryName);

        // Determine target category + subcategory
        let categorySlug: string;
        let subcategorySlug: string;
        if (kind === "image") {
          categorySlug = "photos";
          subcategorySlug = folderSubcat || defaultSubcategorySlug || "lifestyle";
        } else if (kind === "video") {
          categorySlug = "videos";
          subcategorySlug = folderSubcat || defaultSubcategorySlug || "general";
        } else if (kind === "preset") {
          categorySlug = "lightroom-presets";
          subcategorySlug = folderSubcat || detectPresetType(baseName);
        } else if (kind === "lut") {
          categorySlug = "luts";
          subcategorySlug = folderSubcat || defaultSubcategorySlug || "general";
        } else {
          categorySlug = "business-documents";
          subcategorySlug = folderSubcat || defaultSubcategorySlug || "general";
        }

        const categoryId = categoriesBySlug.get(categorySlug);
        if (!categoryId) {
          failed++;
          results.push({ name: entryName, status: "failed", error: `Category ${categorySlug} not found` });
          continue;
        }
        const subcatId = await getOrCreateSubcategory(categoryId, subcategorySlug);
        if (!subcatId) {
          failed++;
          results.push({ name: entryName, status: "failed", error: `Subcategory ${subcategorySlug} could not be created` });
          continue;
        }

        // Hash + dedup
        const contentHash = await sha256Hex(entryBytes);
        const { data: dup } = await supabase
          .from("content_vault_resources")
          .select("id, resource_url")
          .eq("content_hash", contentHash)
          .maybeSingle();

        if (dup) {
          skippedDup++;
          results.push({
            name: entryName, status: "skipped_duplicate",
            existingResourceId: dup.id, url: dup.resource_url,
            category: categorySlug, subcategory: subcategorySlug,
          });
          continue;
        }

        // Upload to R2
        const ext = getExt(baseName);
        const contentType = MIME_BY_EXT[ext] || "application/octet-stream";
        const sanitized = sanitizeFilename(baseName);
        const timestamp = Date.now();
        const objectKey = (() => {
          if (kind === "image") return `Photos/${subcategorySlug}/${timestamp}-${sanitized}`;
          if (kind === "video") return `Videos/${subcategorySlug}/${timestamp}-${sanitized}`;
          if (kind === "preset") return `lightroom-presets/${subcategorySlug}/${timestamp}-${sanitized}`;
          if (kind === "lut") return `luts/${subcategorySlug}/${timestamp}-${sanitized}`;
          return `business-documents/${subcategorySlug}/${timestamp}-${sanitized}`;
        })();

        const url = await putToR2(entryBytes, objectKey, contentType, r2);

        const { data: maxPosData } = await supabase
          .from("content_vault_resources")
          .select("position").eq("subcategory_id", subcatId)
          .order("position", { ascending: false }).limit(1);
        const nextPosition = (maxPosData?.[0]?.position ?? 0) + 1;

        const resourceType = (kind === "image" || kind === "video") ? kind : (kind === "document" ? "document" : "download");
        const tags = kind === "preset"
          ? ["lightroom", "preset", subcategorySlug, "zip-upload"]
          : kind === "lut"
            ? ["lut", "color-grading", subcategorySlug, "zip-upload"]
            : [kind, subcategorySlug, "zip-upload"];

        const { error: insertErr } = await supabase
          .from("content_vault_resources")
          .insert({
            subcategory_id: subcatId,
            title: cleanTitle(baseName),
            resource_url: url,
            resource_type: resourceType,
            position: nextPosition,
            content_hash: contentHash,
            tags,
          });

        if (insertErr) {
          throw new Error(`DB insert failed: ${insertErr.message}`);
        }

        uploaded++;
        results.push({
          name: entryName, status: "uploaded", url,
          category: categorySlug, subcategory: subcategorySlug,
        });
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[EXTRACT-ZIP] ${entryName} failed:`, msg);
        results.push({ name: entryName, status: "failed", error: msg });
      }
    }

    console.log(`[EXTRACT-ZIP] Done: ${uploaded} uploaded, ${skippedDup} duplicates, ${failed} failed, ${unsupported} unsupported`);

    return new Response(
      JSON.stringify({
        summary: { uploaded, skippedDuplicates: skippedDup, failed, unsupported, total: results.length },
        files: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[EXTRACT-ZIP] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

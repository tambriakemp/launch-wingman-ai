import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASPECT_DIMENSIONS: Record<string, { w: number; h: number }> = {
  "9:16": { w: 1080, h: 1920 },
  "16:9": { w: 1920, h: 1080 },
  "1:1": { w: 1080, h: 1080 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { videoUrls, aspectRatio, projectId } = await req.json();

    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length < 2) {
      return new Response(JSON.stringify({ error: "At least 2 videoUrls required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dims = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS["9:16"];
    console.log(`[merge-scene-videos] Merging ${videoUrls.length} videos at ${dims.w}x${dims.h}`);

    // Download all videos
    const videoBuffers: Uint8Array[] = [];
    for (let i = 0; i < videoUrls.length; i++) {
      console.log(`[merge-scene-videos] Downloading video ${i + 1}/${videoUrls.length}...`);
      const resp = await fetch(videoUrls[i]);
      if (!resp.ok) throw new Error(`Failed to download video ${i + 1}: HTTP ${resp.status}`);
      videoBuffers.push(new Uint8Array(await resp.arrayBuffer()));
    }

    // Write videos to temp files
    const tmpDir = await Deno.makeTempDir();
    const videoPaths: string[] = [];
    for (let i = 0; i < videoBuffers.length; i++) {
      const path = `${tmpDir}/vid${i}.mp4`;
      await Deno.writeFile(path, videoBuffers[i]);
      videoPaths.push(path);
    }

    // Write concat list
    const listContent = videoPaths.map(p => `file '${p}'`).join("\n");
    const listPath = `${tmpDir}/list.txt`;
    await Deno.writeTextFile(listPath, listContent);

    const outputPath = `${tmpDir}/output.mp4`;

    // Try stream copy first (fast), fall back to re-encode
    let success = false;

    // Attempt 1: stream copy concat
    try {
      const proc = new Deno.Command("ffmpeg", {
        args: [
          "-f", "concat", "-safe", "0", "-i", listPath,
          "-c", "copy", "-movflags", "+faststart",
          outputPath,
        ],
        stdout: "piped", stderr: "piped",
      });
      const result = await proc.output();
      if (result.success) {
        success = true;
        console.log("[merge-scene-videos] Stream copy succeeded");
      } else {
        const stderr = new TextDecoder().decode(result.stderr);
        console.log("[merge-scene-videos] Stream copy failed, will re-encode:", stderr.slice(0, 200));
      }
    } catch (e) {
      console.log("[merge-scene-videos] Stream copy error:", e);
    }

    // Attempt 2: re-encode with scaling
    if (!success) {
      try { await Deno.remove(outputPath); } catch { /* ok */ }
      const scaleFilter = `scale=${dims.w}:${dims.h}:force_original_aspect_ratio=decrease,pad=${dims.w}:${dims.h}:(ow-iw)/2:(oh-ih)/2:black`;
      const proc = new Deno.Command("ffmpeg", {
        args: [
          "-f", "concat", "-safe", "0", "-i", listPath,
          "-vf", scaleFilter,
          "-c:v", "libx264", "-preset", "fast", "-crf", "23",
          "-pix_fmt", "yuv420p", "-movflags", "+faststart",
          "-an", outputPath,
        ],
        stdout: "piped", stderr: "piped",
      });
      const result = await proc.output();
      if (!result.success) {
        const stderr = new TextDecoder().decode(result.stderr);
        console.error("[merge-scene-videos] Re-encode failed:", stderr.slice(0, 500));
        throw new Error("ffmpeg re-encode failed");
      }
      success = true;
      console.log("[merge-scene-videos] Re-encode succeeded");
    }

    // Read output and upload
    const outputData = await Deno.readFile(outputPath);
    const storagePath = `reels/${userId}/${Date.now()}.mp4`;

    const adminClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: uploadError } = await adminClient.storage
      .from("ai-studio")
      .upload(storagePath, outputData, { contentType: "video/mp4", upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = adminClient.storage.from("ai-studio").getPublicUrl(storagePath);
    const reelUrl = urlData.publicUrl;

    // Update project if projectId provided
    if (projectId) {
      await adminClient.from("ai_studio_projects").update({
        reel_url: reelUrl,
        reel_path: storagePath,
        reel_created_at: new Date().toISOString(),
      }).eq("id", projectId).eq("user_id", userId);
    }

    // Cleanup temp
    try { await Deno.remove(tmpDir, { recursive: true }); } catch { /* ok */ }

    console.log("[merge-scene-videos] Done. URL:", reelUrl);
    return new Response(JSON.stringify({ reelUrl, storagePath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[merge-scene-videos] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { inputUrl, outputPath, userId } = await req.json();
    if (!inputUrl || !outputPath) {
      return new Response(JSON.stringify({ error: "inputUrl and outputPath required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Download the WebM
    const inputRes = await fetch(inputUrl);
    if (!inputRes.ok) throw new Error("Failed to fetch input video");
    const inputBuffer = await inputRes.arrayBuffer();

    // Write input to temp file
    const tmpInput = await Deno.makeTempFile({ suffix: ".webm" });
    const tmpOutput = await Deno.makeTempFile({ suffix: ".mp4" });
    await Deno.writeFile(tmpInput, new Uint8Array(inputBuffer));

    // Run ffmpeg
    const cmd = new Deno.Command("ffmpeg", {
      args: [
        "-y",
        "-i", tmpInput,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-an",
        tmpOutput
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stderr } = await cmd.output();
    if (code !== 0) {
      const errText = new TextDecoder().decode(stderr);
      console.error("FFmpeg error:", errText);
      throw new Error(`FFmpeg conversion failed: ${errText.slice(-200)}`);
    }

    // Read output
    const mp4Data = await Deno.readFile(tmpOutput);
    
    // Clean up temp files
    await Deno.remove(tmpInput).catch(() => {});
    await Deno.remove(tmpOutput).catch(() => {});

    // Upload to Supabase storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: uploadErr } = await supabase.storage
      .from("ai-studio")
      .upload(outputPath, mp4Data, { contentType: "video/mp4", upsert: true });

    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from("ai-studio").getPublicUrl(outputPath);

    return new Response(
      JSON.stringify({ publicUrl: urlData.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("convert-video error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Conversion failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

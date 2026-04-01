import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { inputUrl, outputPath } = await req.json();
    if (!inputUrl || !outputPath) {
      return new Response(JSON.stringify({ error: "inputUrl and outputPath required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("CLOUDCONVERT_API_KEY");
    if (!apiKey) throw new Error("CLOUDCONVERT_API_KEY not configured");

    const headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    // 1. Create job
    const jobRes = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers,
      body: JSON.stringify({
        tasks: {
          "import-webm": { operation: "import/url", url: inputUrl },
          "convert-to-mp4": {
            operation: "convert",
            input: "import-webm",
            output_format: "mp4",
            video_codec: "x264",
            fps: 30,
          },
          "export-result": { operation: "export/url", input: "convert-to-mp4" },
        },
      }),
    });

    if (!jobRes.ok) {
      const errBody = await jobRes.text();
      throw new Error(`CloudConvert job creation failed [${jobRes.status}]: ${errBody}`);
    }

    const job = await jobRes.json();
    const jobId = job.data.id;
    console.log(`[convert-video] CloudConvert job created: ${jobId}`);

    // 2. Poll until finished (max 120s)
    const maxWait = 120_000;
    const interval = 3_000;
    const start = Date.now();
    let finishedJob: any = null;

    while (Date.now() - start < maxWait) {
      await new Promise((r) => setTimeout(r, interval));
      const pollRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, { headers });
      const pollData = await pollRes.json();
      const status = pollData.data.status;

      if (status === "finished") {
        finishedJob = pollData.data;
        break;
      }
      if (status === "error") {
        const failedTask = pollData.data.tasks?.find((t: any) => t.status === "error");
        throw new Error(`CloudConvert job failed: ${failedTask?.message || "unknown error"}`);
      }
    }

    if (!finishedJob) throw new Error("CloudConvert job timed out after 120s");

    // 3. Get export URL
    const exportTask = finishedJob.tasks.find((t: any) => t.name === "export-result");
    const exportUrl = exportTask?.result?.files?.[0]?.url;
    if (!exportUrl) throw new Error("No export URL in finished job");

    // 4. Download MP4
    const mp4Res = await fetch(exportUrl);
    if (!mp4Res.ok) throw new Error("Failed to download converted MP4");
    const mp4Buffer = await mp4Res.arrayBuffer();
    console.log(`[convert-video] Downloaded MP4: ${(mp4Buffer.byteLength / 1024 / 1024).toFixed(1)}MB`);

    // 5. Upload to Supabase storage
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: uploadErr } = await supabase.storage
      .from("ai-studio")
      .upload(outputPath, new Uint8Array(mp4Buffer), { contentType: "video/mp4", upsert: true });

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

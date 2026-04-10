import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const { requestId, statusUrl, responseUrl } = await req.json();
    if (!requestId || !statusUrl) {
      return new Response(JSON.stringify({ error: "requestId and statusUrl are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Resolve fal.ai key (BYOK or platform)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let falKey: string | null = null;

    const { data: userKey } = await adminClient
      .from("user_api_keys")
      .select("api_key")
      .eq("user_id", userId)
      .eq("service", "fal_ai")
      .maybeSingle();

    if (userKey?.api_key) {
      falKey = userKey.api_key;
    } else {
      falKey = Deno.env.get("FAL_KEY") || null;
    }

    if (!falKey) {
      return new Response(JSON.stringify({ error: "No fal.ai key available" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check status using the URL provided by fal.ai
    // If the URL contains a model sub-path that causes 405, fall back to base app ID
    let resolvedStatusUrl = statusUrl;
    const baseAppId = "fal-ai/kling-video";
    const subPathMatch = statusUrl.match(/fal-ai\/kling-video\/[^/]+\/[^/]+\/[^/]+\/requests\//);
    if (subPathMatch) {
      // Strip model sub-path — queue status only works with base app ID
      resolvedStatusUrl = statusUrl.replace(/fal-ai\/kling-video\/[^/]+\/[^/]+\/[^/]+\/requests\//, `${baseAppId}/requests/`);
      console.log("[check-video-status] Rewrote status URL to:", resolvedStatusUrl);
    }

    console.log("[check-video-status] Fetching status from:", resolvedStatusUrl);
    const statusResponse = await fetch(resolvedStatusUrl, {
      method: "GET",
      headers: { "Authorization": `Key ${falKey}` },
    });

    if (!statusResponse.ok) {
      const errText = await statusResponse.text();
      console.error("[check-video-status] Status check failed:", statusResponse.status, errText);
      // 4xx means the URL path is wrong or request is invalid — treat as terminal failure
      if (statusResponse.status >= 400 && statusResponse.status < 500) {
        return new Response(JSON.stringify({ status: "failed", error: `Video status check failed (HTTP ${statusResponse.status}). Please regenerate the video.` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // 5xx — transient, let client retry
      return new Response(JSON.stringify({ status: "in_progress" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusData = await statusResponse.json();

    if (statusData.status === "COMPLETED") {
      // Fetch the actual result — also fix sub-path if needed
      let resultUrl = responseUrl || resolvedStatusUrl.replace('/status', '');
      if (resultUrl.match(/fal-ai\/kling-video\/[^/]+\/[^/]+\/[^/]+\/requests\//)) {
        resultUrl = resultUrl.replace(/fal-ai\/kling-video\/[^/]+\/[^/]+\/[^/]+\/requests\//, `${baseAppId}/requests/`);
      }
      console.log("[check-video-status] Fetching completed result from:", resultUrl);

      let resultResponse: Response;
      try {
        resultResponse = await fetch(resultUrl, {
          headers: { "Authorization": `Key ${falKey}` },
        });
      } catch (fetchErr) {
        console.error("[check-video-status] Network error fetching result:", fetchErr);
        // Return 200 with in_progress so client retries gracefully instead of 500 loop
        return new Response(JSON.stringify({ status: "in_progress" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resultText = await resultResponse.text();

      if (!resultResponse.ok) {
        console.error("[check-video-status] Result fetch failed:", resultResponse.status, resultText);
        // 422 means the URL is wrong (model path mismatch) — don't retry forever
        if (resultResponse.status === 422) {
          return new Response(JSON.stringify({ status: "failed", error: "Video result fetch failed (URL mismatch). Please regenerate the video." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Other errors — retry
        return new Response(JSON.stringify({ status: "in_progress" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let resultData: any;
      try {
        resultData = JSON.parse(resultText);
      } catch {
        console.error("[check-video-status] Failed to parse result JSON:", resultText.slice(0, 500));
        return new Response(JSON.stringify({ status: "in_progress" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const videoUrl = resultData?.video?.url;

      if (!videoUrl) {
        console.error("[check-video-status] No video URL in result. Keys:", Object.keys(resultData || {}));
        return new Response(JSON.stringify({ status: "failed", error: "No video URL returned by provider" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ status: "completed", videoUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (statusData.status === "FAILED") {
      const failDetail = statusData.error || statusData.detail || "Unknown failure";
      return new Response(JSON.stringify({ status: "failed", error: `Video generation failed: ${failDetail}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Still processing
    return new Response(JSON.stringify({ status: "in_progress" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[check-video-status] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

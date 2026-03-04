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
    console.log("[check-video-status] Fetching status from:", statusUrl);
    const statusResponse = await fetch(statusUrl, {
      method: "GET",
      headers: { "Authorization": `Key ${falKey}` },
    });

    if (!statusResponse.ok) {
      const errText = await statusResponse.text();
      console.error("[check-video-status] Status check failed:", errText);
      throw new Error(`Status check failed: HTTP ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();

    if (statusData.status === "COMPLETED") {
      // Fetch the actual result using the response URL from fal.ai
      const resultUrl = responseUrl || statusUrl.replace('/status', '');
      const resultResponse = await fetch(resultUrl, {
        headers: { "Authorization": `Key ${falKey}` },
      });

      if (!resultResponse.ok) {
        throw new Error("Failed to fetch completed result");
      }

      const resultData = await resultResponse.json();
      const videoUrl = resultData?.video?.url;

      if (!videoUrl) throw new Error("No video URL in result");

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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { encode as base64url } from "https://deno.land/std@0.190.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Generate a Kling JWT (HS256) from accessKey + secretKey */
async function generateKlingJwt(accessKey: string, secretKey: string): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: accessKey, iat: now - 5, exp: now + 1800, nbf: now - 5 };

  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(signingInput));
  const sigB64 = base64url(new Uint8Array(sig));

  return `${signingInput}.${sigB64}`;
}

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

    const { requestId, statusUrl, responseUrl, provider } = await req.json();
    if (!requestId) {
      return new Response(JSON.stringify({ error: "requestId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ===================== KLING DIRECT PATH =====================
    if (provider === "kling") {
      const { data: accessKeyRow } = await adminClient
        .from("user_api_keys").select("api_key")
        .eq("user_id", userId).eq("service", "kling_access_key").maybeSingle();
      const { data: secretKeyRow } = await adminClient
        .from("user_api_keys").select("api_key")
        .eq("user_id", userId).eq("service", "kling_secret_key").maybeSingle();

      if (!accessKeyRow?.api_key || !secretKeyRow?.api_key) {
        return new Response(JSON.stringify({ status: "failed", error: "Kling API keys not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const jwt = await generateKlingJwt(accessKeyRow.api_key, secretKeyRow.api_key);
      const klingStatusUrl = `https://api-singapore.klingai.com/v1/videos/image2video/${requestId}`;

      console.log("[check-video-status] Kling polling:", klingStatusUrl);

      const statusResponse = await fetch(klingStatusUrl, {
        method: "GET",
        headers: { "Authorization": `Bearer ${jwt}` },
      });

      const responseText = await statusResponse.text();

      if (!statusResponse.ok) {
        console.error("[check-video-status] Kling status error:", statusResponse.status, responseText.slice(0, 500));
        if (statusResponse.status >= 400 && statusResponse.status < 500) {
          return new Response(JSON.stringify({ status: "failed", error: `Kling status check failed (HTTP ${statusResponse.status})` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ status: "in_progress" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let statusData: any;
      try {
        statusData = JSON.parse(responseText);
      } catch {
        console.error("[check-video-status] Failed to parse Kling response:", responseText.slice(0, 500));
        return new Response(JSON.stringify({ status: "in_progress" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const taskStatus = statusData?.data?.task_status;
      console.log("[check-video-status] Kling task_status:", taskStatus);

      if (taskStatus === "succeed") {
        const videoUrl = statusData?.data?.task_result?.videos?.[0]?.url;
        if (!videoUrl) {
          console.error("[check-video-status] No video URL in Kling result:", JSON.stringify(statusData?.data?.task_result).slice(0, 500));
          return new Response(JSON.stringify({ status: "failed", error: "No video URL returned by Kling" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ status: "completed", videoUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (taskStatus === "failed") {
        const failDetail = statusData?.data?.task_status_msg || statusData?.message || "Unknown failure";
        return new Response(JSON.stringify({ status: "failed", error: `Video generation failed: ${failDetail}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // submitted, processing, etc.
      return new Response(JSON.stringify({ status: "in_progress" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===================== FAL.AI PATH (DEFAULT) =====================
    if (!statusUrl) {
      return new Response(JSON.stringify({ error: "statusUrl is required for fal.ai provider" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

    let resolvedStatusUrl = statusUrl;
    const baseAppId = "fal-ai/kling-video";
    const subPathMatch = statusUrl.match(/fal-ai\/kling-video\/[^/]+\/[^/]+\/[^/]+\/requests\//);
    if (subPathMatch) {
      resolvedStatusUrl = statusUrl.replace(/fal-ai\/kling-video\/[^/]+\/[^/]+\/[^/]+\/requests\//, `${baseAppId}/requests/`);
    }

    console.log("[check-video-status] fal.ai polling:", resolvedStatusUrl);
    const statusResponse = await fetch(resolvedStatusUrl, {
      method: "GET",
      headers: { "Authorization": `Key ${falKey}` },
    });

    if (!statusResponse.ok) {
      const errText = await statusResponse.text();
      console.error("[check-video-status] Status check failed:", statusResponse.status, errText);
      if (statusResponse.status >= 400 && statusResponse.status < 500) {
        return new Response(JSON.stringify({ status: "failed", error: `Video status check failed (HTTP ${statusResponse.status}). Please regenerate the video.` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ status: "in_progress" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusData = await statusResponse.json();

    if (statusData.status === "COMPLETED") {
      let resultUrl = responseUrl || resolvedStatusUrl.replace('/status', '');
      if (resultUrl.match(/fal-ai\/kling-video\/[^/]+\/[^/]+\/[^/]+\/requests\//)) {
        resultUrl = resultUrl.replace(/fal-ai\/kling-video\/[^/]+\/[^/]+\/[^/]+\/requests\//, `${baseAppId}/requests/`);
      }

      let resultResponse: Response;
      try {
        resultResponse = await fetch(resultUrl, {
          headers: { "Authorization": `Key ${falKey}` },
        });
      } catch (fetchErr) {
        console.error("[check-video-status] Network error fetching result:", fetchErr);
        return new Response(JSON.stringify({ status: "in_progress" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const resultText = await resultResponse.text();

      if (!resultResponse.ok) {
        console.error("[check-video-status] Result fetch failed:", resultResponse.status, resultText);
        if (resultResponse.status === 422) {
          return new Response(JSON.stringify({ status: "failed", error: "Video result fetch failed (URL mismatch). Please regenerate the video." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
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

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

    const { imageUrl, videoPrompt, aspectRatio, characterBindUrl, duration: rawDuration } = await req.json();
    const validDurations = ["3", "5", "10"];
    const duration = validDurations.includes(String(rawDuration)) ? String(rawDuration) : "5";
    if (!imageUrl || !videoPrompt) {
      return new Response(JSON.stringify({ error: "imageUrl and videoPrompt are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Determine video provider
    const { data: providerSetting } = await adminClient
      .from("platform_settings")
      .select("value")
      .eq("key", "video_provider")
      .maybeSingle();
    const videoProvider = providerSetting?.value || "fal";

    // ===================== KLING DIRECT PATH =====================
    if (videoProvider === "kling") {
      // Look up user's Kling keys
      const { data: accessKeyRow } = await adminClient
        .from("user_api_keys").select("api_key")
        .eq("user_id", userId).eq("service", "kling_access_key").maybeSingle();
      const { data: secretKeyRow } = await adminClient
        .from("user_api_keys").select("api_key")
        .eq("user_id", userId).eq("service", "kling_secret_key").maybeSingle();

      if (!accessKeyRow?.api_key || !secretKeyRow?.api_key) {
        return new Response(JSON.stringify({
          error: "Kling API keys not configured. Go to Settings → AI & Video → Kling API Keys to add your keys.",
          code: "KLING_KEYS_MISSING"
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const jwt = await generateKlingJwt(accessKeyRow.api_key, secretKeyRow.api_key);

      // Build Kling payload
      const klingPayload: Record<string, unknown> = {
        model_name: "kling-v2-master",
        mode: "pro",
        image: imageUrl,
        image_fidelity: 0.65,
        cfg_scale: 0.9,
        negative_prompt: "blur, distortion, low quality, shaky camera, jitter, plastic skin, wax figure, uncanny valley, oversmoothed, airbrushed, doll-like, low resolution, grainy, noisy, morphing artifacts, face warping, limb distortion, slow motion, unnatural movement, sluggish, slow pace, frozen pose, statue-like, minimal movement, underwater-feeling, cinematic float, dreamy drift",
      };

      {
        const backFacingGuard = /\b(back\s*(to|facing|turned)|from behind|over[- ]?shoulder|rear view|silhouette|facing away)\b/i.test(videoPrompt)
          ? " IMPORTANT: Maintain the exact same camera angle as the source image. Do NOT rotate the subject to face the camera."
          : "";
        klingPayload.prompt = videoPrompt + backFacingGuard;
        klingPayload.duration = duration;
      }

      // Character bind — Kling direct doesn't support inline elements like fal.ai
      // We'll append identity lock instruction to prompt instead
      if (characterBindUrl) {
        const bindNote = " @Element1";
        if (klingPayload.prompt) {
          klingPayload.prompt = `${klingPayload.prompt}${bindNote}`;
        }
        klingPayload.subject_reference = [{ image: characterBindUrl }];
      }

      console.log("[generate-video] Kling direct payload:", JSON.stringify(klingPayload).slice(0, 500));

      const submitResponse = await fetch("https://api-singapore.klingai.com/v1/videos/image2video", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(klingPayload),
      });

      const responseText = await submitResponse.text();
      console.log("[generate-video] Kling response:", submitResponse.status, responseText.slice(0, 500));

      if (!submitResponse.ok) {
        let detail = `HTTP ${submitResponse.status}`;
        try {
          const errJson = JSON.parse(responseText);
          detail = errJson?.message || errJson?.error || detail;
        } catch { /* not JSON */ }

        if (submitResponse.status === 401 || submitResponse.status === 403) {
          return new Response(JSON.stringify({
            error: "Kling API authentication failed. Please check your Access Key and Secret Key in Settings.",
            code: "KLING_AUTH_FAILED"
          }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        throw new Error(`Kling API error: ${detail}`);
      }

      let submitData: any;
      try {
        submitData = JSON.parse(responseText);
      } catch {
        throw new Error("Failed to parse Kling API response");
      }

      const taskId = submitData?.data?.task_id;
      if (!taskId) {
        console.error("[generate-video] No task_id in Kling response:", JSON.stringify(submitData).slice(0, 500));
        throw new Error("No task_id returned from Kling API");
      }

      console.log("[generate-video] Kling submitted. taskId:", taskId);

      return new Response(JSON.stringify({ requestId: taskId, provider: "kling" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===================== FAL.AI PATH (DEFAULT) =====================
    let falKey: string | null = null;
    let usingBYOK = false;

    const { data: userKey } = await adminClient
      .from("user_api_keys")
      .select("api_key")
      .eq("user_id", userId)
      .eq("service", "fal_ai")
      .maybeSingle();

    if (userKey?.api_key) {
      falKey = userKey.api_key;
      usingBYOK = true;
    } else {
      falKey = Deno.env.get("FAL_KEY") || null;
      if (!falKey) {
        return new Response(JSON.stringify({ error: "Platform video generation key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Get or create credit row
      let { data: credits } = await adminClient
        .from("video_credits")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!credits) {
        const { data: newCredits, error: insertErr } = await adminClient
          .from("video_credits")
          .insert({ user_id: userId, balance: 0, monthly_free_remaining: 10, monthly_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
          .select()
          .single();
        if (insertErr) throw insertErr;
        credits = newCredits;
      }

      if (new Date(credits.monthly_reset_at) < new Date()) {
        const { data: resetCredits, error: resetErr } = await adminClient
          .from("video_credits")
          .update({ monthly_free_remaining: 10, monthly_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
          .eq("user_id", userId)
          .select()
          .single();
        if (resetErr) throw resetErr;
        credits = resetCredits;
      }

      if (credits.monthly_free_remaining > 0) {
        await adminClient
          .from("video_credits")
          .update({ monthly_free_remaining: credits.monthly_free_remaining - 1 })
          .eq("user_id", userId);
        await adminClient.from("video_credit_transactions").insert({
          user_id: userId, amount: -1, type: "free_monthly", description: "Video generation (free monthly)"
        });
      } else if (credits.balance > 0) {
        await adminClient
          .from("video_credits")
          .update({ balance: credits.balance - 1 })
          .eq("user_id", userId);
        await adminClient.from("video_credit_transactions").insert({
          user_id: userId, amount: -1, type: "used", description: "Video generation (purchased credit)"
        });
      } else {
        return new Response(JSON.stringify({ error: "No video credits remaining. Purchase more credits or add your own fal.ai API key.", code: "NO_CREDITS" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const endpoint = "fal-ai/kling-video/v3/pro/image-to-video";
    console.log(`[generate-video] fal.ai path, multiShot: ${!!multiShot}, characterBind: ${!!characterBindUrl}`);

    const falPayload: Record<string, unknown> = {
      image_url: imageUrl,
      aspect_ratio: aspectRatio || "9:16",
      negative_prompt: "blur, distortion, low quality, shaky camera, jitter, plastic skin, wax figure, uncanny valley, oversmoothed, airbrushed, doll-like, low resolution, grainy, noisy, morphing artifacts, face warping, limb distortion, slow motion, unnatural movement, sluggish, slow pace, frozen pose, statue-like, minimal movement, underwater-feeling, cinematic float, dreamy drift",
      cfg_scale: 0.9,
    };

    if (multiShot && Array.isArray(multiShot) && multiShot.length > 0) {
      falPayload.multi_prompt = multiShot.map((shot: { prompt: string; duration: string }) => ({
        prompt: shot.prompt,
        duration: shot.duration,
      }));
      falPayload.shot_type = "customize";
      const totalDuration = multiShot.reduce((sum: number, s: { duration: string }) => sum + parseInt(s.duration || "5", 10), 0);
      falPayload.duration = String(Math.min(totalDuration, 15));
    } else {
      const backFacingGuard = /\b(back\s*(to|facing|turned)|from behind|over[- ]?shoulder|rear view|silhouette|facing away)\b/i.test(videoPrompt)
        ? " IMPORTANT: Maintain the exact same camera angle as the source image. Do NOT rotate the subject to face the camera. Keep the same pose orientation throughout."
        : "";
      falPayload.prompt = videoPrompt + backFacingGuard;
      falPayload.duration = duration;
    }

    if (characterBindUrl) {
      falPayload.elements = [{ image_url: characterBindUrl }];
      if (falPayload.prompt) {
        falPayload.prompt = `${falPayload.prompt} @Element1`;
      }
      if (falPayload.multi_prompt && Array.isArray(falPayload.multi_prompt)) {
        falPayload.multi_prompt = (falPayload.multi_prompt as any[]).map((shot) => ({
          ...shot,
          prompt: `${shot.prompt} @Element1`,
        }));
      }
    }

    const submitResponse = await fetch(`https://queue.fal.run/${endpoint}`, {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(falPayload),
    });

    if (!submitResponse.ok) {
      const errText = await submitResponse.text();
      console.error("[generate-video] fal.ai submit error:", errText);

      let detail = `HTTP ${submitResponse.status}`;
      try {
        const errJson = JSON.parse(errText);
        detail = errJson?.detail || errJson?.message || detail;
      } catch { /* not JSON */ }

      if (!usingBYOK) {
        const { data: currentCredits } = await adminClient.from("video_credits").select("*").eq("user_id", userId).single();
        if (currentCredits) {
          const { data: lastTx } = await adminClient.from("video_credit_transactions")
            .select("type").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single();
          if (lastTx?.type === "free_monthly") {
            await adminClient.from("video_credits").update({ monthly_free_remaining: currentCredits.monthly_free_remaining + 1 }).eq("user_id", userId);
          } else {
            await adminClient.from("video_credits").update({ balance: currentCredits.balance + 1 }).eq("user_id", userId);
          }
          await adminClient.from("video_credit_transactions").insert({
            user_id: userId, amount: 1, type: "refund", description: "Refund: fal.ai submission failed"
          });
        }
      }

      const detailLower = detail.toLowerCase();
      if (detailLower.includes("exhausted") || detailLower.includes("balance") || detailLower.includes("locked") || submitResponse.status === 403) {
        const errorCode = usingBYOK ? "USER_KEY_EXHAUSTED" : "PLATFORM_EXHAUSTED";
        const errorMsg = usingBYOK
          ? "Your fal.ai API key has insufficient balance. Top up your account at fal.ai/dashboard/billing to continue."
          : "Platform video generation balance exhausted. Please use your own fal.ai API key or purchase more credits.";
        return new Response(JSON.stringify({ error: errorMsg, code: errorCode }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      throw new Error(`fal.ai error: ${detail}`);
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    if (!requestId) {
      throw new Error("No request_id returned from fal.ai");
    }

    const baseAppId = "fal-ai/kling-video";
    const statusUrl = submitData.status_url || `https://queue.fal.run/${baseAppId}/requests/${requestId}/status`;
    const responseUrl = submitData.response_url || `https://queue.fal.run/${baseAppId}/requests/${requestId}`;

    console.log("[generate-video] fal.ai submitted. Request ID:", requestId);

    return new Response(JSON.stringify({ requestId, statusUrl, responseUrl, endpoint, provider: "fal" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[generate-video] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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

    const { imageUrl, videoPrompt, aspectRatio, multiShot, characterBindUrl } = await req.json();
    if (!imageUrl || (!videoPrompt && !multiShot)) {
      return new Response(JSON.stringify({ error: "imageUrl and (videoPrompt or multiShot) are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Service role client for credit management
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Check for BYOK key
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
      // 2. Check/manage credits
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

      // Check monthly reset
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

      // Deduct credits
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
        return new Response(JSON.stringify({ error: "No video credits remaining. Purchase more credits or add your own fal.ai API key." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // 3. Build request payload
    // Use Pro endpoint when character bind is enabled (supports `elements` for face locking)
    // Use Standard endpoint for normal/multi-shot without bind
    // Always use Pro endpoint for maximum realism and sharpness
    const endpoint = "fal-ai/kling-video/o3/pro/image-to-video";

    console.log(`[generate-video] Using Pro endpoint, multiShot: ${!!multiShot}, characterBind: ${!!characterBindUrl}`);

    // Build the fal.ai payload
    const falPayload: Record<string, unknown> = {
      image_url: imageUrl,
      aspect_ratio: aspectRatio || "9:16",
      negative_prompt: "blur, distortion, low quality, shaky camera, jitter, plastic skin, wax figure, uncanny valley, oversmoothed, airbrushed, doll-like, low resolution, grainy, noisy, morphing artifacts, face warping, limb distortion, slow motion, unnatural movement",
      cfg_scale: 0.7,
    };

    if (multiShot && Array.isArray(multiShot) && multiShot.length > 0) {
      // Multi-shot mode
      falPayload.multi_prompt = multiShot.map((shot: { prompt: string; duration: string }) => ({
        prompt: shot.prompt,
        duration: shot.duration,
      }));
      falPayload.shot_type = "customize";
      // Total duration is sum of shot durations
      const totalDuration = multiShot.reduce((sum: number, s: { duration: string }) => sum + parseInt(s.duration || "5", 10), 0);
      falPayload.duration = String(Math.min(totalDuration, 15)); // Kling max 15s
      console.log(`[generate-video] Multi-shot: ${multiShot.length} shots, total ${totalDuration}s`);
    } else {
      // Single prompt mode
      const backFacingGuard = /\b(back\s*(to|facing|turned)|from behind|over[- ]?shoulder|rear view|silhouette|facing away)\b/i.test(videoPrompt)
        ? " IMPORTANT: Maintain the exact same camera angle as the source image. Do NOT rotate the subject to face the camera. Keep the same pose orientation throughout."
        : "";
      falPayload.prompt = videoPrompt + backFacingGuard;
      falPayload.duration = "10";
    }

    // Character bind — use elements for identity locking
    if (characterBindUrl) {
      // For Pro i2v, use `start_image_url` instead of `image_url`
      delete falPayload.image_url;
      falPayload.start_image_url = imageUrl;

      falPayload.elements = [{
        image_url: characterBindUrl,
      }];

      // Append @Element1 to prompt(s) for identity binding
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

      // Refund credit on failure if not BYOK
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
        return new Response(JSON.stringify({ error: "Platform video generation balance exhausted. Please use your own fal.ai API key or purchase more credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      throw new Error(`fal.ai error: ${detail}`);
    }

    const submitData = await submitResponse.json();
    console.log("[generate-video] fal.ai submit response keys:", Object.keys(submitData));
    const requestId = submitData.request_id;

    if (!requestId) {
      throw new Error("No request_id returned from fal.ai");
    }

    // Always construct URLs with the full endpoint path — fal.ai returns
    // truncated URLs (e.g. fal-ai/kling-video) missing the model sub-path
    const statusUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}/status`;
    const responseUrl = `https://queue.fal.run/${endpoint}/requests/${requestId}`;

    console.log("[generate-video] Submitted successfully. Request ID:", requestId, "Status URL:", statusUrl);

    return new Response(JSON.stringify({ requestId, statusUrl, responseUrl, endpoint }), {
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

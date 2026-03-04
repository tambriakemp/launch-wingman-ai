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

    const { imageUrl, videoPrompt, aspectRatio } = await req.json();
    if (!imageUrl || !videoPrompt) {
      return new Response(JSON.stringify({ error: "imageUrl and videoPrompt are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    // 3. Call fal.ai MiniMax image-to-video
    console.log("[generate-video] Submitting to fal.ai queue...");

    const submitResponse = await fetch("https://queue.fal.run/fal-ai/minimax-video/image-to-video", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: videoPrompt,
        prompt_optimizer: true,
      }),
    });

    if (!submitResponse.ok) {
      const errText = await submitResponse.text();
      console.error("[generate-video] fal.ai submit error:", errText);

      // Parse error detail from fal.ai response
      let detail = `HTTP ${submitResponse.status}`;
      try {
        const errJson = JSON.parse(errText);
        detail = errJson?.detail || errJson?.message || detail;
      } catch { /* not JSON */ }

      // Refund credit on failure if not BYOK
      if (!usingBYOK) {
        // Simple refund - add back 1 credit
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

      // Map balance/lock errors to 402
      const detailLower = detail.toLowerCase();
      if (detailLower.includes("exhausted") || detailLower.includes("balance") || detailLower.includes("locked") || submitResponse.status === 403) {
        return new Response(JSON.stringify({ error: "Platform video generation balance exhausted. Please use your own fal.ai API key or purchase more credits." }), {
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

    console.log("[generate-video] Request ID:", requestId, "- polling for result...");

    // 4. Poll for result (edge functions have ~300s timeout, so limit polling)
    const maxAttempts = 55; // ~275 seconds max (within edge function timeout)
    let attempt = 0;

    while (attempt < maxAttempts) {
      await new Promise(r => setTimeout(r, 5000)); // 5 second intervals
      attempt++;

      try {
        const statusResponse = await fetch(`https://queue.fal.run/fal-ai/minimax-video/requests/${requestId}/status`, {
          headers: { "Authorization": `Key ${falKey}` },
        });

        if (!statusResponse.ok) {
          console.error(`[generate-video] Status check failed: HTTP ${statusResponse.status}`);
          continue;
        }

        const statusData = await statusResponse.json();
        if (attempt % 5 === 0 || statusData.status !== "IN_PROGRESS") {
          console.log(`[generate-video] Poll ${attempt}/${maxAttempts}: status=${statusData.status}`);
        }

        if (statusData.status === "COMPLETED") {
          const resultResponse = await fetch(`https://queue.fal.run/fal-ai/minimax-video/requests/${requestId}`, {
            headers: { "Authorization": `Key ${falKey}` },
          });

          if (!resultResponse.ok) throw new Error("Failed to fetch result");

          const resultData = await resultResponse.json();
          const videoUrl = resultData?.video?.url;

          if (!videoUrl) throw new Error("No video URL in result");

          console.log("[generate-video] Video ready:", videoUrl);

          return new Response(JSON.stringify({ videoUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (statusData.status === "FAILED") {
          const failDetail = statusData.error || statusData.detail || "Unknown failure";
          console.error("[generate-video] fal.ai job FAILED:", failDetail);
          throw new Error(`Video generation failed: ${failDetail}`);
        }
      } catch (pollError) {
        if (pollError instanceof Error && pollError.message.includes("Video generation failed")) {
          throw pollError;
        }
        console.error(`[generate-video] Poll error at attempt ${attempt}:`, pollError);
        // Continue polling on transient errors
      }
    }

    console.error(`[generate-video] Timed out after ${maxAttempts} polls (~${maxAttempts * 5}s). Request ID: ${requestId}`);
    throw new Error("Video generation timed out after ~5 minutes. The video may still be processing on fal.ai — please try again shortly.");

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[generate-video] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

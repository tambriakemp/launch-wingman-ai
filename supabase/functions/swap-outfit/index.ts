import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[swap-outfit] Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Backend configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      console.error("[swap-outfit] Missing bearer token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.split(/\s+/)[1]?.trim();
    if (!token) {
      console.error("[swap-outfit] Could not extract token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("[swap-outfit] Token validation failed:", claimsError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    console.log("[swap-outfit] Authenticated user", { userId });

    const { characterImageUrl, outfitImageUrl, instruction } = await req.json();

    if (!characterImageUrl || !outfitImageUrl) {
      return new Response(
        JSON.stringify({ error: "Both characterImageUrl and outfitImageUrl are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userInstruction = instruction?.trim()
      ? `Additional instruction: ${instruction.trim()}`
      : "Swap the ENTIRE outfit from the reference onto the character.";

    const prompt = `You are an expert fashion AI. You will receive two images:

IMAGE 1 (CHARACTER): This is the ground-truth reference. The character's face, hair, skin tone, body proportions, pose, background, lighting, and environment MUST remain EXACTLY the same. Do NOT alter anything about the character or environment.

IMAGE 2 (OUTFIT REFERENCE): Extract ONLY the clothing/outfit from this image.

YOUR TASK: Take the outfit from Image 2 and place it on the character in Image 1. The result must look like the SAME person in the SAME environment wearing the new outfit. Maintain photorealistic quality, proper fabric draping, shadows, and lighting consistency.

${userInstruction}

CRITICAL RULES:
- Face, hair, skin, body shape, pose = LOCKED (identical to Image 1)
- Background, lighting, environment = LOCKED (identical to Image 1)
- ONLY the clothing changes
- Maintain realistic fabric physics and lighting on the new outfit
- Output a single photorealistic image`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: characterImageUrl } },
              { type: "image_url", image_url: { url: outfitImageUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[swap-outfit] AI gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageUrl) {
      return new Response(JSON.stringify({ error: "No image was generated. The AI may have declined this request." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!generatedImageUrl.startsWith("data:image/")) {
      return new Response(JSON.stringify({ resultImageUrl: generatedImageUrl }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base64 = generatedImageUrl.replace(/^data:image\/\w+;base64,/, "");
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const filePath = `${userId}/outfit-swap-${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("ai-studio")
      .upload(filePath, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("[swap-outfit] Upload error:", uploadError.message);
      return new Response(JSON.stringify({ resultImageUrl: generatedImageUrl }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage.from("ai-studio").getPublicUrl(filePath);

    return new Response(JSON.stringify({ resultImageUrl: publicUrlData.publicUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[swap-outfit] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

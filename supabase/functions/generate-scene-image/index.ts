import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractImageFromResponse(data: any): string | null {
  // Format 1: images array on message
  const images = data?.choices?.[0]?.message?.images;
  if (Array.isArray(images) && images.length > 0) {
    const img = images[0];
    if (img?.image_url?.url) return img.image_url.url;
    if (img?.url) return img.url;
    if (img?.b64_json) return `data:image/png;base64,${img.b64_json}`;
  }

  // Format 2: content array with image parts
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === "image_url" && part.image_url?.url) return part.image_url.url;
      if (part.type === "image" && part.image_url?.url) return part.image_url.url;
    }
  }

  // Format 3: inline_data in parts
  const parts = data?.choices?.[0]?.message?.parts;
  if (Array.isArray(parts)) {
    for (const part of parts) {
      if (part.inline_data?.data) return `data:${part.inline_data.mime_type || 'image/png'};base64,${part.inline_data.data}`;
    }
  }

  // Format 4: DALL-E style
  if (data?.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
  if (data?.data?.[0]?.url) return data.data[0].url;

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { prompt, referenceImage, productImage, environmentImage, previewCharacter, config, lockedRefs, isFinalLook, isUpscale, baseImageUrl } = await req.json();

    // Build content parts
    const contentParts: any[] = [];

    if (isUpscale && baseImageUrl) {
      // Upscale mode
      contentParts.push({ type: "image_url", image_url: { url: baseImageUrl } });
      contentParts.push({ type: "text", text: "Enhance this image to high quality. Maintain exact details, just increase clarity and resolution." });
    } else {
      // Add locked references first (high priority)
      if (lockedRefs && lockedRefs.length > 0) {
        for (const ref of lockedRefs) {
          contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${ref.base64}` } });
        }
      }

      // Add preview character (medium priority)
      if (previewCharacter && !lockedRefs?.find((r: any) => r.type === 'character')) {
        const base64 = previewCharacter.includes(',') ? previewCharacter.split(',')[1] : previewCharacter;
        contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } });
      } else if (referenceImage && !lockedRefs?.find((r: any) => r.type === 'character')) {
        contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${referenceImage}` } });
      }

      if (productImage && config.creationMode === 'ugc') {
        contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${productImage}` } });
      }

      if (environmentImage && !lockedRefs?.find((r: any) => r.type === 'environment')) {
        const envBase64 = environmentImage.includes(',') ? environmentImage.split(',')[1] : environmentImage;
        contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${envBase64}` } });
      }

      // Build style description
      const hair = config.hairstyle?.includes('Custom') ? config.customHairstyle : config.hairstyle;
      const makeup = config.makeup === 'Custom' ? config.customMakeup : config.makeup;
      const skin = config.skinComplexion === 'Custom' ? config.customSkinComplexion : `${config.skinComplexion} ${config.skinUndertone}`;
      const nails = config.nailStyle === 'Custom' ? config.customNailStyle : config.nailStyle;

      let currentOutfit = config.outfitType === 'Custom Outfit' ? config.outfitDetails : config.outfitType;
      if (config.outfitAdditionalInfo && !isFinalLook) currentOutfit += ` (${config.outfitAdditionalInfo})`;
      if (isFinalLook) {
        const baseFinal = config.finalLookType === 'Custom Outfit' ? config.finalLook : config.finalLookType;
        currentOutfit = config.finalLookAdditionalInfo ? `${baseFinal} (${config.finalLookAdditionalInfo})` : baseFinal;
      }

      // Build lock instructions
      let lockInstructions = "";
      if (lockedRefs?.find((r: any) => r.type === 'outfit')) lockInstructions += "LOCKED OUTFIT: STRICTLY COPY the outfit from the reference image. ";
      if (lockedRefs?.find((r: any) => r.type === 'character')) lockInstructions += "LOCKED CHARACTER: STRICTLY CLONE the face from the reference image. ";
      if (lockedRefs?.find((r: any) => r.type === 'environment')) lockInstructions += "LOCKED ENVIRONMENT: USE the provided background reference. ";

      const fullPrompt = `Generate a photorealistic, high-quality image.
Scene Description: ${prompt}

MANDATORY STYLE REQUIREMENTS:
- Outfit: ${currentOutfit} (MUST be clearly visible)
- Hairstyle: ${hair}
- Makeup: ${makeup}
- Skin: ${skin}
- Nails: ${nails}

${lockInstructions}

${config.exactMatch ? 'CRITICAL: Clone the EXACT face, skin tone, and body from the reference image.' : 'Ensure consistency with reference images.'}
${config.creationMode === 'ugc' ? 'Feature the product prominently.' : ''}`;

      contentParts.push({ type: "text", text: fullPrompt });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: contentParts }],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Scene image error:", response.status, t);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();

    // Check for safety filter block
    const finishReason = data.choices?.[0]?.native_finish_reason || data.choices?.[0]?.finish_reason;
    if (finishReason === "IMAGE_SAFETY") {
      console.warn("Image blocked by safety filter");
      return new Response(JSON.stringify({ error: "Image blocked by safety filter. Try a different prompt or scene description." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Extract image from multiple possible response formats
    let imageUrl = extractImageFromResponse(data);
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image generated");
    }

    // Upload to storage
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Extract user ID from auth header
    const authHeader = req.headers.get("Authorization");
    let userId = "anonymous";
    if (authHeader) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    // Handle both base64 data URLs and regular URLs
    let bytes: Uint8Array;
    if (imageUrl.startsWith("data:")) {
      const base64Data = imageUrl.split(",")[1];
      const binaryString = atob(base64Data);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    } else {
      // It's a URL - fetch and get bytes
      const imgResp = await fetch(imageUrl);
      bytes = new Uint8Array(await imgResp.arrayBuffer());
    }

    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: uploadError } = await supabase.storage
      .from("ai-studio")
      .upload(fileName, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      // Return base64 as fallback
      return new Response(JSON.stringify({ imageUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: publicUrlData } = supabase.storage.from("ai-studio").getPublicUrl(fileName);

    return new Response(JSON.stringify({ imageUrl: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("generate-scene-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

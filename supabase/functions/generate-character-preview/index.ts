import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractImageFromResponse(data: any): string | null {
  // Try multiple known response formats
  
  // Format 1: images array on message
  const img1 = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (img1) return img1;

  // Format 2: content array with image parts
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === "image_url" && part.image_url?.url) return part.image_url.url;
      if (part.type === "image" && part.image_url?.url) return part.image_url.url;
      // base64 inline
      if (part.type === "image_url" && typeof part.image_url === "string") return part.image_url;
    }
  }

  // Format 3: inline_data in parts
  const parts = data?.choices?.[0]?.message?.parts;
  if (Array.isArray(parts)) {
    for (const part of parts) {
      if (part.inline_data?.data) return `data:${part.inline_data.mime_type || 'image/png'};base64,${part.inline_data.data}`;
    }
  }

  // Format 4: direct b64_json in data array (DALL-E style)
  if (data?.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
  if (data?.data?.[0]?.url) return data.data[0].url;

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { referenceImage, environmentImage, environmentImages, config, isFinalLook } = await req.json();

    // Strip data URI prefix if present so we send raw base64 only
    const stripBase64Prefix = (img: string): string => {
      if (img.includes(',')) return img.split(',')[1];
      return img;
    };

    const refBase64 = stripBase64Prefix(referenceImage);
    const contentParts: any[] = [
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${refBase64}` } }
    ];

    // Add environment images (multi-angle group takes priority)
    if (environmentImages && Array.isArray(environmentImages) && environmentImages.length > 0) {
      for (const envImg of environmentImages) {
        const envBase64 = stripBase64Prefix(envImg);
        contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${envBase64}` } });
      }
    } else if (environmentImage) {
      const envBase64 = stripBase64Prefix(environmentImage);
      contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${envBase64}` } });
    }

    let targetOutfit = config.outfitType === 'Custom Outfit' ? config.outfitDetails : config.outfitType;
    if (config.outfitAdditionalInfo && !isFinalLook) targetOutfit += ` (${config.outfitAdditionalInfo})`;
    if (isFinalLook) {
      const baseFinal = config.finalLookType === 'Custom Outfit' ? config.finalLook : config.finalLookType;
      targetOutfit = config.finalLookAdditionalInfo ? `${baseFinal} (${config.finalLookAdditionalInfo})` : baseFinal;
    }

    const hair = config.hairstyle?.includes('Custom') ? config.customHairstyle : config.hairstyle;
    const makeup = config.makeup === 'Custom' ? config.customMakeup : config.makeup;
    const skin = config.skinComplexion === 'Custom' ? config.customSkinComplexion : `${config.skinComplexion} ${config.skinUndertone}`;
    const nails = config.nailStyle === 'Custom' ? config.customNailStyle : config.nailStyle;

    let prompt = `Create a stylish fashion portrait inspired by the reference photo. The subject should resemble the person in the reference. Full-length view, studio-quality lighting, editorial fashion photography style.`;

    if (environmentImages && Array.isArray(environmentImages) && environmentImages.length > 1) {
      prompt += ` Multiple reference images of the same environment are provided showing different angles. Use these as the setting/backdrop. Maintain exact spatial consistency — keep all fixtures, appliances, and furniture in their original positions.`;
    } else if (environmentImage || (environmentImages && environmentImages.length === 1)) {
      prompt += ` Use the provided environment image as the setting/backdrop.`;
    } else {
      prompt += ` Setting: a clean, modern backdrop suitable for fashion or lifestyle content.`;
    }

    if (isFinalLook) {
      prompt += ` This is the final styled look. Outfit: ${targetOutfit}. The subject should look polished and put-together.`;
    } else {
      prompt += ` Outfit: ${targetOutfit}.`;
    }

    prompt += `
Style details:
- Hair: ${hair}
- Makeup: ${makeup}
- Skin tone: ${skin}
- Nails: ${nails}
- Aspect ratio: 9:16
- Style: editorial fashion photography, tasteful, fully clothed`;

    if (config.exactMatch) {
      prompt += `\nIMPORTANT: Closely match the person's facial features and appearance from the reference photo.`;
    }

    contentParts.push({ type: "text", text: prompt });

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
      console.error("Character preview API error:", response.status, t);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Preview generation failed: ${response.status} - ${t.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log("Character preview response keys:", JSON.stringify(Object.keys(data)));
    if (data.choices?.[0]) {
      console.log("Message keys:", JSON.stringify(Object.keys(data.choices[0].message || {})));
      const content = data.choices[0].message?.content;
      if (Array.isArray(content)) {
        console.log("Content parts types:", JSON.stringify(content.map((p: any) => p.type)));
      } else if (typeof content === "string") {
        console.log("Content is string, length:", content.length);
      }
    }

    // Check for safety block
    const finishReason = data.choices?.[0]?.finish_reason;
    const nativeReason = data.choices?.[0]?.native_finish_reason;
    if (nativeReason === "IMAGE_SAFETY" || finishReason === "content_filter") {
      console.error("Image blocked by safety filter:", nativeReason);
      throw new Error("The image was blocked by safety filters. Try adjusting the style settings or using a different reference photo.");
    }

    const imageUrl = extractImageFromResponse(data);
    if (!imageUrl) {
      console.error("Could not extract image. Full response:", JSON.stringify(data).substring(0, 1000));
      throw new Error("Character preview generation failed - no image in response. Please try again.");
    }

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("generate-character-preview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

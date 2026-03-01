import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { referenceImage, environmentImage, config, isFinalLook } = await req.json();

    const contentParts: any[] = [
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${referenceImage}` } }
    ];

    if (environmentImage) {
      const envBase64 = environmentImage.includes(',') ? environmentImage.split(',')[1] : environmentImage;
      contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${envBase64}` } });
    }

    // Determine outfit
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

    let prompt = `Generate a photorealistic character portrait based on the reference image. Ensure the character matches the reference face/identity. Full body shot, professional lighting.`;

    if (environmentImage) {
      prompt += ` BACKGROUND: STRICTLY USE the provided environment reference image as the background.`;
    } else {
      prompt += ` BACKGROUND: Create a high-quality aesthetic background suitable for a ${config.creationMode === 'vlog' ? config.vlogCategory : 'Influencer'} setting.`;
    }

    if (isFinalLook) {
      prompt += ` IMPORTANT: This is the "Final Look" reveal. OUTFIT MUST BE: ${targetOutfit}. The character should look glamorous. Do NOT use the starting outfit.`;
    } else {
      prompt += ` Outfit: ${targetOutfit}.`;
    }

    prompt += `
MANDATORY STYLE DETAILS:
- Hairstyle: ${hair}
- Makeup: ${makeup}
- Skin: ${skin}
- Nails: ${nails}

Aspect Ratio: 9:16`;

    if (config.exactMatch) {
      prompt += `\nCRITICAL: STRICT FACIAL & BODY CLONING. Generate the EXACT SAME person from the reference. Match face, skin tone, and body shape precisely.`;
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
      console.error("Character preview error:", response.status, t);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Preview generation failed: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error("Character preview generation failed");

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

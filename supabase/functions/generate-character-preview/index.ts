import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as decodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSceneBehaviorPrompt(sceneDescription: string): string {
  const d = sceneDescription.toLowerCase();
  if (/\b(bathroom|vanity|mirror|restroom|powder room)\b/.test(d)) {
    return "The subject is facing the mirror, viewing their own reflection. Camera captures from behind or to the side. Natural bathroom behavior — adjusting hair, examining reflection, applying product while looking in the mirror, NOT at the camera.";
  }
  if (/\b(kitchen|cooking|stove|counter|baking)\b/.test(d)) {
    return "The subject is naturally engaged with the kitchen environment — looking at what they're doing, interacting with surfaces/appliances. NOT posing for the camera.";
  }
  if (/\b(closet|wardrobe|dressing room)\b/.test(d)) {
    return "The subject is browsing or selecting clothing, looking at garments or their reflection in a closet/dressing mirror. Natural getting-ready behavior.";
  }
  if (/\b(gym|workout|fitness|exercise)\b/.test(d)) {
    return "The subject is mid-activity or naturally resting between sets. Engaged with equipment or their form, not posing at the camera.";
  }
  if (/\b(office|desk|workspace|study)\b/.test(d)) {
    return "The subject is naturally engaged with their work environment — looking at a screen, writing, or in thought. Candid, not posed.";
  }
  return "";
}

function extractImageFromResponse(data: any): string | null {
  const img1 = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (img1) return img1;
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === "image_url" && part.image_url?.url) return part.image_url.url;
      if (part.type === "image" && part.image_url?.url) return part.image_url.url;
      if (part.type === "image_url" && typeof part.image_url === "string") return part.image_url;
    }
  }
  const parts = data?.choices?.[0]?.message?.parts;
  if (Array.isArray(parts)) {
    for (const part of parts) {
      if (part.inline_data?.data) return `data:${part.inline_data.mime_type || 'image/png'};base64,${part.inline_data.data}`;
    }
  }
  if (data?.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
  if (data?.data?.[0]?.url) return data.data[0].url;
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const {
      // URL-based fields (preferred — lightweight)
      referenceImageUrls,
      environmentImageUrls,
      // Legacy base64 fields (fallback)
      referenceImage,
      referenceImages,
      environmentImage,
      environmentImages,
      config,
      isFinalLook,
      identityAnchorUrl,
      environmentLabel,
    } = await req.json();

    const contentParts: any[] = [];

    // --- Identity anchor (always a URL) ---
    let hasIdentityAnchor = false;
    if (identityAnchorUrl) {
      contentParts.push({ type: "image_url", image_url: { url: identityAnchorUrl } });
      hasIdentityAnchor = true;
      console.log("Identity anchor placed FIRST in content array (URL)");
    }

    // --- Reference images ---
    const refUrls: string[] = referenceImageUrls ?? [];
    if (refUrls.length > 0) {
      for (const url of refUrls) {
        contentParts.push({ type: "image_url", image_url: { url } });
      }
    } else if (referenceImages && Array.isArray(referenceImages) && referenceImages.length > 0) {
      // Legacy base64 fallback
      for (const refImg of referenceImages) {
        const b = refImg.includes(',') ? refImg : `data:image/jpeg;base64,${refImg}`;
        contentParts.push({ type: "image_url", image_url: { url: b } });
      }
    } else if (referenceImage) {
      const b = referenceImage.includes(',') ? referenceImage : `data:image/jpeg;base64,${referenceImage}`;
      contentParts.push({ type: "image_url", image_url: { url: b } });
    }

    // --- Text separator before environment images ---
    const envUrls: string[] = environmentImageUrls ?? [];
    const hasEnvImages = envUrls.length > 0 || (environmentImages && Array.isArray(environmentImages) && environmentImages.length > 0) || environmentImage;
    
    if (hasEnvImages) {
      const envLabelText = environmentLabel ? `The environment is: "${environmentLabel}". ` : '';
      contentParts.push({ type: "text", text: `${envLabelText}The following images show the ENVIRONMENT/ROOM — reproduce this space EXACTLY as shown:` });
    }

    // --- Environment images ---
    if (envUrls.length > 0) {
      for (const url of envUrls) {
        contentParts.push({ type: "image_url", image_url: { url } });
      }
    } else if (environmentImages && Array.isArray(environmentImages) && environmentImages.length > 0) {
      for (const envImg of environmentImages) {
        const b = envImg.includes(',') ? envImg : `data:image/jpeg;base64,${envImg}`;
        contentParts.push({ type: "image_url", image_url: { url: b } });
      }
    } else if (environmentImage) {
      const b = environmentImage.includes(',') ? environmentImage : `data:image/jpeg;base64,${environmentImage}`;
      contentParts.push({ type: "image_url", image_url: { url: b } });
    }

    // Sanitize outfit descriptions
    const sanitizeOutfitDescription = (desc: string): string => {
      if (!desc) return desc;
      return desc
        .replace(/\bteddy\b/gi, 'sleepwear set')
        .replace(/\blingerie\b/gi, 'loungewear')
        .replace(/\bbodysuit\b/gi, 'fitted top')
        .replace(/\bcorset\b/gi, 'structured top')
        .replace(/\bnegligee\b/gi, 'silk nightgown')
        .replace(/\bbra\b/gi, 'crop top')
        .replace(/\bthong\b/gi, 'shorts')
        .replace(/\bbikini\b/gi, 'two-piece swimwear')
        .replace(/\bsee[- ]?through\b/gi, 'sheer-accent')
        .replace(/\bsexy\b/gi, 'elegant')
        .replace(/\blow[- ]?cut\b/gi, 'v-neck');
    };

    let targetOutfit = config.outfitType === 'Custom Outfit' ? config.outfitDetails : config.outfitType;
    if (config.outfitAdditionalInfo && !isFinalLook) targetOutfit += ` (${config.outfitAdditionalInfo})`;
    if (isFinalLook) {
      const baseFinal = config.finalLookType === 'Custom Outfit' ? config.finalLook : config.finalLookType;
      targetOutfit = config.finalLookAdditionalInfo ? `${baseFinal} (${config.finalLookAdditionalInfo})` : baseFinal;
    }
    targetOutfit = sanitizeOutfitDescription(targetOutfit);

    const hair = config.hairstyle?.includes('Custom') ? config.customHairstyle : config.hairstyle;
    const makeup = config.makeup === 'Custom' ? config.customMakeup : config.makeup;
    const skin = config.skinComplexion === 'Custom' ? config.customSkinComplexion : `${config.skinComplexion} ${config.skinUndertone}`;
    const nails = config.nailStyle === 'Custom' ? config.customNailStyle : config.nailStyle;

    const hasMultiRef = (refUrls.length > 1) || (referenceImages && referenceImages.length > 1);
    const multiRefNote = hasMultiRef
      ? `Multiple reference photos of the SAME person are provided from different angles (face, profile, full body). Use ALL of them to accurately reproduce this person's exact appearance — facial structure, skin tone, body proportions, and features.`
      : '';

    const identityAnchorNote = hasIdentityAnchor
      ? `CRITICAL: The FIRST image provided is an already-generated canonical identity of this EXACT person. It is the GROUND TRUTH. You MUST match this person's face shape, jawline, nose, lips, eyes, eyebrows, skin tone, and body proportions EXACTLY. The subsequent reference photos provide supplementary angles — use them for additional detail but defer to the first image for identity.`
      : '';

    const hasEnv = hasEnvImages;
    const hasMultiEnv = envUrls.length > 1 || (environmentImages && environmentImages.length > 1);

    const envLabelPrompt = environmentLabel ? `The environment is: "${environmentLabel}". ` : '';

    let prompt = `Create a stylish fashion portrait based on the reference photo(s).

IDENTITY PRESERVATION (CRITICAL):
- The subject MUST closely match the person in the reference photo(s) — same facial structure, bone structure, skin tone, body proportions, hair texture, and age.
- Do NOT alter their appearance, ethnicity, age, or body type.
- IMPORTANT: This generated image will serve as the CANONICAL IDENTITY REFERENCE for ALL future scenes. Every subsequent scene will use THIS image as the single source of truth for the character's appearance. Accuracy to the reference photo is PARAMOUNT — the generated character must be immediately recognizable as the same person in every future scene.
${multiRefNote}
${identityAnchorNote}

Full-length view, studio-quality lighting, editorial fashion photography style.`;

    if (hasMultiEnv) {
      prompt += `\n\nENVIRONMENT FIDELITY (CRITICAL): ${envLabelPrompt}Multiple angles of the SAME space are provided as environment reference images. You MUST reproduce this environment PRECISELY — same wall colors, flooring, furniture, fixtures, lighting direction, and camera perspective. Cross-reference all angles to ensure spatial accuracy — objects visible in one angle must be consistent with their position in other angles. Do NOT substitute, rearrange, recolor, or reimagine ANY element of the space. The character is placed INTO this real environment exactly as shown.`;
    } else if (hasEnv) {
      prompt += `\n\nENVIRONMENT FIDELITY (CRITICAL): ${envLabelPrompt}The environment reference image provided shows the EXACT room/space. You MUST reproduce this environment PRECISELY — same wall colors, flooring, furniture, fixtures, lighting direction, and camera perspective. Do NOT substitute, rearrange, recolor, or reimagine ANY element of the space. The character is placed INTO this real environment exactly as shown.`;
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
      prompt += `\nSTRICT MODE: Match the EXACT facial features, skin tone, and proportions from the reference photo. This person must be immediately recognizable as the same individual.`;
    }

    if (config.ultraRealistic) {
      prompt += `\nUltra-realistic, shot on a real iPhone Pro back-facing camera, 8K resolution, natural perspective. Skin appears hyper-realistic with visible pores, natural texture, and subtle imperfections, showcasing real-world skin detail. Enhancing realism without looking overdone. Photorealistic color grading, sharp facial focus, true-to-life contrast, no artificial smoothing, no filters, no stylization. No text, logos, captions, or overlays anywhere in the image.`;
    }

    const behaviorPrompt = hasEnv ? getSceneBehaviorPrompt(prompt) : "";
    if (behaviorPrompt) {
      prompt += `\n${behaviorPrompt}`;
    } else if (hasEnv) {
      prompt += `\nThe subject should interact naturally with the environment. Pose and gaze should reflect realistic behavior for the setting, not direct-to-camera posing.`;
    }

    contentParts.push({ type: "text", text: prompt });

    console.log(`Sending ${contentParts.length} content parts (images as URLs, no base64 in memory)`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
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

    const finishReason = data.choices?.[0]?.finish_reason;
    const nativeReason = data.choices?.[0]?.native_finish_reason;
    if (nativeReason === "IMAGE_SAFETY" || finishReason === "content_filter") {
      throw new Error("The image was blocked by safety filters. Try adjusting the style settings or using a different reference photo.");
    }

    const imageUrl = extractImageFromResponse(data);
    if (!imageUrl) {
      console.error("Could not extract image. Full response:", JSON.stringify(data).substring(0, 1000));
      throw new Error("Character preview generation failed - no image in response. Please try again.");
    }

    // Upload preview to storage
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    let userId = "anonymous";
    if (authHeader) {
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseAuth.auth.getUser(token);
      if (user) userId = user.id;
    }

    let bytes: Uint8Array;
    if (imageUrl.startsWith("data:")) {
      const base64Data = imageUrl.split(",")[1];
      bytes = decodeBase64(base64Data);
    } else {
      const imgResp = await fetch(imageUrl);
      bytes = new Uint8Array(await imgResp.arrayBuffer());
    }

    const previewType = isFinalLook ? 'final-look' : 'character-preview';
    const fileName = `${userId}/${previewType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: uploadError } = await supabaseClient.storage
      .from("ai-studio")
      .upload(fileName, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Preview upload error:", uploadError);
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: publicUrlData } = supabaseClient.storage.from("ai-studio").getPublicUrl(fileName);
    console.log(`Preview uploaded to storage: ${publicUrlData.publicUrl}`);

    return new Response(JSON.stringify({ imageUrl: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("generate-character-preview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

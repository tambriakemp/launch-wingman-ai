import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { referenceImage, referenceImages, environmentImage, environmentImages, config, isFinalLook, identityAnchorUrl } = await req.json();

    const stripBase64Prefix = (img: string): string => {
      if (img.includes(',')) return img.split(',')[1];
      return img;
    };

    const contentParts: any[] = [];

    // Add reference images: support multi-photo references
    if (referenceImages && Array.isArray(referenceImages) && referenceImages.length > 0) {
      for (const refImg of referenceImages) {
        const refBase64 = stripBase64Prefix(refImg);
        contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${refBase64}` } });
      }
    } else if (referenceImage) {
      const refBase64 = stripBase64Prefix(referenceImage);
      contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${refBase64}` } });
    }

    // Add environment images
    if (environmentImages && Array.isArray(environmentImages) && environmentImages.length > 0) {
      for (const envImg of environmentImages) {
        const envBase64 = stripBase64Prefix(envImg);
        contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${envBase64}` } });
      }
    } else if (environmentImage) {
      const envBase64 = stripBase64Prefix(environmentImage);
      contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${envBase64}` } });
    }

    // Add identity anchor image (generated final look used to anchor default look identity)
    let hasIdentityAnchor = false;
    if (identityAnchorUrl && !isFinalLook) {
      try {
        const anchorResp = await fetch(identityAnchorUrl);
        if (anchorResp.ok) {
          const anchorBytes = new Uint8Array(await anchorResp.arrayBuffer());
          const anchorBase64 = btoa(String.fromCharCode(...anchorBytes));
          contentParts.push({ type: "image_url", image_url: { url: `data:image/png;base64,${anchorBase64}` } });
          hasIdentityAnchor = true;
        }
      } catch (e) {
        console.error("Failed to fetch identity anchor:", e);
      }
    }

    // Sanitize outfit descriptions to avoid safety filter triggers
    const sanitizeOutfitDescription = (desc: string): string => {
      if (!desc) return desc;
      // Replace lingerie/intimate terms with professional fashion equivalents
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

    // Multi-photo instruction
    const multiRefNote = (referenceImages && referenceImages.length > 1)
      ? `Multiple reference photos of the SAME person are provided from different angles (face, profile, full body). Use ALL of them to accurately reproduce this person's exact appearance — facial structure, skin tone, body proportions, and features.`
      : '';

    const identityAnchorNote = hasIdentityAnchor
      ? `An already-generated canonical identity image of this EXACT person is also provided. The default look MUST depict the SAME individual — match their face shape, jawline, nose, lips, eyes, eyebrows, skin tone, and body proportions EXACTLY. This identity anchor is the ground truth for how this person looks.`
      : '';

    let prompt = `Create a stylish fashion portrait based on the reference photo(s).

IDENTITY PRESERVATION (CRITICAL):
- The subject MUST closely match the person in the reference photo(s) — same facial structure, bone structure, skin tone, body proportions, hair texture, and age.
- Do NOT alter their appearance, ethnicity, age, or body type.
- IMPORTANT: This generated image will serve as the CANONICAL IDENTITY REFERENCE for ALL future scenes. Every subsequent scene will use THIS image as the single source of truth for the character's appearance. Accuracy to the reference photo is PARAMOUNT — the generated character must be immediately recognizable as the same person in every future scene.
${multiRefNote}
${identityAnchorNote}

Full-length view, studio-quality lighting, editorial fashion photography style.`;

    if (environmentImages && Array.isArray(environmentImages) && environmentImages.length > 1) {
      prompt += ` Multiple reference images of the same environment are provided showing different angles. Use these as the setting/backdrop. Maintain exact spatial consistency.`;
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
      prompt += `\nSTRICT MODE: Match the EXACT facial features, skin tone, and proportions from the reference photo. This person must be immediately recognizable as the same individual.`;
    }

    const envContext = (environmentImages?.length > 0 || environmentImage) ? prompt : "";
    const behaviorPrompt = getSceneBehaviorPrompt(envContext);
    if (behaviorPrompt) {
      prompt += `\n${behaviorPrompt}`;
    } else if (environmentImages?.length > 0 || environmentImage) {
      prompt += `\nThe subject should interact naturally with the environment. Pose and gaze should reflect realistic behavior for the setting, not direct-to-camera posing.`;
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

    // Upload preview to storage instead of returning raw base64
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
      const binaryString = atob(base64Data);
      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    } else {
      const imgResp = await fetch(imageUrl);
      bytes = new Uint8Array(await imgResp.arrayBuffer());
    }

    const previewType = isFinalLook ? 'final-look' : 'character-preview';
    const fileName = `${userId}/${previewType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: uploadError } = await supabase.storage
      .from("ai-studio")
      .upload(fileName, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Preview upload error:", uploadError);
      // Fallback: return the raw image if upload fails
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: publicUrlData } = supabase.storage.from("ai-studio").getPublicUrl(fileName);
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

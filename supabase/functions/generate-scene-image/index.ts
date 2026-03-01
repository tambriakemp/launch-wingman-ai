import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Scene/Environment mismatch detection ---
const LOCATION_KEYWORDS: Record<string, RegExp> = {
  bathroom: /\b(bathroom|vanity|mirror|restroom|powder room|shower|bathtub)\b/i,
  kitchen: /\b(kitchen|cooking|stove|counter|baking|oven|fridge)\b/i,
  bedroom: /\b(bedroom|bed|nightstand|pillow|duvet|sleeping)\b/i,
  office: /\b(office|desk|workspace|study|computer)\b/i,
  gym: /\b(gym|workout|fitness|exercise|treadmill|weights)\b/i,
  outdoor: /\b(outdoor|park|garden|street|sidewalk|beach|lake|mountain)\b/i,
  entryway: /\b(front door|entryway|hallway|foyer|doorstep|porch|entrance)\b/i,
  closet: /\b(closet|wardrobe|dressing room)\b/i,
  livingroom: /\b(living room|couch|sofa|tv|television|lounge)\b/i,
};

function detectSceneLocationMismatch(scenePrompt: string, envLabel?: string): string {
  const sceneLocation = Object.entries(LOCATION_KEYWORDS).find(([, re]) => re.test(scenePrompt));
  if (!sceneLocation) return "";

  // If we have an environment label/context, check for mismatch
  if (envLabel) {
    const envLocation = Object.entries(LOCATION_KEYWORDS).find(([, re]) => re.test(envLabel));
    if (envLocation && envLocation[0] !== sceneLocation[0]) {
      return `IMPORTANT: The scene description specifies a "${sceneLocation[0]}" setting, but the environment reference image shows a different location. For this scene, IGNORE the background reference image and create the setting described in the scene prompt instead. Use the described "${sceneLocation[0]}" environment.`;
    }
  }
  return "";
}

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
  const images = data?.choices?.[0]?.message?.images;
  if (Array.isArray(images) && images.length > 0) {
    const img = images[0];
    if (img?.image_url?.url) return img.image_url.url;
    if (img?.url) return img.url;
    if (img?.b64_json) return `data:image/png;base64,${img.b64_json}`;
  }
  const content = data?.choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === "image_url" && part.image_url?.url) return part.image_url.url;
      if (part.type === "image" && part.image_url?.url) return part.image_url.url;
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

    const { prompt, referenceImage, productImage, environmentImage, environmentImages, previewCharacter, config, lockedRefs, isFinalLook, isUpscale, baseImageUrl, anchorImageUrl, referenceImages, environmentLabel, previousScenePrompt, nextScenePrompt, sceneNumber, totalScenes } = await req.json();

    const stripPrefix = (img: string): string => {
      if (!img) return "";
      let c = img.trim();
      if (c.startsWith("data:") && c.includes(",")) c = c.split(",")[1];
      return c.replace(/\s/g, "");
    };

    const contentParts: any[] = [];

    if (isUpscale && baseImageUrl) {
      contentParts.push({ type: "image_url", image_url: { url: baseImageUrl } });
      contentParts.push({ type: "text", text: "Enhance this image to high quality. Maintain exact details, just increase clarity and resolution." });
    } else {
      // Add locked references first (high priority)
      if (lockedRefs && lockedRefs.length > 0) {
        for (const ref of lockedRefs) {
          const clean = stripPrefix(ref.base64);
          contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${clean}` } });
        }
      }

      // Add anchor image (previously generated scene = strongest identity reference)
      const hasOutfitLock = lockedRefs?.find((r: any) => r.type === 'outfit');
      const hasCharacterLock = lockedRefs?.find((r: any) => r.type === 'character');
      if (anchorImageUrl && !hasCharacterLock) {
        contentParts.push({ type: "image_url", image_url: { url: anchorImageUrl } });
      }

      // STRICT IDENTITY GATE: When previewCharacter exists, it is the CANONICAL identity.
      // Raw referenceImage/referenceImages are IGNORED to prevent competing identity signals.
      if (!hasCharacterLock) {
        if (previewCharacter) {
          const clean = stripPrefix(previewCharacter);
          contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${clean}` } });
          // DO NOT add raw references — preview is the single source of truth
        } else if (referenceImages && Array.isArray(referenceImages) && referenceImages.length > 0) {
          for (const refImg of referenceImages) {
            const clean = stripPrefix(refImg);
            contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${clean}` } });
          }
        } else if (referenceImage) {
          const clean = stripPrefix(referenceImage);
          contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${clean}` } });
        }
      }

      if (productImage && config.creationMode === 'ugc') {
        const clean = stripPrefix(productImage);
        contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${clean}` } });
      }

      // Add environment images
      if (environmentImages && Array.isArray(environmentImages) && environmentImages.length > 0 && !lockedRefs?.find((r: any) => r.type === 'environment')) {
        for (const envImg of environmentImages) {
          const clean = stripPrefix(envImg);
          contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${clean}` } });
        }
      } else if (environmentImage && !lockedRefs?.find((r: any) => r.type === 'environment')) {
        const clean = stripPrefix(environmentImage);
        contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${clean}` } });
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
      if (lockedRefs?.find((r: any) => r.type === 'outfit')) lockInstructions += "Use the exact outfit shown in the outfit reference image. ";
      if (hasCharacterLock) lockInstructions += "Match the face and appearance from the character reference image closely. ";
      if (lockedRefs?.find((r: any) => r.type === 'environment')) lockInstructions += "Use the provided background reference as the setting. ";
      if (environmentImages && environmentImages.length > 1) lockInstructions += "Multiple reference images of the same environment are provided showing different angles. Maintain exact spatial consistency — keep all fixtures, appliances, and furniture in their original positions. ";

      // Anchor image instruction (character + outfit identity)
      let anchorInstruction = "";
      if (anchorImageUrl && !hasCharacterLock) {
        anchorInstruction = `CRITICAL IDENTITY REFERENCE: One of the provided images is a previously generated scene of this SAME character. The person in that image IS the character — replicate their EXACT face, body type, skin tone, hair texture, and proportions. Only change the pose, setting, and outfit as described below.`;
      }

      // CANONICAL IDENTITY instruction when preview exists
      let canonicalIdentityInstruction = "";
      if (previewCharacter) {
        canonicalIdentityInstruction = `CANONICAL IDENTITY (CRITICAL): A GENERATED CHARACTER PREVIEW image is provided. This is the DEFINITIVE, CANONICAL identity for this character. You MUST replicate this EXACT person — same face, bone structure, skin tone, body type, hair, and all distinguishing features. Do NOT deviate from this person's appearance under any circumstances. This preview is the SINGLE SOURCE OF TRUTH for the character's identity.`;
      }

      // Multi-photo reference instruction
      let multiRefInstruction = "";
      if (!previewCharacter && referenceImages && referenceImages.length > 1 && !hasCharacterLock) {
        multiRefInstruction = `Multiple reference photos of the SAME person are provided from different angles (face, profile, full body). Use ALL of them to accurately reproduce this person's exact appearance — facial structure, skin tone, body proportions, and features.`;
      }

      // Scene/environment mismatch guard
      const mismatchGuard = detectSceneLocationMismatch(prompt, environmentLabel);

      // Scene continuity context
      let sceneContextInstruction = "";
      if (sceneNumber && totalScenes) {
        sceneContextInstruction += `\nSCENE CONTEXT: This is scene ${sceneNumber} of ${totalScenes}.`;
      }
      if (previousScenePrompt) {
        sceneContextInstruction += `\nPREVIOUS SCENE: "${previousScenePrompt}"\nMaintain visual continuity from the previous scene — same lighting, time of day, and spatial context. The character's position and action should naturally follow from the previous scene.`;
      }
      if (nextScenePrompt) {
        sceneContextInstruction += `\nNEXT SCENE: "${nextScenePrompt}"\nAnticipate the transition — the character's pose and position should naturally lead into the next scene.`;
      }

      const fullPrompt = `Create a high-quality, editorial-style fashion photograph.

IDENTITY PRESERVATION (CRITICAL):
- This is the SAME person across all images. Match their EXACT facial structure, bone structure, skin tone, body proportions, hair texture, and age.
- Do NOT change the character's appearance, age, ethnicity, or body type between scenes.
- Do NOT add or remove facial features, freckles, beauty marks, or other distinguishing characteristics.
${canonicalIdentityInstruction}
${anchorInstruction}
${multiRefInstruction}

Outfit: ${currentOutfit}
${previewCharacter && !anchorImageUrl ? 'A reference image is provided showing the character with their styled look. Replicate the outfit consistently.' : ''}

Scene: ${prompt}

Style details:
- Hair: ${hair}
- Makeup: ${makeup}
- Skin tone: ${skin}
- Nails: ${nails}

${lockInstructions}

${config.exactMatch ? 'STRICT MODE: Closely match the EXACT facial features, skin tone, and proportions from the reference photo. This person must be immediately recognizable as the same individual.' : ''}
${config.creationMode === 'ugc' ? 'Feature the product prominently in the scene.' : ''}

${mismatchGuard}
${sceneContextInstruction}

Style: editorial fashion photography, professional lighting, tasteful, fully clothed.

${getSceneBehaviorPrompt(prompt) || (environmentImages?.length > 0 || environmentImage ? "The subject should interact naturally with the environment. Pose and gaze should reflect realistic behavior for the setting, not direct-to-camera posing." : "")}`;

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

    const finishReason = data.choices?.[0]?.native_finish_reason || data.choices?.[0]?.finish_reason;
    if (finishReason === "IMAGE_SAFETY") {
      return new Response(JSON.stringify({ error: "Image blocked by safety filter. Try a different prompt or scene description." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let imageUrl = extractImageFromResponse(data);
    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image generated");
    }

    // Upload to storage
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    let userId = "anonymous";
    if (authHeader) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
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

    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: uploadError } = await supabase.storage
      .from("ai-studio")
      .upload(fileName, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
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

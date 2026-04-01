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

    const { prompt, referenceImage, productImage, environmentImage, environmentImages, previewCharacter, config, lockedRefs, isFinalLook, isUpscale, baseImageUrl, anchorImageUrl, referenceImages, environmentLabel, previousScenePrompt, nextScenePrompt, previousSceneImageUrl, sceneNumber, totalScenes, aspectRatio } = await req.json();

    // Build aspect ratio orientation instruction
    const getOrientationInstruction = (ar: string): string => {
      switch (ar) {
        case '9:16': return '\nOUTPUT FORMAT (CRITICAL): Generate a PORTRAIT oriented image (9:16 aspect ratio, TALLER than wide). The image MUST be in vertical/portrait orientation.';
        case '16:9': return '\nOUTPUT FORMAT (CRITICAL): Generate a LANDSCAPE oriented image (16:9 aspect ratio, WIDER than tall). The image MUST be in horizontal/landscape orientation.';
        case '1:1': return '\nOUTPUT FORMAT (CRITICAL): Generate a SQUARE image (1:1 aspect ratio). The image MUST have equal width and height.';
        default: return '';
      }
    };
    const orientationInstruction = getOrientationInstruction(aspectRatio || config?.aspectRatio || '9:16');

    const isUrl = (img: string): boolean => /^https?:\/\//i.test(img?.trim() || "");

    const stripPrefix = (img: string): string => {
      if (!img) return "";
      let c = img.trim();
      if (c.startsWith("data:") && c.includes(",")) c = c.split(",")[1];
      return c.replace(/\s/g, "");
    };

    // Helper: push an image part, auto-detecting URL vs base64
    const pushImage = (img: string) => {
      if (!img) return;
      if (isUrl(img)) {
        contentParts.push({ type: "image_url", image_url: { url: img } });
      } else {
        const clean = stripPrefix(img);
        contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${clean}` } });
      }
    };

    // Sanitize outfit descriptions to avoid safety filter triggers
    const sanitizeOutfit = (desc: string): string => {
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

    const contentParts: any[] = [];

    if (isUpscale && baseImageUrl) {
      pushImage(baseImageUrl);
      contentParts.push({ type: "text", text: "Enhance this image to high quality. Maintain exact details, just increase clarity and resolution." });
    } else {
      // Add locked references first (high priority)
      if (lockedRefs && lockedRefs.length > 0) {
        for (const ref of lockedRefs) {
          pushImage(ref.base64);
        }
      }

      // Add anchor image (previously generated scene = strongest identity reference)
      const hasOutfitLock = lockedRefs?.find((r: any) => r.type === 'outfit');
      const hasCharacterLock = lockedRefs?.find((r: any) => r.type === 'character');
      if (anchorImageUrl && !hasCharacterLock) {
        pushImage(anchorImageUrl);
      }

      // STRICT IDENTITY GATE: When previewCharacter exists, it is the CANONICAL identity.
      if (!hasCharacterLock) {
        if (previewCharacter) {
          pushImage(previewCharacter);
          console.log(`[Identity Gate] Using canonical preview as identity source (${isUrl(previewCharacter) ? 'URL' : 'base64'})`);
        } else if (referenceImages && Array.isArray(referenceImages) && referenceImages.length > 0) {
          for (const refImg of referenceImages) {
            pushImage(refImg);
          }
        } else if (referenceImage) {
          pushImage(referenceImage);
        }
      }

      if (productImage && config.creationMode === 'ugc') {
        pushImage(productImage);
      }

      // Add environment images with text separator for clarity
      const hasEnvImages = (environmentImages && Array.isArray(environmentImages) && environmentImages.length > 0) || environmentImage;
      const hasEnvLock = lockedRefs?.find((r: any) => r.type === 'environment');
      if (hasEnvImages && !hasEnvLock) {
        const envLabelText = environmentLabel ? `The environment is: "${environmentLabel}". ` : '';
        contentParts.push({ type: "text", text: `${envLabelText}The following images show the ENVIRONMENT/ROOM — reproduce this space EXACTLY as shown:` });
        if (environmentImages && Array.isArray(environmentImages) && environmentImages.length > 0) {
          const cappedEnvImages = environmentImages.slice(0, 3);
          for (const envImg of cappedEnvImages) {
            pushImage(envImg);
          }
        } else if (environmentImage) {
          pushImage(environmentImage);
        }
      }

      // Add previous scene's generated image for visual continuity chaining
      if (previousSceneImageUrl) {
        pushImage(previousSceneImageUrl);
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
      // Removed weak spatial consistency line — replaced by strict ENVIRONMENT FIDELITY block below

      currentOutfit = sanitizeOutfit(currentOutfit);

      // Multi-photo reference instruction (only used when no preview)
      let multiRefInstruction = "";
      if (!previewCharacter && referenceImages && referenceImages.length > 1 && !hasCharacterLock) {
        multiRefInstruction = `Multiple reference photos of the SAME person are provided from different angles. Use ALL of them to reproduce this person's exact appearance.`;
      }

      // Scene/environment mismatch guard
      const mismatchGuard = detectSceneLocationMismatch(prompt, environmentLabel);

      // Build environment fidelity instruction
      let envFidelityInstruction = "";
      const hasEnvRef = (environmentImages && environmentImages.length > 0) || environmentImage;
      if (hasEnvRef && !mismatchGuard) {
        const envLabelText = environmentLabel ? `The environment is: "${environmentLabel}". ` : '';
        envFidelityInstruction = `\nENVIRONMENT FIDELITY (CRITICAL): ${envLabelText}The environment reference image(s) show the EXACT room/space. You MUST reproduce this environment PRECISELY — same wall colors, flooring, furniture, fixtures, lighting direction, and camera perspective. Do NOT substitute, rearrange, or reimagine any element of the space. The character is placed INTO this real environment.`;
        if (environmentImages && environmentImages.length > 1) {
          envFidelityInstruction += ` Multiple angles of the SAME space are provided. Cross-reference all angles to ensure spatial accuracy — objects visible in one angle must be consistent with their position in other angles.`;
        }
      }

      // Continuity chaining instruction when previous scene image is provided
      let continuityInstruction = "";
      if (previousSceneImageUrl) {
        if (config.creationMode === 'carousel') {
          continuityInstruction = `\nCAROUSEL SLIDE CONTINUITY: The previous slide's image has been provided. This is part of a COHESIVE carousel set. Maintain EXACT visual continuity — the subject's hair (style, position, flow), ALL accessories (rings, bracelets, necklaces, earrings), nail color, outfit details, and every visible element MUST be IDENTICAL to the previous slide. Only the SHOT ANGLE and FRAMING should change. Do NOT add, remove, or modify any detail.`;
        } else {
          continuityInstruction = `\nSCENE CONTINUITY: A previous scene image from this sequence has been provided. Maintain visual continuity — similar lighting, time of day, and spatial awareness. The person should appear to be continuing naturally from the previous scene. However, keep identity anchored to the canonical character preview. Create a DISTINCT composition and pose that matches THIS scene's description, NOT a copy of the previous scene.`;
        }
      }

      // Carousel-specific consistency block
      let carouselConsistencyInstruction = "";
      if (config.creationMode === 'carousel') {
        carouselConsistencyInstruction = `\nCAROUSEL CONSISTENCY (CRITICAL): This image is part of a cohesive carousel set. The subject's hair (exact style, length, position — down, up, ponytail, etc.), ALL accessories (rings, bracelets, necklaces, earrings, watches), nail color, jewelry, and every visible detail MUST remain IDENTICAL to the reference/anchor image. Do NOT add, remove, or change ANY accessories, hairstyle, or detail between slides. If the anchor shows hair down with no rings, EVERY slide must show hair down with no rings. Only the shot angle, framing, and composition should differ.`;
      }

      // Build prompt as EDIT instruction when preview exists, otherwise generate from scratch
      let fullPrompt: string;
      
      if (previewCharacter) {
        // EDIT MODE: The character preview is the base image — instruct the model to modify it
        fullPrompt = `OUTPUT: Generate exactly ONE single photograph. Do NOT create collages, grids, split-screen images, or multiple panels.

EDIT THIS IMAGE: Keep the person's face, body, and identity EXACTLY the same. Change ONLY the following:

1. SCENE: Place this person in the following setting — ${prompt}
2. OUTFIT: Change their clothing to — ${currentOutfit}
3. STYLE: Hair: ${hair}, Makeup: ${makeup}, Skin tone: ${skin}, Nails: ${nails}

CRITICAL RULES:
- The person's face, bone structure, skin tone, body type, and age must remain IDENTICAL to the provided image.
- Only change pose, clothing, and background as described above.
${lockInstructions}
${config.exactMatch ? '- STRICT MODE: This person must be immediately recognizable as the same individual.' : ''}
${config.creationMode === 'ugc' ? '- Feature the product prominently in the scene.' : ''}
${mismatchGuard}

Style: editorial fashion photography, professional lighting, tasteful, fully clothed.
${getSceneBehaviorPrompt(prompt) || (environmentImages?.length > 0 || environmentImage ? "The subject should interact naturally with the environment, not pose at the camera." : "")}
${envFidelityInstruction}
${continuityInstruction}
${carouselConsistencyInstruction}
${config.ultraRealistic ? 'Ultra-realistic, shot on a real iPhone Pro back-facing camera, 8K resolution, natural perspective. Skin appears hyper-realistic with visible pores, natural texture, and subtle imperfections, showcasing real-world skin detail. Enhancing realism without looking overdone. Photorealistic color grading, sharp facial focus, true-to-life contrast, no artificial smoothing, no filters, no stylization. No text, logos, captions, or overlays anywhere in the image.' : ''}`;
      } else {
        // GENERATE FROM SCRATCH MODE (no preview available)
        fullPrompt = `OUTPUT: Generate exactly ONE single photograph. Do NOT create collages, grids, split-screen images, or multiple panels.

Create a high-quality, editorial-style fashion photograph.

IDENTITY (CRITICAL): Match the person in the reference photo(s) EXACTLY — same face, bone structure, skin tone, body type, age.
${multiRefInstruction}

SCENE: ${prompt}
OUTFIT: ${currentOutfit}
STYLE: Hair: ${hair} | Makeup: ${makeup} | Skin: ${skin} | Nails: ${nails}

${lockInstructions}
${config.exactMatch ? 'STRICT MODE: This person must be immediately recognizable as the same individual.' : ''}
${config.creationMode === 'ugc' ? 'Feature the product prominently in the scene.' : ''}
${mismatchGuard}

Style: editorial fashion photography, professional lighting, tasteful, fully clothed.
${getSceneBehaviorPrompt(prompt) || (environmentImages?.length > 0 || environmentImage ? "The subject should interact naturally with the environment, not pose at the camera." : "")}
${envFidelityInstruction}
${continuityInstruction}
${carouselConsistencyInstruction}
${config.ultraRealistic ? 'Ultra-realistic, shot on a real iPhone Pro back-facing camera, 8K resolution, natural perspective. Skin appears hyper-realistic with visible pores, natural texture, and subtle imperfections, showcasing real-world skin detail. Enhancing realism without looking overdone. Photorealistic color grading, sharp facial focus, true-to-life contrast, no artificial smoothing, no filters, no stylization. No text, logos, captions, or overlays anywhere in the image.' : ''}`;
      }

      contentParts.push({ type: "text", text: fullPrompt });
    }

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

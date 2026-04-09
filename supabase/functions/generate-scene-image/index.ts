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

    const body = await req.json();
    const { prompt, referenceImage, productImage, environmentImage, environmentImages, previewCharacter, config, lockedRefs, isFinalLook, isUpscale, baseImageUrl, anchorImageUrl, referenceImages, environmentLabel, previousScenePrompt, nextScenePrompt, previousSceneImageUrl, sceneNumber, totalScenes, aspectRatio } = body;

    // ── Model resolution ──────────────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: modelSetting } = await supabaseAdmin
      .from("platform_settings")
      .select("value")
      .eq("key", "image_model")
      .maybeSingle();

    const platformModel = modelSetting?.value || "gemini";

    let falKeyForImages: string | null = null;
    if (platformModel === "flux_kontext") {
      const authHeaderForModel = req.headers.get("Authorization");
      if (authHeaderForModel) {
        const tokenForModel = authHeaderForModel.replace("Bearer ", "");
        const { data: { user: modelUser } } = await supabaseAdmin.auth.getUser(tokenForModel);
        if (modelUser?.id) {
          const { data: userKey } = await supabaseAdmin
            .from("user_api_keys")
            .select("api_key")
            .eq("user_id", modelUser.id)
            .eq("service", "fal_ai")
            .maybeSingle();
          if (userKey?.api_key) falKeyForImages = userKey.api_key;
        }
      }
      if (!falKeyForImages) {
        falKeyForImages = Deno.env.get("FAL_KEY") || null;
      }
    }

    // Determine if Flux should be used — skip for complex regenerations
    const isComplexRegeneration = (sceneNumber && sceneNumber > 1) || isFinalLook || 
      (previousSceneImageUrl) || (environmentImages && environmentImages.length > 0) || environmentImage ||
      (config?.useReferenceAsStart === true && sceneNumber > 1);
    
    const useFlux = platformModel === "flux_kontext" && !!falKeyForImages && !isComplexRegeneration;
    console.log(`[generate-scene-image] Model: ${useFlux ? "flux_kontext" : "gemini"}${isComplexRegeneration ? " (complex scene, forced gemini)" : ""}`);
    // ── End model resolution ──────────────────────────────────────

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
    let fullPrompt: string = "";

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

      // Identity lock for useReferenceAsStart
      let referenceIdentityLock = "";
      const useRefAsStart = config.useReferenceAsStart === true;
      if (useRefAsStart && sceneNumber > 1) {
        referenceIdentityLock = `\nIDENTITY LOCK FROM REFERENCE (CRITICAL): Scene 1 is the UNMODIFIED reference photo.
You MUST reproduce EXACTLY: same skin tone, same bone structure, same hair (style, color, part, length),
same jewelry (every ring, necklace, earring, bracelet), same nail shape and color, same makeup
(brow shape, shadow color, lip color, lash style, contour placement, highlighter).
The outfit must be PIXEL-PERFECT identical unless the scene explicitly calls for a change.`;
      }

      // Baseline realism clause (always applied)
      const realismClause = `\nSMARTPHONE REALISM: natural skin texture, visible pores, subtle imperfections, no smoothing, no plastic skin, realistic fabric folds, natural highlight roll-off, true-to-life colour balance, razor sharp eye detail, visible lash separation, clean hairline edge definition, individual hair strand visibility, natural micro-contrast.`;

      // Continuity chaining instruction when previous scene image is provided
      let continuityInstruction = "";
      if (previousSceneImageUrl) {
        if (!!config.carouselVibe) {
          continuityInstruction = `\nCAROUSEL SLIDE CONTINUITY: The previous slide's image has been provided. This is part of a COHESIVE carousel set.
LOCK THESE DETAILS (must be PIXEL-PERFECT identical to the anchor/previous image):
- Exact outfit, fabric, color, fit, neckline, sleeves — NO changes whatsoever
- Hair style, length, color, position (down/up/ponytail/parting)
- ALL accessories: rings, bracelets, necklaces, earrings, watches
- Nail color, makeup, skin tone
CHANGE ONLY: The SCENE/SETTING, camera angle, framing, pose, and composition as described in the scene prompt below.
Do NOT add, remove, or modify ANY clothing or accessory detail.`;
        } else {
          continuityInstruction = `\nSCENE CONTINUITY: A previous scene image from this sequence has been provided. Maintain visual continuity — similar lighting, time of day, and spatial awareness. The person should appear to be continuing naturally from the previous scene. However, keep identity anchored to the canonical character preview. Create a DISTINCT composition and pose that matches THIS scene's description, NOT a copy of the previous scene.`;
        }
      }

      // Carousel-specific consistency + scene differentiation block
      let carouselConsistencyInstruction = "";
      if (!!config.carouselVibe) {
        const sceneNum = sceneNumber || 1;
        const total = totalScenes || 4;
        carouselConsistencyInstruction = `\nCAROUSEL SCENE AWARENESS (CRITICAL): This is slide ${sceneNum} of ${total}. Each slide MUST show a VISUALLY DISTINCT composition.
OUTFIT LOCK: The subject's clothing must be EXACTLY the same as the anchor image — same garment, same color, same fit, same fabric. If the anchor shows a yellow/gold dress, EVERY slide shows that exact yellow/gold dress. Do NOT change, recolor, or substitute the outfit.
SCENE DIFFERENTIATION: Each slide must have a DIFFERENT camera angle, body positioning, background framing, and interaction with the environment. Slide ${sceneNum} must look clearly different from all other slides — vary the pose, crop (wide vs close-up vs medium), viewing angle (front, side, over-shoulder, from below), and how the subject interacts with the scene elements described below.
${sceneNum === 1 ? 'This is the ANCHOR slide — establish the look.' : `This is NOT slide 1. You MUST create a composition that is clearly different from the anchor image while keeping the outfit and appearance identical.`}`;
      }

      // Detect Path A mode — storyboard prompts already contain full identity/outfit/style details
      const isPathA = config.useReferenceAsStart === true;

      // Build prompt as EDIT instruction when preview exists, otherwise generate from scratch
      
      if (previewCharacter) {
        // EDIT MODE: The character preview is the base image — instruct the model to modify it

        // Build the scene/outfit/style section based on mode
        let sceneOutfitStyleBlock: string;

        if (!!config.carouselVibe) {
          // Carousel mode — outfit locked to anchor
          sceneOutfitStyleBlock = `SCENE (THIS IS THE MOST IMPORTANT PART — this is what makes each carousel slide unique):
"${prompt}"
Compose the image around this SPECIFIC scene description. The environment, props, lighting, and background elements described above are the PRIMARY FOCUS of this slide. The person should be INTEGRATED into this scene naturally — interacting with the setting, not just standing in front of it.

OUTFIT (LOCKED — do NOT change from anchor): Keep wearing exactly "${currentOutfit}" — same garment, color, fit, fabric as the anchor image.
STYLE: Hair: ${hair}, Makeup: ${makeup}, Skin tone: ${skin}, Nails: ${nails}`;
        } else if (isPathA && !isFinalLook) {
          // Path A (non-final): the storyboard prompt already embeds full identity, outfit, and style.
          // Trust the embedded description — do NOT override with config dropdown values.
          sceneOutfitStyleBlock = `SCENE & CHARACTER: ${prompt}

The scene prompt above already contains the COMPLETE character description (outfit, hair, makeup, nails, jewelry) extracted from the reference photo. Follow it EXACTLY. Do NOT substitute any clothing, accessories, or styling details from other sources.`;
        } else if (isPathA && isFinalLook) {
          // Path A final look: override ONLY the outfit, keep other style details from the prompt
          sceneOutfitStyleBlock = `SCENE & CHARACTER: ${prompt}

OUTFIT CHANGE (FINAL LOOK ONLY): Replace the outfit with — ${currentOutfit}
Keep ALL other appearance details (hair, makeup, nails, jewelry, skin) exactly as described in the scene prompt above.`;
        } else {
          // Path B / standard mode — use config values
          sceneOutfitStyleBlock = `1. SCENE: Place this person in the following setting — ${prompt}
2. OUTFIT: Change their clothing to — ${currentOutfit}
3. STYLE: Hair: ${hair}, Makeup: ${makeup}, Skin tone: ${skin}, Nails: ${nails}`;
        }

        fullPrompt = `OUTPUT: Generate exactly ONE single photograph. Do NOT create collages, grids, split-screen images, or multiple panels.

EDIT THIS IMAGE: Keep the person's face, body, and identity EXACTLY the same.

${sceneOutfitStyleBlock}

CRITICAL RULES:
- The person's face, bone structure, skin tone, body type, and age must remain IDENTICAL to the provided image.
${!!config.carouselVibe ? '- The SCENE DESCRIPTION above defines what makes this slide unique. Show the described environment prominently.' : '- Only change pose, clothing, and background as described above.'}
${lockInstructions}
- STRICT MODE: This person must be immediately recognizable as the same individual.
${config.creationMode === 'ugc' ? '- Feature the product prominently in the scene.' : ''}
${mismatchGuard}

Style: editorial fashion photography, professional lighting, tasteful, fully clothed.
${getSceneBehaviorPrompt(prompt) || (environmentImages?.length > 0 || environmentImage ? "The subject should interact naturally with the environment, not pose at the camera." : "")}
${envFidelityInstruction}
${continuityInstruction}
${carouselConsistencyInstruction}
${referenceIdentityLock}
${realismClause}
Ultra-realistic, shot on a real iPhone Pro back-facing camera, 8K resolution, natural perspective. Skin appears hyper-realistic with visible pores, natural texture, and subtle imperfections, showcasing real-world skin detail. Enhancing realism without looking overdone. Photorealistic color grading, sharp facial focus, true-to-life contrast, no artificial smoothing, no filters, no stylization. No text, logos, captions, or overlays anywhere in the image.
${orientationInstruction}`;
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
STRICT MODE: This person must be immediately recognizable as the same individual.
${config.creationMode === 'ugc' ? 'Feature the product prominently in the scene.' : ''}
${mismatchGuard}

Style: editorial fashion photography, professional lighting, tasteful, fully clothed.
${getSceneBehaviorPrompt(prompt) || (environmentImages?.length > 0 || environmentImage ? "The subject should interact naturally with the environment, not pose at the camera." : "")}
${envFidelityInstruction}
${continuityInstruction}
${carouselConsistencyInstruction}
${referenceIdentityLock}
${realismClause}
Ultra-realistic, shot on a real iPhone Pro back-facing camera, 8K resolution, natural perspective. Skin appears hyper-realistic with visible pores, natural texture, and subtle imperfections, showcasing real-world skin detail. Enhancing realism without looking overdone. Photorealistic color grading, sharp facial focus, true-to-life contrast, no artificial smoothing, no filters, no stylization. No text, logos, captions, or overlays anywhere in the image.
${orientationInstruction}`;
      }

      contentParts.push({ type: "text", text: fullPrompt });
    }

    let imageUrl: string | null = null;

    if (useFlux) {
      // ── Flux Kontext Pro via fal.ai ──────────────────────────────
      const baseFluxImage = previewCharacter || referenceImages?.[0] || referenceImage || null;

      if (!baseFluxImage) {
        console.log("[flux] No reference image available, falling back to Gemini");
      } else {
        try {
          const fluxResponse = await fetch("https://fal.run/fal-ai/flux-pro/kontext", {
            method: "POST",
            headers: {
              "Authorization": `Key ${falKeyForImages}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              image_url: baseFluxImage,
              prompt: fullPrompt,
              num_images: 1,
              output_format: "jpeg",
              safety_tolerance: "2",
            }),
          });

          if (!fluxResponse.ok) {
            const errText = await fluxResponse.text();
            console.error("[flux] Error:", fluxResponse.status, errText);
            console.log("[flux] Falling back to Gemini...");
          } else {
            const fluxData = await fluxResponse.json();
            imageUrl = fluxData?.images?.[0]?.url || null;
            if (imageUrl) console.log("[flux] Image generated successfully");
          }
        } catch (fluxErr) {
          console.error("[flux] Exception:", fluxErr);
          console.log("[flux] Falling back to Gemini...");
        }
      }
    }

    if (!imageUrl) {
      // ── Gemini (default + fallback) ──────────────────────────────
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

      const responseText = await response.text();
      if (!responseText || responseText.trim().length === 0) {
        throw new Error("Image generation returned an empty response. Please try again.");
      }
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error("Failed to parse AI response:", responseText.substring(0, 500));
        throw new Error("Image generation returned an invalid response. Please try again.");
      }

      const finishReason = data.choices?.[0]?.native_finish_reason || data.choices?.[0]?.finish_reason;
      if (finishReason === "IMAGE_SAFETY") {
        return new Response(JSON.stringify({ error: "Image blocked by safety filter. Try a different prompt or scene description." }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      imageUrl = extractImageFromResponse(data);
      if (!imageUrl) {
        console.error("No image in response:", JSON.stringify(data).substring(0, 500));
        throw new Error("No image generated");
      }
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
      if (!imgResp.ok) {
        console.error(`[generate-scene-image] Failed to fetch generated image: ${imgResp.status}`);
        throw new Error("Generated image could not be retrieved");
      }
      const contentType = imgResp.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) {
        console.error(`[generate-scene-image] Non-image content-type: ${contentType}`);
        throw new Error("Generated asset is not a valid image");
      }
      bytes = new Uint8Array(await imgResp.arrayBuffer());
    }
    
    // Validate asset size — reject suspiciously small images (likely black/empty)
    console.log(`[generate-scene-image] Asset size: ${bytes.length} bytes`);
    if (bytes.length < 5000) {
      console.error(`[generate-scene-image] Asset too small (${bytes.length} bytes), likely invalid`);
      throw new Error("Generated image appears invalid (too small). Please retry.");
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

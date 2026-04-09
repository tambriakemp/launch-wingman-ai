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

    const body = await req.json();
    const { action, config } = body;
    const characterProfile = body.characterProfile || null;

    // Accept URLs (new) or fall back to legacy base64 fields
    const referenceImageUrl = body.referenceImageUrl || null;
    const productImageUrl = body.productImageUrl || null;
    const environmentImageUrl = body.environmentImageUrl || null;
    const environmentImageUrls: string[] = body.environmentImageUrls || [];

    // Topic brainstorming
    if (action === "brainstorm") {
      const isCarousel = !!config.carouselVibe;

      // Build character context from all available profile info
      const outfit = config.outfitType === 'Custom Outfit' ? config.outfitDetails : config.outfitType;
      const hair = config.hairstyle?.includes('Custom') ? config.customHairstyle : config.hairstyle;
      const makeup = config.makeup === 'Custom' ? config.customMakeup : config.makeup;
      const skin = config.skinComplexion === 'Custom' ? config.customSkinComplexion : config.skinComplexion;
      const characterVibe = config.characterVibe || '';
      const hasCharacterContext = !!(characterVibe || (outfit && outfit !== 'Default Outfit') || hair);

      const characterBlock = hasCharacterContext ? `
CHARACTER PROFILE:
${characterVibe ? `- Vibe / Lifestyle: ${characterVibe}` : ''}
${outfit && outfit !== 'Default Outfit' ? `- Typical outfit: ${outfit}` : ''}
${hair ? `- Hair: ${hair}` : ''}
${makeup && makeup !== 'Bare Face / No Makeup' ? `- Makeup: ${makeup}` : ''}
${skin ? `- Skin: ${skin}` : ''}
`.trim() : '';

      // Also include character profile from DB if available
      if (characterProfile) {
        const parts: string[] = [];
        if (characterProfile.niche) parts.push(`- Niche: ${characterProfile.niche}`);
        if (characterProfile.aesthetic) parts.push(`- Aesthetic: ${characterProfile.aesthetic}`);
        if (characterProfile.personality_traits) parts.push(`- Personality: ${characterProfile.personality_traits}`);
        if (characterProfile.target_audience) parts.push(`- Target Audience: ${characterProfile.target_audience}`);
      }

      let brainstormPrompt: string;

      if (isCarousel) {
        brainstormPrompt = `You are a creative director for Instagram lifestyle content.

Generate 6 carousel ideas. Each is a "Setting — Message" pair: a specific visual environment + a bold content hook.

${characterBlock}

RULES:
- Each idea must be visually specific — name the actual location, car, object, time of day
- The message should be bold and scroll-stopping — something that would make someone save it
- Vary the settings across: car/driving, hotel/travel, restaurant/brunch, apartment/bedroom, outdoor/street, luxury location
- Match the character's vibe if provided — don't suggest settings that clash with their aesthetic
- Think about what's currently trending on Instagram: soft life content, luxury lifestyle, "the algorithm can tell" style hooks, expectation vs reality, silent success content

FORMAT: One idea per line. Format exactly: "Setting description — Bold message hook"
No numbers. No bullets. No extra text. Just 6 lines.`;
      } else {
        const category = config.vlogCategory || 'Lifestyle';
        brainstormPrompt = `You are a creative director for Instagram and TikTok lifestyle content.

Generate 6 specific, highly visual vlog ideas for this character. Each idea should feel like a real post someone with this aesthetic would actually make.

${characterBlock ? characterBlock : `CATEGORY: ${category}`}
${characterBlock && category !== 'Custom' ? `CONTENT FOCUS: ${category}` : ''}

THINK ABOUT WHAT'S TRENDING RIGHT NOW:
- Soft life vlogs (Erewhon runs, luxury hotel stays, spa days, silk sheets, matcha mornings)
- Aesthetic day-in-my-life (productive morning, city walks, outfit changes, night drives)
- GRWM for specific events (dinner, date, photoshoot, birthday, traveling)
- Mirror selfie sessions (bathroom mirror, hotel room, changing room)
- Luxury car content (driving, Erewhon pickup, airport runs, music playing)
- Night out prep (hotel bathroom glam, going out from a high-rise, rooftop bar)
- Cozy/intimate moments (hotel room in pajamas, doing lashes on bed, skincare routine)
- "A day in my life as a [persona]" style vlogs

RULES:
- Each idea must be a specific scenario — not generic
- Vary the energy: some glamorous, some casual, some intimate, some active
- Each should paint a clear picture of exactly what the video looks like
- If character vibe is provided, make ideas feel native to that person's world
- Ideas should be aspirational but believable — real lifestyle, not fantasy

FORMAT: One idea per line. Each idea = emoji + specific scenario in under 25 words.
No numbers. No extra text. Just 6 lines.`;
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: brainstormPrompt }],
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI gateway error");
      }

      const responseText = await response.text();
      let brainstormData;
      try {
        brainstormData = JSON.parse(responseText);
      } catch {
        console.error("Failed to parse brainstorm response:", responseText.slice(0, 200));
        throw new Error("Invalid response from AI");
      }

      const rawText = brainstormData.choices?.[0]?.message?.content?.trim() || "";
      const ideas = rawText
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 5)
        .slice(0, 6);

      return new Response(JSON.stringify({ ideas }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Full storyboard generation
    if (action === "generate") {
      let systemPrompt: string;
      const isCarousel = !!config.carouselVibe;

      if (isCarousel) {
        const carouselSlideCount = config.sceneCount || config.carouselSlideCount || 5;
        const getStyleDescription = () => {
          const baseOutfit = config.outfitType === 'Custom Outfit' ? config.outfitDetails : config.outfitType;
          let outfit = config.outfitAdditionalInfo ? `${baseOutfit} (${config.outfitAdditionalInfo})` : baseOutfit;
          const hair = config.hairstyle?.includes('Custom') ? config.customHairstyle : config.hairstyle;
          const makeup = config.makeup === 'Custom' ? config.customMakeup : config.makeup;
          const skin = config.skinComplexion === 'Custom' ? config.customSkinComplexion : `${config.skinComplexion} ${config.skinUndertone}`;
          const nails = config.nailStyle === 'Custom' ? config.customNailStyle : config.nailStyle;
          return `Outfit: ${outfit} | Hair: ${hair} | Makeup: ${makeup} | Skin: ${skin} | Nails: ${nails}`;
        };

        const useRefAsStart = config.useReferenceAsStart === true;

        const identityLockBlock = useRefAsStart
          ? `\nIDENTITY LOCK (CRITICAL — Scene 1 is the UNMODIFIED reference photo):
Analyze the reference photo EXHAUSTIVELY and describe EVERY detail in the Scene 1 image_prompt as the canonical identity lock. This includes:
- Exact skin tone, undertone, and complexion
- Face/bone structure (cheekbone prominence, jaw shape, forehead width)
- Hair style, color, length, parting, texture
- Eye shape, color, brow shape
- Makeup: brow fill, eyeshadow color, lash style, contour placement, highlighter placement, lip color/finish
- Jewelry: every earring, necklace, bracelet, ring — describe each piece specifically
- Nail shape, length, color/finish
- Outfit: garment type, color, fabric, fit, neckline, straps/sleeves, structure

ALL subsequent slides MUST copy-paste this ENTIRE identity block verbatim into their image_prompt. No detail may be omitted or paraphrased.`
          : '';

        systemPrompt = `You are an expert Instagram content director specializing in cohesive carousel creation.

CAROUSEL BRIEF:
- Scene Description: ${config.carouselVibe}
- Aesthetic / Mood: ${config.vlogCategory}
- Character Style: ${getStyleDescription()}
- Number of slides: ${carouselSlideCount}
${useRefAsStart ? '- Scene 1: IS the unmodified reference photo — do NOT reimagine it' : ''}
${identityLockBlock}

YOUR TASK:
Generate a ${carouselSlideCount}-slide carousel shot list. Every slide shares the SAME visual world — same character, same setting, same lighting, same outfit, same accessories. What changes is ONLY the shot angle, framing, and subject composition.

THE VISUAL ANCHOR (lock these across ALL slides):
- Same character with identical appearance (face, hair, skin, outfit, jewelry, nails)
- Same environment/setting: ${config.carouselVibe}
- Same time of day and lighting quality (consistent throughout)
- Same aesthetic mood: ${config.vlogCategory}
- Same color palette derived from the setting and aesthetic

SHOT PALETTE (CRITICAL — vary across this spectrum):
- Full body hero shot (establishing, confident, environment visible)
- Waist-up variation (different interaction, subtle expression change)
- Close-up beauty portrait (tight on face, intense or soft expression)
- Macro detail shot (hands, nails, jewelry, product, texture — NO person face)
- Flat lay / environment-only (NO person — props, setting, ambient mood)
- Candid movement (mid-turn, walking, reaching, laughing — motion blur okay)
- Alternate angle (low angle, over-shoulder, reflection, profile)

SLIDE STRUCTURE:
- Slide 1: Hook shot — strong, eye-catching, works as the cover. Full character visible, setting established.
- Slides 2-${carouselSlideCount - 1}: Build visual interest through varied shots. Mix close-ups, details, angles, and environmental shots freely.
- Slide ${carouselSlideCount}: CTA-ready — character + text space, direct or composed, clear and clean.

IMAGE PROMPT FORMAT (CRITICAL — every image_prompt MUST follow this structure):
1. Shot type and framing (e.g., "Full body hero shot", "Macro detail shot")
2. FULL character identity block (skin, face, hair, makeup, jewelry, nails, outfit) — repeated VERBATIM in every prompt
3. Environment/setting description
4. Lighting direction and quality
5. Camera: "shot on iPhone 15 Pro Max [lens], HDR enabled, natural dynamic range, smartphone depth of field, social-media-native exposure"
6. Realism clause: "natural skin texture, visible pores, subtle imperfections, no smoothing, no plastic skin, realistic fabric folds, authentic shadow depth, natural highlight roll-off, true-to-life colour balance, razor sharp eye detail, crisp iris definition, visible lash separation, no soft-focus, no artificial diffusion, clean hairline edge definition, individual hair strand visibility, natural micro-contrast"

FEED COHESION RULES (CRITICAL):
- Every image_prompt MUST include the full visual anchor: character description + environment + lighting + camera + realism clause
- The setting never changes. The character never leaves the environment.
- Lighting stays consistent — same direction, same warmth, same quality
- Color palette must feel unified across all slides
- Each slide MUST specify a DIFFERENT shot type from the palette above

For each slide provide: step_number, step_name, a_roll, b_roll, close_up_details, camera_direction (exact shot type), image_prompt (COMPLETE prompt following the format above), video_prompt, script, is_final_look (always false for carousel).

Also provide character analysis: face_structure, hair, skin_tone, makeup_accessories, clothing_vibe.`;
      } else {
        // Original vlog/UGC system prompt
        const getStyleDescription = () => {
          const baseOutfit = config.outfitType === 'Custom Outfit' ? config.outfitDetails : config.outfitType;
          let outfit = config.outfitAdditionalInfo ? `${baseOutfit} (${config.outfitAdditionalInfo})` : baseOutfit;
          const hair = config.hairstyle?.includes('Custom') ? config.customHairstyle : config.hairstyle;
          const makeup = config.makeup === 'Custom' ? config.customMakeup : config.makeup;
          const skin = config.skinComplexion === 'Custom' ? config.customSkinComplexion : `${config.skinComplexion} ${config.skinUndertone}`;
          const nails = config.nailStyle === 'Custom' ? config.customNailStyle : config.nailStyle;
          return `MANDATORY STYLE REQUIREMENTS:\n- Outfit: ${outfit}\n- Hairstyle: ${hair}\n- Makeup: ${makeup}\n- Skin: ${skin}\n- Nails: ${nails}`;
        };

        const sceneCount = config.sceneCount || null;
        const sceneInstruction = sceneCount
          ? `Generate exactly ${sceneCount} steps. Adapt the narrative pacing to fit ${sceneCount} scenes.`
          : `Analyze the topic/prompt carefully and determine the OPTIMAL number of scenes (between 3 and 15). Use FEWER scenes for simple concepts (3-5 for a single look/pose set, 5-7 for a short vlog). Use MORE scenes (8-15) only for complex narratives like GRWM transformations or multi-location vlogs. Do NOT default to the maximum — choose the number that best serves the content.`;

        let narrativeContext = "";
        if (config.creationMode === 'vlog' && config.vlogCategory === 'Get Ready With Me') {
          const startOutfit = config.outfitType === 'Custom Outfit' ? config.outfitDetails : config.outfitType;
          const endBase = config.finalLookType === 'Custom Outfit' ? config.finalLook : config.finalLookType;
          const endOutfit = config.finalLookAdditionalInfo ? `${endBase} (${config.finalLookAdditionalInfo})` : endBase;
          if (sceneCount) {
            const splitPoint = Math.ceil(sceneCount * 0.6);
            narrativeContext = `NARRATIVE ARC: This is a GRWM transformation.\nPART 1 (Steps 1-${splitPoint}): Starting outfit: "${startOutfit}".\nPART 2 (Steps ${splitPoint + 1}-${sceneCount}): Final look reveal wearing: "${endOutfit}". Mark these steps with is_final_look: true.`;
          } else {
            narrativeContext = `NARRATIVE ARC: This is a GRWM transformation.\nPART 1 (Steps 1-8): Starting outfit: "${startOutfit}".\nPART 2 (Steps 9-15): Final look reveal wearing: "${endOutfit}". Mark these steps with is_final_look: true.`;
          }
        }

        let scriptInstruction = config.useOwnScript && config.userScript
          ? `USER PROVIDED SCRIPT:\n"""${config.userScript}"""\nBreak this script into 13-15 scenes. Each step's 'script' field contains the corresponding portion.`
          : `AI GENERATED SCRIPT: Write an engaging voiceover script split across 13-15 steps.`;

        const useRefAsStart = config.useReferenceAsStart === true;
        const environmentMode = config.environmentMode || 'evolve';
        const pathASceneCount = config.pathASceneCount || 6;

        if (useRefAsStart) {
          // ── PATH A: AI-directed from start image ──────────────────
          const lockInstruction = environmentMode === 'lock'
            ? `ENVIRONMENT: LOCKED. Every scene takes place in the EXACT SAME location visible in the reference photo. Only the camera angle, framing, subject pose, and interaction change. The background, lighting, and setting never change.`
            : `ENVIRONMENT: EVOLVING. The character moves naturally through connected environments that logically extend from the starting location. Each scene introduces a new but related setting (e.g., stadium concourse → food stand → exterior plaza → parking lot at golden hour). The transition must feel organic — the character is living a real moment, not teleporting.`;

          systemPrompt = `You are an expert Instagram content director and AI vlog creator.

You have been given a single reference photograph. Your job is to analyze it completely and autonomously direct a full ${pathASceneCount}-scene storyboard. You receive NO other creative direction — the image is your entire brief.

STEP 1 — ANALYZE THE REFERENCE IMAGE:
Extract and document every detail:
- Person: exact skin tone and undertone, face structure (jaw, cheekbones, forehead width), eye shape and color, brow shape
- Hair: style, color, length, texture, parting, volume
- Makeup: foundation finish, brow definition, eyeshadow, lash style, contour placement, highlighter, lip color and finish
- Jewelry: describe each piece individually (earring style, necklace type/length, bracelet stack, rings)
- Nails: shape, length, color, finish
- Outfit: every garment — type, color, fabric texture, fit, neckline, sleeves, structure, layering
- Setting: exact location (interior/exterior, type of space), time of day, lighting quality and direction, color temperature, ambient mood
- Vibe: overall aesthetic, energy level, occasion implied

STEP 2 — DIRECT THE STORYBOARD:
Generate exactly ${pathASceneCount} scenes. Scene 1 is the reference photo itself — do not reimagine it, describe it as-is.

${lockInstruction}

SCENE ARC:
- Scene 1: The start frame — describe the reference photo exactly as it appears
- Scenes 2-${pathASceneCount - 1}: Progress through the moment${environmentMode === 'evolve' ? ', evolving through connected environments' : ', varying angle and framing within the same space'}
- Scene ${pathASceneCount}: Closing shot — wide, clean, with visual space for text overlay

NARRATIVE COHERENCE (CRITICAL):
- Each scene must flow logically from the previous one — tell a cohesive mini-story with a clear arc
- Avoid jarring environment jumps — transitions between locations must feel organic
- The final scene should feel like a natural conclusion to the sequence

PROP & OBJECT LIFECYCLE (CRITICAL):
- Before writing image prompts, list every handheld prop visible in Scene 1 (drink, phone, bag, food, etc.)
- For EACH prop, decide in which scene it is naturally set down, finished, or left behind — most props should NOT persist beyond 2-3 scenes
- A drink should be sipped and set down, a phone pocketed, a bag placed on a surface — show the transition
- NEVER carry a prop into a scene where it would be contextually absurd (e.g., cocktail glass in bed, gym weights at dinner)
- Detail shots (extreme close-up, flat-lay) are ideal moments to show a prop being set down or left behind
- If the character changes location, assume all handheld props from the previous location are left behind unless explicitly carried
- The image_prompt for each scene must explicitly state what the character is holding — if nothing, write "hands empty" or describe a natural hand position (resting, gesturing, touching hair, etc.)

SHOT VARIETY (use a DIFFERENT shot type each scene):
- Full body establishing (character + environment)
- 3/4 shot walking or in motion
- Close-up face (direct eye contact, or candid expression)
- Extreme close-up detail (hands, jewelry, nails, food, drink, object)
- Object/flat-lay (no person — just props, setting, ambient elements)
- Profile or over-shoulder
- Low angle (shot from below, powerful framing)
- High angle (shot from above, intimate)
- Reflection (mirror, window, surface)

CHARACTER LOCK (CRITICAL):
Extract the full identity block from the reference photo in Step 1. Then paste this ENTIRE block verbatim into EVERY image_prompt. No scene may omit or paraphrase any element of this block.

IMAGE PROMPT FORMAT (every image_prompt must follow this exactly):
1. Shot type: [exact shot name]
2. CHARACTER (verbatim identity block from Step 1): [full description]
3. ACTION/POSE: [what the person is doing]
4. HANDS/PROPS: [explicitly state what is in each hand — or "hands free, [natural pose]"]
5. ENVIRONMENT: [exact setting — ${environmentMode === 'lock' ? 'same as reference photo' : 'describe the specific evolved location'}]
6. LIGHTING: [direction, quality, color temperature — match reference photo's lighting style]
7. CAMERA: "shot on iPhone 15 Pro Max, 4K HDR, natural dynamic range, social-media-native framing"
8. REALISM: "natural skin texture, visible pores, subtle imperfections, no smoothing, realistic fabric, authentic shadows, true-to-life color, razor-sharp eye detail, individual hair strand definition"

The script field for each scene should be a short, punchy caption line or hook appropriate for the visual — NOT narration, just the text overlay.

VIDEO PROMPT RULES (CRITICAL):
- video_prompt describes subtle 3-second motion from the SAME camera angle as the image
- If the character's back or side is to the camera, the video must KEEP that same angle — do NOT rotate the character to face the camera
- Avoid any instruction that would reveal the character's face if it is not visible in the image (e.g., "turns around", "looks at camera", "faces forward")
- Instead describe ambient motion: hair movement, fabric swaying, environment activity, subtle body sway, hand gestures
- For back-facing shots: "gentle hair movement in the breeze, city lights flickering in the background, subtle shoulder movement"
- For profile shots: "slight head tilt, eyes scanning the scene, ambient light shifting"

Generate: step_number, step_name, a_roll, b_roll, close_up_details, camera_direction, image_prompt (complete, following the format above), video_prompt (3-second motion following rules above), script (text overlay caption), is_final_look (always false).
Also provide analysis: face_structure, hair, skin_tone, makeup_accessories, clothing_vibe (extracted from the reference photo).`;

        } else {
          // ── PATH B: User-directed (existing vlog/UGC logic) ───────
          const vlogIdentityLock = '';

          systemPrompt = `You are an expert creative director for social media content.
Create a ${config.creationMode === 'vlog' ? 'Vlog' : 'UGC Marketing'} storyboard.

Configuration:
- Category: ${config.creationMode === 'vlog' ? config.vlogCategory : 'UGC Marketing'}
- Topic: ${config.creationMode === 'vlog' ? config.vlogTopic : config.ugcPrompt}
${getStyleDescription()}
${config.productDescription ? `- Product: ${config.productDescription}` : ''}
${narrativeContext}
${scriptInstruction}

VISUAL CONTINUITY RULES (CRITICAL):
- Each image_prompt MUST reference the previous scene's ending state and create a natural transition to the next scene.
- Include lighting progression throughout the storyboard (e.g., morning light → afternoon → golden hour → evening, if applicable).
- Ensure spatial continuity: if the character leaves one room, the next scene should show them entering the connected space.
- Maintain consistent time-of-day, weather, and ambient lighting across consecutive scenes unless a deliberate time skip is part of the narrative.
- Each scene's image_prompt should describe the character's pose or action in a way that naturally follows from the previous scene's action.

SHOT VARIETY FOR FEED COHESION (CRITICAL):
Vary shots across this spectrum — each scene uses a DIFFERENT framing:
- Full body hero shot (establishing, confident, environment visible)
- Waist-up variation (different interaction, subtle expression change)
- Close-up beauty portrait (tight on face, intense or soft expression)
- Macro detail shot (hands, nails, jewelry, product, texture)
- Flat lay / environment-only (no person — props, setting, ambient mood)
- Candid movement (mid-turn, walking, reaching, laughing — motion blur okay)
- Alternate angle (low angle, over-shoulder, reflection, profile)

IMAGE PROMPT FORMAT (CRITICAL — every image_prompt MUST follow this structure):
1. Shot type and framing (e.g., "Full body hero shot", "Close-up beauty portrait")
2. FULL character identity block (skin, face, hair, makeup, jewelry, nails, outfit) — repeated VERBATIM in every prompt
3. Scene/environment description with specific action or pose
4. Lighting direction and quality
5. Camera: "shot on iPhone 15 Pro Max [lens], HDR enabled, natural dynamic range, smartphone depth of field, social-media-native exposure"
6. Realism clause: "natural skin texture, visible pores, subtle imperfections, no smoothing, no plastic skin, realistic fabric folds, authentic shadow depth, natural highlight roll-off, true-to-life colour balance, razor sharp eye detail, crisp iris definition, visible lash separation, no soft-focus, no artificial diffusion, clean hairline edge definition, individual hair strand visibility, natural micro-contrast"

Each image_prompt MUST specify the exact shot type and framing.
Each image_prompt MUST include the FULL character description block repeated verbatim.

${sceneInstruction} For each step provide: step_number, step_name, a_roll, b_roll, close_up_details, camera_direction, image_prompt (COMPLETE prompt following the format above), video_prompt, script, is_final_look (boolean).
Also provide an analysis object with: face_structure, hair, skin_tone, makeup_accessories, clothing_vibe.`;
        }
      }

      // Build messages with image URLs (no base64 in memory)
      const contentParts: any[] = [];
      if (referenceImageUrl) contentParts.push({ type: "image_url", image_url: { url: referenceImageUrl } });
      if (productImageUrl) contentParts.push({ type: "image_url", image_url: { url: productImageUrl } });
      if (environmentImageUrls.length > 0) {
        for (const envUrl of environmentImageUrls) {
          contentParts.push({ type: "image_url", image_url: { url: envUrl } });
        }
      } else if (environmentImageUrl) {
        contentParts.push({ type: "image_url", image_url: { url: environmentImageUrl } });
      }
      contentParts.push({ type: "text", text: "Generate the storyboard based on these reference images and the system instructions." });

      console.log(`Sending ${contentParts.length} content parts (images as URLs, no base64 in memory)`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: contentParts }
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_storyboard",
              description: "Create a structured vlog/UGC storyboard",
              parameters: {
                type: "object",
                properties: {
                  analysis: {
                    type: "object",
                    properties: {
                      face_structure: { type: "string" },
                      hair: { type: "string" },
                      skin_tone: { type: "string" },
                      makeup_accessories: { type: "string" },
                      clothing_vibe: { type: "string" }
                    },
                    required: ["face_structure", "hair", "skin_tone", "makeup_accessories", "clothing_vibe"]
                  },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        step_number: { type: "integer" },
                        step_name: { type: "string" },
                        a_roll: { type: "string" },
                        b_roll: { type: "string" },
                        close_up_details: { type: "string" },
                        camera_direction: { type: "string" },
                        image_prompt: { type: "string" },
                        video_prompt: { type: "string" },
                        script: { type: "string" },
                        is_final_look: { type: "boolean" }
                      },
                      required: ["step_number", "step_name", "a_roll", "b_roll", "close_up_details", "camera_direction", "image_prompt", "video_prompt", "script", "is_final_look"]
                    }
                  }
                },
                required: ["analysis", "steps"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "create_storyboard" } }
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("Storyboard generation error:", response.status, t);
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          try {
            const parsed = JSON.parse(content);
            return new Response(JSON.stringify({ storyboard: parsed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          } catch {
            throw new Error("No structured output returned");
          }
        }
        throw new Error("No structured output returned");
      }

      const storyboard = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ storyboard }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Safety validation
    if (action === "validate_safety") {
      const safetyImageUrl = body.referenceImageUrl;
      if (!safetyImageUrl) {
        return new Response(JSON.stringify({ safe: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: safetyImageUrl } },
              { type: "text", text: 'Analyze this image for safety. Check for: 1. Children/minors (under 18). 2. Explicit content. Respond with JSON: { "isSafe": boolean, "reason": string }.' }
            ]
          }]
        }),
      });
      if (!response.ok) {
        const t = await response.text();
        throw new Error(`Safety check failed: ${t}`);
      }
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      try {
        const cleanJson = text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(cleanJson);
        return new Response(JSON.stringify({ safe: result.isSafe, error: result.reason }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ safe: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-storyboard error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

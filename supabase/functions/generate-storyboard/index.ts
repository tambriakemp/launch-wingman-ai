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

    // Accept URLs (new) or fall back to legacy base64 fields
    const referenceImageUrl = body.referenceImageUrl || null;
    const productImageUrl = body.productImageUrl || null;
    const environmentImageUrl = body.environmentImageUrl || null;
    const environmentImageUrls: string[] = body.environmentImageUrls || [];

    // Topic brainstorming
    if (action === "brainstorm") {
      const isBrainstormCarousel = config.creationMode === 'carousel';
      const brainstormPrompt = isBrainstormCarousel
        ? `Generate 5 creative carousel ideas for Instagram. Each idea is a "Setting + Message" combination — a specific visual environment paired with a bold content theme. Format: one idea per line, "Setting — Message". No numbers, no bullets, no labels. Example format: "Inside a luxury car with orange leather seats — Your standards are the problem, not your talent". Target audience: Gen Z / Millennial creators and entrepreneurs. Make them bold, specific, and visually interesting.`
        : `Generate a specific, engaging, and creative vlog topic idea for the category: "${config.vlogCategory}". Target audience: Gen Z / Millennials. Format: A specific scenario or activity. Length: Under 15 words. Output: JUST the topic text. No labels, no quotes.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: brainstormPrompt }]
        }),
      });
      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI gateway error");
      }
      const brainstormData = await response.json();
      const rawText = brainstormData.choices?.[0]?.message?.content?.trim() || "";

      if (isBrainstormCarousel) {
        const ideas = rawText.split('\n').filter((line: string) => line.trim().length > 0).slice(0, 5);
        return new Response(JSON.stringify({ ideas }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } else {
        const topic = rawText || "Day in my life";
        return new Response(JSON.stringify({ topic }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Full storyboard generation
    if (action === "generate") {
      let systemPrompt: string;

      if (config.creationMode === 'carousel') {
        const carouselSlideCount = config.carouselSlideCount || 6;
        const getStyleDescription = () => {
          const baseOutfit = config.outfitType === 'Custom Outfit' ? config.outfitDetails : config.outfitType;
          let outfit = config.outfitAdditionalInfo ? `${baseOutfit} (${config.outfitAdditionalInfo})` : baseOutfit;
          const hair = config.hairstyle?.includes('Custom') ? config.customHairstyle : config.hairstyle;
          const makeup = config.makeup === 'Custom' ? config.customMakeup : config.makeup;
          const skin = config.skinComplexion === 'Custom' ? config.customSkinComplexion : `${config.skinComplexion} ${config.skinUndertone}`;
          const nails = config.nailStyle === 'Custom' ? config.customNailStyle : config.nailStyle;
          return `Outfit: ${outfit} | Hair: ${hair} | Makeup: ${makeup} | Skin: ${skin} | Nails: ${nails}`;
        };

        systemPrompt = `You are an expert Instagram content director specializing in cohesive carousel creation.

CAROUSEL BRIEF:
- Setting / Environment: ${config.carouselVibe}
- Message / Theme: ${config.carouselMessage || 'No specific message — focus on visual storytelling'}
- Aesthetic / Mood: ${config.carouselAesthetic}
- Character Style: ${getStyleDescription()}
- Number of slides: ${carouselSlideCount}

YOUR TASK:
Generate a ${carouselSlideCount}-slide carousel shot list. Every slide shares the SAME visual world — same character, same setting, same lighting, same outfit, same accessories. What changes is ONLY the shot angle, framing, and subject composition.

THE VISUAL ANCHOR (lock these across ALL slides):
- Same character with identical appearance (face, hair, skin, outfit, jewelry, nails)
- Same environment/setting: ${config.carouselVibe}
- Same time of day and lighting quality (consistent throughout)
- Same aesthetic mood: ${config.carouselAesthetic}
- Same color palette derived from the setting and aesthetic

SHOT VARIETY RULES:
Choose shots from across this spectrum — vary the distance, angle, and subject:
- Wide shots (full environment + character, establishing the world)
- 3/4 shots (character mid-thigh to above, confident, composed)
- Close-up face shots (tight on face, different expressions — intense, soft, candid, direct)
- Extreme close-ups (single detail: eyes, lips, nails, jewelry, texture)
- Detail/object shots (items in the scene with no person: keys on seat, sunglasses, bag)
- Environmental shots (the setting itself — textures, light, background elements)
- Angle variations (low angle, high angle, profile, over-shoulder, reflection)
- Composition plays (subject left/right with text space, framed through elements)

SLIDE STRUCTURE:
- Slide 1: Hook shot — strong, eye-catching, works as the cover. Full character visible, setting established.
- Slides 2-${carouselSlideCount - 1}: Build visual interest through varied shots. Mix close-ups, details, angles, and environmental shots freely. Let the setting guide the variety — use whatever the environment offers.
- Slide ${carouselSlideCount}: CTA-ready — character + text space, direct or composed, clear and clean.

COHESION RULES (CRITICAL):
- Every image_prompt MUST include the full visual anchor: character description + environment + lighting + aesthetic
- The setting never changes. The character never leaves the environment.
- Lighting stays consistent — same sun position, same warmth, same quality
- Color palette must feel unified across all slides

For each slide provide: step_number, step_name, a_roll (what the main subject is doing), b_roll (secondary visual detail to capture), close_up_details (specific detail to focus on), camera_direction (exact shot type and framing), image_prompt (complete AI image generation prompt including all locked elements + variable shot description), video_prompt (how this slide would move as a 3-second video clip), script (the text overlay or caption for this slide, tied to the message theme), is_final_look (always false for carousel).

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

        const sceneCount = config.sceneCount;
        const sceneInstruction = sceneCount
          ? `Generate exactly ${sceneCount} steps. Adapt the narrative pacing to fit ${sceneCount} scenes.`
          : `Generate 13 to 15 steps.`;

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
- Ensure spatial continuity: if the character leaves one room, the next scene should show them entering the connected space. Include transition cues (e.g., "continuing from the hallway into the kitchen").
- Maintain consistent time-of-day, weather, and ambient lighting across consecutive scenes unless a deliberate time skip is part of the narrative.
- Each scene's image_prompt should describe the character's pose or action in a way that naturally follows from the previous scene's action.

${sceneInstruction} For each step provide: step_number, step_name, a_roll, b_roll, close_up_details, camera_direction, image_prompt, video_prompt, script, is_final_look (boolean).
Also provide an analysis object with: face_structure, hair, skin_tone, makeup_accessories, clothing_vibe.`;
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

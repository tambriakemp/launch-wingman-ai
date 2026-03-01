import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const stripBase64Prefix = (img: string): string => {
  if (!img) return "";
  let cleaned = img.trim();
  if (cleaned.includes(",") && cleaned.startsWith("data:")) {
    cleaned = cleaned.split(",")[1];
  }
  cleaned = cleaned.replace(/\s/g, "");
  return cleaned;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { action, referenceImage, productImage, environmentImage, config } = await req.json();
    const refClean = referenceImage ? stripBase64Prefix(referenceImage) : null;
    const prodClean = productImage ? stripBase64Prefix(productImage) : null;
    const envClean = environmentImage ? stripBase64Prefix(environmentImage) : null;

    // Topic brainstorming
    if (action === "brainstorm") {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{
            role: "user",
            content: `Generate a specific, engaging, and creative vlog topic idea for the category: "${config.vlogCategory}". Target audience: Gen Z / Millennials. Format: A specific scenario or activity. Length: Under 15 words. Output: JUST the topic text. No labels, no quotes.`
          }]
        }),
      });
      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error("AI gateway error");
      }
      const data = await response.json();
      const topic = data.choices?.[0]?.message?.content?.trim() || "Day in my life";
      return new Response(JSON.stringify({ topic }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Full storyboard generation
    if (action === "generate") {
      const getStyleDescription = () => {
        const baseOutfit = config.outfitType === 'Custom Outfit' ? config.outfitDetails : config.outfitType;
        let outfit = config.outfitAdditionalInfo ? `${baseOutfit} (${config.outfitAdditionalInfo})` : baseOutfit;
        const hair = config.hairstyle?.includes('Custom') ? config.customHairstyle : config.hairstyle;
        const makeup = config.makeup === 'Custom' ? config.customMakeup : config.makeup;
        const skin = config.skinComplexion === 'Custom' ? config.customSkinComplexion : `${config.skinComplexion} ${config.skinUndertone}`;
        const nails = config.nailStyle === 'Custom' ? config.customNailStyle : config.nailStyle;
        return `MANDATORY STYLE REQUIREMENTS:\n- Outfit: ${outfit}\n- Hairstyle: ${hair}\n- Makeup: ${makeup}\n- Skin: ${skin}\n- Nails: ${nails}`;
      };

      let narrativeContext = "";
      if (config.creationMode === 'vlog' && config.vlogCategory === 'Get Ready With Me') {
        const startOutfit = config.outfitType === 'Custom Outfit' ? config.outfitDetails : config.outfitType;
        const endBase = config.finalLookType === 'Custom Outfit' ? config.finalLook : config.finalLookType;
        const endOutfit = config.finalLookAdditionalInfo ? `${endBase} (${config.finalLookAdditionalInfo})` : endBase;
        narrativeContext = `NARRATIVE ARC: This is a GRWM transformation.\nPART 1 (Steps 1-8): Starting outfit: "${startOutfit}".\nPART 2 (Steps 9-15): Final look reveal wearing: "${endOutfit}". Mark these steps with is_final_look: true.`;
      }

      let scriptInstruction = config.useOwnScript && config.userScript
        ? `USER PROVIDED SCRIPT:\n"""${config.userScript}"""\nBreak this script into 13-15 scenes. Each step's 'script' field contains the corresponding portion.`
        : `AI GENERATED SCRIPT: Write an engaging voiceover script split across 13-15 steps.`;

      const systemPrompt = `You are an expert creative director for social media content.
Create a ${config.creationMode === 'vlog' ? 'Vlog' : 'UGC Marketing'} storyboard.

Configuration:
- Category: ${config.creationMode === 'vlog' ? config.vlogCategory : 'UGC Marketing'}
- Topic: ${config.creationMode === 'vlog' ? config.vlogTopic : config.ugcPrompt}
${getStyleDescription()}
${config.productDescription ? `- Product: ${config.productDescription}` : ''}
${narrativeContext}
${scriptInstruction}

Generate 13 to 15 steps. For each step provide: step_number, step_name, a_roll, b_roll, close_up_details, camera_direction, image_prompt, video_prompt, script, is_final_look (boolean).
Also provide an analysis object with: face_structure, hair, skin_tone, makeup_accessories, clothing_vibe.`;

      // Build messages with images
      const contentParts: any[] = [];
      if (refClean) contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${refClean}` } });
      if (prodClean) contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${prodClean}` } });
      if (envClean) contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${envClean}` } });
      contentParts.push({ type: "text", text: "Generate the storyboard based on these reference images and the system instructions." });

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
        // Fallback: try to parse content as JSON
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
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${refClean}` } },
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, sceneCount, contextData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!sceneCount || sceneCount < 1) {
      return new Response(JSON.stringify({ error: "sceneCount must be at least 1" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context section from planning/messaging data
    let contextSection = "";
    if (contextData) {
      const parts: string[] = [];
      if (contextData.niche) parts.push(`Niche: ${contextData.niche}`);
      if (contextData.targetAudience) parts.push(`Target Audience: ${contextData.targetAudience}`);
      if (contextData.painPoint) parts.push(`Primary Pain Point: ${contextData.painPoint}`);
      if (contextData.desiredOutcome) parts.push(`Desired Outcome: ${contextData.desiredOutcome}`);
      if (contextData.problemStatement) parts.push(`Problem Statement: ${contextData.problemStatement}`);
      if (contextData.transformationStatement) parts.push(`Transformation Statement: ${contextData.transformationStatement}`);
      if (contextData.coreMessage) parts.push(`Core Message: ${contextData.coreMessage}`);
      if (contextData.talkingPoints) parts.push(`Key Talking Points: ${contextData.talkingPoints}`);
      if (contextData.offerTitle) parts.push(`Offer: ${contextData.offerTitle}`);
      if (contextData.offerDescription) parts.push(`Offer Description: ${contextData.offerDescription}`);
      if (parts.length > 0) contextSection = `\n\nContext about the brand/offer:\n${parts.join("\n")}`;
    }

    const systemPrompt = `You are an expert social media copywriter who specializes in creating Instagram story / carousel caption sequences. You write punchy, engaging, scroll-stopping captions that build on each other like a narrative arc.

Rules:
- Generate EXACTLY ${sceneCount} captions, one per image/slide
- Each caption should be 1-3 short, punchy sentences
- Captions must build upon each other — start with a hook, develop the story/value, and build momentum
- The LAST caption (caption #${sceneCount}) MUST end with a clear Call-to-Action (CTA) — e.g. "Link in bio", "DM me [keyword]", "Comment [word] below", "Grab your spot", etc.
- Use the topic and any brand context provided to make captions relevant and on-brand
- Write in a conversational, authentic tone — not salesy or corporate
- Use line breaks within captions for readability
- Do NOT use hashtags in the captions
- Return ONLY a valid JSON array of strings, nothing else

Example flow for 5 images:
1. Hook / attention grabber (pattern interrupt)
2. Identify the problem / pain point
3. Introduce the solution / transformation
4. Social proof or deeper value
5. CTA — tell them exactly what to do next${contextSection}`;

    const userPrompt = topic
      ? `Create ${sceneCount} sequential Instagram image captions about: ${topic}`
      : `Create ${sceneCount} sequential Instagram image captions based on the brand context provided.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_captions",
              description: "Return the generated captions array",
              parameters: {
                type: "object",
                properties: {
                  captions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of caption strings, one per image",
                  },
                },
                required: ["captions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_captions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      // Fallback: try to parse content directly
      const content = data.choices?.[0]?.message?.content || "";
      try {
        const parsed = JSON.parse(content);
        const captions = Array.isArray(parsed) ? parsed : parsed.captions;
        return new Response(JSON.stringify({ captions }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        throw new Error("Failed to parse AI response");
      }
    }

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ captions: args.captions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image-captions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

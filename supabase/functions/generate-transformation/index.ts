import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map funnel types to guidance for transformation statements
const FUNNEL_GUIDANCE: Record<string, string> = {
  "freebie": "Focus on quick wins, initial steps, and accessible transformations. The statement should emphasize getting started easily and building momentum.",
  "low-ticket": "Emphasize affordable, high-value transformation. Focus on specific, tangible outcomes that justify a small investment.",
  "webinar": "Focus on comprehensive transformation that can be previewed in educational content. Emphasize the 'aha moment' and breakthrough potential.",
  "challenge": "Emphasize community-driven transformation and accountability. Focus on time-bound results and group momentum.",
  "launch": "Focus on exclusive, high-impact transformation with urgency. Emphasize premium results and limited availability.",
  "membership": "Emphasize ongoing support, continuous improvement, and community. Focus on long-term transformation and sustained results.",
  "application": "Focus on premium, personalized transformation. Emphasize high-touch support and exceptional results for qualified clients.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audience, problem, result, niche, funnelType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware guidance
    const funnelGuidance = funnelType && FUNNEL_GUIDANCE[funnelType] 
      ? `\n\nFunnel Context (${funnelType}): ${FUNNEL_GUIDANCE[funnelType]}`
      : "";

    const nicheContext = niche 
      ? `\nNiche: ${niche}. Use terminology and language that resonates specifically with this industry/niche.`
      : "";

    const systemPrompt = `You are an expert copywriter specializing in transformation statements for coaches and digital marketers. 
Your task is to create compelling transformation statements following this exact formula:
"I help [specific audience] [overcome specific problem/achieve specific state] so they can [desired result with measurable impact]."

Guidelines:
- Keep it concise but impactful (1-2 sentences max)
- Use active, powerful language
- Make the transformation clear and desirable
- Include specificity where possible
- The statement should resonate emotionally with the target audience
- Vary your language and structure while maintaining the formula's essence${nicheContext}${funnelGuidance}`;

    const userPrompt = `Create a transformation statement based on:
- Target Audience: ${audience}
- Problem they face / State they want to achieve: ${problem}
- Desired Result with measurable impact: ${result}
${niche ? `- Niche/Industry: ${niche}` : ""}
${funnelType ? `- Funnel Type: ${funnelType}` : ""}

Generate only the transformation statement, nothing else. Do not include quotes around it.`;

    console.log("Generating transformation with context:", { niche, funnelType, audience: audience?.substring(0, 50) });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate transformation statement");
    }

    const data = await response.json();
    const statement = data.choices?.[0]?.message?.content?.trim();

    if (!statement) {
      throw new Error("No statement generated");
    }

    console.log("Generated statement successfully");

    return new Response(
      JSON.stringify({ statement }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating transformation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

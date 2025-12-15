import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PainSymptom {
  id: string;
  text: string;
}

interface LikelihoodElement {
  id: string;
  type: 'objection_counter' | 'proof' | 'credibility';
  text: string;
}

interface TimeEffortElement {
  id: string;
  type: 'quick_win' | 'friction_reducer';
  text: string;
}

interface RequestBody {
  targetAudience: string;
  niche: string;
  primaryPainPoint: string;
  painSymptoms: PainSymptom[];
  desiredOutcome: string;
  mainObjections: string;
  likelihoodElements: LikelihoodElement[];
  timeEffortElements: TimeEffortElement[];
  selectedStyle: 'short' | 'practical' | 'aspirational' | 'authority';
  funnelType: string;
}

const STYLE_DESCRIPTIONS: Record<string, string> = {
  short: "Ultra-concise, punchy, perfect for social bios and hooks. Maximum 15 words. Direct and memorable.",
  practical: "Clear and specific, ideal for sales pages. 2-3 sentences. Focus on concrete outcomes and transformation.",
  aspirational: "Emotionally resonant and identity-focused. Great for branding. Emphasize the aspirational future state.",
  authority: "Expertise-driven and premium-positioned. Best for high-ticket offers. Establish credibility and exclusivity.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const {
      targetAudience,
      niche,
      primaryPainPoint,
      painSymptoms,
      desiredOutcome,
      mainObjections,
      likelihoodElements,
      timeEffortElements,
      selectedStyle,
      funnelType,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract quick wins from time/effort elements
    const quickWins = timeEffortElements
      ?.filter(e => e.type === 'quick_win')
      .map(e => e.text)
      .slice(0, 3)
      .join(', ') || 'quick results';

    // Extract friction reducers
    const frictionReducers = timeEffortElements
      ?.filter(e => e.type === 'friction_reducer')
      .map(e => e.text)
      .slice(0, 2)
      .join(', ') || '';

    // Extract pain symptoms
    const symptomsText = painSymptoms
      ?.map(s => s.text)
      .slice(0, 3)
      .join(', ') || '';

    // Get style description
    const styleDescription = STYLE_DESCRIPTIONS[selectedStyle] || STYLE_DESCRIPTIONS.practical;

    const systemPrompt = `You are an expert copywriter specializing in transformation statements for coaches and digital marketers.
Your job is to create powerful, specific transformation statements based on structured audience data.

RULES:
- Do NOT introduce new concepts not provided in the inputs
- Use clear before/after language
- Avoid hype words (revolutionary, life-changing, game-changing, etc.)
- Keep it outcome-focused and specific
- Match the selected tone exactly
- Make each version distinct in style but consistent in meaning

Return ONLY valid JSON with no additional text.`;

    const userPrompt = `Using these EXACT structured inputs, generate 3 transformation statement versions.

WHO: ${targetAudience} in the ${niche} space
CURRENT STRUGGLE: ${primaryPainPoint}
${symptomsText ? `- Symptoms: ${symptomsText}` : ''}
DESIRED OUTCOME: ${desiredOutcome}
${mainObjections ? `KEY OBSTACLES: ${mainObjections}` : ''}
${quickWins ? `FAST WINS they want: ${quickWins}` : ''}
${frictionReducers ? `FRICTION to remove: ${frictionReducers}` : ''}
FUNNEL TYPE: ${funnelType || 'general'}
TONE: ${styleDescription}

OUTPUT (return as JSON):
{
  "one_liner": "Bio/hook version (max 15 words, punchy and memorable)",
  "standard": "Sales page version (2-3 sentences, clear transformation with outcome)",
  "expanded": "About section version (3-4 sentences, includes mechanism/approach)"
}`;

    console.log("Generating transformation with style:", selectedStyle, "for funnel:", funnelType);

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
      throw new Error("Failed to generate transformation versions");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No content generated");
    }

    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    let versions;
    try {
      versions = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid response format from AI");
    }

    // Validate the response structure
    if (!versions.one_liner || !versions.standard || !versions.expanded) {
      throw new Error("Missing required transformation versions");
    }

    console.log("Generated transformation versions successfully");

    return new Response(
      JSON.stringify({ versions }),
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

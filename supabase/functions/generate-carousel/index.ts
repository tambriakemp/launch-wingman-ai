import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const {
      offer,
      audience,
      painPoint,
      cta,
      slideCount,
      funnelStage,
      buyerTemp,
      framework,
      tone,
      voiceModifier,
      conversionBoost,
      inspirationText,
    } = await req.json();

    if (!offer || !audience || !painPoint || !framework) {
      return new Response(
        JSON.stringify({ error: "Required fields missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt =
      "You are an expert Instagram carousel copywriter who specializes in high-converting content built on psychological frameworks. Return ONLY a valid JSON array. No markdown, no code fences, no explanations.";

    const userPrompt = `Create a ${slideCount || 7}-slide Instagram carousel using the ${framework} framework.

OFFER: ${offer}

TARGET AUDIENCE: ${audience}

MAIN PAIN POINT: ${painPoint}

CTA: ${cta || "Follow for more"}

FUNNEL STAGE: ${funnelStage}

AUDIENCE TEMPERATURE: ${buyerTemp}

TONE: ${tone}

${voiceModifier ? `VOICE STYLE: ${voiceModifier}` : ""}

${conversionBoost ? "CONVERSION BOOST: Strengthen the hook slide, add tension in the middle slides, and tighten the final CTA slide." : ""}

${inspirationText ? `INSPIRED BY: ${inspirationText}` : ""}

Return a JSON array of exactly ${slideCount || 7} objects. Each object must have:

- "slideNumber": number (1 to ${slideCount || 7})

- "headline": string (punchy, under 12 words, the main text for this slide)

- "body": string (supporting copy, 1-3 sentences, conversational)

- "imagePrompt": string (a visual description for this slide's background or graphic, 1 sentence)

- "slideType": string (one of: "hook", "pain", "belief", "solution", "proof", "value", "cta", "bridge")

Slide 1 must always be the hook slide. The final slide must always be the CTA slide. Apply the ${framework} framework to structure the narrative arc of all slides in between.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const slides = JSON.parse(cleaned);

    if (!Array.isArray(slides)) {
      throw new Error("AI response was not a valid array");
    }

    return new Response(JSON.stringify({ slides }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-carousel error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate carousel";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

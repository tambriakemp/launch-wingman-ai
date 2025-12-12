import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      sectionType, 
      audience, 
      problem, 
      desiredOutcome, 
      offerName, 
      offerType, 
      deliverables,
      // Optional context for "whyDifferent" section
      attemptedSolutions,
      whyFails,
      uniqueApproach,
      inferContext
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (sectionType === "hero") {
      systemPrompt = `You are a direct-response conversion copywriter.

Write the HERO section for a sales page.

Requirements:
- Create 5 headline options using these bold promise patterns:
  1) Do (desired outcome) without (main obstacle)
  2) Stop (pain), start (desired outcome)
  3) The fastest way to (desired outcome) for (audience)
  4) Finally, (achieve result) without (common frustration)
  5) What if you could (desired outcome) in (timeframe)?
- Then choose the best headline and write:
  - 1 subheadline (1-2 sentences that expands on the promise)
  - 3 short benefit bullets (specific, outcome-focused)
  - 1 CTA button text (action-oriented, 2-5 words)

Tone: clear, confident, modern (not hypey)
Avoid vague words like "aligned", "empowered", "transform your life" unless backed by specifics.

Return ONLY valid JSON in this exact format:
{
  "headlines": ["headline1", "headline2", "headline3", "headline4", "headline5"],
  "recommendedHeadline": 0,
  "subheadline": "...",
  "benefits": ["benefit1", "benefit2", "benefit3"],
  "cta": "..."
}`;

      userPrompt = `Create HERO section copy for:
- Target Audience: ${audience || "Not specified"}
- Core Problem: ${problem || "Not specified"}
- Desired Outcome: ${desiredOutcome || "Not specified"}
- Offer Name: ${offerName || "Not specified"}
- Offer Type: ${offerType || "Digital product"}
- Main Deliverables: ${deliverables?.join(", ") || "Not specified"}

Generate compelling, specific copy that speaks directly to the audience's pain and desired transformation.`;

    } else if (sectionType === "whyDifferent") {
      // Check if we need to infer context or use provided context
      let contextSection = "";
      
      if (inferContext) {
        // AI will infer what solutions the audience has tried based on the problem/audience
        contextSection = `Based on the audience and problem, infer:
- What solutions they've likely tried before
- Why those solutions typically fail for this audience
- What makes a better approach for solving this problem`;
      } else {
        contextSection = `What they've tried: ${attemptedSolutions || "Generic solutions"}
Why those fail: ${whyFails || "Not personalized to their specific situation"}
Our unique approach: ${uniqueApproach || "Tailored, step-by-step guidance"}`;
      }

      systemPrompt = `You are a direct-response conversion copywriter.

Write the "Why this is different" section for a sales page.

Requirements:
- 1 opening paragraph starting with "You're tired of…" (2-3 sentences, empathetic, specific)
- 3-5 comparison bullets using this pattern:
  "You thought about (solution A) BUT (why it didn't work)"
  "You also considered (solution B) BUT (limitation)"
- End with 1 bridge sentence that transitions to the solution (builds anticipation)

Tone: understanding, confident, not condescending

Return ONLY valid JSON in this exact format:
{
  "openingParagraph": "You're tired of...",
  "comparisonBullets": ["bullet1", "bullet2", "bullet3"],
  "bridgeSentence": "..."
}`;

      userPrompt = `Create "Why This Is Different" section for:
- Target Audience: ${audience || "Not specified"}
- Core Problem: ${problem || "Not specified"}  
- Desired Outcome: ${desiredOutcome || "Not specified"}
- Offer Name: ${offerName || "Not specified"}

${contextSection}

Write copy that validates their frustration and positions this offer as the solution they've been looking for.`;

    } else {
      throw new Error("Invalid section type. Use 'hero' or 'whyDifferent'");
    }

    console.log(`Generating ${sectionType} section copy`);

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
      throw new Error("Failed to generate sales copy");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No content generated");
    }

    console.log("AI response:", content);

    // Parse JSON response
    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content;
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      
      if (objectMatch) {
        result = JSON.parse(objectMatch[0]);
      } else {
        result = JSON.parse(jsonStr);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(
      JSON.stringify({ sectionType, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-sales-copy:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

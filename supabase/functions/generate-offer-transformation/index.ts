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
    const { operation, audience, problem, desiredOutcome, offerType, timeframe, statements, statement } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (operation === "generate") {
      // Initial generation - 3 variations
      systemPrompt = `You are an expert offer strategist. Create clear, compelling transformation statements for digital offers.

Guidelines:
- Focus on the transformation, not the features.
- Clearly show the "before" and "after".
- Use simple, confident language.
- Keep each statement to 1 sentence.
- Avoid vague words like "empowered", "elevated", or "aligned" unless they are supported by a tangible result.

Return exactly 3 variations as a JSON array of strings. Example format:
["Statement 1", "Statement 2", "Statement 3"]`;

      userPrompt = `Create 3 transformation statement variations for a digital offer.

- Target audience: ${audience}
- Core problem: ${problem}
- Desired outcome: ${desiredOutcome}
- Offer type: ${offerType}
${timeframe ? `- Timeframe: ${timeframe}` : ""}

Return only the JSON array, no other text.`;

    } else if (operation === "refine") {
      // Refine existing statements
      systemPrompt = `You are an expert offer strategist. Refine transformation statements to be more specific and outcome-driven.

Rules:
- Replace vague outcomes with tangible results.
- Clarify what actually changes for the person.
- Make it easy to imagine success after completing the offer.

Return exactly 3 improved variations as a JSON array of strings. Example format:
["Improved statement 1", "Improved statement 2", "Improved statement 3"]`;

      userPrompt = `Refine these transformation statements to be more specific and outcome-driven:

${statements.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

Return only the JSON array, no other text.`;

    } else if (operation === "alignment") {
      // Offer type alignment check
      systemPrompt = `You are an expert offer strategist. Review transformation statements to ensure they match the offer type.

Rules:
- Free or warm-up offers should promise clarity, momentum, or small wins.
- Paid or premium offers can promise deeper or long-term results.
- Do not overpromise.

Return the revised statement as a JSON object with keys "revised" (string) and "feedback" (string explaining any changes). Example:
{"revised": "The revised statement", "feedback": "Explanation of changes made"}`;

      userPrompt = `Review this transformation statement and ensure it matches the offer type.

Offer type: ${offerType}

Transformation statement:
${statement}

Return only the JSON object, no other text.`;

    } else {
      throw new Error("Invalid operation. Use 'generate', 'refine', or 'alignment'.");
    }

    console.log(`Processing ${operation} operation`);

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
      throw new Error("Failed to generate transformation statements");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No content generated");
    }

    console.log("AI response:", content);

    // Parse JSON from the response
    let result;
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    if (operation === "generate" || operation === "refine") {
      return new Response(
        JSON.stringify({ statements: result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in generate-offer-transformation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

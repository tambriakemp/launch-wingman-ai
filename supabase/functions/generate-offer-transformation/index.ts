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
    const { operation, audience, problem, desiredOutcome, offerType, timeframe, statements, statement, feedback } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    // Determine if this is a free/warm-up offer
    const isFreeOffer = offerType?.toLowerCase().includes("freebie") || 
                        offerType?.toLowerCase().includes("tangible digital") ||
                        offerType?.toLowerCase().includes("workshop") ||
                        offerType?.toLowerCase().includes("strategic") ||
                        offerType?.toLowerCase().includes("warm-up");

    if (operation === "generate") {
      systemPrompt = `You are an expert offer strategist.

Create a clear, compelling transformation statement for a digital offer.

Guidelines:
- Focus on the transformation, not the features.
- Clearly show the "before" and "after".
- Use simple, confident language.
- Keep it to 1 sentence.
- Avoid vague words like "empowered", "elevated", or "aligned" unless they are supported by a tangible result.
${isFreeOffer ? "- For free/warm-up offers: Focus on clarity, momentum, initial steps, and small wins - NOT deep transformation." : "- For paid offers: You can promise deeper, long-term results and meaningful transformation."}

Return exactly 3 variations as a JSON array of strings.`;

      userPrompt = `Create transformation statements for:
- Target audience: ${audience}
- Core problem: ${problem}
- Desired outcome: ${desiredOutcome}
- Offer type: ${offerType}${isFreeOffer ? " (This is a FREE/warm-up offer)" : " (This is a PAID offer)"}
${timeframe ? `- Timeframe: ${timeframe}` : ""}

Return ONLY a JSON array with exactly 3 transformation statements, nothing else.
Example format: ["Statement 1", "Statement 2", "Statement 3"]`;

    } else if (operation === "refine") {
      systemPrompt = `You are an expert offer strategist specializing in crafting compelling transformation statements.

Refine the transformation statements below to be more specific and outcome-driven.

Rules:
- Replace vague outcomes with tangible results.
- Clarify what actually changes for the person.
- Make it easy to imagine success after completing the offer.
${isFreeOffer ? "- IMPORTANT: This is a FREE/warm-up offer. Focus on clarity, momentum, initial steps, and small wins - NOT deep transformation or long-term results." : "- This is a PAID offer, so deeper transformation promises are appropriate."}

Return exactly the same number of improved statements as a JSON array.`;

      userPrompt = `Refine these transformation statements for a ${isFreeOffer ? "FREE/warm-up" : "PAID"} offer:
${statements.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

Return ONLY a JSON array with the improved statements, nothing else.
Example format: ["Improved statement 1", "Improved statement 2", "Improved statement 3"]`;

    } else if (operation === "alignment") {
      systemPrompt = `You are an expert offer strategist reviewing transformation statements for alignment with offer types.

Review the transformation statement and ensure it matches the offer type expectations.

Rules:
- Free or warm-up offers should promise clarity, momentum, or small wins.
- Paid or premium offers can promise deeper or long-term results.
- Do not overpromise.

Provide feedback on the alignment and a revised version if needed.`;

      userPrompt = `Review this transformation statement for a "${offerType}" offer:

"${statement}"

Is this ${isFreeOffer ? "free/warm-up" : "paid"} offer's transformation statement appropriately scoped?

Return a JSON object with:
- "revised": the improved statement (or the original if no changes needed)
- "feedback": brief explanation of what was changed and why (or confirmation that it's well-aligned)

Example: {"revised": "...", "feedback": "..."}`;

    } else if (operation === "adjust") {
      // New operation: Generate adjusted statement based on alignment feedback
      systemPrompt = `You are an expert offer strategist. Based on the alignment feedback provided, generate an improved transformation statement that properly matches the offer type expectations.

Rules:
${isFreeOffer ? "- This is a FREE/warm-up offer: Focus on clarity, momentum, initial steps, and small wins - NOT deep transformation or long-term results." : "- This is a PAID offer: Deeper transformation and long-term results are appropriate."}
- Address the specific issues mentioned in the feedback.
- Keep it to 1 sentence.
- Use simple, confident language.
- Avoid vague words.`;

      userPrompt = `Generate an adjusted transformation statement based on this feedback:

Original statement: "${statement}"
Alignment feedback: "${feedback}"
Offer type: ${offerType} (${isFreeOffer ? "FREE/warm-up" : "PAID"})

Return ONLY a JSON object with the adjusted statement:
{"adjusted": "Your new transformation statement here"}`;

    } else {
      throw new Error("Invalid operation");
    }

    console.log(`Processing ${operation} operation for ${isFreeOffer ? "FREE" : "PAID"} offer`);

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
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No content generated");
    }

    console.log("AI response:", content);

    // Parse JSON response
    let result;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content;
      
      // Also try to find array or object pattern
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      
      if (arrayMatch) {
        result = JSON.parse(arrayMatch[0]);
      } else if (objectMatch) {
        result = JSON.parse(objectMatch[0]);
      } else {
        result = JSON.parse(jsonStr);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    if (operation === "generate" || operation === "refine") {
      if (!Array.isArray(result)) {
        throw new Error("Expected array of statements");
      }
      return new Response(
        JSON.stringify({ statements: result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (operation === "alignment") {
      return new Response(
        JSON.stringify({ revised: result.revised, feedback: result.feedback }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (operation === "adjust") {
      return new Response(
        JSON.stringify({ adjusted: result.adjusted }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown operation" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-offer-transformation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

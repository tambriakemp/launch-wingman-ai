import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Slot type guidance for AI
const SLOT_TYPE_GUIDANCE: Record<string, string> = {
  "lead-magnet": "This is a FREE offer to attract leads. Focus on quick wins, easy consumption, and high perceived value. Examples: checklists, templates, mini-courses, guides.",
  "tripwire": "This is a LOW-TICKET offer ($7-47). Focus on immediate, specific results that build trust. Should be irresistible value for the price.",
  "core": "This is the MAIN offer ($97-997+). Focus on comprehensive transformation and significant results. This is where the real value lives.",
  "upsell": "This is an UPGRADE offer. Focus on accelerated results, additional support, or premium features that complement the core offer.",
  "downsell": "This is a REDUCED alternative. Focus on a simpler version or payment plan that still delivers value at a lower commitment.",
  "bonus": "This is an ADDED VALUE item. Focus on complementary tools or resources that enhance the main offer.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      niche, 
      targetAudience,
      primaryPainPoint,
      desiredOutcome,
      offerType, 
      slotType,
      funnelType,
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const slotGuidance = slotType && SLOT_TYPE_GUIDANCE[slotType] 
      ? `\n\nSlot Type Context: ${SLOT_TYPE_GUIDANCE[slotType]}`
      : "";

    const systemPrompt = `You are an expert marketing strategist and offer creation consultant for coaches and digital marketers. Your job is to generate creative, compelling offer ideas based on the user's complete context.

Generate exactly 3 unique offer ideas. Each idea should be:
- Specific and actionable
- Appealing to the target audience
- Aligned with the selected offer type (${offerType || "not specified"})
- Appropriate for the slot position in the funnel
- Include a catchy title and a 2-3 sentence description${slotGuidance}

Return the response as a JSON object with this exact structure:
{
  "ideas": [
    {
      "title": "Offer Title Here",
      "description": "Description explaining what this offer includes, who it's for, and what transformation it delivers."
    }
  ]
}

Only return valid JSON, no additional text or markdown.`;

    const userPrompt = `Generate 3 offer ideas with the following context:

Niche: ${niche || "Not specified"}
Target Audience: ${targetAudience || "Not specified"}
Primary Pain Point: ${primaryPainPoint || "Not specified"}
Desired Outcome: ${desiredOutcome || "Not specified"}
Offer Type: ${offerType || "Not specified"}
Slot Type: ${slotType || "core"} (position in funnel)
${funnelType ? `Funnel Type: ${funnelType}` : ""}

Create 3 compelling offer ideas that align with ALL of this context. Make sure the titles are catchy and the descriptions clearly articulate the value.`;

    console.log("Generating offer ideas with context:", { niche, slotType, offerType, funnelType });

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let ideas;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0]);
      } else {
        ideas = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse offer ideas from AI response");
    }

    console.log("Generated offer ideas successfully:", ideas?.ideas?.length);

    return new Response(JSON.stringify(ideas), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-offer-ideas:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate offer ideas";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

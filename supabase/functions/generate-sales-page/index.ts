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
      offerName,
      offerType,
      price,
      bigResult,
      whoItsFor,
      painPoint,
      stoppedBefore,
      bonuses,
      guarantee,
      tone,
    } = await req.json();

    if (!offerName || !bigResult || !whoItsFor || !painPoint) {
      return new Response(
        JSON.stringify({ error: "Required fields missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt =
      "You are an expert sales copywriter. You write high-converting sales page copy for coaches and digital product creators. Return ONLY a valid JSON object with exactly these 14 keys (no markdown, no code fences): opening-headline, paint-the-problem, look-into-future, introduce-offer, offer-differentiator, the-results, the-features, the-investment, the-guarantee, introduce-yourself, is-this-for-you, why-now, frequent-objections, final-cta. Each value should be the complete copy for that section.";

    const userPrompt = `Write a complete sales page for the following offer using the 14-block sales page framework.

Offer: ${offerName} (${offerType || "Digital Product"})
Price: ${price || "Not specified"}
The big result: ${bigResult}
Who it's for: ${whoItsFor}
Their biggest pain point: ${painPoint}
What's stopped them before: ${stoppedBefore || "Not specified"}
Bonuses: ${bonuses || "None"}
Guarantee: ${guarantee || "None specified"}
Tone: ${tone || "Warm and Conversational"}

For the introduce-yourself section, write a placeholder that says '[Your name] and [your story/background]. Customize this section with your personal story.'
For the frequent-objections section, write 5 Q&A pairs addressing common objections about price, time, results, and trust.
Make each section substantial and specific to this offer. Do not use generic placeholder text except in the introduce-yourself section.`;

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
    const sections = JSON.parse(cleaned);

    return new Response(JSON.stringify({ sections }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-sales-page error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate sales page";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

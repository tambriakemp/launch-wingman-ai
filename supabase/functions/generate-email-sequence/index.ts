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
      sequenceType,
      offerName,
      offerType,
      price,
      audience,
      transformation,
      painPoint,
      tone,
      emailCount,
      launchWindow,
    } = await req.json();

    if (!offerName || !audience || !transformation || !painPoint) {
      return new Response(
        JSON.stringify({ error: "Required fields missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt =
      "You are an expert email copywriter specializing in launches and digital product marketing. Return ONLY a valid JSON array of email objects. Each object must have these exact keys: subject (string), preview_text (string), body (string), send_day (string), purpose (string). No markdown, no code fences, just the raw JSON array.";

    const sequenceArcs: Record<string, string> = {
      welcome: "Sequence arc: Email 1 welcome + deliver, Email 2 your story + relatability, Email 3 common mistake, Email 4 quick win + soft pitch, Email 5 FAQ + offer reveal",
      launch: "Sequence arc: pre-launch anticipation → cart open announcement → value/results → objection handling → urgency/last chance",
      nurture: "Sequence arc: value-first, educational, story-driven emails that build trust over time with a soft pitch at the end",
      onboarding: "Sequence arc: welcome → quick win → how to get the most out of the product → community/support → success story",
    };

    const userPrompt = `Write a complete ${sequenceType} email sequence for the following offer.

Offer: ${offerName} (${offerType || "Digital Product"})
Price: ${price || "Not specified"}
Who it's for: ${audience}
The transformation they get: ${transformation}
Their biggest pain point: ${painPoint}
Tone: ${tone || "Warm and Conversational"}
Number of emails: ${emailCount || 5}
${sequenceType === "launch" ? `Launch window: ${launchWindow || "5 days"}` : ""}

Write exactly ${emailCount || 5} emails. For each email include:
- subject: A compelling subject line (under 60 chars)
- preview_text: Preview text that complements the subject (under 90 chars)
- body: Full email body with greeting, content, and sign-off. Use [First Name] as the personalization tag. Format with natural paragraph breaks using \\n\\n between paragraphs.
- send_day: When to send it (e.g. 'Day 1', 'Day 3 - Launch Day', 'Day 5 - Last Chance')
- purpose: One sentence describing this email's job (e.g. 'Build trust and share your story')

${sequenceArcs[sequenceType] || ""}

Make each email distinct with a clear job. Write real copy, not placeholders. Keep emails conversational and personal.`;

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
    const emails = JSON.parse(cleaned);

    return new Response(JSON.stringify({ emails }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-email-sequence error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate email sequence";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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

    const { idea, platform, selectedStyles, tone } = await req.json();

    if (!idea || typeof idea !== "string" || idea.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Content idea is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stylesText =
      selectedStyles && selectedStyles.length > 0
        ? selectedStyles.join(", ")
        : "Mix of all styles";

    const systemPrompt =
      "You are an expert social media copywriter specializing in high-performing content hooks. Return ONLY a valid JSON array of exactly 10 strings. No markdown, no code fences, no explanations — just the raw JSON array.";

    const userPrompt = `Generate 10 high-performing content hooks for the following.

Content idea: ${idea}

Platform: ${platform || "Any Platform"}

Hook styles to mix in (use as many as possible): ${stylesText}

Tone: ${tone || "Conversational"}

Rules:
- Each hook must be under 150 characters
- No weak openers like 'Have you ever', 'In today's post', 'I wanted to share'
- Make each hook distinctly different in style and structure
- Write specifically for ${platform || "Any Platform"} audience
- Lead with the most compelling element immediately`;

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

    // Strip markdown fences if present
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const hooks = JSON.parse(cleaned);

    if (!Array.isArray(hooks)) {
      throw new Error("AI response was not a valid array");
    }

    return new Response(JSON.stringify({ hooks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-hooks error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate hooks";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADJUSTMENT_PROMPTS: Record<string, string> = {
  simplify: "Make this simpler and easier to understand. Use shorter words and clearer sentences.",
  shorter: "Make this much shorter while keeping the core message. Aim for half the length.",
  calmer: "Rewrite this to feel calmer and less energetic. Remove any excitement or urgency.",
  direct: "Make this more direct and straightforward. Get to the point faster.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, talkingPoint, existingDraft, adjustment, currentPhase, funnelType, audienceData } = await req.json();

    console.log("Generating content draft:", { projectId, hasExistingDraft: !!existingDraft, adjustment });

    const systemPrompt = `You are a calm, supportive writing assistant for online creators.
You help write authentic, non-pushy social media content.

CRITICAL RULES:
- Never use urgency language (no "limited time", "act now", "don't miss")
- Never add hashtags
- Never suggest calls-to-action like "comment below" or "link in bio"
- Keep the tone warm, conversational, and genuine
- Write as if talking to a friend, not selling to a customer
- Avoid corporate or marketing speak
- No emojis unless the user's tone profile includes them

The draft should feel like a real person sharing real thoughts.`;

    let userPrompt: string;

    if (existingDraft && adjustment) {
      // Adjusting an existing draft
      const adjustmentInstruction = ADJUSTMENT_PROMPTS[adjustment] || "Improve this draft.";
      userPrompt = `${adjustmentInstruction}

Current draft:
${existingDraft}

Return ONLY the revised text, no explanations.`;
    } else if (talkingPoint) {
      // Generating a new draft from a talking point
      const audienceContext = audienceData
        ? `
Writing for: ${audienceData.target_audience || "general audience"}
Their challenge: ${audienceData.primary_pain_point || "not specified"}
What they want: ${audienceData.desired_outcome || "not specified"}`
        : "";

      userPrompt = `Write a draft social media post based on this talking point:

Title: ${talkingPoint.title}
Direction: ${talkingPoint.description}
${audienceContext}

Write 2-4 short paragraphs that feel genuine and conversational.
The post should be adaptable - something the creator can personalize.
Return ONLY the draft text, no explanations or formatting instructions.`;
    } else {
      throw new Error("Either talkingPoint or existingDraft with adjustment is required");
    }

    const response = await fetch("https://api.lov.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const draft = aiData.choices?.[0]?.message?.content;

    if (!draft) {
      throw new Error("No content in AI response");
    }

    console.log("Generated draft length:", draft.length);

    return new Response(JSON.stringify({ draft: draft.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-content-draft:", error);
    
    // Return a fallback draft
    const fallback = {
      draft: "I've been thinking about this lately...\n\nShare your thoughts here. What's been on your mind?",
    };

    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

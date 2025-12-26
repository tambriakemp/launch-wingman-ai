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

// Category-specific drafting rules and intents
const CATEGORY_DRAFTING: Record<string, {
  intent: string;
  rules: string;
  tone: string;
}> = {
  general: {
    intent: "Build familiarity and trust through perspective and explanation.",
    rules: `- Explanatory, calm, and reflective tone
- No questions required
- No selling language
- Share a perspective or realization
- Help the audience feel understood`,
    tone: "thoughtful and grounded",
  },
  stories: {
    intent: "Invite reflection and engagement through moments, questions, or personal insight.",
    rules: `- First-person language encouraged
- May include a reflective question at the end
- Start from a moment, question, or thought — NOT an explanation
- Avoid teaching or lecturing
- Create emotional connection`,
    tone: "personal and reflective",
  },
  offer: {
    intent: "Help people understand what the offer is and who it's for — without selling.",
    rules: `- Clarifying, reassuring tone
- No urgency, scarcity, or calls-to-action
- No promises or performance language
- Explain as if talking to someone who's curious, not convinced
- Be honest about who it's for and who it's not for`,
    tone: "clear and reassuring",
  },
  "behind-the-scenes": {
    intent: "Humanize the creator by sharing process, uncertainty, or progress.",
    rules: `- Conversational and informal tone
- Imperfect language allowed — feel unpolished
- Write like you're thinking out loud
- No teaching, no persuasion
- Show the real work, including uncertainty`,
    tone: "casual and authentic",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, talkingPoint, existingDraft, adjustment, currentPhase, funnelType, audienceData, contentType } = await req.json();

    console.log("Generating content draft:", { projectId, hasExistingDraft: !!existingDraft, adjustment, contentType });

    const categoryConfig = CATEGORY_DRAFTING[contentType] || CATEGORY_DRAFTING.general;

    const systemPrompt = `You are a calm, supportive writing assistant for online creators.
You help write authentic, non-pushy social media content.

CRITICAL RULES (APPLY TO ALL CONTENT):
- Never use urgency language (no "limited time", "act now", "don't miss")
- Never add hashtags
- Never suggest calls-to-action like "comment below" or "link in bio"
- Keep the tone warm, conversational, and genuine
- Write as if talking to a friend, not selling to a customer
- Avoid corporate or marketing speak
- No emojis unless specifically requested
- Never predict performance or suggest posting frequency

CATEGORY INTENT: ${categoryConfig.intent}

CATEGORY-SPECIFIC DRAFTING RULES:
${categoryConfig.rules}

The draft should feel ${categoryConfig.tone}.`;

    let userPrompt: string;

    if (existingDraft && adjustment) {
      // Adjusting an existing draft - maintain category rules
      const adjustmentInstruction = ADJUSTMENT_PROMPTS[adjustment] || "Improve this draft.";
      userPrompt = `${adjustmentInstruction}

Important: Keep the draft aligned with the "${contentType}" category intent:
"${categoryConfig.intent}"

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

      // Category-specific prompts for the user message
      const categoryPrompts: Record<string, string> = {
        general: "Share a perspective or realization that helps your audience feel understood. Be explanatory and calm.",
        stories: "Start with a moment, question, or thought — not an explanation. Invite reflection.",
        offer: "Explain this as if you're talking to someone who's curious, not convinced. Be clarifying and reassuring.",
        "behind-the-scenes": "Write this like you're thinking out loud. Be conversational and real.",
      };
      const categoryPrompt = categoryPrompts[contentType as string] || "Write authentically and warmly.";

      userPrompt = `Write a draft social media post based on this talking point:

Title: ${talkingPoint.title}
Direction: ${talkingPoint.description}
Category: ${contentType}
${audienceContext}

Guidance: ${categoryPrompt}

Write 2-4 short paragraphs that feel genuine and conversational.
The post should be adaptable - something the creator can personalize.
Stay true to the category's intent: "${categoryConfig.intent}"

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
    
    // Return a category-aware fallback draft
    const fallback = {
      draft: "I've been thinking about this lately...\n\nShare your thoughts here. What's been on your mind?",
    };

    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

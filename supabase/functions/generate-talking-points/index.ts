import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TalkingPoint {
  id: string;
  title: string;
  description: string;
  contentType: string;
}

const PHASE_CONTEXT: Record<string, string> = {
  planning: "early stage, building foundation and clarity",
  content: "creating content and building anticipation", 
  messaging: "refining voice and message",
  build: "building and making progress",
  launch: "actively launching and helping people decide",
  "post-launch": "post-launch reflection and continuity",
};

const CONTENT_TYPE_PROMPTS: Record<string, string> = {
  general: "general social media posts that build connection and trust",
  stories: "story-based content, personal prompts, and relatable moments",
  offer: "content that explains the offer naturally without being pushy",
  "behind-the-scenes": "behind-the-scenes content showing the real work",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, contentType, currentPhase, funnelType, audienceData } = await req.json();

    console.log("Generating talking points:", { projectId, contentType, currentPhase, funnelType });

    const phaseContext = PHASE_CONTEXT[currentPhase] || "general project phase";
    const contentTypeContext = CONTENT_TYPE_PROMPTS[contentType] || "general content";

    const audienceContext = audienceData
      ? `
Target audience: ${audienceData.target_audience || "not specified"}
Their main pain point: ${audienceData.primary_pain_point || "not specified"}
What they want: ${audienceData.desired_outcome || "not specified"}
Niche: ${audienceData.niche || "not specified"}`
      : "No specific audience data available yet.";

    const systemPrompt = `You are a calm, supportive content strategist for online creators and course makers. 
Your job is to suggest gentle, non-pushy content ideas that feel authentic.

CRITICAL RULES:
- Never use urgency language (no "limited time", "act now", "don't miss")
- Never suggest hashtags or platform-specific tactics
- Never recommend posting frequency or timing
- Never predict performance or metrics
- Keep suggestions warm, human, and conversational
- Focus on connection, not conversion
- These are ideas, not requirements

Respond ONLY with valid JSON, no markdown.`;

    const userPrompt = `Generate 4-5 talking point ideas for ${contentTypeContext}.

Context:
- Project phase: ${phaseContext}
- Funnel type: ${funnelType || "not selected yet"}
${audienceContext}

Each talking point should have:
- A short, human title (3-6 words)
- A one-sentence description that gives direction without being prescriptive

Return JSON in this exact format:
{
  "talkingPoints": [
    {"id": "1", "title": "...", "description": "...", "contentType": "${contentType}"},
    {"id": "2", "title": "...", "description": "...", "contentType": "${contentType}"}
  ]
}`;

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
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let parsed;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    console.log("Generated talking points:", parsed.talkingPoints?.length);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-talking-points:", error);
    
    // Return fallback talking points
    const fallback = {
      talkingPoints: [
        { id: "1", title: "Share your journey", description: "Talk about why you started this project and what drives you.", contentType: "general" },
        { id: "2", title: "Address a common question", description: "Answer something your audience frequently asks about.", contentType: "general" },
        { id: "3", title: "Share a quick win", description: "Give your audience a simple tip they can use today.", contentType: "general" },
      ],
    };

    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

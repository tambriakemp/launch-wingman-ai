import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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

// Category-specific intent definitions
const CATEGORY_INTENTS: Record<string, {
  intent: string;
  talkingPointGuidance: string;
  examples: string;
}> = {
  general: {
    intent: "Build familiarity and trust through perspective and explanation.",
    talkingPointGuidance: `Talking points should:
- Explain beliefs or insights
- Normalize struggles  
- Reframe common misunderstandings
- Build resonance without asking for action`,
    examples: `Good examples:
- "Why I stopped chasing [common goal]"
- "The real reason [common struggle] happens"
- "What I wish I knew about [topic] earlier"
- "A small shift that changed how I think about [topic]"`,
  },
  stories: {
    intent: "Invite reflection and engagement through moments, questions, or personal insight.",
    talkingPointGuidance: `Talking points should:
- Start from a moment or thought
- Encourage reflection
- Invite replies or emotional connection
- NOT explain or teach`,
    examples: `Good examples:
- "A moment that made me rethink everything"
- "What happened when I finally [action]"
- "The question I keep coming back to"
- "Something I noticed this week..."`,
  },
  offer: {
    intent: "Help people understand what the offer is and who it's for — without selling.",
    talkingPointGuidance: `Talking points should:
- Clarify who the offer helps
- Address confusion or objections
- Explain why the offer exists
- Set expectations gently
- NOT push or create urgency`,
    examples: `Good examples:
- "Who this is actually for (and who it's not)"
- "Why I created this the way I did"
- "A common question I get about [offer]"
- "What happens after you join"`,
  },
  "behind-the-scenes": {
    intent: "Humanize the creator by sharing process, uncertainty, or progress.",
    talkingPointGuidance: `Talking points should:
- Show work in progress
- Share learning or decision-making
- Acknowledge uncertainty or growth
- Feel unpolished and real`,
    examples: `Good examples:
- "What I'm working on this week"
- "Something I'm still figuring out"
- "A decision I'm wrestling with"
- "Behind the scenes of [recent thing]"`,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, contentType, currentPhase, funnelType, audienceData, previousIdeas = [] } = await req.json();

    console.log("Generating talking points:", { projectId, contentType, currentPhase, funnelType, isRefresh: previousIdeas.length > 0 });

    // Extract user ID from auth header
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const supabase = createClient(supabaseUrl, supabaseKey);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const phaseContext = PHASE_CONTEXT[currentPhase] || "general project phase";
    const categoryConfig = CATEGORY_INTENTS[contentType] || CATEGORY_INTENTS.general;

    const audienceContext = audienceData
      ? `
Target audience: ${audienceData.target_audience || "not specified"}
Their main pain point: ${audienceData.primary_pain_point || "not specified"}
What they want: ${audienceData.desired_outcome || "not specified"}
Niche: ${audienceData.niche || "not specified"}`
      : "No specific audience data available yet.";

    // Build previous ideas context for refresh
    const previousIdeasContext = previousIdeas.length > 0
      ? `

IMPORTANT - AVOID THESE PREVIOUSLY SHOWN IDEAS:
${previousIdeas.map((idea: string, i: number) => `${i + 1}. "${idea}"`).join("\n")}

You MUST generate ideas that:
- Take a DIFFERENT angle than the above
- Explore adjacent perspectives not yet covered
- Feel fresh while staying within the category intent
- Do NOT rephrase or repeat any of the above ideas`
      : "";

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

CATEGORY-SPECIFIC INTENT:
${categoryConfig.intent}

${categoryConfig.talkingPointGuidance}

${categoryConfig.examples}

Respond ONLY with valid JSON, no markdown.`;

    const refreshGuidance = previousIdeas.length > 0
      ? `

This is a REFRESH request. The user wants a different angle, not more of the same.
Shift perspective while staying within the "${contentType}" category intent.
Think: "What's another way to approach this category that hasn't been explored yet?"`
      : "";

    const userPrompt = `Generate 4-5 talking point ideas for the "${contentType}" category.

Context:
- Project phase: ${phaseContext}
- Funnel type: ${funnelType || "not selected yet"}
${audienceContext}${previousIdeasContext}${refreshGuidance}

Remember, these ideas must align with the category intent:
"${categoryConfig.intent}"

Each talking point should have:
- A short, human title (3-6 words) that reflects the category's purpose
- A one-sentence description that gives direction without being prescriptive

The ideas should feel noticeably different from other categories${previousIdeas.length > 0 ? " AND from the previously shown ideas" : ""}.

Return JSON in this exact format:
{
  "talkingPoints": [
    {"id": "1", "title": "...", "description": "...", "contentType": "${contentType}"},
    {"id": "2", "title": "...", "description": "...", "contentType": "${contentType}"}
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        temperature: previousIdeas.length > 0 ? 0.85 : 0.7, // Slightly higher temperature for refreshes
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

    // Log AI usage
    if (userId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase.from('ai_usage_logs').insert({
          user_id: userId,
          project_id: projectId || null,
          function_name: 'generate-talking-points',
          model: 'google/gemini-2.5-flash',
          tokens_used: aiData.usage?.total_tokens || null,
          success: true,
        });
      } catch (logError) {
        console.error('[GENERATE-TALKING-POINTS] Failed to log AI usage:', logError);
      }
    }

    console.log("Generated talking points:", parsed.talkingPoints?.length, previousIdeas.length > 0 ? "(refresh)" : "(initial)");

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-talking-points:", error);
    
    // Category-aware fallback talking points
    const { contentType = "general" } = await req.json().catch(() => ({ contentType: "general" }));
    
    const categoryFallbacks: Record<string, TalkingPoint[]> = {
      general: [
        { id: "1", title: "Share your perspective", description: "Explain a belief or insight that shapes how you approach your work.", contentType: "general" },
        { id: "2", title: "Normalize a struggle", description: "Talk about something your audience finds hard — and why it makes sense.", contentType: "general" },
        { id: "3", title: "Reframe a misunderstanding", description: "Address something commonly misunderstood in your space.", contentType: "general" },
      ],
      stories: [
        { id: "1", title: "A moment of realization", description: "Share a specific moment that changed how you think about your work.", contentType: "stories" },
        { id: "2", title: "What I noticed recently", description: "Reflect on something small that caught your attention this week.", contentType: "stories" },
        { id: "3", title: "A question I keep asking", description: "Share a question you find yourself returning to.", contentType: "stories" },
      ],
      offer: [
        { id: "1", title: "Who this is really for", description: "Clarify the specific person your offer is designed to help.", contentType: "offer" },
        { id: "2", title: "Why I built it this way", description: "Explain the thinking behind a specific decision in your offer.", contentType: "offer" },
        { id: "3", title: "A common question answered", description: "Address something people often ask about before joining.", contentType: "offer" },
      ],
      "behind-the-scenes": [
        { id: "1", title: "What I'm working on", description: "Share what's currently in progress, even if it's unfinished.", contentType: "behind-the-scenes" },
        { id: "2", title: "Something I'm figuring out", description: "Be honest about a decision or challenge you're still working through.", contentType: "behind-the-scenes" },
        { id: "3", title: "A small win this week", description: "Celebrate progress, even if it feels minor.", contentType: "behind-the-scenes" },
      ],
    };

    const fallback = {
      talkingPoints: categoryFallbacks[contentType] || categoryFallbacks.general,
    };

    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

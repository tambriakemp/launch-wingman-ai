import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Fetch all project context from planning and messaging phases
async function fetchProjectContext(supabase: any, projectId: string) {
  const context: Record<string, any> = {};

  try {
    // Fetch funnel data (audience, pain points, desired outcome, etc.)
    const { data: funnel } = await supabase
      .from("funnels")
      .select("target_audience, primary_pain_point, desired_outcome, problem_statement, niche, sub_audiences, pain_symptoms, likelihood_elements, time_effort_elements")
      .eq("project_id", projectId)
      .single();

    if (funnel) {
      context.funnel = funnel;
    }

    // Fetch offers (transformation statement, offer details)
    const { data: offers } = await supabase
      .from("offers")
      .select("title, description, target_audience, primary_pain_point, desired_outcome, transformation_statement, niche, offer_type, main_deliverables")
      .eq("project_id", projectId)
      .limit(3);

    if (offers && offers.length > 0) {
      context.offers = offers;
    }

    // Fetch project transformation statement
    const { data: project } = await supabase
      .from("projects")
      .select("transformation_statement, name, description")
      .eq("id", projectId)
      .single();

    if (project) {
      context.project = project;
    }

    // Fetch completed planning/messaging task inputs
    const { data: tasks } = await supabase
      .from("project_tasks")
      .select("task_id, input_data")
      .eq("project_id", projectId)
      .eq("status", "completed")
      .not("input_data", "is", null);

    if (tasks && tasks.length > 0) {
      // Filter for planning and messaging phase tasks
      const relevantTasks = tasks.filter((t: any) => 
        t.task_id?.startsWith("planning_") || 
        t.task_id?.startsWith("messaging_")
      );
      if (relevantTasks.length > 0) {
        context.completedTasks = relevantTasks;
      }
    }
  } catch (error) {
    console.error("Error fetching project context:", error);
  }

  return context;
}

// Build a rich context string from the fetched data
function buildContextString(context: Record<string, any>): string {
  const parts: string[] = [];

  // Project info
  if (context.project?.transformation_statement) {
    parts.push(`TRANSFORMATION STATEMENT: ${context.project.transformation_statement}`);
  }

  // Funnel/Audience data
  if (context.funnel) {
    const f = context.funnel;
    if (f.target_audience) parts.push(`TARGET AUDIENCE: ${f.target_audience}`);
    if (f.niche) parts.push(`NICHE: ${f.niche}`);
    if (f.primary_pain_point) parts.push(`PRIMARY PAIN POINT: ${f.primary_pain_point}`);
    if (f.desired_outcome) parts.push(`DESIRED OUTCOME: ${f.desired_outcome}`);
    if (f.problem_statement) parts.push(`PROBLEM STATEMENT: ${f.problem_statement}`);
    
    // Sub-audiences
    if (f.sub_audiences && Array.isArray(f.sub_audiences) && f.sub_audiences.length > 0) {
      const subAudiences = f.sub_audiences.map((s: any) => s.name || s).join(", ");
      parts.push(`SUB-AUDIENCES: ${subAudiences}`);
    }
    
    // Pain symptoms
    if (f.pain_symptoms && Array.isArray(f.pain_symptoms) && f.pain_symptoms.length > 0) {
      const symptoms = f.pain_symptoms.map((s: any) => typeof s === 'string' ? s : s.symptom || s.text || JSON.stringify(s)).join("; ");
      parts.push(`PAIN SYMPTOMS: ${symptoms}`);
    }
  }

  // Offer info
  if (context.offers && context.offers.length > 0) {
    const offer = context.offers[0]; // Use primary offer
    if (offer.title) parts.push(`OFFER NAME: ${offer.title}`);
    if (offer.offer_type) parts.push(`OFFER TYPE: ${offer.offer_type}`);
    if (offer.transformation_statement) parts.push(`OFFER TRANSFORMATION: ${offer.transformation_statement}`);
    if (offer.main_deliverables && offer.main_deliverables.length > 0) {
      parts.push(`MAIN DELIVERABLES: ${offer.main_deliverables.join(", ")}`);
    }
  }

  // Completed task insights
  if (context.completedTasks && context.completedTasks.length > 0) {
    const insights: string[] = [];
    for (const task of context.completedTasks) {
      const data = task.input_data;
      if (!data) continue;
      
      // Extract key fields from task input data
      if (data.transformation_statement) {
        insights.push(`Transformation: ${data.transformation_statement}`);
      }
      if (data.offer_name) {
        insights.push(`Offer: ${data.offer_name}`);
      }
      if (data.why_statement) {
        insights.push(`Why Statement: ${data.why_statement}`);
      }
      if (data.belief_statement) {
        insights.push(`Core Belief: ${data.belief_statement}`);
      }
    }
    if (insights.length > 0) {
      parts.push(`COMPLETED WORK INSIGHTS:\n${insights.join("\n")}`);
    }
  }

  return parts.join("\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, talkingPoint, existingDraft, adjustment, currentPhase, funnelType, audienceData, contentType, generateTitle } = await req.json();

    console.log("Generating content draft:", { projectId, hasExistingDraft: !!existingDraft, adjustment, contentType, generateTitle });

    const categoryConfig = CATEGORY_DRAFTING[contentType] || CATEGORY_DRAFTING.general;

    // Initialize Supabase client and fetch project context
    let projectContext = "";
    if (projectId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      const context = await fetchProjectContext(supabase, projectId);
      projectContext = buildContextString(context);
      console.log("Fetched project context length:", projectContext.length);
    }

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

The draft should feel ${categoryConfig.tone}.

${projectContext ? `
=== CREATOR'S BUSINESS CONTEXT ===
Use this context to make the content specific and relevant to their audience:

${projectContext}

Use this context naturally - don't quote it directly, but let it inform the voice, examples, and specificity of the content.
` : ""}`;

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

${generateTitle ? "Also generate a compelling, concise title for this post (5-10 words max)." : "Return ONLY the draft text, no explanations or formatting instructions."}`;
    } else {
      throw new Error("Either talkingPoint or existingDraft with adjustment is required");
    }

    const requestBody: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    };

    // Use tool calling for structured output when we need a title
    if (generateTitle) {
      requestBody.tools = [
        {
          type: "function",
          function: {
            name: "create_post",
            description: "Create a social media post with a title and content",
            parameters: {
              type: "object",
              properties: {
                title: { 
                  type: "string",
                  description: "A compelling, concise title for the post (5-10 words)"
                },
                content: { 
                  type: "string",
                  description: "The full post content (2-4 paragraphs)"
                }
              },
              required: ["title", "content"],
              additionalProperties: false
            }
          }
        }
      ];
      requestBody.tool_choice = { type: "function", function: { name: "create_post" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    
    let generatedTitle: string | undefined;
    let finalDraft: string;

    // Check if response is a tool call (structured output)
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        generatedTitle = parsed.title;
        finalDraft = parsed.content;
        console.log("Parsed tool call - title:", generatedTitle, "content length:", finalDraft?.length);
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
        throw new Error("Failed to parse AI response");
      }
    } else {
      // Regular text response (no tool call)
      const draft = aiData.choices?.[0]?.message?.content;
      if (!draft) {
        throw new Error("No content in AI response");
      }
      finalDraft = draft.trim();
      console.log("Regular response - draft length:", finalDraft.length);
    }

    return new Response(JSON.stringify({ 
      draft: finalDraft,
      ...(generatedTitle && { title: generatedTitle })
    }), {
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

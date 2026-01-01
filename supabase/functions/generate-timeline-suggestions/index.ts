import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TimelineTemplate {
  phase: string;
  day_number: number;
  time_of_day: 'morning' | 'evening';
  template_type: string;
  content_type: string;
  title_template: string;
  description_template: string;
}

// Fetch project context for personalization
async function fetchProjectContext(supabase: any, projectId: string) {
  console.log("Fetching project context for:", projectId);
  
  const [funnelResult, offersResult, projectResult, tasksResult] = await Promise.all([
    supabase.from("funnels").select("*").eq("project_id", projectId).maybeSingle(),
    supabase.from("offers").select("*").eq("project_id", projectId).eq("slot_type", "core").maybeSingle(),
    supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
    supabase.from("project_tasks").select("*").eq("project_id", projectId).eq("status", "completed"),
  ]);

  return {
    funnel: funnelResult.data,
    offer: offersResult.data,
    project: projectResult.data,
    completedTasks: tasksResult.data || [],
  };
}

// Build context string from project data
function buildContextString(context: Record<string, any>): string {
  const parts: string[] = [];

  if (context.project?.name) {
    parts.push(`Project: ${context.project.name}`);
  }

  if (context.project?.transformation_statement) {
    parts.push(`Transformation: ${context.project.transformation_statement}`);
  }

  if (context.funnel) {
    if (context.funnel.target_audience) {
      parts.push(`Target Audience: ${context.funnel.target_audience}`);
    }
    if (context.funnel.primary_pain_point) {
      parts.push(`Primary Pain Point: ${context.funnel.primary_pain_point}`);
    }
    if (context.funnel.desired_outcome) {
      parts.push(`Desired Outcome: ${context.funnel.desired_outcome}`);
    }
    if (context.funnel.niche) {
      parts.push(`Niche: ${context.funnel.niche}`);
    }
    if (context.funnel.problem_statement) {
      parts.push(`Problem Statement: ${context.funnel.problem_statement}`);
    }
  }

  if (context.offer) {
    if (context.offer.title) {
      parts.push(`Offer: ${context.offer.title}`);
    }
    if (context.offer.description) {
      parts.push(`Offer Description: ${context.offer.description}`);
    }
    if (context.offer.transformation_statement) {
      parts.push(`Offer Transformation: ${context.offer.transformation_statement}`);
    }
  }

  // Include relevant completed task inputs
  const relevantTasks = context.completedTasks?.filter((t: any) => 
    t.input_data && Object.keys(t.input_data).length > 0
  ) || [];
  
  if (relevantTasks.length > 0) {
    const taskContext = relevantTasks.slice(0, 5).map((t: any) => {
      const inputs = Object.entries(t.input_data || {})
        .filter(([_, v]) => v && String(v).length > 0)
        .map(([k, v]) => `${k}: ${String(v).slice(0, 200)}`)
        .join("; ");
      return inputs;
    }).filter(Boolean).join("\n");
    
    if (taskContext) {
      parts.push(`Additional Context from completed tasks:\n${taskContext}`);
    }
  }

  return parts.join("\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, template } = await req.json() as {
      projectId: string;
      template: TimelineTemplate;
    };

    if (!projectId || !template) {
      throw new Error("Missing required parameters: projectId and template");
    }

    console.log("Generating suggestion for:", template.phase, "Day", template.day_number, template.time_of_day);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch project context
    const context = await fetchProjectContext(supabase, projectId);
    const contextString = buildContextString(context);

    console.log("Context built, length:", contextString.length);

    // Build the prompt based on template type
    const templateTypePrompts: Record<string, string> = {
      'high-value': 'Create valuable, educational content that showcases expertise and provides immediate value.',
      'story': 'Share a relatable personal story or behind-the-scenes moment that builds connection.',
      'testimonial': 'Highlight a success story, transformation, or social proof.',
      'live': 'Announce or promote a live session, Q&A, or training.',
      'engagement': 'Create an engaging question, poll, or conversation starter.',
      'buzz': 'Build excitement and anticipation around the offer.',
      'offer-summary': 'Recap the day and remind about the offer.',
      'faq': 'Address common questions or objections.',
      'behind-scenes': 'Show the human side with behind-the-scenes content.',
      'fomo': 'Create urgency and fear of missing out.',
      'final-call': 'Final countdown and last chance messaging.',
    };

    const typeGuidance = templateTypePrompts[template.template_type] || 'Create engaging social media content.';

    const systemPrompt = `You are an expert social media content strategist helping course creators and coaches launch their offers successfully.

Your job is to generate a compelling, personalized title and description for a social media post based on the creator's specific context.

RULES:
- Title should be catchy, specific to their niche, and 5-15 words max
- Description should be a hook or first line that makes people want to read more (1-2 sentences)
- Make it feel personal and authentic, not generic
- Reference their specific audience, pain points, or transformation when relevant
- Match the energy and intent of the content type

CONTENT TYPE: ${template.content_type}
TEMPLATE TYPE: ${template.template_type}
INTENT: ${typeGuidance}

PHASE: ${template.phase.replace(/-/g, ' ').replace(/week/i, 'Week')}
DAY: ${template.day_number}
TIME: ${template.time_of_day}

ORIGINAL TEMPLATE GUIDANCE:
Title Template: ${template.title_template}
Description Template: ${template.description_template}`;

    const userPrompt = `Based on this creator's context, generate a personalized title and description for this post:

${contextString || "No specific project context available - create something generic but compelling for a course/coaching launch."}

Generate a personalized version of this ${template.template_type} content for ${template.phase.replace(/-/g, ' ')} Day ${template.day_number}.`;

    // Use tool calling for structured output
    const requestBody = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 300,
      tools: [
        {
          type: "function",
          function: {
            name: "create_suggestion",
            description: "Create a personalized title and description for a timeline content slot",
            parameters: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "A catchy, personalized title (5-15 words)"
                },
                description: {
                  type: "string",
                  description: "A compelling hook or first line (1-2 sentences)"
                }
              },
              required: ["title", "description"],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "create_suggestion" } }
    };

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
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    
    // Parse tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log("Generated suggestion:", parsed.title);
      
      return new Response(
        JSON.stringify({
          title: parsed.title,
          description: parsed.description,
          template_type: template.template_type,
          content_type: template.content_type,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback to regular text parsing if no tool call
    const content = aiData.choices?.[0]?.message?.content || "";
    console.log("Fallback parsing, content:", content.slice(0, 100));
    
    return new Response(
      JSON.stringify({
        title: template.title_template,
        description: template.description_template,
        template_type: template.template_type,
        content_type: template.content_type,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating timeline suggestion:", error);
    const message = error instanceof Error ? error.message : "Failed to generate suggestion";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

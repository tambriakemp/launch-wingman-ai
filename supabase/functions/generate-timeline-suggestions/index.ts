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

// Fetch project context for personalization - comprehensive data from planning & messaging phases
async function fetchProjectContext(supabase: any, projectId: string) {
  console.log("Fetching comprehensive project context for:", projectId);
  
  const [funnelResult, offersResult, projectResult, tasksResult] = await Promise.all([
    supabase.from("funnels").select("*").eq("project_id", projectId).maybeSingle(),
    supabase.from("offers").select("*").eq("project_id", projectId),
    supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
    supabase.from("project_tasks").select("*").eq("project_id", projectId).eq("status", "completed"),
  ]);

  return {
    funnel: funnelResult.data,
    offers: offersResult.data || [],
    project: projectResult.data,
    completedTasks: tasksResult.data || [],
  };
}

// Build comprehensive context string from project data
function buildContextString(context: Record<string, any>): string {
  const parts: string[] = [];

  // Project basics
  if (context.project?.name) {
    parts.push(`**Project Name:** ${context.project.name}`);
  }

  if (context.project?.transformation_statement) {
    parts.push(`**Main Transformation Statement:** ${context.project.transformation_statement}`);
  }

  // Funnel / Audience data (from Planning & Messaging phases)
  if (context.funnel) {
    const f = context.funnel;
    
    if (f.niche) {
      parts.push(`**Niche:** ${f.niche}`);
    }
    if (f.target_audience) {
      parts.push(`**Target Audience:** ${f.target_audience}`);
    }
    if (f.primary_pain_point) {
      parts.push(`**Primary Pain Point:** ${f.primary_pain_point}`);
    }
    if (f.desired_outcome) {
      parts.push(`**Desired Outcome/Dream Result:** ${f.desired_outcome}`);
    }
    if (f.problem_statement) {
      parts.push(`**Problem Statement:** ${f.problem_statement}`);
    }
    
    // Pain symptoms from messaging phase
    if (f.pain_symptoms && Array.isArray(f.pain_symptoms) && f.pain_symptoms.length > 0) {
      parts.push(`**Pain Symptoms (what audience experiences):**\n${f.pain_symptoms.map((s: any) => `- ${s.symptom || s}`).join('\n')}`);
    }
    
    // Sub-audiences from messaging phase
    if (f.sub_audiences && Array.isArray(f.sub_audiences) && f.sub_audiences.length > 0) {
      parts.push(`**Sub-Audiences:**\n${f.sub_audiences.map((s: any) => `- ${s.name || s.title || s}`).join('\n')}`);
    }
    
    // Likelihood elements (what makes transformation believable)
    if (f.likelihood_elements && Array.isArray(f.likelihood_elements) && f.likelihood_elements.length > 0) {
      parts.push(`**What Makes Success Likely:**\n${f.likelihood_elements.map((e: any) => `- ${e.element || e}`).join('\n')}`);
    }
    
    // Time/effort elements
    if (f.time_effort_elements && Array.isArray(f.time_effort_elements) && f.time_effort_elements.length > 0) {
      parts.push(`**Time/Effort Messaging:**\n${f.time_effort_elements.map((e: any) => `- ${e.element || e}`).join('\n')}`);
    }
    
    if (f.main_objections) {
      parts.push(`**Main Objections to Address:** ${f.main_objections}`);
    }
  }

  // Offers (core and additional)
  const offers = context.offers || [];
  if (offers.length > 0) {
    const coreOffer = offers.find((o: any) => o.slot_type === 'core');
    
    if (coreOffer) {
      parts.push(`\n**CORE OFFER:**`);
      if (coreOffer.title) parts.push(`- Title: ${coreOffer.title}`);
      if (coreOffer.description) parts.push(`- Description: ${coreOffer.description}`);
      if (coreOffer.transformation_statement) parts.push(`- Transformation: ${coreOffer.transformation_statement}`);
      if (coreOffer.price) parts.push(`- Price: $${coreOffer.price}`);
      if (coreOffer.main_deliverables && coreOffer.main_deliverables.length > 0) {
        parts.push(`- Main Deliverables: ${coreOffer.main_deliverables.join(', ')}`);
      }
    }
  }

  // Completed task inputs (captures user's specific answers from planning/messaging)
  const relevantTasks = context.completedTasks?.filter((t: any) => 
    t.input_data && Object.keys(t.input_data).length > 0
  ) || [];
  
  if (relevantTasks.length > 0) {
    const taskContext: string[] = [];
    
    relevantTasks.forEach((t: any) => {
      const inputs = t.input_data || {};
      Object.entries(inputs).forEach(([key, value]) => {
        if (value && String(value).trim().length > 0) {
          // Clean up key name for readability
          const cleanKey = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
          taskContext.push(`- ${cleanKey}: ${String(value).slice(0, 300)}`);
        }
      });
    });
    
    if (taskContext.length > 0) {
      parts.push(`\n**User's Custom Inputs from Completed Tasks:**\n${taskContext.slice(0, 15).join('\n')}`);
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

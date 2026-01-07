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

// Category-specific drafting rules (matching generate-content-draft)
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

// Fetch comprehensive project context from planning & messaging phases
async function fetchProjectContext(supabase: any, projectId: string) {
  console.log("Fetching comprehensive project context for:", projectId);
  
  const [funnelResult, offersResult, projectResult, tasksResult] = await Promise.all([
    supabase.from("funnels").select("*").eq("project_id", projectId).maybeSingle(),
    supabase.from("offers").select("*").eq("project_id", projectId),
    supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
    supabase.from("project_tasks").select("*").eq("project_id", projectId).eq("status", "completed").not("input_data", "is", null),
  ]);

  return {
    funnel: funnelResult.data,
    offers: offersResult.data || [],
    project: projectResult.data,
    completedTasks: tasksResult.data || [],
  };
}

// Build comprehensive context string from project data (matching generate-content-draft approach)
function buildContextString(context: Record<string, any>): string {
  const parts: string[] = [];

  // Project info
  if (context.project?.name) {
    parts.push(`PROJECT NAME: ${context.project.name}`);
  }
  if (context.project?.transformation_statement) {
    parts.push(`MAIN TRANSFORMATION STATEMENT: ${context.project.transformation_statement}`);
  }

  // Funnel / Audience data (from Planning & Messaging phases)
  if (context.funnel) {
    const f = context.funnel;
    
    if (f.niche) {
      parts.push(`NICHE: ${f.niche}`);
    }
    if (f.target_audience) {
      parts.push(`TARGET AUDIENCE: ${f.target_audience}`);
    }
    if (f.primary_pain_point) {
      parts.push(`PRIMARY PAIN POINT: ${f.primary_pain_point}`);
    }
    if (f.desired_outcome) {
      parts.push(`DESIRED OUTCOME (DREAM RESULT): ${f.desired_outcome}`);
    }
    if (f.problem_statement) {
      parts.push(`PROBLEM STATEMENT: ${f.problem_statement}`);
    }
    
    // Pain symptoms from messaging phase
    if (f.pain_symptoms && Array.isArray(f.pain_symptoms) && f.pain_symptoms.length > 0) {
      const symptoms = f.pain_symptoms.map((s: any) => {
        if (typeof s === 'string') return s;
        return s.symptom || s.text || JSON.stringify(s);
      }).join("; ");
      parts.push(`PAIN SYMPTOMS (what audience experiences): ${symptoms}`);
    }
    
    // Sub-audiences from messaging phase
    if (f.sub_audiences && Array.isArray(f.sub_audiences) && f.sub_audiences.length > 0) {
      const subAudiences = f.sub_audiences.map((s: any) => s.name || s.title || s).join(", ");
      parts.push(`SUB-AUDIENCES: ${subAudiences}`);
    }
    
    // Likelihood elements (what makes transformation believable)
    if (f.likelihood_elements && Array.isArray(f.likelihood_elements) && f.likelihood_elements.length > 0) {
      const elements = f.likelihood_elements.map((e: any) => e.element || e).join("; ");
      parts.push(`WHAT MAKES SUCCESS LIKELY: ${elements}`);
    }
    
    // Time/effort elements
    if (f.time_effort_elements && Array.isArray(f.time_effort_elements) && f.time_effort_elements.length > 0) {
      const elements = f.time_effort_elements.map((e: any) => e.element || e).join("; ");
      parts.push(`TIME/EFFORT MESSAGING: ${elements}`);
    }
    
    if (f.main_objections) {
      parts.push(`MAIN OBJECTIONS TO ADDRESS: ${f.main_objections}`);
    }
  }

  // Offers (core and additional)
  const offers = context.offers || [];
  if (offers.length > 0) {
    const coreOffer = offers.find((o: any) => o.slot_type === 'core') || offers[0];
    
    if (coreOffer) {
      const offerParts: string[] = [];
      if (coreOffer.title) offerParts.push(`Name: ${coreOffer.title}`);
      if (coreOffer.description) offerParts.push(`Description: ${coreOffer.description}`);
      if (coreOffer.transformation_statement) offerParts.push(`Transformation: ${coreOffer.transformation_statement}`);
      if (coreOffer.offer_type) offerParts.push(`Type: ${coreOffer.offer_type}`);
      if (coreOffer.price) offerParts.push(`Price: $${coreOffer.price}`);
      if (coreOffer.main_deliverables && coreOffer.main_deliverables.length > 0) {
        offerParts.push(`Main Deliverables: ${coreOffer.main_deliverables.join(', ')}`);
      }
      if (coreOffer.target_audience) offerParts.push(`Target Audience: ${coreOffer.target_audience}`);
      if (coreOffer.primary_pain_point) offerParts.push(`Pain Point: ${coreOffer.primary_pain_point}`);
      if (coreOffer.desired_outcome) offerParts.push(`Desired Outcome: ${coreOffer.desired_outcome}`);
      
      if (offerParts.length > 0) {
        parts.push(`CORE OFFER:\n${offerParts.join('\n')}`);
      }
    }
  }

  // Completed task inputs (captures user's specific answers from planning/messaging)
  const relevantTasks = context.completedTasks?.filter((t: any) => {
    if (!t.input_data || Object.keys(t.input_data).length === 0) return false;
    // Focus on planning and messaging phase tasks
    return t.task_id?.startsWith("planning_") || t.task_id?.startsWith("messaging_");
  }) || [];
  
  if (relevantTasks.length > 0) {
    const insights: string[] = [];
    
    relevantTasks.forEach((t: any) => {
      const data = t.input_data || {};
      const taskId = t.task_id || '';
      
      // ========== PLANNING PHASE TASKS ==========
      if (taskId === 'planning_define_audience') {
        if (data.audience_description) {
          insights.push(`TARGET AUDIENCE DEFINITION: ${data.audience_description}`);
        }
        if (data.niche_context) {
          insights.push(`NICHE CONTEXT: ${data.niche_context.replace(/_/g, ' ')}`);
        }
      }
      
      if (taskId === 'planning_define_problem') {
        if (data.primary_problem) {
          insights.push(`PRIMARY PROBLEM: ${data.primary_problem}`);
        }
        if (data.problem_details) {
          insights.push(`PROBLEM DETAILS: ${data.problem_details}`);
        }
      }
      
      if (taskId === 'planning_define_dream_outcome') {
        if (data.dream_outcome) {
          insights.push(`DREAM OUTCOME: ${data.dream_outcome}`);
        }
        if (data.outcome_details) {
          insights.push(`OUTCOME DETAILS: ${data.outcome_details}`);
        }
      }
      
      if (taskId === 'planning_time_effort_perception') {
        if (data.quick_wins) insights.push(`EARLY WINS THEY'LL EXPERIENCE: ${data.quick_wins}`);
        if (data.friction_reducers) insights.push(`HOW YOU SIMPLIFY THE PROCESS: ${data.friction_reducers}`);
        if (data.effort_reframe) insights.push(`EFFORT PERCEPTION REFRAME: ${data.effort_reframe}`);
        if (data.time_to_results) insights.push(`TIME TO RESULTS: ${data.time_to_results}`);
      }
      
      if (taskId === 'planning_perceived_likelihood') {
        if (data.past_attempts) insights.push(`WHAT THEY'VE TRIED BEFORE: ${data.past_attempts}`);
        if (data.belief_blockers) insights.push(`SKEPTICISM/DOUBT POINTS: ${data.belief_blockers}`);
        if (data.belief_builders) insights.push(`TRUST BUILDERS (why it works for them): ${data.belief_builders}`);
        if (data.credibility_points) insights.push(`CREDIBILITY ELEMENTS: ${data.credibility_points}`);
      }
      
      // ========== MESSAGING PHASE TASKS ==========
      if (taskId === 'messaging_core_message') {
        if (data.core_message) {
          insights.push(`CORE MESSAGE: ${data.core_message}`);
        }
        if (data.belief_statement) {
          insights.push(`CORE BELIEF: ${data.belief_statement}`);
        }
        if (data.why_statement) {
          insights.push(`WHY STATEMENT: ${data.why_statement}`);
        }
      }
      
      if (taskId === 'messaging_transformation_statement') {
        if (data.transformation_statement) {
          insights.push(`TRANSFORMATION STATEMENT: ${data.transformation_statement}`);
        }
      }
      
      if (taskId === 'messaging_talking_points') {
        const talkingPoints = [
          data.talking_point_1,
          data.talking_point_2,
          data.talking_point_3,
          data.talking_point_4,
          data.talking_point_5,
        ].filter(Boolean);
        
        if (talkingPoints.length > 0) {
          insights.push(`KEY TALKING POINTS (themes to repeat in content):\n${talkingPoints.map((tp, i) => `  ${i + 1}. ${tp}`).join('\n')}`);
        }
      }
      
      if (taskId === 'messaging_common_objections') {
        const objections = [
          data.objection_1,
          data.objection_2,
          data.objection_3,
          data.objection_4,
          data.objection_5,
        ].filter(Boolean);
        
        if (objections.length > 0) {
          insights.push(`COMMON OBJECTIONS TO ADDRESS:\n${objections.map((obj, i) => `  ${i + 1}. ${obj}`).join('\n')}`);
        }
      }
      
      // Generic fallback for any other fields
      if (!['planning_define_audience', 'planning_define_problem', 'planning_define_dream_outcome', 
           'planning_time_effort_perception', 'planning_perceived_likelihood', 'messaging_core_message',
           'messaging_transformation_statement', 'messaging_talking_points', 'messaging_common_objections'].includes(taskId)) {
        if (data.unique_approach) insights.push(`UNIQUE APPROACH: ${data.unique_approach}`);
        if (data.key_message) insights.push(`KEY MESSAGE: ${data.key_message}`);
      }
    });
    
    if (insights.length > 0) {
      parts.push(`=== COMPLETED PLANNING & MESSAGING WORK ===\n${insights.join('\n\n')}`);
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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user ID from auth header
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Fetch project context
    const context = await fetchProjectContext(supabase, projectId);
    const contextString = buildContextString(context);

    console.log("Context built, length:", contextString.length);

    // Get category-specific drafting config
    const categoryConfig = CATEGORY_DRAFTING[template.content_type] || CATEGORY_DRAFTING.general;

    // Build the prompt based on template type
    const templateTypePrompts: Record<string, string> = {
      'high-value': 'Create valuable, educational content that showcases expertise and provides immediate value to the audience.',
      'story': 'Share a relatable personal story or behind-the-scenes moment that builds connection and trust.',
      'testimonial': 'Highlight a success story, transformation, or social proof that resonates with the audience.',
      'live': 'Announce or promote a live session, Q&A, or training that provides value.',
      'engagement': 'Create an engaging question, poll, or conversation starter that invites participation.',
      'buzz': 'Build excitement and anticipation around the offer without being pushy.',
      'offer-summary': 'Recap the day and remind about the offer in a helpful, non-salesy way.',
      'faq': 'Address common questions or objections in a clarifying, reassuring manner.',
      'behind-scenes': 'Show the human side with behind-the-scenes content that feels authentic.',
      'fomo': 'Create interest and desire naturally, without pressure tactics.',
      'final-call': 'Final countdown messaging that feels supportive rather than pushy.',
    };

    const typeGuidance = templateTypePrompts[template.template_type] || 'Create engaging social media content.';

    const systemPrompt = `You are an expert social media content strategist helping course creators and coaches launch their offers successfully.

Your job is to generate a compelling, personalized content idea with a detailed description based on the creator's specific context from their completed planning and messaging work.

CRITICAL: You MUST incorporate specific details from the creator's completed planning and messaging work:
- Reference their exact audience description and pain points in your own words
- Use their transformation statement language and tone as a guide
- Incorporate their talking points as content angles when relevant
- Naturally address objections they've identified
- Build on their core message and beliefs
- The content should feel like it was written BY the creator, using THEIR language and insights

CRITICAL RULES (APPLY TO ALL CONTENT):
- Never use urgency language (no "limited time", "act now", "don't miss")
- Never add hashtags or suggest hashtags
- Never suggest calls-to-action like "comment below" or "link in bio"
- Keep the tone warm, conversational, and genuine
- Write as if talking to a friend, not selling to a customer
- Avoid corporate or marketing speak
- No emojis
- Make it feel personal and authentic, not generic

CATEGORY INTENT: ${categoryConfig.intent}

CATEGORY-SPECIFIC RULES:
${categoryConfig.rules}

The content should feel ${categoryConfig.tone}.

TEMPLATE TYPE: ${template.template_type}
TEMPLATE INTENT: ${typeGuidance}

CONTENT TYPE: ${template.content_type}
PHASE: ${template.phase.replace(/-/g, ' ').replace(/week/i, 'Week')}
DAY: ${template.day_number}
TIME: ${template.time_of_day}

ORIGINAL TEMPLATE GUIDANCE (use as inspiration, not literally):
Title Template: ${template.title_template}
Description Template: ${template.description_template}`;

    const userPrompt = `Based on this creator's context, generate a personalized content idea for this timeline slot.

=== CREATOR'S FULL BUSINESS CONTEXT ===
${contextString || "No specific project context available - create something generic but compelling for a course/coaching launch."}

=== HOW TO USE THIS CONTEXT ===
- Their CORE MESSAGE and TRANSFORMATION STATEMENT should inform the angle and language
- Their TALKING POINTS are themes they want to repeat in content - use these as content pillars
- Their OBJECTIONS list shows concerns to naturally address through storytelling
- Their AUDIENCE DEFINITION shows exactly who they're speaking to - use specific language
- Their PAIN POINTS and DREAM OUTCOMES give you emotional hooks
- Their BELIEF BUILDERS and SKEPTICISM POINTS show what to emphasize or overcome

=== YOUR TASK ===
Generate a personalized ${template.template_type} content idea for ${template.phase.replace(/-/g, ' ')} Day ${template.day_number}.

Create:
1. A catchy, specific TITLE (5-12 words) that references their niche, audience, or transformation
2. A detailed DESCRIPTION (2-3 sentences, 40-80 words) that:
   - Uses THEIR specific language and terminology from the context above
   - References specific elements (pain points, outcomes, objections, talking points)
   - Feels like a natural extension of their existing messaging work
   - Matches the ${categoryConfig.tone} tone

The description should be substantive and helpful - incorporate their unique business context so it sounds like THEIR voice, not generic advice.`;

    // Use tool calling for structured output
    const requestBody = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 500,
      tools: [
        {
          type: "function",
          function: {
            name: "create_suggestion",
            description: "Create a personalized title and detailed description for a timeline content slot",
            parameters: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "A catchy, personalized title (5-12 words) that references the creator's niche or audience"
                },
                description: {
                  type: "string",
                  description: "A detailed content direction (2-3 sentences, 40-80 words) that incorporates their business context and provides clear guidance"
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

    // Log AI usage
    if (userId) {
      try {
        await supabase.from('ai_usage_logs').insert({
          user_id: userId,
          project_id: projectId || null,
          function_name: 'generate-timeline-suggestions',
          model: 'google/gemini-2.5-flash',
          tokens_used: aiData.usage?.total_tokens || null,
          success: true,
        });
      } catch (logError) {
        console.error('[GENERATE-TIMELINE-SUGGESTIONS] Failed to log AI usage:', logError);
      }
    }
    
    // Parse tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      console.log("Generated suggestion:", parsed.title, "| Description length:", parsed.description?.length);
      
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

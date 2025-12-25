import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskAssistRequest {
  mode: 'help_me_choose' | 'examples' | 'simplify';
  taskId: string;
  taskTitle: string;
  taskInstructions: string[];
  projectId: string;
}

interface ProjectContext {
  audienceDescription?: string;
  primaryProblem?: string;
  dreamOutcome?: string;
  offerName?: string;
  funnelType?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { mode, taskId, taskTitle, taskInstructions, projectId } = await req.json() as TaskAssistRequest;

    console.log('[TASK-AI-ASSIST] Request received:', { mode, taskId, projectId });

    // Create Supabase client to fetch project context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch project context
    let projectContext: ProjectContext = {};
    
    // Get project data
    const { data: project } = await supabase
      .from('projects')
      .select('name, transformation_statement, selected_funnel_type')
      .eq('id', projectId)
      .single();

    // Get funnel/audience data
    const { data: funnel } = await supabase
      .from('funnels')
      .select('target_audience, primary_pain_point, desired_outcome, niche, funnel_type')
      .eq('project_id', projectId)
      .maybeSingle();

    // Get offers data
    const { data: offers } = await supabase
      .from('offers')
      .select('title, offer_type, target_audience')
      .eq('project_id', projectId)
      .limit(1);

    // Get completed task data for context
    const { data: completedTasks } = await supabase
      .from('project_tasks')
      .select('task_id, input_data')
      .eq('project_id', projectId)
      .eq('status', 'completed');

    // Build context from completed tasks
    if (completedTasks) {
      for (const task of completedTasks) {
        const data = task.input_data as Record<string, string> | null;
        if (!data) continue;
        
        if (task.task_id === 'planning_define_audience' && data.audience_description) {
          projectContext.audienceDescription = data.audience_description;
        }
        if (task.task_id === 'planning_define_problem' && data.primary_problem) {
          projectContext.primaryProblem = data.primary_problem;
        }
        if (task.task_id === 'planning_define_dream_outcome' && data.dream_outcome) {
          projectContext.dreamOutcome = data.dream_outcome;
        }
        if (task.task_id === 'planning_offer_snapshot' && data.offer_name) {
          projectContext.offerName = data.offer_name;
        }
      }
    }

    // Add funnel context
    if (funnel) {
      projectContext.audienceDescription = projectContext.audienceDescription || funnel.target_audience || undefined;
      projectContext.primaryProblem = projectContext.primaryProblem || funnel.primary_pain_point || undefined;
      projectContext.dreamOutcome = projectContext.dreamOutcome || funnel.desired_outcome || undefined;
      projectContext.funnelType = funnel.funnel_type || undefined;
    }

    if (project?.selected_funnel_type) {
      projectContext.funnelType = project.selected_funnel_type;
    }

    if (offers && offers.length > 0 && offers[0].title) {
      projectContext.offerName = projectContext.offerName || offers[0].title;
    }

    console.log('[TASK-AI-ASSIST] Project context built:', projectContext);

    // Build the system prompt based on mode
    const systemPrompts: Record<string, string> = {
      help_me_choose: `You are a friendly, calm assistant helping a beginner digital marketer complete a task in their launch planning journey. They need help making a decision.

Your role:
- Give a clear, specific recommendation based on their project context
- Explain your reasoning in 2-3 sentences
- Keep it simple and actionable
- Avoid jargon or marketing-speak
- Be reassuring and supportive

Project context:
${projectContext.audienceDescription ? `- Target audience: ${projectContext.audienceDescription}` : ''}
${projectContext.primaryProblem ? `- Main problem they solve: ${projectContext.primaryProblem}` : ''}
${projectContext.dreamOutcome ? `- Dream outcome: ${projectContext.dreamOutcome}` : ''}
${projectContext.offerName ? `- Offer name: ${projectContext.offerName}` : ''}
${projectContext.funnelType ? `- Launch path: ${projectContext.funnelType}` : ''}`,

      examples: `You are a friendly assistant helping a beginner digital marketer understand a concept through real-world examples.

Your role:
- Provide 2-3 concrete, relatable examples in different styles
- Use realistic scenarios similar to their project
- Keep each example brief (2-3 sentences)
- Make examples feel achievable, not intimidating
- Use their industry/niche if known

IMPORTANT: You MUST respond with valid JSON in this exact format:
\`\`\`json
{
  "intro": "Brief 1-sentence intro (optional)",
  "examples": [
    {
      "type": "Results-Focused",
      "content": "Example focusing on tangible outcomes and metrics..."
    },
    {
      "type": "Emotion-Focused", 
      "content": "Example focusing on feelings and emotional benefits..."
    },
    {
      "type": "Identity-Focused",
      "content": "Example focusing on who they become..."
    }
  ],
  "conclusion": "Brief encouraging closing thought (optional)"
}
\`\`\`

Use these example types when appropriate:
- "Results-Focused" - tangible outcomes, numbers, metrics
- "Emotion-Focused" - feelings, relief, joy, confidence
- "Identity-Focused" - transformation of who they are/become

For other task types, use descriptive type names like "Simple Approach", "Creative Approach", "Direct Approach", etc.

Project context:
${projectContext.audienceDescription ? `- Target audience: ${projectContext.audienceDescription}` : ''}
${projectContext.primaryProblem ? `- Main problem they solve: ${projectContext.primaryProblem}` : ''}
${projectContext.dreamOutcome ? `- Dream outcome: ${projectContext.dreamOutcome}` : ''}
${projectContext.offerName ? `- Offer name: ${projectContext.offerName}` : ''}
${projectContext.funnelType ? `- Launch path: ${projectContext.funnelType}` : ''}`,

      simplify: `You are a friendly assistant helping a beginner digital marketer who feels overwhelmed. Your job is to simplify and clarify.

Your role:
- Break down the task into the simplest possible terms
- Use analogies or metaphors if helpful
- Focus on the one most important thing to do
- Remove any complexity or overthinking
- Be warm and reassuring

Project context:
${projectContext.audienceDescription ? `- Target audience: ${projectContext.audienceDescription}` : ''}
${projectContext.primaryProblem ? `- Main problem they solve: ${projectContext.primaryProblem}` : ''}
${projectContext.dreamOutcome ? `- Dream outcome: ${projectContext.dreamOutcome}` : ''}
${projectContext.offerName ? `- Offer name: ${projectContext.offerName}` : ''}
${projectContext.funnelType ? `- Launch path: ${projectContext.funnelType}` : ''}`,
    };

    const userPrompts: Record<string, string> = {
      help_me_choose: `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

I'm not sure what to choose or how to approach this. Can you help me decide based on my situation?`,

      examples: `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

Can you show me some real examples of how others have done this? I learn better by seeing examples.`,

      simplify: `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

This feels overwhelming. Can you break this down into simpler terms? What's the one thing I should focus on?`,
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompts[mode] },
          { role: 'user', content: userPrompts[mode] },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TASK-AI-ASSIST] AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('[TASK-AI-ASSIST] Response generated successfully');

    return new Response(
      JSON.stringify({ response: content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[TASK-AI-ASSIST] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

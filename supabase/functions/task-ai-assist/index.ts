import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskAssistRequest {
  mode: 'help_me_choose' | 'examples' | 'simplify' | 'results_focused' | 'emotion_focused' | 'identity_focused' | 'reassurance';
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
    const baseContext = `Project context:
${projectContext.audienceDescription ? `- Target audience: ${projectContext.audienceDescription}` : ''}
${projectContext.primaryProblem ? `- Main problem they solve: ${projectContext.primaryProblem}` : ''}
${projectContext.dreamOutcome ? `- Dream outcome: ${projectContext.dreamOutcome}` : ''}
${projectContext.offerName ? `- Offer name: ${projectContext.offerName}` : ''}
${projectContext.funnelType ? `- Launch path: ${projectContext.funnelType}` : ''}`;

    const systemPrompts: Record<string, string> = {
      help_me_choose: `You are a friendly, calm assistant helping a beginner digital marketer complete a task in their launch planning journey. They need help making a decision.

Your role:
- Give a clear, specific recommendation based on their project context
- Explain your reasoning
- Keep it simple and actionable
- Avoid jargon or marketing-speak
- Be reassuring and supportive

IMPORTANT: You MUST respond with valid JSON in this exact format:
\`\`\`json
{
  "intro": "Brief context-setting sentence",
  "recommendation": {
    "title": "My Recommendation",
    "content": "Clear statement of what I recommend and why (2-3 sentences)"
  },
  "reasoning": [
    {
      "type": "Why This Works",
      "content": "Explanation of why this choice fits their situation..."
    },
    {
      "type": "What to Consider",
      "content": "Any important considerations or alternatives..."
    }
  ],
  "conclusion": "Encouraging closing thought"
}
\`\`\`

${baseContext}`,

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

${baseContext}`,

      simplify: `You are a friendly assistant helping a beginner digital marketer who feels overwhelmed. Your job is to simplify and clarify.

Your role:
- Break down the task into the simplest possible terms
- Use analogies or metaphors if helpful
- Focus on the one most important thing to do
- Remove any complexity or overthinking
- Be warm and reassuring

IMPORTANT: You MUST respond with valid JSON in this exact format:
\`\`\`json
{
  "intro": "Reassuring opening sentence acknowledging this can feel complex",
  "mainPoint": {
    "title": "The One Thing to Focus On",
    "content": "The single most important thing they need to do, explained simply (2-3 sentences)"
  },
  "steps": [
    {
      "type": "Give It a Name",
      "content": "First simple action to take..."
    },
    {
      "type": "Picture Their Day",
      "content": "Next simple action..."
    }
  ],
  "conclusion": "Encouraging reminder that they've got this"
}
\`\`\`

CRITICAL: Step "type" values must be SHORT descriptive action phrases (2-4 words) like "Name Your Customer", "List Their Struggles", "Write It Down" - NOT "Step 1", "Step 2", etc.

Keep steps to 2-3 maximum. Use everyday language and analogies where helpful.

${baseContext}`,

      results_focused: `You are a friendly assistant helping a beginner digital marketer craft messaging that focuses on tangible, measurable results.

Your role:
- Generate examples that emphasize outcomes, numbers, and concrete achievements
- Use specific metrics and timeframes where appropriate
- Keep it relatable and believable (not over-the-top claims)
- Make the results feel achievable

IMPORTANT: You MUST respond with valid JSON in this exact format:
\`\`\`json
{
  "intro": "Brief intro about results-focused messaging",
  "examples": [
    {
      "type": "Specific Outcome",
      "content": "Example with concrete numbers or achievements..."
    },
    {
      "type": "Before & After",
      "content": "Example showing the transformation with measurable change..."
    },
    {
      "type": "Timeline-Based",
      "content": "Example with a specific timeframe for results..."
    }
  ],
  "conclusion": "Encouraging note about using results in messaging"
}
\`\`\`

${baseContext}`,

      emotion_focused: `You are a friendly assistant helping a beginner digital marketer craft messaging that focuses on emotions and feelings.

Your role:
- Generate examples that emphasize how people will FEEL after the transformation
- Use emotional language: relief, confidence, joy, peace, freedom, pride
- Focus on the emotional journey, not just the destination
- Make it resonate on a personal level

IMPORTANT: You MUST respond with valid JSON in this exact format:
\`\`\`json
{
  "intro": "Brief intro about emotion-focused messaging",
  "examples": [
    {
      "type": "Relief & Freedom",
      "content": "Example focusing on what burden is lifted..."
    },
    {
      "type": "Confidence & Pride",
      "content": "Example focusing on newfound self-assurance..."
    },
    {
      "type": "Joy & Fulfillment",
      "content": "Example focusing on happiness and satisfaction..."
    }
  ],
  "conclusion": "Encouraging note about connecting emotionally"
}
\`\`\`

${baseContext}`,

      identity_focused: `You are a friendly assistant helping a beginner digital marketer craft messaging that focuses on identity transformation.

Your role:
- Generate examples that emphasize WHO the person becomes
- Focus on identity shifts: "from X to Y" type transformations
- Use language about becoming, evolving, stepping into a new version of themselves
- Make the identity shift feel aspirational but achievable

IMPORTANT: You MUST respond with valid JSON in this exact format:
\`\`\`json
{
  "intro": "Brief intro about identity-focused messaging",
  "examples": [
    {
      "type": "The New Identity",
      "content": "Example describing who they become..."
    },
    {
      "type": "Leaving Behind",
      "content": "Example of what old identity they shed..."
    },
    {
      "type": "Stepping Into",
      "content": "Example of the role or version they embody..."
    }
  ],
  "conclusion": "Encouraging note about identity transformation"
}
\`\`\`

${baseContext}`,

      reassurance: `You are a warm, supportive assistant helping a beginner digital marketer who may be feeling uncertain or stuck.

Your role:
- Provide gentle encouragement and normalize their feelings
- Remind them that perfection isn't required
- Give them permission to move forward imperfectly
- Share a simple, actionable next step

IMPORTANT: You MUST respond with valid JSON in this exact format:
\`\`\`json
{
  "intro": "Warm acknowledgment of how they might be feeling",
  "mainPoint": {
    "title": "What You Need to Know",
    "content": "Reassuring message that addresses common fears or doubts (2-3 sentences)"
  },
  "encouragement": [
    {
      "type": "It's Normal",
      "content": "Normalize their experience..."
    },
    {
      "type": "Progress Over Perfection",
      "content": "Reminder that done is better than perfect..."
    }
  ],
  "conclusion": "Simple next step they can take right now"
}
\`\`\`

${baseContext}`,
    };

    const userPrompts: Record<string, string> = {
      help_me_choose: `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions?.map((i, idx) => `${idx + 1}. ${i}`).join('\n') || 'No specific instructions provided.'}

I'm not sure what to choose or how to approach this. Can you help me decide based on my situation?`,

      examples: `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions?.map((i, idx) => `${idx + 1}. ${i}`).join('\n') || 'No specific instructions provided.'}

Can you show me some real examples of how others have done this? I learn better by seeing examples.`,

      simplify: `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions?.map((i, idx) => `${idx + 1}. ${i}`).join('\n') || 'No specific instructions provided.'}

This feels overwhelming. Can you break this down into simpler terms? What's the one thing I should focus on?`,

      results_focused: `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions?.map((i, idx) => `${idx + 1}. ${i}`).join('\n') || 'No specific instructions provided.'}

Can you help me create messaging that focuses on specific, tangible RESULTS my audience will achieve?`,

      emotion_focused: `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions?.map((i, idx) => `${idx + 1}. ${i}`).join('\n') || 'No specific instructions provided.'}

Can you help me create messaging that focuses on the EMOTIONS and FEELINGS my audience will experience?`,

      identity_focused: `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions?.map((i, idx) => `${idx + 1}. ${i}`).join('\n') || 'No specific instructions provided.'}

Can you help me create messaging that focuses on WHO my audience will BECOME after their transformation?`,

      reassurance: `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions?.map((i, idx) => `${idx + 1}. ${i}`).join('\n') || 'No specific instructions provided.'}

I'm feeling stuck or uncertain about this. Can you help reassure me and give me a simple next step?`,
    };

    // Validate that we have prompts for the requested mode
    if (!systemPrompts[mode] || !userPrompts[mode]) {
      console.error('[TASK-AI-ASSIST] Unknown mode:', mode);
      throw new Error(`Unknown assist mode: ${mode}`);
    }

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

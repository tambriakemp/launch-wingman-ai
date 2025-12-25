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
  toneModifiers?: string;
  currentInput?: string; // The current value of the primary input field
  nicheContext?: string; // Optional niche context (e.g., 'business_entrepreneurship', 'health_wellness')
}

// Map niche values to human-readable labels
const NICHE_LABELS: Record<string, string> = {
  'business_entrepreneurship': 'Business / Entrepreneurship',
  'money_finance': 'Money / Finance',
  'career': 'Career',
  'health_wellness': 'Health / Wellness',
  'personal_growth': 'Personal Growth',
  'relationships': 'Relationships',
  'creative_content': 'Creative / Content',
  'other': 'Other / Not sure yet',
};

interface ProjectContext {
  audienceDescription?: string;
  primaryProblem?: string;
  dreamOutcome?: string;
  offerName?: string;
  funnelType?: string;
}

type InputState = 'EMPTY' | 'PARTIAL' | 'CLEAR';

// Detect input state based on content
function detectInputState(input: string | undefined): InputState {
  if (!input || input.trim() === '' || input.trim().length < 5) {
    return 'EMPTY';
  }
  
  const trimmed = input.trim();
  const wordCount = trimmed.split(/\s+/).length;
  
  // Check for vague/generic inputs
  const vaguePatterns = [
    /^(busy )?professionals?$/i,
    /^people who want/i,
    /^online (beginners?|people)$/i,
    /^anyone who/i,
    /^everyone/i,
    /^people$/i,
    /^customers?$/i,
    /^my audience$/i,
    /^my clients?$/i,
    /^entrepreneurs?$/i,
    /^business owners?$/i,
    /^coaches?$/i,
    /^consultants?$/i,
    /^small businesses?$/i,
    /^startups?$/i,
  ];
  
  const isVague = vaguePatterns.some(pattern => pattern.test(trimmed));
  
  // PARTIAL: short, vague, or generic inputs (under 15 words and vague)
  if (wordCount < 10 || isVague) {
    return 'PARTIAL';
  }
  
  // CLEAR: has specific elements (situation/stage, problem, desire)
  const hasSpecificGroup = /\b(who|that|with|after|before|during|struggling|wanting|trying|seeking|looking)\b/i.test(trimmed);
  const hasSituation = /\b(after|before|during|when|while|just|recently|currently|now)\b/i.test(trimmed);
  const hasProblem = /\b(struggle|problem|challenge|frustrated|overwhelmed|stuck|confused|worried|stressed|burned out|burnout)\b/i.test(trimmed);
  const hasDesire = /\b(want|need|desire|wish|hope|dream|goal|looking for|seeking|trying to)\b/i.test(trimmed);
  
  const specificityScore = [hasSpecificGroup, hasSituation, hasProblem, hasDesire].filter(Boolean).length;
  
  if (wordCount >= 10 && specificityScore >= 2) {
    return 'CLEAR';
  }
  
  return 'PARTIAL';
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

    const { mode, taskId, taskTitle, taskInstructions, projectId, toneModifiers, currentInput, nicheContext } = await req.json() as TaskAssistRequest;

    // Get human-readable niche label
    const nicheLabel = nicheContext ? NICHE_LABELS[nicheContext] || nicheContext : undefined;

    console.log('[TASK-AI-ASSIST] Request received:', { mode, taskId, projectId, hasToneModifiers: !!toneModifiers, hasCurrentInput: !!currentInput, nicheContext, nicheLabel });

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

    // Build tone guidance from user's learned preferences
    const toneGuidance = toneModifiers 
      ? `\n\nIMPORTANT - Writing Style Preferences:\n${toneModifiers}`
      : '';

    // Detect input state for help_me_choose mode
    const inputState = detectInputState(currentInput);
    console.log('[TASK-AI-ASSIST] Input state detected:', inputState, 'for input:', currentInput?.substring(0, 50));

    // Build the system prompt based on mode
    // Include niche context for help_me_choose and examples modes only (never for simplify)
    const nicheContextStr = nicheLabel && mode !== 'simplify' 
      ? `\n- General niche context: ${nicheLabel} (use this to loosely tailor examples and language - do NOT treat this as the "real" audience)` 
      : '';
    
    const baseContext = `Project context:
${projectContext.audienceDescription ? `- Target audience: ${projectContext.audienceDescription}` : ''}
${projectContext.primaryProblem ? `- Main problem they solve: ${projectContext.primaryProblem}` : ''}
${projectContext.dreamOutcome ? `- Dream outcome: ${projectContext.dreamOutcome}` : ''}
${projectContext.offerName ? `- Offer name: ${projectContext.offerName}` : ''}
${projectContext.funnelType ? `- Launch path: ${projectContext.funnelType}` : ''}${nicheContextStr}${toneGuidance}`;

    // Help Me Choose prompts based on input state
    const helpMeChoosePrompts: Record<InputState, string> = {
      EMPTY: `You are a calm, supportive assistant helping a beginner find a starting point. You are NOT a recommendation engine.

CRITICAL RULES:
- Do NOT give confident recommendations
- Do NOT use words like "best", "ideal", "perfect", "high-converting"
- Do NOT assume you know what they should choose
- Your job is to help them THINK, not decide for them
- Keep tone calm, supportive, and non-authoritative

REQUIRED OUTPUT FORMAT - You MUST respond with valid JSON:
\`\`\`json
{
  "mode": "prompting",
  "opening": "Let's find a starting point. You don't need the perfect answer yet.",
  "clarifyingQuestions": [
    "Who do you most enjoy helping right now?",
    "What problem do people already come to you about?"
  ],
  "exampleDirections": [
    {
      "label": "Example A",
      "content": "Busy professionals feeling overwhelmed by money decisions"
    },
    {
      "label": "Example B", 
      "content": "Beginners trying to make their first online income"
    },
    {
      "label": "Example C",
      "content": "Women rebuilding confidence after burnout"
    }
  ],
  "closing": "Choose one to edit, or answer one question above — either is enough to move forward."
}
\`\`\`

Tailor the clarifying questions and examples to the specific task at hand. Use language that matches the task context.

${baseContext}`,

      PARTIAL: `You are a calm, supportive assistant helping a beginner refine their thinking. You are NOT a recommendation engine.

CRITICAL RULES:
- Reflect the user's EXACT wording back to them
- Help them narrow and sharpen what they already wrote
- Do NOT replace their words with jargon
- Do NOT give definitive recommendations
- Keep tone calm and supportive
- Avoid words like "best", "ideal", "perfect"

The user has provided this input: "${currentInput}"

REQUIRED OUTPUT FORMAT - You MUST respond with valid JSON:
\`\`\`json
{
  "mode": "refinement",
  "reflection": "You mentioned: \\"${currentInput?.replace(/"/g, '\\"')}\\"",
  "guidance": "That's a good starting point. Let's make it a little more specific so your messaging is clearer.",
  "refinementOptions": [
    "Their current situation or stage",
    "The main problem they're struggling with",
    "What they want but haven't figured out yet"
  ],
  "exampleRefinements": [
    {
      "label": "Option A",
      "content": "[More specific version focusing on situation]"
    },
    {
      "label": "Option B",
      "content": "[More specific version focusing on problem]"
    }
  ],
  "closing": "Which direction feels closer? You can tweak it in your own words."
}
\`\`\`

Generate refinement options that build on what they wrote - don't start from scratch.

${baseContext}`,

      CLEAR: `You are a calm, supportive assistant helping a beginner polish their thinking. You may now offer suggestions, but still with soft language.

RULES:
- Use soft language like "You could phrase it like…" not "You should"
- Explain WHY your suggestion works
- Always invite edits or rejection
- Preserve the user's ownership of the decision

The user has provided this clear input: "${currentInput}"

REQUIRED OUTPUT FORMAT - You MUST respond with valid JSON:
\`\`\`json
{
  "mode": "recommendation",
  "validation": "This is clear and specific — you're on the right track.",
  "suggestedRefinement": {
    "content": "[Your refined version that polishes their input]"
  },
  "whyThisWorks": [
    "It clearly defines who the offer is for",
    "It highlights their current situation",
    "It makes your messaging easier later"
  ],
  "closing": "You can use this as-is or adjust it so it sounds more like you."
}
\`\`\`

Make the refinement only slightly better than what they wrote - don't completely rewrite it.

${baseContext}`,
    };

    const systemPrompts: Record<string, string> = {
      help_me_choose: helpMeChoosePrompts[inputState],

      examples: `You are a neutral assistant showing examples to spark ideas — NOT to recommend or prescribe answers.

CRITICAL RULES - YOU MUST FOLLOW THESE:
✓ Show exactly 2-3 examples (never more, never fewer)
✓ Examples must be generic, fictional, and broadly representative
✓ Keep each example to ONE clear sentence
✓ Use neutral, calm tone
✓ Preserve user autonomy

✗ NEVER reference real brands or influencers
✗ NEVER mention performance, results, or metrics
✗ NEVER frame examples as "best", "ideal", or "recommended"
✗ NEVER rank or compare examples
✗ NEVER say "most people choose" or "this works best"
✗ NEVER ask questions or offer guidance
✗ NEVER rewrite user's text
${currentInput ? '✗ NEVER mirror the user\'s input too closely' : ''}

INPUT STATE: ${inputState}
${inputState === 'EMPTY' ? 'Goal: Help user understand what this field could look like.' : ''}
${inputState === 'PARTIAL' ? 'Goal: Show alternative shapes their answer could take. Do NOT reference their input directly.' : ''}
${inputState === 'CLEAR' ? 'Goal: Provide reassurance through contrast, not improvement. Do NOT validate or critique.' : ''}

REQUIRED CLOSING based on input state:
${inputState === 'EMPTY' ? '"These are just examples — you don\'t need to match them."' : ''}
${inputState === 'PARTIAL' ? '"You can use these as inspiration, or ignore them completely."' : ''}
${inputState === 'CLEAR' ? '"There\'s no single right way to answer this."' : ''}

IMPORTANT: You MUST respond with valid JSON in this exact format:
\`\`\`json
{
  "header": "Examples to help you think",
  "examples": [
    {
      "label": "Example",
      "content": "One clear sentence describing a fictional, generic example..."
    },
    {
      "label": "Example",
      "content": "Another clear sentence with a different approach..."
    }
  ],
  "closing": "{{Use the required closing text based on input state above}}"
}
\`\`\`

Task context: "${taskTitle}"
${baseContext}`,

      simplify: `You are a rewriting assistant. Your ONLY job is to make the user's text clearer and lighter WITHOUT changing meaning, strategy, or intent.

The user has written: "${currentInput}"

CRITICAL RULES - YOU MUST FOLLOW THESE:
✓ Reduce sentence length
✓ Remove redundancy
✓ Replace complex phrases with clearer ones
✓ Improve readability
✓ Preserve the user's voice and tone
✓ Keep meaning IDENTICAL

✗ NEVER add new ideas
✗ NEVER change strategy
✗ NEVER improve positioning
✗ NEVER make it more persuasive
✗ NEVER make it more "salesy"
✗ NEVER add urgency or hype
✗ NEVER introduce jargon
✗ NEVER correct the user conceptually

The output should sound like: "What the user meant — just cleaner."

TONE RULES:
- Calm, neutral, non-judgmental
- No praise ("this is great")
- No critique ("this was confusing")
- The user's original text is always treated as valid

IMPORTANT: You MUST respond with valid JSON in this exact format:
\`\`\`json
{
  "opening": "Here's a simpler version that keeps your meaning the same:",
  "simplifiedText": "{{The user's text, rewritten to be clearer and lighter while keeping the exact same meaning}}",
  "note": "This keeps your original intent, just makes it easier to read."
}
\`\`\`

DO NOT include explanations, coaching, suggestions, or alternatives.
The simplified text must preserve the user's exact meaning and voice.

${baseContext}`,
    };

    const userPrompts: Record<string, string> = {
      help_me_choose: inputState === 'EMPTY' 
        ? `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions?.map((i, idx) => `${idx + 1}. ${i}`).join('\n') || 'No specific instructions provided.'}

I haven't started yet and need help finding a starting point.`
        : inputState === 'PARTIAL'
        ? `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions?.map((i, idx) => `${idx + 1}. ${i}`).join('\n') || 'No specific instructions provided.'}

Here's what I've written so far: "${currentInput}"

I feel like this is too vague. Can you help me make it more specific?`
        : `I'm working on this task: "${taskTitle}"

Here are the instructions:
${taskInstructions?.map((i, idx) => `${idx + 1}. ${i}`).join('\n') || 'No specific instructions provided.'}

Here's what I've written: "${currentInput}"

Does this look good? Can you help me polish it?`,

      examples: `Show me examples for this task: "${taskTitle}"

Instructions for this task:
${taskInstructions?.map((i, idx) => `${idx + 1}. ${i}`).join('\n') || 'No specific instructions provided.'}

${currentInput ? `My current input (do NOT reference this directly): "${currentInput}"` : 'I haven\'t written anything yet.'}

Show 2-3 generic, fictional examples to help me understand what kind of answer this is asking for.`,

      simplify: `Please simplify this text I've written: "${currentInput}"

Make it clearer and lighter while keeping the exact same meaning. Do not add ideas, change strategy, or make it more persuasive.`,
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
        max_tokens: 600,
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

    console.log('[TASK-AI-ASSIST] Response generated successfully, input state:', inputState);

    return new Response(
      JSON.stringify({ response: content, inputState }),
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

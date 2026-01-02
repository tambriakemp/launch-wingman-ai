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
  currentInput?: string;
  nicheContext?: string;
}

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
  userId?: string;
}

type InputState = 'EMPTY' | 'PARTIAL' | 'CLEAR';

function detectInputState(input: string | undefined): InputState {
  if (!input || input.trim() === '' || input.trim().length < 5) {
    return 'EMPTY';
  }
  
  const trimmed = input.trim();
  const wordCount = trimmed.split(/\s+/).length;
  
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
  
  if (wordCount < 10 || isVague) {
    return 'PARTIAL';
  }
  
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

async function logAiUsage(supabase: any, userId: string, projectId: string | null, functionName: string, model: string, success: boolean) {
  try {
    await supabase.from("ai_usage_logs").insert({
      user_id: userId,
      project_id: projectId,
      function_name: functionName,
      model: model,
      success: success,
    });
  } catch (error) {
    console.error("Failed to log AI usage:", error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { mode, taskId, taskTitle, taskInstructions, projectId, toneModifiers, currentInput, nicheContext } = await req.json() as TaskAssistRequest;

    const nicheLabel = nicheContext ? NICHE_LABELS[nicheContext] || nicheContext : undefined;

    console.log('[TASK-AI-ASSIST] Request received:', { mode, taskId, projectId, hasToneModifiers: !!toneModifiers, hasCurrentInput: !!currentInput, nicheContext, nicheLabel });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let projectContext: ProjectContext = {};
    
    const { data: project } = await supabase
      .from('projects')
      .select('name, transformation_statement, selected_funnel_type, user_id')
      .eq('id', projectId)
      .single();

    if (project) {
      projectContext.userId = project.user_id;
    }

    const { data: funnel } = await supabase
      .from('funnels')
      .select('target_audience, primary_pain_point, desired_outcome, niche, funnel_type')
      .eq('project_id', projectId)
      .maybeSingle();

    const { data: offers } = await supabase
      .from('offers')
      .select('title, offer_type, target_audience')
      .eq('project_id', projectId)
      .limit(1);

    const { data: completedTasks } = await supabase
      .from('project_tasks')
      .select('task_id, input_data')
      .eq('project_id', projectId)
      .eq('status', 'completed');

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

    const toneGuidance = toneModifiers 
      ? `\n\nIMPORTANT - Writing Style Preferences:\n${toneModifiers}`
      : '';

    const inputState = detectInputState(currentInput);
    console.log('[TASK-AI-ASSIST] Input state detected:', inputState, 'for input:', currentInput?.substring(0, 50));

    const nicheContextStr = nicheLabel && mode !== 'simplify' 
      ? `\n- General niche context: ${nicheLabel} (use this to loosely tailor examples and language - do NOT treat this as the "real" audience)` 
      : '';
    
    const baseContext = `Project context:
${projectContext.audienceDescription ? `- Target audience: ${projectContext.audienceDescription}` : ''}
${projectContext.primaryProblem ? `- Main problem they solve: ${projectContext.primaryProblem}` : ''}
${projectContext.dreamOutcome ? `- Dream outcome: ${projectContext.dreamOutcome}` : ''}
${projectContext.offerName ? `- Offer name: ${projectContext.offerName}` : ''}
${projectContext.funnelType ? `- Launch path: ${projectContext.funnelType}` : ''}${nicheContextStr}${toneGuidance}`;

    const helpMeChoosePrompts: Record<InputState, string> = {
      EMPTY: `You are a calm, supportive assistant helping a beginner find a starting point. You are NOT a recommendation engine.

CRITICAL RULES:
- Do NOT give confident recommendations
- Do NOT use words like "best", "ideal", "perfect", "high-converting"
- Do NOT assume you know what they should choose
- Your job is to help them THINK, not decide for them
- Keep tone calm, supportive, and non-authoritative
${nicheLabel ? `
NICHE-AWARE BEHAVIOR (since user selected "${nicheLabel}"):
- Use niche ONLY as a lens to anchor examples lightly
- Do NOT say "Since you chose [niche], you should…"
- Do NOT treat niche as the user's final decision
- Reference niche subtly to reduce blank-page anxiety
- Examples should loosely relate to niche but remain generic` : ''}

REQUIRED OUTPUT FORMAT - You MUST respond with valid JSON:
\`\`\`json
{
  "mode": "prompting",
  "opening": "Let's find a starting point. You don't need the perfect answer yet.",${nicheLabel ? `
  "nicheContext": "Since you selected ${nicheLabel}, here are a few example directions some people start with:",` : ''}
  "clarifyingQuestions": [
    "Who do you most enjoy helping right now?",
    "What problem do people already come to you about?"
  ],
  "exampleDirections": [
    {
      "label": "Example A",
      "content": "${nicheLabel ? `People in ${nicheLabel} feeling overwhelmed by early decisions` : 'Busy professionals feeling overwhelmed by money decisions'}"
    },
    {
      "label": "Example B", 
      "content": "${nicheLabel ? `Beginners in ${nicheLabel} trying to get unstuck and move forward` : 'Beginners trying to make their first online income'}"
    },
    {
      "label": "Example C",
      "content": "${nicheLabel ? `People exploring ${nicheLabel} who want clarity before committing` : 'Women rebuilding confidence after burnout'}"
    }
  ],
  "closing": "${nicheLabel ? 'These are just examples — you can adapt one, or ignore them completely.' : 'Choose one to edit, or answer one question above — either is enough to move forward.'}"
}
\`\`\`

Tailor the clarifying questions and examples to the specific task at hand.${nicheLabel ? ` Anchor examples lightly to "${nicheLabel}" but keep them generic and non-prescriptive.` : ' Use language that matches the task context.'}

${baseContext}`,

      PARTIAL: `You are a calm, supportive assistant helping a beginner refine their thinking. You are NOT a recommendation engine.

CRITICAL RULES:
- Reflect the user's EXACT wording back to them
- Help them narrow and sharpen what they already wrote
- Do NOT replace their words with jargon
- Do NOT give definitive recommendations
- Keep tone calm and supportive
- Avoid words like "best", "ideal", "perfect"
${nicheLabel ? `
NICHE-AWARE BEHAVIOR (since user selected "${nicheLabel}"):
- User input ALWAYS takes priority over niche
- Mention niche ONLY if it adds clarity to their input
- Never imply niche is "correct" or that user should align with it
- If user's input conflicts with niche, IGNORE niche completely` : ''}

The user has provided this input: "${currentInput}"

REQUIRED OUTPUT FORMAT - You MUST respond with valid JSON:
\`\`\`json
{
  "mode": "refinement",
  "reflection": "You mentioned: \\"${currentInput?.replace(/"/g, '\\"')}\\"",
  "guidance": "That's a good starting point. Let's make it a little more specific so your messaging is clearer.",${nicheLabel ? `
  "nicheContext": "Since this sits within ${nicheLabel}, you might narrow it by:",` : ''}
  "refinementOptions": [
    "Their current situation or stage",
    "The main problem they're struggling with"
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
  "closing": "${nicheLabel ? 'You can keep it broad or narrow it — either works.' : 'Which direction feels closer? You can tweak it in your own words.'}"
}
\`\`\`

Generate refinement options that build on what they wrote - don't start from scratch.${nicheLabel ? ` If their input doesn't align with "${nicheLabel}", ignore the niche and focus only on their words.` : ''}

${baseContext}`,

      CLEAR: `You are a calm, supportive assistant helping a beginner polish their thinking. You may now offer suggestions, but still with soft language.

IMPORTANT: When input is CLEAR, IGNORE any niche context entirely. The user's written input is authoritative.

RULES:
- Use soft language like "You could phrase it like…" not "You should"
- Explain WHY your suggestion works
- Always invite edits or rejection
- Preserve the user's ownership of the decision
- Do NOT reference or adjust based on any niche selection
- Treat the user's input as the final authority

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

    const buildPreviousTaskContext = (): string => {
      const contextParts: string[] = [];
      
      if (taskId === 'planning_define_problem') {
        if (projectContext.audienceDescription) {
          contextParts.push(`Target audience (from previous task): "${projectContext.audienceDescription}"`);
        }
      } else if (taskId === 'planning_define_dream_outcome') {
        if (projectContext.audienceDescription) {
          contextParts.push(`Target audience (from previous task): "${projectContext.audienceDescription}"`);
        }
        if (projectContext.primaryProblem) {
          contextParts.push(`Main problem (from previous task): "${projectContext.primaryProblem}"`);
        }
      } else if (taskId === 'planning_time_effort_perception') {
        if (projectContext.audienceDescription) {
          contextParts.push(`Target audience: "${projectContext.audienceDescription}"`);
        }
        if (projectContext.primaryProblem) {
          contextParts.push(`Main problem: "${projectContext.primaryProblem}"`);
        }
        if (projectContext.dreamOutcome) {
          contextParts.push(`Dream outcome: "${projectContext.dreamOutcome}"`);
        }
      } else if (taskId === 'planning_offer_snapshot') {
        if (projectContext.audienceDescription) {
          contextParts.push(`Target audience: "${projectContext.audienceDescription}"`);
        }
        if (projectContext.primaryProblem) {
          contextParts.push(`Main problem: "${projectContext.primaryProblem}"`);
        }
        if (projectContext.dreamOutcome) {
          contextParts.push(`Dream outcome: "${projectContext.dreamOutcome}"`);
        }
      } else {
        if (projectContext.audienceDescription) {
          contextParts.push(`Target audience: "${projectContext.audienceDescription}"`);
        }
        if (projectContext.primaryProblem) {
          contextParts.push(`Main problem: "${projectContext.primaryProblem}"`);
        }
        if (projectContext.dreamOutcome) {
          contextParts.push(`Dream outcome: "${projectContext.dreamOutcome}"`);
        }
      }
      
      return contextParts.length > 0 ? contextParts.join('\n') : '';
    };
    
    const previousTaskContext = buildPreviousTaskContext();
    const hasPreviousContext = previousTaskContext.length > 0;

    const systemPrompts: Record<string, string> = {
      help_me_choose: helpMeChoosePrompts[inputState],

      examples: `You are a neutral assistant showing examples to spark ideas — NOT to recommend or prescribe answers.

CRITICAL RULES - YOU MUST FOLLOW THESE:
✓ Show exactly 2-3 examples (never more, never fewer)
✓ Examples must be generic, fictional, and broadly representative
✓ Keep each example to ONE clear sentence
✓ Use neutral, calm tone
✓ Preserve user autonomy
✓ Emphasize flexibility and normalize multiple paths

✗ NEVER reference real brands or influencers
✗ NEVER mention performance, results, or metrics
✗ NEVER frame examples as "best", "ideal", or "recommended"
✗ NEVER rank or compare examples
✗ NEVER say "most people choose" or "this works best"
✗ NEVER ask questions or offer guidance
✗ NEVER rewrite user's text
✗ NEVER validate or critique user input
✗ NEVER push users toward niche-specific decisions
${currentInput ? `
USER'S CURRENT INPUT (do not replace or critique):
"${currentInput}"` : ''}

${hasPreviousContext ? `PREVIOUS TASK CONTEXT (use to make examples contextual):
${previousTaskContext}` : ''}

REQUIRED OUTPUT FORMAT - You MUST respond with valid JSON:
\`\`\`json
{
  "examples": [
    {
      "label": "Example A",
      "content": "Generic, one-sentence example that relates to this task"
    },
    {
      "label": "Example B",
      "content": "Another generic, one-sentence example"
    },
    {
      "label": "Example C",
      "content": "A third generic, one-sentence example"
    }
  ],
  "footer": "These are just ideas — yours might look completely different."
}
\`\`\`

Generate examples specifically relevant to: "${taskTitle}"
Task instructions: ${taskInstructions.join('. ')}
${nicheLabel ? `The user selected "${nicheLabel}" as their general niche — use this only to loosely inform example topics, not to prescribe what they should choose.` : ''}

${baseContext}`,

      simplify: `You are a plain-language writing assistant helping a non-technical user understand task instructions.

RULES:
- Use simple, everyday words
- Break complex concepts into smaller pieces
- Avoid jargon or marketing-speak
- Keep the same meaning, just make it clearer
- Use 2nd person ("you") and friendly tone
- Keep it under 3 sentences per instruction

REQUIRED OUTPUT FORMAT - You MUST respond with valid JSON:
\`\`\`json
{
  "simplified": [
    "Simplified version of instruction 1",
    "Simplified version of instruction 2"
  ]
}
\`\`\`

Simplify these instructions for: "${taskTitle}"
Original instructions:
${taskInstructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}`
    };

    const systemPrompt = systemPrompts[mode];
    if (!systemPrompt) {
      throw new Error(`Invalid mode: ${mode}`);
    }

    const userPrompt = `Please help me with this task: "${taskTitle}"`;

    console.log('[TASK-AI-ASSIST] Calling AI with mode:', mode);

    const model = "google/gemini-2.5-flash";
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (projectContext.userId) {
        await logAiUsage(supabase, projectContext.userId, projectId, "task-ai-assist", model, false);
      }
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('[TASK-AI-ASSIST] AI gateway error:', response.status, errorText);
      throw new Error('Failed to get AI assistance');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      if (projectContext.userId) {
        await logAiUsage(supabase, projectContext.userId, projectId, "task-ai-assist", model, false);
      }
      throw new Error('No content in AI response');
    }

    console.log('[TASK-AI-ASSIST] AI response received, length:', content.length);

    // Log successful AI usage
    if (projectContext.userId) {
      await logAiUsage(supabase, projectContext.userId, projectId, "task-ai-assist", model, true);
    }

    // Parse JSON from response
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      console.error('[TASK-AI-ASSIST] JSON parse error:', parseError, 'Content:', content);
      // Try to extract JSON object directly
      const objectMatch = content.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        parsed = JSON.parse(objectMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[TASK-AI-ASSIST] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

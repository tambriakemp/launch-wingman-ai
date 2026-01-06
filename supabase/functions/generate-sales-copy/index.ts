import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fetch comprehensive context from planning/messaging phases
async function fetchProjectContext(supabase: any, projectId: string) {
  // Fetch funnel data (messaging phase)
  const { data: funnel } = await supabase
    .from("funnels")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  // Fetch project data
  const { data: project } = await supabase
    .from("projects")
    .select("transformation_statement, transformation_style, name, description")
    .eq("id", projectId)
    .maybeSingle();

  // Fetch relevant completed tasks for messaging data
  const { data: tasks } = await supabase
    .from("project_tasks")
    .select("task_id, input_data, status")
    .eq("project_id", projectId)
    .in("status", ["completed", "started"])
    .in("task_id", [
      "core-message",
      "talking-points", 
      "dream-outcome",
      "audience-definition",
      "value-proposition",
      "offer-stack",
    ]);

  // Parse task data
  const taskData: Record<string, any> = {};
  if (tasks && Array.isArray(tasks)) {
    for (const task of tasks as any[]) {
      if (task.input_data) {
        taskData[task.task_id] = task.input_data;
      }
    }
  }

  return {
    funnel: funnel as Record<string, any> | null,
    project: project as Record<string, any> | null,
    taskData,
  };
}

// Build context string from all messaging/planning data
function buildContextPrompt(
  context: { funnel: Record<string, any> | null; project: Record<string, any> | null; taskData: Record<string, any> },
  offer: { offerName?: string; offerType?: string; deliverables?: string[]; price?: number; priceType?: string; niche?: string },
  provided: { audience?: string; problem?: string; desiredOutcome?: string; transformationStatement?: string; problemStatement?: string; niche?: string }
) {
  const { funnel, project, taskData } = context;
  
  // Extract messaging data with fallbacks
  const targetAudience = funnel?.target_audience || provided.audience || "Not specified";
  const primaryPainPoint = funnel?.primary_pain_point || provided.problem || "Not specified";
  const desiredOutcome = funnel?.desired_outcome || provided.desiredOutcome || "Not specified";
  const niche = funnel?.niche || provided.niche || offer.niche || "Not specified";
  const problemStatement = funnel?.problem_statement || provided.problemStatement || "";
  const transformationStatement = project?.transformation_statement || provided.transformationStatement || "";
  
  // Pain symptoms from messaging
  const painSymptoms = funnel?.pain_symptoms as Array<{ symptom?: string; description?: string }> | null;
  const painSymptomsText = painSymptoms?.map(s => s.symptom || s.description).filter(Boolean).join("\n- ") || "";
  
  // Likelihood elements (what's stopped them before)
  const likelihoodElements = funnel?.likelihood_elements as Array<{ type?: string; content?: string }> | null;
  const likelihoodText = likelihoodElements?.map(e => e.content).filter(Boolean).join("\n- ") || "";
  
  // Time/effort concerns
  const timeEffortElements = funnel?.time_effort_elements as Array<{ type?: string; content?: string }> | null;
  const timeEffortText = timeEffortElements?.map(e => e.content).filter(Boolean).join("\n- ") || "";
  
  // Sub-audiences
  const subAudiences = funnel?.sub_audiences as Array<{ name?: string; description?: string }> | null;
  const subAudiencesText = subAudiences?.map(s => s.name).filter(Boolean).join(", ") || "";
  
  // Main objections
  const mainObjections = funnel?.main_objections as string || "";

  return `
=== COMPREHENSIVE OFFER & AUDIENCE CONTEXT ===

IDEAL CUSTOMER PROFILE:
- Target Audience: ${targetAudience}
- Niche: ${niche}
${subAudiencesText ? `- Sub-audiences: ${subAudiencesText}` : ""}

THEIR CURRENT PAIN & FRUSTRATIONS:
- Primary Pain Point: ${primaryPainPoint}
${painSymptomsText ? `- Daily Frustrations:\n  - ${painSymptomsText}` : ""}
${problemStatement ? `- Problem Statement: ${problemStatement}` : ""}

WHAT HAS STOPPED THEM BEFORE:
${likelihoodText ? `- ${likelihoodText}` : "- Generic solutions that didn't work for their specific situation"}

THEIR CONCERNS ABOUT TIME & EFFORT:
${timeEffortText ? `- ${timeEffortText}` : "- Worried about time commitment and complexity"}

${mainObjections ? `COMMON OBJECTIONS:\n${mainObjections}` : ""}

DESIRED TRANSFORMATION:
- Desired Outcome: ${desiredOutcome}
${transformationStatement ? `- Core Transformation Promise: "${transformationStatement}"` : ""}

OFFER DETAILS:
- Offer Name: ${offer.offerName || "Not specified"}
- Offer Type: ${offer.offerType || "Digital product"}
- Price: ${offer.price ? `$${offer.price}` : "Not specified"}
- Price Type: ${offer.priceType || "One-time"}
- Main Deliverables: ${offer.deliverables?.join(", ") || "Not specified"}

=== END CONTEXT ===

IMPORTANT: Use ALL of the above context to create copy that:
1. Speaks directly to their specific pain points and frustrations
2. Addresses their concerns and what has stopped them before
3. Paints a vivid picture of their desired outcome
4. Positions the offer as the solution to their specific problems
5. Uses language and examples relevant to their niche
`;
}

// Section-specific prompts for all 14 blocks
function getSectionPrompt(sectionId: string, contextPrompt: string, offer: { offerName?: string; offerType?: string; deliverables?: string[]; price?: number }) {
  const prompts: Record<string, { system: string; user: string }> = {
    // BLOCK 1: Opening Headline
    "opening-headline": {
      system: `You are a direct-response copywriter specializing in sales pages. Your task is to create compelling opening headlines.

HEADLINE FORMULAS TO USE (pick the best 5):
1. "<Achieve outcome> in <timeframe> WITHOUT <biggest pain point>"
   Example: "Confidently create a gorgeous sales page in less than a week WITHOUT spending thousands of dollars on a team"

2. "Are you ready to <desired outcome>?"
   Example: "Are you ready to stop living your life on autopilot?"

3. "Learn the skills, strategies & tools you need to <outcome>"
   Example: "Learn the skills, strategies & tools you need to build a thriving business"

4. "Attention <ideal customer group>: <outcome> in <timeframe>"
   Example: "Attention Online Course Creators: Launch Your Signature Course in One Month"

5. "How to <desired result> with little or no previous experience"
   Example: "How to Write High-Converting Sales Copy with No Copywriting Background"

6. "The biggest mistake(s) <ideal customer group> make when trying to <topic>"
   Example: "The Biggest Mistakes Coaches Make When Trying to Fill Their Programs"

7. "What if you could <outcome> without <pain point>?"
   Example: "What if you could build a six-figure business without burning out?"

RULES:
- Speak to BOTH the problem AND the desired result
- Be specific, not vague
- Avoid generic words like "transform" without specifics
- Make the reader feel understood immediately

Return ONLY valid JSON:
{
  "headlines": ["headline1", "headline2", "headline3", "headline4", "headline5"],
  "recommendedHeadline": 0
}`,
      user: `${contextPrompt}

Generate 5 compelling opening headlines that grab attention and speak directly to this audience's pain and desires.`
    },

    // BLOCK 2: Paint the Problem
    "paint-the-problem": {
      system: `You are a direct-response copywriter. Your task is to "paint the problem" - making readers feel understood by calling out their exact frustrations.

OPENING PATTERNS TO USE:
1. "You know you should <X>... but you have no clue where to begin."
2. "Does this sound familiar?"
3. "You know you need to be doing <X>, but you're feeling stuck, overwhelmed and distracted by all the options."
4. "There are <#> huge mistakes I see when people try to <topic>"
5. "Let me guess..."
6. "If you're like most <audience>..."

STRUCTURE:
- Start with an opening hook using one of the patterns above
- List 4-6 specific frustrations as bullet points
- Make each frustration visceral and specific
- End with a transitional sentence that leads to hope

RULES:
- Use the EXACT pain symptoms and frustrations from the context
- Be empathetic, not condescending
- Make them nod their head in recognition
- Don't offer the solution yet - just validate the struggle

Return ONLY valid JSON:
{
  "paragraphs": [
    "Opening hook paragraph 1",
    "Opening hook paragraph 2",
    "Opening hook paragraph 3"
  ],
  "bullets": [
    "Frustration bullet 1",
    "Frustration bullet 2",
    "Frustration bullet 3",
    "Frustration bullet 4"
  ]
}`,
      user: `${contextPrompt}

Write copy that paints a vivid picture of their current struggles. Use their exact pain symptoms and frustrations from the context above.`
    },

    // BLOCK 3: Look Into the Future
    "look-into-future": {
      system: `You are a direct-response copywriter. Your task is to help readers envision their possible future after working with you.

OPENING PATTERNS TO USE:
1. "Can you imagine how it would feel to <outcome>?"
2. "How would your <life/business> be different if you could:"
3. "Imagine being able to <outcome> without <pain point>"
4. "What if you could finally..."
5. "Picture this..."

STRUCTURE:
- Start with an aspirational opening
- List 4-6 specific future outcomes as bullet points
- Each outcome should be specific and emotional
- End with a bridge to the solution

RULES:
- Focus on feelings and experiences, not just achievements
- Use specific outcomes from their desired transformation
- Make it feel achievable but aspirational
- Create contrast with the "paint the problem" section

Return ONLY valid JSON:
{
  "openings": [
    "Aspirational opening 1",
    "Aspirational opening 2",
    "Aspirational opening 3"
  ],
  "futureOutcomes": [
    "Future outcome bullet 1",
    "Future outcome bullet 2",
    "Future outcome bullet 3",
    "Future outcome bullet 4"
  ]
}`,
      user: `${contextPrompt}

Help them envision a compelling future. What will their life/business look like after achieving the transformation?`
    },

    // BLOCK 4: Introduce Your Offer
    "introduce-offer": {
      system: `You are a direct-response copywriter. Your task is to introduce the offer with impact.

STRUCTURE:
1. A "big reveal" headline introducing the offer name
2. A subheadline that states the core promise/transformation
3. 2-3 sentence description of what the offer is

PATTERNS TO USE:
- "Introducing, <offer name>"
- "<offer name>: <big promise subhead>"
- "The <unique approach> to <outcome>"

RULES:
- Make the introduction feel like a revelation
- State the core result clearly
- Keep it focused - don't list features yet
- Build anticipation

Return ONLY valid JSON:
{
  "introductions": [
    { "headline": "Introducing headline 1", "subhead": "Subheadline 1", "description": "2-3 sentence description" },
    { "headline": "Introducing headline 2", "subhead": "Subheadline 2", "description": "2-3 sentence description" },
    { "headline": "Introducing headline 3", "subhead": "Subheadline 3", "description": "2-3 sentence description" }
  ]
}`,
      user: `${contextPrompt}

Create 3 compelling ways to introduce this offer. Make it feel like the solution they've been waiting for.`
    },

    // BLOCK 5: Offer Differentiator
    "offer-differentiator": {
      system: `You are a direct-response copywriter. Your task is to explain what makes this offer different from everything else.

PATTERNS TO USE:
- "What makes <offer name> different?"
- "Here's how <offer name> is different from other courses:"
- "<offer name> is the first of its kind that not only teaches you <X> but also <Y>"
- "Unlike other programs that..."

STRUCTURE:
1. Opening that positions this as unique
2. 3-5 comparison points showing what's different
3. Clear statement of the unique approach/methodology

RULES:
- Address what they've likely tried before (from context)
- Show why previous approaches failed
- Position this as the solution that addresses their specific barriers
- Be specific about the unique methodology

Return ONLY valid JSON:
{
  "openings": ["Opening 1", "Opening 2", "Opening 3"],
  "differentiators": [
    "What makes this different point 1",
    "What makes this different point 2",
    "What makes this different point 3",
    "What makes this different point 4"
  ]
}`,
      user: `${contextPrompt}

Explain what makes this offer unique. Address what has stopped them before and why this approach is different.`
    },

    // BLOCK 6: The Results
    "the-results": {
      system: `You are a direct-response copywriter. Your task is to list specific results they will achieve.

PATTERNS TO USE:
- "You'll learn how to:"
- "By the end of this program, you'll be able to:"
- "This [workshop/course/program] will teach you how to:"

STRUCTURE FOR EACH RESULT:
"[Action verb] [specific skill/outcome] so that [benefit/impact]"

Examples:
- "Learn how to write compelling headlines so that your content gets clicked"
- "Master the art of storytelling so that your audience stays engaged"
- "Create a content calendar so that you never run out of ideas"

RULES:
- Use action verbs (learn, master, create, build, discover, implement)
- Include the "so that" to show the benefit
- Be specific, not vague
- Focus on outcomes they care about (from context)

Return ONLY valid JSON:
{
  "headerOptions": ["Header option 1", "Header option 2", "Header option 3"],
  "results": [
    { "action": "Action statement", "benefit": "So that benefit" },
    { "action": "Action statement 2", "benefit": "So that benefit 2" },
    { "action": "Action statement 3", "benefit": "So that benefit 3" },
    { "action": "Action statement 4", "benefit": "So that benefit 4" },
    { "action": "Action statement 5", "benefit": "So that benefit 5" }
  ]
}`,
      user: `${contextPrompt}

List 5 specific results they will achieve. Focus on outcomes that address their pain points and move them toward their desired outcome.`
    },

    // BLOCK 7: The Features
    "the-features": {
      system: `You are a direct-response copywriter. Your task is to break down exactly what's included in the offer.

PATTERNS TO USE:
- "Here's what's inside:"
- "Here's what you're going to get:"
- "Your complete <offer name> includes:"

FOR EACH MODULE/COMPONENT:
- Compelling name
- What's covered
- The specific result it delivers

BONUS STRUCTURE:
- Bonus name
- Perceived value ($XX value)
- What's included and why it matters

RULES:
- Make module names outcome-focused, not feature-focused
- Include specific deliverables
- Show clear value for each component
- Bonuses should feel like genuine extras

Return ONLY valid JSON:
{
  "headerOptions": ["Header 1", "Header 2"],
  "modules": [
    { "name": "Module Name", "description": "What's covered", "result": "What they'll achieve" },
    { "name": "Module 2", "description": "What's covered", "result": "What they'll achieve" }
  ],
  "bonuses": [
    { "name": "Bonus Name", "value": "$97 value", "description": "What's included and benefit" }
  ]
}`,
      user: `${contextPrompt}

Break down what's included in this offer. Create compelling module names and descriptions based on the deliverables provided.`
    },

    // BLOCK 8: The Investment
    "the-investment": {
      system: `You are a direct-response copywriter. Your task is to present the price with proper value context.

STRUCTURE:
1. Stack the value first (what they're getting)
2. Show the contrast (what it would cost elsewhere or to figure out alone)
3. Reveal the investment
4. Payment options if applicable

PATTERNS TO USE:
- "When you add that all up, it comes out to a value of <$XXX>, but you can enroll today for a special investment of <$XXX>."
- "Get instant access to <offer name> for only $XX"
- "Your investment: $XX"
- "Are you ready to <big result>?"

RULES:
- Build value before revealing price
- Make the price feel like a no-brainer
- Include payment plan options if relevant
- Focus on what they get, not just what they pay

Return ONLY valid JSON:
{
  "valueStack": ["Value item 1", "Value item 2", "Value item 3"],
  "investmentStatements": [
    "Investment statement option 1",
    "Investment statement option 2",
    "Investment statement option 3"
  ],
  "ctaOptions": ["CTA button text 1", "CTA button text 2", "CTA button text 3"]
}`,
      user: `${contextPrompt}

Create investment section copy that stacks value and makes the price feel like an incredible deal.`
    },

    // BLOCK 9: The Guarantee
    "the-guarantee": {
      system: `You are a direct-response copywriter. Your task is to create risk-reversal guarantee copy.

PATTERNS TO USE:
- "We want you to be 100% confident when you enroll in <offer name>"
- "You're protected with our 100% risk-free money back guarantee"
- "There's literally no risk involved, because you're backed by our <#>-day money back guarantee!"
- "Buy it, try it, apply it. You're backed by our 100% money back guarantee."
- "You have nothing to lose and everything to gain"

STRUCTURE:
1. Headline stating the guarantee
2. Explanation of what the guarantee covers
3. What they need to do to qualify (if anything)
4. Reassurance statement

RULES:
- Make it feel generous and confident
- Be clear about terms
- Reduce all perceived risk
- Show you believe in the product

Return ONLY valid JSON:
{
  "guarantees": [
    { "headline": "Guarantee headline 1", "explanation": "Full guarantee explanation 1" },
    { "headline": "Guarantee headline 2", "explanation": "Full guarantee explanation 2" },
    { "headline": "Guarantee headline 3", "explanation": "Full guarantee explanation 3" }
  ]
}`,
      user: `${contextPrompt}

Create 3 guarantee statement options that eliminate risk and build confidence.`
    },

    // BLOCK 10: Introduce Yourself
    "introduce-yourself": {
      system: `You are a direct-response copywriter. Your task is to create an "About Me" section that builds trust.

PATTERNS TO USE:
- "Meet <name> - your new <fun title>!"
- "I can't wait to meet you inside <offer name>!"
- "Hey, I'm <name> and just <X> years ago, I <relate to pain point>"
- "Here's the thing about me..."

STRUCTURE:
1. Relatable opening that connects to their pain
2. Your journey/transformation
3. Why you created this offer
4. Credentials that matter (results-focused)
5. Personal touch/invitation

RULES:
- Lead with relatability, not credentials
- Share your "before" that mirrors their current state
- Focus on results you've achieved for yourself and others
- End with warmth and invitation

Return ONLY valid JSON:
{
  "aboutMeOptions": [
    { "opening": "Opening hook", "body": "Full about me section", "closing": "Warm closing" },
    { "opening": "Opening hook 2", "body": "Full about me section 2", "closing": "Warm closing 2" },
    { "opening": "Opening hook 3", "body": "Full about me section 3", "closing": "Warm closing 3" }
  ]
}`,
      user: `${contextPrompt}

Create 3 "About Me" section options. The creator should be positioned as someone who understands the audience's struggles because they've been there.`
    },

    // BLOCK 11: Is This For You?
    "is-this-for-you": {
      system: `You are a direct-response copywriter. Your task is to help readers self-qualify.

PATTERNS TO USE:
- "<offer name> is PERFECT for you if..."
- "Is this right for you?"
- "<#> Ways to Know You're Ready to Achieve <outcome>"
- "Not sure if <offer name> is right for you?"

STRUCTURE:
1. "This is for you if..." bullets (4-6 points)
2. "This is NOT for you if..." bullets (3-4 points)

RULES:
- "For you" points should be aspirational but achievable
- "Not for you" points should filter out wrong-fit people
- Be honest and specific
- Help them make an empowered decision

Return ONLY valid JSON:
{
  "headerOptions": ["Header option 1", "Header option 2"],
  "forYouBullets": [
    "You are perfect for this if bullet 1",
    "You are perfect for this if bullet 2",
    "You are perfect for this if bullet 3",
    "You are perfect for this if bullet 4"
  ],
  "notForYouBullets": [
    "This is NOT for you if bullet 1",
    "This is NOT for you if bullet 2",
    "This is NOT for you if bullet 3"
  ]
}`,
      user: `${contextPrompt}

Create "Is This For You?" copy that helps readers self-qualify and feel confident about their decision.`
    },

    // BLOCK 12: Why Now
    "why-now": {
      system: `You are a direct-response copywriter. Your task is to create urgency and remind them why they need this NOW.

PATTERNS TO USE:
- "Don't let another year go by before you <outcome>. Here's why you need to get inside <offer name> today..."
- "If you've made it this far..."
- "Here's the truth..."
- "You've tried waiting. You've tried doing it alone. How's that working out?"
- "The cost of waiting is..."

STRUCTURE:
1. Remind them of the cost of inaction
2. Show what they're risking by waiting
3. Paint the contrast (their life with vs without this)
4. Clear call to action

RULES:
- Create genuine urgency, not fake scarcity
- Remind them of their pain and desired outcome
- Focus on opportunity cost
- Be encouraging, not pushy

Return ONLY valid JSON:
{
  "whyNowOptions": [
    { "opening": "Urgency opening", "body": "Full why now section", "callToAction": "CTA statement" },
    { "opening": "Urgency opening 2", "body": "Full why now section 2", "callToAction": "CTA statement 2" }
  ]
}`,
      user: `${contextPrompt}

Create "Why Now" copy that creates genuine urgency. Remind them of the cost of staying stuck.`
    },

    // BLOCK 13: FAQs/Objections
    "frequent-objections": {
      system: `You are a direct-response copywriter. Your task is to address common objections through FAQs.

COMMON OBJECTION CATEGORIES:
1. Money: "I can't afford this right now"
2. Time: "I'm too busy to do this right now"
3. Readiness: "I'm not sure I'm at the right level yet"
4. Trust: "I've signed up for programs like this before and they haven't worked"
5. Specifics: Questions about format, access, support

PATTERNS FOR ANSWERS:
- Acknowledge the concern
- Reframe it
- Provide the solution/answer
- End with reassurance

RULES:
- Use their actual objections from the context
- Be empathetic, not defensive
- Turn objections into reasons to buy
- Keep answers concise but thorough

Return ONLY valid JSON:
{
  "faqs": [
    { "question": "Objection as question 1", "answer": "Empathetic, thorough answer 1" },
    { "question": "Objection as question 2", "answer": "Empathetic, thorough answer 2" },
    { "question": "Objection as question 3", "answer": "Empathetic, thorough answer 3" },
    { "question": "Objection as question 4", "answer": "Empathetic, thorough answer 4" },
    { "question": "Objection as question 5", "answer": "Empathetic, thorough answer 5" }
  ]
}`,
      user: `${contextPrompt}

Create 5 FAQs that address their biggest objections and concerns. Turn objections into reasons to buy.`
    },

    // BLOCK 14: Final CTA
    "final-cta": {
      system: `You are a direct-response copywriter. Your task is to create a compelling final call-to-action.

PATTERNS TO USE:
- "Enroll in <offer name> today!"
- "I'm ready, <name>!"
- "Yes, I want to <achieve outcome>!"
- "Get instant access now"
- "Join us inside <offer name>"

STRUCTURE:
1. Final headline that summarizes the transformation
2. Brief reminder of what they get
3. Strong CTA button text
4. Last reassurance (guarantee mention)

RULES:
- Keep it simple - they've read the whole page
- Remind them of the outcome, not the features
- Make the CTA action-oriented
- Include one final reassurance

Return ONLY valid JSON:
{
  "finalCtaOptions": [
    { "headline": "Final headline 1", "reminder": "Brief value reminder", "ctaButton": "CTA button text", "reassurance": "Final reassurance" },
    { "headline": "Final headline 2", "reminder": "Brief value reminder 2", "ctaButton": "CTA button text 2", "reassurance": "Final reassurance 2" }
  ]
}`,
      user: `${contextPrompt}

Create 2 compelling final CTA options for readers who've made it to the bottom of the page.`
    },
  };

  return prompts[sectionId] || prompts["opening-headline"];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      sectionType,
      sectionId, // New: actual section ID from the 14-block framework
      part,
      audience, 
      problem, 
      desiredOutcome, 
      offerName, 
      offerType, 
      deliverables,
      attemptedSolutions,
      whyFails,
      uniqueApproach,
      inferContext,
      priceType,
      price,
      count,
      transformationStatement,
      problemStatement,
      niche,
      projectId,
      generateExamples,
      formulas,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract user ID from auth header
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    let systemPrompt = "";
    let userPrompt = "";

    // Handle examples generation using formulas
    if (generateExamples && formulas && Array.isArray(formulas) && projectId) {
      console.log(`[GENERATE-SALES-COPY] Generating examples for section: ${sectionId}`);
      
      // Fetch comprehensive context from the project
      const context = await fetchProjectContext(supabase, projectId);
      
      // Build the context prompt
      const contextPrompt = buildContextPrompt(
        context,
        { offerName, offerType, deliverables, price, priceType, niche },
        { audience, problem, desiredOutcome, transformationStatement, problemStatement, niche }
      );
      
      const formulasText = formulas.map((f: { template: string; example: string }, i: number) => 
        `Formula ${i + 1}: ${f.template}\n   Example: ${f.example}`
      ).join("\n\n");
      
      systemPrompt = `You are a direct-response copywriter specializing in sales page copy.

Your job is to generate 3-5 concrete examples based on the provided formulas, customized for the specific offer and audience.

${contextPrompt}

IMPORTANT RULES:
1. Each example should follow one of the provided formula patterns
2. Replace ALL placeholders with specific content from the context
3. Make examples feel natural and conversational, not template-like
4. Vary the formulas used - don't just use the same one repeatedly
5. Output should be ready to use - no placeholders or brackets remaining

Return ONLY valid JSON:
{
  "examples": ["example1", "example2", "example3", "example4", "example5"]
}`;

      userPrompt = `Generate 3-5 customized examples using these formulas:

${formulasText}

Use the offer and audience context to make each example specific, compelling, and ready to use.`;
    }
    // Check if we're using the new 14-block framework
    else if (sectionId && projectId) {
      console.log(`[GENERATE-SALES-COPY] Using 14-block framework for section: ${sectionId}`);
      
      // Fetch comprehensive context from the project
      const context = await fetchProjectContext(supabase, projectId);
      
      // Build the context prompt
      const contextPrompt = buildContextPrompt(
        context,
        { offerName, offerType, deliverables, price, priceType, niche },
        { audience, problem, desiredOutcome, transformationStatement, problemStatement, niche }
      );
      
      // Get section-specific prompts
      const sectionPrompts = getSectionPrompt(sectionId, contextPrompt, { offerName, offerType, deliverables, price });
      
      systemPrompt = sectionPrompts.system;
      userPrompt = sectionPrompts.user;
      
    } else {
      // Legacy support for old section types
      console.log(`[GENERATE-SALES-COPY] Using legacy prompts for section: ${sectionType}`);
      
      // Build transformation context if available
      const transformationContext = transformationStatement 
        ? `\n\nCORE TRANSFORMATION PROMISE (use this as the foundation for all copy):\n"${transformationStatement}"\n\nEnsure all copy aligns with and reinforces this core transformation message.`
        : '';

      if (sectionType === "hero") {
        if (part === "headlines") {
          systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY headlines.

Create 5 headline options using these bold promise patterns:
1) Do (desired outcome) without (main obstacle)
2) Stop (pain), start (desired outcome)
3) The fastest way to (desired outcome) for (audience)
4) Finally, (achieve result) without (common frustration)
5) What if you could (desired outcome) in (timeframe)?

Tone: clear, confident, modern (not hypey)

Return ONLY valid JSON: { "headlines": ["h1", "h2", "h3", "h4", "h5"], "recommendedHeadline": 0 }`;
          userPrompt = `Create headlines for: Audience: ${audience}, Problem: ${problem}, Outcome: ${desiredOutcome}, Offer: ${offerName}`;
        } else if (part === "subheadline") {
          systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY subheadlines.

Create 4 subheadline options (1-2 sentences each that expand on the headline promise).

Tone: clear, confident, modern

Return ONLY valid JSON: { "subheadlines": ["sub1", "sub2", "sub3", "sub4"] }`;
          userPrompt = `Create subheadlines for: Audience: ${audience}, Problem: ${problem}, Outcome: ${desiredOutcome}, Offer: ${offerName}`;
        } else if (part === "cta") {
          systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY CTA button text options.

Create 4 CTA button text options (action-oriented, 2-5 words each).

Tone: clear, confident, action-oriented

Return ONLY valid JSON: { "ctas": ["cta1", "cta2", "cta3", "cta4"] }`;
          userPrompt = `Create CTA button text for: Audience: ${audience}, Offer: ${offerName}, Outcome: ${desiredOutcome}`;
        } else {
          systemPrompt = `You are a direct-response conversion copywriter.

Write the HERO section for a sales page.

Requirements:
- Create 5 headline options using bold promise patterns
- Create 4 subheadline options (1-2 sentences each)
- Create 4 CTA button text options

Tone: clear, confident, modern (not hypey)

Return ONLY valid JSON:
{
  "headlines": ["headline1", "headline2", "headline3", "headline4", "headline5"],
  "recommendedHeadline": 0,
  "subheadlines": ["subheadline1", "subheadline2", "subheadline3", "subheadline4"],
  "ctas": ["cta1", "cta2", "cta3", "cta4"]
}`;
          userPrompt = `Create HERO section copy for:
- Target Audience: ${audience || "Not specified"}
- Core Problem: ${problem || "Not specified"}
- Desired Outcome: ${desiredOutcome || "Not specified"}
- Offer Name: ${offerName || "Not specified"}
${transformationContext}`;
        }

      } else if (sectionType === "whyDifferent" || sectionType === "paintProblem" || sectionType === "lookFuture" || sectionType === "introduceOffer") {
        // Map to new section IDs for consistent handling
        const sectionMapping: Record<string, string> = {
          'whyDifferent': 'offer-differentiator',
          'paintProblem': 'paint-the-problem',
          'lookFuture': 'look-into-future',
          'introduceOffer': 'introduce-offer',
        };
        
        const mappedSectionId = sectionMapping[sectionType] || sectionType;
        
        if (projectId) {
          const context = await fetchProjectContext(supabase, projectId);
          const contextPrompt = buildContextPrompt(
            context,
            { offerName, offerType, deliverables, price, priceType, niche },
            { audience, problem, desiredOutcome, transformationStatement, problemStatement, niche }
          );
          const sectionPrompts = getSectionPrompt(mappedSectionId, contextPrompt, { offerName, offerType, deliverables, price });
          systemPrompt = sectionPrompts.system;
          userPrompt = sectionPrompts.user;
        } else {
          // Basic fallback
          systemPrompt = `You are a direct-response conversion copywriter. Create compelling copy for this section.
Return valid JSON with appropriate fields.`;
          userPrompt = `Create copy for: Audience: ${audience}, Problem: ${problem}, Outcome: ${desiredOutcome}`;
        }

      } else if (sectionType === "benefits" || sectionType === "results") {
        const benefitCount = count || 4;
        systemPrompt = `You are a direct-response conversion copywriter.

Generate ${benefitCount} key benefits/results using the Feature → Benefit → Outcome format.

Return ONLY valid JSON:
{
  "results": [
    { "action": "Learn how to...", "benefit": "so that..." }
  ]
}`;
        userPrompt = `Create benefits for: Audience: ${audience}, Offer: ${offerName}, Outcome: ${desiredOutcome}
${transformationContext}`;

      } else if (sectionType === "offerDetails" || sectionType === "investment" || sectionType === "guarantee") {
        const sectionMapping: Record<string, string> = {
          'offerDetails': 'the-features',
          'investment': 'the-investment',
          'guarantee': 'the-guarantee',
        };
        
        const mappedSectionId = sectionMapping[sectionType] || sectionType;
        
        if (projectId) {
          const context = await fetchProjectContext(supabase, projectId);
          const contextPrompt = buildContextPrompt(
            context,
            { offerName, offerType, deliverables, price, priceType, niche },
            { audience, problem, desiredOutcome, transformationStatement, problemStatement, niche }
          );
          const sectionPrompts = getSectionPrompt(mappedSectionId, contextPrompt, { offerName, offerType, deliverables, price });
          systemPrompt = sectionPrompts.system;
          userPrompt = sectionPrompts.user;
        } else {
          systemPrompt = `You are a direct-response copywriter. Create compelling offer details.
Return valid JSON.`;
          userPrompt = `Create copy for: Offer: ${offerName}, Price: ${price}`;
        }

      } else if (sectionType === "faqs") {
        const faqCount = count || 5;
        if (projectId) {
          const context = await fetchProjectContext(supabase, projectId);
          const contextPrompt = buildContextPrompt(
            context,
            { offerName, offerType, deliverables, price, priceType, niche },
            { audience, problem, desiredOutcome, transformationStatement, problemStatement, niche }
          );
          const sectionPrompts = getSectionPrompt('frequent-objections', contextPrompt, { offerName, offerType, deliverables, price });
          systemPrompt = sectionPrompts.system;
          userPrompt = sectionPrompts.user;
        } else {
          systemPrompt = `You are a direct-response copywriter. Generate ${faqCount} FAQs.
Return valid JSON: { "faqs": [{ "question": "...", "answer": "..." }] }`;
          userPrompt = `Create FAQs for: Offer: ${offerName}, Audience: ${audience}`;
        }

      } else if (sectionType === "aboutMe" || sectionType === "isThisForYou" || sectionType === "whyNow" || sectionType === "finalCta") {
        const sectionMapping: Record<string, string> = {
          'aboutMe': 'introduce-yourself',
          'isThisForYou': 'is-this-for-you',
          'whyNow': 'why-now',
          'finalCta': 'final-cta',
        };
        
        const mappedSectionId = sectionMapping[sectionType] || sectionType;
        
        if (projectId) {
          const context = await fetchProjectContext(supabase, projectId);
          const contextPrompt = buildContextPrompt(
            context,
            { offerName, offerType, deliverables, price, priceType, niche },
            { audience, problem, desiredOutcome, transformationStatement, problemStatement, niche }
          );
          const sectionPrompts = getSectionPrompt(mappedSectionId, contextPrompt, { offerName, offerType, deliverables, price });
          systemPrompt = sectionPrompts.system;
          userPrompt = sectionPrompts.user;
        } else {
          systemPrompt = `You are a direct-response copywriter. Create compelling copy.
Return valid JSON.`;
          userPrompt = `Create copy for: Offer: ${offerName}, Audience: ${audience}`;
        }

      } else if (sectionType === "testimonials") {
        systemPrompt = `You are a direct-response conversion copywriter.
Generate 3 SAMPLE testimonials (templates to guide collecting real testimonials).
Return ONLY valid JSON:
{
  "testimonials": [
    { "name": "[Sample] Name", "result": "Specific result", "quote": "First-person testimonial..." }
  ]
}`;
        userPrompt = `Create sample testimonials for: Audience: ${audience}, Offer: ${offerName}, Outcome: ${desiredOutcome}
${transformationContext}`;

      } else {
        throw new Error(`Invalid section type: ${sectionType}. Use one of the 14-block section IDs or legacy types.`);
      }
    }

    console.log(`[GENERATE-SALES-COPY] Generating copy with prompts ready`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("[GENERATE-SALES-COPY] AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate sales copy");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No content generated");
    }

    console.log("[GENERATE-SALES-COPY] AI response received");

    // Parse JSON response
    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content;
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      
      if (objectMatch) {
        result = JSON.parse(objectMatch[0]);
      } else {
        throw new Error("No JSON object found in response");
      }
    } catch (parseError) {
      console.error("[GENERATE-SALES-COPY] JSON parse error:", parseError);
      console.error("[GENERATE-SALES-COPY] Raw content:", content);
      throw new Error("Failed to parse AI response");
    }

    // Log AI usage if user is authenticated
    if (userId) {
      try {
        await supabase.from('ai_usage_logs').insert({
          user_id: userId,
          project_id: projectId || null,
          function_name: 'generate-sales-copy',
          model: 'google/gemini-2.5-flash',
          tokens_used: data.usage?.total_tokens || null,
          success: true,
        });
      } catch (logError) {
        console.error('[GENERATE-SALES-COPY] Failed to log AI usage:', logError);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[GENERATE-SALES-COPY] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

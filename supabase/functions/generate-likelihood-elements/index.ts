import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niche, targetAudience, primaryPainPoint, desiredOutcome, mainObjections } = await req.json();

    if (!niche || !targetAudience || !mainObjections) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: niche, targetAudience, mainObjections' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert marketing strategist specializing in the Value Equation framework. 
Generate credibility and proof elements that address objections and build trust for a specific audience.

Return EXACTLY 6-8 elements as a JSON array. Each element must have:
- "type": one of "objection_counter", "proof", or "credibility"
- "text": the specific element (15-30 words, actionable and specific)

Types explained:
- objection_counter: Direct responses to common doubts/objections
- proof: Evidence-based elements (results, testimonials, case studies, data)
- credibility: Authority builders (credentials, experience, methodology)

Return ONLY valid JSON array, no markdown or explanation.`;

    const userPrompt = `Generate proof and credibility elements for:

NICHE: ${niche}
TARGET AUDIENCE: ${targetAudience}
PRIMARY PAIN POINT: ${primaryPainPoint || 'Not specified'}
DESIRED OUTCOME: ${desiredOutcome || 'Not specified'}
MAIN OBJECTIONS/DOUBTS: ${mainObjections}

Generate 6-8 mixed elements (at least 2 of each type) that directly address these objections and build confidence.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response
    let elements;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      elements = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate structure
    if (!Array.isArray(elements)) {
      throw new Error('AI response is not an array');
    }

    const validElements = elements.filter(
      (el: any) => 
        el && 
        typeof el.type === 'string' && 
        ['objection_counter', 'proof', 'credibility'].includes(el.type) &&
        typeof el.text === 'string' && 
        el.text.length > 0
    );

    console.log(`Generated ${validElements.length} likelihood elements`);

    return new Response(
      JSON.stringify({ elements: validElements }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-likelihood-elements:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate likelihood elements';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

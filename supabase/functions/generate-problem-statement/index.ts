import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niche, targetAudience, primaryPainPoint, desiredOutcome } = await req.json();

    console.log('[GENERATE-PROBLEM-STATEMENT] Generating for:', { niche, targetAudience: targetAudience?.substring(0, 50) });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert marketing strategist who helps coaches and digital marketers craft compelling problem statements for their offers.

A problem statement should:
- Clearly identify WHO the target audience is
- Articulate the specific PROBLEM or pain point they face
- Hint at the TRANSFORMATION or outcome they desire
- Be concise (2-3 sentences maximum)
- Use empathetic, understanding language
- Avoid jargon or overly salesy language

Format: Write a clear, compelling problem statement that a coach could use to anchor their offer messaging.`;

    const userPrompt = `Create a problem statement for a coach in the "${niche}" niche based on:

TARGET AUDIENCE: ${targetAudience}

PRIMARY PAIN POINT: ${primaryPainPoint}

DESIRED OUTCOME: ${desiredOutcome}

Generate a compelling 2-3 sentence problem statement that synthesizes these inputs.`;

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
      console.error('[GENERATE-PROBLEM-STATEMENT] AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate problem statement');
    }

    const data = await response.json();
    const problemStatement = data.choices[0].message.content.trim();

    console.log('[GENERATE-PROBLEM-STATEMENT] Generated successfully');

    return new Response(JSON.stringify({ problemStatement }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GENERATE-PROBLEM-STATEMENT] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

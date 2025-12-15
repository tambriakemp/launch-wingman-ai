import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { niche, targetAudience, currentOutcome, painPoint } = await req.json();
    
    console.log('Generating dream outcome variations for:', { niche, targetAudience, currentOutcome, painPoint });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert copywriter specializing in transformation statements for coaches and digital course creators. You help craft compelling "dream outcome" statements that resonate deeply with target audiences.

Your task is to generate 3 different style variations of a dream outcome statement:
1. RESULTS-FOCUSED: Emphasizes tangible, measurable outcomes and achievements
2. EMOTION-FOCUSED: Emphasizes feelings, emotional transformation, and internal shifts  
3. IDENTITY-FOCUSED: Emphasizes who they become, their new identity and self-image

Each variation should:
- Be specific and vivid (avoid vague language)
- Feel achievable yet aspirational
- Speak directly to what the target audience truly wants
- Be 1-2 sentences maximum

Return ONLY valid JSON in this exact format:
{
  "variations": [
    { "type": "results", "label": "Results-Focused", "statement": "..." },
    { "type": "emotion", "label": "Emotion-Focused", "statement": "..." },
    { "type": "identity", "label": "Identity-Focused", "statement": "..." }
  ]
}`;

    const userPrompt = `Generate 3 dream outcome variations for:
- Niche: ${niche || 'Not specified'}
- Target Audience: ${targetAudience || 'Not specified'}
- Pain Point: ${painPoint || 'Not specified'}
- Current Draft (enhance this): ${currentOutcome || 'Not provided - create from scratch based on context'}

Create compelling, specific dream outcome statements that would resonate with this audience.`;

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
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('Raw AI response:', content);

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    console.log('Parsed variations:', parsed);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-dream-outcome:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

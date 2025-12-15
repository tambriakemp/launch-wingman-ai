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
    const { niche, targetAudience, primaryPainPoint } = await req.json();

    if (!primaryPainPoint) {
      return new Response(
        JSON.stringify({ error: 'Primary pain point is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert marketing strategist helping coaches identify specific pain point symptoms their audience experiences.

Given a primary pain point, generate 5-6 specific, tangible symptoms that the target audience experiences. These should be:
- Observable behaviors or situations (not abstract feelings)
- Specific enough to resonate deeply with the audience
- Written in the voice of the customer (what they would say/think)
- Related to daily life impacts

Return ONLY a JSON array of strings, each being a specific symptom. No explanations, just the array.

Example format:
["Spending hours scrolling instead of working on their business", "Missing deadlines because they can't focus", "Feeling guilty about not being productive", "Starting multiple projects but finishing none", "Comparing themselves to others who seem to have it together"]`;

    const userPrompt = `Generate pain point symptoms for:

Niche: ${niche || 'Not specified'}
Target Audience: ${targetAudience || 'Not specified'}
Primary Pain Point: ${primaryPainPoint}

Return 5-6 specific symptoms as a JSON array of strings.`;

    console.log('Calling Lovable AI for pain symptoms generation...');

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
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response content:', content);

    // Parse the JSON array from the response
    let symptoms: string[];
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        symptoms = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: split by newlines if JSON parsing fails
      symptoms = content
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^[-*•]\s*/, '').trim())
        .slice(0, 6);
    }

    console.log('Generated symptoms:', symptoms);

    return new Response(
      JSON.stringify({ symptoms }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-pain-symptoms:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
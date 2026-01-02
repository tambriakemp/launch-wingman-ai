import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niche, targetAudience, projectId } = await req.json();
    
    if (!niche) {
      return new Response(
        JSON.stringify({ error: 'Niche is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!targetAudience) {
      return new Response(
        JSON.stringify({ error: 'Target audience description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Extract user ID from auth header
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const supabase = createClient(supabaseUrl, supabaseKey);
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const systemPrompt = `You are an expert marketing strategist specializing in audience definition for coaches and digital marketers. Your task is to refine and improve a user's target audience description.

Given a niche and rough audience description, create 3 refined variations in different styles:

1. **Specific & Tactical** - Focus on demographic details, specific situations, measurable criteria (age, income, career stage, life situation)
2. **Aspirational** - Focus on who they want to become, their goals and dreams, their desired identity
3. **Pain-Focused** - Focus on their current struggles, frustrations, and the problem that's driving them to seek help

Rules:
- Clean up and professionalize the user's input
- Make each variation more specific and targeted than the original
- Keep each variation to 1-2 sentences max
- Don't add things not implied by the original - just refine what's there
- Avoid generic filler words
- Make them actionable for marketing

Also provide a specificity score (1-10) and brief feedback.

Return a JSON object with this exact structure:
{
  "variations": [
    {
      "type": "specific",
      "label": "Specific & Tactical",
      "statement": "The refined audience description"
    },
    {
      "type": "aspirational",
      "label": "Aspirational",
      "statement": "The refined audience description"
    },
    {
      "type": "pain",
      "label": "Pain-Focused",
      "statement": "The refined audience description"
    }
  ],
  "specificityScore": <number 1-10>,
  "specificityFeedback": "Brief feedback on the original description"
}`;

    const userPrompt = `Niche: ${niche}
User's target audience description: ${targetAudience}

Please refine this audience description into 3 variations and provide feedback.`;

    console.log("Generating audience refinements for:", { niche, targetAudience });

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    // Log AI usage
    if (userId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase.from('ai_usage_logs').insert({
          user_id: userId,
          project_id: projectId || null,
          function_name: 'generate-audience-refinements',
          model: 'google/gemini-2.5-flash',
          tokens_used: data.usage?.total_tokens || null,
          success: true,
        });
      } catch (logError) {
        console.error('[GENERATE-AUDIENCE-REFINEMENTS] Failed to log AI usage:', logError);
      }
    }

    console.log("Generated audience refinements:", parsed);

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in generate-audience-refinements:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

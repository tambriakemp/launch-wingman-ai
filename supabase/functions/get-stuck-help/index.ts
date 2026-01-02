import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function logAiUsage(supabase: any, userId: string | null, projectId: string | null, functionName: string, model: string, success: boolean) {
  if (!userId) return;
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { blockingIssue, currentTask, taskContext, projectContext, projectId, userId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const systemPrompt = `You are a supportive, calm business coach helping online entrepreneurs launch their offers. Your role is to help users when they feel stuck on a task.

Your response style:
- Warm and reassuring, never condescending
- Practical and actionable
- Brief but helpful
- Focus on making progress, not perfection

You MUST respond with valid JSON in exactly this format:
{
  "reassurance": "A warm, encouraging message (1-2 sentences) that validates their struggle and builds confidence",
  "steps": ["Step 1...", "Step 2...", "Step 3..."],
  "doThisNow": "One specific, small action they can take in the next 5 minutes to make progress"
}

The "steps" array should have 3-5 simple, actionable steps to break down the task.
Keep each step concise (under 20 words).
The "doThisNow" should be the easiest first action - something they can do immediately.`;

    const userPrompt = `The user is stuck on this task: "${currentTask}"

Why this task matters: ${taskContext || "Not specified"}

What's blocking them: "${blockingIssue}"

${projectContext ? `Additional context about their project: ${projectContext}` : ""}

Please provide encouragement and break this down into simple steps they can follow.`;

    console.log("Calling Lovable AI for stuck help...");

    const model = "google/gemini-2.5-flash";
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      await logAiUsage(supabase, userId, projectId, "get-stuck-help", model, false);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      await logAiUsage(supabase, userId, projectId, "get-stuck-help", model, false);
      throw new Error("No content in AI response");
    }

    console.log("AI response received:", content);

    // Log successful AI usage
    await logAiUsage(supabase, userId, projectId, "get-stuck-help", model, true);

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-stuck-help:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to get help" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

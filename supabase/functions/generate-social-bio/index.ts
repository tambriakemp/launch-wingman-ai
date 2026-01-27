import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bio formulas with their templates
const bioFormulas: Record<string, { name: string; formula: string; fields: string[] }> = {
  "who-result": {
    name: "Who You Help + Result",
    formula: "I help [who] [achieve result] using [method].",
    fields: ["who", "result", "method"],
  },
  "identity-transformation": {
    name: "Identity + Transformation",
    formula: "[Your role/identity] helping [who] go from [pain] → [desired outcome].",
    fields: ["identity", "who", "pain", "outcome"],
  },
  "niche-authority": {
    name: "Niche Authority",
    formula: "[What you're known for] | [specific niche] | [core outcome]",
    fields: ["knownFor", "niche", "outcome"],
  },
  "problem-promise": {
    name: "Problem + Promise",
    formula: "Tired of [problem]?\nI help you [solution/result].",
    fields: ["problem", "solution"],
  },
  "this-is-for-you": {
    name: '"This Is For You If"',
    formula: "For [who] who want [result] without [pain point].",
    fields: ["who", "result", "painPoint"],
  },
  "framework-based": {
    name: "Framework-Based",
    formula: "Helping [who] launch using [named framework or system].",
    fields: ["who", "framework"],
  },
  "results-credibility": {
    name: "Results + Credibility",
    formula: "[Outcome or proof] | Helping [who] do the same",
    fields: ["proof", "who"],
  },
  "lifestyle-business": {
    name: "Lifestyle + Business",
    formula: "Building [lifestyle goal] through [business skill].",
    fields: ["lifestyle", "skill"],
  },
  "short-punchy": {
    name: "Short & Punchy One-Liner",
    formula: "[Bold statement about what you do]",
    fields: ["statement"],
  },
  "value-stack": {
    name: "Value Stack Bio (3-Line)",
    formula: "Line 1: Who you help + result\nLine 2: How you help / what you focus on\nLine 3: CTA",
    fields: ["line1", "line2", "line3"],
  },
  "anti-bio": {
    name: '"Anti-" Bio',
    formula: "Anti-[thing they hate] | Pro-[desired outcome]",
    fields: ["anti", "pro"],
  },
  "cta-first": {
    name: "CTA-First Bio",
    formula: "[Main benefit]\n→ [what to do next]",
    fields: ["benefit", "cta"],
  },
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
    const { projectId, platform, formulaId, fieldData, maxChars, userId } = await req.json();

    if (!projectId || !formulaId) {
      return new Response(
        JSON.stringify({ error: "Missing projectId or formulaId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch project context in parallel
    const [funnelResult, offerResult, projectResult, tasksResult] = await Promise.all([
      supabase
        .from("funnels")
        .select("niche, target_audience, primary_pain_point, desired_outcome, problem_statement")
        .eq("project_id", projectId)
        .maybeSingle(),
      supabase
        .from("offers")
        .select("title, description, transformation_statement")
        .eq("project_id", projectId)
        .eq("slot_type", "core")
        .maybeSingle(),
      supabase
        .from("projects")
        .select("name, transformation_statement")
        .eq("id", projectId)
        .maybeSingle(),
      supabase
        .from("project_tasks")
        .select("task_id, input_data")
        .eq("project_id", projectId)
        .eq("status", "completed")
        .in("task_id", ["core-message", "talking-points", "craft-transformation"]),
    ]);

    const funnel = funnelResult.data;
    const offer = offerResult.data;
    const project = projectResult.data;
    const tasks = tasksResult.data || [];

    // Extract messaging data from tasks
    let coreMessage = "";
    let talkingPoints: string[] = [];
    for (const task of tasks) {
      const inputData = task.input_data as Record<string, any> | null;
      if (task.task_id === "core-message" && inputData?.core_message) {
        coreMessage = inputData.core_message;
      }
      if (task.task_id === "talking-points" && inputData?.talking_points) {
        talkingPoints = inputData.talking_points;
      }
    }

    // Get formula template
    const formula = bioFormulas[formulaId];
    if (!formula) {
      return new Response(
        JSON.stringify({ error: "Unknown formula ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context string
    const contextParts: string[] = [];
    if (funnel?.niche) contextParts.push(`Niche: ${funnel.niche}`);
    if (funnel?.target_audience) contextParts.push(`Target Audience: ${funnel.target_audience}`);
    if (funnel?.primary_pain_point) contextParts.push(`Main Pain Point: ${funnel.primary_pain_point}`);
    if (funnel?.desired_outcome) contextParts.push(`Desired Outcome: ${funnel.desired_outcome}`);
    if (funnel?.problem_statement) contextParts.push(`Problem Statement: ${funnel.problem_statement}`);
    if (project?.transformation_statement) contextParts.push(`Transformation Statement: ${project.transformation_statement}`);
    if (offer?.title) contextParts.push(`Offer: ${offer.title}${offer.description ? ` - ${offer.description}` : ""}`);
    if (offer?.transformation_statement) contextParts.push(`Offer Transformation: ${offer.transformation_statement}`);
    if (coreMessage) contextParts.push(`Core Message: ${coreMessage}`);
    if (talkingPoints.length > 0) contextParts.push(`Key Talking Points: ${talkingPoints.join(", ")}`);

    // Build user hints from provided field data
    const userHints: string[] = [];
    if (fieldData && typeof fieldData === "object") {
      for (const [key, value] of Object.entries(fieldData)) {
        if (value && key !== "finalContent" && typeof value === "string" && value.trim()) {
          userHints.push(`${key}: ${value}`);
        }
      }
    }

    const systemPrompt = `You are an expert at writing high-converting social media bios that capture attention and communicate value clearly.

Your task is to generate a social media bio using this formula:
FORMULA NAME: ${formula.name}
FORMULA TEMPLATE: ${formula.formula}

The bio MUST:
1. Follow the formula structure exactly
2. Be no more than ${maxChars || 150} characters total
3. Be specific and compelling, not generic
4. Sound natural and human, not salesy or pushy
5. Use the project context to make it relevant and specific
6. If the context mentions a specific niche or audience, use those exact terms

${contextParts.length > 0 ? `PROJECT CONTEXT:\n${contextParts.join("\n")}` : "No project context available - create a generic but compelling bio."}

${userHints.length > 0 ? `USER HINTS (use these if provided, they are preferences):\n${userHints.join("\n")}` : ""}

REQUIRED: Return a valid JSON object with this exact structure:
{
  "bio": "The complete bio text (must be under ${maxChars || 150} characters)",
  "fieldData": {
    ${formula.fields.map(f => `"${f}": "value used for this field"`).join(",\n    ")}
  }
}

The fieldData should contain the actual values you used for each formula field.`;

    console.log("Calling Lovable AI for bio generation...");

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
          { role: "user", content: `Generate a ${platform || "social media"} bio using the ${formula.name} formula. Character limit: ${maxChars || 150}` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      await logAiUsage(supabase, userId, projectId, "generate-social-bio", model, false);

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
      await logAiUsage(supabase, userId, projectId, "generate-social-bio", model, false);
      throw new Error("No content in AI response");
    }

    console.log("AI response received:", content);
    await logAiUsage(supabase, userId, projectId, "generate-social-bio", model, true);

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate the response
    if (!parsed.bio || typeof parsed.bio !== "string") {
      throw new Error("Invalid bio in AI response");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-social-bio:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to generate bio",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Natural-language task parser + title suggestions, powered by Lovable AI Gateway.
// Two modes via { mode: "parse" | "suggest" }.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PHASES = [
  "setup",
  "planning",
  "messaging",
  "build",
  "content",
  "pre-launch",
  "launch",
  "post-launch",
] as const;

const LABELS = [
  "technical","creative","copy","video","strategy","marketing",
  "high-priority","can-delegate","quick-win",
  "foundation","content-creation","technical-setup","sales-page",
  "email-marketing","prelaunch-content","launch-prep","launch-execution",
  "delivery","analysis",
] as const;

const PRIORITIES = ["urgent","high","normal","low"] as const;

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(body: Record<string, unknown>) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");
  const resp = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  if (!resp.ok) {
    return { ok: false as const, status: resp.status, text };
  }
  try {
    return { ok: true as const, json: JSON.parse(text) };
  } catch {
    return { ok: false as const, status: 500, text: "Invalid JSON from AI gateway" };
  }
}

function errorResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let body: any = {};
  try {
    const raw = await req.text();
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return errorResponse(400, "Invalid JSON");
  }

  const mode = body.mode === "suggest" ? "suggest" : "parse";
  const today = new Date().toISOString().slice(0, 10);
  const dow = new Date().toLocaleDateString("en-US", { weekday: "long" });

  if (mode === "parse") {
    const input = String(body.input || "").trim();
    if (!input) return errorResponse(400, "input is required");
    if (input.length > 500) return errorResponse(400, "input too long");

    const ai = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            `You are a task parser. Today is ${today} (${dow}). Convert a natural-language sentence into structured task fields. ` +
            `Return ONLY via the function call. due_date must be ISO 8601 (YYYY-MM-DD or full datetime) or null. ` +
            `Title should be a clean, concise Title Case task name (drop date phrases like "by Friday").`,
        },
        { role: "user", content: input },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_task",
            description: "Extract structured fields from a natural-language task description.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Concise task title in Title Case." },
                due_date: { type: ["string", "null"], description: "ISO 8601 date or datetime, or null." },
                phase: { type: ["string", "null"], enum: [...PHASES, null] },
                labels: { type: "array", items: { type: "string", enum: [...LABELS] } },
                priority: { type: ["string", "null"], enum: [...PRIORITIES, null] },
              },
              required: ["title", "labels"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_task" } },
    });

    if (!ai.ok) {
      if (ai.status === 429) return errorResponse(429, "Rate limited, try again shortly.");
      if (ai.status === 402) return errorResponse(402, "AI credits exhausted.");
      return errorResponse(500, `AI error: ${ai.text.slice(0, 200)}`);
    }

    const call = ai.json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) return errorResponse(500, "No tool call returned");

    let parsed: any = {};
    try {
      parsed = JSON.parse(call.function?.arguments || "{}");
    } catch {
      return errorResponse(500, "Could not parse tool arguments");
    }

    return new Response(JSON.stringify({
      title: parsed.title || input.slice(0, 80),
      due_date: parsed.due_date ?? null,
      phase: PHASES.includes(parsed.phase) ? parsed.phase : null,
      labels: Array.isArray(parsed.labels) ? parsed.labels.filter((l: string) => LABELS.includes(l as any)) : [],
      priority: PRIORITIES.includes(parsed.priority) ? parsed.priority : null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // mode === "suggest"
  const partial = String(body.partial || "").trim();
  const phase = body.phase ? String(body.phase) : null;
  const projectName = body.projectName ? String(body.projectName) : null;

  const ai = await callAI({
    model: "google/gemini-2.5-flash-lite",
    messages: [
      {
        role: "system",
        content:
          `You suggest 3-5 short, action-oriented task title completions in Title Case. ` +
          `Each <= 7 words, no trailing periods. Tailor to the user's launch context if provided.`,
      },
      {
        role: "user",
        content:
          `Project: ${projectName || "Untitled"}\nActive phase: ${phase || "unknown"}\n` +
          `User typed: "${partial || "(empty)"}"\nSuggest task titles.`,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "suggest_titles",
          description: "Return 3-5 task title suggestions.",
          parameters: {
            type: "object",
            properties: {
              suggestions: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
            },
            required: ["suggestions"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "suggest_titles" } },
  });

  if (!ai.ok) {
    if (ai.status === 429) return errorResponse(429, "Rate limited");
    if (ai.status === 402) return errorResponse(402, "AI credits exhausted");
    return errorResponse(500, `AI error: ${ai.text.slice(0, 200)}`);
  }

  const call = ai.json?.choices?.[0]?.message?.tool_calls?.[0];
  let suggestions: string[] = [];
  try {
    const args = JSON.parse(call?.function?.arguments || "{}");
    suggestions = Array.isArray(args.suggestions) ? args.suggestions.slice(0, 5) : [];
  } catch { /* ignore */ }

  return new Response(JSON.stringify({ suggestions }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

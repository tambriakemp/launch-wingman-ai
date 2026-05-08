// Generate a small, editorial habit nudge or weekly review using Lovable AI.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface HabitInput {
  name: string;
  frequency: string;
  time_of_day?: string[];
  tag?: string | null;
}
interface CompletionInput {
  habit_id: string;
  completed_date: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Resilient input parse
  const raw = await req.text();
  let payload: any = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = {}; }

  const mode: "daily" | "weekly" = payload.mode === "weekly" ? "weekly" : "daily";
  const habits: HabitInput[] = Array.isArray(payload.habits) ? payload.habits : [];
  const completions: CompletionInput[] = Array.isArray(payload.completions) ? payload.completions : [];

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Build a compact summary
  const last14 = new Set<string>();
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    last14.add(d.toISOString().slice(0, 10));
  }
  const recent = completions.filter(c => last14.has(c.completed_date));
  const summary = habits.map(h => ({
    name: h.name,
    cadence: h.frequency,
    slots: h.time_of_day || [],
    last14_completions: recent.filter(r => (r as any).habit_id && (r as any).habit_id).length,
  }));

  const system = mode === "weekly"
    ? "You are an editorial, calm, slightly literary writing assistant for a habit tracker. Write a Sunday weekly review: 1 short paragraph (max 60 words), warm, observational, never preachy. Reference patterns gently. No emojis."
    : "You are an editorial, calm, slightly literary writing assistant for a habit tracker. Write ONE short nudge (max 28 words). Observational, gentle, never preachy. No emojis. No exclamation points.";

  const user = `Habits and last 14 days of completions:\n${JSON.stringify(summary, null, 2)}\n\nWrite the ${mode} message.`;

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    const text = await r.text();
    if (!r.ok) {
      if (r.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required", text: "AI credits required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "ai_failed", detail: text }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let json: any = {};
    try { json = JSON.parse(text); } catch {}
    const message = json?.choices?.[0]?.message?.content?.trim() ?? "A small promise, kept again, is what makes it a habit.";

    return new Response(JSON.stringify({ message, eyebrow: mode === "weekly" ? "This week" : "Pattern noticed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "exception", detail: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

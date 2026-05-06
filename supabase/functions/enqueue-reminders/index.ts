// Cron-driven: materialize due reminders into public.notifications.
// Runs every minute. Insert trigger enqueues each row to pgmq for dispatch.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 60_000);
  let inserted = 0;

  // 1) Planner tasks with due_at within next minute that aren't completed
  const { data: dueTasks } = await supabase
    .from("tasks")
    .select("id,user_id,title,description,due_at,column_id,project_id")
    .gte("due_at", now.toISOString())
    .lt("due_at", windowEnd.toISOString())
    .neq("column_id", "done");

  for (const t of dueTasks ?? []) {
    const sourceId = `task:${t.id}:${t.due_at}`;
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("source_id", sourceId)
      .maybeSingle();
    if (existing) continue;

    const { error } = await supabase.from("notifications").insert({
      user_id: t.user_id,
      kind: "task_due",
      title: t.title,
      body: t.description ?? "Reminder for your scheduled task",
      deeplink: `/planner?task=${t.id}`,
      data: { task_id: t.id, project_id: t.project_id },
      scheduled_for: t.due_at,
      source_id: sourceId,
    });
    if (!error) inserted++;
  }

  // 2) Habit reminders — daily at 9:00 local UTC (simple v1).
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();
  if (hour === 9 && minute === 0) {
    const today = now.toISOString().slice(0, 10);
    const { data: habits } = await supabase
      .from("habits")
      .select("id,user_id,name,frequency,frequency_days")
      .eq("is_archived", false);

    const dayName = ["sun","mon","tue","wed","thu","fri","sat"][now.getUTCDay()];

    for (const h of habits ?? []) {
      if (h.frequency === "weekly" && h.frequency_days && !h.frequency_days.includes(dayName)) continue;

      const sourceId = `habit:${h.id}:${today}`;
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("source_id", sourceId)
        .maybeSingle();
      if (existing) continue;

      const { error } = await supabase.from("notifications").insert({
        user_id: h.user_id,
        kind: "habit_reminder",
        title: `Don't forget: ${h.name}`,
        body: "Tap to log today's habit.",
        deeplink: `/habits`,
        data: { habit_id: h.id },
        scheduled_for: now.toISOString(),
        source_id: sourceId,
      });
      if (!error) inserted++;
    }
  }

  return new Response(JSON.stringify({ inserted }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

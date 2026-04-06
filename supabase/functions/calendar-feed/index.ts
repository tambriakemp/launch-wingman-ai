import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Look up the connection by feed token
    const { data: connection, error: connError } = await supabase
      .from("calendar_connections")
      .select("user_id")
      .eq("feed_token", token)
      .single();

    if (connError || !connection) {
      return new Response("Invalid or expired feed token", { status: 404 });
    }

    // Fetch user's tasks that have dates
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, description, start_at, end_at, due_at, due_date, location, task_type, column_id")
      .eq("user_id", connection.user_id)
      .neq("column_id", "done");

    if (tasksError) {
      console.error("Failed to fetch tasks:", tasksError);
      return new Response("Internal error", { status: 500 });
    }

    // Build ICS
    const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const events: string[] = [];

    for (const task of tasks || []) {
      // Skip tasks without any date
      if (!task.start_at && !task.due_at && !task.due_date) continue;

      const uid = `${task.id}@launchely.com`;
      const summary = (task.title || "Untitled").replace(/[,;\\]/g, " ");
      const description = (task.description || "").replace(/[,;\\]/g, " ").replace(/\n/g, "\\n");
      const location = (task.location || "").replace(/[,;\\]/g, " ");

      let dtStart: string;
      let dtEnd: string;

      if (task.start_at && task.end_at) {
        // Timed event
        dtStart = `DTSTART:${formatDateTime(task.start_at)}`;
        dtEnd = `DTEND:${formatDateTime(task.end_at)}`;
      } else if (task.due_at) {
        // Due datetime — show as all-day
        const dateStr = task.due_at.substring(0, 10).replace(/-/g, "");
        const nextDay = getNextDay(task.due_at.substring(0, 10));
        dtStart = `DTSTART;VALUE=DATE:${dateStr}`;
        dtEnd = `DTEND;VALUE=DATE:${nextDay}`;
      } else if (task.due_date) {
        // Due date only
        const dateStr = task.due_date.replace(/-/g, "");
        const nextDay = getNextDay(task.due_date);
        dtStart = `DTSTART;VALUE=DATE:${dateStr}`;
        dtEnd = `DTEND;VALUE=DATE:${nextDay}`;
      } else {
        continue;
      }

      const eventLines = [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        dtStart,
        dtEnd,
        `SUMMARY:${summary}`,
      ];

      if (description) eventLines.push(`DESCRIPTION:${description}`);
      if (location) eventLines.push(`LOCATION:${location}`);
      eventLines.push("END:VEVENT");

      events.push(eventLines.join("\r\n"));
    }

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Launchely//Calendar Feed//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Launchely Tasks",
      "X-WR-TIMEZONE:UTC",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");

    return new Response(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="launchely.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Calendar feed error:", error);
    return new Response("Internal error", { status: 500 });
  }
});

function formatDateTime(iso: string): string {
  return iso.replace(/[-:]/g, "").split(".")[0] + "Z";
}

function getNextDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toISOString().substring(0, 10).replace(/-/g, "");
}

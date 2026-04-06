import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Date helpers (no external deps) ──────────────────────────
function addDaysD(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addWeeksD(d: Date, n: number): Date { return addDaysD(d, n * 7); }
function addMonthsD(d: Date, n: number): Date { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }
function addYearsD(d: Date, n: number): Date { const r = new Date(d); r.setFullYear(r.getFullYear() + n); return r; }
function toDateKey(d: Date): string { return d.toISOString().split("T")[0]; }

const DAY_MAP: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

interface Occurrence { date: string; /* YYYY-MM-DD */ }

function expandRecurrences(task: any, windowStart: Date, windowEnd: Date): Occurrence[] {
  const rule = task.recurrence_rule;
  if (!rule || !task.start_at) return [];

  const exceptions = new Set(
    (task.recurrence_exception_dates || []).map((d: string) => d.split("T")[0])
  );

  const baseStart = new Date(task.start_at);
  const freq: string = rule.freq;
  const interval = Math.max(1, rule.interval || 1);
  const hardEnd = rule.end_type === "on_date" && rule.end_date ? new Date(rule.end_date) : null;
  const maxCount = rule.end_type === "after_n" ? rule.count : 500;

  const dates: Occurrence[] = [];

  // Weekly with specific days
  if (freq === "weekly" && rule.days?.length > 0) {
    let weekCursor = new Date(baseStart);
    let weeks = 0;
    const maxWeeks = rule.end_type === "after_n" ? rule.count * 2 : 260;
    while (weeks < maxWeeks) {
      if (weekCursor > windowEnd) break;
      if (hardEnd && weekCursor > hardEnd) break;
      for (const day of rule.days) {
        const dayNum = DAY_MAP[day];
        if (dayNum === undefined) continue;
        const wd = new Date(weekCursor);
        wd.setDate(wd.getDate() + (dayNum - wd.getDay()));
        wd.setHours(baseStart.getHours(), baseStart.getMinutes(), 0, 0);
        if (wd < baseStart) continue;
        if (wd > windowEnd) continue;
        if (hardEnd && wd > hardEnd) continue;
        if (wd < windowStart) continue;
        const dk = toDateKey(wd);
        if (!exceptions.has(dk)) dates.push({ date: dk });
      }
      weekCursor = addWeeksD(weekCursor, interval);
      weeks++;
    }
    return dates;
  }

  // daily / weekly (no specific days) / monthly / yearly
  let cursor = new Date(baseStart);
  let count = 0;
  while (count < maxCount) {
    if (hardEnd && cursor > hardEnd) break;
    if (cursor > windowEnd) break;
    if (cursor >= windowStart) {
      const dk = toDateKey(cursor);
      if (!exceptions.has(dk)) dates.push({ date: dk });
    }
    count++;
    switch (freq) {
      case "daily": cursor = addDaysD(cursor, interval); break;
      case "weekly": cursor = addWeeksD(cursor, interval); break;
      case "monthly": cursor = addMonthsD(cursor, interval); break;
      case "yearly": cursor = addYearsD(cursor, interval); break;
      default: return dates;
    }
  }
  return dates;
}

// ── Token refresh ────────────────────────────────────────────
async function refreshGoogleToken(supabase: any, connection: any): Promise<string | null> {
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET");
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !connection.refresh_token) return null;

  const { data: decryptedRefresh } = await supabase.rpc("decrypt_token", { encrypted_token: connection.refresh_token });
  if (!decryptedRefresh) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: decryptedRefresh,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();

  const { data: encryptedAccess } = await supabase.rpc("encrypt_token", { plain_token: data.access_token });
  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();

  await supabase.from("calendar_connections").update({
    access_token: encryptedAccess,
    token_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq("id", connection.id);

  return data.access_token;
}

async function refreshMicrosoftToken(supabase: any, connection: any): Promise<string | null> {
  const MS_CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID");
  const MS_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET");
  if (!MS_CLIENT_ID || !MS_CLIENT_SECRET || !connection.refresh_token) return null;

  const { data: decryptedRefresh } = await supabase.rpc("decrypt_token", { encrypted_token: connection.refresh_token });
  if (!decryptedRefresh) return null;

  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: MS_CLIENT_ID,
      client_secret: MS_CLIENT_SECRET,
      refresh_token: decryptedRefresh,
      grant_type: "refresh_token",
      scope: "openid profile email offline_access Calendars.ReadWrite",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();

  const { data: encryptedAccess } = await supabase.rpc("encrypt_token", { plain_token: data.access_token });
  const { data: encryptedRefresh } = data.refresh_token
    ? await supabase.rpc("encrypt_token", { plain_token: data.refresh_token })
    : { data: connection.refresh_token };

  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();

  await supabase.from("calendar_connections").update({
    access_token: encryptedAccess,
    refresh_token: encryptedRefresh || connection.refresh_token,
    token_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq("id", connection.id);

  return data.access_token;
}

async function getAccessToken(supabase: any, connection: any): Promise<string | null> {
  const now = new Date();
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;

  if (expiresAt && expiresAt > now) {
    const { data: decrypted } = await supabase.rpc("decrypt_token", { encrypted_token: connection.access_token });
    return decrypted;
  }

  if (connection.provider === "google") return refreshGoogleToken(supabase, connection);
  if (connection.provider === "microsoft") return refreshMicrosoftToken(supabase, connection);

  const { data: decrypted } = await supabase.rpc("decrypt_token", { encrypted_token: connection.access_token });
  return decrypted;
}

// ── Event body helpers ───────────────────────────────────────
function isAllDayTime(isoStr: string): boolean {
  if (!isoStr) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return true;
  if (/T00:00:00/.test(isoStr)) return true;
  return false;
}

function isSemanticAllDay(task: any): boolean {
  if (task.due_at && !task.start_at && !task.end_at) return true;
  if (task.start_at && task.end_at && task.start_at === task.end_at) return true;
  if (task.start_at && task.end_at) {
    if (isAllDayTime(task.start_at) && isAllDayTime(task.end_at)) return true;
  }
  if (task.start_at && !task.end_at && isAllDayTime(task.start_at)) return true;
  if (task.due_at && isAllDayTime(task.due_at)) return true;
  return false;
}

function getDateOnly(isoStr: string): string { return isoStr.substring(0, 10); }

function buildEventBody(task: any) {
  const title = task.title || "Untitled";
  const description = task.description || "";
  let start: string, end: string;
  const allDay = isSemanticAllDay(task);

  if (task.start_at && task.end_at) { start = task.start_at; end = task.end_at; }
  else if (task.start_at) { start = task.start_at; end = task.start_at; }
  else if (task.due_at) { start = task.due_at; end = task.due_at; }
  else { return null; }

  if (allDay) { start = getDateOnly(start); end = getDateOnly(end); }
  return { title, description, start, end, allDay, location: task.location || "" };
}

// ── Provider sync functions ──────────────────────────────────
async function syncToGoogle(accessToken: string, task: any, action: string, existingEventId: string | null) {
  console.log(`[Google Tasks] syncToGoogle — action=${action}, existingEventId=${existingEventId}, taskId=${task?.id}`);
  const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
  const taskListId = "@default";
  const baseUrl = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;

  if (action === "delete" && existingEventId) {
    const res = await fetch(`${baseUrl}/${existingEventId}`, { method: "DELETE", headers });
    console.log(`[Google Tasks] DELETE status=${res.status}`);
    if (!res.ok && res.status !== 404) {
      const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEventId}`, { method: "DELETE", headers });
      await calRes.text();
      return { success: calRes.ok || calRes.status === 404 || calRes.status === 410, eventId: null };
    }
    return { success: res.ok || res.status === 404, eventId: null };
  }

  const ev = buildEventBody(task);
  if (!ev) { console.error(`[Google Tasks] buildEventBody returned null for task ${task?.id}`); return { success: false, eventId: null }; }

  const dateStr = ev.start.substring(0, 10);
  const dueDateTime = `${dateStr}T00:00:00.000Z`;
  const body: any = {
    title: ev.title,
    notes: ev.description || undefined,
    due: dueDateTime,
    status: task.column_id === "done" || task.status === "completed" ? "completed" : "needsAction",
  };
  console.log(`[Google Tasks] body:`, JSON.stringify(body));

  if (action === "update" && existingEventId) {
    const res = await fetch(`${baseUrl}/${existingEventId}`, { method: "PATCH", headers, body: JSON.stringify(body) });
    console.log(`[Google Tasks] PATCH status=${res.status}`);
    if (res.status === 404 || res.status === 400) {
      const createRes = await fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(body) });
      const createData = await createRes.json();
      return { success: createRes.ok, eventId: createData.id || null };
    }
    const data = await res.json();
    return { success: res.ok, eventId: data.id || existingEventId };
  }

  const res = await fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json();
  console.log(`[Google Tasks] POST status=${res.status}`, res.ok ? `id=${data.id}` : JSON.stringify(data));
  return { success: res.ok, eventId: data.id || null };
}

async function syncToMicrosoft(accessToken: string, task: any, action: string, existingEventId: string | null) {
  const baseUrl = "https://graph.microsoft.com/v1.0/me/events";
  const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

  if (action === "delete" && existingEventId) {
    const res = await fetch(`${baseUrl}/${existingEventId}`, { method: "DELETE", headers });
    return { success: res.ok || res.status === 404, eventId: null };
  }

  const ev = buildEventBody(task);
  if (!ev) return { success: false, eventId: null };
  const body: any = {
    subject: ev.title,
    body: { contentType: "Text", content: ev.description },
    location: { displayName: ev.location },
    isAllDay: ev.allDay,
  };

  if (ev.allDay) {
    const dateStr = ev.start.substring(0, 10);
    body.start = { dateTime: `${dateStr}T00:00:00`, timeZone: "UTC" };
    const endDate = new Date(dateStr); endDate.setDate(endDate.getDate() + 1);
    body.end = { dateTime: `${endDate.toISOString().substring(0, 10)}T00:00:00`, timeZone: "UTC" };
  } else {
    body.start = { dateTime: ev.start, timeZone: "UTC" };
    body.end = { dateTime: ev.end, timeZone: "UTC" };
  }

  if (action === "update" && existingEventId) {
    const res = await fetch(`${baseUrl}/${existingEventId}`, { method: "PATCH", headers, body: JSON.stringify(body) });
    const data = await res.json();
    return { success: res.ok, eventId: data.id || existingEventId };
  }

  const res = await fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json();
  return { success: res.ok, eventId: data.id || null };
}

async function syncToApple(connection: any, supabase: any, task: any, action: string, existingEventId: string | null) {
  const { data: password } = await supabase.rpc("decrypt_token", { encrypted_token: connection.access_token });
  const email = connection.account_email;
  if (!password || !email) return { success: false, eventId: null };

  const caldavBase = "https://caldav.icloud.com";
  const calendarPath = connection.calendar_id || `/${email}/calendars/home/`;
  const eventUid = existingEventId || crypto.randomUUID();
  const eventUrl = `${caldavBase}${calendarPath}${eventUid}.ics`;
  const authHeader = "Basic " + btoa(`${email}:${password}`);

  if (action === "delete" && existingEventId) {
    const res = await fetch(eventUrl, { method: "DELETE", headers: { Authorization: authHeader } });
    return { success: res.ok || res.status === 404, eventId: null };
  }

  const ev = buildEventBody(task);
  if (!ev) return { success: false, eventId: null };
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let dtStart: string, dtEnd: string;
  if (ev.allDay) {
    dtStart = `DTSTART;VALUE=DATE:${ev.start.substring(0, 10).replace(/-/g, "")}`;
    const endDate = new Date(ev.start.substring(0, 10)); endDate.setDate(endDate.getDate() + 1);
    dtEnd = `DTEND;VALUE=DATE:${endDate.toISOString().substring(0, 10).replace(/-/g, "")}`;
  } else {
    dtStart = `DTSTART:${ev.start.replace(/[-:]/g, "").split(".")[0]}Z`;
    dtEnd = `DTEND:${ev.end.replace(/[-:]/g, "").split(".")[0]}Z`;
  }

  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Launchely//Calendar//EN",
    "BEGIN:VEVENT", `UID:${eventUid}`, `DTSTAMP:${now}`, dtStart, dtEnd,
    `SUMMARY:${ev.title}`, `DESCRIPTION:${ev.description}`,
    ev.location ? `LOCATION:${ev.location}` : "", "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const res = await fetch(eventUrl, {
    method: "PUT",
    headers: { Authorization: authHeader, "Content-Type": "text/calendar; charset=utf-8", "If-None-Match": action === "create" ? "*" : "" },
    body: ics,
  });
  return { success: res.ok || res.status === 201, eventId: eventUid };
}

// ── Sync a single occurrence to all providers ────────────────
async function syncOccurrence(
  supabase: any, userId: string, parentTaskId: string, task: any,
  action: string, occurrenceDate: string | null, connections: any[]
) {
  const results: any[] = [];

  for (const conn of connections) {
    try {
      // Look up existing mapping for this task + connection + occurrence_date
      let mappingQuery = supabase
        .from("calendar_sync_mappings")
        .select("*")
        .eq("task_id", parentTaskId)
        .eq("calendar_connection_id", conn.id);
      
      if (occurrenceDate) {
        mappingQuery = mappingQuery.eq("occurrence_date", occurrenceDate);
      } else {
        mappingQuery = mappingQuery.is("occurrence_date", null);
      }

      const { data: mapping } = await mappingQuery.maybeSingle();
      const existingEventId = mapping?.external_event_id || null;

      const accessToken = await getAccessToken(supabase, conn);
      if (!accessToken && conn.provider !== "apple") {
        results.push({ provider: conn.provider, success: false, error: "Token refresh failed" });
        continue;
      }

      let result: { success: boolean; eventId: string | null };
      switch (conn.provider) {
        case "google": result = await syncToGoogle(accessToken!, task, action, existingEventId); break;
        case "microsoft": result = await syncToMicrosoft(accessToken!, task, action, existingEventId); break;
        case "apple": result = await syncToApple(conn, supabase, task, action, existingEventId); break;
        default: continue;
      }

      if (result.success) {
        if (action === "delete") {
          if (mapping) await supabase.from("calendar_sync_mappings").delete().eq("id", mapping.id);
        } else if (result.eventId) {
          await supabase.from("calendar_sync_mappings").upsert(
            {
              user_id: userId,
              task_id: parentTaskId,
              provider: conn.provider,
              external_event_id: result.eventId,
              calendar_connection_id: conn.id,
              occurrence_date: occurrenceDate,
              last_synced_at: new Date().toISOString(),
            },
            { onConflict: "task_id,calendar_connection_id,occurrence_date" }
          );
        }
      }
      results.push({ provider: conn.provider, success: result.success, occurrenceDate });
    } catch (err) {
      console.error(`Sync error for ${conn.provider}:`, err);
      results.push({ provider: conn.provider, success: false, error: String(err) });
    }
  }
  return results;
}

// ── Main handler ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { task_id, action } = await req.json();
    if (!task_id || !action || !["create", "update", "delete"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: connections } = await supabase
      .from("calendar_connections")
      .select("*")
      .eq("user_id", user.id);

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ success: true, synced: 0, message: "No calendar connections" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Delete: remove ALL occurrence mappings for this parent task ──
    if (action === "delete") {
      const { data: mappings } = await supabase
        .from("calendar_sync_mappings")
        .select("*")
        .eq("task_id", task_id)
        .eq("user_id", user.id);

      let deleted = 0;
      for (const mapping of (mappings || [])) {
        const conn = connections.find((c: any) => c.id === mapping.calendar_connection_id);
        if (!conn) continue;
        const accessToken = await getAccessToken(supabase, conn);
        if (!accessToken && conn.provider !== "apple") continue;

        if (conn.provider === "google") {
          const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
          const taskListId = "@default";
          const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${mapping.external_event_id}`, { method: "DELETE", headers });
          if (res.ok || res.status === 404 || res.status === 410) deleted++;
          else {
            const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${mapping.external_event_id}`, { method: "DELETE", headers });
            if (calRes.ok || calRes.status === 404 || calRes.status === 410) deleted++;
          }
        } else {
          const url = `https://graph.microsoft.com/v1.0/me/events/${mapping.external_event_id}`;
          const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } });
          if (res.ok || res.status === 404 || res.status === 410) deleted++;
        }
        await supabase.from("calendar_sync_mappings").delete().eq("id", mapping.id);
      }

      return new Response(JSON.stringify({ success: true, deleted, results: [{ action: "delete", deleted }] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Create / Update ──
    const { data: taskData } = await supabase.from("tasks").select("*").eq("id", task_id).single();
    if (!taskData) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allResults: any[] = [];

    if (taskData.recurrence_rule) {
      // Recurring: expand occurrences for next 90 days
      const windowStart = new Date();
      const windowEnd = addDaysD(windowStart, 90);
      const occurrences = expandRecurrences(taskData, windowStart, windowEnd);
      console.log(`[sync-calendar-event] Recurring task ${task_id}: ${occurrences.length} occurrences in 90-day window`);

      for (const occ of occurrences) {
        // Build a virtual task with the occurrence date
        const virtualTask = {
          ...taskData,
          due_at: `${occ.date}T00:00:00.000Z`,
          start_at: taskData.start_at ? `${occ.date}T${taskData.start_at.substring(11)}` : null,
          end_at: taskData.end_at ? `${occ.date}T${taskData.end_at.substring(11)}` : null,
        };
        const occResults = await syncOccurrence(supabase, user.id, task_id, virtualTask, action, occ.date, connections);
        allResults.push(...occResults);
      }
    } else {
      // Non-recurring: single sync with null occurrence_date
      const occResults = await syncOccurrence(supabase, user.id, task_id, taskData, action, null, connections);
      allResults.push(...occResults);
    }

    return new Response(JSON.stringify({ success: true, synced: allResults.filter(r => r.success).length, results: allResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync calendar event error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

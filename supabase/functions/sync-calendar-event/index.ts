import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  // If token is still valid, decrypt and return it
  if (expiresAt && expiresAt > now) {
    const { data: decrypted } = await supabase.rpc("decrypt_token", { encrypted_token: connection.access_token });
    return decrypted;
  }

  // Token expired, refresh it
  if (connection.provider === "google") return refreshGoogleToken(supabase, connection);
  if (connection.provider === "microsoft") return refreshMicrosoftToken(supabase, connection);

  // Apple: decrypt stored password
  const { data: decrypted } = await supabase.rpc("decrypt_token", { encrypted_token: connection.access_token });
  return decrypted;
}

function isSemanticAllDay(task: any): boolean {
  // Due-only (no start/end) → always all-day
  if (task.due_at && !task.start_at && !task.end_at) return true;
  // Same start+end timestamp → treat as all-day
  if (task.start_at && task.end_at && task.start_at === task.end_at) return true;
  // Both timestamps at same hour+minute → all-day (covers midnight in any TZ)
  if (task.start_at && task.end_at) {
    const s = new Date(task.start_at);
    const e = new Date(task.end_at);
    if (s.getUTCHours() === e.getUTCHours() && s.getUTCMinutes() === e.getUTCMinutes() &&
        s.getUTCHours() === 0 && s.getUTCMinutes() === 0) return true;
  }
  return false;
}

function getDateOnly(isoStr: string): string {
  // Extract the YYYY-MM-DD portion from the ISO string
  return isoStr.substring(0, 10);
}

function buildEventBody(task: any) {
  const title = task.title || "Untitled";
  const description = task.description || "";

  // Determine start/end
  let start: string, end: string;
  const allDay = isSemanticAllDay(task);

  if (task.start_at && task.end_at) {
    start = task.start_at;
    end = task.end_at;
  } else if (task.start_at) {
    start = task.start_at;
    end = task.start_at;
  } else if (task.due_at) {
    start = task.due_at;
    end = task.due_at;
  } else {
    // No date info — skip syncing
    return null;
  }

  // For all-day events, use the date portion only
  if (allDay) {
    start = getDateOnly(start);
    end = getDateOnly(end);
  }

  return { title, description, start, end, allDay, location: task.location || "" };
}

async function getOrCreateLaunchelyCalendar(accessToken: string): Promise<string> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // Check if "Launchely" calendar already exists
  const listRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", { headers });
  if (listRes.ok) {
    const listData = await listRes.json();
    const existing = (listData.items || []).find((c: any) => c.summary === "Launchely");
    if (existing) {
      console.log("Found existing Launchely calendar:", existing.id);
      return existing.id;
    }
  } else {
    console.error("Failed to list calendars:", listRes.status, await listRes.text());
  }

  // Create the calendar
  console.log("Creating Launchely calendar...");
  const createRes = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
    method: "POST",
    headers,
    body: JSON.stringify({ summary: "Launchely", description: "Tasks synced from Launchely", timeZone: "UTC" }),
  });

  if (createRes.ok) {
    const created = await createRes.json();
    console.log("Created Launchely calendar:", created.id);
    return created.id;
  }

  console.error("Failed to create Launchely calendar:", createRes.status, await createRes.text());
  // Fallback to primary
  return "primary";
}

async function syncToGoogle(accessToken: string, task: any, action: string, existingEventId: string | null) {
  const calendarId = await getOrCreateLaunchelyCalendar(accessToken);
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  if (action === "delete" && existingEventId) {
    const res = await fetch(`${baseUrl}/${existingEventId}`, { method: "DELETE", headers });
    return { success: res.ok || res.status === 404, eventId: null };
  }

  const ev = buildEventBody(task);
  if (!ev) return { success: false, eventId: null };

  const body: any = {
    summary: ev.title,
    description: ev.description,
    location: ev.location,
  };

  if (ev.allDay) {
    const dateStr = ev.start.substring(0, 10);
    body.start = { date: dateStr };
    const endDate = new Date(dateStr);
    endDate.setDate(endDate.getDate() + 1);
    body.end = { date: endDate.toISOString().substring(0, 10) };
  } else {
    body.start = { dateTime: ev.start };
    body.end = { dateTime: ev.end };
  }

  if (action === "update" && existingEventId) {
    const res = await fetch(`${baseUrl}/${existingEventId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { success: res.ok, eventId: data.id || existingEventId };
  }

  const res = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { success: res.ok, eventId: data.id || null };
}

async function syncToMicrosoft(accessToken: string, task: any, action: string, existingEventId: string | null) {
  const baseUrl = "https://graph.microsoft.com/v1.0/me/events";
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

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
    const endDate = new Date(dateStr);
    endDate.setDate(endDate.getDate() + 1);
    body.end = { dateTime: `${endDate.toISOString().substring(0, 10)}T00:00:00`, timeZone: "UTC" };
  } else {
    body.start = { dateTime: ev.start, timeZone: "UTC" };
    body.end = { dateTime: ev.end, timeZone: "UTC" };
  }

  if (action === "update" && existingEventId) {
    const res = await fetch(`${baseUrl}/${existingEventId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { success: res.ok, eventId: data.id || existingEventId };
  }

  const res = await fetch(baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { success: res.ok, eventId: data.id || null };
}

async function syncToApple(connection: any, supabase: any, task: any, action: string, existingEventId: string | null) {
  // Apple CalDAV sync
  const { data: password } = await supabase.rpc("decrypt_token", { encrypted_token: connection.access_token });
  const email = connection.account_email;
  if (!password || !email) return { success: false, eventId: null };

  const caldavBase = "https://caldav.icloud.com";
  const calendarPath = connection.calendar_id || `/${email}/calendars/home/`;
  const eventUid = existingEventId || crypto.randomUUID();
  const eventUrl = `${caldavBase}${calendarPath}${eventUid}.ics`;

  const authHeader = "Basic " + btoa(`${email}:${password}`);

  if (action === "delete" && existingEventId) {
    const res = await fetch(eventUrl, {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });
    return { success: res.ok || res.status === 404, eventId: null };
  }

  const ev = buildEventBody(task);
  if (!ev) return { success: false, eventId: null };
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let dtStart: string, dtEnd: string;
  if (ev.allDay) {
    dtStart = `DTSTART;VALUE=DATE:${ev.start.substring(0, 10).replace(/-/g, "")}`;
    const endDate = new Date(ev.start.substring(0, 10));
    endDate.setDate(endDate.getDate() + 1);
    dtEnd = `DTEND;VALUE=DATE:${endDate.toISOString().substring(0, 10).replace(/-/g, "")}`;
  } else {
    dtStart = `DTSTART:${ev.start.replace(/[-:]/g, "").split(".")[0]}Z`;
    dtEnd = `DTEND:${ev.end.replace(/[-:]/g, "").split(".")[0]}Z`;
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Launchely//Calendar//EN",
    "BEGIN:VEVENT",
    `UID:${eventUid}`,
    `DTSTAMP:${now}`,
    dtStart,
    dtEnd,
    `SUMMARY:${ev.title}`,
    `DESCRIPTION:${ev.description}`,
    ev.location ? `LOCATION:${ev.location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const res = await fetch(eventUrl, {
    method: "PUT",
    headers: {
      Authorization: authHeader,
      "Content-Type": "text/calendar; charset=utf-8",
      "If-None-Match": action === "create" ? "*" : "",
    },
    body: ics,
  });

  return { success: res.ok || res.status === 201, eventId: eventUid };
}

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
      return new Response(JSON.stringify({ error: "Invalid request. Requires task_id and action (create/update/delete)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's calendar connections
    const { data: connections } = await supabase
      .from("calendar_connections")
      .select("*")
      .eq("user_id", user.id);

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ success: true, synced: 0, message: "No calendar connections" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the task data (skip for delete if we have mappings)
    let task = null;
    if (action !== "delete") {
      const { data: taskData } = await supabase.from("tasks").select("*").eq("id", task_id).single();
      if (!taskData) {
        return new Response(JSON.stringify({ error: "Task not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      task = taskData;
    }

    const results: any[] = [];

    for (const conn of connections) {
      try {
        // Get existing mapping
        const { data: mapping } = await supabase
          .from("calendar_sync_mappings")
          .select("*")
          .eq("task_id", task_id)
          .eq("calendar_connection_id", conn.id)
          .maybeSingle();

        const existingEventId = mapping?.external_event_id || null;

        // Get access token (with auto-refresh)
        const accessToken = await getAccessToken(supabase, conn);
        if (!accessToken && conn.provider !== "apple") {
          console.error(`Failed to get access token for ${conn.provider}`);
          results.push({ provider: conn.provider, success: false, error: "Token refresh failed" });
          continue;
        }

        let result: { success: boolean; eventId: string | null };

        switch (conn.provider) {
          case "google":
            result = await syncToGoogle(accessToken!, task, action, existingEventId);
            break;
          case "microsoft":
            result = await syncToMicrosoft(accessToken!, task, action, existingEventId);
            break;
          case "apple":
            result = await syncToApple(conn, supabase, task, action, existingEventId);
            break;
          default:
            continue;
        }

        if (result.success) {
          if (action === "delete") {
            // Remove mapping
            if (mapping) {
              await supabase.from("calendar_sync_mappings").delete().eq("id", mapping.id);
            }
          } else if (result.eventId) {
            // Upsert mapping
            await supabase.from("calendar_sync_mappings").upsert(
              {
                user_id: user.id,
                task_id,
                provider: conn.provider,
                external_event_id: result.eventId,
                calendar_connection_id: conn.id,
                last_synced_at: new Date().toISOString(),
              },
              { onConflict: "task_id,calendar_connection_id" }
            );
          }
        }

        results.push({ provider: conn.provider, success: result.success });
      } catch (err) {
        console.error(`Sync error for ${conn.provider}:`, err);
        results.push({ provider: conn.provider, success: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ success: true, synced: results.filter(r => r.success).length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync calendar event error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

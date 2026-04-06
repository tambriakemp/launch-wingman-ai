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
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { connection_id } = await req.json();
    if (!connection_id) {
      return new Response(JSON.stringify({ error: "connection_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the connection
    const { data: connection } = await supabase
      .from("calendar_connections")
      .select("*")
      .eq("id", connection_id)
      .eq("user_id", user.id)
      .single();

    if (!connection) {
      return new Response(JSON.stringify({ error: "Connection not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all sync mappings for this connection
    const { data: mappings } = await supabase
      .from("calendar_sync_mappings")
      .select("id, external_event_id")
      .eq("calendar_connection_id", connection_id);

    if (!mappings || mappings.length === 0) {
      // No events to delete, just clean up
      await supabase.from("calendar_connections").delete().eq("id", connection_id);
      return new Response(JSON.stringify({ success: true, deleted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let deleted = 0;
    let failed = 0;

    if (connection.provider === "google" || connection.provider === "microsoft") {
      const accessToken = await getAccessToken(supabase, connection);
      
      if (accessToken) {
        for (const mapping of mappings) {
          try {
            let url: string;
            if (connection.provider === "google") {
              // Try to find the Launchely calendar first, fall back to primary
              let calendarId = "primary";
              const listRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (listRes.ok) {
                const listData = await listRes.json();
                const launchely = (listData.items || []).find((c: any) => c.summary === "Launchely");
                if (launchely) calendarId = launchely.id;
              }
              url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${mapping.external_event_id}`;
            } else {
              url = `https://graph.microsoft.com/v1.0/me/events/${mapping.external_event_id}`;
            }

            const res = await fetch(url, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (res.ok || res.status === 404 || res.status === 410) {
              deleted++;
            } else {
              failed++;
            }
          } catch {
            failed++;
          }
        }
      }
    }

    // Delete all mappings and the connection
    await supabase.from("calendar_sync_mappings").delete().eq("calendar_connection_id", connection_id);
    await supabase.from("calendar_connections").delete().eq("id", connection_id);

    return new Response(JSON.stringify({ success: true, deleted, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Disconnect calendar error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

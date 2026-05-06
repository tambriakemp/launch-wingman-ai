// Drains the push_dispatch pgmq queue and sends FCM (iOS/Android) + Web Push.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FCM_SERVICE_ACCOUNT = Deno.env.get("FCM_SERVICE_ACCOUNT");
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@launchely.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

// ---------- FCM helpers ----------
let cachedToken: { token: string; expires: number } | null = null;

async function getFcmAccessToken(): Promise<{ token: string; projectId: string } | null> {
  if (!FCM_SERVICE_ACCOUNT) return null;
  const sa = JSON.parse(FCM_SERVICE_ACCOUNT);
  if (cachedToken && cachedToken.expires > Date.now()) {
    return { token: cachedToken.token, projectId: sa.project_id };
  }

  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
  const iat = Math.floor(Date.now() / 1000);
  const claim = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp: iat + 3600,
  })).replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");

  const unsigned = `${header}.${claim}`;
  const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const keyBytes = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8", keyBytes, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
  const sigB64 = btoa(String.fromCharCode(...sig)).replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
  const jwt = `${unsigned}.${sigB64}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const body = await resp.text();
  if (!resp.ok) { console.error("FCM token error", body); return null; }
  const json = JSON.parse(body);
  cachedToken = { token: json.access_token, expires: Date.now() + (json.expires_in - 60) * 1000 };
  return { token: cachedToken.token, projectId: sa.project_id };
}

async function sendFcm(deviceToken: string, title: string, body: string, data: Record<string, string>) {
  const auth = await getFcmAccessToken();
  if (!auth) return { ok: false, status: 500 };
  const resp = await fetch(`https://fcm.googleapis.com/v1/projects/${auth.projectId}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: { token: deviceToken, notification: { title, body }, data },
    }),
  });
  return { ok: resp.ok, status: resp.status, text: await resp.text() };
}

async function sendWebPush(subscriptionJson: string, payload: object) {
  if (!VAPID_PUBLIC) return { ok: false, status: 500 };
  try {
    const sub = JSON.parse(subscriptionJson);
    await webpush.sendNotification(sub, JSON.stringify(payload));
    return { ok: true, status: 201 };
  } catch (e: any) {
    return { ok: false, status: e?.statusCode ?? 500, text: String(e?.body ?? e?.message ?? e) };
  }
}

// ---------- Worker ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  let processed = 0;

  // Drain up to 25 messages
  for (let i = 0; i < 25; i++) {
    const { data: msgs, error: readErr } = await supabase.rpc("read_email_batch", {
      queue_name: "push_dispatch", batch_size: 1, vt: 60,
    });
    if (readErr) { console.error("read err", readErr); break; }
    if (!msgs || msgs.length === 0) break;
    const msg = msgs[0];
    const notificationId = (msg.message as any)?.notification_id;
    if (!notificationId) {
      await supabase.rpc("delete_email", { queue_name: "push_dispatch", message_id: msg.msg_id });
      continue;
    }

    const { data: notif } = await supabase
      .from("notifications").select("*").eq("id", notificationId).maybeSingle();
    if (!notif || notif.delivered_at) {
      await supabase.rpc("delete_email", { queue_name: "push_dispatch", message_id: msg.msg_id });
      continue;
    }

    const { data: devices } = await supabase
      .from("push_devices").select("*").eq("user_id", notif.user_id).is("disabled_at", null);

    const data = {
      kind: notif.kind,
      url: notif.deeplink ?? "/",
      ...Object.fromEntries(Object.entries(notif.data ?? {}).map(([k, v]) => [k, String(v)])),
    };

    let anySuccess = false;
    for (const d of devices ?? []) {
      let result;
      if (d.platform === "ios" || d.platform === "android") {
        result = await sendFcm(d.token, notif.title, notif.body ?? "", data);
      } else {
        result = await sendWebPush(d.token, {
          title: notif.title, body: notif.body, data,
        });
      }
      if (result.ok) { anySuccess = true; }
      else if (result.status === 404 || result.status === 410) {
        await supabase.from("push_devices").update({ disabled_at: new Date().toISOString() }).eq("id", d.id);
      } else {
        console.error("push send failed", d.platform, result.status, (result as any).text);
      }
    }

    await supabase.from("notifications")
      .update({ delivered_at: anySuccess ? new Date().toISOString() : null })
      .eq("id", notif.id);
    await supabase.rpc("delete_email", { queue_name: "push_dispatch", message_id: msg.msg_id });
    processed++;
  }

  return new Response(JSON.stringify({ processed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

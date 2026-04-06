import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL = Deno.env.get("APP_URL") || "https://launchely.com";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      console.error("Google OAuth error:", error);
      return Response.redirect(`${APP_URL}/settings?gcal_error=${encodeURIComponent(error)}`);
    }

    if (!code || !stateParam) {
      return Response.redirect(`${APP_URL}/settings?gcal_error=missing_params`);
    }

    let userId: string;
    try {
      const stateData = JSON.parse(atob(stateParam));
      userId = stateData.user_id;
    } catch {
      return Response.redirect(`${APP_URL}/settings?gcal_error=invalid_state`);
    }

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return Response.redirect(`${APP_URL}/settings?gcal_error=config_error`);
    }

    const callbackUrl = `${SUPABASE_URL}/functions/v1/google-calendar-auth-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return Response.redirect(`${APP_URL}/settings?gcal_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user email
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userInfo = userInfoResponse.ok ? await userInfoResponse.json() : {};

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Encrypt tokens
    const { data: encryptedAccess } = await supabase.rpc("encrypt_token", { plain_token: access_token });
    const { data: encryptedRefresh } = refresh_token
      ? await supabase.rpc("encrypt_token", { plain_token: refresh_token })
      : { data: null };

    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

    // Upsert calendar connection
    const { error: upsertError } = await supabase
      .from("calendar_connections")
      .upsert(
        {
          user_id: userId,
          provider: "google",
          access_token: encryptedAccess,
          refresh_token: encryptedRefresh,
          token_expires_at: expiresAt,
          calendar_id: "primary",
          account_email: userInfo.email || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

    if (upsertError) {
      console.error("Failed to save connection:", upsertError);
      return Response.redirect(`${APP_URL}/settings?gcal_error=save_failed`);
    }

    console.log(`Google Calendar connected for user ${userId.substring(0, 8)}...`);
    return Response.redirect(`${APP_URL}/settings?gcal_connected=true`);
  } catch (error) {
    console.error("Google Calendar callback error:", error);
    return Response.redirect(`${APP_URL}/settings?gcal_error=internal_error`);
  }
});

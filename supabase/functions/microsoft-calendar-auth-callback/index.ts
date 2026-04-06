import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL = Deno.env.get("APP_URL") || "https://launchely.com";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      console.error("Microsoft OAuth error:", error, errorDescription);
      return Response.redirect(`${APP_URL}/settings?mscal_error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !stateParam) {
      return Response.redirect(`${APP_URL}/settings?mscal_error=missing_params`);
    }

    let userId: string;
    try {
      const stateData = JSON.parse(atob(stateParam));
      userId = stateData.user_id;
    } catch {
      return Response.redirect(`${APP_URL}/settings?mscal_error=invalid_state`);
    }

    const MS_CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID");
    const MS_CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MS_CLIENT_ID || !MS_CLIENT_SECRET) {
      return Response.redirect(`${APP_URL}/settings?mscal_error=config_error`);
    }

    const callbackUrl = `${SUPABASE_URL}/functions/v1/microsoft-calendar-auth-callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
        scope: "openid profile email offline_access Calendars.ReadWrite",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return Response.redirect(`${APP_URL}/settings?mscal_error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user profile for email
    const profileResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = profileResponse.ok ? await profileResponse.json() : {};

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Encrypt tokens
    const { data: encryptedAccess } = await supabase.rpc("encrypt_token", { plain_token: access_token });
    const { data: encryptedRefresh } = refresh_token
      ? await supabase.rpc("encrypt_token", { plain_token: refresh_token })
      : { data: null };

    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from("calendar_connections")
      .upsert(
        {
          user_id: userId,
          provider: "microsoft",
          access_token: encryptedAccess,
          refresh_token: encryptedRefresh,
          token_expires_at: expiresAt,
          calendar_id: "primary",
          account_email: profile.mail || profile.userPrincipalName || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

    if (upsertError) {
      console.error("Failed to save connection:", upsertError);
      return Response.redirect(`${APP_URL}/settings?mscal_error=save_failed`);
    }

    console.log(`Microsoft Calendar connected for user ${userId.substring(0, 8)}...`);
    return Response.redirect(`${APP_URL}/settings?mscal_connected=true`);
  } catch (error) {
    console.error("Microsoft Calendar callback error:", error);
    return Response.redirect(`${APP_URL}/settings?mscal_error=internal_error`);
  }
});

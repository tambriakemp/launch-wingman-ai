import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshTikTokToken(supabase: any, userId: string, refreshToken: string, platform: string): Promise<string | null> {
  const isSandbox = platform === "tiktok_sandbox";
  console.log(`[POST-TO-TIKTOK-PHOTO] refreshTikTokToken called - platform: ${platform}, isSandbox: ${isSandbox}`);
  
  const clientKey = isSandbox 
    ? Deno.env.get("TIKTOK_SANDBOX_CLIENT_KEY") 
    : Deno.env.get("TIKTOK_CLIENT_KEY");
  const clientSecret = isSandbox 
    ? Deno.env.get("TIKTOK_SANDBOX_CLIENT_SECRET") 
    : Deno.env.get("TIKTOK_CLIENT_SECRET");

  if (!clientKey || !clientSecret) {
    console.error(`[POST-TO-TIKTOK-PHOTO] Missing TikTok ${isSandbox ? 'sandbox ' : 'production '}credentials`);
    return null;
  }

  const { data: decryptedRefresh, error: decryptError } = await supabase
    .rpc("decrypt_token", { encrypted_token: refreshToken });

  if (decryptError || !decryptedRefresh) {
    console.error("Failed to decrypt refresh token:", decryptError);
    return null;
  }

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: decryptedRefresh,
    }),
  });

  const data = await response.json();

  if (data.error || !data.access_token) {
    console.error("Token refresh failed:", data);
    return null;
  }

  const { data: encryptedAccess } = await supabase
    .rpc("encrypt_token", { plain_token: data.access_token });

  const { data: encryptedRefresh } = await supabase
    .rpc("encrypt_token", { plain_token: data.refresh_token });

  const tokenExpiry = new Date(Date.now() + data.expires_in * 1000).toISOString();
  
  await supabase
    .from("social_connections")
    .update({
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      token_expires_at: tokenExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("platform", platform);

  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      photoUrls,
      title,
      caption,
      privacyLevel = "PUBLIC_TO_EVERYONE",
      disableComment = true,
      autoAddMusic = false,
    } = await req.json();

    if (!photoUrls || !Array.isArray(photoUrls) || photoUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one photo URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (photoUrls.length > 35) {
      return new Response(
        JSON.stringify({ error: "Maximum 35 photos allowed per post" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!title || title.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Title is required for photo posts" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting TikTok photo upload:", { photoCount: photoUrls.length, title });

    // Get TikTok connection
    const { data: connections, error: connectionError } = await supabase
      .from("social_connections")
      .select("*")
      .eq("user_id", user.id)
      .in("platform", ["tiktok", "tiktok_sandbox"])
      .limit(1);

    if (connectionError || !connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ error: "TikTok not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const connection = connections[0];
    const isSandbox = connection.platform === "tiktok_sandbox";
    
    console.log(`[POST-TO-TIKTOK-PHOTO] Connection platform: ${connection.platform}, isSandbox: ${isSandbox}`);
    
    // For sandbox/unaudited apps, TikTok requires SELF_ONLY privacy
    // Always force SELF_ONLY for sandbox, and allow frontend to pass it for unaudited production apps
    const effectivePrivacyLevel = isSandbox ? "SELF_ONLY" : privacyLevel;
    console.log(`[POST-TO-TIKTOK-PHOTO] Using privacy_level: ${effectivePrivacyLevel}`);
    
    let accessToken: string;

    const tokenExpiry = new Date(connection.token_expires_at);
    if (tokenExpiry <= new Date()) {
      console.log("Token expired, refreshing...");
      const newToken = await refreshTikTokToken(supabase, user.id, connection.refresh_token, connection.platform);
      if (!newToken) {
        return new Response(
          JSON.stringify({ error: "Failed to refresh TikTok token. Please reconnect your account." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      accessToken = newToken;
    } else {
      const { data: decryptedToken, error: decryptError } = await supabase
        .rpc("decrypt_token", { encrypted_token: connection.access_token });

      if (decryptError || !decryptedToken) {
        return new Response(
          JSON.stringify({ error: "Failed to retrieve credentials" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      accessToken = decryptedToken;
    }

    // Initialize photo post with PULL_FROM_URL
    console.log("Initializing TikTok photo upload with PULL_FROM_URL...");
    const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        media_type: "PHOTO",
        post_mode: "DIRECT_POST",
        post_info: {
          title: title.slice(0, 90),
          description: caption || "",
          privacy_level: effectivePrivacyLevel,
          disable_comment: disableComment,
          auto_add_music: autoAddMusic,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_images: photoUrls,
          photo_cover_index: 0,
        },
      }),
    });

    const initData = await initResponse.json();
    console.log("[POST-TO-TIKTOK-PHOTO] TikTok init response:", JSON.stringify(initData, null, 2));

    if (initData.error?.code && initData.error.code !== "ok") {
      console.error("[POST-TO-TIKTOK-PHOTO] TikTok init error:", initData.error);
      return new Response(
        JSON.stringify({ 
          error: initData.error.message || "Failed to initialize photo post",
          tiktok_error: initData.error
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publishId = initData.data?.publish_id;

    if (!publishId) {
      console.error("No publish_id in response:", initData);
      return new Response(
        JSON.stringify({ error: "Failed to get publish ID from TikTok" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Got publish_id: ${publishId}, polling for status...`);

    // Poll for publish status
    let attempts = 0;
    const maxAttempts = 30;
    let status = "PROCESSING";

    while (status === "PROCESSING" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;

      const statusResponse = await fetch(
        `https://open.tiktokapis.com/v2/post/publish/status/fetch/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publish_id: publishId }),
        }
      );

      const statusData = await statusResponse.json();
      status = statusData.data?.status || "UNKNOWN";
      console.log(`Poll attempt ${attempts}: status = ${status}`);

      if (status === "PUBLISH_COMPLETE") {
        console.log("TikTok photo published successfully");
        return new Response(
          JSON.stringify({
            success: true,
            publishId,
            message: "Photo published to TikTok successfully!",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (status === "FAILED") {
        console.error("TikTok publish failed:", statusData);
        return new Response(
          JSON.stringify({
            error: statusData.data?.fail_reason || "Photo publish failed",
            tiktok_error: statusData.data
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        publishId,
        status: "PROCESSING",
        message: "Photo is still processing. It may take a few minutes to appear on TikTok.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in post-to-tiktok-photo:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

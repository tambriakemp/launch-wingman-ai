import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshTikTokToken(supabase: any, userId: string, refreshToken: string, platform: string): Promise<string | null> {
  // Use sandbox credentials for sandbox connections
  const isSandbox = platform === "tiktok_sandbox";
  const clientKey = isSandbox 
    ? Deno.env.get("TIKTOK_SANDBOX_CLIENT_KEY") 
    : Deno.env.get("TIKTOK_CLIENT_KEY");
  const clientSecret = isSandbox 
    ? Deno.env.get("TIKTOK_SANDBOX_CLIENT_SECRET") 
    : Deno.env.get("TIKTOK_CLIENT_SECRET");

  if (!clientKey || !clientSecret) {
    console.error(`Missing TikTok ${isSandbox ? 'sandbox ' : ''}credentials for token refresh`);
    return null;
  }

  // Decrypt refresh token
  const { data: decryptedRefresh, error: decryptError } = await supabase
    .rpc("decrypt_token", { encrypted_token: refreshToken });

  if (decryptError || !decryptedRefresh) {
    console.error("Failed to decrypt refresh token:", decryptError);
    return null;
  }

  // Request new token
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

  // Encrypt new tokens - use correct parameter name: plain_token
  const { data: encryptedAccess } = await supabase
    .rpc("encrypt_token", { plain_token: data.access_token });

  const { data: encryptedRefresh } = await supabase
    .rpc("encrypt_token", { plain_token: data.refresh_token });

  // Update database with dynamic platform
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
  // Handle CORS preflight requests
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

    // Verify auth token
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

    // Parse request body
    const { videoUrl, caption, privacyLevel = "PUBLIC_TO_EVERYONE" } = await req.json();

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "Video URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting TikTok upload for video:", videoUrl);

    // Get TikTok connection (support both production and sandbox)
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
    let accessToken: string;

    // Check if token is expired
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
      // Decrypt access token
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

    // Step 1: Download the video to get its size and bytes
    console.log("Downloading video from URL...");
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      console.error("Failed to download video:", videoResponse.status, videoResponse.statusText);
      return new Response(
        JSON.stringify({ error: "Failed to download video from storage" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const videoBytes = await videoResponse.arrayBuffer();
    const videoSize = videoBytes.byteLength;
    const contentType = videoResponse.headers.get("content-type") || "video/mp4";
    console.log(`Video downloaded: ${videoSize} bytes, content-type: ${contentType}`);

    // Step 2: Initialize video post with FILE_UPLOAD
    console.log("Initializing TikTok upload with FILE_UPLOAD...");
    const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: caption || "",
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: videoSize, // Single chunk upload
          total_chunk_count: 1,
        },
      }),
    });

    const initData = await initResponse.json();
    console.log("TikTok init response:", JSON.stringify(initData));

    if (initData.error?.code) {
      console.error("TikTok init error:", initData);
      return new Response(
        JSON.stringify({ 
          error: initData.error.message || "Failed to initialize video post",
          tiktok_error: initData.error
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publishId = initData.data?.publish_id;
    const uploadUrl = initData.data?.upload_url;

    if (!publishId || !uploadUrl) {
      console.error("No publish_id or upload_url in response:", initData);
      return new Response(
        JSON.stringify({ error: "Failed to get upload URL from TikTok" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Got publish_id: ${publishId}, uploading to: ${uploadUrl}`);

    // Step 3: Upload the video bytes to TikTok
    console.log("Uploading video bytes to TikTok...");
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Content-Length": videoSize.toString(),
        "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
      },
      body: videoBytes,
    });

    console.log("Upload response status:", uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      console.error("TikTok upload failed:", uploadResponse.status, uploadError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to upload video to TikTok",
          details: uploadError
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Video upload successful, polling for status...");

    // Step 4: Poll for publish status (TikTok processes videos async)
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
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
        console.log("TikTok video published successfully");
        return new Response(
          JSON.stringify({
            success: true,
            publishId,
            message: "Video published to TikTok successfully!",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else if (status === "FAILED") {
        console.error("TikTok publish failed:", statusData);
        return new Response(
          JSON.stringify({
            error: statusData.data?.fail_reason || "Video publish failed",
            tiktok_error: statusData.data
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If we're still processing after max attempts, return pending status
    return new Response(
      JSON.stringify({
        success: true,
        publishId,
        status: "PROCESSING",
        message: "Video is still processing. It may take a few minutes to appear on TikTok.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in post-to-tiktok:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
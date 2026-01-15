import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function refreshTikTokToken(supabase: any, userId: string, refreshToken: string, platform: string): Promise<string | null> {
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
    const isSandbox = connection.platform === "tiktok_sandbox";
    
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

    // For sandbox, return fixed values (sandbox doesn't support creator_info query)
    if (isSandbox) {
      console.log("Sandbox mode: returning fixed creator info");
      return new Response(
        JSON.stringify({
          is_sandbox: true,
          creator_avatar_url: null,
          creator_username: connection.account_name || "Sandbox User",
          creator_nickname: connection.account_name || "Sandbox User",
          privacy_level_options: ["SELF_ONLY"],
          comment_disabled: false,
          duet_disabled: false,
          stitch_disabled: false,
          max_video_post_duration_sec: 600,
          message: "Sandbox mode: Posts will be private (Only Me) until your app is approved by TikTok."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query creator info from TikTok API for production
    console.log("Querying TikTok creator info...");
    const creatorInfoResponse = await fetch(
      "https://open.tiktokapis.com/v2/post/publish/creator_info/query/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({}),
      }
    );

    const creatorInfoData = await creatorInfoResponse.json();
    console.log("TikTok creator info response:", JSON.stringify(creatorInfoData));

    // Check for errors (but "ok" is success)
    if (creatorInfoData.error?.code && creatorInfoData.error.code !== "ok") {
      console.error("TikTok creator info error:", creatorInfoData);
      return new Response(
        JSON.stringify({
          error: creatorInfoData.error.message || "Failed to get creator info",
          tiktok_error: creatorInfoData.error
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const creatorInfo = creatorInfoData.data;

    // Check if stored account_name looks like an open_id (fallback value from failed user info fetch)
    const storedName = connection.account_name || "";
    const looksLikeOpenId = storedName.match(/^[a-zA-Z0-9_-]{20,}$/) && !storedName.includes(" ");
    
    let displayUsername = creatorInfo?.creator_username || connection.account_name;
    let displayNickname = creatorInfo?.creator_nickname || connection.account_name;
    let displayAvatar = creatorInfo?.creator_avatar_url || connection.avatar_url || null;

    // If the stored name looks like an open_id, try to fetch the real username
    if (looksLikeOpenId) {
      console.log("Stored account_name looks like open_id, attempting to fetch real username...");
      try {
        const userResponse = await fetch(
          "https://open.tiktokapis.com/v2/user/info/?fields=display_name,username,avatar_url",
          { 
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` } 
          }
        );
        const userData = await userResponse.json();
        console.log("User info response:", JSON.stringify(userData));
        
        if (userData.data?.user?.display_name || userData.data?.user?.username) {
          const newUsername = userData.data.user.username || userData.data.user.display_name;
          const newNickname = userData.data.user.display_name || userData.data.user.username;
          const newAvatar = userData.data.user.avatar_url;
          
          console.log("Found real username, updating database:", newUsername);
          
          // Update the database with correct username
          await supabase
            .from("social_connections")
            .update({ 
              account_name: newUsername,
              avatar_url: newAvatar || connection.avatar_url 
            })
            .eq("user_id", user.id)
            .eq("platform", connection.platform);
          
          // Use the new values in response
          displayUsername = newUsername;
          displayNickname = newNickname;
          displayAvatar = newAvatar || displayAvatar;
        }
      } catch (e) {
        console.log("Could not fetch updated user info:", e);
      }
    }

    return new Response(
      JSON.stringify({
        is_sandbox: false,
        creator_avatar_url: displayAvatar,
        creator_username: displayUsername,
        creator_nickname: displayNickname,
        privacy_level_options: creatorInfo?.privacy_level_options || ["PUBLIC_TO_EVERYONE", "SELF_ONLY"],
        comment_disabled: creatorInfo?.comment_disabled || false,
        duet_disabled: creatorInfo?.duet_disabled || false,
        stitch_disabled: creatorInfo?.stitch_disabled || false,
        max_video_post_duration_sec: creatorInfo?.max_video_post_duration_sec || 600,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in tiktok-creator-info:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

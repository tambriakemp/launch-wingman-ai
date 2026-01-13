import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to wait for media container processing
async function waitForContainerReady(
  containerId: string,
  accessToken: string,
  maxAttempts = 30
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://graph.threads.net/v1.0/${containerId}?fields=status&access_token=${accessToken}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Container ${containerId} status: ${data.status}`);
      
      if (data.status === "FINISHED") {
        return true;
      } else if (data.status === "ERROR") {
        throw new Error("Media container processing failed");
      }
    }
    
    // Wait 2 seconds before next check
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  
  throw new Error("Timeout waiting for media container to be ready");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("User verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { 
      text,
      imageUrl,
      videoUrl,
      mediaType = "TEXT", // TEXT, IMAGE, VIDEO
      replyToId, // Optional: for reply threads
    } = body;

    console.log(`Post to Threads request from user ${user.id.substring(0, 8)}... type: ${mediaType}`);

    // Get Threads connection
    const { data: connection, error: connError } = await supabase
      .from("social_connections_decrypted")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "threads")
      .single();

    if (connError || !connection) {
      console.error("No Threads connection found:", connError);
      return new Response(
        JSON.stringify({ error: "Threads not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = connection.access_token;
    const threadsUserId = connection.account_id;

    if (!accessToken || !threadsUserId) {
      return new Response(
        JSON.stringify({ error: "Invalid Threads connection" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired
    if (connection.token_expires_at) {
      const expiresAt = new Date(connection.token_expires_at);
      if (expiresAt < new Date()) {
        console.error("Threads token expired");
        return new Response(
          JSON.stringify({ error: "Threads token expired. Please reconnect your account." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let postId: string;

    // Step 1: Create media container
    console.log("Creating Threads media container...");
    
    const containerBody: Record<string, string> = {
      media_type: mediaType,
      text: text || "",
      access_token: accessToken,
    };

    // Add media URL if provided
    if (mediaType === "IMAGE" && imageUrl) {
      containerBody.image_url = imageUrl;
    } else if (mediaType === "VIDEO" && videoUrl) {
      containerBody.video_url = videoUrl;
    }

    // Add reply_to_id if this is a reply
    if (replyToId) {
      containerBody.reply_to_id = replyToId;
    }

    const containerResponse = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(containerBody),
      }
    );

    if (!containerResponse.ok) {
      const errorText = await containerResponse.text();
      console.error("Failed to create Threads container:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create post", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const containerData = await containerResponse.json();
    const containerId = containerData.id;
    console.log("Created Threads container:", containerId);

    // Step 2: Wait for processing if it's a media post
    if (mediaType !== "TEXT") {
      await waitForContainerReady(containerId, accessToken, mediaType === "VIDEO" ? 60 : 30);
    }

    // Step 3: Publish the thread
    console.log("Publishing Threads post...");
    const publishResponse = await fetch(
      `https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      console.error("Failed to publish Threads post:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to publish post", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publishData = await publishResponse.json();
    postId = publishData.id;

    // Get the permalink
    const permalinkResponse = await fetch(
      `https://graph.threads.net/v1.0/${postId}?fields=permalink&access_token=${accessToken}`
    );
    
    let postUrl = null;
    if (permalinkResponse.ok) {
      const permalinkData = await permalinkResponse.json();
      postUrl = permalinkData.permalink;
    }

    console.log(`Posted to Threads successfully! ID: ${postId}, URL: ${postUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        postId, 
        postUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Post to Threads error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
      `https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Container ${containerId} status: ${data.status_code}`);
      
      if (data.status_code === "FINISHED") {
        return true;
      } else if (data.status_code === "ERROR") {
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
      caption, 
      imageUrl, 
      imageUrls, // For carousel posts
      videoUrl,
      mediaType = "image", // "image", "carousel", "video", or "story"
      postType = "feed" // "feed", "reel", or "story"
    } = body;

    console.log(`Post to Instagram request from user ${user.id.substring(0, 8)}... type: ${mediaType}, postType: ${postType}`);

    // Get Instagram connection
    const { data: connection, error: connError } = await supabase
      .from("social_connections_decrypted")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "instagram")
      .single();

    if (connError || !connection) {
      console.error("No Instagram connection found:", connError);
      return new Response(
        JSON.stringify({ error: "Instagram not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = connection.access_token;
    const instagramAccountId = connection.account_id;

    if (!accessToken || !instagramAccountId) {
      return new Response(
        JSON.stringify({ error: "Invalid Instagram connection" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired
    if (connection.token_expires_at) {
      const expiresAt = new Date(connection.token_expires_at);
      if (expiresAt < new Date()) {
        console.error("Instagram token expired");
        return new Response(
          JSON.stringify({ error: "Instagram token expired. Please reconnect your account." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let postId: string;
    let postUrl: string;

    if (mediaType === "image" && imageUrl) {
      // Single image post
      console.log("Creating single image post...");
      
      // Step 1: Create media container
      const containerResponse = await fetch(
        `https://graph.facebook.com/v21.0/${instagramAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: caption || "",
            access_token: accessToken,
          }),
        }
      );

      if (!containerResponse.ok) {
        const errorText = await containerResponse.text();
        console.error("Failed to create container:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to create media container", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const containerData = await containerResponse.json();
      const containerId = containerData.id;
      console.log("Created container:", containerId);

      // Step 2: Wait for container to be ready (usually instant for images)
      await waitForContainerReady(containerId, accessToken);

      // Step 3: Publish the container
      const publishResponse = await fetch(
        `https://graph.facebook.com/v21.0/${instagramAccountId}/media_publish`,
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
        console.error("Failed to publish:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to publish post", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const publishData = await publishResponse.json();
      postId = publishData.id;

    } else if (mediaType === "carousel" && imageUrls && imageUrls.length > 0) {
      // Carousel post
      console.log(`Creating carousel post with ${imageUrls.length} images...`);
      
      // Step 1: Create container for each image
      const childrenIds: string[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const containerResponse = await fetch(
          `https://graph.facebook.com/v21.0/${instagramAccountId}/media`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: imageUrls[i],
              is_carousel_item: true,
              access_token: accessToken,
            }),
          }
        );

        if (!containerResponse.ok) {
          const errorText = await containerResponse.text();
          console.error(`Failed to create carousel item ${i}:`, errorText);
          return new Response(
            JSON.stringify({ error: `Failed to create carousel item ${i + 1}`, details: errorText }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const containerData = await containerResponse.json();
        childrenIds.push(containerData.id);
        console.log(`Created carousel item ${i + 1}:`, containerData.id);
      }

      // Wait for all containers to be ready
      for (const childId of childrenIds) {
        await waitForContainerReady(childId, accessToken);
      }

      // Step 2: Create carousel container
      const carouselResponse = await fetch(
        `https://graph.facebook.com/v21.0/${instagramAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            media_type: "CAROUSEL",
            children: childrenIds.join(","),
            caption: caption || "",
            access_token: accessToken,
          }),
        }
      );

      if (!carouselResponse.ok) {
        const errorText = await carouselResponse.text();
        console.error("Failed to create carousel container:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to create carousel", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const carouselData = await carouselResponse.json();
      console.log("Created carousel container:", carouselData.id);

      // Step 3: Publish carousel
      const publishResponse = await fetch(
        `https://graph.facebook.com/v21.0/${instagramAccountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: carouselData.id,
            access_token: accessToken,
          }),
        }
      );

      if (!publishResponse.ok) {
        const errorText = await publishResponse.text();
        console.error("Failed to publish carousel:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to publish carousel", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const publishData = await publishResponse.json();
      postId = publishData.id;

    } else if ((mediaType === "video" && videoUrl) || postType === "reel") {
      // Reel/Video post
      const videoUrlToUse = videoUrl || imageUrl; // imageUrl might contain video for reels
      if (!videoUrlToUse) {
        return new Response(
          JSON.stringify({ error: "Reels require a video URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log("Creating reel post...");
      
      // Step 1: Create video container
      const containerResponse = await fetch(
        `https://graph.facebook.com/v21.0/${instagramAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            media_type: "REELS",
            video_url: videoUrlToUse,
            caption: caption || "",
            access_token: accessToken,
          }),
        }
      );

      if (!containerResponse.ok) {
        const errorText = await containerResponse.text();
        console.error("Failed to create reel container:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to create reel container", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const containerData = await containerResponse.json();
      console.log("Created reel container:", containerData.id);

      // Step 2: Wait for video processing (can take longer)
      await waitForContainerReady(containerData.id, accessToken, 60);

      // Step 3: Publish reel
      const publishResponse = await fetch(
        `https://graph.facebook.com/v21.0/${instagramAccountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: containerData.id,
            access_token: accessToken,
          }),
        }
      );

      if (!publishResponse.ok) {
        const errorText = await publishResponse.text();
        console.error("Failed to publish reel:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to publish reel", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const publishData = await publishResponse.json();
      postId = publishData.id;

    } else if (postType === "story") {
      // Story post (image or video)
      console.log("Creating story post...");
      
      const isStoryVideo = mediaType === "video" || !!videoUrl;
      const storyMediaUrl = videoUrl || imageUrl;
      
      if (!storyMediaUrl) {
        return new Response(
          JSON.stringify({ error: "Stories require an image or video URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Step 1: Create story container
      const containerBody: Record<string, string> = {
        media_type: "STORIES",
        access_token: accessToken,
      };
      
      if (isStoryVideo) {
        containerBody.video_url = storyMediaUrl;
      } else {
        containerBody.image_url = storyMediaUrl;
      }
      
      const containerResponse = await fetch(
        `https://graph.facebook.com/v21.0/${instagramAccountId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(containerBody),
        }
      );

      if (!containerResponse.ok) {
        const errorText = await containerResponse.text();
        console.error("Failed to create story container:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to create story container", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const containerData = await containerResponse.json();
      console.log("Created story container:", containerData.id);

      // Step 2: Wait for processing
      await waitForContainerReady(containerData.id, accessToken, isStoryVideo ? 60 : 30);

      // Step 3: Publish story
      const publishResponse = await fetch(
        `https://graph.facebook.com/v21.0/${instagramAccountId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: containerData.id,
            access_token: accessToken,
          }),
        }
      );

      if (!publishResponse.ok) {
        const errorText = await publishResponse.text();
        console.error("Failed to publish story:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to publish story", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const publishData = await publishResponse.json();
      postId = publishData.id;

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid media type or missing media URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get permalink for the post
    const permalinkResponse = await fetch(
      `https://graph.facebook.com/v21.0/${postId}?fields=permalink&access_token=${accessToken}`
    );
    
    if (permalinkResponse.ok) {
      const permalinkData = await permalinkResponse.json();
      postUrl = permalinkData.permalink;
    } else {
      postUrl = `https://www.instagram.com/p/${postId}`;
    }

    console.log(`Posted successfully! ID: ${postId}, URL: ${postUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        postId, 
        postUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Post to Instagram error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sanitize ID for logging (show only first 8 chars)
const sanitizeId = (id: string) => id ? `${id.substring(0, 8)}...` : 'unknown';

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
      message,
      imageUrl,
      imageUrls, // For multi-image posts
      videoUrl,
      link,
      postType = "feed" // "feed", "photo", "video", "link"
    } = body;

    console.log(`[POST-TO-FACEBOOK] Request from user ${sanitizeId(user.id)}, type: ${postType}`);

    // Get Facebook connection
    const { data: connection, error: connError } = await supabase
      .from("social_connections_decrypted")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "facebook")
      .single();

    if (connError || !connection) {
      console.error("[POST-TO-FACEBOOK] No connection found:", connError);
      return new Response(
        JSON.stringify({ error: "Facebook not connected" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = connection.access_token;
    const pageId = connection.page_id || connection.account_id;

    if (!accessToken || !pageId) {
      return new Response(
        JSON.stringify({ error: "Invalid Facebook connection" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired
    if (connection.token_expires_at) {
      const expiresAt = new Date(connection.token_expires_at);
      if (expiresAt < new Date()) {
        console.error("[POST-TO-FACEBOOK] Token expired");
        return new Response(
          JSON.stringify({ error: "Facebook token expired. Please reconnect your account." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    let postId: string;
    let postUrl: string;

    if (postType === "video" && videoUrl) {
      // Video post
      console.log("[POST-TO-FACEBOOK] Creating video post...");
      
      const videoResponse = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/videos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_url: videoUrl,
            description: message || "",
            access_token: accessToken,
          }),
        }
      );

      if (!videoResponse.ok) {
        const errorText = await videoResponse.text();
        console.error("[POST-TO-FACEBOOK] Video post failed:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to post video", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const videoData = await videoResponse.json();
      postId = videoData.id;
      
    } else if ((postType === "photo" || imageUrl) && !imageUrls?.length) {
      // Single photo post
      console.log("[POST-TO-FACEBOOK] Creating photo post...");
      
      const photoResponse = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/photos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: imageUrl,
            caption: message || "",
            access_token: accessToken,
          }),
        }
      );

      if (!photoResponse.ok) {
        const errorText = await photoResponse.text();
        console.error("[POST-TO-FACEBOOK] Photo post failed:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to post photo", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const photoData = await photoResponse.json();
      postId = photoData.post_id || photoData.id;
      
    } else if (imageUrls && imageUrls.length > 1) {
      // Multi-photo post
      console.log(`[POST-TO-FACEBOOK] Creating multi-photo post with ${imageUrls.length} images...`);
      
      // Step 1: Upload each photo as unpublished
      const attachedMedia: { media_fbid: string }[] = [];
      
      for (let i = 0; i < imageUrls.length; i++) {
        const uploadResponse = await fetch(
          `https://graph.facebook.com/v21.0/${pageId}/photos`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: imageUrls[i],
              published: false,
              access_token: accessToken,
            }),
          }
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(`[POST-TO-FACEBOOK] Failed to upload photo ${i + 1}:`, errorText);
          return new Response(
            JSON.stringify({ error: `Failed to upload photo ${i + 1}`, details: errorText }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const uploadData = await uploadResponse.json();
        attachedMedia.push({ media_fbid: uploadData.id });
        console.log(`[POST-TO-FACEBOOK] Uploaded photo ${i + 1}: ${uploadData.id}`);
      }

      // Step 2: Create feed post with attached media
      const feedBody: Record<string, any> = {
        message: message || "",
        access_token: accessToken,
      };
      
      // Add attached_media array
      attachedMedia.forEach((media, idx) => {
        feedBody[`attached_media[${idx}]`] = JSON.stringify(media);
      });

      const feedResponse = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(feedBody).toString(),
        }
      );

      if (!feedResponse.ok) {
        const errorText = await feedResponse.text();
        console.error("[POST-TO-FACEBOOK] Multi-photo post failed:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to create multi-photo post", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const feedData = await feedResponse.json();
      postId = feedData.id;
      
    } else if (link) {
      // Link post
      console.log("[POST-TO-FACEBOOK] Creating link post...");
      
      const linkResponse = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message || "",
            link: link,
            access_token: accessToken,
          }),
        }
      );

      if (!linkResponse.ok) {
        const errorText = await linkResponse.text();
        console.error("[POST-TO-FACEBOOK] Link post failed:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to post link", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const linkData = await linkResponse.json();
      postId = linkData.id;
      
    } else {
      // Text-only post
      console.log("[POST-TO-FACEBOOK] Creating text post...");
      
      if (!message?.trim()) {
        return new Response(
          JSON.stringify({ error: "Message is required for text posts" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const textResponse = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message,
            access_token: accessToken,
          }),
        }
      );

      if (!textResponse.ok) {
        const errorText = await textResponse.text();
        console.error("[POST-TO-FACEBOOK] Text post failed:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to post", details: errorText }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const textData = await textResponse.json();
      postId = textData.id;
    }

    // Construct post URL
    // Facebook post IDs are in format pageId_postId
    const postIdPart = postId.includes('_') ? postId.split('_')[1] : postId;
    postUrl = `https://www.facebook.com/${pageId}/posts/${postIdPart}`;

    console.log(`[POST-TO-FACEBOOK] Posted successfully! ID: ${postId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        postId, 
        postUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[POST-TO-FACEBOOK] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

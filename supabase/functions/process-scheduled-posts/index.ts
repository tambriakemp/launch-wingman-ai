 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 // Platform-specific posting functions
 interface PostResult {
   success: boolean;
   error?: string;
   details?: any;
 }
 
 interface SocialConnection {
   id: string;
   platform: string;
   access_token: string;
   refresh_token: string | null;
   account_id: string | null;
   account_name: string | null;
   page_id: string | null;
   token_expires_at: string | null;
 }
 
 // Helper to wait for media container processing (Instagram/Threads)
 async function waitForContainerReady(
   containerId: string,
   accessToken: string,
   apiBase: string,
   maxAttempts = 30
 ): Promise<boolean> {
   for (let i = 0; i < maxAttempts; i++) {
     const response = await fetch(
       `${apiBase}/${containerId}?fields=status_code,status&access_token=${accessToken}`
     );
     
     if (response.ok) {
       const data = await response.json();
       const status = data.status_code || data.status;
       console.log(`[PROCESS-SCHEDULED] Container ${containerId} status: ${status}`);
       
       if (status === "FINISHED") {
         return true;
       } else if (status === "ERROR") {
         throw new Error("Media container processing failed");
       }
     }
     
     await new Promise((resolve) => setTimeout(resolve, 2000));
   }
   
   throw new Error("Timeout waiting for media container to be ready");
 }
 
 // Pinterest posting
 async function postToPinterest(
  connection: SocialConnection,
   postData: any
 ): Promise<PostResult> {
   try {
    const accessToken = connection.access_token;
    const boardId = postData.board_id;
    const mediaUrl = postData.media_url || postData.imageUrl;
    
    if (!boardId) {
      return { success: false, error: "Board ID is required for Pinterest" };
    }
    if (!mediaUrl) {
      return { success: false, error: "Media URL is required for Pinterest" };
     }
 
    const pinData: any = {
      board_id: boardId,
      media_source: {
        source_type: "image_url",
        url: mediaUrl,
      },
    };
 
    if (postData.title) {
      pinData.title = postData.title.substring(0, 100);
    }
    if (postData.description || postData.caption) {
      pinData.description = (postData.description || postData.caption).substring(0, 500);
    }
    if (postData.link) {
      try {
        const parsedLink = new URL(postData.link.trim());
        if (["http:", "https:"].includes(parsedLink.protocol)) {
          pinData.link = postData.link.trim();
        }
      } catch { /* ignore invalid links */ }
    }
 
    const response = await fetch("https://api.pinterest.com/v5/pins", {
       method: "POST",
       headers: {
        "Authorization": `Bearer ${accessToken}`,
         "Content-Type": "application/json",
       },
      body: JSON.stringify(pinData),
     });
 
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[PROCESS-SCHEDULED] Pinterest API error:", errorText);
      return { success: false, error: `Pinterest API error: ${response.status}`, details: errorText };
     }
 
    const pinResult = await response.json();
    return { 
      success: true, 
      details: { 
        pin_id: pinResult.id, 
        pin_url: `https://www.pinterest.com/pin/${pinResult.id}/` 
      } 
    };
   } catch (error) {
     const message = error instanceof Error ? error.message : "Unknown error";
     return { success: false, error: message };
   }
 }
 
 // Instagram posting
 async function postToInstagram(
  connection: SocialConnection,
   postData: any
 ): Promise<PostResult> {
   try {
    const accessToken = connection.access_token;
    const instagramAccountId = connection.account_id;
    const caption = postData.caption || postData.description || "";
    const imageUrl = postData.imageUrl || postData.media_url;
    const videoUrl = postData.videoUrl;
    const mediaType = postData.mediaType || "image";
 
    if (!instagramAccountId) {
      return { success: false, error: "Instagram account ID not found" };
    }
 
    let containerId: string;
    const isVideo = mediaType === "video" || !!videoUrl;
    const mediaUrl = videoUrl || imageUrl;
 
    if (!mediaUrl) {
      return { success: false, error: "Media URL is required for Instagram" };
    }
 
    // Step 1: Create media container
    const containerBody: Record<string, string> = {
      caption,
      access_token: accessToken,
    };
 
    if (isVideo) {
      containerBody.media_type = "REELS";
      containerBody.video_url = mediaUrl;
    } else {
      containerBody.image_url = mediaUrl;
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
      return { success: false, error: "Failed to create Instagram container", details: errorText };
    }
 
    const containerData = await containerResponse.json();
    containerId = containerData.id;
 
    // Step 2: Wait for processing
    await waitForContainerReady(
      containerId, 
      accessToken, 
      "https://graph.facebook.com/v21.0",
      isVideo ? 60 : 30
    );
 
    // Step 3: Publish
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
      return { success: false, error: "Failed to publish Instagram post", details: errorText };
    }
 
    const publishData = await publishResponse.json();
    const postId = publishData.id;
 
    // Get permalink
    let postUrl = `https://www.instagram.com/p/${postId}`;
    try {
      const permalinkResponse = await fetch(
        `https://graph.facebook.com/v21.0/${postId}?fields=permalink&access_token=${accessToken}`
      );
      if (permalinkResponse.ok) {
        const permalinkData = await permalinkResponse.json();
        postUrl = permalinkData.permalink || postUrl;
      }
    } catch { /* use default URL */ }
 
    return { success: true, details: { postId, postUrl } };
   } catch (error) {
     const message = error instanceof Error ? error.message : "Unknown error";
     return { success: false, error: message };
   }
 }
 
 // Facebook posting
 async function postToFacebook(
  connection: SocialConnection,
   postData: any
 ): Promise<PostResult> {
   try {
    const accessToken = connection.access_token;
    const pageId = connection.page_id || connection.account_id;
    const message = postData.caption || postData.description || postData.message || "";
    const imageUrl = postData.imageUrl || postData.media_url;
    const videoUrl = postData.videoUrl;
    const link = postData.link;
 
    if (!pageId) {
      return { success: false, error: "Facebook page ID not found" };
    }
 
    let postId: string;
 
    if (videoUrl) {
      // Video post
      const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: videoUrl,
          description: message,
          access_token: accessToken,
        }),
      });
 
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: "Failed to post Facebook video", details: errorText };
      }
 
      const data = await response.json();
      postId = data.id;
    } else if (imageUrl) {
      // Photo post
      const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          caption: message,
          access_token: accessToken,
        }),
      });
 
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: "Failed to post Facebook photo", details: errorText };
      }
 
      const data = await response.json();
      postId = data.post_id || data.id;
    } else if (link) {
      // Link post
      const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          link,
          access_token: accessToken,
        }),
      });
 
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: "Failed to post Facebook link", details: errorText };
      }
 
      const data = await response.json();
      postId = data.id;
    } else if (message.trim()) {
      // Text-only post
      const response = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          access_token: accessToken,
        }),
      });
 
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: "Failed to post to Facebook", details: errorText };
      }
 
      const data = await response.json();
      postId = data.id;
    } else {
      return { success: false, error: "No content to post to Facebook" };
    }
 
    const postIdPart = postId.includes("_") ? postId.split("_")[1] : postId;
    const postUrl = `https://www.facebook.com/${pageId}/posts/${postIdPart}`;
 
    return { success: true, details: { postId, postUrl } };
   } catch (error) {
     const message = error instanceof Error ? error.message : "Unknown error";
     return { success: false, error: message };
   }
 }
 
 // Threads posting
 async function postToThreads(
  connection: SocialConnection,
   postData: any
 ): Promise<PostResult> {
   try {
    const accessToken = connection.access_token;
    const threadsUserId = connection.account_id;
    const text = postData.caption || postData.description || postData.text || "";
    const imageUrl = postData.imageUrl || postData.media_url;
    const videoUrl = postData.videoUrl;
 
    if (!threadsUserId) {
      return { success: false, error: "Threads account ID not found" };
    }
 
    let mediaType = "TEXT";
    if (videoUrl) mediaType = "VIDEO";
    else if (imageUrl) mediaType = "IMAGE";
 
    // Step 1: Create container
    const containerBody: Record<string, string> = {
      media_type: mediaType,
      text,
      access_token: accessToken,
    };
 
    if (mediaType === "IMAGE" && imageUrl) {
      containerBody.image_url = imageUrl;
    } else if (mediaType === "VIDEO" && videoUrl) {
      containerBody.video_url = videoUrl;
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
      return { success: false, error: "Failed to create Threads container", details: errorText };
    }
 
    const containerData = await containerResponse.json();
    const containerId = containerData.id;
 
    // Step 2: Wait for processing if media
    if (mediaType !== "TEXT") {
      await waitForContainerReady(
        containerId,
        accessToken,
        "https://graph.threads.net/v1.0",
        mediaType === "VIDEO" ? 60 : 30
      );
    }
 
    // Step 3: Publish
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
      return { success: false, error: "Failed to publish Threads post", details: errorText };
    }
 
    const publishData = await publishResponse.json();
    const postId = publishData.id;
 
    // Get permalink
    let postUrl = null;
    try {
      const permalinkResponse = await fetch(
        `https://graph.threads.net/v1.0/${postId}?fields=permalink&access_token=${accessToken}`
      );
      if (permalinkResponse.ok) {
        const permalinkData = await permalinkResponse.json();
        postUrl = permalinkData.permalink;
      }
    } catch { /* ignore */ }
 
    return { success: true, details: { postId, postUrl } };
   } catch (error) {
     const message = error instanceof Error ? error.message : "Unknown error";
     return { success: false, error: message };
   }
 }
 
 // TikTok posting
 async function postToTikTok(
  connection: SocialConnection,
   postData: any
 ): Promise<PostResult> {
   try {
    const accessToken = connection.access_token;
    const isSandbox = connection.platform === "tiktok_sandbox";
    const effectivePrivacyLevel = isSandbox ? "SELF_ONLY" : (postData.privacyLevel || "SELF_ONLY");
    
    const isVideo = postData.videoUrl || postData.media_type === "video";
    
     if (isVideo) {
      // Video post - need to download and upload
      const videoUrl = postData.videoUrl || postData.media_url;
      if (!videoUrl) {
        return { success: false, error: "Video URL is required for TikTok video post" };
      }
 
      // Download video
      const videoResponse = await fetch(videoUrl);
      if (!videoResponse.ok) {
        return { success: false, error: "Failed to download video from storage" };
      }
 
      const videoBytes = await videoResponse.arrayBuffer();
      const videoSize = videoBytes.byteLength;
      const contentType = videoResponse.headers.get("content-type") || "video/mp4";
 
      // Initialize upload
      const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({
          post_info: {
            title: postData.caption || postData.description || "",
            privacy_level: effectivePrivacyLevel,
            disable_duet: true,
            disable_comment: true,
            disable_stitch: true,
          },
          source_info: {
            source: "FILE_UPLOAD",
            video_size: videoSize,
            chunk_size: videoSize,
            total_chunk_count: 1,
          },
        }),
      });
 
      const initData = await initResponse.json();
      if (initData.error?.code && initData.error.code !== "ok") {
        return { success: false, error: initData.error.message || "TikTok init failed", details: initData.error };
      }
 
      const publishId = initData.data?.publish_id;
      const uploadUrl = initData.data?.upload_url;
 
      if (!publishId || !uploadUrl) {
        return { success: false, error: "Failed to get TikTok upload URL" };
      }
 
      // Upload video
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
          "Content-Length": videoSize.toString(),
          "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
        },
        body: videoBytes,
      });
 
      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.text();
        return { success: false, error: "Failed to upload video to TikTok", details: uploadError };
      }
 
      // Poll for status
      let attempts = 0;
      const maxAttempts = 30;
      let status = "PROCESSING";
 
      while (status === "PROCESSING" && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
 
        const statusResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publish_id: publishId }),
        });
 
        const statusData = await statusResponse.json();
        status = statusData.data?.status || "UNKNOWN";
 
        if (status === "PUBLISH_COMPLETE") {
          return { success: true, details: { publishId, message: "Video published to TikTok" } };
        } else if (status === "FAILED") {
          return { success: false, error: statusData.data?.fail_reason || "TikTok publish failed", details: statusData.data };
        }
      }
 
      return { success: true, details: { publishId, status: "PROCESSING", message: "Video is processing" } };
     } else {
      // Photo post
      const photoUrls = postData.photoUrls || [postData.imageUrl || postData.media_url];
      if (!photoUrls || photoUrls.length === 0) {
        return { success: false, error: "At least one photo URL is required" };
      }
 
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
            title: postData.title?.slice(0, 90) || "",
            description: postData.caption || postData.description || "",
            privacy_level: effectivePrivacyLevel,
            disable_comment: true,
            auto_add_music: false,
          },
          source_info: {
            source: "PULL_FROM_URL",
            photo_images: photoUrls,
            photo_cover_index: 0,
          },
        }),
      });
 
      const initData = await initResponse.json();
      if (initData.error?.code && initData.error.code !== "ok") {
        return { success: false, error: initData.error.message || "TikTok photo init failed", details: initData.error };
      }
 
      const publishId = initData.data?.publish_id;
      if (!publishId) {
        return { success: false, error: "Failed to get TikTok publish ID" };
      }
 
      // Poll for status
      let attempts = 0;
      const maxAttempts = 30;
      let status = "PROCESSING";
 
      while (status === "PROCESSING" && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
 
        const statusResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ publish_id: publishId }),
        });
 
        const statusData = await statusResponse.json();
        status = statusData.data?.status || "UNKNOWN";
 
        if (status === "PUBLISH_COMPLETE") {
          return { success: true, details: { publishId, message: "Photo published to TikTok" } };
        } else if (status === "FAILED") {
          return { success: false, error: statusData.data?.fail_reason || "TikTok publish failed", details: statusData.data };
        }
      }
 
      return { success: true, details: { publishId, status: "PROCESSING", message: "Photo is processing" } };
     }
   } catch (error) {
     const message = error instanceof Error ? error.message : "Unknown error";
     return { success: false, error: message };
   }
 }
 
 // Route to the correct platform posting function
 async function postToPlatform(
   platform: string,
  connection: SocialConnection,
   postData: any
 ): Promise<PostResult> {
  console.log(`[PROCESS-SCHEDULED] Posting to ${platform}...`);
   
   switch (platform.toLowerCase()) {
     case "pinterest":
      return postToPinterest(connection, postData);
     case "instagram":
      return postToInstagram(connection, postData);
     case "facebook":
      return postToFacebook(connection, postData);
     case "threads":
      return postToThreads(connection, postData);
     case "tiktok":
     case "tiktok_sandbox":
      return postToTikTok(connection, postData);
     default:
       return { success: false, error: `Unsupported platform: ${platform}` };
   }
 }
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
   const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 
   if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
     console.error("[PROCESS-SCHEDULED] Missing environment variables");
     return new Response(
       JSON.stringify({ error: "Server configuration error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 
   const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
 
   console.log("[PROCESS-SCHEDULED] Starting scheduled posts processing...");
 
   try {
     // Query pending posts whose scheduled_for time has passed
     const { data: pendingPosts, error: queryError } = await supabase
       .from("scheduled_posts")
       .select("*, content_planner(*)")
       .eq("status", "pending")
       .lte("scheduled_for", new Date().toISOString())
       .order("scheduled_for", { ascending: true })
       .limit(50); // Process up to 50 posts per run
 
     if (queryError) {
       console.error("[PROCESS-SCHEDULED] Query error:", queryError);
       return new Response(
         JSON.stringify({ error: "Failed to query scheduled posts", details: queryError }),
         { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     if (!pendingPosts || pendingPosts.length === 0) {
       console.log("[PROCESS-SCHEDULED] No pending posts to process");
       return new Response(
         JSON.stringify({ success: true, message: "No pending posts", processed: 0 }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     console.log(`[PROCESS-SCHEDULED] Found ${pendingPosts.length} pending posts to process`);
 
     const results: Array<{ id: string; platform: string; success: boolean; error?: string }> = [];
 
     // Process each post
     for (const scheduledPost of pendingPosts) {
       const { id, user_id, platform, post_data, content_item_id } = scheduledPost;
       
       console.log(`[PROCESS-SCHEDULED] Processing post ${id} for platform ${platform}`);
 
       try {
         // Check if user has the platform connected
         const { data: connections } = await supabase
           .rpc("get_social_connections_for_user", { p_user_id: user_id });
 
         const platformConnection = connections?.find((c: any) => 
           c.platform === platform || 
           (platform === "tiktok" && c.platform === "tiktok_sandbox")
         );
 
         if (!platformConnection) {
           console.log(`[PROCESS-SCHEDULED] User ${user_id.substring(0, 8)}... has no ${platform} connection`);
           
           // Mark as failed
           await supabase
             .from("scheduled_posts")
             .update({
               status: "failed",
               result: { error: `${platform} not connected` },
               updated_at: new Date().toISOString(),
             })
             .eq("id", id);
 
           // Update content_planner if linked
           if (content_item_id) {
             await supabase
               .from("content_planner")
               .update({
                 status: "failed",
                 publish_results: { [platform]: { success: false, error: `${platform} not connected` } },
                 updated_at: new Date().toISOString(),
               })
               .eq("id", content_item_id);
           }
 
           results.push({ id, platform, success: false, error: `${platform} not connected` });
           continue;
         }
 
         // Check if token is expired
         if (platformConnection.token_expires_at) {
           const expiresAt = new Date(platformConnection.token_expires_at);
           if (expiresAt < new Date()) {
             console.log(`[PROCESS-SCHEDULED] Token expired for ${platform}`);
             
             await supabase
               .from("scheduled_posts")
               .update({
                 status: "failed",
                 result: { error: `${platform} token expired. Please reconnect.` },
                 updated_at: new Date().toISOString(),
               })
               .eq("id", id);
 
             if (content_item_id) {
               await supabase
                 .from("content_planner")
                 .update({
                   status: "failed",
                   publish_results: { [platform]: { success: false, error: "Token expired" } },
                   updated_at: new Date().toISOString(),
                 })
                 .eq("id", content_item_id);
             }
 
             results.push({ id, platform, success: false, error: "Token expired" });
             continue;
           }
         }
 
         // Post to the platform
         const postResult = await postToPlatform(
           platform,
           platformConnection as SocialConnection,
           post_data
         );
 
         if (postResult.success) {
           console.log(`[PROCESS-SCHEDULED] Successfully posted ${id} to ${platform}`);
           
           // Update scheduled_posts
           await supabase
             .from("scheduled_posts")
             .update({
               status: "posted",
               posted_at: new Date().toISOString(),
               result: postResult.details,
               updated_at: new Date().toISOString(),
             })
             .eq("id", id);
 
           // Update content_planner if linked
           if (content_item_id) {
             // Get current publish_results to merge with new result
             const { data: currentItem } = await supabase
               .from("content_planner")
               .select("publish_results, scheduled_platforms")
               .eq("id", content_item_id)
               .single();
 
             const existingResults = (currentItem?.publish_results as Record<string, any>) || {};
             const newResults = {
               ...existingResults,
               [platform]: { success: true, ...postResult.details },
            } as Record<string, any>;
 
             // Check if all scheduled platforms have been posted
             const scheduledPlatforms = currentItem?.scheduled_platforms || [platform];
             const allPosted = scheduledPlatforms.every((p: string) => 
              (newResults as Record<string, any>)[p]?.success === true
             );
 
             await supabase
               .from("content_planner")
               .update({
                 status: allPosted ? "completed" : "partial",
                 publish_results: newResults,
                 updated_at: new Date().toISOString(),
               })
               .eq("id", content_item_id);
           }
 
           results.push({ id, platform, success: true });
         } else {
           console.error(`[PROCESS-SCHEDULED] Failed to post ${id} to ${platform}:`, postResult.error);
           
           await supabase
             .from("scheduled_posts")
             .update({
               status: "failed",
               result: { error: postResult.error, details: postResult.details },
               updated_at: new Date().toISOString(),
             })
             .eq("id", id);
 
           if (content_item_id) {
             const { data: currentItem } = await supabase
               .from("content_planner")
               .select("publish_results")
               .eq("id", content_item_id)
               .single();
 
             const existingResults = (currentItem?.publish_results as Record<string, any>) || {};
             await supabase
               .from("content_planner")
               .update({
                 status: "failed",
                 publish_results: {
                   ...existingResults,
                   [platform]: { success: false, error: postResult.error },
                 },
                 updated_at: new Date().toISOString(),
               })
               .eq("id", content_item_id);
           }
 
           results.push({ id, platform, success: false, error: postResult.error });
         }
       } catch (postError) {
         const errorMessage = postError instanceof Error ? postError.message : "Unknown error";
         console.error(`[PROCESS-SCHEDULED] Exception processing post ${id}:`, errorMessage);
         
         await supabase
           .from("scheduled_posts")
           .update({
             status: "failed",
             result: { error: errorMessage },
             updated_at: new Date().toISOString(),
           })
           .eq("id", id);
 
         results.push({ id, platform, success: false, error: errorMessage });
       }
     }
 
     const successCount = results.filter(r => r.success).length;
     const failCount = results.filter(r => !r.success).length;
 
     console.log(`[PROCESS-SCHEDULED] Completed: ${successCount} succeeded, ${failCount} failed`);
 
     return new Response(
       JSON.stringify({
         success: true,
         processed: results.length,
         succeeded: successCount,
         failed: failCount,
         results,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     const errorMessage = error instanceof Error ? error.message : "Unknown error";
     console.error("[PROCESS-SCHEDULED] Fatal error:", errorMessage);
     return new Response(
       JSON.stringify({ error: "Internal server error", details: errorMessage }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });
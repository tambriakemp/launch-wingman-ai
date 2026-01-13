import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // TikTok sends GET request for webhook verification
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const challenge = url.searchParams.get('challenge');
      
      if (challenge) {
        console.log('TikTok webhook verification challenge received');
        // Return the challenge value to verify the webhook
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
      
      return new Response('Webhook endpoint active', {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Handle POST requests (actual webhook events)
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('TikTok webhook event received:', JSON.stringify(body));

      const { event, user, content } = body;

      // Log the webhook event for debugging and analytics
      const { error: logError } = await supabase.from('webhook_logs').insert({
        provider: 'tiktok',
        event_type: event,
        payload: body,
        status: 'received',
      });
      
      if (logError) {
        console.error('Failed to log webhook event:', logError);
      }

      // Handle different event types
      switch (event) {
        case 'authorize':
          console.log('User authorized app:', user?.open_id);
          break;

        case 'deauthorize':
          console.log('User deauthorized app:', user?.open_id);
          // Remove the user's TikTok connection
          if (user?.open_id) {
            const { error } = await supabase
              .from('social_connections')
              .delete()
              .eq('platform', 'tiktok')
              .eq('platform_user_id', user.open_id);
            
            if (error) {
              console.error('Error removing TikTok connection:', error);
            } else {
              console.log('TikTok connection removed for user:', user.open_id);
            }
          }
          break;

        case 'video.publish.complete':
          console.log('Video publish completed:', content?.video_id);
          // Could update a posts table with the final status
          break;

        case 'video.publish.failed':
          console.log('Video publish failed:', content?.video_id, content?.fail_reason);
          break;

        case 'comment.create':
          console.log('New comment on video:', content?.video_id);
          // Could store comments for the user to view
          break;

        case 'like.create':
          console.log('New like on video:', content?.video_id);
          break;

        case 'share.create':
          console.log('Video shared:', content?.video_id);
          break;

        case 'follow':
          console.log('New follower:', user?.open_id);
          break;

        default:
          console.log('Unhandled event type:', event);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

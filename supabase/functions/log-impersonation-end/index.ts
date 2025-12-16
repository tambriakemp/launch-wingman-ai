import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { adminUserId, adminEmail, targetUserId, targetEmail } = await req.json();

    if (!adminUserId || !adminEmail || !targetUserId || !targetEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the impersonation end event
    const { error: logError } = await supabaseAdmin
      .from('impersonation_logs')
      .insert({
        admin_user_id: adminUserId,
        admin_email: adminEmail,
        target_user_id: targetUserId,
        target_email: targetEmail,
        action: 'end',
      });

    if (logError) {
      console.error('[LOG-IMPERSONATION-END] Error:', logError);
      return new Response(
        JSON.stringify({ error: 'Failed to log impersonation end' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[LOG-IMPERSONATION-END] Logged end for:', targetEmail);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[LOG-IMPERSONATION-END] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

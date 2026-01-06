import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize user ID for logging (show only first 8 chars)
const sanitizeId = (id: string) => id ? `${id.substring(0, 8)}...` : 'unknown';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the caller is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callerUser) {
      console.error('[IMPERSONATE] Auth error');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[IMPERSONATE] Caller authenticated:', sanitizeId(callerUser.id));

    // Verify the caller is an admin using the user_roles table
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerUser.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('[IMPERSONATE] Admin verification failed for user:', sanitizeId(callerUser.id));
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[IMPERSONATE] Admin verified:', sanitizeId(callerUser.id));

    // Get the target user ID from the request body
    const { targetUserId } = await req.json();
    
    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing targetUserId in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the target user's details
    const { data: { user: targetUser }, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

    if (targetUserError || !targetUser) {
      console.error('[IMPERSONATE] Target user not found:', sanitizeId(targetUserId));
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[IMPERSONATE] Target user found:', sanitizeId(targetUser.id));

    // Generate a magic link for the target user using the admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.email!,
      options: {
        redirectTo: `${req.headers.get('origin') || supabaseUrl}/app`,
      },
    });

    if (linkError || !linkData) {
      console.error('[IMPERSONATE] Error generating link');
      return new Response(
        JSON.stringify({ error: 'Failed to generate impersonation session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the impersonation event to legacy table
    const { error: logError } = await supabaseAdmin
      .from('impersonation_logs')
      .insert({
        admin_user_id: callerUser.id,
        admin_email: callerUser.email,
        target_user_id: targetUser.id,
        target_email: targetUser.email,
        action: 'start',
      });

    if (logError) {
      console.error('[IMPERSONATE] Failed to log impersonation event');
    }

    // Also log to admin_action_logs for comprehensive audit
    await supabaseAdmin.from('admin_action_logs').insert({
      admin_user_id: callerUser.id,
      admin_email: callerUser.email,
      target_user_id: targetUser.id,
      target_email: targetUser.email,
      action_type: 'impersonation_start',
      action_details: {}
    });

    console.log('[IMPERSONATE] Session generated successfully');

    // Return the session data (hashed_token can be used to verify OTP)
    return new Response(
      JSON.stringify({
        success: true,
        targetUser: {
          id: targetUser.id,
          email: targetUser.email,
        },
        // The token hash that can be used with verifyOtp
        token_hash: linkData.properties?.hashed_token,
        // Also return the email token directly for OTP verification
        email_otp: linkData.properties?.email_otp,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[IMPERSONATE] Unexpected error');
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

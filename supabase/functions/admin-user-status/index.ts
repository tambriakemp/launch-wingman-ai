import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sanitizeId = (id: string) => id ? `${id.substring(0, 8)}...` : 'unknown';

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-USER-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const adminUser = userData.user;
    if (!adminUser?.email) throw new Error("User not authenticated");
    
    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .single();
    
    if (roleError || !roleData) {
      throw new Error("Unauthorized: Admin access required");
    }
    logStep("Admin verified", { adminId: sanitizeId(adminUser.id) });

    const { user_id, action } = await req.json();
    
    if (!user_id || !action) {
      throw new Error("Missing required fields: user_id and action");
    }

    if (!['disable', 'enable'].includes(action)) {
      throw new Error("Invalid action. Must be 'disable' or 'enable'");
    }

    // Prevent self-modification
    if (user_id === adminUser.id) {
      throw new Error("You cannot modify your own account status");
    }

    logStep("Processing status change", { targetUserId: sanitizeId(user_id), action });

    // Get target user info for logging
    const { data: targetUserData } = await supabaseClient.auth.admin.getUserById(user_id);
    const targetEmail = targetUserData?.user?.email || 'unknown';

    if (action === 'disable') {
      // Set banned_until to far future (100 years)
      const bannedUntil = new Date();
      bannedUntil.setFullYear(bannedUntil.getFullYear() + 100);

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ banned_until: bannedUntil.toISOString() })
        .eq('user_id', user_id);

      if (updateError) throw new Error(`Failed to disable user: ${updateError.message}`);

      // Also update user metadata in auth
      await supabaseClient.auth.admin.updateUserById(user_id, {
        user_metadata: { disabled: true }
      });
      
      logStep("User disabled", { targetUserId: sanitizeId(user_id) });
    } else {
      // Remove ban
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ banned_until: null })
        .eq('user_id', user_id);

      if (updateError) throw new Error(`Failed to enable user: ${updateError.message}`);

      // Update user metadata in auth
      await supabaseClient.auth.admin.updateUserById(user_id, {
        user_metadata: { disabled: false }
      });
      
      logStep("User enabled", { targetUserId: sanitizeId(user_id) });
    }

    // Log the action to admin_action_logs
    await supabaseClient.from('admin_action_logs').insert({
      admin_user_id: adminUser.id,
      admin_email: adminUser.email,
      target_user_id: user_id,
      target_email: targetEmail,
      action_type: action === 'disable' ? 'user_disabled' : 'user_enabled',
      action_details: { action }
    });

    return new Response(JSON.stringify({ success: true, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: errorMessage.includes("Unauthorized") ? 403 : 400,
    });
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sanitizeId = (id: string) => id ? `${id.substring(0, 8)}...` : 'unknown';

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-TOGGLE-ROLE] ${step}${detailsStr}`);
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

    if (!['grant_admin', 'remove_admin'].includes(action)) {
      throw new Error("Invalid action. Must be 'grant_admin' or 'remove_admin'");
    }

    // Prevent self-modification
    if (user_id === adminUser.id) {
      throw new Error("You cannot modify your own admin status");
    }

    logStep("Processing role change", { targetUserId: sanitizeId(user_id), action });

    if (action === 'grant_admin') {
      // Check if already admin
      const { data: existingRole } = await supabaseClient
        .from('user_roles')
        .select('id')
        .eq('user_id', user_id)
        .eq('role', 'admin')
        .single();

      if (existingRole) {
        throw new Error("User is already an admin");
      }

      // Grant admin role
      const { error: insertError } = await supabaseClient
        .from('user_roles')
        .insert({ user_id, role: 'admin' });

      if (insertError) throw new Error(`Failed to grant admin role: ${insertError.message}`);
      
      logStep("Admin role granted", { targetUserId: sanitizeId(user_id) });
    } else {
      // Remove admin role
      const { error: deleteError } = await supabaseClient
        .from('user_roles')
        .delete()
        .eq('user_id', user_id)
        .eq('role', 'admin');

      if (deleteError) throw new Error(`Failed to remove admin role: ${deleteError.message}`);
      
      logStep("Admin role removed", { targetUserId: sanitizeId(user_id) });
    }

    // Log the action
    await supabaseClient.from('impersonation_logs').insert({
      admin_id: adminUser.id,
      admin_email: adminUser.email,
      target_user_id: user_id,
      target_email: 'role_change',
      action: action,
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

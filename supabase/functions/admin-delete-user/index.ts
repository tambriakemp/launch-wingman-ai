import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sanitizeId = (id: string) => id ? `${id.substring(0, 8)}...` : 'unknown';

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-DELETE-USER] ${step}${detailsStr}`);
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

    const { user_id, confirm_email } = await req.json();
    
    if (!user_id) {
      throw new Error("Missing required field: user_id");
    }

    // Prevent self-deletion
    if (user_id === adminUser.id) {
      throw new Error("You cannot delete your own account");
    }

    // Get target user info
    const { data: targetUserData, error: targetError } = await supabaseClient.auth.admin.getUserById(user_id);
    if (targetError || !targetUserData?.user) {
      throw new Error("User not found");
    }
    
    const targetEmail = targetUserData.user.email || '';

    // Verify confirmation email matches
    if (confirm_email !== targetEmail) {
      throw new Error("Confirmation email does not match user's email");
    }

    logStep("Starting user deletion", { targetUserId: sanitizeId(user_id), targetEmail });

    // Log the action BEFORE deletion
    await supabaseClient.from('admin_action_logs').insert({
      admin_user_id: adminUser.id,
      admin_email: adminUser.email,
      target_user_id: user_id,
      target_email: targetEmail,
      action_type: 'user_deleted',
      action_details: { reason: 'admin_initiated' }
    });

    // Cancel any Stripe subscriptions
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        const customers = await stripe.customers.list({ email: targetEmail, limit: 1 });
        
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active' });
          
          for (const sub of subscriptions.data) {
            await stripe.subscriptions.cancel(sub.id);
            logStep("Cancelled Stripe subscription", { subscriptionId: sub.id });
          }
        }
      } catch (stripeError) {
        logStep("Stripe cleanup warning", { error: String(stripeError) });
        // Continue with deletion even if Stripe fails
      }
    }

    // Get all project IDs for this user
    const { data: projects } = await supabaseClient
      .from('projects')
      .select('id')
      .eq('user_id', user_id);
    
    const projectIds = projects?.map(p => p.id) || [];
    logStep("Found projects to delete", { count: projectIds.length });

    // Delete data in order (respecting foreign keys)
    // 1. Project-related data
    if (projectIds.length > 0) {
      // Get task IDs for subtasks deletion
      const { data: tasks } = await supabaseClient
        .from('tasks')
        .select('id')
        .in('project_id', projectIds);
      const taskIds = tasks?.map(t => t.id) || [];
      
      if (taskIds.length > 0) {
        await supabaseClient.from('subtasks').delete().in('task_id', taskIds);
      }
      
      await supabaseClient.from('tasks').delete().in('project_id', projectIds);
      await supabaseClient.from('project_tasks').delete().in('project_id', projectIds);
      await supabaseClient.from('content_drafts').delete().in('project_id', projectIds);
      await supabaseClient.from('content_ideas').delete().in('project_id', projectIds);
      await supabaseClient.from('content_planner').delete().in('project_id', projectIds);
      await supabaseClient.from('scheduled_posts').delete().in('project_id', projectIds);
      await supabaseClient.from('timeline_suggestions').delete().in('project_id', projectIds);
      await supabaseClient.from('brand_colors').delete().in('project_id', projectIds);
      await supabaseClient.from('brand_fonts').delete().in('project_id', projectIds);
      await supabaseClient.from('brand_logos').delete().in('project_id', projectIds);
      await supabaseClient.from('brand_photos').delete().in('project_id', projectIds);
      await supabaseClient.from('offers').delete().in('project_id', projectIds);
      await supabaseClient.from('funnels').delete().in('project_id', projectIds);
      await supabaseClient.from('funnel_asset_completions').delete().in('project_id', projectIds);
      await supabaseClient.from('sales_page_copy').delete().in('project_id', projectIds);
      await supabaseClient.from('deliverable_copy').delete().in('project_id', projectIds);
      await supabaseClient.from('metric_updates').delete().in('project_id', projectIds);
      await supabaseClient.from('launch_events').delete().in('project_id', projectIds);
      await supabaseClient.from('launch_snapshots').delete().in('project_id', projectIds);
      await supabaseClient.from('social_bios').delete().in('project_id', projectIds);
      await supabaseClient.from('project_memory').delete().in('project_id', projectIds);
      await supabaseClient.from('email_sequences').delete().in('project_id', projectIds);
    }

    // 2. User-level data
    await supabaseClient.from('projects').delete().eq('user_id', user_id);
    await supabaseClient.from('social_connections').delete().eq('user_id', user_id);
    await supabaseClient.from('check_ins').delete().eq('user_id', user_id);
    await supabaseClient.from('check_in_preferences').delete().eq('user_id', user_id);
    await supabaseClient.from('email_preferences').delete().eq('user_id', user_id);
    await supabaseClient.from('ai_usage_logs').delete().eq('user_id', user_id);
    await supabaseClient.from('user_activity').delete().eq('user_id', user_id);
    await supabaseClient.from('user_tone_profiles').delete().eq('user_id', user_id);
    await supabaseClient.from('profiles').delete().eq('user_id', user_id);
    await supabaseClient.from('user_roles').delete().eq('user_id', user_id);

    logStep("Deleted all user data");

    // 3. Delete the auth user
    const { error: deleteAuthError } = await supabaseClient.auth.admin.deleteUser(user_id);
    if (deleteAuthError) {
      throw new Error(`Failed to delete auth user: ${deleteAuthError.message}`);
    }

    logStep("User completely deleted", { targetUserId: sanitizeId(user_id) });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `User ${targetEmail} and all associated data have been permanently deleted` 
    }), {
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

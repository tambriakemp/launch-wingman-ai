import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  console.log(`[delete-my-account] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    const { confirm_email, password } = await req.json();

    // Validate email confirmation
    if (confirm_email !== userEmail) {
      return new Response(JSON.stringify({ error: "Email confirmation does not match" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: userEmail as string,
      password: password,
    });

    if (signInError) {
      return new Response(JSON.stringify({ error: "Incorrect password" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Password verified, starting account deletion", { userId });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Cancel Stripe subscriptions if configured
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const subscriptions = await stripe.subscriptions.list({ 
            customer: customerId, 
            status: "active" 
          });
          
          for (const sub of subscriptions.data) {
            await stripe.subscriptions.cancel(sub.id);
            logStep("Cancelled Stripe subscription", { subscriptionId: sub.id });
          }
        }
      } catch (stripeError: any) {
        logStep("Stripe cancellation error (continuing)", { error: stripeError?.message });
      }
    }

    // Get all project IDs for this user
    const { data: userProjects } = await supabaseAdmin
      .from("projects")
      .select("id")
      .eq("user_id", userId);
    const projectIds = (userProjects || []).map((p) => p.id);

    logStep("Found user projects", { count: projectIds.length });

    // Delete project-level data first
    if (projectIds.length > 0) {
      const projectDeletions = [
        supabaseAdmin.from("brand_colors").delete().in("project_id", projectIds),
        supabaseAdmin.from("brand_fonts").delete().in("project_id", projectIds),
        supabaseAdmin.from("brand_logos").delete().in("project_id", projectIds),
        supabaseAdmin.from("brand_photos").delete().in("project_id", projectIds),
        supabaseAdmin.from("offers").delete().in("project_id", projectIds),
        supabaseAdmin.from("funnels").delete().in("project_id", projectIds),
        supabaseAdmin.from("funnel_asset_completions").delete().in("project_id", projectIds),
        supabaseAdmin.from("content_drafts").delete().in("project_id", projectIds),
        supabaseAdmin.from("content_ideas").delete().in("project_id", projectIds),
        supabaseAdmin.from("content_planner").delete().in("project_id", projectIds),
        supabaseAdmin.from("timeline_suggestions").delete().in("project_id", projectIds),
        supabaseAdmin.from("scheduled_posts").delete().in("project_id", projectIds),
        supabaseAdmin.from("sales_page_copy").delete().in("project_id", projectIds),
        supabaseAdmin.from("deliverable_copy").delete().in("project_id", projectIds),
        supabaseAdmin.from("email_sequences").delete().in("project_id", projectIds),
        supabaseAdmin.from("launch_events").delete().in("project_id", projectIds),
        supabaseAdmin.from("launch_snapshots").delete().in("project_id", projectIds),
        supabaseAdmin.from("metric_updates").delete().in("project_id", projectIds),
        supabaseAdmin.from("social_bios").delete().in("project_id", projectIds),
        supabaseAdmin.from("project_memory").delete().in("project_id", projectIds),
        supabaseAdmin.from("project_tasks").delete().in("project_id", projectIds),
      ];

      await Promise.all(projectDeletions);
      logStep("Deleted project-level data");

      // Delete tasks and subtasks
      const { data: userTasks } = await supabaseAdmin
        .from("tasks")
        .select("id")
        .in("project_id", projectIds);
      
      if (userTasks && userTasks.length > 0) {
        const taskIds = userTasks.map((t) => t.id);
        await supabaseAdmin.from("subtasks").delete().in("task_id", taskIds);
        await supabaseAdmin.from("tasks").delete().in("id", taskIds);
        logStep("Deleted tasks and subtasks");
      }

      // Delete projects
      await supabaseAdmin.from("projects").delete().in("id", projectIds);
      logStep("Deleted projects");
    }

    // Delete user-level data
    const userDeletions = [
      supabaseAdmin.from("profiles").delete().eq("user_id", userId),
      supabaseAdmin.from("user_roles").delete().eq("user_id", userId),
      supabaseAdmin.from("user_activity").delete().eq("user_id", userId),
      supabaseAdmin.from("check_ins").delete().eq("user_id", userId),
      supabaseAdmin.from("check_in_preferences").delete().eq("user_id", userId),
      supabaseAdmin.from("email_preferences").delete().eq("user_id", userId),
      supabaseAdmin.from("email_logs").delete().eq("user_id", userId),
      supabaseAdmin.from("user_tone_profiles").delete().eq("user_id", userId),
      supabaseAdmin.from("social_connections").delete().eq("user_id", userId),
      supabaseAdmin.from("ai_usage_logs").delete().eq("user_id", userId),
    ];

    await Promise.all(userDeletions);
    logStep("Deleted user-level data");

    // Delete the auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      throw deleteUserError;
    }

    logStep("User account deleted successfully", { userId });

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in delete-my-account:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const adminUserId = claimsData.claims.sub;

    // Check if user is admin or manager
    const { data: adminRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .in("role", ["admin", "manager"])
      .single();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin or manager access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user info
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(user_id);
    const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(adminUserId);

    // Fetch all user data from various tables
    const [
      profileResult,
      projectsResult,
      brandColorsResult,
      brandFontsResult,
      brandLogosResult,
      brandPhotosResult,
      offersResult,
      funnelsResult,
      contentDraftsResult,
      contentIdeasResult,
      contentPlannerResult,
      salesPageCopyResult,
      deliverableCopyResult,
      emailSequencesResult,
      launchEventsResult,
      launchSnapshotsResult,
      metricUpdatesResult,
      checkInsResult,
      checkInPrefsResult,
      emailPrefsResult,
      toneProfileResult,
      socialBiosResult,
      tasksResult,
      projectTasksResult,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("user_id", user_id),
      supabaseAdmin.from("projects").select("*").eq("user_id", user_id),
      supabaseAdmin.from("brand_colors").select("*").eq("user_id", user_id),
      supabaseAdmin.from("brand_fonts").select("*").eq("user_id", user_id),
      supabaseAdmin.from("brand_logos").select("id, file_name, created_at, project_id").eq("user_id", user_id),
      supabaseAdmin.from("brand_photos").select("id, file_name, created_at, project_id").eq("user_id", user_id),
      supabaseAdmin.from("offers").select("*").eq("user_id", user_id),
      supabaseAdmin.from("funnels").select("*").eq("user_id", user_id),
      supabaseAdmin.from("content_drafts").select("*").eq("user_id", user_id),
      supabaseAdmin.from("content_ideas").select("*").eq("user_id", user_id),
      supabaseAdmin.from("content_planner").select("*").eq("user_id", user_id),
      supabaseAdmin.from("sales_page_copy").select("*").eq("user_id", user_id),
      supabaseAdmin.from("deliverable_copy").select("*").eq("user_id", user_id),
      supabaseAdmin.from("email_sequences").select("*").eq("user_id", user_id),
      supabaseAdmin.from("launch_events").select("*").eq("user_id", user_id),
      supabaseAdmin.from("launch_snapshots").select("*").eq("user_id", user_id),
      supabaseAdmin.from("metric_updates").select("*").eq("user_id", user_id),
      supabaseAdmin.from("check_ins").select("*").eq("user_id", user_id),
      supabaseAdmin.from("check_in_preferences").select("*").eq("user_id", user_id),
      supabaseAdmin.from("email_preferences").select("*").eq("user_id", user_id),
      supabaseAdmin.from("user_tone_profiles").select("*").eq("user_id", user_id),
      supabaseAdmin.from("social_bios").select("*").eq("user_id", user_id),
      supabaseAdmin.from("tasks").select("*").eq("user_id", user_id),
      supabaseAdmin.from("project_tasks").select("*").eq("user_id", user_id),
    ]);

    // Social connections without tokens
    const { data: socialConnections } = await supabaseAdmin
      .from("social_connections")
      .select("id, platform, account_name, created_at, token_expires_at")
      .eq("user_id", user_id);

    const exportData = {
      export_date: new Date().toISOString(),
      exported_by: adminUser?.user?.email,
      user_id: user_id,
      user_email: targetUser?.user?.email,
      user_created_at: targetUser?.user?.created_at,
      data: {
        profile: profileResult.data?.[0] || null,
        projects: projectsResult.data || [],
        brand_assets: {
          colors: brandColorsResult.data || [],
          fonts: brandFontsResult.data || [],
          logos: brandLogosResult.data || [],
          photos: brandPhotosResult.data || [],
        },
        offers: offersResult.data || [],
        funnels: funnelsResult.data || [],
        content: {
          drafts: contentDraftsResult.data || [],
          ideas: contentIdeasResult.data || [],
          planner: contentPlannerResult.data || [],
        },
        sales_copy: {
          pages: salesPageCopyResult.data || [],
          deliverables: deliverableCopyResult.data || [],
          emails: emailSequencesResult.data || [],
        },
        metrics: {
          launch_events: launchEventsResult.data || [],
          launch_snapshots: launchSnapshotsResult.data || [],
          metric_updates: metricUpdatesResult.data || [],
        },
        settings: {
          check_in_preferences: checkInPrefsResult.data?.[0] || null,
          email_preferences: emailPrefsResult.data?.[0] || null,
          tone_profile: toneProfileResult.data?.[0] || null,
        },
        check_ins: checkInsResult.data || [],
        social_connections: socialConnections || [],
        social_bios: socialBiosResult.data || [],
        tasks: tasksResult.data || [],
        project_tasks: projectTasksResult.data || [],
      },
    };

    // Log the action
    await supabaseAdmin.from("admin_action_logs").insert({
      admin_user_id: adminUserId,
      admin_email: adminUser?.user?.email || "unknown",
      target_user_id: user_id,
      target_email: targetUser?.user?.email || "unknown",
      action_type: "user_data_exported",
      action_details: {
        projects_count: projectsResult.data?.length || 0,
        offers_count: offersResult.data?.length || 0,
      },
    });

    console.log(`User data exported for ${user_id} by admin ${adminUserId}`);

    return new Response(JSON.stringify(exportData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in admin-export-user-data:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

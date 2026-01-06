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

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    console.log(`Starting data export for user ${userId}`);

    // Fetch all user data from various tables using the authenticated client
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
      supabaseClient.from("profiles").select("*").eq("user_id", userId),
      supabaseClient.from("projects").select("*").eq("user_id", userId),
      supabaseClient.from("brand_colors").select("*").eq("user_id", userId),
      supabaseClient.from("brand_fonts").select("*").eq("user_id", userId),
      supabaseClient.from("brand_logos").select("id, file_name, created_at, project_id").eq("user_id", userId),
      supabaseClient.from("brand_photos").select("id, file_name, created_at, project_id").eq("user_id", userId),
      supabaseClient.from("offers").select("*").eq("user_id", userId),
      supabaseClient.from("funnels").select("*").eq("user_id", userId),
      supabaseClient.from("content_drafts").select("*").eq("user_id", userId),
      supabaseClient.from("content_ideas").select("*").eq("user_id", userId),
      supabaseClient.from("content_planner").select("*").eq("user_id", userId),
      supabaseClient.from("sales_page_copy").select("*").eq("user_id", userId),
      supabaseClient.from("deliverable_copy").select("*").eq("user_id", userId),
      supabaseClient.from("email_sequences").select("*").eq("user_id", userId),
      supabaseClient.from("launch_events").select("*").eq("user_id", userId),
      supabaseClient.from("launch_snapshots").select("*").eq("user_id", userId),
      supabaseClient.from("metric_updates").select("*").eq("user_id", userId),
      supabaseClient.from("check_ins").select("*").eq("user_id", userId),
      supabaseClient.from("check_in_preferences").select("*").eq("user_id", userId),
      supabaseClient.from("email_preferences").select("*").eq("user_id", userId),
      supabaseClient.from("user_tone_profiles").select("*").eq("user_id", userId),
      supabaseClient.from("social_bios").select("*").eq("user_id", userId),
      supabaseClient.from("tasks").select("*").eq("user_id", userId),
      supabaseClient.from("project_tasks").select("*").eq("user_id", userId),
    ]);

    // Social connections without tokens (metadata only)
    const { data: socialConnections } = await supabaseClient
      .from("social_connections")
      .select("id, platform, account_name, created_at, token_expires_at")
      .eq("user_id", userId);

    const exportData = {
      export_date: new Date().toISOString(),
      user_id: userId,
      user_email: userEmail,
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

    console.log(`Data export completed for user ${userId}`);

    return new Response(JSON.stringify(exportData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in export-my-data:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

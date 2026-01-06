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

    // Use service role for fetching user projects
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch projects with aggregated counts
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from("projects")
      .select("id, name, status, project_type, created_at, active_phase, selected_funnel_type")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (projectsError) {
      throw projectsError;
    }

    // Get counts for each project
    const projectsWithCounts = await Promise.all(
      (projects || []).map(async (project) => {
        const [offersResult, contentResult] = await Promise.all([
          supabaseAdmin
            .from("offers")
            .select("id", { count: "exact", head: true })
            .eq("project_id", project.id),
          supabaseAdmin
            .from("content_planner")
            .select("id", { count: "exact", head: true })
            .eq("project_id", project.id),
        ]);

        return {
          ...project,
          offer_count: offersResult.count || 0,
          content_count: contentResult.count || 0,
        };
      })
    );

    // Log the action
    const { data: adminUser } = await supabaseAdmin.auth.admin.getUserById(adminUserId);
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(user_id);

    await supabaseAdmin.from("admin_action_logs").insert({
      admin_user_id: adminUserId,
      admin_email: adminUser?.user?.email || "unknown",
      target_user_id: user_id,
      target_email: targetUser?.user?.email || "unknown",
      action_type: "user_projects_viewed",
      action_details: { project_count: projectsWithCounts.length },
    });

    return new Response(JSON.stringify({ projects: projectsWithCounts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in admin-get-user-projects:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

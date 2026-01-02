import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sanitizeId = (id: string) => id ? `${id.substring(0, 8)}...` : 'unknown';

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-PLATFORM-STATS] ${step}${detailsStr}`);
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

    // Verify admin/manager access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const adminUser = userData.user;
    if (!adminUser?.email) throw new Error("User not authenticated");
    
    // Check if user is admin or manager
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .in('role', ['admin', 'manager'])
      .limit(1);
    
    if (roleError || !roleData || roleData.length === 0) {
      throw new Error("Unauthorized: Admin or Manager access required");
    }
    logStep("Staff access verified", { userId: sanitizeId(adminUser.id), role: roleData[0].role });

    // Fetch project stats
    const { data: projects, error: projectsError } = await supabaseClient
      .from('projects')
      .select('id, lifecycle_state, current_phase');
    
    if (projectsError) {
      logStep("Error fetching projects", { error: projectsError.message });
    }

    // Fetch project tasks for completion calculation
    const { data: projectTasks, error: tasksError } = await supabaseClient
      .from('project_tasks')
      .select('project_id, status');
    
    if (tasksError) {
      logStep("Error fetching project tasks", { error: tasksError.message });
    }

    // Calculate project stats
    const projectStats = {
      total: projects?.length || 0,
      byPhase: {
        clarity: projects?.filter(p => p.current_phase === 'clarity').length || 0,
        strategy: projects?.filter(p => p.current_phase === 'strategy').length || 0,
        build: projects?.filter(p => p.current_phase === 'build').length || 0,
        launch: projects?.filter(p => p.current_phase === 'launch').length || 0,
        maintain: projects?.filter(p => p.current_phase === 'maintain').length || 0,
      },
      byState: {
        draft: projects?.filter(p => p.lifecycle_state === 'draft').length || 0,
        in_progress: projects?.filter(p => p.lifecycle_state === 'in_progress').length || 0,
        launched: projects?.filter(p => p.lifecycle_state === 'launched').length || 0,
        completed: projects?.filter(p => p.lifecycle_state === 'completed').length || 0,
        paused: projects?.filter(p => p.lifecycle_state === 'paused').length || 0,
        archived: projects?.filter(p => p.lifecycle_state === 'archived').length || 0,
      },
      avgCompletionPercent: 0,
    };

    // Calculate average completion percentage
    if (projects && projectTasks) {
      const projectCompletions: number[] = [];
      projects.forEach(project => {
        const tasks = projectTasks.filter(t => t.project_id === project.id);
        if (tasks.length > 0) {
          const completed = tasks.filter(t => t.status === 'completed').length;
          projectCompletions.push((completed / tasks.length) * 100);
        }
      });
      if (projectCompletions.length > 0) {
        projectStats.avgCompletionPercent = Math.round(
          projectCompletions.reduce((a, b) => a + b, 0) / projectCompletions.length
        );
      }
    }
    logStep("Project stats calculated", { total: projectStats.total });

    // Fetch content stats
    const { count: scheduledPostsCount } = await supabaseClient
      .from('scheduled_posts')
      .select('*', { count: 'exact', head: true });

    const { count: contentDraftsCount } = await supabaseClient
      .from('content_drafts')
      .select('*', { count: 'exact', head: true });

    const { count: contentIdeasCount } = await supabaseClient
      .from('content_ideas')
      .select('*', { count: 'exact', head: true });

    const { count: socialConnectionsCount } = await supabaseClient
      .from('social_connections')
      .select('*', { count: 'exact', head: true });

    const contentStats = {
      scheduledPosts: scheduledPostsCount || 0,
      contentDrafts: contentDraftsCount || 0,
      contentIdeas: contentIdeasCount || 0,
      socialConnections: socialConnectionsCount || 0,
    };
    logStep("Content stats calculated", contentStats);

    // Fetch engagement stats - projects per user
    const { data: userProjects } = await supabaseClient
      .from('projects')
      .select('user_id');

    const projectsPerUser: Record<string, number> = {};
    userProjects?.forEach(p => {
      projectsPerUser[p.user_id] = (projectsPerUser[p.user_id] || 0) + 1;
    });

    const userProjectCounts = Object.values(projectsPerUser);
    const engagementStats = {
      avgProjectsPerUser: userProjectCounts.length > 0 
        ? Math.round((userProjectCounts.reduce((a, b) => a + b, 0) / userProjectCounts.length) * 10) / 10 
        : 0,
      usersWithProjects: Object.keys(projectsPerUser).length,
      usersWithMultipleProjects: userProjectCounts.filter(c => c > 1).length,
      projectsPerUser, // Map of user_id -> project count for admin list enhancement
    };
    logStep("Engagement stats calculated");

    // Fetch offers stats
    const { count: offersCount } = await supabaseClient
      .from('offers')
      .select('*', { count: 'exact', head: true });

    const { data: offersWithPrice } = await supabaseClient
      .from('offers')
      .select('price')
      .not('price', 'is', null);

    const offerStats = {
      totalOffers: offersCount || 0,
      avgOfferPrice: offersWithPrice && offersWithPrice.length > 0
        ? Math.round(offersWithPrice.reduce((sum, o) => sum + Number(o.price || 0), 0) / offersWithPrice.length)
        : 0,
    };
    logStep("Offer stats calculated");

    const response = {
      projectStats,
      contentStats,
      engagementStats,
      offerStats,
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: errorMessage.includes("Unauthorized") ? 403 : 500,
    });
  }
});

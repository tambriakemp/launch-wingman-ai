import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sanitizeId = (id: string) => id ? `${id.substring(0, 8)}...` : 'unknown';

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-PLATFORM-STATS] ${step}${detailsStr}`);
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    // Validate JWT (handles ES256 signing and detects expiration)
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      logStep("Auth failed", { message: claimsError?.message || "Invalid token" });
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;
    if (!userId || !userEmail) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    
    // Check if user is admin or manager
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .in('role', ['admin', 'manager'])
      .limit(1);
    
    if (roleError) {
      logStep("Error checking staff role", { error: roleError.message, userId: sanitizeId(userId) });
      return jsonResponse({ error: "Internal error" }, 500);
    }

    if (!roleData || roleData.length === 0) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }
    logStep("Staff access verified", { userId: sanitizeId(userId), role: roleData[0].role });

    // ========== PARALLEL QUERIES FOR PERFORMANCE ==========
    // Run all independent queries in parallel using Promise.all
    const [
      projectsResult,
      projectTasksResult,
      scheduledPostsResult,
      contentDraftsResult,
      contentIdeasResult,
      socialConnectionsResult,
      offersResult,
      offersWithPriceResult,
      authUsersResult,
      profilesWithNamesResult,
      completedTasksResult,
      usersWithOffersResult,
      funnelsResult,
      brandColorsResult,
      brandFontsResult,
      brandPhotosResult,
      brandLogosResult,
      socialBiosResult,
      salesPageCopyResult,
      launchSnapshotsResult,
      metricUpdatesResult,
      contentPlannerResult,
      launchEventsResult,
      checkInsResult,
      relaunchProjectsResult,
    ] = await Promise.all([
      // Projects (using active_phase instead of current_phase)
      supabaseClient.from('projects').select('id, status, active_phase, user_id'),
      // Project tasks
      supabaseClient.from('project_tasks').select('project_id, status, user_id'),
      // Content stats
      supabaseClient.from('scheduled_posts').select('*', { count: 'exact', head: true }),
      supabaseClient.from('content_drafts').select('*', { count: 'exact', head: true }),
      supabaseClient.from('content_ideas').select('*', { count: 'exact', head: true }),
      supabaseClient.from('social_connections').select('*', { count: 'exact', head: true }),
      // Offers
      supabaseClient.from('offers').select('*', { count: 'exact', head: true }),
      supabaseClient.from('offers').select('price').not('price', 'is', null),
      // Auth users
      supabaseClient.auth.admin.listUsers(),
      // Profiles
      supabaseClient.from('profiles').select('user_id, first_name, last_name').or('first_name.neq.,last_name.neq.'),
      // Completed tasks
      supabaseClient.from('project_tasks').select('user_id').eq('status', 'completed'),
      // Users with offers
      supabaseClient.from('offers').select('user_id'),
      // Feature usage
      supabaseClient.from('funnels').select('*', { count: 'exact', head: true }),
      supabaseClient.from('brand_colors').select('*', { count: 'exact', head: true }),
      supabaseClient.from('brand_fonts').select('*', { count: 'exact', head: true }),
      supabaseClient.from('brand_photos').select('*', { count: 'exact', head: true }),
      supabaseClient.from('brand_logos').select('*', { count: 'exact', head: true }),
      supabaseClient.from('social_bios').select('*', { count: 'exact', head: true }),
      supabaseClient.from('sales_page_copy').select('*', { count: 'exact', head: true }),
      supabaseClient.from('launch_snapshots').select('*', { count: 'exact', head: true }),
      supabaseClient.from('metric_updates').select('*', { count: 'exact', head: true }),
      supabaseClient.from('content_planner').select('*', { count: 'exact', head: true }),
      supabaseClient.from('launch_events').select('*', { count: 'exact', head: true }),
      supabaseClient.from('check_ins').select('*', { count: 'exact', head: true }),
      // Relaunch projects
      supabaseClient.from('projects').select('id, skip_memory, relaunch_kept_sections, relaunch_revisit_sections, status').eq('is_relaunch', true),
    ]);

    // Extract data from results
    const projects = projectsResult.data;
    const projectTasks = projectTasksResult.data;
    const scheduledPostsCount = scheduledPostsResult.count;
    const contentDraftsCount = contentDraftsResult.count;
    const contentIdeasCount = contentIdeasResult.count;
    const socialConnectionsCount = socialConnectionsResult.count;
    const offersCount = offersResult.count;
    const offersWithPrice = offersWithPriceResult.data;
    const authUsers = authUsersResult.data;
    const profilesWithNames = profilesWithNamesResult.data;
    const completedTasks = completedTasksResult.data;
    const usersWithOffers = usersWithOffersResult.data;
    const relaunchProjects = relaunchProjectsResult.data;

    if (projectsResult.error) {
      logStep("Error fetching projects", { error: projectsResult.error.message });
    }
    if (projectTasksResult.error) {
      logStep("Error fetching project tasks", { error: projectTasksResult.error.message });
    }

    // Calculate project stats (using 'status' column, not 'lifecycle_state')
    const projectStats = {
      total: projects?.length || 0,
      byPhase: {
        clarity: projects?.filter(p => p.active_phase === 'clarity').length || 0,
        strategy: projects?.filter(p => p.active_phase === 'strategy').length || 0,
        build: projects?.filter(p => p.active_phase === 'build').length || 0,
        launch: projects?.filter(p => p.active_phase === 'launch').length || 0,
        maintain: projects?.filter(p => p.active_phase === 'maintain').length || 0,
      },
      byState: {
        draft: projects?.filter(p => p.status === 'draft').length || 0,
        in_progress: projects?.filter(p => p.status === 'in_progress').length || 0,
        launched: projects?.filter(p => p.status === 'launched').length || 0,
        completed: projects?.filter(p => p.status === 'completed').length || 0,
        paused: projects?.filter(p => p.status === 'paused').length || 0,
        archived: projects?.filter(p => p.status === 'archived').length || 0,
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

    const contentStats = {
      scheduledPosts: scheduledPostsCount || 0,
      contentDrafts: contentDraftsCount || 0,
      contentIdeas: contentIdeasCount || 0,
      socialConnections: socialConnectionsCount || 0,
    };
    logStep("Content stats calculated", contentStats);

    // Engagement stats - projects per user (already fetched projects with user_id)
    const projectsPerUser: Record<string, number> = {};
    projects?.forEach(p => {
      projectsPerUser[p.user_id] = (projectsPerUser[p.user_id] || 0) + 1;
    });

    const userProjectCounts = Object.values(projectsPerUser);
    const engagementStats = {
      avgProjectsPerUser: userProjectCounts.length > 0 
        ? Math.round((userProjectCounts.reduce((a, b) => a + b, 0) / userProjectCounts.length) * 10) / 10 
        : 0,
      usersWithProjects: Object.keys(projectsPerUser).length,
      usersWithMultipleProjects: userProjectCounts.filter(c => c > 1).length,
      projectsPerUser,
    };
    logStep("Engagement stats calculated");

    const offerStats = {
      totalOffers: offersCount || 0,
      avgOfferPrice: offersWithPrice && offersWithPrice.length > 0
        ? Math.round(offersWithPrice.reduce((sum, o) => sum + Number(o.price || 0), 0) / offersWithPrice.length)
        : 0,
    };
    logStep("Offer stats calculated");

    // Onboarding funnel stats
    const totalUsers = authUsers?.users?.length || 0;
    const usersWithProfile = profilesWithNames?.filter(p => p.first_name || p.last_name).length || 0;
    const usersWithFirstProject = Object.keys(projectsPerUser).length;
    const uniqueUsersWithCompletedTask = new Set(completedTasks?.map(t => t.user_id) || []).size;
    const uniqueUsersWithOffer = new Set(usersWithOffers?.map(o => o.user_id) || []).size;

    const onboardingFunnel = {
      totalUsers,
      usersWithProfile,
      usersWithFirstProject,
      usersWithFirstTask: uniqueUsersWithCompletedTask,
      usersWithOffer: uniqueUsersWithOffer,
      profileCompletionRate: totalUsers > 0 ? Math.round((usersWithProfile / totalUsers) * 100) : 0,
      projectCreationRate: totalUsers > 0 ? Math.round((usersWithFirstProject / totalUsers) * 100) : 0,
      taskCompletionRate: totalUsers > 0 ? Math.round((uniqueUsersWithCompletedTask / totalUsers) * 100) : 0,
      offerCreationRate: totalUsers > 0 ? Math.round((uniqueUsersWithOffer / totalUsers) * 100) : 0,
    };
    logStep("Onboarding funnel stats calculated");

    const featureUsage = {
      funnelBuilder: funnelsResult.count || 0,
      brandingColors: brandColorsResult.count || 0,
      brandingFonts: brandFontsResult.count || 0,
      brandingPhotos: brandPhotosResult.count || 0,
      brandingLogos: brandLogosResult.count || 0,
      socialBios: socialBiosResult.count || 0,
      salesPageCopy: salesPageCopyResult.count || 0,
      launchSnapshots: launchSnapshotsResult.count || 0,
      metricUpdates: metricUpdatesResult.count || 0,
      contentCalendar: contentPlannerResult.count || 0,
      launchEvents: launchEventsResult.count || 0,
      checkIns: checkInsResult.count || 0,
      contentIdeas: contentIdeasCount || 0,
      contentDrafts: contentDraftsCount || 0,
      scheduledPosts: scheduledPostsCount || 0,
      offers: offersCount || 0,
    };
    logStep("Feature usage stats calculated");

    // Relaunch stats
    const relaunchStats = {
      totalRelaunches: relaunchProjects?.length || 0,
      freshStarts: relaunchProjects?.filter(p => p.skip_memory === true).length || 0,
      memoryBased: relaunchProjects?.filter(p => p.skip_memory !== true).length || 0,
      avgKeptSections: 0,
      avgRevisitSections: 0,
      mostKeptSections: {} as Record<string, number>,
      mostRevisitedSections: {} as Record<string, number>,
      relaunchConversionRate: 0,
    };

    // Calculate section usage stats
    if (relaunchProjects && relaunchProjects.length > 0) {
      const keptSectionCounts: Record<string, number> = {};
      const revisitSectionCounts: Record<string, number> = {};
      let totalKept = 0;
      let totalRevisit = 0;
      let projectsWithKept = 0;
      let projectsWithRevisit = 0;

      relaunchProjects.forEach(p => {
        const kept = p.relaunch_kept_sections as string[] | null;
        const revisit = p.relaunch_revisit_sections as string[] | null;
        
        if (kept && kept.length > 0) {
          totalKept += kept.length;
          projectsWithKept++;
          kept.forEach(s => {
            keptSectionCounts[s] = (keptSectionCounts[s] || 0) + 1;
          });
        }
        
        if (revisit && revisit.length > 0) {
          totalRevisit += revisit.length;
          projectsWithRevisit++;
          revisit.forEach(s => {
            revisitSectionCounts[s] = (revisitSectionCounts[s] || 0) + 1;
          });
        }
      });

      relaunchStats.avgKeptSections = projectsWithKept > 0 ? Math.round((totalKept / projectsWithKept) * 10) / 10 : 0;
      relaunchStats.avgRevisitSections = projectsWithRevisit > 0 ? Math.round((totalRevisit / projectsWithRevisit) * 10) / 10 : 0;
      relaunchStats.mostKeptSections = keptSectionCounts;
      relaunchStats.mostRevisitedSections = revisitSectionCounts;
    }

    // Calculate relaunch conversion rate (relaunches / completed projects)
    const completedProjectsCount = projects?.filter(p => p.status === 'completed' || p.status === 'launched').length || 0;
    relaunchStats.relaunchConversionRate = completedProjectsCount > 0 
      ? Math.round((relaunchStats.totalRelaunches / completedProjectsCount) * 100) 
      : 0;

    logStep("Relaunch stats calculated", { totalRelaunches: relaunchStats.totalRelaunches });

    const response = {
      projectStats,
      contentStats,
      engagementStats,
      offerStats,
      onboardingFunnel,
      featureUsage,
      relaunchStats,
      generatedAt: new Date().toISOString(),
    };

    return jsonResponse(response, 200);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    const msg = errorMessage.toLowerCase();
    const status =
      msg.includes("unauthorized") || msg.includes("authentication") || msg.includes("jwt")
        ? 401
        : msg.includes("forbidden")
          ? 403
          : 500;
    return jsonResponse({ error: errorMessage }, status);
  }
});

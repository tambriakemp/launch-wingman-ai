import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Construct app URL from Supabase URL
const APP_URL = SUPABASE_URL.includes("supabase.co")
  ? SUPABASE_URL.replace(".supabase.co", ".lovable.app")
  : "https://launchely.com";

/**
 * Scheduled function to send:
 * 1. Check-in reminder emails (monthly/quarterly based on user preference)
 * 2. Relaunch invitation emails (30-60 days after project completion)
 * 3. Paused project reminder emails (14-30 days after pause)
 * 
 * Call this via cron job: every 24 hours
 */

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();
  const results = {
    checkInReminders: 0,
    relaunchInvitations: 0,
    pausedReminders: 0,
    errors: [] as string[],
  };

  try {
    // ===== 1. CHECK-IN REMINDERS =====
    console.log("Processing check-in reminders...");
    
    const { data: checkInPrefs, error: checkInError } = await supabase
      .from("check_in_preferences")
      .select("user_id, cadence, last_check_in_at, snoozed_until");

    if (checkInError) {
      console.error("Error fetching check-in preferences:", checkInError);
      results.errors.push("Failed to fetch check-in preferences");
    } else if (checkInPrefs) {
      for (const pref of checkInPrefs) {
        try {
          // Skip if snoozed
          if (pref.snoozed_until && new Date(pref.snoozed_until) > now) {
            continue;
          }

          const lastCheckIn = pref.last_check_in_at ? new Date(pref.last_check_in_at) : null;
          const cadence = pref.cadence || "monthly";
          const monthsToAdd = cadence === "quarterly" ? 3 : 1;
          
          let isDue = false;
          if (!lastCheckIn) {
            isDue = true;
          } else {
            const nextDue = new Date(lastCheckIn);
            nextDue.setMonth(nextDue.getMonth() + monthsToAdd);
            isDue = now >= nextDue;
          }

          if (!isDue) continue;

          // Check email preferences
          const { data: emailPref } = await supabase
            .from("email_preferences")
            .select("check_in_emails_enabled")
            .eq("user_id", pref.user_id)
            .maybeSingle();

          if (emailPref?.check_in_emails_enabled === false) {
            continue;
          }

          // Check rate limit (1 product email per week)
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          
          const { count } = await supabase
            .from("email_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", pref.user_id)
            .in("email_type", ["check_in_reminder", "relaunch_invitation", "playbook_ready", "paused_project_reminder"])
            .gte("sent_at", weekAgo.toISOString());

          if ((count || 0) > 0) continue;

          // Get user email from profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name")
            .eq("user_id", pref.user_id)
            .maybeSingle();

          const { data: { users } } = await supabase.auth.admin.listUsers();
          const user = users?.find(u => u.id === pref.user_id);
          
          if (!user?.email) continue;

          const firstName = profile?.first_name || user.user_metadata?.first_name || "there";
          
          await resend.emails.send({
            from: "Launchely <hello@launchely.com>",
            to: [user.email],
            subject: "A moment to pause and reflect",
            html: `
              <p>Hi ${firstName},</p>
              <p>Your ${cadence} check-in is ready whenever you are.</p>
              <p>This isn't about measuring progress or hitting goals. It's simply a moment to pause, reflect, and reconnect with what matters to you.</p>
              <p><a href="${APP_URL}/app">Start your check-in</a></p>
              <p>No rush. No pressure.</p>
              <p>Launchely</p>
            `,
          });

          await supabase.from("email_logs").insert({
            user_id: pref.user_id,
            email_type: "check_in_reminder",
          });

          results.checkInReminders++;
        } catch (err) {
          console.error("Check-in reminder error:", err);
          results.errors.push(`Check-in failed for ${pref.user_id}`);
        }
      }
    }

    // ===== 2. RELAUNCH INVITATIONS =====
    console.log("Processing relaunch invitations...");
    
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: completedProjects, error: projectError } = await supabase
      .from("projects")
      .select("user_id, name, updated_at")
      .eq("status", "completed")
      .gte("updated_at", sixtyDaysAgo.toISOString())
      .lte("updated_at", thirtyDaysAgo.toISOString());

    if (projectError) {
      console.error("Error fetching completed projects:", projectError);
      results.errors.push("Failed to fetch completed projects");
    } else if (completedProjects) {
      const userProjects = new Map<string, { name: string; updated_at: string }[]>();
      for (const proj of completedProjects) {
        if (!userProjects.has(proj.user_id)) {
          userProjects.set(proj.user_id, []);
        }
        userProjects.get(proj.user_id)!.push({ name: proj.name, updated_at: proj.updated_at });
      }

      for (const [userId, projects] of userProjects) {
        try {
          // Check for active projects
          const { count: activeCount } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .in("status", ["draft", "in_progress", "launched"]);

          if ((activeCount || 0) > 0) continue;

          // Check email preferences
          const { data: emailPref } = await supabase
            .from("email_preferences")
            .select("relaunch_emails_enabled")
            .eq("user_id", userId)
            .maybeSingle();

          if (emailPref?.relaunch_emails_enabled === false) continue;

          // Rate limit check
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          
          const { count: recentEmails } = await supabase
            .from("email_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .in("email_type", ["check_in_reminder", "relaunch_invitation", "playbook_ready", "paused_project_reminder"])
            .gte("sent_at", weekAgo.toISOString());

          if ((recentEmails || 0) > 0) continue;

          // Check if already sent relaunch this cycle
          const { count: existingRelaunch } = await supabase
            .from("email_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("email_type", "relaunch_invitation")
            .gte("sent_at", sixtyDaysAgo.toISOString());

          if ((existingRelaunch || 0) > 0) continue;

          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name")
            .eq("user_id", userId)
            .maybeSingle();

          const { data: { users } } = await supabase.auth.admin.listUsers();
          const user = users?.find(u => u.id === userId);
          
          if (!user?.email) continue;

          const firstName = profile?.first_name || user.user_metadata?.first_name || "there";
          const projectName = projects[0]?.name || "your project";
          
          await resend.emails.send({
            from: "Launchely <hello@launchely.com>",
            to: [user.email],
            subject: "Ready for another launch?",
            html: `
              <p>Hi ${firstName},</p>
              <p>It's been a little while since you completed ${projectName}.</p>
              <p>If you're thinking about launching again, Relaunch mode makes it easy to build on what worked. You can keep what you loved, revisit what needs refining, and start fresh where needed.</p>
              <p><a href="${APP_URL}/app">Explore Relaunch mode</a></p>
              <p>No pressure, just an option when you're ready.</p>
              <p>Launchely</p>
            `,
          });

          await supabase.from("email_logs").insert({
            user_id: userId,
            email_type: "relaunch_invitation",
            metadata: { project_name: projectName },
          });

          results.relaunchInvitations++;
        } catch (err) {
          console.error("Relaunch invitation error:", err);
          results.errors.push(`Relaunch failed for ${userId}`);
        }
      }
    }

    // ===== 3. PAUSED PROJECT REMINDERS =====
    console.log("Processing paused project reminders...");
    
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const thirtyDaysAgoForPause = new Date(now);
    thirtyDaysAgoForPause.setDate(thirtyDaysAgoForPause.getDate() - 30);

    const { data: pausedProjects, error: pausedError } = await supabase
      .from("projects")
      .select("id, user_id, name, updated_at")
      .eq("status", "paused")
      .gte("updated_at", thirtyDaysAgoForPause.toISOString())
      .lte("updated_at", fourteenDaysAgo.toISOString());

    if (pausedError) {
      console.error("Error fetching paused projects:", pausedError);
      results.errors.push("Failed to fetch paused projects");
    } else if (pausedProjects) {
      for (const proj of pausedProjects) {
        try {
          // Rate limit check
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          
          const { count: recentEmails } = await supabase
            .from("email_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", proj.user_id)
            .in("email_type", ["check_in_reminder", "relaunch_invitation", "playbook_ready", "paused_project_reminder"])
            .gte("sent_at", weekAgo.toISOString());

          if ((recentEmails || 0) > 0) continue;

          // Check if already sent paused reminder
          const { count: existingReminder } = await supabase
            .from("email_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", proj.user_id)
            .eq("email_type", "paused_project_reminder")
            .gte("sent_at", thirtyDaysAgoForPause.toISOString());

          if ((existingReminder || 0) > 0) continue;

          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name")
            .eq("user_id", proj.user_id)
            .maybeSingle();

          const { data: { users } } = await supabase.auth.admin.listUsers();
          const user = users?.find(u => u.id === proj.user_id);
          
          if (!user?.email) continue;

          const firstName = profile?.first_name || user.user_metadata?.first_name || "there";
          
          await resend.emails.send({
            from: "Launchely <hello@launchely.com>",
            to: [user.email],
            subject: `${proj.name} is waiting for you`,
            html: `
              <p>Hi ${firstName},</p>
              <p>Your project "${proj.name}" is still paused.</p>
              <p>Life gets busy — no judgment here. Whenever you're ready to pick back up, your progress is exactly where you left it.</p>
              <p><a href="${APP_URL}/project/${proj.id}">Resume your project</a></p>
              <p>Or if this project no longer fits, you can always archive it and start something new.</p>
              <p>Launchely</p>
            `,
          });

          await supabase.from("email_logs").insert({
            user_id: proj.user_id,
            email_type: "paused_project_reminder",
            metadata: { project_id: proj.id, project_name: proj.name },
          });

          results.pausedReminders++;
        } catch (err) {
          console.error("Paused reminder error:", err);
          results.errors.push(`Paused reminder failed for ${proj.user_id}`);
        }
      }
    }

    console.log("Scheduled email job complete:", results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in scheduled email job:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

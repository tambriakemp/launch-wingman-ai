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
    // Send once per completed project, 30-60 days after completion, only if user has no active projects
    console.log("Processing relaunch invitations...");
    
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Get completed projects that haven't had a relaunch invite sent yet
    const { data: completedProjects, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, name, updated_at, relaunch_invite_sent_at")
      .eq("status", "completed")
      .is("relaunch_invite_sent_at", null) // Never sent relaunch invite for this project
      .gte("updated_at", sixtyDaysAgo.toISOString())
      .lte("updated_at", thirtyDaysAgo.toISOString());

    if (projectError) {
      console.error("Error fetching completed projects:", projectError);
      results.errors.push("Failed to fetch completed projects");
    } else if (completedProjects) {
      for (const proj of completedProjects) {
        try {
          // Check if user has any active projects
          const { count: activeCount } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("user_id", proj.user_id)
            .in("status", ["draft", "in_progress", "launched"]);

          if ((activeCount || 0) > 0) {
            console.log(`Skipping ${proj.id}: user has active projects`);
            continue;
          }

          // Check email preferences (relaunch_emails_enabled)
          const { data: emailPref } = await supabase
            .from("email_preferences")
            .select("relaunch_emails_enabled")
            .eq("user_id", proj.user_id)
            .maybeSingle();

          if (emailPref?.relaunch_emails_enabled === false) {
            console.log(`Skipping ${proj.id}: user opted out of relaunch emails`);
            continue;
          }

          // Rate limit check (1 product email per week)
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          
          const { count: recentEmails } = await supabase
            .from("email_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", proj.user_id)
            .in("email_type", ["check_in_reminder", "relaunch_invitation", "playbook_ready", "paused_project_reminder"])
            .gte("sent_at", weekAgo.toISOString());

          if ((recentEmails || 0) > 0) {
            console.log(`Skipping ${proj.id}: rate limited`);
            continue;
          }

          // Get user profile and email
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name")
            .eq("user_id", proj.user_id)
            .maybeSingle();

          const { data: { users } } = await supabase.auth.admin.listUsers();
          const user = users?.find(u => u.id === proj.user_id);
          
          if (!user?.email) {
            console.log(`Skipping ${proj.id}: no email found`);
            continue;
          }

          const firstName = profile?.first_name || user.user_metadata?.first_name || "there";
          
          // Send email with exact copy from spec
          await resend.emails.send({
            from: "Launchely <hello@launchely.com>",
            to: [user.email],
            subject: "You don't have to start over",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
                <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  Just a gentle note — your project "${proj.name}" is still here.
                </p>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  If you've been thinking about revisiting it, you don't need to start from scratch.<br/>
                  Launchely can help you relaunch using what you've already clarified — and revisit only what needs attention now.
                </p>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  There's no pressure to do this today.<br/>
                  But when it feels right, you can pick things back up here:
                </p>
                
                <p style="margin: 30px 0;">
                  <a href="${APP_URL}/projects/${proj.id}/relaunch" 
                     style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                    👉 Plan a relaunch
                  </a>
                </p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #666;">
                  Whenever you're ready is the right time.
                </p>
                
                <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
                  —<br/>
                  Launchely
                </p>
              </div>
            `,
          });

          // Mark this project as having received relaunch invite
          await supabase
            .from("projects")
            .update({ relaunch_invite_sent_at: now.toISOString() })
            .eq("id", proj.id);

          // Log the email
          await supabase.from("email_logs").insert({
            user_id: proj.user_id,
            email_type: "relaunch_invitation",
            metadata: { project_id: proj.id, project_name: proj.name },
          });

          console.log(`Sent relaunch invitation for project ${proj.id}`);
          results.relaunchInvitations++;
        } catch (err) {
          console.error("Relaunch invitation error:", err);
          results.errors.push(`Relaunch failed for project ${proj.id}`);
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

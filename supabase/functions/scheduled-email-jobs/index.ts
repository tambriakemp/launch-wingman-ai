import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import Stripe from "https://esm.sh/stripe@18.5.0";

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
    proUpgradeEmails: 0,
    goalProgressReminders: 0,
    errors: [] as string[],
  };

  try {
    // ===== 1. MONTHLY/QUARTERLY CHECK-IN REMINDERS =====
    // Send based on user's selected cadence, skip if check-in completed in last 7 days
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
            console.log(`Skipping ${pref.user_id}: snoozed until ${pref.snoozed_until}`);
            continue;
          }

          // Check if user completed a check-in in the last 7 days
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const { data: recentCheckIn } = await supabase
            .from("check_ins")
            .select("id")
            .eq("user_id", pref.user_id)
            .gte("created_at", sevenDaysAgo.toISOString())
            .limit(1);

          if (recentCheckIn && recentCheckIn.length > 0) {
            console.log(`Skipping ${pref.user_id}: completed check-in in last 7 days`);
            continue;
          }

          // Calculate if check-in is due based on cadence
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

          if (!isDue) {
            console.log(`Skipping ${pref.user_id}: check-in not yet due`);
            continue;
          }

          // Check email preferences (check_in_emails_enabled)
          const { data: emailPref } = await supabase
            .from("email_preferences")
            .select("check_in_emails_enabled")
            .eq("user_id", pref.user_id)
            .maybeSingle();

          if (emailPref?.check_in_emails_enabled === false) {
            console.log(`Skipping ${pref.user_id}: opted out of check-in emails`);
            continue;
          }

          // Rate limit check (1 product email per week)
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          
          const { count } = await supabase
            .from("email_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", pref.user_id)
            .in("email_type", ["check_in_reminder", "relaunch_invitation", "playbook_ready", "paused_project_reminder"])
            .gte("sent_at", weekAgo.toISOString());

          if ((count || 0) > 0) {
            console.log(`Skipping ${pref.user_id}: rate limited`);
            continue;
          }

          // Get user email from profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name")
            .eq("user_id", pref.user_id)
            .maybeSingle();

          const { data: { users } } = await supabase.auth.admin.listUsers();
          const user = users?.find(u => u.id === pref.user_id);
          
          if (!user?.email) {
            console.log(`Skipping ${pref.user_id}: no email found`);
            continue;
          }

          const firstName = profile?.first_name || user.user_metadata?.first_name || "there";
          
          // Send email with exact copy from spec
          await resend.emails.send({
            from: "Launchely <hello@launchely.com>",
            to: [user.email],
            subject: "A quick moment to reflect",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
                <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  Just checking in.
                </p>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  This isn't a reminder or a push to do anything — just a quick moment to notice where you are and what feels right next.
                </p>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  If you want, you can take a short check-in inside Launchely.<br/>
                  It takes a minute or two, and there's nothing you have to decide.
                </p>
                
                <p style="margin: 30px 0;">
                  <a href="${APP_URL}/app?checkin=true" 
                     style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                    👉 Start check-in
                  </a>
                </p>
                
                <p style="font-size: 16px; line-height: 1.6; color: #666;">
                  Or feel free to ignore this and come back whenever it makes sense.<br/>
                  Launchely will be here either way.
                </p>
                
                <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
                  —<br/>
                  Launchely
                </p>
              </div>
            `,
          });

          await supabase.from("email_logs").insert({
            user_id: pref.user_id,
            email_type: "check_in_reminder",
          });

          console.log(`Sent check-in reminder to ${pref.user_id}`);
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

    // ===== 4. SOFT PRO UPGRADE EMAILS =====
    // Send when: 2+ check-ins completed OR hit free project limit (3 projects)
    // Rules: Not within first 30 days, not already Pro, max 1 per quarter
    console.log("Processing pro upgrade emails...");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" }) : null;
    
    const thirtyDaysAgoForSignup = new Date(now);
    thirtyDaysAgoForSignup.setDate(thirtyDaysAgoForSignup.getDate() - 30);
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Get users with 2+ check-ins
    const { data: eligibleByCheckIns } = await supabase
      .from("check_ins")
      .select("user_id")
      .gte("created_at", "1970-01-01"); // All check-ins
    
    // Count check-ins per user
    const checkInCounts = new Map<string, number>();
    if (eligibleByCheckIns) {
      for (const ci of eligibleByCheckIns) {
        checkInCounts.set(ci.user_id, (checkInCounts.get(ci.user_id) || 0) + 1);
      }
    }
    
    const usersWithTwoCheckIns = Array.from(checkInCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([userId]) => userId);

    // Get users who hit free project limit (3+ projects)
    const { data: projectCounts } = await supabase
      .from("projects")
      .select("user_id");
    
    const projectCountMap = new Map<string, number>();
    if (projectCounts) {
      for (const p of projectCounts) {
        projectCountMap.set(p.user_id, (projectCountMap.get(p.user_id) || 0) + 1);
      }
    }
    
    const usersAtProjectLimit = Array.from(projectCountMap.entries())
      .filter(([_, count]) => count >= 3)
      .map(([userId]) => userId);

    // Combine eligible users (unique)
    const eligibleUserIds = [...new Set([...usersWithTwoCheckIns, ...usersAtProjectLimit])];
    
    console.log(`Found ${eligibleUserIds.length} potentially eligible users for pro upgrade`);

    for (const userId of eligibleUserIds) {
      try {
        // Check if user signed up more than 30 days ago
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const user = users?.find(u => u.id === userId);
        
        if (!user?.email) {
          console.log(`Skipping ${userId}: no email found`);
          continue;
        }

        const signupDate = new Date(user.created_at);
        if (signupDate > thirtyDaysAgoForSignup) {
          console.log(`Skipping ${userId}: signed up less than 30 days ago`);
          continue;
        }

        // Check if already on Pro (has active Stripe subscription)
        if (stripe) {
          const customers = await stripe.customers.list({ email: user.email, limit: 1 });
          if (customers.data.length > 0) {
            const subscriptions = await stripe.subscriptions.list({
              customer: customers.data[0].id,
              status: "active",
              limit: 1,
            });
            if (subscriptions.data.length > 0) {
              console.log(`Skipping ${userId}: already on Pro`);
              continue;
            }
          }
        }

        // Check email preferences (product_emails_enabled)
        const { data: emailPref } = await supabase
          .from("email_preferences")
          .select("product_emails_enabled")
          .eq("user_id", userId)
          .maybeSingle();

        if (emailPref?.product_emails_enabled === false) {
          console.log(`Skipping ${userId}: opted out of product emails`);
          continue;
        }

        // Check if pro_upgrade email was sent in the last 90 days (max 1 per quarter)
        const { count: recentProEmail } = await supabase
          .from("email_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("email_type", "pro_upgrade")
          .gte("sent_at", ninetyDaysAgo.toISOString());

        if ((recentProEmail || 0) > 0) {
          console.log(`Skipping ${userId}: pro upgrade email sent in last 90 days`);
          continue;
        }

        // Rate limit check (1 product email per week)
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { count: recentEmails } = await supabase
          .from("email_logs")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .in("email_type", ["check_in_reminder", "relaunch_invitation", "playbook_ready", "paused_project_reminder", "pro_upgrade"])
          .gte("sent_at", weekAgo.toISOString());

        if ((recentEmails || 0) > 0) {
          console.log(`Skipping ${userId}: rate limited`);
          continue;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("user_id", userId)
          .maybeSingle();

        const firstName = profile?.first_name || user.user_metadata?.first_name || "there";

        // Send email with exact copy from spec
        await resend.emails.send({
          from: "Launchely <hello@launchely.com>",
          to: [user.email],
          subject: "If you want to go a little deeper",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
              <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
              
              <p style="font-size: 16px; line-height: 1.6;">
                Launchely is designed to support you whether you're actively launching or just thinking things through.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6;">
                Some people choose to stay on the Core plan and use Launchely as needed.<br/>
                Others move to Pro because they want deeper continuity — more space to reuse past work, reflect across launches, and let Launchely remember more over time.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6;">
                There's no right choice, and no rush to decide.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6;">
                If you're curious, here's what Pro adds — quietly and without changing how you use the app:
              </p>
              
              <ul style="font-size: 16px; line-height: 1.8; color: #555; margin: 20px 0;">
                <li>Deeper Project Memory across relaunches</li>
                <li>A more detailed Launch Playbook as patterns emerge</li>
                <li>Ongoing Check-Ins that adapt over time</li>
                <li>Unlimited projects, whenever you need them</li>
              </ul>
              
              <p style="font-size: 16px; line-height: 1.6;">
                If that sounds useful right now, you can take a look here:
              </p>
              
              <p style="margin: 30px 0;">
                <a href="${APP_URL}/pricing" 
                   style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                  👉 View Pro plan
                </a>
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #666;">
                And if not, that's completely fine.<br/>
                Launchely will keep working the same way either way.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
                —<br/>
                Launchely
              </p>
            </div>
          `,
        });

        // Log the email
        await supabase.from("email_logs").insert({
          user_id: userId,
          email_type: "pro_upgrade",
        });

        console.log(`Sent pro upgrade email to ${userId}`);
        results.proUpgradeEmails++;
      } catch (err) {
        console.error("Pro upgrade email error:", err);
        results.errors.push(`Pro upgrade failed for ${userId}`);
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

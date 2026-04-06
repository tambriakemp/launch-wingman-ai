import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email types
type EmailType = 
  | "welcome"
  | "project_created"
  | "launch_completed"
  | "project_completed"
  | "relaunch_invitation"
  | "relaunch_created"
  | "check_in_reminder"
  | "playbook_ready"
  | "paused_project_reminder"
  | "pro_upgrade"
  | "goal_progress_reminder";

interface EmailRequest {
  email_type: EmailType;
  user_id: string;
  data?: Record<string, any>;
}

interface UserProfile {
  first_name: string | null;
  email: string;
}

const logStep = (step: string, details?: any) => {
  console.log(`[NOTIFICATION-EMAIL] ${step}`, details ? JSON.stringify(details) : "");
};

// Email templates - calm, minimal, no urgency
const getEmailContent = (
  type: EmailType, 
  profile: UserProfile,
  data?: Record<string, any>
): { subject: string; html: string } => {
  const firstName = profile.first_name || "there";
  const appUrl = Deno.env.get("APP_URL") || "https://launchely.com";

  switch (type) {
    case "welcome":
      return {
        subject: "Welcome to Launchely",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">Welcome to Launchely 👋</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Launchely is here to help you plan, launch, and market an offer without overwhelm, pressure, or complicated systems.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">You won't find:</p>
            <ul style="font-size: 16px; line-height: 1.8; color: #666;">
              <li>funnel builders</li>
              <li>automation chaos</li>
              <li>endless decisions</li>
            </ul>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Instead, you'll be guided step by step — seeing only what matters right now.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              The best way to start is simple:<br/>
              Create one project and follow the next step in front of you.<br/>
              You don't need a full plan yet. Clarity builds as you move.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">Whenever you're ready, you can begin here:</p>
            
            <p style="margin: 30px 0;">
              <a href="${appUrl}/projects" 
                 style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                👉 Create your first project
              </a>
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              No rush. No pressure.<br/>
              Just a calmer way forward.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 40px;">Launchely</p>
          </div>
        `,
      };

    case "project_created":
      return {
        subject: "Your project is ready",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Your project "${data?.projectName || "new project"}" is ready ✨
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              You don't need to have everything figured out yet.<br/>
              Launchely will guide you one step at a time — starting with the next task that actually matters.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Whenever you're ready, you can continue here:
            </p>
            
            <p style="margin: 30px 0;">
              <a href="${appUrl}/projects/${data?.projectId || ""}" 
                 style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                👉 Continue your project
              </a>
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              No pressure to move fast.<br/>
              Just focus on the step in front of you.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
              —<br/>
              Launchely
            </p>
          </div>
        `,
      };

    case "launch_completed":
      return {
        subject: "You did the thing",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              You did the thing 🎉
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Your project "${data?.projectName || "project"}" is officially live.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              However it feels right now — excited, relieved, unsure, or somewhere in between — it's all normal. Launching isn't just about outcomes. It's about showing up and following through.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              There's nothing you need to fix or optimize at this stage.<br/>
              When you're ready, Launchely will guide you through a simple post-launch reflection.
            </p>
            
            <p style="margin: 30px 0;">
              <a href="${appUrl}/projects/${data?.projectId || ""}/execute" 
                 style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                👉 Continue to post-launch
              </a>
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              For now, take a breath.<br/>
              You showed up — and that counts.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
              —<br/>
              Launchely
            </p>
          </div>
        `,
      };

    case "project_completed":
      return {
        subject: "This chapter is complete",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Your project "${data?.projectName || "project"}" is complete ✔️
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Closing the loop matters.<br/>
              It gives you space to reflect, rest, or decide what comes next — without pressure to move on immediately.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              You don't need to plan your next step right now.<br/>
              When you're ready, you can revisit this project, relaunch it, or start something entirely new.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              For now, here's a snapshot of what you've completed:
            </p>
            
            <p style="margin: 30px 0;">
              <a href="${appUrl}/projects/${data?.projectId || ""}" 
                 style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                👉 View project summary
              </a>
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              Take your time.<br/>
              You finished something — and that matters.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
              —<br/>
              Launchely
            </p>
          </div>
        `,
      };

    case "relaunch_invitation":
      return {
        subject: "You don't have to start over",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Just a gentle note — your project "${data?.projectName || "project"}" is still here.
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
              <a href="${appUrl}/projects/${data?.projectId || ""}/relaunch" 
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
      };

    case "relaunch_created":
      return {
        subject: "Your relaunch is ready",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Your new project "${data?.newProjectName || "project"}" has been created.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              ${data?.skipMemory 
                ? "You've chosen a fresh start — a blank slate to build something new."
                : `It carries forward the foundations you built in "${data?.parentProjectName || "your previous project"}" — the things that worked.`}
            </p>
            
            ${!data?.skipMemory && data?.revisitCount && data.revisitCount > 0 ? `
              <p style="font-size: 16px; line-height: 1.6;">
                There are ${data?.revisitCount} section(s) marked for review — things you wanted to revisit this time around.
              </p>
            ` : ''}
            
            <p style="font-size: 16px; line-height: 1.6;">
              When you're ready, you can pick up where your new journey begins:
            </p>
            
            <p style="margin: 30px 0;">
              <a href="${appUrl}/projects/${data?.projectId || ""}/dashboard" 
                 style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                👉 Go to your new project
              </a>
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              Take your time.<br/>
              Relaunching is a sign of progress, not starting over.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
              —<br/>
              Launchely
            </p>
          </div>
        `,
      };

    case "check_in_reminder":
      return {
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
              <a href="${appUrl}/app?checkin=true" 
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
      };

    case "playbook_ready":
      return {
        subject: "Your Launch Playbook is ready",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              You've completed a couple of projects in Launchely — and something new is ready for you.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Your Launch Playbook is a quiet reflection of how you tend to plan, message, and launch.<br/>
              There's no scoring, no advice, and nothing to fix. It's simply a way to see what's been consistent for you over time.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              You don't need to use it for anything right now.<br/>
              But if you're curious, you can take a look here:
            </p>
            
            <p style="margin: 30px 0;">
              <a href="${appUrl}/playbook" 
                 style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                👉 View your Launch Playbook
              </a>
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              This will continue to grow as you complete more projects — at your pace.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
              —<br/>
              Launchely
            </p>
          </div>
        `,
      };

    case "paused_project_reminder":
      return {
        subject: "Still here when you're ready",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Your project "${data?.projectName || "project"}" has been paused for a little while. Just wanted you to know it's right where you left it.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              There's no deadline, no pressure to return. Sometimes stepping away is exactly what's needed.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              If you ever want to pick it back up, everything is still there — ready when you are.
            </p>
            
            <p style="margin: 30px 0;">
              <a href="${appUrl}/projects/${data?.projectId || ""}" 
                 style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                Resume project
              </a>
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              Launchely
            </p>
          </div>
        `,
      };

    case "pro_upgrade":
      return {
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
              <a href="${appUrl}/pricing" 
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
      };

    default:
      return {
        subject: "A message from Launchely",
        html: `<p>Hi ${firstName}, you have a notification from Launchely.</p>`,
      };
  }
};

// Check if we can send a product email (max 1 per week)
// Exception: onboarding emails (welcome, project_created) and state-change emails always go through
async function canSendProductEmail(
  supabase: any, 
  userId: string, 
  emailType: EmailType
): Promise<boolean> {
  // Onboarding and state-change emails always go through
  const alwaysAllowed: EmailType[] = ["welcome", "project_created", "launch_completed", "project_completed", "playbook_ready"];
  if (alwaysAllowed.includes(emailType)) return true;

  // Check last product email sent (excluding always-allowed emails)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: recentEmails, error } = await supabase
    .from("email_logs")
    .select("id")
    .eq("user_id", userId)
    .not("email_type", "in", '("welcome","project_created","launch_completed","project_completed","playbook_ready")') // Exclude always-allowed
    .gte("sent_at", oneWeekAgo.toISOString())
    .limit(1);

  if (error) {
    logStep("Error checking recent emails", error);
    return false;
  }

  return !recentEmails || recentEmails.length === 0;
}

// Check user email preferences
async function checkEmailPreferences(
  supabase: any,
  userId: string,
  emailType: EmailType
): Promise<boolean> {
  // Welcome emails always go through
  if (emailType === "welcome" || emailType === "project_created") return true;

  const { data: prefs, error } = await supabase
    .from("email_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logStep("Error fetching preferences", error);
    return true; // Default to sending if can't check
  }

  // If no preferences, default to enabled
  if (!prefs) return true;

  // Check preference based on email type
  if (emailType === "check_in_reminder") {
    return prefs.check_in_emails_enabled !== false;
  }
  
  if (emailType === "relaunch_invitation") {
    return prefs.relaunch_emails_enabled !== false;
  }

  // All other product emails
  return prefs.product_emails_enabled !== false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email_type, user_id, data }: EmailRequest = await req.json();
    logStep("Received request", { email_type, user_id });

    // Get user info
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !userData.user) {
      throw new Error("User not found");
    }

    const userEmail = userData.user.email!;

    // Get profile for first name
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("user_id", user_id)
      .maybeSingle();

    const userProfile: UserProfile = {
      first_name: profile?.first_name || null,
      email: userEmail,
    };

    // Check preferences
    const preferencesAllowed = await checkEmailPreferences(supabase, user_id, email_type);
    if (!preferencesAllowed) {
      logStep("Email blocked by user preferences", { email_type });
      return new Response(
        JSON.stringify({ success: false, reason: "blocked_by_preferences" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit (1 product email per week)
    const canSend = await canSendProductEmail(supabase, user_id, email_type);
    if (!canSend) {
      logStep("Email rate limited", { email_type });
      return new Response(
        JSON.stringify({ success: false, reason: "rate_limited" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email content
    const { subject, html } = getEmailContent(email_type, userProfile, data);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Launchely <hello@launchely.com>",
      to: [userEmail],
      subject,
      html,
    });

    logStep("Email sent", emailResponse);

    // Log the sent email
    await supabase.from("email_logs").insert({
      user_id,
      email_type,
      metadata: data || {},
    });

    return new Response(
      JSON.stringify({ success: true, email_id: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    logStep("Error", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

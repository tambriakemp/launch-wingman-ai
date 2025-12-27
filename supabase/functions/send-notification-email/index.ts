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
  | "check_in_reminder"
  | "playbook_ready"
  | "paused_project_reminder";

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
              You've completed your project "${data?.projectName || "project"}". That's worth acknowledging.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Whether it was a small launch or a big one, every finished project teaches you something. Those lessons compound over time.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              If you'd like, you can revisit your project summary anytime — or simply move on when you're ready for what's next.
            </p>
            
            <p style="margin: 30px 0;">
              <a href="${appUrl}/projects/${data?.projectId || ""}" 
                 style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                View project summary
              </a>
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              Launchely
            </p>
          </div>
        `,
      };

    case "relaunch_invitation":
      return {
        subject: "Ready for round two?",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              It's been a while since your last launch. Just checking in — no pressure at all.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              If you're thinking about running another launch, Launchely can help you build on what you've already learned. Your past work is already there, ready to be adapted.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              This is completely optional. Only you know when the time is right.
            </p>
            
            <p style="margin: 30px 0;">
              <a href="${appUrl}/projects/${data?.projectId || ""}/relaunch" 
                 style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                Explore relaunch options
              </a>
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              Launchely
            </p>
          </div>
        `,
      };

    case "check_in_reminder":
      return {
        subject: "A gentle check-in",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              It's time for your ${data?.cadence || "regular"} check-in — a quiet moment to reflect on where you are and what you want next.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              There's nothing to track or measure. Just a few questions to help you reconnect with your direction.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              This is optional. Take it whenever you're ready, or skip it entirely if now isn't the right time.
            </p>
            
            <p style="margin: 30px 0;">
              <a href="${appUrl}/app" 
                 style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                Start check-in
              </a>
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
              Launchely
            </p>
          </div>
        `,
      };

    case "playbook_ready":
      return {
        subject: "Your Launch Playbook is taking shape",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333;">
            <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              You've completed two projects now. That means something valuable is emerging — your personal launch playbook.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              This is a collection of patterns from your past launches: what worked, what you learned, what you might do differently next time.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              It's there whenever you want to look back — and it'll only get richer with each launch you complete.
            </p>
            
            <p style="margin: 30px 0;">
              <a href="${appUrl}/playbook" 
                 style="display: inline-block; background: #333; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 14px;">
                View your playbook
              </a>
            </p>
            
            <p style="font-size: 16px; line-height: 1.6; color: #666;">
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

    default:
      return {
        subject: "A message from Launchely",
        html: `<p>Hi ${firstName}, you have a notification from Launchely.</p>`,
      };
  }
};

// Check if we can send a product email (max 1 per week)
// Exception: onboarding emails (welcome, project_created) and state-change emails (launch_completed) always go through
async function canSendProductEmail(
  supabase: any, 
  userId: string, 
  emailType: EmailType
): Promise<boolean> {
  // Onboarding and state-change emails always go through
  const alwaysAllowed: EmailType[] = ["welcome", "project_created", "launch_completed"];
  if (alwaysAllowed.includes(emailType)) return true;

  // Check last product email sent (excluding always-allowed emails)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const { data: recentEmails, error } = await supabase
    .from("email_logs")
    .select("id")
    .eq("user_id", userId)
    .not("email_type", "in", '("welcome","project_created","launch_completed")') // Exclude always-allowed
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

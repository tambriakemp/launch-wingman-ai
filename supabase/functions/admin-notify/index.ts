import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-NOTIFY] ${step}${detailsStr}`);
};

interface NotificationRequest {
  type: 'suspicious_activity' | 'new_signup' | 'subscription_change' | 'pro_signup' | 'pro_cancellation';
  user_email: string;
  user_id?: string;
  details: {
    ip_address?: string;
    user_agent?: string;
    reason?: string;
    subscription_status?: string;
    unique_ips_count?: number;
    login_count?: number;
    time_window?: string;
    user_name?: string;
  };
}

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

    // Get notification data from request body
    const notification: NotificationRequest = await req.json();
    logStep("Notification received", { type: notification.type, user_email: notification.user_email });

    // Get admin emails (users with admin role)
    const { data: adminRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (rolesError) {
      logStep("Error fetching admin roles", { error: rolesError.message });
      throw new Error(`Failed to fetch admins: ${rolesError.message}`);
    }

    if (!adminRoles || adminRoles.length === 0) {
      logStep("No admins found to notify");
      return new Response(JSON.stringify({ success: true, message: 'No admins to notify' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get admin emails from auth.users via admin API
    const adminUserIds = adminRoles.map(r => r.user_id);
    const { data: { users: adminUsers }, error: usersError } = await supabaseClient.auth.admin.listUsers();

    if (usersError) {
      logStep("Error fetching admin users", { error: usersError.message });
      throw new Error(`Failed to fetch admin users: ${usersError.message}`);
    }

    const adminEmails = adminUsers
      .filter(u => adminUserIds.includes(u.id))
      .map(u => u.email)
      .filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      logStep("No admin emails found");
      return new Response(JSON.stringify({ success: true, message: 'No admin emails found' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Admin emails found", { count: adminEmails.length });

    // Build email content based on notification type
    let subject = '';
    let htmlContent = '';

    switch (notification.type) {
      case 'suspicious_activity':
        subject = `🚨 Suspicious Activity Alert - ${notification.user_email}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">⚠️ Suspicious Activity Detected</h2>
            <p>Unusual login activity has been detected for the following user:</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p><strong>Email:</strong> ${notification.user_email}</p>
              ${notification.details.ip_address ? `<p><strong>IP Address:</strong> ${notification.details.ip_address}</p>` : ''}
              ${notification.details.reason ? `<p><strong>Reason:</strong> ${notification.details.reason}</p>` : ''}
              ${notification.details.unique_ips_count ? `<p><strong>Unique IPs:</strong> ${notification.details.unique_ips_count} in ${notification.details.time_window || 'recent period'}</p>` : ''}
              ${notification.details.login_count ? `<p><strong>Login Attempts:</strong> ${notification.details.login_count}</p>` : ''}
            </div>
            <p>Please review this activity in the admin dashboard.</p>
            <p style="color: #6b7280; font-size: 12px;">This is an automated security notification from Launchely.</p>
          </div>
        `;
        break;

      case 'new_signup':
        subject = `👋 New User Signup - ${notification.user_email}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">🎉 New User Registration</h2>
            <p>A new user has signed up for Launchely:</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p><strong>Email:</strong> ${notification.user_email}</p>
              ${notification.details.ip_address ? `<p><strong>IP Address:</strong> ${notification.details.ip_address}</p>` : ''}
            </div>
            <p>You can view and manage this user in the admin dashboard.</p>
            <p style="color: #6b7280; font-size: 12px;">This is an automated notification from Launchely.</p>
          </div>
        `;
        break;

      case 'subscription_change':
        subject = `💳 Subscription Change - ${notification.user_email}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">💳 Subscription Update</h2>
            <p>A user's subscription status has changed:</p>
            <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p><strong>Email:</strong> ${notification.user_email}</p>
              <p><strong>New Status:</strong> ${notification.details.subscription_status || 'Unknown'}</p>
            </div>
            <p style="color: #6b7280; font-size: 12px;">This is an automated notification from Launchely.</p>
          </div>
        `;
        break;

      case 'pro_signup':
        subject = `🎉 New Pro Subscriber - ${notification.user_email}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">🎉 New Pro Subscription!</h2>
            <p>A user has upgraded to Pro:</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p><strong>Email:</strong> ${notification.user_email}</p>
              ${notification.details.user_name ? `<p><strong>Name:</strong> ${notification.details.user_name}</p>` : ''}
            </div>
            <p>💰 New recurring revenue! You can view this user in the admin dashboard.</p>
            <p style="color: #6b7280; font-size: 12px;">This is an automated notification from Launchely.</p>
          </div>
        `;
        break;

      case 'pro_cancellation':
        subject = `😢 Pro Cancellation - ${notification.user_email}`;
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">😢 Pro Subscription Cancelled</h2>
            <p>A user has cancelled their Pro subscription:</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p><strong>Email:</strong> ${notification.user_email}</p>
              ${notification.details.user_name ? `<p><strong>Name:</strong> ${notification.details.user_name}</p>` : ''}
            </div>
            <p>Consider reaching out to understand why they cancelled.</p>
            <p style="color: #6b7280; font-size: 12px;">This is an automated notification from Launchely.</p>
          </div>
        `;
        break;
    }

    // Send email using Resend API directly
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      logStep("RESEND_API_KEY not configured, skipping email");
      return new Response(JSON.stringify({ success: true, message: 'Email skipped - no API key' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Launchely <onboarding@resend.dev>",
        to: adminEmails,
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();
    logStep("Email sent", { response: emailResult });

    return new Response(JSON.stringify({ success: true, emailResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

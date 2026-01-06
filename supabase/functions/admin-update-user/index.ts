import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

async function sendEmailUpdateNotification(email: string, oldEmail: string) {
  try {
    await resend.emails.send({
      from: "Launchely <hello@launchely.com>",
      to: [email],
      subject: "Your Email Has Been Updated",
      html: `
        <h2>Email Address Updated</h2>
        <p>Hello,</p>
        <p>Your account email has been updated from <strong>${oldEmail}</strong> to <strong>${email}</strong>.</p>
        <p>If you did not request this change, please contact our support team immediately.</p>
        <p>Best regards,<br>The Launchely Team</p>
      `,
    });
    console.log(`Email update notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send email update notification:', error);
    return false;
  }
}

async function sendTempPasswordNotification(email: string, tempPassword: string) {
  try {
    await resend.emails.send({
      from: "Launchely <hello@launchely.com>",
      to: [email],
      subject: "Your Temporary Password",
      html: `
        <h2>Temporary Password</h2>
        <p>Hello,</p>
        <p>A temporary password has been set for your account. Please use the following password to log in:</p>
        <p style="font-family: monospace; font-size: 18px; background: #f4f4f4; padding: 12px; border-radius: 6px; display: inline-block;">
          ${tempPassword}
        </p>
        <p><strong>Important:</strong> Please change your password immediately after logging in for security reasons.</p>
        <p>If you did not request this, please contact our support team immediately.</p>
        <p>Best regards,<br>The Launchely Team</p>
      `,
    });
    console.log(`Temp password notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send temp password notification:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: adminUser }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !adminUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: adminRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !adminRole) {
      console.error('Role check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, user_id, new_email, send_notification, old_email } = await req.json();

    console.log(`Admin ${adminUser.email} performing action: ${action} on user ${user_id}`);

    if (action === 'update_email') {
      if (!user_id || !new_email) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: user_id and new_email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(new_email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update the user's email
      const { data: updatedUser, error: updateError } = await supabaseClient.auth.admin.updateUserById(
        user_id,
        { email: new_email, email_confirm: true }
      );

      if (updateError) {
        console.error('Error updating email:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send email notification if requested
      let emailSent = false;
      if (send_notification) {
        emailSent = await sendEmailUpdateNotification(new_email, old_email || 'your previous email');
      }

      // Log to legacy table
      await supabaseClient.from('impersonation_logs').insert({
        admin_user_id: adminUser.id,
        admin_email: adminUser.email,
        target_user_id: user_id,
        target_email: new_email,
        action: 'email_update'
      });

      // Log to admin_action_logs for comprehensive audit
      await supabaseClient.from('admin_action_logs').insert({
        admin_user_id: adminUser.id,
        admin_email: adminUser.email,
        target_user_id: user_id,
        target_email: new_email,
        action_type: 'email_updated',
        action_details: { old_email: old_email || 'unknown', new_email }
      });

      console.log(`Email updated successfully for user ${user_id} to ${new_email}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email updated to ${new_email}${emailSent ? ' (notification sent)' : ''}`,
          user: updatedUser.user,
          email_sent: emailSent
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'set_temp_password') {
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: user_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate a secure temporary password
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      const specialChars = '!@#$%';
      let tempPassword = '';
      
      // Generate 10 random characters
      for (let i = 0; i < 10; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      // Add a special character
      tempPassword += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
      // Add a number to ensure complexity
      tempPassword += Math.floor(Math.random() * 10);

      // Get user's current email for notification
      const { data: targetUser } = await supabaseClient.auth.admin.getUserById(user_id);
      const userEmail = targetUser?.user?.email;

      // Update the user's password
      const { data: updatedUser, error: updateError } = await supabaseClient.auth.admin.updateUserById(
        user_id,
        { password: tempPassword }
      );

      if (updateError) {
        console.error('Error setting password:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send email notification if requested
      let emailSent = false;
      if (send_notification && userEmail) {
        emailSent = await sendTempPasswordNotification(userEmail, tempPassword);
      }

      // Log to legacy table (don't log the password!)
      await supabaseClient.from('impersonation_logs').insert({
        admin_user_id: adminUser.id,
        admin_email: adminUser.email,
        target_user_id: user_id,
        target_email: updatedUser.user?.email || 'unknown',
        action: 'temp_password_set'
      });

      // Log to admin_action_logs for comprehensive audit
      await supabaseClient.from('admin_action_logs').insert({
        admin_user_id: adminUser.id,
        admin_email: adminUser.email,
        target_user_id: user_id,
        target_email: updatedUser.user?.email || 'unknown',
        action_type: 'password_reset',
        action_details: { email_sent: emailSent }
      });

      console.log(`Temporary password set for user ${user_id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Temporary password generated${emailSent ? ' and sent to user' : ''}`,
          temp_password: tempPassword,
          email_sent: emailSent
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "update_email" or "set_temp_password"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in admin-update-user function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sanitize user ID for logging (show only first 8 chars)
const sanitizeId = (id: string) => id ? `${id.substring(0, 8)}...` : 'unknown';

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRACK-ACTIVITY] ${step}${detailsStr}`);
};

// Check for suspicious activity patterns
async function checkSuspiciousActivity(
  supabaseClient: any,
  userId: string
): Promise<{ isSuspicious: boolean; reason?: string; uniqueIpCount?: number; loginCount?: number }> {
  try {
    // Get login activity from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentActivity, error } = await supabaseClient
      .from('user_activity')
      .select('ip_address, created_at')
      .eq('user_id', userId)
      .eq('event_type', 'login')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false });

    if (error) {
      logStep("Error checking suspicious activity");
      return { isSuspicious: false };
    }

    const uniqueIPs = [...new Set(recentActivity?.map((a: any) => a.ip_address).filter(Boolean))];
    const loginCount = recentActivity?.length || 0;

    // Flag as suspicious if:
    // 1. More than 5 unique IPs in 24 hours
    // 2. More than 20 logins in 24 hours
    if (uniqueIPs.length >= 5) {
      return {
        isSuspicious: true,
        reason: 'Multiple IP addresses detected in short time period',
        uniqueIpCount: uniqueIPs.length,
        loginCount,
      };
    }

    if (loginCount >= 20) {
      return {
        isSuspicious: true,
        reason: 'Unusually high number of login attempts',
        uniqueIpCount: uniqueIPs.length,
        loginCount,
      };
    }

    return { isSuspicious: false };
  } catch (error) {
    logStep("Error in suspicious activity check");
    return { isSuspicious: false };
  }
}

// Send admin notification
async function notifyAdmins(
  type: 'suspicious_activity' | 'new_signup',
  userEmail: string,
  userId: string,
  details: any
) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const response = await fetch(`${supabaseUrl}/functions/v1/admin-notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        type,
        user_email: userEmail,
        user_id: userId,
        details,
      }),
    });

    if (!response.ok) {
      logStep("Admin notification failed", { status: response.status });
    } else {
      logStep("Admin notification sent", { type });
    }
  } catch (error) {
    logStep("Error sending admin notification");
  }
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: sanitizeId(user.id) });

    const body = await req.json().catch(() => ({}));
    const eventType = body.event_type || 'login';
    const isNewSignup = body.is_new_signup || false;
    const userAgent = req.headers.get("user-agent") || null;
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : null;

    // Insert activity record
    const { error: activityError } = await supabaseClient
      .from('user_activity')
      .insert({
        user_id: user.id,
        event_type: eventType,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (activityError) {
      logStep("Error inserting activity");
    } else {
      logStep("Activity recorded", { eventType });
    }

    // Update last_active in profiles
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('user_id', user.id);

    if (profileError) {
      logStep("Error updating last_active");
    } else {
      logStep("Profile last_active updated");
    }

    // Send notification for new signups
    if (isNewSignup && user.email) {
      logStep("New signup detected, notifying admins");
      await notifyAdmins('new_signup', user.email, user.id, {
        // Don't log IP in details sent to admins
        signup_time: new Date().toISOString(),
      });
    }

    // Check for suspicious activity on login events
    if (eventType === 'login' && user.email) {
      const suspiciousCheck = await checkSuspiciousActivity(
        supabaseClient,
        user.id
      );

      if (suspiciousCheck.isSuspicious) {
        logStep("Suspicious activity detected", { 
          reason: suspiciousCheck.reason,
          uniqueIpCount: suspiciousCheck.uniqueIpCount,
          loginCount: suspiciousCheck.loginCount
        });
        await notifyAdmins('suspicious_activity', user.email, user.id, {
          reason: suspiciousCheck.reason,
          unique_ips_count: suspiciousCheck.uniqueIpCount,
          login_count: suspiciousCheck.loginCount,
          time_window: '24 hours',
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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

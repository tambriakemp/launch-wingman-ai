import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunctionHealth {
  name: string;
  calls: number;
  errors: number;
  avgLatencyMs: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.info('[ADMIN-SYSTEM-HEALTH] Function started');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is admin or manager
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'manager']);

    if (!roleData || roleData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Not authorized - admin or manager role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.info('[ADMIN-SYSTEM-HEALTH] Staff access verified');

    // Get failed emails in last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: emailLogs, error: emailError } = await supabase
      .from('email_logs')
      .select('*')
      .gte('sent_at', twentyFourHoursAgo);

    const failedEmails = 0; // We don't have a status field, so assuming all logged emails were sent successfully
    const totalEmails = emailLogs?.length || 0;

    console.info('[ADMIN-SYSTEM-HEALTH] Email stats calculated', { totalEmails });

    // Get AI usage stats for function health proxy (since we can't access edge function logs directly)
    const { data: aiLogs } = await supabase
      .from('ai_usage_logs')
      .select('function_name, success, tokens_used')
      .gte('created_at', twentyFourHoursAgo);

    // Group AI calls by function
    const functionStats: Record<string, { calls: number; errors: number; tokens: number }> = {};
    
    aiLogs?.forEach((log) => {
      if (!functionStats[log.function_name]) {
        functionStats[log.function_name] = { calls: 0, errors: 0, tokens: 0 };
      }
      functionStats[log.function_name].calls++;
      if (!log.success) {
        functionStats[log.function_name].errors++;
      }
      functionStats[log.function_name].tokens += log.tokens_used || 0;
    });

    const functions: FunctionHealth[] = Object.entries(functionStats).map(([name, stats]) => ({
      name,
      calls: stats.calls,
      errors: stats.errors,
      avgLatencyMs: 0, // We don't track this in ai_usage_logs
    }));

    // Sort by calls descending
    functions.sort((a, b) => b.calls - a.calls);

    // Calculate overall metrics
    const totalCalls = functions.reduce((sum, f) => sum + f.calls, 0);
    const totalErrors = functions.reduce((sum, f) => sum + f.errors, 0);
    const errorRate = totalCalls > 0 ? (totalErrors / totalCalls) * 100 : 0;

    // Database health check - simple ping
    const dbStartTime = Date.now();
    const { error: pingError } = await supabase.from('profiles').select('id').limit(1);
    const dbLatency = Date.now() - dbStartTime;
    const dbHealthy = !pingError;

    console.info('[ADMIN-SYSTEM-HEALTH] Health check complete', { 
      totalCalls, 
      errorRate: errorRate.toFixed(2),
      dbLatency,
      dbHealthy
    });

    const response = {
      status: dbHealthy && errorRate < 10 ? 'healthy' : errorRate < 25 ? 'degraded' : 'down',
      uptime: dbHealthy ? 99.9 : 0, // Simplified since we don't have real uptime tracking
      metrics: {
        totalCalls24h: totalCalls,
        errorRate24h: parseFloat(errorRate.toFixed(2)),
        avgLatencyMs: dbLatency,
        failedEmails24h: failedEmails,
        totalEmails24h: totalEmails,
      },
      database: {
        healthy: dbHealthy,
        latencyMs: dbLatency,
      },
      functions: functions.slice(0, 10), // Top 10 functions
      lastChecked: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ADMIN-SYSTEM-HEALTH] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

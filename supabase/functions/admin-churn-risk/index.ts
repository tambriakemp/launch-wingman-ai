import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AtRiskUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  lastActive: string | null;
  daysInactive: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  subscriptionStatus: 'pro' | 'free';
  subscriptionAmount: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.info('[ADMIN-CHURN-RISK] Function started');

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

    console.info('[ADMIN-CHURN-RISK] Staff access verified');

    // Get all profiles with their activity
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, last_active, banned_until');

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    // Get all auth users to get subscription info
    const { data: { users: authUsers }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    // Get user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    const roleMap = new Map(userRoles?.map(r => [r.user_id, r.role]) || []);

    const now = new Date();
    const atRiskUsers: AtRiskUser[] = [];

    for (const authUser of authUsers) {
      // Skip admins and managers
      const role = roleMap.get(authUser.id);
      if (role === 'admin' || role === 'manager') continue;

      // Skip banned users
      const profile = profiles?.find(p => p.user_id === authUser.id);
      if (profile?.banned_until && new Date(profile.banned_until) > now) continue;

      const lastActive = profile?.last_active ? new Date(profile.last_active) : null;
      const daysInactive = lastActive
        ? Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
        : 999; // Never active

      // Get subscription status from user metadata
      const subscriptionStatus = authUser.user_metadata?.subscription_status === 'pro' ? 'pro' : 'free';
      const subscriptionAmount = authUser.user_metadata?.subscription_amount_cents || 0;

      // Determine risk level
      let riskLevel: 'critical' | 'high' | 'medium' | 'low';
      if (subscriptionStatus === 'pro') {
        if (daysInactive >= 14) riskLevel = 'critical';
        else if (daysInactive >= 7) riskLevel = 'high';
        else if (daysInactive >= 3) riskLevel = 'low';
        else continue; // Not at risk
      } else {
        // Free users
        if (daysInactive >= 7 && lastActive) riskLevel = 'medium';
        else if (daysInactive >= 3 && lastActive) riskLevel = 'low';
        else continue; // Not at risk
      }

      atRiskUsers.push({
        id: authUser.id,
        email: authUser.email || '',
        firstName: profile?.first_name || null,
        lastName: profile?.last_name || null,
        lastActive: profile?.last_active || null,
        daysInactive,
        riskLevel,
        subscriptionStatus,
        subscriptionAmount,
      });
    }

    // Sort by risk level (critical first) then by days inactive
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    atRiskUsers.sort((a, b) => {
      const levelDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      if (levelDiff !== 0) return levelDiff;
      return b.daysInactive - a.daysInactive;
    });

    // Calculate summary
    const summary = {
      critical: atRiskUsers.filter(u => u.riskLevel === 'critical').length,
      high: atRiskUsers.filter(u => u.riskLevel === 'high').length,
      medium: atRiskUsers.filter(u => u.riskLevel === 'medium').length,
      low: atRiskUsers.filter(u => u.riskLevel === 'low').length,
      totalAtRiskPro: atRiskUsers.filter(u => u.subscriptionStatus === 'pro').length,
      potentialMrrAtRisk: atRiskUsers
        .filter(u => u.subscriptionStatus === 'pro' && (u.riskLevel === 'critical' || u.riskLevel === 'high'))
        .reduce((sum, u) => sum + u.subscriptionAmount, 0) / 100, // Convert to dollars
    };

    console.info('[ADMIN-CHURN-RISK] Analysis complete', {
      total: atRiskUsers.length,
      critical: summary.critical,
      high: summary.high,
      potentialMrrAtRisk: summary.potentialMrrAtRisk,
    });

    return new Response(JSON.stringify({
      summary,
      atRiskUsers: atRiskUsers.slice(0, 50), // Limit to 50 users
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ADMIN-CHURN-RISK] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

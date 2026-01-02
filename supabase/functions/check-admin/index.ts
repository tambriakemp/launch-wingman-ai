import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log('Checking roles for user:', userData.user.id, userData.user.email);

    // Check all roles for the user (admin or manager)
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .in('role', ['admin', 'manager']);

    console.log('Role query result:', { roleData, roleError });

    const roles = roleData?.map(r => r.role) || [];
    const isAdmin = roles.includes('admin');
    const isManager = roles.includes('manager');
    
    // Primary role: admin takes precedence over manager
    const role = isAdmin ? 'admin' : isManager ? 'manager' : null;

    return new Response(JSON.stringify({ isAdmin, isManager, role }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Check admin error:', error);
    return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

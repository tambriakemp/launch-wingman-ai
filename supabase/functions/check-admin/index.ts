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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    console.log("[check-admin] Auth header present:", !!authHeader);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[check-admin] No valid auth header - returning not admin");
      return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create a client with the user's auth token to verify the user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError) {
      console.error("[check-admin] Auth error:", userError.message);
      return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!user) {
      console.log("[check-admin] No user found from token");
      return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log("[check-admin] User authenticated:", user.id, user.email);

    // Create service role client for privileged database queries
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Check all roles for the user (admin or manager)
    const { data: roleData, error: roleError } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'manager']);

    if (roleError) {
      console.error("[check-admin] Role query error:", roleError.message);
      return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const roles = roleData?.map(r => r.role) || [];
    const isAdmin = roles.includes('admin');
    const isManager = roles.includes('manager');
    
    // Primary role: admin takes precedence over manager
    const role = isAdmin ? 'admin' : isManager ? 'manager' : null;

    console.log("[check-admin] Role check result:", { userId: user.id, email: user.email, roles, isAdmin, isManager, role });

    return new Response(JSON.stringify({ isAdmin, isManager, role }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('[check-admin] Unexpected error:', error);
    return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

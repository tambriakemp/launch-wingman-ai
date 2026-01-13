import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const authHeader = req.headers.get("Authorization");
    console.log("[check-admin] Auth header present:", !!authHeader);
    
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      console.log("[check-admin] No valid auth header - returning not admin");
      return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Extract token safely
    const token = authHeader.split(/\s+/)[1]?.trim();
    if (!token) {
      console.log("[check-admin] Could not extract token from header");
      return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log("[check-admin] Token length:", token.length, "prefix:", token.substring(0, 10) + "...");

    // Create service role client for database operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Create a client with user's token to verify their identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Use getUser with the user's token for reliable verification
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      console.error("[check-admin] User verification error:", userError?.message || "No user");
      return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userId = user.id;
    const email = user.email;

    if (!userId) {
      console.log("[check-admin] No user ID");
      return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log("[check-admin] User authenticated:", userId, email);

    // Check all roles for the user (admin or manager)
    const { data: roleData, error: roleError } = await supabaseService
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
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

    console.log("[check-admin] Role check result:", { userId, email, roles, isAdmin, isManager, role });

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

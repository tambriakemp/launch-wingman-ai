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

    // Create service role client for all operations
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Use getClaims for reliable server-side token validation
    const { data: claimsData, error: claimsError } = await supabaseService.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error("[check-admin] Claims error:", claimsError?.message || "No claims data");
      return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const userId = claimsData.claims.sub;
    const email = claimsData.claims.email;

    if (!userId) {
      console.log("[check-admin] No user ID in claims");
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

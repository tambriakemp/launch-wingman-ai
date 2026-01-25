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

    // Create service role client for DB queries + validating the incoming access token.
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Verify the token and get the user (pass the JWT explicitly; do NOT rely on session storage)
    let userId: string | undefined;
    let email: string | undefined;

    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    
    if (userError || !userData?.user) {
      console.log("[check-admin] getUser failed, trying getClaims fallback...", userError?.message);
      
      // Fallback: Try getClaims to decode the JWT directly
      // This works even when the session is stale but the JWT is still valid
      try {
        const { data: claimsData, error: claimsError } = await supabaseService.auth.getClaims(token);
        
        if (claimsError || !claimsData?.claims?.sub) {
          console.error("[check-admin] Both getUser and getClaims failed:", claimsError?.message);
          return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        
        // Extract user info from claims
        userId = claimsData.claims.sub as string;
        email = claimsData.claims.email as string | undefined;
        console.log("[check-admin] Recovered user from claims:", userId, email);
      } catch (claimsErr) {
        console.error("[check-admin] getClaims exception:", claimsErr);
        return new Response(JSON.stringify({ isAdmin: false, isManager: false, role: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else {
      userId = userData.user.id;
      email = userData.user.email;
    }

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

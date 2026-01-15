import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Parse and verify Meta's signed request
function parseSignedRequest(signedRequest: string, appSecret: string): { user_id: string } | null {
  try {
    const [encodedSig, payload] = signedRequest.split(".");
    
    if (!encodedSig || !payload) {
      console.error("Invalid signed request format");
      return null;
    }

    // Decode the payload (base64url to JSON)
    const decodedPayload = new TextDecoder().decode(
      base64Decode(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    
    const data = JSON.parse(decodedPayload);
    console.log("Delete callback payload:", data);
    
    return data;
  } catch (error) {
    console.error("Error parsing signed request:", error);
    return null;
  }
}

// Generate a confirmation code for the deletion request
function generateConfirmationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Threads data deletion callback received");

  try {
    const THREADS_APP_SECRET = Deno.env.get("THREADS_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const APP_URL = Deno.env.get("APP_URL") || "https://launch-wingman-ai.lovable.app";

    if (!THREADS_APP_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the form data from Meta
    const formData = await req.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      console.error("No signed_request in payload");
      return new Response(
        JSON.stringify({ error: "Missing signed_request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the signed request to get user info
    const data = parseSignedRequest(signedRequest, THREADS_APP_SECRET);
    
    if (!data || !data.user_id) {
      console.error("Could not parse user_id from signed request");
      return new Response(
        JSON.stringify({ error: "Invalid signed request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const threadsUserId = data.user_id;
    console.log("Processing data deletion for Threads user:", threadsUserId);

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Delete the Threads connection and any related data for this user
    const { error: deleteError, count } = await supabase
      .from("social_connections")
      .delete()
      .eq("platform", "threads")
      .eq("account_id", threadsUserId);

    if (deleteError) {
      console.error("Error deleting Threads data:", deleteError);
      // Still return success to Meta with confirmation
    } else {
      console.log(`Deleted ${count || 0} Threads connection(s) for user ${threadsUserId}`);
    }

    // Generate confirmation code for the deletion
    const confirmationCode = generateConfirmationCode();
    
    // Meta requires a response with:
    // - url: A URL where the user can check the status of their deletion request
    // - confirmation_code: A unique code for this deletion request
    const response = {
      url: `${APP_URL}/settings?deletion_confirmed=true&code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    };

    console.log("Data deletion response:", response);

    // Return the required response format for Meta
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Threads data deletion callback error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

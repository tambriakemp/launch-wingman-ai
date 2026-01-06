import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MarketingContact {
  email: string;
  first_name: string | null;
  last_name: string | null;
  membership: "free" | "pro";
  subscription_start: string | null;
  subscription_end: string | null;
  event_type: string;
}

interface WebhookRequest {
  action: "sync_all" | "sync_user";
  user_id?: string;
  event_type?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Invalid token");
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["admin", "manager"])
      .maybeSingle();

    if (!roleData) {
      throw new Error("Unauthorized: Admin access required");
    }

    const webhookUrl = Deno.env.get("MARKETING_WEBHOOK_URL");
    const webhookApiKey = Deno.env.get("MARKETING_WEBHOOK_API_KEY");

    if (!webhookUrl) {
      throw new Error("MARKETING_WEBHOOK_URL not configured");
    }

    const { action, user_id, event_type = "manual_sync" }: WebhookRequest = await req.json();

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    let stripe: Stripe | null = null;
    if (stripeKey) {
      stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    }

    const contacts: MarketingContact[] = [];

    if (action === "sync_user" && user_id) {
      // Sync single user
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user_id)
        .maybeSingle();

      const { data: authUser } = await supabaseClient.auth.admin.getUserById(user_id);

      if (authUser?.user?.email) {
        const contact = await buildContact(
          authUser.user.email,
          profile?.first_name,
          profile?.last_name,
          stripe,
          event_type
        );
        contacts.push(contact);
      }
    } else if (action === "sync_all") {
      // Sync all users
      const { data: authData } = await supabaseClient.auth.admin.listUsers();
      
      if (authData?.users) {
        // Get all profiles
        const { data: profiles } = await supabaseClient
          .from("profiles")
          .select("user_id, first_name, last_name");

        const profileMap = new Map(
          profiles?.map((p) => [p.user_id, p]) || []
        );

        for (const user of authData.users) {
          if (user.email) {
            const profile = profileMap.get(user.id);
            const contact = await buildContact(
              user.email,
              profile?.first_name,
              profile?.last_name,
              stripe,
              event_type
            );
            contacts.push(contact);
          }
        }
      }
    }

    // Send to webhook
    const results = [];
    for (const contact of contacts) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        
        if (webhookApiKey) {
          headers["Authorization"] = `Bearer ${webhookApiKey}`;
          headers["X-API-Key"] = webhookApiKey;
        }

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(contact),
        });

        const responseText = await response.text();
        results.push({
          email: contact.email,
          success: response.ok,
          status: response.status,
          response: responseText.substring(0, 200),
        });

        console.log(`Webhook sent for ${contact.email}: ${response.status}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error sending webhook for ${contact.email}:`, error);
        results.push({
          email: contact.email,
          success: false,
          error: errorMessage,
        });
      }
    }

    // Log the action
    await supabaseClient.from("admin_action_logs").insert({
      admin_user_id: userData.user.id,
      action: "marketing_webhook_sync",
      target_user_id: user_id || null,
      action_details: {
        action,
        contacts_count: contacts.length,
        success_count: results.filter((r) => r.success).length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        contacts_synced: contacts.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in marketing-webhook:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function buildContact(
  email: string,
  firstName: string | null,
  lastName: string | null,
  stripe: Stripe | null,
  eventType: string
): Promise<MarketingContact> {
  let membership: "free" | "pro" = "free";
  let subscriptionStart: string | null = null;
  let subscriptionEnd: string | null = null;

  if (stripe) {
    try {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "all",
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0];
          if (sub.status === "active" || sub.status === "trialing") {
            membership = "pro";
          }
          subscriptionStart = new Date(sub.start_date * 1000).toISOString();
          subscriptionEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null;
        }
      }
    } catch (error) {
      console.error(`Error fetching Stripe data for ${email}:`, error);
    }
  }

  return {
    email,
    first_name: firstName,
    last_name: lastName,
    membership,
    subscription_start: subscriptionStart,
    subscription_end: subscriptionEnd,
    event_type: eventType,
  };
}

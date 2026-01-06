import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// FluentCRM IDs
const FLUENTCRM_LIST_ID = 14;       // Launchely list
const FLUENTCRM_PRO_TAG_ID = 69;    // launchely-pro tag
const FLUENTCRM_FREE_TAG_ID = 70;   // launchely-free tag

// FluentCRM contact structure
interface FluentCRMContact {
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  __force_update: string;
  lists: number[];
  attach_tags: number[];
  detach_tags: number[];
}

// Internal logging data
interface ContactLogData {
  membership: "free" | "pro";
  tagsAdded: string[];
  tagsRemoved: string[];
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

    const contactsToSync: { contact: FluentCRMContact; logData: ContactLogData; eventType: string }[] = [];

    if (action === "sync_user" && user_id) {
      // Sync single user
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user_id)
        .maybeSingle();

      const { data: authUser } = await supabaseClient.auth.admin.getUserById(user_id);

      if (authUser?.user?.email) {
        const { contact, logData } = await buildFluentCRMContact(
          authUser.user.email,
          profile?.first_name,
          profile?.last_name,
          stripe,
          event_type
        );
        contactsToSync.push({ contact, logData, eventType: event_type });
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
            const { contact, logData } = await buildFluentCRMContact(
              user.email,
              profile?.first_name,
              profile?.last_name,
              stripe,
              event_type
            );
            contactsToSync.push({ contact, logData, eventType: event_type });
          }
        }
      }
    }

    // Send to FluentCRM webhook and log results
    const results = [];
    for (const { contact, logData, eventType: contactEventType } of contactsToSync) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        
        if (webhookApiKey) {
          headers["Authorization"] = `Bearer ${webhookApiKey}`;
          headers["X-API-Key"] = webhookApiKey;
        }

        console.log(`Sending to FluentCRM: ${JSON.stringify(contact)}`);

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(contact),
        });

        const responseText = await response.text();
        const success = response.ok;
        
        results.push({
          email: contact.email,
          success,
          status: response.status,
          response: responseText.substring(0, 200),
        });

        // Log to database
        await supabaseClient.from("marketing_webhook_logs").insert({
          email: contact.email,
          event_type: contactEventType,
          membership: logData.membership,
          tags_added: logData.tagsAdded,
          tags_removed: logData.tagsRemoved,
          success,
          response_status: response.status,
          error_message: success ? null : responseText.substring(0, 500),
        });

        console.log(`FluentCRM webhook sent for ${contact.email}: ${response.status} - ${responseText.substring(0, 100)}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error sending FluentCRM webhook for ${contact.email}:`, error);
        
        results.push({
          email: contact.email,
          success: false,
          error: errorMessage,
        });

        // Log failure to database
        await supabaseClient.from("marketing_webhook_logs").insert({
          email: contact.email,
          event_type: contactEventType,
          membership: logData.membership,
          tags_added: logData.tagsAdded,
          tags_removed: logData.tagsRemoved,
          success: false,
          error_message: errorMessage,
        });
      }
    }

    // Log the admin action
    await supabaseClient.from("admin_action_logs").insert({
      admin_user_id: userData.user.id,
      admin_email: userData.user.email || "unknown",
      action_type: "marketing_webhook_sync",
      target_user_id: user_id || null,
      action_details: {
        action,
        contacts_count: contactsToSync.length,
        success_count: results.filter((r) => r.success).length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        contacts_synced: contactsToSync.length,
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

async function buildFluentCRMContact(
  email: string,
  firstName: string | null,
  lastName: string | null,
  stripe: Stripe | null,
  eventType: string
): Promise<{ contact: FluentCRMContact; logData: ContactLogData }> {
  let membership: "free" | "pro" = "free";

  console.log(`[FluentCRM] Building contact for ${email}`);

  if (stripe) {
    try {
      const customers = await stripe.customers.list({ email, limit: 1 });
      console.log(`[FluentCRM] ${email} - Stripe customer found: ${customers.data.length > 0}`);
      
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        console.log(`[FluentCRM] ${email} - Customer ID: ${customerId}`);
        
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "all",
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0];
          console.log(`[FluentCRM] ${email} - Subscription status: ${sub.status}`);
          if (sub.status === "active" || sub.status === "trialing") {
            membership = "pro";
          }
        } else {
          console.log(`[FluentCRM] ${email} - No subscriptions found`);
        }
      }
    } catch (error) {
      console.error(`[FluentCRM] Error fetching Stripe data for ${email}:`, error);
    }
  } else {
    console.log(`[FluentCRM] ${email} - No Stripe client available`);
  }

  // For subscription events, override membership based on event type
  if (eventType === "subscription_started" || eventType === "subscription_created") {
    membership = "pro";
  } else if (eventType === "subscription_cancelled" || eventType === "subscription_ended") {
    membership = "free";
  }

  // Build FluentCRM-compatible contact with numeric IDs
  const isPro = membership === "pro";
  
  console.log(`[FluentCRM] ${email} - Final membership: ${membership} (isPro: ${isPro})`);
  
  const contact: FluentCRMContact = {
    email,
    first_name: firstName,
    last_name: lastName,
    status: "subscribed",
    __force_update: "yes",
    lists: [FLUENTCRM_LIST_ID],
    attach_tags: isPro ? [FLUENTCRM_PRO_TAG_ID] : [FLUENTCRM_FREE_TAG_ID],
    detach_tags: isPro ? [FLUENTCRM_FREE_TAG_ID] : [FLUENTCRM_PRO_TAG_ID],
  };

  console.log(`[FluentCRM] ${email} - Payload: attach_tags=${JSON.stringify(contact.attach_tags)}, detach_tags=${JSON.stringify(contact.detach_tags)}, lists=${JSON.stringify(contact.lists)}`);

  // For logging purposes, keep human-readable tag names
  const logData: ContactLogData = {
    membership,
    tagsAdded: isPro ? ["launchely-pro"] : ["launchely-free"],
    tagsRemoved: isPro ? ["launchely-free"] : ["launchely-pro"],
  };

  return { contact, logData };
}

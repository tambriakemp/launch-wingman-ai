import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SURECART-WEBHOOK] ${step}${detailsStr}`);
};

async function sendAccountSetupEmail(email: string, firstName: string, setupLink: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    logStep("No Resend API key, skipping setup email");
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    
    await resend.emails.send({
      from: "Launchely <hello@launchely.com>",
      to: [email],
      subject: "Set Up Your Launchely Account",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; font-size: 24px; margin: 0;">Welcome to Launchely Pro! 🎉</h1>
          </div>
          
          <p style="color: #444; font-size: 16px; line-height: 1.6;">Hi ${firstName || 'there'},</p>
          
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            Thank you for subscribing to Launchely Pro! Your payment was successful and your account is ready.
          </p>
          
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            Click the button below to set your password and start launching:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${setupLink}" style="background: linear-gradient(135deg, #333 0%, #555 100%); color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
              Set Your Password
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; line-height: 1.6;">
            This link expires in 24 hours. If you need a new one, use the "Forgot Password" option on the login page.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            Welcome aboard! 🚀
          </p>
          <p style="color: #444; font-size: 16px; line-height: 1.6;">
            — The Launchely Team
          </p>
        </div>
      `,
    });
    
    logStep("Account setup email sent", { email });
  } catch (error) {
    logStep("Failed to send setup email", { error: error instanceof Error ? error.message : String(error) });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    // Get raw body for signature verification
    const rawBody = await req.text();
    let event: Record<string, unknown>;
    
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new Error("Invalid JSON payload");
    }

    const eventType = event.type as string;
    const eventData = event.data as Record<string, unknown>;
    
    logStep("Event parsed", { type: eventType });

    // Log webhook to database
    const { data: logEntry, error: logError } = await supabaseClient
      .from('webhook_logs')
      .insert({
        provider: 'surecart',
        event_type: eventType,
        payload: event,
        status: 'processing'
      })
      .select('id')
      .single();

    if (logError) {
      logStep("Failed to log webhook", { error: logError.message });
    }

    // Extract relevant data based on event type
    let customerEmail: string | null = null;
    let customerId: string | null = null;
    let subscriptionId: string | null = null;
    let subscriptionStatus: string | null = null;

    // Get app URL for password setup link
    const appUrl = Deno.env.get("APP_URL") || "https://launch-wingman-ai.lovable.app";

    // Handle different event types
    switch (eventType) {
      case 'checkout.completed': {
        const checkout = eventData.object as Record<string, unknown>;
        const metadata = checkout.metadata as Record<string, unknown> | null;
        const customer = checkout.customer as Record<string, unknown> | string;
        
        if (typeof customer === 'object') {
          customerId = customer.id as string;
          customerEmail = customer.email as string;
        } else {
          customerId = customer;
        }
        
        const subscription = checkout.subscription as Record<string, unknown>;
        if (subscription) {
          subscriptionId = subscription.id as string;
          subscriptionStatus = 'active';
        }
        
        logStep("Checkout completed", { customerId, customerEmail, subscriptionId, metadata });

        // Check if this is a new user signup (payment-first flow)
        const isNewUser = metadata?.is_new_user === true;
        const firstName = (metadata?.first_name as string) || '';
        const lastName = (metadata?.last_name as string) || '';

        if (isNewUser && customerEmail) {
          logStep("Processing new user signup", { email: customerEmail });

          // Check if user already exists
          const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === customerEmail?.toLowerCase());

          if (!existingUser) {
            // Create user account without password (they'll set it via email)
            const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
              email: customerEmail,
              email_confirm: true,
              user_metadata: {
                first_name: firstName,
                last_name: lastName,
                source: 'pro_checkout'
              }
            });

            if (createError) {
              logStep("Failed to create user", { error: createError.message });
            } else if (newUser?.user) {
              logStep("User created", { userId: newUser.user.id });

              // Update profile with subscription details
              await supabaseClient.from('profiles').update({
                surecart_customer_id: customerId,
                surecart_subscription_id: subscriptionId,
                surecart_subscription_status: 'active',
                first_name: firstName,
                last_name: lastName
              }).eq('user_id', newUser.user.id);

              // Generate password recovery link for account setup
              const { data: recoveryData, error: recoveryError } = await supabaseClient.auth.admin.generateLink({
                type: 'recovery',
                email: customerEmail,
                options: {
                  redirectTo: `${appUrl}/app`
                }
              });

              if (recoveryError) {
                logStep("Failed to generate recovery link", { error: recoveryError.message });
              } else if (recoveryData?.properties?.action_link) {
                // Send account setup email
                await sendAccountSetupEmail(customerEmail, firstName, recoveryData.properties.action_link);
              }
            }
          } else {
            logStep("User already exists, updating subscription", { userId: existingUser.id });
            
            // Update existing user's profile with subscription
            await supabaseClient.from('profiles').update({
              surecart_customer_id: customerId,
              surecart_subscription_id: subscriptionId,
              surecart_subscription_status: 'active',
            }).eq('user_id', existingUser.id);
          }
        }
        break;
      }

      case 'subscription.created':
      case 'subscription.activated': {
        const subscription = eventData.object as Record<string, unknown>;
        subscriptionId = subscription.id as string;
        subscriptionStatus = 'active';
        
        const customer = subscription.customer as Record<string, unknown> | string;
        if (typeof customer === 'object') {
          customerId = customer.id as string;
          customerEmail = customer.email as string;
        } else {
          customerId = customer;
        }
        
        logStep("Subscription activated", { subscriptionId, customerId });
        break;
      }

      case 'subscription.canceled': {
        const subscription = eventData.object as Record<string, unknown>;
        subscriptionId = subscription.id as string;
        subscriptionStatus = 'canceled';
        
        const customer = subscription.customer as Record<string, unknown> | string;
        if (typeof customer === 'object') {
          customerId = customer.id as string;
          customerEmail = customer.email as string;
        } else {
          customerId = customer;
        }
        
        logStep("Subscription canceled", { subscriptionId, customerId });
        break;
      }

      case 'subscription.updated': {
        const subscription = eventData.object as Record<string, unknown>;
        subscriptionId = subscription.id as string;
        subscriptionStatus = subscription.status as string;
        
        const customer = subscription.customer as Record<string, unknown> | string;
        if (typeof customer === 'object') {
          customerId = customer.id as string;
          customerEmail = customer.email as string;
        } else {
          customerId = customer;
        }
        
        logStep("Subscription updated", { subscriptionId, status: subscriptionStatus });
        break;
      }

      case 'payment.succeeded': {
        const payment = eventData.object as Record<string, unknown>;
        const customer = payment.customer as Record<string, unknown> | string;
        
        if (typeof customer === 'object') {
          customerId = customer.id as string;
          customerEmail = customer.email as string;
        }
        
        logStep("Payment succeeded", { customerId });
        break;
      }

      case 'payment.failed': {
        const payment = eventData.object as Record<string, unknown>;
        const customer = payment.customer as Record<string, unknown> | string;
        
        if (typeof customer === 'object') {
          customerId = customer.id as string;
          customerEmail = customer.email as string;
        }
        
        logStep("Payment failed", { customerId });
        break;
      }

      default:
        logStep("Unhandled event type", { type: eventType });
    }

    // Update user profile if we have customer info (for non-new-user flows)
    if (customerId && eventType !== 'checkout.completed') {
      // Find user by SureCart customer ID or email
      let userId: string | null = null;

      // First try by customer ID
      const { data: profileByCustomer } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .eq('surecart_customer_id', customerId)
        .single();

      if (profileByCustomer) {
        userId = profileByCustomer.user_id;
      } else if (customerEmail) {
        // Try by email via auth.users
        const { data: userData } = await supabaseClient.auth.admin.listUsers();
        const user = userData?.users?.find(u => u.email === customerEmail);
        if (user) {
          userId = user.id;
        }
      }

      if (userId) {
        const updateData: Record<string, unknown> = {
          surecart_customer_id: customerId,
        };

        if (subscriptionId) {
          updateData.surecart_subscription_id = subscriptionId;
        }

        if (subscriptionStatus) {
          updateData.surecart_subscription_status = subscriptionStatus;
        }

        await supabaseClient
          .from('profiles')
          .update(updateData)
          .eq('user_id', userId);

        logStep("Profile updated", { userId, ...updateData });
      } else {
        logStep("Could not find user for customer", { customerId, customerEmail });
      }
    }

    // Update webhook log status
    if (logEntry?.id) {
      await supabaseClient
        .from('webhook_logs')
        .update({ status: 'completed' })
        .eq('id', logEntry.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

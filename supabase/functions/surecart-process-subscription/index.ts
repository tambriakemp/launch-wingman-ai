import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SURECART-PROCESS-SUBSCRIPTION] ${step}${detailsStr}`);
};

const SURECART_API_BASE = "https://api.surecart.com/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const surecartApiKey = Deno.env.get("SURECART_API_KEY");
    if (!surecartApiKey) throw new Error("SURECART_API_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const headers = {
      "Authorization": `Bearer ${surecartApiKey}`,
      "Content-Type": "application/json",
    };

    // Parse request body
    const { 
      email, 
      firstName, 
      lastName, 
      password, 
      paymentMethodId, 
      couponCode,
      isUpgrade // Flag for existing user upgrades
    } = await req.json();

    logStep("Request received", { email, isUpgrade, hasCoupon: !!couponCode });

    // Validate required fields
    if (!email) throw new Error("Email is required");
    if (!paymentMethodId) throw new Error("Payment method is required");
    if (!isUpgrade && !password) throw new Error("Password is required for new signups");

    let userId: string;
    let isNewUser = false;

    // Check if this is an upgrade (authenticated request)
    const authHeader = req.headers.get("Authorization");
    
    if (isUpgrade && authHeader) {
      // Existing user upgrading - validate their session
      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
      
      if (claimsError || !claimsData?.claims) {
        throw new Error("Authentication failed for upgrade");
      }
      
      userId = claimsData.claims.sub as string;
      logStep("Existing user upgrade", { userId });
    } else {
      // New user signup - create auth account
      logStep("Creating new user account");
      
      // Check if email already exists
      const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);
      
      if (existingUser) {
        throw new Error("An account with this email already exists. Please sign in and upgrade from Settings.");
      }
      
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { 
          first_name: firstName, 
          last_name: lastName,
          source: 'pro_checkout'
        }
      });
      
      if (authError) {
        logStep("Auth creation error", { error: authError.message });
        throw new Error(`Failed to create account: ${authError.message}`);
      }
      
      userId = authData.user.id;
      isNewUser = true;
      logStep("User account created", { userId });
    }

    // Get price ID from payment_config
    const { data: configData } = await supabaseClient
      .from('payment_config')
      .select('value')
      .eq('provider', 'surecart')
      .eq('key', 'price_id')
      .single();

    if (!configData?.value) {
      throw new Error("SureCart not configured. Please contact support.");
    }
    const priceId = configData.value;
    logStep("Got price ID", { priceId });

    // Create or find SureCart customer
    let customerId: string;
    
    // Search for existing customer by email
    const searchResponse = await fetch(
      `${SURECART_API_BASE}/customers?email=${encodeURIComponent(email)}`,
      { headers }
    );
    
    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      if (searchResult.data && searchResult.data.length > 0) {
        customerId = searchResult.data[0].id;
        logStep("Found existing SureCart customer", { customerId });
      } else {
        // Create new customer
        const createCustomerResponse = await fetch(`${SURECART_API_BASE}/customers`, {
          method: "POST",
          headers,
          body: JSON.stringify({ 
            email, 
            first_name: firstName || '',
            last_name: lastName || ''
          }),
        });
        
        if (!createCustomerResponse.ok) {
          const errorText = await createCustomerResponse.text();
          throw new Error(`Failed to create SureCart customer: ${errorText}`);
        }
        
        const newCustomer = await createCustomerResponse.json();
        customerId = newCustomer.id;
        logStep("Created SureCart customer", { customerId });
      }
    } else {
      throw new Error("Failed to search for SureCart customer");
    }

    // Attach payment method to customer
    logStep("Attaching payment method to customer");
    const attachResponse = await fetch(`${SURECART_API_BASE}/payment_methods/${paymentMethodId}/attach`, {
      method: "POST",
      headers,
      body: JSON.stringify({ customer: customerId }),
    });
    
    if (!attachResponse.ok) {
      const errorText = await attachResponse.text();
      logStep("Payment method attach failed", { error: errorText });
      throw new Error(`Failed to attach payment method: ${errorText}`);
    }
    logStep("Payment method attached");

    // Set as default payment method
    await fetch(`${SURECART_API_BASE}/customers/${customerId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ default_payment_method: paymentMethodId }),
    });

    // Create subscription
    logStep("Creating subscription");
    const subscriptionPayload: Record<string, unknown> = {
      customer: customerId,
      price: priceId,
      payment_method: paymentMethodId,
    };

    if (couponCode) {
      subscriptionPayload.coupon = couponCode;
      logStep("Applying coupon", { couponCode });
    }

    const subscriptionResponse = await fetch(`${SURECART_API_BASE}/subscriptions`, {
      method: "POST",
      headers,
      body: JSON.stringify(subscriptionPayload),
    });

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text();
      logStep("Subscription creation failed", { error: errorText });
      
      // If subscription fails and we created a new user, we should clean up
      if (isNewUser) {
        logStep("Cleaning up user due to subscription failure");
        await supabaseClient.auth.admin.deleteUser(userId);
      }
      
      throw new Error(`Payment failed: ${errorText}`);
    }

    const subscription = await subscriptionResponse.json();
    logStep("Subscription created", { subscriptionId: subscription.id, status: subscription.status });

    // Update profile with SureCart details
    await supabaseClient
      .from('profiles')
      .update({
        surecart_customer_id: customerId,
        surecart_subscription_id: subscription.id,
        surecart_subscription_status: subscription.status || 'active',
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      })
      .eq('user_id', userId);

    logStep("Profile updated with subscription details");

    // Track the subscription in admin notifications
    try {
      await supabaseClient.functions.invoke('admin-notify', {
        body: {
          type: 'new_subscription',
          data: {
            email,
            subscription_id: subscription.id,
            is_new_user: isNewUser,
          }
        }
      });
    } catch (e) {
      // Non-critical, don't fail the request
      logStep("Admin notify failed (non-critical)", { error: e });
    }

    return new Response(JSON.stringify({
      success: true,
      message: isNewUser ? "Account created and subscription activated!" : "Subscription activated!",
      userId,
      subscriptionId: subscription.id,
      isNewUser,
      // For new users, they need to sign in manually
      requiresSignIn: isNewUser,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

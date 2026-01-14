import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SureContactPayload {
  email: string;
  first_name: string;
  last_name: string;
  subscription_status: 'free' | 'pro';
  event_type: 'signup' | 'subscription_started' | 'subscription_cancelled' | 'manual_sync';
}

interface LogData {
  email: string;
  event_type: string;
  subscription_status: string;
  success: boolean;
  response_status?: number;
  error_message?: string;
}

async function getSubscriptionStatus(
  stripe: Stripe | null,
  email: string
): Promise<'free' | 'pro'> {
  if (!stripe) return 'free';

  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) return 'free';

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      limit: 1,
    });

    return subscriptions.data.length > 0 ? 'pro' : 'free';
  } catch (error) {
    console.error('Error checking Stripe subscription:', error);
    return 'free';
  }
}

async function sendToSureContact(
  webhookUrl: string,
  payload: SureContactPayload
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    console.log('Sending to SureContact:', JSON.stringify(payload));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('SureContact response:', response.status, responseText);

    return {
      success: response.ok,
      status: response.status,
      error: response.ok ? undefined : responseText,
    };
  } catch (error) {
    console.error('Error sending to SureContact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function logWebhookResult(
  supabase: any,
  data: LogData
): Promise<void> {
  try {
    await supabase.from('surecontact_webhook_logs').insert({
      email: data.email,
      event_type: data.event_type,
      subscription_status: data.subscription_status,
      success: data.success,
      response_status: data.response_status,
      error_message: data.error_message,
    });
  } catch (error) {
    console.error('Error logging webhook result:', error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sureContactWebhookUrl = Deno.env.get('SURECONTACT_WEBHOOK_URL');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!sureContactWebhookUrl) {
      console.error('SURECONTACT_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'SureContact webhook URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

    // Parse request body
    const { action, user_id, email, first_name, last_name, event_type } = await req.json();
    console.log('SureContact webhook called with action:', action);

    // Verify admin access for sync_all and sync_user actions
    if (action === 'sync_all' || action === 'sync_user') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authorization' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'manager'])
        .single();

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const results: { email: string; success: boolean; error?: string }[] = [];

    if (action === 'sync_new_signup') {
      // Lightweight sync for new signups - no Stripe check needed (always free)
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email required for sync_new_signup' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const payload: SureContactPayload = {
        email,
        first_name: first_name || '',
        last_name: last_name || '',
        subscription_status: 'free',
        event_type: 'signup',
      };

      const result = await sendToSureContact(sureContactWebhookUrl, payload);
      await logWebhookResult(supabase, {
        email,
        event_type: 'signup',
        subscription_status: 'free',
        success: result.success,
        response_status: result.status,
        error_message: result.error,
      });

      results.push({ email, success: result.success, error: result.error });

    } else if (action === 'sync_user') {
      // Sync single user by ID
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id required for sync_user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user data from auth.users via profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, user_id')
        .eq('user_id', user_id)
        .single();

      // Get email from auth
      const { data: authData } = await supabase.auth.admin.getUserById(user_id);
      
      if (!authData?.user?.email) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userEmail = authData.user.email;
      const subscriptionStatus = await getSubscriptionStatus(stripe, userEmail);
      const eventTypeToUse = event_type || 'manual_sync';

      const payload: SureContactPayload = {
        email: userEmail,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        subscription_status: subscriptionStatus,
        event_type: eventTypeToUse as SureContactPayload['event_type'],
      };

      const result = await sendToSureContact(sureContactWebhookUrl, payload);
      await logWebhookResult(supabase, {
        email: userEmail,
        event_type: eventTypeToUse,
        subscription_status: subscriptionStatus,
        success: result.success,
        response_status: result.status,
        error_message: result.error,
      });

      results.push({ email: userEmail, success: result.success, error: result.error });

    } else if (action === 'sync_all') {
      // Sync all users - admin only
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch profiles' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Found ${profiles?.length || 0} profiles to sync`);

      for (const profile of profiles || []) {
        try {
          const { data: authData } = await supabase.auth.admin.getUserById(profile.user_id);
          
          if (!authData?.user?.email) {
            console.log(`Skipping user ${profile.user_id} - no email found`);
            continue;
          }

          const userEmail = authData.user.email;
          const subscriptionStatus = await getSubscriptionStatus(stripe, userEmail);

          const payload: SureContactPayload = {
            email: userEmail,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            subscription_status: subscriptionStatus,
            event_type: 'manual_sync',
          };

          const result = await sendToSureContact(sureContactWebhookUrl, payload);
          await logWebhookResult(supabase, {
            email: userEmail,
            event_type: 'manual_sync',
            subscription_status: subscriptionStatus,
            success: result.success,
            response_status: result.status,
            error_message: result.error,
          });

          results.push({ email: userEmail, success: result.success, error: result.error });

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error syncing user ${profile.user_id}:`, error);
          results.push({ 
            email: profile.user_id, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use: sync_new_signup, sync_user, or sync_all' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${successCount} contacts successfully, ${failCount} failed`,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SureContact webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

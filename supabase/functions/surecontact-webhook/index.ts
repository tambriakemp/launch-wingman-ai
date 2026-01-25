import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SURECONTACT_API_BASE = 'https://api.surecontact.com/api/v1/public';

interface SureContactConfig {
  config_type: string;
  name: string;
  surecontact_uuid: string;
}

interface ContactPayload {
  email: string;
  first_name: string;
  last_name: string;
  subscription_status: 'free' | 'pro';
  event_type: string;
  stripe_customer_id?: string;
  signup_date?: string;
  subscription_plan?: string;
  subscription_start_date?: string;
}

interface LogData {
  email: string;
  event_type: string;
  subscription_status: string;
  success: boolean;
  response_status?: number;
  error_message?: string;
  tags_added?: string[];
  tags_removed?: string[];
}

// Helper to make SureContact API calls
async function sureContactRequest(
  endpoint: string,
  method: string,
  apiKey: string,
  body?: unknown
): Promise<{ success: boolean; data?: any; status: number; error?: string }> {
  try {
    console.log(`SureContact API: ${method} ${endpoint}`);
    
    const response = await fetch(`${SURECONTACT_API_BASE}${endpoint}`, {
      method,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }

    console.log(`SureContact response (${response.status}):`, JSON.stringify(data).substring(0, 500));

    return {
      success: response.ok,
      data,
      status: response.status,
      error: response.ok ? undefined : (typeof data === 'string' ? data : JSON.stringify(data)),
    };
  } catch (error) {
    console.error('SureContact API error:', error);
    return {
      success: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get config UUIDs from database
async function getConfig(supabase: any): Promise<Map<string, SureContactConfig>> {
  const { data, error } = await supabase
    .from('surecontact_config')
    .select('config_type, name, surecontact_uuid');

  if (error) {
    console.error('Error fetching SureContact config:', error);
    throw new Error('SureContact configuration not found. Please run "Fetch Config" first.');
  }

  const configMap = new Map<string, SureContactConfig>();
  for (const item of data || []) {
    // Key format: "type:name" e.g., "tag:free-user" or "list:master-list"
    configMap.set(`${item.config_type}:${item.name}`, item);
  }

  console.log(`Loaded ${configMap.size} config items`);
  return configMap;
}

// Find or create contact by email
async function findOrCreateContact(
  apiKey: string,
  payload: ContactPayload,
  config: Map<string, SureContactConfig>
): Promise<{ uuid: string; isNew: boolean; error?: string }> {
  // Search for existing contact by email
  console.log(`Searching for contact with email: ${payload.email}`);
  const searchResult = await sureContactRequest(
    `/contacts?email=${encodeURIComponent(payload.email)}`,
    'GET',
    apiKey
  );

  console.log(`Search result for ${payload.email}:`, JSON.stringify(searchResult.data?.data?.map((c: { uuid: string; email: string }) => ({ uuid: c.uuid, email: c.email })) || []));

  if (searchResult.success && searchResult.data?.data?.length > 0) {
    // Find the contact that matches the exact email
    const matchingContact = searchResult.data.data.find(
      (c: { email: string }) => c.email.toLowerCase() === payload.email.toLowerCase()
    );
    
    if (matchingContact) {
      console.log(`Found exact matching contact: ${matchingContact.uuid} for ${matchingContact.email}`);
      
      // Update existing contact with latest data
      const updateResult = await sureContactRequest(
        `/contacts/${matchingContact.uuid}`,
        'PUT',
        apiKey,
        {
          primary_fields: {
            first_name: payload.first_name || matchingContact.first_name,
            last_name: payload.last_name || matchingContact.last_name,
          },
          custom_fields: buildCustomFields(payload, config),
        }
      );

      if (!updateResult.success) {
        console.error('Failed to update contact:', updateResult.error);
      }

      return { uuid: matchingContact.uuid, isNew: false };
    }
    
    // No exact match found, will create new contact below
    console.log(`No exact email match found for ${payload.email}, creating new contact`);
  }

  // Create new contact
  console.log(`Creating new contact for: ${payload.email}`);
  
  const createResult = await sureContactRequest(
    '/contacts',
    'POST',
    apiKey,
    {
      primary_fields: {
        email: payload.email,
        first_name: payload.first_name || '',
        last_name: payload.last_name || '',
        source: 'api',
      },
      custom_fields: buildCustomFields(payload, config),
    }
  );

  if (!createResult.success) {
    return { uuid: '', isNew: true, error: createResult.error };
  }

  const newUuid = createResult.data?.data?.uuid || createResult.data?.uuid;
  console.log(`Created new contact: ${newUuid}`);
  return { uuid: newUuid, isNew: true };
}

// Build custom fields object - maps all 7 custom fields
function buildCustomFields(
  payload: ContactPayload,
  config: Map<string, SureContactConfig>
): Record<string, string> {
  const customFields: Record<string, string> = {};

  // Map all custom fields to SureContact UUIDs
  const fieldMappings: Record<string, string> = {
    subscription_status: payload.subscription_status,
    signup_date: payload.signup_date || new Date().toISOString().split('T')[0],
    stripe_customer_id: payload.stripe_customer_id || '',
    subscription_plan: payload.subscription_plan || '',
    app_source: 'launchely',
    last_sync_date: new Date().toISOString().split('T')[0],
    subscription_start_date: payload.subscription_start_date || '',
  };

  for (const [fieldName, value] of Object.entries(fieldMappings)) {
    const configItem = config.get(`custom_field:${fieldName}`);
    if (configItem && value) {
      customFields[configItem.surecontact_uuid] = value;
    }
  }

  return customFields;
}

// Manage tags for a contact
async function manageTags(
  apiKey: string,
  contactUuid: string,
  payload: ContactPayload,
  config: Map<string, SureContactConfig>
): Promise<{ added: string[]; removed: string[] }> {
  const tagsAdded: string[] = [];
  const tagsRemoved: string[] = [];

  // Determine which subscription tag to use
  const subscriptionTag = payload.subscription_status === 'pro' ? 'pro-subscriber' : 'free-user';
  const oppositeTag = payload.subscription_status === 'pro' ? 'free-user' : 'pro-subscriber';

  // Get tag UUIDs
  const subscriptionTagConfig = config.get(`tag:${subscriptionTag}`);
  const oppositeTagConfig = config.get(`tag:${oppositeTag}`);

  // Remove opposite subscription tag first
  if (oppositeTagConfig) {
    const detachResult = await sureContactRequest(
      `/contacts/${contactUuid}/tags/detach`,
      'POST',
      apiKey,
      { tag_uuids: [oppositeTagConfig.surecontact_uuid] }
    );
    if (detachResult.success) {
      tagsRemoved.push(oppositeTag);
    }
  }

  // Add correct subscription tag
  if (subscriptionTagConfig) {
    const attachResult = await sureContactRequest(
      `/contacts/${contactUuid}/tags/attach`,
      'POST',
      apiKey,
      { tag_uuids: [subscriptionTagConfig.surecontact_uuid] }
    );
    if (attachResult.success) {
      tagsAdded.push(subscriptionTag);
    }
  }

  // Add event tag based on event type - using correct SureContact tag names
  const eventTagMap: Record<string, string> = {
    signup: 'new-signup',
    subscription_started: 'upgraded-to-pro',
    subscription_cancelled: 'churned',
    reactivated: 'reactivated',
  };

  const eventTag = eventTagMap[payload.event_type];
  if (eventTag) {
    const eventTagConfig = config.get(`tag:${eventTag}`);
    if (eventTagConfig) {
      const attachResult = await sureContactRequest(
        `/contacts/${contactUuid}/tags/attach`,
        'POST',
        apiKey,
        { tag_uuids: [eventTagConfig.surecontact_uuid] }
      );
      if (attachResult.success) {
        tagsAdded.push(eventTag);
      }
    }
  }

  return { added: tagsAdded, removed: tagsRemoved };
}

// Add contact to Launchely list specifically
async function addToMasterList(
  apiKey: string,
  contactUuid: string,
  config: Map<string, SureContactConfig>
): Promise<boolean> {
  // Specifically look for the Launchely list
  const launchelyList = config.get('list:Launchely');
  
  if (launchelyList) {
    console.log(`Adding contact to Launchely list: ${launchelyList.surecontact_uuid}`);
    const result = await sureContactRequest(
      `/contacts/${contactUuid}/lists/attach`,
      'POST',
      apiKey,
      { list_uuids: [launchelyList.surecontact_uuid] }
    );
    return result.success;
  }
  
  console.warn('Launchely list not found in config - checking for any list');
  
  // Fallback: try first available list
  for (const [key, value] of config.entries()) {
    if (key.startsWith('list:')) {
      console.log(`Using fallback list: ${key}`);
      const result = await sureContactRequest(
        `/contacts/${contactUuid}/lists/attach`,
        'POST',
        apiKey,
        { list_uuids: [value.surecontact_uuid] }
      );
      return result.success;
    }
  }
  
  console.error('No lists found in config');
  return false;
}

async function getSubscriptionStatus(
  stripe: Stripe | null,
  email: string
): Promise<{ status: 'free' | 'pro'; customerId?: string; plan?: string; startDate?: string }> {
  if (!stripe) return { status: 'free' };

  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) return { status: 'free' };

    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      const plan = sub.items.data[0]?.price?.nickname || 
                   sub.items.data[0]?.price?.id || 
                   'pro';
      // Get subscription start date from Stripe
      const startDate = new Date(sub.start_date * 1000).toISOString().split('T')[0];
      return { status: 'pro', customerId: customer.id, plan, startDate };
    }

    return { status: 'free', customerId: customer.id };
  } catch (error) {
    console.error('Error checking Stripe subscription:', error);
    return { status: 'free' };
  }
}

async function syncContact(
  apiKey: string,
  payload: ContactPayload,
  config: Map<string, SureContactConfig>
): Promise<{ success: boolean; error?: string; tagsAdded?: string[]; tagsRemoved?: string[] }> {
  // Find or create contact
  const contactResult = await findOrCreateContact(apiKey, payload, config);
  
  if (!contactResult.uuid) {
    return { success: false, error: contactResult.error || 'Failed to create contact' };
  }

  // Manage tags
  const tagResult = await manageTags(apiKey, contactResult.uuid, payload, config);

  // Add to master list (only for new contacts)
  if (contactResult.isNew) {
    await addToMasterList(apiKey, contactResult.uuid, config);
  }

  return {
    success: true,
    tagsAdded: tagResult.added,
    tagsRemoved: tagResult.removed,
  };
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
    const sureContactApiKey = Deno.env.get('SURECONTACT_API_KEY');
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!sureContactApiKey) {
      console.error('SURECONTACT_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'SureContact API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

    // Load SureContact config
    let config: Map<string, SureContactConfig>;
    try {
      config = await getConfig(supabase);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Config error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { 
      action, user_id, email, first_name, last_name, event_type,
      // Order sync fields
      order_id, total, currency, status, products, created_at 
    } = body;
    console.log('SureContact sync called with action:', action);

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

    const results: { email: string; success: boolean; error?: string; tagsAdded?: string[]; tagsRemoved?: string[] }[] = [];

    if (action === 'sync_new_signup') {
      // Lightweight sync for new signups
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email required for sync_new_signup' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const payload: ContactPayload = {
        email,
        first_name: first_name || '',
        last_name: last_name || '',
        subscription_status: 'free',
        event_type: 'signup',
        signup_date: new Date().toISOString().split('T')[0],
      };

      const result = await syncContact(sureContactApiKey, payload, config);
      await logWebhookResult(supabase, {
        email,
        event_type: 'signup',
        subscription_status: 'free',
        success: result.success,
        response_status: result.success ? 200 : 500,
        error_message: result.error,
        tags_added: result.tagsAdded,
        tags_removed: result.tagsRemoved,
      });

      results.push({ email, ...result });

    } else if (action === 'sync_user') {
      // Sync single user by ID
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'user_id required for sync_user' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user data
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, user_id, created_at')
        .eq('user_id', user_id)
        .single();

      const { data: authData } = await supabase.auth.admin.getUserById(user_id);
      
      if (!authData?.user?.email) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userEmail = authData.user.email;
      const stripeInfo = await getSubscriptionStatus(stripe, userEmail);
      const eventTypeToUse = event_type || 'manual_sync';

      const payload: ContactPayload = {
        email: userEmail,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        subscription_status: stripeInfo.status,
        event_type: eventTypeToUse,
        stripe_customer_id: stripeInfo.customerId,
        subscription_plan: stripeInfo.plan,
        signup_date: profile?.created_at?.split('T')[0],
        subscription_start_date: stripeInfo.startDate,
      };

      const result = await syncContact(sureContactApiKey, payload, config);
      await logWebhookResult(supabase, {
        email: userEmail,
        event_type: eventTypeToUse,
        subscription_status: stripeInfo.status,
        success: result.success,
        response_status: result.success ? 200 : 500,
        error_message: result.error,
        tags_added: result.tagsAdded,
        tags_removed: result.tagsRemoved,
      });

      results.push({ email: userEmail, ...result });

    } else if (action === 'sync_all') {
      // Sync all users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, created_at');

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
          const stripeInfo = await getSubscriptionStatus(stripe, userEmail);

          const payload: ContactPayload = {
            email: userEmail,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            subscription_status: stripeInfo.status,
            event_type: 'manual_sync',
            stripe_customer_id: stripeInfo.customerId,
            subscription_plan: stripeInfo.plan,
            signup_date: profile.created_at?.split('T')[0],
            subscription_start_date: stripeInfo.startDate,
          };

          const result = await syncContact(sureContactApiKey, payload, config);
          await logWebhookResult(supabase, {
            email: userEmail,
            event_type: 'manual_sync',
            subscription_status: stripeInfo.status,
            success: result.success,
            response_status: result.success ? 200 : 500,
            error_message: result.error,
            tags_added: result.tagsAdded,
            tags_removed: result.tagsRemoved,
          });

          results.push({ email: userEmail, ...result });

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error syncing user ${profile.user_id}:`, error);
          results.push({ 
            email: profile.user_id, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
    } else if (action === 'sync_order') {
      // Sync order to SureContact E-Commerce tab
      if (!email || !order_id) {
        return new Response(
          JSON.stringify({ error: 'Email and order_id required for sync_order' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Syncing order ${order_id} for ${email}`);

      // First, find or create the contact
      const contactResult = await findOrCreateContact(sureContactApiKey, {
        email,
        first_name: first_name || '',
        last_name: last_name || '',
        subscription_status: 'pro', // Orders imply pro status
        event_type: 'order',
      }, config);

      if (!contactResult.uuid) {
        console.error('Failed to find/create contact for order sync:', contactResult.error);
        await logWebhookResult(supabase, {
          email,
          event_type: 'order',
          subscription_status: 'pro',
          success: false,
          response_status: 500,
          error_message: contactResult.error || 'Failed to find/create contact',
        });
        return new Response(
          JSON.stringify({ error: 'Failed to find/create contact' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create order in SureContact
      // Note: SureContact may have different API structures for orders
      // We'll try the /contacts/{uuid}/orders endpoint first
      const orderPayload = {
        external_id: order_id,
        total: total || 0,
        currency: currency || 'USD',
        status: status || 'completed',
        source: 'Stripe',
        ordered_at: created_at || new Date().toISOString(),
        line_items: (products || []).map((p: { name: string; quantity: number; amount: number }) => ({
          name: p.name,
          quantity: p.quantity || 1,
          price: p.amount || 0
        }))
      };

      console.log('Creating order in SureContact:', JSON.stringify(orderPayload));

      const orderResult = await sureContactRequest(
        `/contacts/${contactResult.uuid}/orders`,
        'POST',
        sureContactApiKey,
        orderPayload
      );

      // If orders endpoint doesn't exist, try updating custom fields with order data
      if (!orderResult.success && orderResult.status === 404) {
        console.log('Orders endpoint not found, updating custom fields instead');
        
        // Get existing contact to read current values
        const contactData = await sureContactRequest(
          `/contacts/${contactResult.uuid}`,
          'GET',
          sureContactApiKey
        );

        // Update contact with order summary in custom fields
        const updatePayload: Record<string, string> = {};
        
        // Map custom fields for order tracking
        const totalSpentField = config.get('custom_field:total_spent');
        const lastOrderDateField = config.get('custom_field:last_order_date');
        const lastOrderAmountField = config.get('custom_field:last_order_amount');
        const totalOrdersField = config.get('custom_field:total_orders');

        if (totalSpentField) {
          const currentTotal = parseFloat(contactData.data?.custom_fields?.[totalSpentField.surecontact_uuid] || '0');
          updatePayload[totalSpentField.surecontact_uuid] = String(currentTotal + (total || 0));
        }
        if (lastOrderDateField) {
          updatePayload[lastOrderDateField.surecontact_uuid] = created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
        }
        if (lastOrderAmountField) {
          updatePayload[lastOrderAmountField.surecontact_uuid] = String(total || 0);
        }
        if (totalOrdersField) {
          const currentOrders = parseInt(contactData.data?.custom_fields?.[totalOrdersField.surecontact_uuid] || '0');
          updatePayload[totalOrdersField.surecontact_uuid] = String(currentOrders + 1);
        }

        if (Object.keys(updatePayload).length > 0) {
          const updateResult = await sureContactRequest(
            `/contacts/${contactResult.uuid}`,
            'PUT',
            sureContactApiKey,
            { custom_fields: updatePayload }
          );
          
          await logWebhookResult(supabase, {
            email,
            event_type: 'order',
            subscription_status: 'pro',
            success: updateResult.success,
            response_status: updateResult.status,
            error_message: updateResult.error,
          });

          results.push({ 
            email, 
            success: updateResult.success, 
            error: updateResult.error 
          });
        } else {
          console.log('No custom fields configured for order tracking');
          await logWebhookResult(supabase, {
            email,
            event_type: 'order',
            subscription_status: 'pro',
            success: true,
            response_status: 200,
          });
          results.push({ email, success: true });
        }
      } else {
        await logWebhookResult(supabase, {
          email,
          event_type: 'order',
          subscription_status: 'pro',
          success: orderResult.success,
          response_status: orderResult.status,
          error_message: orderResult.error,
        });
        results.push({ 
          email, 
          success: orderResult.success, 
          error: orderResult.error 
        });
      }

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use: sync_new_signup, sync_user, sync_all, or sync_order' }),
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
    console.error('SureContact sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

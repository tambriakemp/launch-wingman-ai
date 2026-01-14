import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SURECONTACT_API_BASE = 'https://api.surecontact.io/api/v1/public';

interface SureContactTag {
  uuid: string;
  name: string;
  color?: string;
}

interface SureContactList {
  uuid: string;
  name: string;
  description?: string;
}

interface SureContactCustomField {
  uuid: string;
  name: string;
  type: string;
}

async function fetchSureContactData<T>(endpoint: string, apiKey: string): Promise<T[]> {
  console.log(`Fetching from SureContact: ${endpoint}`);
  
  const response = await fetch(`${SURECONTACT_API_BASE}${endpoint}`, {
    method: 'GET',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`SureContact API error (${response.status}):`, errorText);
    throw new Error(`SureContact API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`Fetched ${data.data?.length || 0} items from ${endpoint}`);
  
  // SureContact API returns data in a "data" wrapper
  return data.data || data || [];
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

    if (!sureContactApiKey) {
      console.error('SURECONTACT_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'SureContact API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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

    console.log('Fetching SureContact configuration...');

    // Fetch all data in parallel
    const [tags, lists, customFields] = await Promise.all([
      fetchSureContactData<SureContactTag>('/tags', sureContactApiKey),
      fetchSureContactData<SureContactList>('/lists', sureContactApiKey),
      fetchSureContactData<SureContactCustomField>('/custom-fields', sureContactApiKey),
    ]);

    console.log(`Found: ${tags.length} tags, ${lists.length} lists, ${customFields.length} custom fields`);

    // Clear existing config and insert new
    const { error: deleteError } = await supabase
      .from('surecontact_config')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error clearing existing config:', deleteError);
    }

    const configItems: Array<{
      config_type: string;
      name: string;
      surecontact_uuid: string;
      metadata: Record<string, unknown>;
    }> = [];

    // Process tags
    for (const tag of tags) {
      configItems.push({
        config_type: 'tag',
        name: tag.name,
        surecontact_uuid: tag.uuid,
        metadata: { color: tag.color },
      });
    }

    // Process lists
    for (const list of lists) {
      configItems.push({
        config_type: 'list',
        name: list.name,
        surecontact_uuid: list.uuid,
        metadata: { description: list.description },
      });
    }

    // Process custom fields
    for (const field of customFields) {
      configItems.push({
        config_type: 'custom_field',
        name: field.name,
        surecontact_uuid: field.uuid,
        metadata: { type: field.type },
      });
    }

    // Insert all config items
    if (configItems.length > 0) {
      const { error: insertError } = await supabase
        .from('surecontact_config')
        .insert(configItems);

      if (insertError) {
        console.error('Error inserting config:', insertError);
        throw new Error(`Failed to save config: ${insertError.message}`);
      }
    }

    const summary = {
      success: true,
      message: 'SureContact configuration fetched and stored successfully',
      tags: tags.map(t => ({ name: t.name, uuid: t.uuid })),
      lists: lists.map(l => ({ name: l.name, uuid: l.uuid })),
      custom_fields: customFields.map(f => ({ name: f.name, uuid: f.uuid, type: (f as any).type })),
      total_items: configItems.length,
    };

    console.log('SureContact config initialized:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SureContact init error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

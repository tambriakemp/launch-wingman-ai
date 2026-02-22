import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SURECONTACT_API_BASE = 'https://api.surecontact.com/api/v1/public';

async function sureContactRequest(
  endpoint: string,
  apiKey: string
): Promise<{ success: boolean; data?: any; status: number; error?: string }> {
  try {
    const response = await fetch(`${SURECONTACT_API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sureContactApiKey = Deno.env.get('SURECONTACT_API_KEY');

    if (!sureContactApiKey) {
      return new Response(
        JSON.stringify({ error: 'SureContact API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get campaign_id from query params
    const url = new URL(req.url);
    const campaignId = url.searchParams.get('campaign_id');

    if (!campaignId) {
      return new Response(
        JSON.stringify({ error: 'campaign_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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

    // Get campaign name and verify ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('name, user_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (campaign.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to view this campaign' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up the campaign tag UUID from surecontact_config
    const tagName = `campaign:${campaign.name}`;
    const { data: tagConfig } = await supabase
      .from('surecontact_config')
      .select('surecontact_uuid')
      .eq('config_type', 'tag')
      .eq('name', tagName)
      .single();

    if (!tagConfig) {
      // No tag configured yet — 0 leads
      return new Response(
        JSON.stringify({ leads: 0, tag_exists: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query SureContact for contacts with this tag
    const result = await sureContactRequest(
      `/contacts?tag=${tagConfig.surecontact_uuid}`,
      sureContactApiKey
    );

    if (!result.success) {
      console.error('SureContact API error:', result.error);
      return new Response(
        JSON.stringify({ leads: 0, error: 'Failed to query SureContact' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SureContact returns paginated results with a total count
    const leads = result.data?.meta?.total ?? result.data?.data?.length ?? 0;

    return new Response(
      JSON.stringify({ leads, tag_exists: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('campaign-leads error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

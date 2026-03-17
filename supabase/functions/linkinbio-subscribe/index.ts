import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SURECONTACT_API_BASE = 'https://api.surecontact.com/api/v1/public';

async function sureContactRequest(
  endpoint: string,
  method: string,
  apiKey: string,
  body?: unknown
): Promise<{ success: boolean; data?: any; status: number; error?: string }> {
  const response = await fetch(`${SURECONTACT_API_BASE}${endpoint}`, {
    method,
    headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { success: response.ok, data, status: response.status, error: response.ok ? undefined : String(data) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sureContactApiKey = Deno.env.get('SURECONTACT_API_KEY');
    if (!sureContactApiKey) {
      console.error('SURECONTACT_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Service unavailable' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Look up "Launchely" list UUID and "link-in-bio" tag UUID from config
    const { data: configs } = await supabase
      .from('surecontact_config')
      .select('config_type, name, surecontact_uuid')
      .or('and(config_type.eq.list,name.eq.Launchely),and(config_type.eq.tag,name.eq.link-in-bio)');

    const listUuid = configs?.find((c: any) => c.config_type === 'list' && c.name === 'Launchely')?.surecontact_uuid;
    const tagUuid = configs?.find((c: any) => c.config_type === 'tag' && c.name === 'link-in-bio')?.surecontact_uuid;

    // Find or create contact
    const searchResult = await sureContactRequest(
      `/contacts?email=${encodeURIComponent(email)}`, 'GET', sureContactApiKey
    );

    let contactUuid: string;

    if (searchResult.success && searchResult.data?.data?.length > 0) {
      const match = searchResult.data.data.find(
        (c: { email: string }) => c.email.toLowerCase() === email.toLowerCase()
      );
      if (match) {
        contactUuid = match.uuid;
        console.log(`Found existing contact: ${contactUuid}`);
      } else {
        const createRes = await sureContactRequest('/contacts', 'POST', sureContactApiKey, {
          primary_fields: { email, source: 'api' },
        });
        contactUuid = createRes.data?.data?.uuid || createRes.data?.uuid;
        console.log(`Created contact: ${contactUuid}`);
      }
    } else {
      const createRes = await sureContactRequest('/contacts', 'POST', sureContactApiKey, {
        primary_fields: { email, source: 'api' },
      });
      contactUuid = createRes.data?.data?.uuid || createRes.data?.uuid;
      console.log(`Created contact: ${contactUuid}`);
    }

    if (!contactUuid) {
      throw new Error('Failed to find or create contact');
    }

    // Subscribe to list
    if (listUuid) {
      const subRes = await sureContactRequest(
        `/lists/${listUuid}/subscribers`, 'POST', sureContactApiKey,
        { contact_uuid: contactUuid }
      );
      console.log(`List subscribe result: ${subRes.status}`, JSON.stringify(subRes.data));
      if (!subRes.success) {
        console.error(`List subscribe failed for list ${listUuid}:`, subRes.error || subRes.data);
      }
    } else {
      console.warn('Launchely list UUID not found in surecontact_config');
    }

    // Attach tag
    if (tagUuid) {
      const tagRes = await sureContactRequest(
        `/contacts/${contactUuid}/tags/attach`, 'POST', sureContactApiKey,
        { tag_uuids: [tagUuid] }
      );
      console.log(`Tag attach result: ${tagRes.status}`, JSON.stringify(tagRes.data));
    } else {
      // Auto-create the tag if it doesn't exist in config
      console.log('link-in-bio tag not found in config, attempting to find or create in SureContact...');
      
      // First try to find existing tag by name
      const searchTagRes = await sureContactRequest('/tags?search=link-in-bio', 'GET', sureContactApiKey);
      console.log('Tag search result:', JSON.stringify(searchTagRes.data));
      
      let resolvedTagUuid: string | undefined;
      
      if (searchTagRes.success && searchTagRes.data?.data?.length > 0) {
        const existingTag = searchTagRes.data.data.find((t: any) => t.name === 'link-in-bio');
        if (existingTag?.uuid) {
          resolvedTagUuid = existingTag.uuid;
          console.log(`Found existing tag in SureContact: ${resolvedTagUuid}`);
        }
      }
      
      if (!resolvedTagUuid) {
        const createTagRes = await sureContactRequest('/tags', 'POST', sureContactApiKey, { name: 'link-in-bio' });
        console.log('Tag create result:', JSON.stringify(createTagRes.data));
        resolvedTagUuid = createTagRes.data?.data?.uuid || createTagRes.data?.uuid;
      }
      
      if (resolvedTagUuid) {
        // Save to config for future lookups
        const { error: insertError } = await supabase.from('surecontact_config').insert({
          config_type: 'tag', name: 'link-in-bio', surecontact_uuid: resolvedTagUuid,
        });
        if (insertError) {
          console.warn('Failed to save tag config (may already exist):', insertError.message);
        } else {
          console.log(`Saved link-in-bio tag to config: ${resolvedTagUuid}`);
        }
        
        const attachRes = await sureContactRequest(
          `/contacts/${contactUuid}/tags/attach`, 'POST', sureContactApiKey,
          { tag_uuids: [resolvedTagUuid] }
        );
        console.log(`Tag attach result: ${attachRes.status}`, JSON.stringify(attachRes.data));
      } else {
        console.error('Failed to find or create link-in-bio tag');
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('linkinbio-subscribe error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

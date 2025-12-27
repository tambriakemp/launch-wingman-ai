import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CsvResource {
  title: string;
  resource_url: string;
  cover_image_url?: string;
  category: string;
  subcategory: string;
  description?: string;
  resource_type?: string;
  tags?: string;
}

interface ProcessResult {
  added: number;
  skipped: number;
  failed: number;
  errors: { row: number; title: string; error: string }[];
  addedTitles: string[];
  skippedTitles: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { resources } = await req.json() as { resources: CsvResource[] };
    
    if (!resources || !Array.isArray(resources) || resources.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No resources provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${resources.length} resources`);

    // Fetch all categories
    const { data: categories, error: catError } = await supabaseAdmin
      .from('content_vault_categories')
      .select('id, name, slug');

    if (catError) {
      console.error('Categories fetch error:', catError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch categories' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all subcategories
    const { data: subcategories, error: subError } = await supabaseAdmin
      .from('content_vault_subcategories')
      .select('id, name, slug, category_id');

    if (subError) {
      console.error('Subcategories fetch error:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subcategories' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build lookup maps (case-insensitive)
    const categoryMap = new Map<string, string>();
    categories?.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
      categoryMap.set(cat.slug.toLowerCase(), cat.id);
    });

    const subcategoryMap = new Map<string, { id: string; categoryId: string }>();
    subcategories?.forEach(sub => {
      const key = `${sub.category_id}:${sub.name.toLowerCase()}`;
      const slugKey = `${sub.category_id}:${sub.slug.toLowerCase()}`;
      subcategoryMap.set(key, { id: sub.id, categoryId: sub.category_id });
      subcategoryMap.set(slugKey, { id: sub.id, categoryId: sub.category_id });
    });

    // Get existing resource URLs for duplicate detection
    const resourceUrls = resources.map(r => r.resource_url).filter(Boolean);
    const { data: existingResources, error: existingError } = await supabaseAdmin
      .from('content_vault_resources')
      .select('resource_url')
      .in('resource_url', resourceUrls);

    if (existingError) {
      console.error('Existing resources fetch error:', existingError);
    }

    const existingUrlSet = new Set(existingResources?.map(r => r.resource_url) || []);

    // Get current max positions per subcategory
    const { data: positionData } = await supabaseAdmin
      .from('content_vault_resources')
      .select('subcategory_id, position');

    const maxPositions = new Map<string, number>();
    positionData?.forEach(item => {
      const current = maxPositions.get(item.subcategory_id) || 0;
      if (item.position > current) {
        maxPositions.set(item.subcategory_id, item.position);
      }
    });

    const result: ProcessResult = {
      added: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      addedTitles: [],
      skippedTitles: []
    };

    // Process each resource
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const rowNum = i + 2; // +2 for header row and 0-indexing

      // Validate required fields
      if (!resource.title?.trim()) {
        result.failed++;
        result.errors.push({ row: rowNum, title: resource.title || 'Unknown', error: 'Missing title' });
        continue;
      }

      if (!resource.resource_url?.trim()) {
        result.failed++;
        result.errors.push({ row: rowNum, title: resource.title, error: 'Missing resource_url' });
        continue;
      }

      if (!resource.category?.trim()) {
        result.failed++;
        result.errors.push({ row: rowNum, title: resource.title, error: 'Missing category' });
        continue;
      }

      if (!resource.subcategory?.trim()) {
        result.failed++;
        result.errors.push({ row: rowNum, title: resource.title, error: 'Missing subcategory' });
        continue;
      }

      // Check for duplicate
      if (existingUrlSet.has(resource.resource_url)) {
        result.skipped++;
        result.skippedTitles.push(resource.title);
        continue;
      }

      // Lookup category
      const categoryId = categoryMap.get(resource.category.toLowerCase().trim());
      if (!categoryId) {
        result.failed++;
        result.errors.push({ row: rowNum, title: resource.title, error: `Category not found: ${resource.category}` });
        continue;
      }

      // Lookup subcategory
      const subKey = `${categoryId}:${resource.subcategory.toLowerCase().trim()}`;
      const subcategoryInfo = subcategoryMap.get(subKey);
      if (!subcategoryInfo) {
        result.failed++;
        result.errors.push({ row: rowNum, title: resource.title, error: `Subcategory not found: ${resource.subcategory} in category ${resource.category}` });
        continue;
      }

      // Parse tags
      let tags: string[] = [];
      if (resource.tags?.trim()) {
        tags = resource.tags.split(',').map(t => t.trim()).filter(Boolean);
      }

      // Get next position
      const currentMax = maxPositions.get(subcategoryInfo.id) || 0;
      const nextPosition = currentMax + 1;
      maxPositions.set(subcategoryInfo.id, nextPosition);

      // Insert resource
      const { error: insertError } = await supabaseAdmin
        .from('content_vault_resources')
        .insert({
          title: resource.title.trim(),
          resource_url: resource.resource_url.trim(),
          cover_image_url: resource.cover_image_url?.trim() || null,
          subcategory_id: subcategoryInfo.id,
          description: resource.description?.trim() || null,
          resource_type: resource.resource_type?.trim() || 'canva_link',
          tags: tags.length > 0 ? tags : null,
          position: nextPosition
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        result.failed++;
        result.errors.push({ row: rowNum, title: resource.title, error: insertError.message });
      } else {
        result.added++;
        result.addedTitles.push(resource.title);
        existingUrlSet.add(resource.resource_url); // Prevent duplicates within same batch
      }
    }

    console.log(`Processing complete: ${result.added} added, ${result.skipped} skipped, ${result.failed} failed`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Processing error:', error);
    const message = error instanceof Error ? error.message : 'Processing failed';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

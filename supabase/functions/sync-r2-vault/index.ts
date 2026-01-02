import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { S3Client, ListObjectsV2Command } from "https://esm.sh/@aws-sdk/client-s3@3.400.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  added: number;
  skipped: number;
  errors: string[];
  files: { path: string; action: string }[];
}

// File extensions for photos and videos
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : '';
}

function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.includes(getFileExtension(filename));
}

function isVideoFile(filename: string): boolean {
  return VIDEO_EXTENSIONS.includes(getFileExtension(filename));
}

function cleanFilename(filename: string): string {
  // Remove extension, replace hyphens/underscores with spaces, capitalize words
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function parsePath(key: string): { category: string; subcategory: string | null; filename: string } | null {
  const parts = key.split('/').filter(p => p.length > 0);
  
  if (parts.length === 0) return null;
  
  // Expected structure: category/subcategory/filename OR category/filename
  if (parts.length === 1) {
    // Just a filename at root
    return { category: 'general', subcategory: null, filename: parts[0] };
  } else if (parts.length === 2) {
    // category/filename
    return { category: parts[0], subcategory: null, filename: parts[1] };
  } else {
    // category/subcategory/filename (or deeper)
    return { 
      category: parts[0], 
      subcategory: parts[1], 
      filename: parts[parts.length - 1] 
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get R2 credentials from environment
    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('R2_BUCKET_NAME');
    const publicUrl = Deno.env.get('R2_PUBLIC_URL');

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      console.error('Missing R2 configuration');
      return new Response(
        JSON.stringify({ error: 'R2 configuration incomplete. Please check all secrets are set.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting R2 sync for admin:', user.email);

    // Create S3 client for R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // List all objects in the bucket
    const allObjects: { Key: string }[] = [];
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);
      
      if (response.Contents) {
        allObjects.push(...response.Contents.filter(obj => obj.Key).map(obj => ({ Key: obj.Key! })));
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    console.log(`Found ${allObjects.length} objects in R2 bucket`);

    // Filter for image and video files
    const mediaFiles = allObjects.filter(obj => 
      isImageFile(obj.Key) || isVideoFile(obj.Key)
    );

    console.log(`Found ${mediaFiles.length} media files`);

    // Fetch existing categories and subcategories
    const { data: categories } = await supabase
      .from('content_vault_categories')
      .select('id, slug, name');

    const { data: subcategories } = await supabase
      .from('content_vault_subcategories')
      .select('id, slug, name, category_id');

    // Fetch existing resource URLs to check for duplicates
    const { data: existingResources } = await supabase
      .from('content_vault_resources')
      .select('resource_url');

    const existingUrls = new Set(existingResources?.map(r => r.resource_url) || []);

    // Create lookup maps
    const categoryMap = new Map(categories?.map(c => [c.slug.toLowerCase(), c]) || []);
    const subcategoryMap = new Map(subcategories?.map(s => [`${s.category_id}-${s.slug.toLowerCase()}`, s]) || []);

    // Find photos and videos categories
    const photosCategory = categories?.find(c => c.slug === 'photos');
    const videosCategory = categories?.find(c => c.slug === 'videos');

    if (!photosCategory || !videosCategory) {
      return new Response(
        JSON.stringify({ 
          error: 'Photos or Videos category not found in content vault. Please create them first.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: SyncResult = {
      added: 0,
      skipped: 0,
      errors: [],
      files: [],
    };

    // Process each media file
    for (const obj of mediaFiles) {
      const parsed = parsePath(obj.Key);
      if (!parsed) {
        result.errors.push(`Could not parse path: ${obj.Key}`);
        continue;
      }

      const resourceUrl = `${publicUrl.replace(/\/$/, '')}/${obj.Key}`;

      // Check for duplicate
      if (existingUrls.has(resourceUrl)) {
        result.skipped++;
        result.files.push({ path: obj.Key, action: 'skipped (duplicate)' });
        continue;
      }

      // Determine target category based on file type
      const isImage = isImageFile(parsed.filename);
      const targetCategory = isImage ? photosCategory : videosCategory;

      // Try to find or create subcategory based on path
      let subcategoryId: string | null = null;
      
      if (parsed.subcategory) {
        const subcatSlug = parsed.subcategory.toLowerCase().replace(/\s+/g, '-');
        const subcatKey = `${targetCategory.id}-${subcatSlug}`;
        
        const existingSubcat = subcategoryMap.get(subcatKey);
        if (existingSubcat) {
          subcategoryId = existingSubcat.id;
        } else {
          // Create new subcategory
          const { data: newSubcat, error: subcatError } = await supabase
            .from('content_vault_subcategories')
            .insert({
              category_id: targetCategory.id,
              name: cleanFilename(parsed.subcategory),
              slug: subcatSlug,
              position: 0,
            })
            .select('id')
            .single();

          if (subcatError) {
            result.errors.push(`Failed to create subcategory for ${obj.Key}: ${subcatError.message}`);
            continue;
          }
          
          subcategoryId = newSubcat.id;
          subcategoryMap.set(subcatKey, { id: newSubcat.id, slug: subcatSlug, name: cleanFilename(parsed.subcategory), category_id: targetCategory.id });
        }
      } else {
        // Use default subcategory or first available
        const defaultSubcats = subcategories?.filter(s => s.category_id === targetCategory.id);
        if (defaultSubcats && defaultSubcats.length > 0) {
          subcategoryId = defaultSubcats[0].id;
        } else {
          // Create a default subcategory
          const { data: newSubcat, error: subcatError } = await supabase
            .from('content_vault_subcategories')
            .insert({
              category_id: targetCategory.id,
              name: 'General',
              slug: 'general',
              position: 0,
            })
            .select('id')
            .single();

          if (subcatError) {
            result.errors.push(`Failed to create default subcategory: ${subcatError.message}`);
            continue;
          }
          
          subcategoryId = newSubcat.id;
        }
      }

      if (!subcategoryId) {
        result.errors.push(`No subcategory found for ${obj.Key}`);
        continue;
      }

      // Insert resource
      const { error: insertError } = await supabase
        .from('content_vault_resources')
        .insert({
          subcategory_id: subcategoryId,
          title: cleanFilename(parsed.filename),
          description: null,
          cover_image_url: isImage ? resourceUrl : null,
          resource_type: 'download',
          resource_url: resourceUrl,
          tags: parsed.subcategory ? [cleanFilename(parsed.subcategory)] : [],
          position: 0,
        });

      if (insertError) {
        result.errors.push(`Failed to insert ${obj.Key}: ${insertError.message}`);
        result.files.push({ path: obj.Key, action: 'error' });
      } else {
        result.added++;
        result.files.push({ path: obj.Key, action: 'added' });
        existingUrls.add(resourceUrl);
      }
    }

    console.log('Sync complete:', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

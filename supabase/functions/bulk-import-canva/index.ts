import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CanvaLink {
  url: string;
  designId: string;
  linkType: 'template' | 'preview' | 'edit';
  shareToken: string;
}

interface ParsedDesign {
  designId: string;
  templateUrl: string | null;
  previewUrl: string | null;
  editUrl: string | null;
  thumbnail: string | null;
  title: string | null;
  isDuplicate: boolean;
  existingResourceId: string | null;
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
  designs: ParsedDesign[];
}

function parseCanvaUrl(url: string): CanvaLink | null {
  try {
    const urlObj = new URL(url.trim());
    
    if (!urlObj.hostname.includes('canva.com')) {
      return null;
    }

    // Extract design ID and share token from path
    // Format: /design/{designId}/{shareToken}/{action}
    const pathMatch = urlObj.pathname.match(/\/design\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)\/(view|watch|edit)/);
    
    if (!pathMatch) {
      return null;
    }

    const [, designId, shareToken, action] = pathMatch;
    
    // Check for mode=preview query parameter (Canva preview links sometimes use /view with mode=preview)
    const hasPreviewMode = urlObj.searchParams.get('mode') === 'preview';
    
    let linkType: 'template' | 'preview' | 'edit';
    if (action === 'watch' || hasPreviewMode) {
      linkType = 'preview';
    } else if (action === 'view') {
      linkType = 'template';
    } else {
      linkType = 'edit';
    }

    return {
      url: url.trim(),
      designId,
      shareToken,
      linkType,
    };
  } catch {
    return null;
  }
}

async function fetchCanvaMetadata(url: string): Promise<{ thumbnail: string | null; title: string | null }> {
  try {
    console.log('Fetching metadata for:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch Canva page:', response.status);
      return { thumbnail: null, title: null };
    }

    const html = await response.text();

    // Extract og:image
    const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);

    // Extract og:title or title
    const ogTitleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                         html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["']/i) ||
                         html.match(/<title>([^<]+)<\/title>/i);

    const thumbnail = ogImageMatch?.[1] || null;
    let title = ogTitleMatch?.[1] || null;

    // Clean up title - remove common Canva suffixes
    if (title) {
      title = title.replace(/\s*[-|]\s*Canva.*$/i, '').trim();
      title = title.replace(/\s*\|\s*Free Design Template.*$/i, '').trim();
    }

    console.log('Extracted metadata:', { thumbnail: thumbnail ? 'found' : 'none', title });
    return { thumbnail, title };
  } catch (error) {
    console.error('Error fetching Canva metadata:', error);
    return { thumbnail: null, title: null };
  }
}

async function cacheThumbnail(
  supabaseUrl: string,
  supabaseServiceKey: string,
  thumbnailUrl: string,
  designId: string
): Promise<string | null> {
  try {
    console.log('Caching thumbnail for design:', designId);
    
    const storageClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const response = await fetch(thumbnailUrl);
    if (!response.ok) {
      console.error('Failed to fetch thumbnail:', response.status);
      return null;
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : 'jpg';
    const filePath = `canva-thumbnails/${designId}.${extension}`;

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const { error } = await storageClient.storage
      .from('content-media')
      .upload(filePath, uint8Array, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Failed to upload thumbnail:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = storageClient.storage
      .from('content-media')
      .getPublicUrl(filePath);

    console.log('Cached thumbnail:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error caching thumbnail:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: roleData } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      links, 
      targetSubcategoryId,
      previewOnly = false,
      fetchMetadata = false,
    } = await req.json();

    if (!links || !Array.isArray(links) || links.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Links array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${links.length} Canva links, previewOnly=${previewOnly}, fetchMetadata=${fetchMetadata}`);

    // Parse all links and group by design ID
    const designMap = new Map<string, {
      designId: string;
      templateUrl: string | null;
      previewUrl: string | null;
      editUrl: string | null;
    }>();

    const parseErrors: string[] = [];

    for (const link of links) {
      const parsed = parseCanvaUrl(link);
      if (!parsed) {
        parseErrors.push(`Invalid Canva URL: ${link.substring(0, 50)}...`);
        continue;
      }

      const existing = designMap.get(parsed.designId) || {
        designId: parsed.designId,
        templateUrl: null,
        previewUrl: null,
        editUrl: null,
      };

      if (parsed.linkType === 'template') {
        existing.templateUrl = parsed.url;
      } else if (parsed.linkType === 'preview') {
        existing.previewUrl = parsed.url;
      } else {
        existing.editUrl = parsed.url;
      }

      designMap.set(parsed.designId, existing);
    }

    // Check for existing resources by extracting design IDs from resource_url
    const designIds = Array.from(designMap.keys());
    const { data: existingResources } = await supabase
      .from('content_vault_resources')
      .select('id, resource_url, preview_url, title')
      .filter('resource_url', 'ilike', '%canva.com/design/%');

    // Build a map of existing design IDs to resources
    const existingDesignMap = new Map<string, { id: string; hasPreview: boolean; title: string }>();
    
    for (const resource of existingResources || []) {
      const match = resource.resource_url?.match(/\/design\/([A-Za-z0-9_-]+)\//);
      if (match) {
        existingDesignMap.set(match[1], {
          id: resource.id,
          hasPreview: !!resource.preview_url,
          title: resource.title,
        });
      }
    }

    // Process each unique design
    const designs: ParsedDesign[] = [];
    
    for (const [designId, designData] of designMap) {
      const existing = existingDesignMap.get(designId);
      
      const design: ParsedDesign = {
        designId,
        templateUrl: designData.templateUrl,
        previewUrl: designData.previewUrl,
        editUrl: designData.editUrl,
        thumbnail: null,
        title: null,
        isDuplicate: !!existing,
        existingResourceId: existing?.id || null,
      };

      // Fetch metadata if requested
      if (fetchMetadata) {
        const urlToFetch = designData.templateUrl || designData.previewUrl || designData.editUrl;
        if (urlToFetch) {
          const metadata = await fetchCanvaMetadata(urlToFetch);
          design.thumbnail = metadata.thumbnail;
          design.title = metadata.title || existing?.title || null;
        }
      }

      designs.push(design);
    }

    // If preview only, return the parsed designs
    if (previewOnly) {
      return new Response(
        JSON.stringify({
          imported: 0,
          updated: 0,
          skipped: 0,
          errors: parseErrors,
          designs,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Import/update resources
    if (!targetSubcategoryId) {
      return new Response(
        JSON.stringify({ error: 'Target subcategory ID is required for import' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get max position for new resources
    const { data: maxPosData } = await supabase
      .from('content_vault_resources')
      .select('position')
      .eq('subcategory_id', targetSubcategoryId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextPosition = (maxPosData?.position || 0) + 1;

    const result: ImportResult = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [...parseErrors],
      designs: [],
    };

    for (const design of designs) {
      try {
        // Use template URL if available, otherwise fall back to preview or edit URL
        const resourceUrl = design.templateUrl || design.previewUrl || design.editUrl;
        if (!resourceUrl) {
          result.skipped++;
          continue;
        }

        // Cache thumbnail if available
        let cachedThumbnailUrl = design.thumbnail;
        if (design.thumbnail && design.thumbnail.startsWith('http')) {
          const cached = await cacheThumbnail(supabaseUrl, supabaseServiceKey, design.thumbnail, design.designId);
          if (cached) {
            cachedThumbnailUrl = cached;
          }
        }

        if (design.isDuplicate && design.existingResourceId) {
          // Update existing resource with preview URL if missing
          const updateData: Record<string, string | null> = {};
          
          if (design.previewUrl) {
            updateData.preview_url = design.previewUrl;
          }
          
          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from('content_vault_resources')
              .update(updateData)
              .eq('id', design.existingResourceId);

            if (updateError) {
              result.errors.push(`Failed to update ${design.designId}: ${updateError.message}`);
            } else {
              result.updated++;
            }
          } else {
            result.skipped++;
          }
        } else {
          // Insert new resource
          const title = design.title || `Canva Design ${design.designId}`;
          
          const { error: insertError } = await supabase
            .from('content_vault_resources')
            .insert({
              subcategory_id: targetSubcategoryId,
              title,
              resource_url: resourceUrl,
              preview_url: design.previewUrl,
              cover_image_url: cachedThumbnailUrl,
              resource_type: 'canva_link',
              position: nextPosition++,
            });

          if (insertError) {
            result.errors.push(`Failed to import ${design.designId}: ${insertError.message}`);
          } else {
            result.imported++;
          }
        }

        design.thumbnail = cachedThumbnailUrl;
        result.designs.push(design);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Error processing ${design.designId}: ${errorMessage}`);
      }
    }

    console.log(`Import complete: imported=${result.imported}, updated=${result.updated}, skipped=${result.skipped}, errors=${result.errors.length}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bulk-import-canva:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

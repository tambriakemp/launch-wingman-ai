import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Patterns that indicate auto-generated titles needing rename
function needsRenaming(title: string): boolean {
  if (!title || title.length < 3) return true;
  
  // Starts with IMG or IMG_
  if (/^IMG[_\s]?\d*/i.test(title)) return true;
  
  // Starts with Copy
  if (/^Copy\s/i.test(title)) return true;
  
  // Purely numeric
  if (/^\d+$/.test(title)) return true;
  
  // Contains UUID pattern
  if (/[a-f0-9]{8}[-_]?[a-f0-9]{4}[-_]?[a-f0-9]{4}[-_]?[a-f0-9]{4}[-_]?[a-f0-9]{12}/i.test(title)) return true;
  
  // File extension patterns
  if (/\.(mov|mp4|avi|mkv)$/i.test(title)) return true;
  
  return false;
}

async function generateTitleFromImage(imageUrl: string, apiKey: string, maxRetries = 3): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are naming stock video clips. Based on this thumbnail image, provide a short, descriptive title (3-5 words) in Title Case. Focus on the main subject and action.

Examples:
- "Coffee Pour Into Glass"
- "Woman Working on Laptop"
- "Sunset Over Ocean Waves"
- "Hands Typing on Keyboard"
- "Fresh Salad Being Prepared"

Respond with ONLY the title, no quotes, no punctuation at the end, no extra text.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
        }),
      });

      // Handle transient errors with retry
      if (response.status === 503 || response.status === 429) {
        const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s
        console.log(`Attempt ${attempt}/${maxRetries} failed with ${response.status}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI API error:", response.status, errorText);
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("No content in AI response");
      }

      // Clean up the response - remove quotes, extra whitespace, punctuation at end
      return content.trim().replace(/^["']|["']$/g, '').replace(/[.!?]$/, '').trim();
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Attempt ${attempt}/${maxRetries} error:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 500;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { previewOnly = false, batchSize = 20, offset = 0, singleResourceId, resourceType = 'video' } = await req.json();

    console.log(`Starting AI rename: previewOnly=${previewOnly}, batchSize=${batchSize}, offset=${offset}, singleResourceId=${singleResourceId}, resourceType=${resourceType}`);

    // Single resource mode - for on-demand renaming from edit dialog
    if (singleResourceId) {
      const { data: resource, error: queryError } = await supabase
        .from('content_vault_resources')
        .select('id, title, cover_image_url, resource_type')
        .eq('id', singleResourceId)
        .single();

      if (queryError) {
        console.error("Query error:", queryError);
        throw queryError;
      }

      if (!resource?.cover_image_url) {
        throw new Error('Resource has no cover image to analyze');
      }

      const newTitle = await generateTitleFromImage(resource.cover_image_url, lovableApiKey);
      
      console.log(`Generated title: "${newTitle}" for "${resource.title}"`);

      if (!previewOnly) {
        const { error: updateError } = await supabase
          .from('content_vault_resources')
          .update({ title: newTitle })
          .eq('id', singleResourceId);

        if (updateError) {
          console.error(`Update error for ${singleResourceId}:`, updateError);
          throw updateError;
        }
      }

      return new Response(JSON.stringify({
        renamed: 1,
        skipped: 0,
        failed: 0,
        previews: [{ id: resource.id, oldTitle: resource.title || '(no title)', newTitle }],
        errors: [],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Batch mode - query resources with images using offset pagination with stable ordering
    let query = supabase
      .from('content_vault_resources')
      .select('id, title, cover_image_url, resource_url, resource_type')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + batchSize - 1);

    // For videos, use cover_image_url; for images, use resource_url directly
    if (resourceType === 'video') {
      query = query.eq('resource_type', 'video').not('cover_image_url', 'is', null);
    } else if (resourceType === 'image') {
      query = query.eq('resource_type', 'image');
    }

    const { data: resources, error: queryError } = await query;

    if (queryError) {
      console.error("Query error:", queryError);
      throw queryError;
    }

    console.log(`Found ${resources?.length || 0} ${resourceType}s to check`);

    // Filter to only resources needing rename
    const resourcesToRename = (resources || []).filter(r => needsRenaming(r.title || ''));
    
    console.log(`${resourcesToRename.length} ${resourceType}s need renaming`);

    const results = {
      renamed: 0,
      skipped: (resources?.length || 0) - resourcesToRename.length,
      failed: 0,
      previews: [] as { id: string; oldTitle: string; newTitle: string }[],
      errors: [] as string[],
    };

    for (let index = 0; index < resourcesToRename.length; index++) {
      const resource = resourcesToRename[index];
      try {
        console.log(`Processing ${index + 1}/${resourcesToRename.length}: ${resource.title} (${resource.id})`);
        
        // Use cover_image_url for videos, resource_url for images
        const imageUrl = resourceType === 'video' ? resource.cover_image_url : resource.resource_url;
        
        if (!imageUrl) {
          console.log(`Skipping ${resource.id} - no image URL`);
          results.skipped++;
          continue;
        }
        
        const newTitle = await generateTitleFromImage(imageUrl, lovableApiKey);
        
        console.log(`Generated title: "${newTitle}" for "${resource.title}"`);

        results.previews.push({
          id: resource.id,
          oldTitle: resource.title || '(no title)',
          newTitle,
        });

        if (!previewOnly) {
          const { error: updateError } = await supabase
            .from('content_vault_resources')
            .update({ title: newTitle })
            .eq('id', resource.id);

          if (updateError) {
            console.error(`Update error for ${resource.id}:`, updateError);
            results.failed++;
            results.errors.push(`Failed to update ${resource.title}: ${updateError.message}`);
          } else {
            results.renamed++;
          }
        } else {
          results.renamed++;
        }

        // Delay to avoid rate limiting (500ms between requests)
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log(`Progress: ${index + 1}/${resourcesToRename.length} - ${results.renamed} renamed, ${results.failed} failed`);

      } catch (error) {
        console.error(`Error processing ${resource.id}:`, error);
        results.failed++;
        results.errors.push(`Failed to process ${resource.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue to next resource instead of stopping
      }
    }

    const scanned = resources?.length || 0;
    const response = {
      ...results,
      scanned,
      nextOffset: offset + scanned,
    };

    console.log(`Rename complete: scanned=${scanned}, renamed=${results.renamed}, skipped=${results.skipped}, nextOffset=${offset + scanned}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Rename error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

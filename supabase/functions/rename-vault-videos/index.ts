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

async function generateTitleFromImage(imageUrl: string, apiKey: string): Promise<string> {
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

    const { previewOnly = false, batchSize = 20 } = await req.json();

    console.log(`Starting AI rename: previewOnly=${previewOnly}, batchSize=${batchSize}`);

    // Query videos with thumbnails
    const { data: videos, error: queryError } = await supabase
      .from('content_vault_resources')
      .select('id, title, cover_image_url, file_type')
      .eq('file_type', 'video')
      .not('cover_image_url', 'is', null)
      .limit(batchSize);

    if (queryError) {
      console.error("Query error:", queryError);
      throw queryError;
    }

    console.log(`Found ${videos?.length || 0} videos to check`);

    // Filter to only videos needing rename
    const videosToRename = (videos || []).filter(v => needsRenaming(v.title || ''));
    
    console.log(`${videosToRename.length} videos need renaming`);

    const results = {
      renamed: 0,
      skipped: (videos?.length || 0) - videosToRename.length,
      failed: 0,
      previews: [] as { id: string; oldTitle: string; newTitle: string }[],
      errors: [] as string[],
    };

    for (const video of videosToRename) {
      try {
        console.log(`Processing: ${video.title} (${video.id})`);
        
        const newTitle = await generateTitleFromImage(video.cover_image_url, lovableApiKey);
        
        console.log(`Generated title: "${newTitle}" for "${video.title}"`);

        results.previews.push({
          id: video.id,
          oldTitle: video.title || '(no title)',
          newTitle,
        });

        if (!previewOnly) {
          const { error: updateError } = await supabase
            .from('content_vault_resources')
            .update({ title: newTitle })
            .eq('id', video.id);

          if (updateError) {
            console.error(`Update error for ${video.id}:`, updateError);
            results.failed++;
            results.errors.push(`Failed to update ${video.title}: ${updateError.message}`);
          } else {
            results.renamed++;
          }
        } else {
          results.renamed++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`Error processing ${video.id}:`, error);
        results.failed++;
        results.errors.push(`Failed to process ${video.title}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`Rename complete: ${JSON.stringify(results)}`);

    return new Response(JSON.stringify(results), {
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

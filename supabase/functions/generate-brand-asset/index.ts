import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssetDefinition {
  id: string;
  platform: string;
  name: string;
  width: number;
  height: number;
  type: string;
}

interface BrandSettings {
  id: string;
  brand_name: string;
  tagline: string;
  subtext: string | null;
  primary_color: string;
  secondary_color: string;
  neutral_color: string;
  header_font: string;
  body_font: string;
  logo_url: string | null;
  icon_url: string | null;
  highlight_label?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { asset, brandSettings } = await req.json() as {
      asset: AssetDefinition;
      brandSettings: BrandSettings;
    };

    console.log(`Generating ${asset.name} for ${asset.platform} (${asset.width}x${asset.height})`);

    // Build the prompt based on asset type
    let prompt = buildPrompt(asset, brandSettings);
    
    console.log("Generated prompt:", prompt);

    // Call Lovable AI Gateway for image generation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image in AI response:", aiData);
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 data
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const filePath = `brand-kit/generated/${asset.id}-${Date.now()}.png`;

    const { error: uploadError } = await supabaseService.storage
      .from("brand-assets")
      .upload(filePath, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseService.storage
      .from("brand-assets")
      .getPublicUrl(filePath);

    // Save to database
    const { error: dbError } = await supabaseService
      .from("brand_kit_assets")
      .insert({
        asset_type: asset.type,
        platform: asset.platform,
        asset_name: asset.name,
        width: asset.width,
        height: asset.height,
        file_url: publicUrl,
        file_path: filePath,
        brand_settings_version: brandSettings.id,
        created_by: user.id,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save asset metadata" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully generated and saved ${asset.name}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl,
        asset: asset.name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unexpected error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildPrompt(asset: AssetDefinition, brandSettings: BrandSettings): string {
  const { brand_name, tagline, subtext, primary_color, secondary_color, neutral_color } = brandSettings;
  
  // Base style description
  const styleDesc = `
Design style: Modern, minimal, calm SaaS aesthetic. Clean lines, generous whitespace, sophisticated.
Brand colors: Primary ${primary_color} (dark), Secondary ${secondary_color} (teal/mint accent), Neutral ${neutral_color} (light background).
Typography: Clean sans-serif font like Inter or Plus Jakarta Sans.
Avoid: Loud patterns, heavy gradients, excessive text, marketing urgency, cluttered layouts.
  `.trim();

  // Asset-specific prompts
  switch (asset.type) {
    case "icon":
      return `
Generate a ${asset.width}x${asset.height} PNG profile image/icon for ${asset.platform}.

Create a simple, memorable brand mark for "${brand_name}".
- Use the letter "${brand_name.charAt(0)}" as the main element
- Background: ${primary_color} (dark)
- Letter/icon: white or ${secondary_color} accent
- Centered, with balanced padding
- Professional, tech-forward look
- No text other than the single letter

${styleDesc}

Output: A clean, professional social media profile icon at ${asset.width}x${asset.height} pixels.
      `.trim();

    case "banner":
      return `
Generate a ${asset.width}x${asset.height} PNG banner/header image for ${asset.platform}.

Brand: "${brand_name}"
Tagline: "${tagline}"
${subtext ? `Subtext: "${subtext}"` : ""}

Design requirements:
- Horizontal composition optimized for ${asset.width}x${asset.height}
- Brand name prominently displayed on the left or center
- Tagline as supporting text (smaller)
- Background: subtle gradient from ${primary_color} to a slightly lighter shade, or use ${neutral_color}
- Accent elements in ${secondary_color}
- Minimalist decorative elements (subtle geometric shapes, soft lines)
- Leave safe zones at edges for platform cropping

${styleDesc}

Output: A professional social media banner at ${asset.width}x${asset.height} pixels.
      `.trim();

    case "highlight":
      return `
Generate a ${asset.width}x${asset.height} PNG Instagram highlight cover.

Label: "${brandSettings.highlight_label}"

Design requirements:
- Simple icon representing the concept "${brandSettings.highlight_label}"
- Centered icon with the label text below it
- Background: ${neutral_color} or soft gradient
- Icon color: ${secondary_color} or ${primary_color}
- Text: Simple, clean, readable at small sizes
- Circular-safe design (content centered for circular crop)
- Minimal and elegant

${styleDesc}

Output: An Instagram highlight cover at ${asset.width}x${asset.height} pixels.
      `.trim();

    case "template":
      if (asset.id.includes("carousel")) {
        return `
Generate a ${asset.width}x${asset.height} PNG carousel slide template for ${asset.platform}.

Brand: "${brand_name}"

Design requirements:
- Template layout for educational/value content
- Large title area at top
- Content area in middle for bullet points or key message
- Brand mark/logo space at bottom
- Color scheme: ${neutral_color} background, ${primary_color} text, ${secondary_color} accents
- Clear visual hierarchy
- Placeholder style (show layout structure)

${styleDesc}

Output: A carousel template at ${asset.width}x${asset.height} pixels.
        `.trim();
      } else if (asset.id.includes("reel") || asset.id.includes("tiktok")) {
        return `
Generate a ${asset.width}x${asset.height} PNG video cover/thumbnail template for ${asset.platform}.

Brand: "${brand_name}"
Tagline: "${tagline}"

Design requirements:
- Vertical format optimized for video content
- Central focus area for video preview
- Brand watermark/logo in corner
- Optional title overlay area
- Background: ${neutral_color} with subtle texture or ${primary_color} gradient
- Accent: ${secondary_color}
- Clean and uncluttered

${styleDesc}

Output: A video cover template at ${asset.width}x${asset.height} pixels.
        `.trim();
      } else if (asset.id.includes("pin")) {
        return `
Generate a ${asset.width}x${asset.height} PNG Pinterest pin template.

Brand: "${brand_name}"
Tagline: "${tagline}"

Design requirements:
- Vertical Pinterest-optimized layout
- Large image/visual area at top
- Title text area
- Brand logo at bottom
- Color scheme: ${neutral_color} background, ${primary_color} text, ${secondary_color} accents
- Eye-catching but not overwhelming
- Save-worthy aesthetic

${styleDesc}

Output: A Pinterest pin template at ${asset.width}x${asset.height} pixels.
        `.trim();
      }
      break;
  }

  // Default fallback
  return `
Generate a ${asset.width}x${asset.height} PNG brand asset for ${asset.platform}.

Brand: "${brand_name}"
Tagline: "${tagline}"

${styleDesc}

Output: A professional brand asset at ${asset.width}x${asset.height} pixels.
  `.trim();
}

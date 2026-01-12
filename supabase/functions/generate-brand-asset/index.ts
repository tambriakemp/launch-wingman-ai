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
    console.log("Brand settings:", JSON.stringify(brandSettings, null, 2));

    // Build the prompt based on asset type
    let prompt = buildPrompt(asset, brandSettings);
    
    console.log("Generated prompt:", prompt);

    // Build the message content - include logo/icon image if available for visual reference
    const messageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: prompt }
    ];

    // Add the icon/logo image as visual reference if available
    const referenceImageUrl = brandSettings.icon_url || brandSettings.logo_url;
    if (referenceImageUrl) {
      console.log("Including brand reference image:", referenceImageUrl);
      messageContent.push({
        type: "image_url",
        image_url: { url: referenceImageUrl }
      });
    }

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
            content: messageContent,
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
  const { brand_name, tagline, subtext, primary_color, secondary_color, neutral_color, header_font, body_font, logo_url, icon_url } = brandSettings;
  
  // Reference the attached image if available
  const hasReferenceImage = icon_url || logo_url;
  const referenceNote = hasReferenceImage 
    ? `\nIMPORTANT: Use the attached brand logo/icon image as the EXACT logo to use in the generated asset. Match its style, shape, and colors precisely. Do NOT create a different icon.`
    : '';
  
  // Brand identity description - used to guide AI generation
  const brandIdentity = `
BRAND IDENTITY for "${brand_name}":
${hasReferenceImage ? '- Logo/Icon: USE THE ATTACHED IMAGE as the exact logo/icon. Reproduce it faithfully in the generated asset.' : '- Logo/Icon: A growth/seedling icon - a stylized plant sprout with two leaves emerging from a stem.'}
- Primary Color: ${primary_color} (use for backgrounds and main elements)
- Secondary/Accent Color: ${secondary_color} (use for the icon, highlights, and accents)  
- Neutral Color: ${neutral_color} (use sparingly for tertiary accents)
- Typography: ${header_font} for headers, ${body_font} for body - clean, modern sans-serif
- Aesthetic: Calm, professional, minimal, SaaS-like. Clean lines, generous whitespace, sophisticated.
- Mood: Supportive, growth-oriented, not aggressive or salesy.
${referenceNote}
  `.trim();

  // Base style guidelines
  const styleGuidelines = `
STYLE GUIDELINES:
- Modern, minimal design with clean lines
- Generous whitespace, not cluttered
- Professional and sophisticated
${hasReferenceImage ? '- CRITICAL: Use the exact logo/icon from the attached reference image - do NOT create a new or different logo' : '- The seedling/growth icon is the brand mark - always use it, never just a letter'}
- Avoid: Loud patterns, heavy gradients, excessive text, marketing urgency
  `.trim();

  // Asset-specific prompts
  switch (asset.type) {
    case "icon":
      return `
Generate a ${asset.width}x${asset.height} pixel PNG profile picture/icon for ${asset.platform}.

${brandIdentity}

SPECIFIC REQUIREMENTS for this icon:
- Square format, will be displayed as circular on most platforms
${hasReferenceImage ? '- Use the EXACT logo/icon from the attached reference image as the main element' : '- Feature the seedling/growth icon (stylized plant sprout with two leaves) as the main element'}
- Background: ${primary_color} (dark background)
- Icon: ${secondary_color} (teal/accent color) for the logo/icon
- The icon should be centered with balanced padding
- Simple, clean, recognizable at small sizes
- NO text, NO letters - just the logo/icon mark
- Modern, tech-forward, professional look

${styleGuidelines}

Output exactly ${asset.width}x${asset.height} pixels.
      `.trim();

    case "banner":
      return `
Generate a ${asset.width}x${asset.height} pixel PNG banner/header image for ${asset.platform}.

${brandIdentity}

SPECIFIC REQUIREMENTS for this banner:
- Horizontal composition for ${asset.width}x${asset.height}
${hasReferenceImage ? '- Left side: Use the EXACT logo/icon from the attached reference image (small, as brand mark)' : '- Left side: The seedling/growth icon (small, as brand mark)'}
- Brand name "${brand_name}" displayed prominently
- Tagline: "${tagline}" as supporting text
${subtext ? `- Subtext: "${subtext}"` : ""}
- Background: ${primary_color} (dark) with subtle gradient or texture
- Text and icon in white or ${secondary_color} (teal)
- Minimal decorative elements - maybe subtle geometric lines or shapes
- Leave safe margins at edges for platform cropping
- Clean, professional, SaaS aesthetic

${styleGuidelines}

Output exactly ${asset.width}x${asset.height} pixels.
      `.trim();

    case "highlight":
      return `
Generate a ${asset.width}x${asset.height} pixel PNG Instagram Story Highlight cover.

${brandIdentity}

SPECIFIC REQUIREMENTS for this highlight cover:
- Highlight Label: "${brandSettings.highlight_label}"
- Create a simple, minimal icon that represents "${brandSettings.highlight_label}"
- Background: ${primary_color} (dark charcoal) 
- Icon: ${secondary_color} (teal/mint) - simple line icon style
- The icon should be centered (circular-safe for Instagram's circular crop)
- Text label "${brandSettings.highlight_label}" below the icon in white
- Very minimal, clean, elegant
- Should match the brand's seedling icon style (simple, geometric, modern)

${styleGuidelines}

Output exactly ${asset.width}x${asset.height} pixels.
      `.trim();

    case "template":
      if (asset.id.includes("carousel")) {
        return `
Generate a ${asset.width}x${asset.height} pixel PNG carousel slide template for ${asset.platform}.

${brandIdentity}

SPECIFIC REQUIREMENTS for this carousel template:
- Layout structure for educational content
- Top: Title area with placeholder text "[Title Here]"
- Middle: Content area for bullet points or key message
${hasReferenceImage ? '- Bottom: Use the EXACT logo/icon from the attached reference image as brand mark' : '- Bottom: Small seedling icon as brand mark'}
- Background: ${neutral_color} (light/cream) or white
- Text: ${primary_color} (dark)
- Accents: ${secondary_color} (teal) for highlights, lines, bullets
- Clean visual hierarchy
- Template-style with placeholder areas

${styleGuidelines}

Output exactly ${asset.width}x${asset.height} pixels.
        `.trim();
      } else if (asset.id.includes("reel") || asset.id.includes("tiktok")) {
        return `
Generate a ${asset.width}x${asset.height} pixel PNG video cover/thumbnail template for ${asset.platform}.

${brandIdentity}

SPECIFIC REQUIREMENTS for this video template:
- Vertical video format
- Central area for video preview/content
${hasReferenceImage ? '- Use the EXACT logo/icon from the attached reference image as watermark in corner' : '- Small seedling brand icon watermark in corner'}
- Optional title overlay area
- Background: ${primary_color} (dark) or ${neutral_color} (light)
- Accent elements: ${secondary_color} (teal)
- Clean, minimal, uncluttered
- Professional video thumbnail aesthetic

${styleGuidelines}

Output exactly ${asset.width}x${asset.height} pixels.
        `.trim();
      } else if (asset.id.includes("pin")) {
        return `
Generate a ${asset.width}x${asset.height} pixel PNG Pinterest pin template.

${brandIdentity}

SPECIFIC REQUIREMENTS for this Pinterest template:
- Vertical Pinterest-optimized layout (2:3 ratio)
- Large image/visual area at top (2/3 of height)
- Title text area below
${hasReferenceImage ? '- Use the EXACT logo/icon from the attached reference image at bottom' : '- Small seedling brand icon at bottom'}
- Background: ${neutral_color} (light) for readability
- Text: ${primary_color} (dark)
- Accents: ${secondary_color} (teal)
- Eye-catching but elegant, save-worthy

${styleGuidelines}

Output exactly ${asset.width}x${asset.height} pixels.
        `.trim();
      }
      break;
  }

  // Default fallback
  return `
Generate a ${asset.width}x${asset.height} pixel PNG brand asset for ${asset.platform}.

${brandIdentity}

SPECIFIC REQUIREMENTS:
${hasReferenceImage ? '- Use the EXACT logo/icon from the attached reference image' : '- Professional brand asset featuring the seedling/growth icon'}
- Brand name: "${brand_name}"
- Tagline: "${tagline}"
- Use the brand colors and maintain the minimal, modern aesthetic

${styleGuidelines}

Output exactly ${asset.width}x${asset.height} pixels.
  `.trim();
}

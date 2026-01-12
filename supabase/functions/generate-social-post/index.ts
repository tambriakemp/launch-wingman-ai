import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Brand style guidelines extracted from uploaded templates
const STYLE_GUIDELINES = {
  colors: {
    background: "#1a1918",
    headline: "#FFFFFF",
    accent: "#f5c243",
    cardBg: "#FFFFFF",
    mutedText: "#9ca3af",
    handleText: "#9ca3af"
  },
  elements: {
    asterisk: "Gold/amber decorative asterisk (*) in corners",
    pillButtons: "Rounded pill-shaped buttons with white background and dark text",
    emphasisCircle: "Circle highlight around one key word in gold/amber",
    brandMark: "Small Launchely seedling icon in bottom corner",
    navigationHints: "Slide indicators like '01', '02' or 'next page' text",
    handle: "@launchely.co in muted gray"
  },
  typography: {
    headline: "Plus Jakarta Sans Extra Bold, very large, commanding",
    body: "Plus Jakarta Sans Regular, medium size",
    handle: "Plus Jakarta Sans, small, muted"
  }
};

// Template-specific layout descriptions
const TEMPLATE_LAYOUTS = {
  cover: `
    LAYOUT: Cover/Hook Slide
    - Dark charcoal background (#1a1918)
    - Top left corner: Small gold asterisk decoration
    - Center of slide: Bold white headline text (4-7 words)
    - One key word in the headline has a gold/amber circle around it
    - Below headline: Gray subtext (1-2 lines, smaller font)
    - Bottom center: White pill-shaped button with dark text (swipe CTA)
    - Bottom left corner: Small brand seedling icon
    - Bottom right corner: @launchely.co handle in muted gray
  `,
  content: `
    LAYOUT: Content Slide
    - Dark charcoal background (#1a1918)
    - Top right: Slide number indicator (01, 02, etc.) in muted text
    - Center: Large bold white headline
    - Below headline: Supporting paragraph in lighter gray text
    - Optional: 2-3 white pill elements with icons for key points
    - Bottom right: @launchely.co handle
    - Clean, generous whitespace
  `,
  cta: `
    LAYOUT: CTA/Closing Slide
    - Dark charcoal background (#1a1918)
    - Top left and right: Small header text elements
    - Center: Large white rounded rectangle card (main focus)
    - Inside card: Bold dark headline, description text
    - Inside card: Search/input style element with CTA button
    - Bottom left: Gold asterisk decoration
    - Bottom right: Small brand icon
  `,
  problem: `
    LAYOUT: Problem/Why Slide
    - Dark charcoal background (#1a1918)
    - Top left: Bold white headline (the problem statement)
    - Below headline: Gray subtext explaining the issue
    - Center: 3 white circles arranged horizontally with dark icons inside
    - Below each circle: Short text label explaining that pain point
    - Circles connected with subtle lines
    - Bottom right: @launchely.co handle
  `,
  tutorial: `
    LAYOUT: How-To/Tutorial Slide
    - Dark charcoal background (#1a1918)
    - Top right: @launchely.co handle
    - Top left: Bold white headline (the how-to topic)
    - Below headline: Brief gray subtext
    - Right side: Mockup/diagram/visual illustration
    - Left side: Gold annotation dots connecting to explanation labels
    - Annotations show step-by-step breakdown
  `,
  comparison: `
    LAYOUT: Before/After Comparison Slide
    - Dark charcoal background (#1a1918)
    - Top right: @launchely.co handle
    - Top left: Bold white headline
    - Row showing: "Before" label | arrow icon | "After" label
    - Two comparison rows below showing old vs new state
    - Old state: crossed out or muted styling
    - New state: highlighted with gold accent buttons
    - Clean visual separation between before and after
  `,
  checklist: `
    LAYOUT: Tips/Checklist Grid Slide
    - Dark charcoal background (#1a1918)
    - Top left: Bold white headline (the topic)
    - Below headline: Gray subtext
    - 3 white rounded rectangle cards arranged in a row
    - Each card contains: Dark circular checkmark icon at top
    - Below icon: Tip text in dark color
    - Cards have subtle shadow for depth
    - Bottom right: @launchely.co handle
  `
};

interface GenerateRequest {
  topic: string;
  platform: string;
  templateType: string;
  templateId?: string;
  carouselSlides?: number;
  previewOnly?: boolean;
  customContent?: {
    headline?: string;
    subheadline?: string;
    bullets?: string[];
    cta?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { topic, platform, templateType, templateId, carouselSlides, previewOnly, customContent }: GenerateRequest = await req.json();

    console.log('Generating social post:', { topic, platform, templateType, carouselSlides, previewOnly });

    // Fetch brand settings
    const { data: brandSettings, error: brandError } = await supabase
      .from('brand_kit_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (brandError && brandError.code !== 'PGRST116') {
      console.error('Error fetching brand settings:', brandError);
    }

    // Fetch template if provided
    let templateLayout = TEMPLATE_LAYOUTS[templateType as keyof typeof TEMPLATE_LAYOUTS] || TEMPLATE_LAYOUTS.content;
    
    if (templateId) {
      const { data: template } = await supabase
        .from('post_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (template) {
        templateLayout = template.layout_description;
      }
    }

    const slidesToGenerate = carouselSlides || 1;
    const generatedSlides: Array<{
      slideNumber: number;
      content: { headline?: string; subheadline?: string; bullets?: string[]; cta?: string };
      imageUrl: string;
      filePath: string;
    }> = [];

    // Preview-only mode: just generate content for all slides without images
    if (previewOnly) {
      const previewContent: { headline?: string; subheadline?: string; bullets?: string[]; cta?: string } = {};
      
      const slideType = templateType;
      const contentPrompt = buildContentPrompt(topic, platform, slideType, 1, 1, brandSettings);
      
      console.log('Generating content preview with Lovable AI');
      
      const contentResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a social media content writer for Launchely, a calm and supportive brand that helps creators launch digital products. Write concise, impactful content. Never be salesy or use urgency tactics. Be encouraging and helpful. Always respond with valid JSON only.' },
            { role: 'user', content: contentPrompt }
          ],
          max_tokens: 500,
        }),
      });

      if (!contentResponse.ok) {
        const errorText = await contentResponse.text();
        console.error('Content preview error:', errorText);
        throw new Error('Failed to generate content preview');
      }

      const contentData = await contentResponse.json();
      const contentText = contentData.choices?.[0]?.message?.content || '';
      
      // Parse JSON from response
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      const parsedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      
      console.log('Generated preview content:', parsedContent);
      
      return new Response(
        JSON.stringify({ content: parsedContent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate content and images for each slide
    for (let slideNum = 1; slideNum <= slidesToGenerate; slideNum++) {
      console.log(`Generating slide ${slideNum} of ${slidesToGenerate}`);
      
      // Step 1: Generate text content using Lovable AI
      let slideContent = customContent;
      
      if (!customContent || slideNum > 1) {
        const slideType = slidesToGenerate === 1 ? templateType : 
          slideNum === 1 ? 'cover' : 
          slideNum === slidesToGenerate ? 'cta' : 'content';
        
        const contentPrompt = buildContentPrompt(topic, platform, slideType, slideNum, slidesToGenerate, brandSettings);
        
        console.log('Generating content with Lovable AI');
        
        const contentResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a social media content writer for Launchely, a calm and supportive brand that helps creators launch digital products. Write concise, impactful content. Never be salesy or use urgency tactics. Be encouraging and helpful. Always respond with valid JSON only.' },
              { role: 'user', content: contentPrompt }
            ],
            max_tokens: 500,
          }),
        });

        if (!contentResponse.ok) {
          const errorText = await contentResponse.text();
          console.error('Content generation error:', errorText);
          throw new Error('Failed to generate content');
        }

        const contentData = await contentResponse.json();
        const contentText = contentData.choices?.[0]?.message?.content || '';
        
        // Parse JSON from response
        const jsonMatch = contentText.match(/\{[\s\S]*\}/);
        slideContent = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        console.log('Generated content:', slideContent);
      }

      // Step 2: Generate image using Gemini
      const slideTypeForImage = slidesToGenerate === 1 ? templateType : 
        slideNum === 1 ? 'cover' : 
        slideNum === slidesToGenerate ? 'cta' : 'content';
      
      const contentForImage = { headline: slideContent?.headline || '', subheadline: slideContent?.subheadline, bullets: slideContent?.bullets, cta: slideContent?.cta };
      const imagePrompt = buildImagePrompt(contentForImage, slideTypeForImage, platform, brandSettings);
      
      console.log('Generating image with Gemini');
      
      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [{ role: 'user', content: imagePrompt }],
          modalities: ['image', 'text']
        }),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('Gemini image error:', errorText);
        throw new Error('Failed to generate image');
      }

      const imageData = await imageResponse.json();
      const imageBase64 = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (!imageBase64) {
        console.error('No image in response:', imageData);
        throw new Error('No image generated');
      }

      // Step 3: Upload to storage
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const timestamp = Date.now();
      const fileName = `post_${templateType}_${slideNum}_${timestamp}.png`;
      const filePath = `social-posts/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);

      generatedSlides.push({
        slideNumber: slideNum,
        content: slideContent!,
        imageUrl: publicUrl,
        filePath
      });
    }

    // Save to generated_posts table
    const mainSlide = generatedSlides[0];
    const { data: savedPost, error: saveError } = await supabase
      .from('generated_posts')
      .insert({
        template_id: templateId || null,
        platform,
        topic,
        generated_content: mainSlide.content,
        file_url: mainSlide.imageUrl,
        file_path: mainSlide.filePath,
        carousel_slides: slidesToGenerate > 1 ? generatedSlides : null,
        created_by: user.id
      })
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      // Don't throw - we still generated the images
    }

    console.log('Successfully generated social post');

    return new Response(
      JSON.stringify({
        success: true,
        post: savedPost,
        slides: generatedSlides
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating social post:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function buildContentPrompt(
  topic: string, 
  platform: string, 
  slideType: string, 
  slideNum: number,
  totalSlides: number,
  brandSettings: any
): string {
  const brandName = brandSettings?.brand_name || 'Launchely';
  const tagline = brandSettings?.tagline || 'A calmer way to plan and launch digital products.';
  
  let slideContext = '';
  if (totalSlides > 1) {
    if (slideNum === 1) {
      slideContext = 'This is the HOOK/COVER slide. Create a compelling, curiosity-inducing headline that makes people want to swipe.';
    } else if (slideNum === totalSlides) {
      slideContext = 'This is the CLOSING/CTA slide. Summarize the value and include a clear call-to-action.';
    } else {
      slideContext = `This is content slide ${slideNum} of ${totalSlides}. Provide one clear, valuable point.`;
    }
  }

  return `Generate social media post content for ${brandName} about: "${topic}"

Platform: ${platform}
Slide type: ${slideType}
${slideContext}

Brand voice: Calm, supportive, growth-oriented. Never salesy or urgent. Tagline: "${tagline}"

Return ONLY valid JSON with this exact structure:
{
  "headline": "Bold 4-7 word headline",
  "subheadline": "Supporting explanation 10-20 words",
  "bullets": ["Point 1", "Point 2", "Point 3"],
  "cta": "Call to action text"
}

Note: bullets and cta are optional based on slide type.`;
}

function buildImagePrompt(
  content: { headline: string; subheadline?: string; bullets?: string[]; cta?: string },
  slideType: string,
  platform: string,
  brandSettings: any
): string {
  const layout = TEMPLATE_LAYOUTS[slideType as keyof typeof TEMPLATE_LAYOUTS] || TEMPLATE_LAYOUTS.content;
  const primaryColor = brandSettings?.primary_color || '#f5c243';
  const brandName = brandSettings?.brand_name || 'Launchely';
  
  // Build text content for the image
  let textContent = `HEADLINE: "${content.headline}"`;
  if (content.subheadline) {
    textContent += `\nSUBHEADLINE: "${content.subheadline}"`;
  }
  if (content.bullets && content.bullets.length > 0) {
    textContent += `\nBULLET POINTS: ${content.bullets.map(b => `"${b}"`).join(', ')}`;
  }
  if (content.cta) {
    textContent += `\nCTA BUTTON TEXT: "${content.cta}"`;
  }

  return `Create a professional social media post image for ${platform}.

${layout}

TEXT CONTENT TO INCLUDE:
${textContent}

DESIGN REQUIREMENTS:
- Exact dimensions: 1080x1350 pixels (4:5 aspect ratio for Instagram)
- Background color: Dark charcoal #1a1918
- Headline text: Pure white #FFFFFF, bold weight, large size
- Accent color: Gold/amber ${primaryColor} for circles, highlights, buttons
- Subtext: Muted gray #9ca3af
- Brand handle: @launchely.co in small muted gray text
- Typography: Clean sans-serif font similar to Plus Jakarta Sans

STYLE GUIDELINES:
${JSON.stringify(STYLE_GUIDELINES, null, 2)}

IMPORTANT:
- Make the headline the dominant visual element
- Use generous whitespace and clean spacing
- Include the decorative asterisk element in gold
- Add the brand seedling icon (simple growing plant symbol) in bottom corner
- Keep design minimal, modern, and professional
- NO gradients, patterns, or busy backgrounds
- Text must be crisp and highly readable`;
}
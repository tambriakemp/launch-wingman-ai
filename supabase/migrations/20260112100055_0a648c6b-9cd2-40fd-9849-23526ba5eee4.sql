-- Create post_templates table to store template definitions
CREATE TABLE public.post_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('cover', 'content', 'cta', 'problem', 'tutorial', 'comparison', 'checklist')),
  platform TEXT NOT NULL,
  dimensions JSONB NOT NULL DEFAULT '{"width": 1080, "height": 1350}',
  layout_description TEXT NOT NULL,
  style_elements JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create generated_posts table
CREATE TABLE public.generated_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.post_templates(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  topic TEXT NOT NULL,
  generated_content JSONB NOT NULL DEFAULT '{}',
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  carousel_slides JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.post_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;

-- Post templates are readable by authenticated users (admin-only write in practice)
CREATE POLICY "Anyone can read post templates"
  ON public.post_templates FOR SELECT
  USING (true);

-- Generated posts are user-specific
CREATE POLICY "Users can view their own posts"
  ON public.generated_posts FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own posts"
  ON public.generated_posts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own posts"
  ON public.generated_posts FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own posts"
  ON public.generated_posts FOR DELETE
  USING (auth.uid() = created_by);

-- Seed the 7 template types based on the user's uploaded examples
INSERT INTO public.post_templates (name, template_type, platform, dimensions, layout_description, style_elements) VALUES
  ('Cover/Hook Slide', 'cover', 'Instagram', '{"width": 1080, "height": 1350}', 
   'Top left: Gold asterisk accent. Center: Bold white headline (4-7 words, one word circled in gold). Below headline: Gray subtext (1-2 lines). Bottom: White pill button with swipe CTA. Bottom corners: Brand mark.',
   '{"hasAsterisk": true, "hasPillButton": true, "hasCircledWord": true}'),
  
  ('Content Slide', 'content', 'Instagram', '{"width": 1080, "height": 1350}',
   'Large centered headline in bold white. Supporting paragraph below in lighter text. Optional: White pill elements with icons and short labels. Navigation hint bottom right showing slide number.',
   '{"hasNavigation": true, "hasPills": true}'),
  
  ('CTA/Closing Slide', 'cta', 'Instagram', '{"width": 1080, "height": 1350}',
   'Top: Small header text left and right. Center: Large white rounded rectangle card containing bold headline, description text, and search/input style element with CTA button. Bottom corners: Asterisk and brand mark.',
   '{"hasCard": true, "hasAsterisk": true, "hasInputCTA": true}'),
  
  ('Problem/Why Slide', 'problem', 'Instagram', '{"width": 1080, "height": 1350}',
   'Bold headline top left. Subtext below headline. Center: 3 connected white circles with dark icons inside. Below each circle: Text label explaining each point. Social handle bottom right.',
   '{"hasThreeCircles": true, "hasHandle": true}'),
  
  ('How-To/Tutorial Slide', 'tutorial', 'Instagram', '{"width": 1080, "height": 1350}',
   'Handle top right. Bold headline top left. Subtext below. Right side: Mockup or diagram with annotations. Gold dots connecting diagram elements to explanation labels on left side.',
   '{"hasDiagram": true, "hasAnnotations": true, "hasHandle": true}'),
  
  ('Before/After Comparison', 'comparison', 'Instagram', '{"width": 1080, "height": 1350}',
   'Handle top right. Bold headline top left. Row with Before label, arrow, After label. Two comparison rows showing old vs new state. Gold accent pill buttons for key elements.',
   '{"hasComparison": true, "hasArrows": true, "hasPillButtons": true}'),
  
  ('Tips/Checklist Grid', 'checklist', 'Instagram', '{"width": 1080, "height": 1350}',
   'Bold headline top left. Subtext below. Three white rounded rectangle cards arranged horizontally. Each card has: Dark checkmark circle icon at top, tip text below. Handle bottom right.',
   '{"hasThreeCards": true, "hasCheckmarks": true, "hasHandle": true}');
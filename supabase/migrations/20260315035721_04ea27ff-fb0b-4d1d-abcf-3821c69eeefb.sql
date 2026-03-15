
CREATE TABLE IF NOT EXISTS public.linkinbio_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position int NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text DEFAULT NULL,
  badge_text text DEFAULT NULL,
  badge_color text DEFAULT '#1A1A1A',
  cta_text text NOT NULL DEFAULT 'Learn More →',
  cta_url text NOT NULL DEFAULT '#',
  price_original text DEFAULT NULL,
  price_current text DEFAULT NULL,
  price_note text DEFAULT NULL,
  card_type text NOT NULL DEFAULT 'link',
  highlight boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.linkinbio_cards ENABLE ROW LEVEL SECURITY;

-- Public read access (this is a public-facing page)
CREATE POLICY "Anyone can view visible linkinbio cards" ON public.linkinbio_cards
  FOR SELECT USING (is_visible = true);

-- Admin write access via has_role function
CREATE POLICY "Admins can manage linkinbio cards" ON public.linkinbio_cards
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default cards
INSERT INTO public.linkinbio_cards (position, title, description, image_url, badge_text, badge_color, cta_text, cta_url, card_type, highlight) VALUES
(0, 'Free AI Starter Kit', 'The exact tools, prompts, and step-by-step system to launch your first AI side hustle. Drop your email and I''ll send it straight to you.', 'https://picsum.photos/seed/starterkit/640/360', 'FREE', '#C9A96E', 'Send Me the Free Kit →', '#', 'email_capture', true),
(1, 'Launchely AI Community', 'Free ongoing support, accountability, and clarity while you build your AI brand — without the overwhelm. Join hundreds of creators building in public.', 'https://picsum.photos/seed/community/640/360', 'FREE', '#22C55E', 'Join Free →', 'https://www.skool.com', 'link', false),
(2, 'The AI Twin Formula', 'Build a faceless AI brand, create 30 days of content in one afternoon, and turn your story into income — without ever showing your face. 10 modules. Instant access.', 'https://picsum.photos/seed/aitwin/640/360', 'COURSE', '#1A1A1A', 'Get Instant Access →', 'https://launchely.com/ai-twin-formula', 'link', false),
(3, 'Launchely AI Studio', 'The AI content tool that creates full vlog videos of your AI twin in your own spaces. Used inside The AI Twin Formula. Start at just $7/month.', 'https://picsum.photos/seed/platform/640/360', 'TOOL', '#1A1A1A', 'Try Launchely →', 'https://launchely.com', 'link', false);

UPDATE public.linkinbio_cards SET price_original = '$57', price_current = '$37' WHERE title = 'The AI Twin Formula';
UPDATE public.linkinbio_cards SET price_note = 'Content Vault from $7/mo · Full Platform from $25/mo' WHERE title = 'Launchely AI Studio';

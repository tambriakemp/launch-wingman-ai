-- Create brand_kit_settings table for admin brand configuration
CREATE TABLE public.brand_kit_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL DEFAULT 'Launchely',
  tagline TEXT NOT NULL DEFAULT 'A calmer way to plan and launch digital products.',
  subtext TEXT DEFAULT 'Calm guidance. Clear next steps.',
  primary_color TEXT NOT NULL DEFAULT '#1a1a1a',
  secondary_color TEXT NOT NULL DEFAULT '#14b8a6',
  neutral_color TEXT NOT NULL DEFAULT '#f5f5f5',
  header_font TEXT NOT NULL DEFAULT 'Plus Jakarta Sans',
  body_font TEXT NOT NULL DEFAULT 'Plus Jakarta Sans',
  logo_url TEXT,
  icon_url TEXT,
  highlight_labels JSONB DEFAULT '["Start Here", "How It Works", "Launching", "Tech Clarity", "Templates", "Wins"]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create brand_kit_assets table for generated assets
CREATE TABLE public.brand_kit_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  brand_settings_version UUID REFERENCES public.brand_kit_settings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.brand_kit_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kit_assets ENABLE ROW LEVEL SECURITY;

-- RLS policies for brand_kit_settings (admin-only access)
CREATE POLICY "Admins can view brand kit settings"
  ON public.brand_kit_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can insert brand kit settings"
  ON public.brand_kit_settings FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can update brand kit settings"
  ON public.brand_kit_settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can delete brand kit settings"
  ON public.brand_kit_settings FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for brand_kit_assets (admin-only access)
CREATE POLICY "Admins can view brand kit assets"
  ON public.brand_kit_assets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can insert brand kit assets"
  ON public.brand_kit_assets FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins can delete brand kit assets"
  ON public.brand_kit_assets FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_brand_kit_settings_updated_at
  BEFORE UPDATE ON public.brand_kit_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default brand settings
INSERT INTO public.brand_kit_settings (
  brand_name,
  tagline,
  subtext,
  primary_color,
  secondary_color,
  neutral_color,
  header_font,
  body_font
) VALUES (
  'Launchely',
  'A calmer way to plan and launch digital products.',
  'Calm guidance. Clear next steps.',
  '#1a1a1a',
  '#14b8a6',
  '#f5f5f5',
  'Plus Jakarta Sans',
  'Plus Jakarta Sans'
);
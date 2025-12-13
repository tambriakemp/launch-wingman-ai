-- Create brand_logos table
CREATE TABLE public.brand_logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_colors table
CREATE TABLE public.brand_colors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  hex_color TEXT NOT NULL,
  name TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_fonts table
CREATE TABLE public.brand_fonts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  font_category TEXT NOT NULL,
  font_family TEXT NOT NULL,
  font_source TEXT NOT NULL DEFAULT 'google',
  custom_font_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, font_category)
);

-- Create brand_photos table
CREATE TABLE public.brand_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.brand_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for brand_logos
CREATE POLICY "Users can view their own brand logos" ON public.brand_logos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own brand logos" ON public.brand_logos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own brand logos" ON public.brand_logos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own brand logos" ON public.brand_logos FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for brand_colors
CREATE POLICY "Users can view their own brand colors" ON public.brand_colors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own brand colors" ON public.brand_colors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own brand colors" ON public.brand_colors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own brand colors" ON public.brand_colors FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for brand_fonts
CREATE POLICY "Users can view their own brand fonts" ON public.brand_fonts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own brand fonts" ON public.brand_fonts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own brand fonts" ON public.brand_fonts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own brand fonts" ON public.brand_fonts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for brand_photos
CREATE POLICY "Users can view their own brand photos" ON public.brand_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own brand photos" ON public.brand_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own brand photos" ON public.brand_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own brand photos" ON public.brand_photos FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for brand assets
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true);

-- Storage policies for brand-assets bucket
CREATE POLICY "Users can view their own brand assets" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own brand assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own brand assets" ON storage.objects FOR UPDATE USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own brand assets" ON storage.objects FOR DELETE USING (bucket_id = 'brand-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create external_assets table
CREATE TABLE public.external_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_assets ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required)
CREATE POLICY "Anyone can view external assets"
  ON public.external_assets
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Admin-only write
CREATE POLICY "Admins can insert external assets"
  ON public.external_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete external assets"
  ON public.external_assets
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for brand-assets bucket external/ path
CREATE POLICY "Admins can upload external assets to storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'brand-assets' 
    AND (storage.foldername(name))[1] = 'external'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete external assets from storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'brand-assets' 
    AND (storage.foldername(name))[1] = 'external'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Anyone can read external assets from storage"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'brand-assets' 
    AND (storage.foldername(name))[1] = 'external'
  );

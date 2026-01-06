-- Create storage bucket for admin documentation screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-docs', 'admin-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload doc screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'admin-docs' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Allow authenticated admins to update
CREATE POLICY "Admins can update doc screenshots"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'admin-docs' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Allow authenticated admins to delete
CREATE POLICY "Admins can delete doc screenshots"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'admin-docs' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Allow public read access for screenshots
CREATE POLICY "Public can view doc screenshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'admin-docs');
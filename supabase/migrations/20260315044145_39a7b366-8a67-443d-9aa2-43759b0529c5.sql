-- Add SELECT policy so admins can read linkinbio assets (needed for upsert)
CREATE POLICY "Admins can read linkinbio assets"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] = 'linkinbio'
  AND public.has_role(auth.uid(), 'admin')
);

-- Also add public read access for linkinbio assets so they display on the public page
CREATE POLICY "Public can view linkinbio assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] = 'linkinbio'
);
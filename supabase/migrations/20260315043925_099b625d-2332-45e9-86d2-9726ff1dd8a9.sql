-- Allow admins to upload/manage files in the brand-assets bucket under linkinbio/ path
CREATE POLICY "Admins can upload linkinbio assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] = 'linkinbio'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update linkinbio assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] = 'linkinbio'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete linkinbio assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] = 'linkinbio'
  AND public.has_role(auth.uid(), 'admin')
);
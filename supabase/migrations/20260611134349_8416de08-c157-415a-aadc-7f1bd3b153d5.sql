
-- Tighten AI studio upload policy: enforce ownership via path
DROP POLICY IF EXISTS "Authenticated users can upload AI studio assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload AI studio assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ai-studio'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- Tighten content-media upload policy: enforce ownership via path
DROP POLICY IF EXISTS "Authenticated users can upload to content-media" ON storage.objects;
CREATE POLICY "Authenticated users can upload to content-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'content-media'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow users to read their own role rows (admins already covered)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

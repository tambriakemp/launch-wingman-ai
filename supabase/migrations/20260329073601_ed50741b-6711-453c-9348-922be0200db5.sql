DROP POLICY "Users can update their own AI studio assets" ON storage.objects;
CREATE POLICY "Users can update their own AI studio assets"
ON storage.objects FOR UPDATE TO public
USING (bucket_id = 'ai-studio' AND (auth.uid())::text = (storage.foldername(name))[2]);

DROP POLICY "Users can delete their own AI studio assets" ON storage.objects;
CREATE POLICY "Users can delete their own AI studio assets"
ON storage.objects FOR DELETE TO public
USING (bucket_id = 'ai-studio' AND (auth.uid())::text = (storage.foldername(name))[2]);
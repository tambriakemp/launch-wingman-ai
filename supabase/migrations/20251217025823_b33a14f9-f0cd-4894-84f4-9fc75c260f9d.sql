-- Fix overly permissive storage policies on brand-assets bucket
-- Drop the current permissive policies that allow any authenticated user

DROP POLICY IF EXISTS "Users can upload brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete brand assets" ON storage.objects;

-- Also drop old policies if they exist
DROP POLICY IF EXISTS "Users can upload their own brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own brand assets" ON storage.objects;

-- Create proper user-scoped policies that check folder ownership
-- Files must be stored as: {user_id}/{filename}

CREATE POLICY "Users can upload their own brand assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own brand assets"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own brand assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own brand assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'brand-assets' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
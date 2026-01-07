-- Create RLS policies for content-media bucket to allow uploads

-- Allow authenticated users to upload files to the content-media bucket
CREATE POLICY "Authenticated users can upload to content-media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-media');

-- Allow authenticated users to update their uploads in content-media
CREATE POLICY "Authenticated users can update content-media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'content-media');

-- Allow authenticated users to delete from content-media
CREATE POLICY "Authenticated users can delete from content-media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'content-media');

-- Allow public read access to content-media (bucket is already public)
CREATE POLICY "Public read access to content-media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'content-media');
-- Create storage policies for brand-assets bucket to allow authenticated users to upload fonts

-- Allow authenticated users to upload files to their own folder (using project_id in path)
CREATE POLICY "Users can upload brand assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'brand-assets');

-- Allow authenticated users to view their own brand assets
CREATE POLICY "Users can view brand assets"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'brand-assets');

-- Allow authenticated users to update their own brand assets
CREATE POLICY "Users can update brand assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'brand-assets');

-- Allow authenticated users to delete their own brand assets
CREATE POLICY "Users can delete brand assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'brand-assets');
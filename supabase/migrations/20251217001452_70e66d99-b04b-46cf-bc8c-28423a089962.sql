-- Add social media and media columns to content_planner table
ALTER TABLE content_planner ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE content_planner ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE content_planner ADD COLUMN IF NOT EXISTS scheduled_platforms text[] DEFAULT '{}';
ALTER TABLE content_planner ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- Create storage bucket for content media
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-media', 'content-media', true)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own content media
CREATE POLICY "Users can upload content media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'content-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own content media
CREATE POLICY "Users can update content media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'content-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own content media
CREATE POLICY "Users can delete content media"
ON storage.objects FOR DELETE
USING (bucket_id = 'content-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Content media is publicly accessible for previews
CREATE POLICY "Content media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-media');
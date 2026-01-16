-- Add publish_results column to content_planner table
-- This will store per-platform publishing results (success/failure with details)
ALTER TABLE public.content_planner 
ADD COLUMN IF NOT EXISTS publish_results JSONB DEFAULT NULL;

-- Add comment explaining the column structure
COMMENT ON COLUMN public.content_planner.publish_results IS 'Stores per-platform publishing results. Structure: {"platform": {"success": bool, "postId": string?, "url": string?, "error": string?, "errorCode": string?, "postedAt": string?}}';
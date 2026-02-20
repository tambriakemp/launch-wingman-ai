
-- Create table for saved base URLs
CREATE TABLE public.utm_base_urls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.utm_base_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own base urls" ON public.utm_base_urls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own base urls" ON public.utm_base_urls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own base urls" ON public.utm_base_urls FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own base urls" ON public.utm_base_urls FOR UPDATE USING (auth.uid() = user_id);

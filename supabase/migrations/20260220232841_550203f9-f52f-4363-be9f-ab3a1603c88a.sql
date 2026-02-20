
-- UTM Folders table
CREATE TABLE public.utm_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.utm_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own utm folders" ON public.utm_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own utm folders" ON public.utm_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own utm folders" ON public.utm_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own utm folders" ON public.utm_folders FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_utm_folders_updated_at BEFORE UPDATE ON public.utm_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- UTM Links table
CREATE TABLE public.utm_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES public.utm_folders(id) ON DELETE SET NULL,
  base_url TEXT NOT NULL,
  utm_source TEXT NOT NULL,
  utm_medium TEXT NOT NULL,
  utm_campaign TEXT NOT NULL,
  utm_term TEXT,
  utm_content TEXT,
  full_url TEXT NOT NULL,
  short_code TEXT NOT NULL,
  label TEXT NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.utm_links ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_utm_links_short_code ON public.utm_links(short_code);

CREATE POLICY "Users can view their own utm links" ON public.utm_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own utm links" ON public.utm_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own utm links" ON public.utm_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own utm links" ON public.utm_links FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_utm_links_updated_at BEFORE UPDATE ON public.utm_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- UTM Click Events table
CREATE TABLE public.utm_click_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  utm_link_id UUID NOT NULL REFERENCES public.utm_links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT
);

ALTER TABLE public.utm_click_events ENABLE ROW LEVEL SECURITY;

-- Users can read click events for their own links
CREATE POLICY "Users can view click events for their own links" ON public.utm_click_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.utm_links WHERE utm_links.id = utm_click_events.utm_link_id AND utm_links.user_id = auth.uid())
);

CREATE INDEX idx_utm_click_events_link_id ON public.utm_click_events(utm_link_id);

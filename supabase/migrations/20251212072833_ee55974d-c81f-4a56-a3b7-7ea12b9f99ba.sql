-- Create sales_page_copy table
CREATE TABLE public.sales_page_copy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  deliverable_id TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social_bios table
CREATE TABLE public.social_bios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  formula_id TEXT NOT NULL,
  bio_content TEXT NOT NULL,
  field_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.sales_page_copy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_bios ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_page_copy
CREATE POLICY "Users can view their own sales page copy"
ON public.sales_page_copy FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sales page copy"
ON public.sales_page_copy FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales page copy"
ON public.sales_page_copy FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales page copy"
ON public.sales_page_copy FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for social_bios
CREATE POLICY "Users can view their own social bios"
ON public.social_bios FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social bios"
ON public.social_bios FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social bios"
ON public.social_bios FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social bios"
ON public.social_bios FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_sales_page_copy_updated_at
BEFORE UPDATE ON public.sales_page_copy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_bios_updated_at
BEFORE UPDATE ON public.social_bios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraint: one sales page copy per deliverable per project
ALTER TABLE public.sales_page_copy
ADD CONSTRAINT unique_project_deliverable UNIQUE (project_id, deliverable_id);

-- Add unique constraint: one bio per platform per project
ALTER TABLE public.social_bios
ADD CONSTRAINT unique_project_platform UNIQUE (project_id, platform);
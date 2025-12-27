-- Create content vault categories table
CREATE TABLE public.content_vault_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content vault subcategories table
CREATE TABLE public.content_vault_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.content_vault_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Create content vault resources table
CREATE TABLE public.content_vault_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subcategory_id UUID NOT NULL REFERENCES public.content_vault_subcategories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  resource_type TEXT NOT NULL DEFAULT 'canva_link',
  resource_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}'::text[],
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.content_vault_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_vault_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_vault_resources ENABLE ROW LEVEL SECURITY;

-- Categories: All authenticated users can read
CREATE POLICY "Authenticated users can view categories"
ON public.content_vault_categories
FOR SELECT
TO authenticated
USING (true);

-- Categories: Only admins can insert
CREATE POLICY "Admins can insert categories"
ON public.content_vault_categories
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Categories: Only admins can update
CREATE POLICY "Admins can update categories"
ON public.content_vault_categories
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Categories: Only admins can delete
CREATE POLICY "Admins can delete categories"
ON public.content_vault_categories
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Subcategories: All authenticated users can read
CREATE POLICY "Authenticated users can view subcategories"
ON public.content_vault_subcategories
FOR SELECT
TO authenticated
USING (true);

-- Subcategories: Only admins can insert
CREATE POLICY "Admins can insert subcategories"
ON public.content_vault_subcategories
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Subcategories: Only admins can update
CREATE POLICY "Admins can update subcategories"
ON public.content_vault_subcategories
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Subcategories: Only admins can delete
CREATE POLICY "Admins can delete subcategories"
ON public.content_vault_subcategories
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Resources: All authenticated users can read
CREATE POLICY "Authenticated users can view resources"
ON public.content_vault_resources
FOR SELECT
TO authenticated
USING (true);

-- Resources: Only admins can insert
CREATE POLICY "Admins can insert resources"
ON public.content_vault_resources
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Resources: Only admins can update
CREATE POLICY "Admins can update resources"
ON public.content_vault_resources
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Resources: Only admins can delete
CREATE POLICY "Admins can delete resources"
ON public.content_vault_resources
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better query performance
CREATE INDEX idx_subcategories_category ON public.content_vault_subcategories(category_id);
CREATE INDEX idx_resources_subcategory ON public.content_vault_resources(subcategory_id);
CREATE INDEX idx_resources_tags ON public.content_vault_resources USING GIN(tags);
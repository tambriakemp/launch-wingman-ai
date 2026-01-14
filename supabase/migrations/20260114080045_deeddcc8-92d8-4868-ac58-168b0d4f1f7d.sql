-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.content_vault_categories;
DROP POLICY IF EXISTS "Authenticated users can view subcategories" ON public.content_vault_subcategories;
DROP POLICY IF EXISTS "Authenticated users can view resources" ON public.content_vault_resources;

-- Create new policies that actually check authentication
CREATE POLICY "Authenticated users can view categories" 
ON public.content_vault_categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view subcategories" 
ON public.content_vault_subcategories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view resources" 
ON public.content_vault_resources 
FOR SELECT 
USING (auth.uid() IS NOT NULL);
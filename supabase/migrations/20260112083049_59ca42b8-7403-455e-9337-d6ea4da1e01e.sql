-- Add Mobile and Desktop subcategories under Lightroom Presets
INSERT INTO public.content_vault_subcategories (category_id, name, slug, position)
SELECT id, 'Desktop Presets', 'desktop', 0
FROM public.content_vault_categories 
WHERE slug = 'lightroom-presets'
ON CONFLICT (category_id, slug) DO NOTHING;

INSERT INTO public.content_vault_subcategories (category_id, name, slug, position)
SELECT id, 'Mobile Presets', 'mobile', 1
FROM public.content_vault_categories 
WHERE slug = 'lightroom-presets'
ON CONFLICT (category_id, slug) DO NOTHING;
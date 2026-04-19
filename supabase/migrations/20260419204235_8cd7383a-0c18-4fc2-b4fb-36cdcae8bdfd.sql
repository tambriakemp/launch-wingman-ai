INSERT INTO public.content_vault_categories (slug, name, description, position)
VALUES ('luts', 'LUTs & Color Presets', 'Color grading LUTs for Premiere Pro, DaVinci Resolve, Final Cut, and more', 12)
ON CONFLICT (slug) DO NOTHING;
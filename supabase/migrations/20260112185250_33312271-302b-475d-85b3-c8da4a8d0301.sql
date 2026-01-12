-- Insert Business Documents category
INSERT INTO content_vault_categories (name, slug, description, position)
VALUES (
  'Business Documents',
  'business-documents',
  'Essential business templates, contracts, proposals, and professional documents.',
  9
);

-- Get the new category ID and insert subcategories
WITH new_category AS (
  SELECT id FROM content_vault_categories WHERE slug = 'business-documents'
)
INSERT INTO content_vault_subcategories (category_id, name, slug, position)
SELECT 
  new_category.id,
  subcats.name,
  subcats.slug,
  subcats.position
FROM new_category
CROSS JOIN (
  VALUES 
    ('Contracts & Agreements', 'contracts', 0),
    ('Proposals & Briefs', 'proposals', 1),
    ('Business Templates', 'templates', 2),
    ('Guides & Checklists', 'guides', 3)
) AS subcats(name, slug, position);
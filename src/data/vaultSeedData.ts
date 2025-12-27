/**
 * Content Vault Seed Data Structure
 * 
 * This file contains the structure for seeding the Content Vault database tables.
 * Use this as a template for adding new categories, subcategories, and resources.
 * 
 * To add content to the database, run SQL INSERT statements or use the admin interface.
 */

export interface VaultCategory {
  name: string;
  slug: string;
  description: string;
  cover_image_url: string;
  position: number;
}

export interface VaultSubcategory {
  category_slug: string; // References parent category by slug
  name: string;
  slug: string;
  position: number;
}

export interface VaultResource {
  subcategory_slug: string; // References parent subcategory by slug
  category_slug: string; // For lookup convenience
  title: string;
  description: string;
  cover_image_url: string;
  resource_type: 'canva_link' | 'download';
  resource_url: string;
  tags: string[];
  position: number;
}

// ============================================
// CATEGORIES
// ============================================
export const SEED_CATEGORIES: VaultCategory[] = [
  {
    name: "Social Media Posts",
    slug: "social-media-posts",
    description: "Ready-to-use templates for Instagram, Facebook, Pinterest, and more.",
    cover_image_url: "", // Add your cover image URL
    position: 0,
  },
  {
    name: "Ebooks",
    slug: "ebooks",
    description: "Lead magnets and digital products to grow your email list.",
    cover_image_url: "", // Add your cover image URL
    position: 1,
  },
  {
    name: "Planners",
    slug: "planners",
    description: "Printable planners, worksheets, and organizational tools.",
    cover_image_url: "", // Add your cover image URL
    position: 2,
  },
  {
    name: "Email Designs",
    slug: "email-designs",
    description: "Beautiful email templates for launches, newsletters, and sequences.",
    cover_image_url: "", // Add your cover image URL
    position: 3,
  },
];

// ============================================
// SUBCATEGORIES
// ============================================
export const SEED_SUBCATEGORIES: VaultSubcategory[] = [
  // Social Media Posts subcategories
  {
    category_slug: "social-media-posts",
    name: "Instagram Reels",
    slug: "reels",
    position: 0,
  },
  {
    category_slug: "social-media-posts",
    name: "Static Posts",
    slug: "posts",
    position: 1,
  },
  {
    category_slug: "social-media-posts",
    name: "Stories",
    slug: "stories",
    position: 2,
  },
  {
    category_slug: "social-media-posts",
    name: "Carousels",
    slug: "carousels",
    position: 3,
  },
  {
    category_slug: "social-media-posts",
    name: "Pinterest Pins",
    slug: "pinterest",
    position: 4,
  },
  // Ebooks subcategories
  {
    category_slug: "ebooks",
    name: "Lead Magnets",
    slug: "lead-magnets",
    position: 0,
  },
  {
    category_slug: "ebooks",
    name: "Mini Guides",
    slug: "mini-guides",
    position: 1,
  },
  // Planners subcategories
  {
    category_slug: "planners",
    name: "Daily Planners",
    slug: "daily",
    position: 0,
  },
  {
    category_slug: "planners",
    name: "Weekly Planners",
    slug: "weekly",
    position: 1,
  },
  {
    category_slug: "planners",
    name: "Goal Setting",
    slug: "goals",
    position: 2,
  },
  // Email Designs subcategories
  {
    category_slug: "email-designs",
    name: "Welcome Sequences",
    slug: "welcome",
    position: 0,
  },
  {
    category_slug: "email-designs",
    name: "Launch Emails",
    slug: "launch",
    position: 1,
  },
  {
    category_slug: "email-designs",
    name: "Newsletters",
    slug: "newsletters",
    position: 2,
  },
];

// ============================================
// RESOURCES
// ============================================
export const SEED_RESOURCES: VaultResource[] = [
  // Example resource - replace with your actual Canva links
  {
    category_slug: "social-media-posts",
    subcategory_slug: "posts",
    title: "Wellness Quote Templates",
    description: "Beautiful quote templates for wellness coaches and holistic practitioners.",
    cover_image_url: "", // Add your cover image URL
    resource_type: "canva_link",
    resource_url: "https://www.canva.com/design/DAGzF-Phnw4/w208YfYGlZjio93NiC2-bg/view?utm_content=DAGzF-Phnw4&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview",
    tags: ["wellness", "quotes", "coaching"],
    position: 0,
  },
  // Add more resources here following this structure
];

/**
 * SQL to insert categories:
 * 
 * INSERT INTO public.content_vault_categories (name, slug, description, cover_image_url, position)
 * VALUES 
 *   ('Social Media Posts', 'social-media-posts', 'Ready-to-use templates...', 'https://...', 0),
 *   ('Ebooks', 'ebooks', 'Lead magnets...', 'https://...', 1);
 * 
 * SQL to insert subcategories:
 * 
 * INSERT INTO public.content_vault_subcategories (category_id, name, slug, position)
 * SELECT c.id, 'Instagram Reels', 'reels', 0
 * FROM public.content_vault_categories c WHERE c.slug = 'social-media-posts';
 * 
 * SQL to insert resources:
 * 
 * INSERT INTO public.content_vault_resources (subcategory_id, title, description, cover_image_url, resource_type, resource_url, tags, position)
 * SELECT s.id, 'Wellness Quote Templates', 'Beautiful quote templates...', 'https://...', 'canva_link', 'https://canva.com/...', ARRAY['wellness', 'quotes'], 0
 * FROM public.content_vault_subcategories s 
 * JOIN public.content_vault_categories c ON s.category_id = c.id 
 * WHERE s.slug = 'posts' AND c.slug = 'social-media-posts';
 */

// AI-generated thumbnails for Content Vault categories
// These are used as fallbacks when no cover_image_url is set in the database

import socialMediaPosts from "@/assets/vault/social-media-posts.png";
import ebooks from "@/assets/vault/ebooks.png";
import planners from "@/assets/vault/planners.png";
import emailDesigns from "@/assets/vault/email-designs.png";
import photos from "@/assets/vault/photos.png";
import videos from "@/assets/vault/videos.png";
import lightroomPresets from "@/assets/vault/lightroom-presets.png";
import etsy from "@/assets/vault/etsy.png";
import fonts from "@/assets/vault/fonts.png";

export const VAULT_THUMBNAILS: Record<string, string> = {
  "social-media-posts": socialMediaPosts,
  "ebooks": ebooks,
  "planners": planners,
  "email-designs": emailDesigns,
  "photos": photos,
  "videos": videos,
  "lightroom-presets": lightroomPresets,
  "etsy": etsy,
  "fonts": fonts,
};

export const getVaultThumbnail = (slug: string): string | null => {
  return VAULT_THUMBNAILS[slug] || null;
};

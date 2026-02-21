export const CHANNELS = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "email", label: "Email", icon: "✉️" },
  { value: "skool", label: "Skool", icon: "🎓" },
  { value: "other", label: "Other", icon: "🔗" },
] as const;

export const CHANNEL_UTM_DEFAULTS: Record<string, { source: string; medium: string }> = {
  instagram: { source: "instagram", medium: "social" },
  facebook: { source: "facebook", medium: "social" },
  tiktok: { source: "tiktok", medium: "social" },
  youtube: { source: "youtube", medium: "social" },
  email: { source: "email", medium: "email" },
  skool: { source: "skool", medium: "community" },
  other: { source: "", medium: "" },
};

export const LINK_STATUSES = ["active", "paused", "archived"] as const;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildFinalUrl(
  baseUrl: string,
  params: { source: string; medium: string; campaign: string; content?: string; term?: string }
): string {
  try {
    const url = new URL(baseUrl);
    if (params.source) url.searchParams.set("utm_source", params.source);
    if (params.medium) url.searchParams.set("utm_medium", params.medium);
    if (params.campaign) url.searchParams.set("utm_campaign", params.campaign);
    if (params.content) url.searchParams.set("utm_content", params.content);
    if (params.term) url.searchParams.set("utm_term", params.term);
    return url.toString();
  } catch {
    // fallback for invalid URLs
    const qs = new URLSearchParams();
    if (params.source) qs.set("utm_source", params.source);
    if (params.medium) qs.set("utm_medium", params.medium);
    if (params.campaign) qs.set("utm_campaign", params.campaign);
    if (params.content) qs.set("utm_content", params.content);
    if (params.term) qs.set("utm_term", params.term);
    return `${baseUrl}?${qs.toString()}`;
  }
}

export function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

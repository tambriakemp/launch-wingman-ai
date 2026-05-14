// Shared inline-style tokens for the Marketing hub. The design ships with
// editorial-specific colors and stacks that don't all map cleanly to our
// tailwind theme tokens, so we centralize them here for consistency between
// the preview SVGs, hero, and tiles.

export const SF =
  '-apple-system, "SF Pro Text", "SF Pro Display", "Inter Tight", system-ui, sans-serif';
export const SERIF = '"Fraunces", "New York", Georgia, serif';

export const COLORS = {
  paper: "#FBF7F1",
  ink: "#1F1B17",
  inkMid: "#6B6058",
  inkSoft: "#8F857B",
  terracotta: "#C65A3E",
  terracottaSoft: "#E08F72",
  hairline: "#E8D9C6",
  tan: "#C9AE8F",
} as const;

// Per-tile background swatches (warm cream variants).
export const TILE_BG = {
  cream: "#F7F1E8",
  blush: "#FAEDE7",
  oat: "#F2E9DC",
  ink: "#1F1B17",
} as const;

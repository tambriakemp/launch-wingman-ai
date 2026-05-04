// Shared design tokens for the Assessments surfaces.
// These mirror the Launchely design system (Fraunces + warm paper + terracotta).

export const A_PAPER = "#FBF7F1";
export const A_PAPER2 = "#F7F1E8";
export const A_INK = "#1F1B17";
export const A_INK_60 = "rgba(31,27,23,0.62)";
export const A_INK_40 = "rgba(31,27,23,0.42)";
export const A_HAIR = "rgba(31,27,23,0.10)";
export const A_TERRA = "#C65A3E";
export const A_TERRA_DEEP = "#8F3F2A";
export const A_TERRA_TINT = "rgba(243,212,199,0.55)";
export const A_MOSS = "#4F6B52";
export const A_MOSS_TINT = "rgba(220,229,220,0.7)";
export const A_PLUM = "#6B3A5C";
export const A_PLUM_TINT = "rgba(231,216,224,0.7)";

export const FONT_DISPLAY =
  '"Fraunces", "Iowan Old Style", "Apple Garamond", Georgia, "Times New Roman", serif';
export const FONT_BODY_NATIVE =
  '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif';
export const FONT_BODY =
  '"Plus Jakarta Sans", -apple-system, system-ui, sans-serif';
export const FONT_MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';

export type AccentName = "terracotta" | "moss" | "plum";

export const accentFor = (name: AccentName) => {
  if (name === "moss") return { strong: A_MOSS, tint: A_MOSS_TINT };
  if (name === "plum") return { strong: A_PLUM, tint: A_PLUM_TINT };
  return { strong: A_TERRA, tint: A_TERRA_TINT };
};

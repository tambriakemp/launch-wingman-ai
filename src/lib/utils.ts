import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Words that should remain lowercase in Title Case (unless first word)
const TITLE_CASE_MINOR_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor",
  "of", "on", "or", "per", "the", "to", "up", "via", "vs", "vs.", "with",
]);

/**
 * Convert a string to Title Case for default task titles.
 * - Capitalizes the first letter of each word
 * - Keeps minor words (a, an, the, of, ...) lowercase except as the first word
 * - Preserves ALL-CAPS tokens (e.g., "FAQ", "AI") and tokens containing digits
 */
export function toTitleCase(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  const words = trimmed.split(/\s+/);
  return words
    .map((word, i) => {
      // Preserve tokens that are already ALL CAPS (length >= 2) or contain digits
      if (/\d/.test(word)) return word;
      if (word.length >= 2 && word === word.toUpperCase() && /[A-Z]/.test(word)) {
        return word;
      }
      const lower = word.toLowerCase();
      if (i !== 0 && TITLE_CASE_MINOR_WORDS.has(lower)) return lower;
      // Handle hyphenated words: capitalize each segment
      return lower
        .split("-")
        .map((seg) => (seg ? seg[0].toUpperCase() + seg.slice(1) : seg))
        .join("-");
    })
    .join(" ");
}

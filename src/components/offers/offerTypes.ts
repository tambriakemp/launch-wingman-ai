// Editorial offer-type metadata that maps the HTML reference design
// onto the existing `offers` table values (slot_type / offer_type).

export type OfferTypeKey =
  | "lead"
  | "tripwire"
  | "core"
  | "bump"
  | "upsell"
  | "downsell";

export type OfferStatus = "idea" | "draft" | "live" | "archived";

export interface OfferTypeMeta {
  label: string;
  // Editorial colour pair — these are intentional brand accents from the
  // reference design that don't have a one-to-one semantic token. Stored
  // here as constants so they live in one place.
  color: string;
  bg: string;
  stage: "Attract" | "Convert" | "Deliver" | "Expand" | "Rescue";
}

export const OFFER_TYPES: Record<OfferTypeKey, OfferTypeMeta> = {
  lead: { label: "Lead magnet", color: "#4F6B52", bg: "rgba(79,107,82,0.12)", stage: "Attract" },
  tripwire: { label: "Tripwire", color: "#C48B2E", bg: "rgba(196,139,46,0.14)", stage: "Convert" },
  core: { label: "Core offer", color: "#C65A3E", bg: "rgba(198,90,62,0.14)", stage: "Deliver" },
  bump: { label: "Order bump", color: "#8A5A3B", bg: "rgba(138,90,59,0.14)", stage: "Convert" },
  upsell: { label: "Upsell", color: "#5A4A6E", bg: "rgba(90,74,110,0.14)", stage: "Expand" },
  downsell: { label: "Downsell", color: "#7A5D39", bg: "rgba(122,93,57,0.14)", stage: "Rescue" },
};

export const OFFER_FORMATS = [
  "Ebook · PDF",
  "Guide / PDF",
  "Notion · Template",
  "Google Doc",
  "Swipe file",
  "Video course",
  "Audio",
  "Template pack",
  "Cohort · Live",
  "Coaching · Recurring",
  "Digital access",
  "Bundle · Templates",
  "Physical",
];

export const EXPLAINERS: Record<OfferTypeKey, { what: string; how: string }> = {
  lead: {
    what:
      "A free, high-value resource you offer in exchange for someone's email address. The first step in your relationship with a potential customer.",
    how:
      "Place it at the entry of your funnel to attract your ideal audience. It should solve a specific, small problem that your paid offer addresses more comprehensively.",
  },
  tripwire: {
    what:
      "A low-priced offer ($7–27) that converts new subscribers into buyers. Turns curious visitors into committed customers.",
    how:
      "Show it immediately after lead magnet opt-in or on the thank-you page. Priced to be an impulse purchase that removes friction from the buying decision.",
  },
  core: {
    what:
      "Your flagship offer — what you really want to sell. The reason this funnel exists.",
    how:
      "Position it as the clear solution to your audience's biggest problem. Most customers arrive here via the lead magnet + tripwire warmup path.",
  },
  bump: {
    what:
      "A small add-on shown at checkout, priced below the core offer. Increases average order value with almost no friction.",
    how:
      "Present as a single-click checkbox on the checkout page — something complementary that enhances the core purchase.",
  },
  upsell: {
    what:
      "A higher-value offer shown after the core purchase. Typically coaching, done-for-you services, or premium access.",
    how:
      "Trigger right after checkout — buyers are in peak commitment mode. Should feel like a natural next step, not a hard sell.",
  },
  downsell: {
    what:
      "A lower-commitment offer shown to people who abandon the main offer. Rescues customers who want the transformation but not the price.",
    how:
      "Show after core offer decline, cart abandonment, or exit-intent. Preserve as much value as possible at a lower tier.",
  },
};

// Shape used by the editor + library UI. Distinct from the raw DB row so
// the page can stay design-true regardless of column shape.
export interface OfferDraft {
  id: string | null;
  type: OfferTypeKey;
  title: string;
  format: string;
  description: string;
  price: number;
  priceType: "Free" | "One-time" | "/month" | "/year" | "Pay what you want";
  status: OfferStatus;
  usedIn: { campaigns: number; posts: number; hooks: number };
  updated?: string;
}

const VALID_TYPES = new Set<OfferTypeKey>([
  "lead",
  "tripwire",
  "core",
  "bump",
  "upsell",
  "downsell",
]);

export function normalizeOfferType(value: string | null | undefined): OfferTypeKey {
  if (value && VALID_TYPES.has(value as OfferTypeKey)) return value as OfferTypeKey;
  return "core";
}

export function normalizeStatus(value: string | null | undefined): OfferStatus {
  if (value === "live" || value === "draft" || value === "idea" || value === "archived") {
    return value;
  }
  return "draft";
}

export function normalizePriceType(value: string | null | undefined): OfferDraft["priceType"] {
  switch (value) {
    case "Free":
    case "free":
      return "Free";
    case "/month":
    case "monthly":
    case "subscription":
      return "/month";
    case "/year":
    case "yearly":
      return "/year";
    case "Pay what you want":
    case "pwyw":
      return "Pay what you want";
    case "One-time":
    case "one-time":
    default:
      return "One-time";
  }
}

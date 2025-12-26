import type { ContentType } from "@/components/content/ContentTab";

export type BlueprintPhase = 
  | "prelaunch-awareness" 
  | "prelaunch-desire" 
  | "launch";

export type ContentFormat = "post" | "email" | "live" | "story" | "reel" | "carousel";

export interface BlueprintIdea {
  id: string;
  title: string;
  whyItWorks: string;
  formats: ContentFormat[];
  contentType: ContentType;
  phase: BlueprintPhase;
  dayHint?: number; // For timeline view: suggested day relative to launch
  timeOfDay?: "morning" | "evening";
}

export interface BlueprintPhaseConfig {
  id: BlueprintPhase;
  title: string;
  subtitle: string;
  ideas: BlueprintIdea[];
}

// Pre-launch: Build Awareness
const awarenessIdeas: BlueprintIdea[] = [
  {
    id: "awareness-pain-point",
    title: "High-Value Content: Core Pain Point",
    whyItWorks: "Establishes you as someone who understands their struggle before asking for anything.",
    formats: ["post", "carousel", "email"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -21,
    timeOfDay: "morning",
  },
  {
    id: "awareness-origin-story",
    title: "Personal Story or Origin Moment",
    whyItWorks: "Builds connection and shows you've walked a similar path.",
    formats: ["post", "story", "live"],
    contentType: "stories",
    phase: "prelaunch-awareness",
    dayHint: -18,
    timeOfDay: "morning",
  },
  {
    id: "awareness-social-proof",
    title: "Social Proof or Testimonial",
    whyItWorks: "Shows real results without you having to make claims.",
    formats: ["post", "carousel", "story"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -14,
    timeOfDay: "morning",
  },
  {
    id: "awareness-engagement",
    title: "Engagement Question or Poll",
    whyItWorks: "Gets your audience talking and reveals what they care about most.",
    formats: ["post", "story"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -12,
    timeOfDay: "evening",
  },
  {
    id: "awareness-value-teaching",
    title: "Long-Form Value or Live Teaching",
    whyItWorks: "Demonstrates your expertise in a way that feels generous, not salesy.",
    formats: ["live", "carousel", "email"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -10,
    timeOfDay: "morning",
  },
];

// Pre-launch: Build Desire
const desireIdeas: BlueprintIdea[] = [
  {
    id: "desire-behind-scenes",
    title: "Behind-the-Scenes Content",
    whyItWorks: "Creates anticipation by showing the work that goes into what you're building.",
    formats: ["story", "reel", "post"],
    contentType: "behind-the-scenes",
    phase: "prelaunch-desire",
    dayHint: -7,
    timeOfDay: "morning",
  },
  {
    id: "desire-objection",
    title: "Objection Handling",
    whyItWorks: "Addresses doubts before they become reasons not to buy.",
    formats: ["post", "carousel", "email"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -5,
    timeOfDay: "morning",
  },
  {
    id: "desire-transformation",
    title: "Transformation Examples",
    whyItWorks: "Helps people imagine themselves achieving similar results.",
    formats: ["post", "carousel", "story"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -4,
    timeOfDay: "morning",
  },
  {
    id: "desire-soft-mention",
    title: "Soft Mentions of What's Coming",
    whyItWorks: "Builds curiosity without feeling pushy.",
    formats: ["post", "story", "email"],
    contentType: "behind-the-scenes",
    phase: "prelaunch-desire",
    dayHint: -2,
    timeOfDay: "evening",
  },
];

// Launch Phase
const launchIdeas: BlueprintIdea[] = [
  {
    id: "launch-cart-open",
    title: "Cart Open Announcement",
    whyItWorks: "Clear, direct communication that it's time to take action.",
    formats: ["post", "email", "story"],
    contentType: "offer",
    phase: "launch",
    dayHint: 0,
    timeOfDay: "morning",
  },
  {
    id: "launch-offer-explanation",
    title: "Offer Explanation",
    whyItWorks: "Helps people understand exactly what they're getting and why it matters.",
    formats: ["post", "carousel", "email", "live"],
    contentType: "offer",
    phase: "launch",
    dayHint: 0,
    timeOfDay: "evening",
  },
  {
    id: "launch-faq",
    title: "FAQ / Objection Handling",
    whyItWorks: "Removes friction for people who are almost ready to say yes.",
    formats: ["post", "carousel", "story", "email"],
    contentType: "offer",
    phase: "launch",
    dayHint: 1,
    timeOfDay: "morning",
  },
  {
    id: "launch-social-proof",
    title: "Social Proof During Launch",
    whyItWorks: "Real-time validation from others who've made the decision.",
    formats: ["post", "story"],
    contentType: "general",
    phase: "launch",
    dayHint: 2,
    timeOfDay: "morning",
  },
  {
    id: "launch-scarcity",
    title: "Scarcity & Reminder Posts",
    whyItWorks: "Gentle urgency helps fence-sitters make a decision.",
    formats: ["post", "story", "email"],
    contentType: "offer",
    phase: "launch",
    dayHint: 3,
    timeOfDay: "evening",
  },
];

export const BLUEPRINT_PHASES: BlueprintPhaseConfig[] = [
  {
    id: "prelaunch-awareness",
    title: "Pre-Launch: Build Awareness",
    subtitle: "Help your audience recognize the problem and see you as a guide",
    ideas: awarenessIdeas,
  },
  {
    id: "prelaunch-desire",
    title: "Pre-Launch: Build Desire",
    subtitle: "Create anticipation and address hesitations before the offer",
    ideas: desireIdeas,
  },
  {
    id: "launch",
    title: "Launch Phase",
    subtitle: "Make the offer clear and help people decide",
    ideas: launchIdeas,
  },
];

// Helper to get all ideas flat
export const getAllBlueprintIdeas = (): BlueprintIdea[] => {
  return BLUEPRINT_PHASES.flatMap(phase => phase.ideas);
};

// Helper to filter ideas by content type
export const filterIdeasByContentType = (
  ideas: BlueprintIdea[], 
  contentType: ContentType
): BlueprintIdea[] => {
  const typeMapping: Record<ContentType, ContentType[]> = {
    general: ["general"],
    stories: ["stories", "behind-the-scenes"],
    offer: ["offer"],
    "behind-the-scenes": ["behind-the-scenes"],
  };
  
  const allowedTypes = typeMapping[contentType] || [contentType];
  return ideas.filter(idea => allowedTypes.includes(idea.contentType));
};

// Format labels for display
export const FORMAT_LABELS: Record<ContentFormat, string> = {
  post: "Post",
  email: "Email",
  live: "Live",
  story: "Story",
  reel: "Reel",
  carousel: "Carousel",
};

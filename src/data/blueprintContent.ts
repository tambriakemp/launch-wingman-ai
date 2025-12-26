import type { ContentType } from "@/components/content/ContentTab";

export type BlueprintPhase = 
  | "prelaunch-awareness" 
  | "prelaunch-desire" 
  | "launch";

export type ContentFormat = "post" | "email" | "live" | "story" | "reel" | "carousel";

export type FunnelCategory = 
  | "all" 
  | "webinar" 
  | "challenge" 
  | "launch" 
  | "low-ticket" 
  | "freebie" 
  | "membership" 
  | "application";

export interface BlueprintIdea {
  id: string;
  title: string;
  whyItWorks: string;
  formats: ContentFormat[];
  contentType: ContentType;
  phase: BlueprintPhase;
  dayHint?: number;
  timeOfDay?: "morning" | "evening";
  /** Which funnel types this idea applies to. Empty array or ['all'] means universal */
  funnelTypes: FunnelCategory[];
}

export interface BlueprintPhaseConfig {
  id: BlueprintPhase;
  title: string;
  subtitle: string;
  ideas: BlueprintIdea[];
}

// Map funnel config IDs to our categories
export const FUNNEL_TYPE_MAP: Record<string, FunnelCategory> = {
  'freebie-funnel': 'freebie',
  'low-ticket-funnel': 'low-ticket',
  'webinar-funnel': 'webinar',
  'challenge-funnel': 'challenge',
  'launch-funnel': 'launch',
  'membership-funnel': 'membership',
  'application-funnel': 'application',
};

// Pre-launch: Build Awareness
const awarenessIdeas: BlueprintIdea[] = [
  // Universal ideas
  {
    id: "awareness-pain-point",
    title: "High-Value Content: Core Pain Point",
    whyItWorks: "Establishes you as someone who understands their struggle before asking for anything.",
    formats: ["post", "carousel", "email"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -21,
    timeOfDay: "morning",
    funnelTypes: ["all"],
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
    funnelTypes: ["all"],
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
    funnelTypes: ["all"],
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
    funnelTypes: ["all"],
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
    funnelTypes: ["all"],
  },
  {
    id: "awareness-myth-busting",
    title: "Myth-Busting Content",
    whyItWorks: "Positions you as an authority by challenging common misconceptions.",
    formats: ["post", "carousel", "reel"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -19,
    timeOfDay: "morning",
    funnelTypes: ["all"],
  },
  {
    id: "awareness-quick-win",
    title: "Quick Win or Mini Tutorial",
    whyItWorks: "Gives immediate value and builds trust through a small transformation.",
    formats: ["reel", "carousel", "post"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -17,
    timeOfDay: "evening",
    funnelTypes: ["all"],
  },
  {
    id: "awareness-relatable-struggle",
    title: "Relatable Struggle Post",
    whyItWorks: "Makes your audience feel seen and understood.",
    formats: ["post", "story"],
    contentType: "stories",
    phase: "prelaunch-awareness",
    dayHint: -16,
    timeOfDay: "morning",
    funnelTypes: ["all"],
  },
  {
    id: "awareness-industry-insight",
    title: "Industry Insight or Trend",
    whyItWorks: "Shows you're tuned in and positions you as a thought leader.",
    formats: ["post", "carousel"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -15,
    timeOfDay: "morning",
    funnelTypes: ["all"],
  },
  {
    id: "awareness-client-journey",
    title: "Client Journey Spotlight",
    whyItWorks: "Shows transformation through someone else's story, not just yours.",
    formats: ["carousel", "post", "story"],
    contentType: "stories",
    phase: "prelaunch-awareness",
    dayHint: -13,
    timeOfDay: "evening",
    funnelTypes: ["all"],
  },

  // Webinar-specific
  {
    id: "awareness-webinar-topic-tease",
    title: "Tease Your Webinar Topic",
    whyItWorks: "Builds anticipation for your training without revealing too much.",
    formats: ["post", "story", "reel"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -20,
    timeOfDay: "morning",
    funnelTypes: ["webinar"],
  },
  {
    id: "awareness-webinar-past-results",
    title: "Results From Past Webinar Attendees",
    whyItWorks: "Shows the value of showing up live.",
    formats: ["carousel", "post"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -11,
    timeOfDay: "morning",
    funnelTypes: ["webinar"],
  },

  // Challenge-specific
  {
    id: "awareness-challenge-preview",
    title: "What the Challenge Will Cover",
    whyItWorks: "Gives clarity on what participants will learn and achieve.",
    formats: ["carousel", "post", "email"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -20,
    timeOfDay: "morning",
    funnelTypes: ["challenge"],
  },
  {
    id: "awareness-challenge-community",
    title: "Community & Support Preview",
    whyItWorks: "Emphasizes the group experience and accountability.",
    formats: ["post", "story"],
    contentType: "behind-the-scenes",
    phase: "prelaunch-awareness",
    dayHint: -11,
    timeOfDay: "evening",
    funnelTypes: ["challenge"],
  },

  // Launch-specific
  {
    id: "awareness-launch-coming-soon",
    title: "Something Special is Coming",
    whyItWorks: "Plants the seed without revealing details.",
    formats: ["story", "post"],
    contentType: "behind-the-scenes",
    phase: "prelaunch-awareness",
    dayHint: -21,
    timeOfDay: "evening",
    funnelTypes: ["launch"],
  },
  {
    id: "awareness-launch-waitlist",
    title: "Waitlist Announcement",
    whyItWorks: "Creates exclusivity and captures warm leads early.",
    formats: ["post", "email", "story"],
    contentType: "offer",
    phase: "prelaunch-awareness",
    dayHint: -14,
    timeOfDay: "morning",
    funnelTypes: ["launch"],
  },

  // Membership-specific
  {
    id: "awareness-membership-peek",
    title: "A Peek Inside the Membership",
    whyItWorks: "Shows what members experience without giving everything away.",
    formats: ["story", "reel", "carousel"],
    contentType: "behind-the-scenes",
    phase: "prelaunch-awareness",
    dayHint: -18,
    timeOfDay: "morning",
    funnelTypes: ["membership"],
  },
  {
    id: "awareness-membership-wins",
    title: "Member Win Celebration",
    whyItWorks: "Shows the ongoing transformation members experience.",
    formats: ["post", "story"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -12,
    timeOfDay: "evening",
    funnelTypes: ["membership"],
  },

  // Application/High-ticket specific
  {
    id: "awareness-application-who-its-for",
    title: "Who This Is Really For",
    whyItWorks: "Pre-qualifies your audience and builds desire in the right people.",
    formats: ["post", "carousel"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -19,
    timeOfDay: "morning",
    funnelTypes: ["application"],
  },
  {
    id: "awareness-application-philosophy",
    title: "Your Unique Approach or Philosophy",
    whyItWorks: "Differentiates your methodology from others.",
    formats: ["carousel", "post", "email"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -15,
    timeOfDay: "morning",
    funnelTypes: ["application"],
  },

  // Low-ticket specific
  {
    id: "awareness-low-ticket-problem",
    title: "The Problem Your Product Solves",
    whyItWorks: "Directly addresses the pain point your low-ticket offer fixes.",
    formats: ["post", "reel", "carousel"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -14,
    timeOfDay: "morning",
    funnelTypes: ["low-ticket"],
  },

  // Freebie-specific
  {
    id: "awareness-freebie-value-preview",
    title: "Value Preview of Your Lead Magnet",
    whyItWorks: "Shows the quality of your free content, building trust.",
    formats: ["carousel", "story", "post"],
    contentType: "general",
    phase: "prelaunch-awareness",
    dayHint: -10,
    timeOfDay: "morning",
    funnelTypes: ["freebie"],
  },
];

// Pre-launch: Build Desire
const desireIdeas: BlueprintIdea[] = [
  // Universal ideas
  {
    id: "desire-behind-scenes",
    title: "Behind-the-Scenes Content",
    whyItWorks: "Creates anticipation by showing the work that goes into what you're building.",
    formats: ["story", "reel", "post"],
    contentType: "behind-the-scenes",
    phase: "prelaunch-desire",
    dayHint: -7,
    timeOfDay: "morning",
    funnelTypes: ["all"],
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
    funnelTypes: ["all"],
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
    funnelTypes: ["all"],
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
    funnelTypes: ["all"],
  },
  {
    id: "desire-before-after",
    title: "Before & After Stories",
    whyItWorks: "Concrete proof of what's possible creates powerful desire.",
    formats: ["carousel", "post", "reel"],
    contentType: "stories",
    phase: "prelaunch-desire",
    dayHint: -6,
    timeOfDay: "morning",
    funnelTypes: ["all"],
  },
  {
    id: "desire-future-pacing",
    title: "Future Pacing Content",
    whyItWorks: "Helps your audience visualize life after the transformation.",
    formats: ["post", "story"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -3,
    timeOfDay: "evening",
    funnelTypes: ["all"],
  },
  {
    id: "desire-cost-of-waiting",
    title: "The Cost of Waiting",
    whyItWorks: "Gently highlights what they miss by not taking action.",
    formats: ["post", "email"],
    contentType: "general",
    phase: "prelaunch-desire",
    dayHint: -2,
    timeOfDay: "morning",
    funnelTypes: ["all"],
  },
  {
    id: "desire-process-reveal",
    title: "Your Process or Method",
    whyItWorks: "Builds confidence by showing them how you'll help.",
    formats: ["carousel", "post", "live"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -5,
    timeOfDay: "evening",
    funnelTypes: ["all"],
  },
  {
    id: "desire-personal-why",
    title: "Why I Created This",
    whyItWorks: "Connects your offer to a deeper purpose they can relate to.",
    formats: ["post", "story", "email"],
    contentType: "stories",
    phase: "prelaunch-desire",
    dayHint: -4,
    timeOfDay: "evening",
    funnelTypes: ["all"],
  },

  // Webinar-specific
  {
    id: "desire-webinar-agenda",
    title: "What You'll Learn on the Webinar",
    whyItWorks: "Clear outcomes increase registration and show-up rates.",
    formats: ["post", "carousel", "email"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -6,
    timeOfDay: "morning",
    funnelTypes: ["webinar"],
  },
  {
    id: "desire-webinar-prep",
    title: "Webinar Prep Behind-the-Scenes",
    whyItWorks: "Shows you're putting effort into delivering value.",
    formats: ["story", "reel"],
    contentType: "behind-the-scenes",
    phase: "prelaunch-desire",
    dayHint: -3,
    timeOfDay: "morning",
    funnelTypes: ["webinar"],
  },
  {
    id: "desire-webinar-reminder",
    title: "Webinar Registration Reminder",
    whyItWorks: "Catches those who meant to register but forgot.",
    formats: ["story", "post", "email"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -1,
    timeOfDay: "morning",
    funnelTypes: ["webinar"],
  },

  // Challenge-specific
  {
    id: "desire-challenge-day-preview",
    title: "Day-by-Day Challenge Preview",
    whyItWorks: "Shows the journey participants will go through.",
    formats: ["carousel", "email"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -5,
    timeOfDay: "morning",
    funnelTypes: ["challenge"],
  },
  {
    id: "desire-challenge-community-hype",
    title: "Building the Challenge Community",
    whyItWorks: "Creates FOMO around the group experience.",
    formats: ["story", "post"],
    contentType: "behind-the-scenes",
    phase: "prelaunch-desire",
    dayHint: -3,
    timeOfDay: "evening",
    funnelTypes: ["challenge"],
  },
  {
    id: "desire-challenge-materials",
    title: "Sneak Peek of Challenge Materials",
    whyItWorks: "Shows the quality and effort you've put into creating it.",
    formats: ["story", "reel", "carousel"],
    contentType: "behind-the-scenes",
    phase: "prelaunch-desire",
    dayHint: -2,
    timeOfDay: "morning",
    funnelTypes: ["challenge"],
  },

  // Launch-specific
  {
    id: "desire-launch-countdown",
    title: "Launch Countdown Content",
    whyItWorks: "Creates urgency and keeps your launch top of mind.",
    formats: ["story", "post"],
    contentType: "behind-the-scenes",
    phase: "prelaunch-desire",
    dayHint: -3,
    timeOfDay: "evening",
    funnelTypes: ["launch"],
  },
  {
    id: "desire-launch-bonus-preview",
    title: "Early Bird Bonus Preview",
    whyItWorks: "Incentivizes fast action when doors open.",
    formats: ["post", "story", "email"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -1,
    timeOfDay: "morning",
    funnelTypes: ["launch"],
  },
  {
    id: "desire-launch-offer-components",
    title: "What's Included Preview",
    whyItWorks: "Builds value perception before the price is revealed.",
    formats: ["carousel", "email"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -2,
    timeOfDay: "morning",
    funnelTypes: ["launch"],
  },

  // Membership-specific
  {
    id: "desire-membership-tour",
    title: "Virtual Tour of the Membership",
    whyItWorks: "Shows exactly what they'll get access to.",
    formats: ["reel", "story", "live"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -4,
    timeOfDay: "morning",
    funnelTypes: ["membership"],
  },
  {
    id: "desire-membership-member-spotlight",
    title: "Member Spotlight & Testimonial",
    whyItWorks: "Shows the community and results in action.",
    formats: ["post", "story"],
    contentType: "stories",
    phase: "prelaunch-desire",
    dayHint: -3,
    timeOfDay: "evening",
    funnelTypes: ["membership"],
  },

  // Application-specific
  {
    id: "desire-application-case-study",
    title: "Detailed Case Study",
    whyItWorks: "High-ticket buyers need proof of transformation.",
    formats: ["carousel", "email", "post"],
    contentType: "stories",
    phase: "prelaunch-desire",
    dayHint: -5,
    timeOfDay: "morning",
    funnelTypes: ["application"],
  },
  {
    id: "desire-application-process",
    title: "What to Expect in the Application Process",
    whyItWorks: "Reduces friction by explaining next steps.",
    formats: ["post", "email"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -2,
    timeOfDay: "morning",
    funnelTypes: ["application"],
  },

  // Low-ticket specific
  {
    id: "desire-low-ticket-quick-results",
    title: "Quick Results Preview",
    whyItWorks: "Low-ticket buyers want fast wins - show them it's possible.",
    formats: ["reel", "story", "post"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -3,
    timeOfDay: "evening",
    funnelTypes: ["low-ticket"],
  },
  {
    id: "desire-low-ticket-no-brainer",
    title: "Why This is a No-Brainer",
    whyItWorks: "Positions the offer as an easy decision.",
    formats: ["post", "story"],
    contentType: "offer",
    phase: "prelaunch-desire",
    dayHint: -1,
    timeOfDay: "morning",
    funnelTypes: ["low-ticket"],
  },
];

// Launch Phase
const launchIdeas: BlueprintIdea[] = [
  // Universal ideas
  {
    id: "launch-cart-open",
    title: "Cart Open Announcement",
    whyItWorks: "Clear, direct communication that it's time to take action.",
    formats: ["post", "email", "story"],
    contentType: "offer",
    phase: "launch",
    dayHint: 0,
    timeOfDay: "morning",
    funnelTypes: ["all"],
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
    funnelTypes: ["all"],
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
    funnelTypes: ["all"],
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
    funnelTypes: ["all"],
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
    funnelTypes: ["all"],
  },
  {
    id: "launch-personal-invitation",
    title: "Personal Invitation Post",
    whyItWorks: "Direct, heartfelt invitations convert better than generic promos.",
    formats: ["post", "email", "story"],
    contentType: "offer",
    phase: "launch",
    dayHint: 1,
    timeOfDay: "evening",
    funnelTypes: ["all"],
  },
  {
    id: "launch-buyer-celebration",
    title: "New Buyer Celebration",
    whyItWorks: "Creates social proof and FOMO in real-time.",
    formats: ["story", "post"],
    contentType: "general",
    phase: "launch",
    dayHint: 1,
    timeOfDay: "evening",
    funnelTypes: ["all"],
  },
  {
    id: "launch-last-chance",
    title: "Last Chance to Join",
    whyItWorks: "Final push for those who need a deadline to decide.",
    formats: ["post", "email", "story"],
    contentType: "offer",
    phase: "launch",
    dayHint: 4,
    timeOfDay: "morning",
    funnelTypes: ["all"],
  },
  {
    id: "launch-doors-closing",
    title: "Doors Closing Tonight",
    whyItWorks: "Creates genuine urgency for the final hours.",
    formats: ["story", "email", "post"],
    contentType: "offer",
    phase: "launch",
    dayHint: 4,
    timeOfDay: "evening",
    funnelTypes: ["all"],
  },
  {
    id: "launch-thank-you",
    title: "Thank You & Closed Announcement",
    whyItWorks: "Closes the loop gracefully and sets up future launches.",
    formats: ["post", "email", "story"],
    contentType: "general",
    phase: "launch",
    dayHint: 5,
    timeOfDay: "morning",
    funnelTypes: ["all"],
  },

  // Webinar-specific
  {
    id: "launch-webinar-live-now",
    title: "Going Live Announcement",
    whyItWorks: "Catches last-minute registrants and reminds people to show up.",
    formats: ["story", "post"],
    contentType: "offer",
    phase: "launch",
    dayHint: 0,
    timeOfDay: "morning",
    funnelTypes: ["webinar"],
  },
  {
    id: "launch-webinar-replay",
    title: "Replay Available Announcement",
    whyItWorks: "Gives non-attendees a second chance to watch.",
    formats: ["post", "email", "story"],
    contentType: "offer",
    phase: "launch",
    dayHint: 1,
    timeOfDay: "morning",
    funnelTypes: ["webinar"],
  },
  {
    id: "launch-webinar-highlights",
    title: "Webinar Highlights Recap",
    whyItWorks: "Recaps key insights for those who missed it.",
    formats: ["carousel", "post"],
    contentType: "general",
    phase: "launch",
    dayHint: 2,
    timeOfDay: "evening",
    funnelTypes: ["webinar"],
  },

  // Challenge-specific
  {
    id: "launch-challenge-kickoff",
    title: "Challenge Day 1 Kickoff",
    whyItWorks: "Energizes participants and sets expectations.",
    formats: ["post", "story", "email", "live"],
    contentType: "general",
    phase: "launch",
    dayHint: 0,
    timeOfDay: "morning",
    funnelTypes: ["challenge"],
  },
  {
    id: "launch-challenge-momentum",
    title: "Mid-Challenge Momentum Post",
    whyItWorks: "Keeps energy high and encourages those falling behind.",
    formats: ["story", "post"],
    contentType: "general",
    phase: "launch",
    dayHint: 2,
    timeOfDay: "evening",
    funnelTypes: ["challenge"],
  },
  {
    id: "launch-challenge-pitch",
    title: "Challenge Pitch Day Content",
    whyItWorks: "Natural transition from free challenge to paid offer.",
    formats: ["live", "post", "email"],
    contentType: "offer",
    phase: "launch",
    dayHint: 4,
    timeOfDay: "morning",
    funnelTypes: ["challenge"],
  },

  // Launch-specific
  {
    id: "launch-early-bird-ending",
    title: "Early Bird Bonus Ending",
    whyItWorks: "Creates mid-launch urgency for fast-action bonuses.",
    formats: ["post", "story", "email"],
    contentType: "offer",
    phase: "launch",
    dayHint: 2,
    timeOfDay: "evening",
    funnelTypes: ["launch"],
  },
  {
    id: "launch-live-qa",
    title: "Live Q&A Session",
    whyItWorks: "Addresses objections in real-time and builds connection.",
    formats: ["live", "story"],
    contentType: "offer",
    phase: "launch",
    dayHint: 3,
    timeOfDay: "evening",
    funnelTypes: ["launch"],
  },

  // Membership-specific
  {
    id: "launch-membership-open",
    title: "Doors Are Open Announcement",
    whyItWorks: "Clear call to action for membership enrollment.",
    formats: ["post", "email", "story"],
    contentType: "offer",
    phase: "launch",
    dayHint: 0,
    timeOfDay: "morning",
    funnelTypes: ["membership"],
  },
  {
    id: "launch-membership-live-onboarding",
    title: "Live Onboarding Call Preview",
    whyItWorks: "Shows the support new members will receive.",
    formats: ["story", "post"],
    contentType: "behind-the-scenes",
    phase: "launch",
    dayHint: 2,
    timeOfDay: "morning",
    funnelTypes: ["membership"],
  },

  // Application-specific
  {
    id: "launch-application-open",
    title: "Applications Now Open",
    whyItWorks: "Creates exclusivity and attracts serious buyers.",
    formats: ["post", "email"],
    contentType: "offer",
    phase: "launch",
    dayHint: 0,
    timeOfDay: "morning",
    funnelTypes: ["application"],
  },
  {
    id: "launch-application-interviews",
    title: "Booking Strategy Calls",
    whyItWorks: "Shows momentum and fills your calendar.",
    formats: ["story", "post"],
    contentType: "behind-the-scenes",
    phase: "launch",
    dayHint: 2,
    timeOfDay: "evening",
    funnelTypes: ["application"],
  },
  {
    id: "launch-application-spots",
    title: "Limited Spots Remaining",
    whyItWorks: "Real scarcity for high-ticket offers.",
    formats: ["post", "story", "email"],
    contentType: "offer",
    phase: "launch",
    dayHint: 3,
    timeOfDay: "evening",
    funnelTypes: ["application"],
  },

  // Low-ticket specific
  {
    id: "launch-low-ticket-available",
    title: "Product Now Available",
    whyItWorks: "Simple, direct announcement for easy purchases.",
    formats: ["post", "email", "story"],
    contentType: "offer",
    phase: "launch",
    dayHint: 0,
    timeOfDay: "morning",
    funnelTypes: ["low-ticket"],
  },
  {
    id: "launch-low-ticket-user-results",
    title: "Quick Buyer Results",
    whyItWorks: "Shows immediate value from purchases.",
    formats: ["story", "post"],
    contentType: "general",
    phase: "launch",
    dayHint: 2,
    timeOfDay: "morning",
    funnelTypes: ["low-ticket"],
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

// Helper to filter ideas by funnel type
export const filterIdeasByFunnelType = (
  ideas: BlueprintIdea[],
  funnelType: string | null
): BlueprintIdea[] => {
  const category = funnelType ? FUNNEL_TYPE_MAP[funnelType] : null;
  
  return ideas.filter(idea => {
    // If no funnel type selected, show only universal ideas
    if (!category) {
      return idea.funnelTypes.includes("all");
    }
    // Show ideas that are universal OR match the funnel type
    return idea.funnelTypes.includes("all") || idea.funnelTypes.includes(category);
  });
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

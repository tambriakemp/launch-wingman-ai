// Types for Sales Page Copy feature

export type PageType = 
  | 'freebie-optin' 
  | 'tripwire-sales' 
  | 'core-offer-sales' 
  | 'application-page'
  | 'membership-sales'
  | 'webinar-registration'
  | 'thank-you';

export interface SalesCopySection {
  id: string;
  label: string;
  description: string;
  whyItMatters: string;
  whatToDo: string;
  aiEnabled: boolean;
}

// Section configurations per page type
export const UNIVERSAL_SECTIONS: SalesCopySection[] = [
  {
    id: 'headline',
    label: 'Headline',
    description: 'The first thing they see',
    whyItMatters: 'Your headline decides whether someone keeps reading.',
    whatToDo: 'Describe the transformation in plain language. Avoid cleverness.',
    aiEnabled: true,
  },
  {
    id: 'problem-awareness',
    label: 'Problem Awareness',
    description: 'Name the pain they feel',
    whyItMatters: 'When you describe their problem clearly, they feel understood.',
    whatToDo: 'Write about what they experience — not what you think they need to hear.',
    aiEnabled: true,
  },
  {
    id: 'desired-outcome',
    label: 'Desired Outcome',
    description: 'Paint the after picture',
    whyItMatters: 'People buy the destination, not the journey.',
    whatToDo: 'Be specific about what life looks like after the change.',
    aiEnabled: true,
  },
  {
    id: 'why-different',
    label: 'Why This Is Different',
    description: 'Address what they have tried before',
    whyItMatters: 'They have probably tried other things. Acknowledge that.',
    whatToDo: 'Explain what makes your approach work when others have not.',
    aiEnabled: true,
  },
  {
    id: 'offer-breakdown',
    label: 'Offer Breakdown',
    description: 'What they actually get',
    whyItMatters: 'Clarity beats curiosity. They want to know what is inside.',
    whatToDo: 'List what is included in simple, concrete terms.',
    aiEnabled: true,
  },
  {
    id: 'who-its-for',
    label: 'Who It Is For / Not For',
    description: 'Help them self-select',
    whyItMatters: 'The right people need to see themselves. The wrong ones should opt out.',
    whatToDo: 'Describe who this is perfect for — and who should skip it.',
    aiEnabled: true,
  },
  {
    id: 'social-proof',
    label: 'Social Proof',
    description: 'Show others who have done it',
    whyItMatters: 'Seeing others succeed builds trust.',
    whatToDo: 'Include real results or testimonials. Skip if you do not have any yet.',
    aiEnabled: false,
  },
  {
    id: 'cta',
    label: 'Call to Action',
    description: 'Tell them what to do next',
    whyItMatters: 'A clear ask removes hesitation.',
    whatToDo: 'Be direct. One action, no distractions.',
    aiEnabled: true,
  },
];

// Freebie opt-in specific sections (simpler)
export const FREEBIE_OPTIN_SECTIONS: SalesCopySection[] = [
  {
    id: 'headline',
    label: 'Headline',
    description: 'Promise the quick win',
    whyItMatters: 'Your headline decides whether someone keeps reading.',
    whatToDo: 'Focus on what they will learn or get immediately.',
    aiEnabled: true,
  },
  {
    id: 'pain-point',
    label: 'Pain Point',
    description: 'Name what they are stuck on',
    whyItMatters: 'When you name the struggle, they feel seen.',
    whatToDo: 'Keep it short. One clear pain point.',
    aiEnabled: true,
  },
  {
    id: 'promise',
    label: 'Promise',
    description: 'What they will walk away with',
    whyItMatters: 'They need to know it is worth their email.',
    whatToDo: 'Be specific about the outcome or insight they will gain.',
    aiEnabled: true,
  },
  {
    id: 'whats-inside',
    label: 'What They Will Get',
    description: 'Preview what is inside',
    whyItMatters: 'Curiosity drives signups.',
    whatToDo: 'List 2-4 things they will find inside.',
    aiEnabled: true,
  },
  {
    id: 'cta',
    label: 'Call to Action',
    description: 'Simple signup prompt',
    whyItMatters: 'Make it easy to say yes.',
    whatToDo: 'One line. One button. No friction.',
    aiEnabled: true,
  },
];

// Application/call funnel sections
export const APPLICATION_SECTIONS: SalesCopySection[] = [
  {
    id: 'headline',
    label: 'Headline',
    description: 'Position the opportunity',
    whyItMatters: 'Your headline sets the tone for who should apply.',
    whatToDo: 'Make it clear this is for committed people.',
    aiEnabled: true,
  },
  {
    id: 'authority',
    label: 'Authority Positioning',
    description: 'Why you can help',
    whyItMatters: 'They need to trust you before applying.',
    whatToDo: 'Share relevant experience without bragging.',
    aiEnabled: true,
  },
  {
    id: 'who-its-for',
    label: 'Who This Is For',
    description: 'Ideal applicant profile',
    whyItMatters: 'You want qualified leads, not everyone.',
    whatToDo: 'Be specific about who should apply.',
    aiEnabled: true,
  },
  {
    id: 'why-application',
    label: 'Why Application Required',
    description: 'Explain the process',
    whyItMatters: 'Applications filter for fit on both sides.',
    whatToDo: 'Frame it as protecting their investment too.',
    aiEnabled: true,
  },
  {
    id: 'cta',
    label: 'Apply Now',
    description: 'Clear application CTA',
    whyItMatters: 'Make the next step obvious.',
    whatToDo: 'CTA is Apply not Buy.',
    aiEnabled: true,
  },
];

// Map page types to their sections
export const PAGE_TYPE_SECTIONS: Record<string, SalesCopySection[]> = {
  'freebie-optin': FREEBIE_OPTIN_SECTIONS,
  'tripwire-sales': UNIVERSAL_SECTIONS,
  'core-offer-sales': UNIVERSAL_SECTIONS,
  'application-page': APPLICATION_SECTIONS,
  'membership-sales': UNIVERSAL_SECTIONS,
  'webinar-registration': FREEBIE_OPTIN_SECTIONS,
  'thank-you': [
    {
      id: 'confirmation',
      label: 'Confirmation Message',
      description: 'Reassure them they made the right choice',
      whyItMatters: 'Buyer remorse happens fast. This calms it.',
      whatToDo: 'Thank them and tell them what happens next.',
      aiEnabled: true,
    },
    {
      id: 'next-steps',
      label: 'Next Steps',
      description: 'What they should do now',
      whyItMatters: 'Clear direction prevents confusion.',
      whatToDo: 'List 1-3 things they should do immediately.',
      aiEnabled: true,
    },
  ],
};

// Get sections for an offer based on its slot type and price
export function getSectionsForOffer(slotType: string, price: number | null): SalesCopySection[] {
  if (slotType === 'lead-magnet') {
    return FREEBIE_OPTIN_SECTIONS;
  }
  
  if (slotType === 'tripwire') {
    // Simpler sections for low-ticket
    return UNIVERSAL_SECTIONS.filter(s => 
      ['headline', 'problem-awareness', 'offer-breakdown', 'cta'].includes(s.id)
    );
  }
  
  if (slotType === 'core' || slotType === 'upsell') {
    return UNIVERSAL_SECTIONS;
  }
  
  if (slotType === 'application') {
    return APPLICATION_SECTIONS;
  }
  
  return UNIVERSAL_SECTIONS;
}

export interface OfferForCopy {
  id: string;
  title: string | null;
  slotType: string;
  slotPosition: number;
  price: number | null;
  priceType: string | null;
  offerType: string;
  niche: string;
  targetAudience: string | null;
  desiredOutcome: string | null;
  primaryPainPoint: string | null;
  mainDeliverables: string[] | null;
  transformationStatement: string | null;
}

export interface SectionDraft {
  sectionId: string;
  content: string;
  status: 'empty' | 'drafted' | 'skipped';
  updatedAt: string;
}

export interface OfferSalesCopy {
  offerId: string;
  sections: Record<string, SectionDraft>;
}

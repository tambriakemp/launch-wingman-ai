export interface HeroSection {
  headlines: string[];
  recommendedHeadline: number;
  subheadlines: string[];
  ctas: string[];
  selectedHeadline?: number;
  selectedSubheadline?: number;
  selectedCta?: number;
}

export interface WhyDifferentSection {
  openingParagraphs: string[];
  comparisonBullets: string[];
  bridgeSentences: string[];
  selectedOpeningParagraph?: number;
  selectedBridgeSentence?: number;
}

export interface Benefit {
  title: string;
  description: string;
}

export interface BenefitsSection {
  benefits: Benefit[];
}

export interface Module {
  name: string;
  description: string;
}

export interface Bonus {
  name: string;
  value: string;
  description: string;
}

export interface OfferDetailsSection {
  introductions: string[];
  modules: Module[];
  bonuses: Bonus[];
  guarantees: string[];
  selectedIntroduction?: number;
  selectedGuarantee?: number;
}

export interface Testimonial {
  name: string;
  result: string;
  quote: string;
}

export interface TestimonialsSection {
  testimonials: Testimonial[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface FAQsSection {
  faqs: FAQ[];
}

export interface SalesPageCopyData {
  hero?: HeroSection;
  whyDifferent?: WhyDifferentSection;
  benefits?: BenefitsSection;
  offerDetails?: OfferDetailsSection;
  testimonials?: TestimonialsSection;
  faqs?: FAQsSection;
}

export type SectionType = 'hero' | 'whyDifferent' | 'benefits' | 'offerDetails' | 'testimonials' | 'faqs';

export const SECTION_CONFIG: Record<SectionType, { label: string; description: string }> = {
  hero: {
    label: 'Hero Section',
    description: 'Headlines, subheadlines, and call-to-action buttons'
  },
  whyDifferent: {
    label: 'Why This Is Different',
    description: 'Address what they\'ve tried and why this is better'
  },
  benefits: {
    label: 'Key Benefits',
    description: 'Core benefits and outcomes of your offer'
  },
  offerDetails: {
    label: 'What\'s Included',
    description: 'Modules, bonuses, and guarantees'
  },
  testimonials: {
    label: 'Testimonials',
    description: 'Sample testimonials as templates'
  },
  faqs: {
    label: 'FAQs',
    description: 'Common questions and objection handling'
  }
};

// Centralized definitions for marketing terms to help beginners understand key concepts

export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
}

export const MARKETING_GLOSSARY: Record<string, GlossaryTerm> = {
  // Funnel Types
  'funnel': {
    term: 'Funnel',
    definition: 'A step-by-step journey that guides potential customers from discovering you to making a purchase.',
    example: 'Someone sees your Instagram post → downloads your free guide → receives emails → buys your course.',
  },
  'lead-magnet': {
    term: 'Lead Magnet',
    definition: 'A free valuable resource you give away in exchange for someone\'s email address.',
    example: 'A free checklist, ebook, mini-course, or template.',
  },
  'tripwire': {
    term: 'Tripwire',
    definition: 'A low-priced offer (usually $7-$47) designed to convert a free subscriber into a paying customer.',
    example: 'After someone downloads your free guide, you offer them a $27 template bundle.',
  },
  'core-offer': {
    term: 'Core Offer',
    definition: 'Your main product or service - this is where most of your revenue comes from.',
    example: 'A $997 online course or a $2,500 coaching program.',
  },
  'upsell': {
    term: 'Upsell',
    definition: 'An additional offer presented after someone makes a purchase, usually enhancing what they just bought.',
    example: 'After buying a course, offering 1:1 coaching sessions as an add-on.',
  },
  'downsell': {
    term: 'Downsell',
    definition: 'A lower-priced alternative offered when someone doesn\'t buy your main offer.',
    example: 'If they don\'t buy your $997 course, offering a $197 self-paced version.',
  },

  // Audience Terms
  'niche': {
    term: 'Niche',
    definition: 'The specific market or industry you serve. The more specific, the easier it is to connect with your ideal customers.',
    example: 'Instead of "health," try "nutrition for busy working moms."',
  },
  'target-audience': {
    term: 'Target Audience',
    definition: 'The specific group of people you\'re trying to reach and help with your offer.',
    example: 'First-time entrepreneurs who are overwhelmed by marketing.',
  },
  'pain-point': {
    term: 'Pain Point',
    definition: 'A specific problem or frustration your target audience experiences that your offer solves.',
    example: 'Spending hours on social media with no engagement or leads.',
  },
  'desired-outcome': {
    term: 'Desired Outcome',
    definition: 'The result or transformation your audience wants to achieve - their dream state.',
    example: 'Having a consistent flow of qualified leads without spending all day on marketing.',
  },

  // Transformation & Messaging
  'transformation-statement': {
    term: 'Transformation Statement',
    definition: 'A clear, compelling sentence that shows the before/after journey your offer provides.',
    example: 'Go from confused and scattered to confident with a clear marketing plan.',
  },
  'value-equation': {
    term: 'Value Equation',
    definition: 'A framework for creating irresistible offers by maximizing perceived value and minimizing perceived effort.',
    example: 'Dream Outcome × Likelihood of Success ÷ (Time Delay × Effort Required).',
  },
  'objection': {
    term: 'Objection',
    definition: 'A reason someone might hesitate or say no to buying. Anticipating objections helps you address them.',
    example: '"I don\'t have time" or "I can\'t afford it" or "Will this work for me?"',
  },

  // Funnel Assets
  'opt-in-page': {
    term: 'Opt-in Page',
    definition: 'A simple webpage designed to capture email addresses, usually in exchange for a lead magnet.',
    example: 'A page with a headline, benefits, and an email signup form.',
  },
  'sales-page': {
    term: 'Sales Page',
    definition: 'A longer webpage that explains your offer in detail and persuades visitors to buy.',
    example: 'A page with testimonials, benefits, pricing, and a "Buy Now" button.',
  },
  'welcome-sequence': {
    term: 'Welcome Sequence',
    definition: 'A series of automated emails sent to new subscribers to introduce yourself and build a relationship.',
    example: '5 emails over 7 days sharing your story, value, and eventually your offer.',
  },
  'cart-close': {
    term: 'Cart Close',
    definition: 'The deadline when enrollment or a sale ends, creating urgency for potential buyers.',
    example: '"Doors close Friday at midnight" or "This offer expires in 48 hours."',
  },

  // Tech Stack
  'email-platform': {
    term: 'Email Platform',
    definition: 'Software that lets you collect emails, create lists, and send automated email sequences.',
    example: 'ConvertKit, Mailchimp, Flodesk, or ActiveCampaign.',
  },
  'funnel-platform': {
    term: 'Funnel Platform',
    definition: 'Software for building landing pages, sales pages, and checkout flows.',
    example: 'Kajabi, ClickFunnels, Systeme.io, or Carrd.',
  },
  'community-platform': {
    term: 'Community Platform',
    definition: 'A place where your customers or members can interact, ask questions, and get support.',
    example: 'Circle, Mighty Networks, Slack, or Facebook Groups.',
  },
};

// Helper function to get a term definition
export const getTermDefinition = (termKey: string): GlossaryTerm | undefined => {
  return MARKETING_GLOSSARY[termKey];
};

// Get all terms as an array
export const getAllTerms = (): GlossaryTerm[] => {
  return Object.values(MARKETING_GLOSSARY);
};

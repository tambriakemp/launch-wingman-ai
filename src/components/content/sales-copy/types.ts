// Types for Sales Page Copy feature - 14-Block Framework

export type PageType = 
  | 'freebie-optin' 
  | 'tripwire-sales' 
  | 'core-offer-sales' 
  | 'application-page'
  | 'membership-sales'
  | 'webinar-registration'
  | 'thank-you';

export type SectionGroup = 'beginning' | 'middle' | 'ending' | 'sprinkled';

export interface HeadlineFormula {
  template: string;
  example: string;
}

export interface SalesCopySection {
  id: string;
  label: string;
  description: string;
  whyItMatters: string;
  whatToDo: string;
  aiEnabled: boolean;
  group: SectionGroup;
  blockNumber: number;
  headlineFormulas?: HeadlineFormula[];
  questionPrompts?: string[]; // From 21 Questions
}

// 14-Block Sales Page Framework
export const SALES_PAGE_SECTIONS: SalesCopySection[] = [
  // THE BEGINNING (Blocks 1-3)
  {
    id: 'opening-headline',
    label: 'Opening Headline',
    description: 'The single most important sentence on your sales page',
    whyItMatters: 'This section sets the stage for the rest of your sales page. If you don\'t nail this, you risk losing your reader altogether. It must grab attention, get them to keep reading, and spark curiosity.',
    whatToDo: 'Speak to both the problem your ideal customer is experiencing AND the result they want to achieve.',
    aiEnabled: true,
    group: 'beginning',
    blockNumber: 1,
    headlineFormulas: [
      { template: '<Achieve outcome> in <timeframe> WITHOUT <biggest pain point>', example: 'Confidently create a gorgeous sales page in less than a week WITHOUT spending thousands of dollars on a team' },
      { template: 'Are you ready to <desired outcome>?', example: 'Are you ready to stop living your life on autopilot?' },
      { template: 'Learn the skills, strategies & tools you need to <outcome>', example: 'Learn the skills, strategies & tools you need to build a thriving business' },
      { template: 'Attention <ideal customer group>: <outcome> in <timeframe>', example: 'Attention Online Course Creators: Launch Your Signature Course in One Month' },
      { template: 'How to <desired result> with little or no previous experience', example: 'How to Write High-Converting Sales Copy with No Copywriting Background' },
    ],
    questionPrompts: [
      'Who is the ideal customer for this offer?',
      'What is a specific result your customer will experience?',
      'How quickly can they experience transformation?',
    ],
  },
  {
    id: 'paint-the-problem',
    label: 'Paint the Problem',
    description: 'Call out their frustrations and biggest pain points',
    whyItMatters: 'You\'re taking readers on an emotional journey by bringing up all the inner demons holding them back. This makes them feel understood and sets up the hope in the next section.',
    whatToDo: 'Point out your ideal customer\'s biggest problems and dig into why this is holding them back or hurting them.',
    aiEnabled: true,
    group: 'beginning',
    blockNumber: 2,
    headlineFormulas: [
      { template: 'You know you should <X>... but you have no clue where to begin.', example: 'You know you should be posting consistently... but you have no clue where to begin.' },
      { template: 'Does this sound familiar?', example: 'Does this sound familiar?' },
      { template: 'You know you need to be doing <X>, but you\'re feeling stuck, overwhelmed and distracted by all the options.', example: 'You know you need to be marketing your business, but you\'re feeling stuck, overwhelmed and distracted by all the options.' },
      { template: 'There are <#> huge mistakes I see when people try to <topic>', example: 'There are 5 huge mistakes I see when people try to grow their email list' },
    ],
    questionPrompts: [
      'What does their life/business currently look/feel like?',
      'What kinds of problems and frustrations are they dealing with everyday?',
      'What has stopped them from taking action towards their desired result in the past?',
    ],
  },
  {
    id: 'look-into-future',
    label: 'Look Into the Future',
    description: 'Help readers envision their possible future',
    whyItMatters: 'You want to show them what their life/business could look like after working with you. Give them hope that they can do this, with you by their side.',
    whatToDo: 'Paint a picture of where their life/business COULD BE. Use bullet points to keep things short, sweet and to the point.',
    aiEnabled: true,
    group: 'beginning',
    blockNumber: 3,
    headlineFormulas: [
      { template: 'Can you imagine how it would feel to <outcome>?', example: 'Can you imagine how it would feel to wake up to sales notifications every morning?' },
      { template: 'How would your <life/business> be different if you could:', example: 'How would your business be different if you could:' },
      { template: 'Imagine being able to <outcome> without <pain point>', example: 'Imagine being able to fill your calendar with dream clients without cold DMing strangers' },
    ],
    questionPrompts: [
      'What do they want their life/business to look/feel like?',
      'What would achieving their desired result help them do/be/achieve?',
      'Why do they want to experience this transformation?',
    ],
  },
  
  // THE MIDDLE (Blocks 4-8)
  {
    id: 'introduce-offer',
    label: 'Introduce Your Offer',
    description: 'The big reveal - introduce your offer and its core result',
    whyItMatters: 'It\'s time for the big unveil. This is where you share the core result your offer creates for your ideal customers.',
    whatToDo: 'Include your offer name, a subhead that shares the big promise, and consider adding your offer logo or mockup.',
    aiEnabled: true,
    group: 'middle',
    blockNumber: 4,
    headlineFormulas: [
      { template: 'Introducing, <offer name>\n<subhead with big promise>', example: 'Introducing, Slay Your Sales Page\nConfidently write your own high-converting sales page in just 7 days' },
    ],
    questionPrompts: [
      'What is the name of your offer?',
      'Why did you decide to create this offer?',
    ],
  },
  {
    id: 'offer-differentiator',
    label: 'Offer Differentiator',
    description: 'What makes your offer different from everything else',
    whyItMatters: 'Share your offer\'s unique selling points and the key differentiating factors that set you apart from your competitors.',
    whatToDo: 'Explain what makes your offer different from every other offer similar to yours. Highlight your unique approach.',
    aiEnabled: true,
    group: 'middle',
    blockNumber: 5,
    headlineFormulas: [
      { template: 'What makes <offer name> different?', example: 'What makes Slay Your Sales Page different?' },
      { template: 'Here\'s how <offer name> is different from other courses:', example: 'Here\'s how Slay Your Sales Page is different from other copywriting courses:' },
      { template: '<offer name> is the first of its kind that not only teaches you <X> but also <Y>', example: 'Slay Your Sales Page is the first of its kind that not only teaches you copywriting but also gives you fill-in-the-blank templates' },
    ],
    questionPrompts: [
      'What makes your offer unique from what\'s already out there?',
    ],
  },
  {
    id: 'the-results',
    label: 'The Results',
    description: 'Specific results they will achieve because of your offer',
    whyItMatters: 'Share what they will be able to do, learn or achieve. Include why that result is important with a "so that" statement.',
    whatToDo: 'Use action words to demonstrate results. Format: Learn how to [action] so that [outcome].',
    aiEnabled: true,
    group: 'middle',
    blockNumber: 6,
    headlineFormulas: [
      { template: 'You\'ll learn how to:', example: 'You\'ll learn how to:' },
      { template: 'By the end of this program, you\'ll be able to:', example: 'By the end of this program, you\'ll be able to:' },
      { template: 'This [workshop/course/program] will teach you how to:', example: 'This course will teach you how to:' },
    ],
    questionPrompts: [
      'What is a specific result your customer will experience because of your offer?',
    ],
  },
  {
    id: 'the-features',
    label: 'The Features',
    description: 'Break down exactly what\'s included inside your offer',
    whyItMatters: 'This is where you dig into the details of what they get. For each feature, include a tangible result they\'ll achieve.',
    whatToDo: 'List each component with its name, description, and the specific result it delivers.',
    aiEnabled: true,
    group: 'middle',
    blockNumber: 7,
    headlineFormulas: [
      { template: 'Here\'s what\'s inside:', example: 'Here\'s what\'s inside:' },
      { template: 'Here\'s what you\'re going to get:', example: 'Here\'s what you\'re going to get:' },
    ],
    questionPrompts: [
      'How long does it take to get through the offer?',
      'What\'s included in your offer? Is it broken up into phases, modules, weeks, or something else?',
      'For each part, what are the features that make up the part?',
      'Are there any bonuses included with purchase?',
      'What kind of support is included with your offer?',
    ],
  },
  {
    id: 'the-investment',
    label: 'The Investment',
    description: 'Show them the price with context and value',
    whyItMatters: 'Build up the value BEFORE telling the price. Without context, they\'ll only focus on cost rather than the immense value.',
    whatToDo: 'Stack the value first, then reveal the price. Include payment options if applicable.',
    aiEnabled: true,
    group: 'middle',
    blockNumber: 8,
    headlineFormulas: [
      { template: 'When you add that all up, it comes out to a value of <$XXX>, but you can enroll today for a special investment of <$XXX>.', example: 'When you add that all up, it comes out to a value of $2,497, but you can enroll today for a special investment of $497.' },
      { template: 'Get instant access to <offer name> for only $XX', example: 'Get instant access to Slay Your Sales Page for only $197' },
      { template: 'Are you ready to <big result>?', example: 'Are you ready to finally have a sales page that converts?' },
    ],
    questionPrompts: [
      'What is the price of your offer?',
      'Are there any payment plans?',
    ],
  },

  // THE ENDING (Blocks 9-14)
  {
    id: 'the-guarantee',
    label: 'The Guarantee',
    description: 'Put your reader\'s minds at rest with risk reversal',
    whyItMatters: 'The guarantee section helps readers feel confident about their purchase. Include it right under the pricing so they see it when weighing the investment.',
    whatToDo: 'Choose a guarantee length that allows customers to get good value and have a small win.',
    aiEnabled: true,
    group: 'ending',
    blockNumber: 9,
    headlineFormulas: [
      { template: 'We want you to be 100% confident when you enroll in <offer name>', example: 'We want you to be 100% confident when you enroll in Slay Your Sales Page' },
      { template: 'You\'re protected with our 100% risk-free money back guarantee', example: 'You\'re protected with our 100% risk-free money back guarantee' },
      { template: 'There\'s literally no risk involved, because you\'re backed by our <#>-day money back guarantee!', example: 'There\'s literally no risk involved, because you\'re backed by our 30-day money back guarantee!' },
      { template: 'Buy it, try it, apply it. You\'re backed by our 100% money back guarantee.', example: 'Buy it, try it, apply it. You\'re backed by our 100% money back guarantee.' },
    ],
    questionPrompts: [
      'Do you offer a guarantee for your offer?',
      'If so, describe exactly what someone would need to do in order to qualify for their money back.',
    ],
  },
  {
    id: 'introduce-yourself',
    label: 'Introduce Yourself',
    description: 'Tell them about you and why you\'re qualified to teach them',
    whyItMatters: 'This section builds trust by sharing your background, experience, and why you created this program.',
    whatToDo: 'Share your story, relate to their pain point, and include a photo of yourself.',
    aiEnabled: true,
    group: 'ending',
    blockNumber: 10,
    headlineFormulas: [
      { template: 'Meet <your name> - your new <fun title>!', example: 'Meet Sarah - your new sales page bestie!' },
      { template: 'I can\'t wait to meet you inside <offer name>!', example: 'I can\'t wait to meet you inside Slay Your Sales Page!' },
      { template: 'Hey, I\'m <name> and just <X> years ago, I <relate to pain point>', example: 'Hey, I\'m Sarah and just 3 years ago, I couldn\'t write a sales page to save my life' },
    ],
    questionPrompts: [],
  },
  {
    id: 'is-this-for-you',
    label: 'Is This For You?',
    description: 'Help readers decide if your offer is right for them',
    whyItMatters: 'Come from a genuine place of caring about their time and money. Help them make an empowered decision, not a convinced one.',
    whatToDo: 'List who this is PERFECT for and who it\'s NOT for. Be honest and specific.',
    aiEnabled: true,
    group: 'ending',
    blockNumber: 11,
    headlineFormulas: [
      { template: '<offer name> is PERFECT for you if...', example: 'Slay Your Sales Page is PERFECT for you if...' },
      { template: 'Is this right for you?', example: 'Is this right for you?' },
      { template: '<#> Ways to Know You\'re Ready to Achieve <outcome>', example: '5 Ways to Know You\'re Ready to Master Sales Page Copy' },
      { template: 'Not sure if <offer name> is right for you?', example: 'Not sure if Slay Your Sales Page is right for you?' },
    ],
    questionPrompts: [
      'Who is this offer perfect for? Describe the type of person that will especially benefit.',
    ],
  },
  {
    id: 'why-now',
    label: 'Why Now is the Time',
    description: 'Remind them why they need this NOW',
    whyItMatters: 'This is where you seal the deal. Remind them what their life will look like after working with you.',
    whatToDo: 'Create urgency by reminding them of the cost of waiting and the benefit of starting now.',
    aiEnabled: true,
    group: 'ending',
    blockNumber: 12,
    headlineFormulas: [
      { template: 'Don\'t let another year go by before you <outcome>. Here\'s why you need to get inside <offer name> today...', example: 'Don\'t let another year go by before you master your marketing. Here\'s why you need to get inside Slay Your Sales Page today...' },
      { template: 'If you\'ve made it this far...', example: 'If you\'ve made it this far...' },
    ],
    questionPrompts: [],
  },
  {
    id: 'frequent-objections',
    label: 'Frequent Objections (FAQ)',
    description: 'Address common questions and overcome objections',
    whyItMatters: 'This is your chance to sum up your sales page into common questions and overcome objections about joining.',
    whatToDo: 'Write down the BIGGEST objections readers might have. Your answers should guide them to overcome each one.',
    aiEnabled: true,
    group: 'ending',
    blockNumber: 13,
    headlineFormulas: [
      { template: 'What people asked before signing up for <offer name>', example: 'What people asked before signing up for Slay Your Sales Page' },
      { template: 'Top FAQs', example: 'Top FAQs' },
      { template: 'You have questions. I have answers.', example: 'You have questions. I have answers.' },
    ],
    questionPrompts: [
      'What are 5-7 objections your ideal customer will have before they purchase your offer?',
    ],
  },
  {
    id: 'final-cta',
    label: 'Final Call-to-Action',
    description: 'One final push to enroll/buy/purchase',
    whyItMatters: 'Catch readers who have read the whole page with one final push. They\'re clearly interested.',
    whatToDo: 'Include a headline, payment options, and buy button. Keep it simpler than the Investment section.',
    aiEnabled: true,
    group: 'ending',
    blockNumber: 14,
    headlineFormulas: [
      { template: 'Enroll in <offer name> today!', example: 'Enroll in Slay Your Sales Page today!' },
      { template: 'I\'m ready, <your name>!', example: 'I\'m ready, Sarah!' },
    ],
    questionPrompts: [],
  },
];

// Common objections to address in FAQ section
export const COMMON_OBJECTIONS = [
  'I can\'t afford this right now',
  'When I have more money I\'ll do this',
  'Do I really need to spend money on something like this?',
  'I\'m too busy to do this right now',
  'How much time is this going to take out of my week?',
  'I\'m afraid of signing up and then not having time to get results',
  'I\'m not sure I\'m at the right level yet to do this',
  'I\'ve signed up for programs like this before and they haven\'t worked',
];

// Funnel-specific section mappings
type FunnelSectionConfig = {
  included: string[];
  simplified?: string[]; // Sections that should be shorter/simpler
  excluded?: string[];
};

const FUNNEL_SECTION_CONFIGS: Record<string, FunnelSectionConfig> = {
  'freebie-optin': {
    included: ['opening-headline', 'paint-the-problem', 'look-into-future', 'introduce-offer', 'the-features', 'final-cta'],
    simplified: ['paint-the-problem', 'look-into-future'],
  },
  'webinar-registration': {
    included: ['opening-headline', 'paint-the-problem', 'look-into-future', 'introduce-offer', 'the-features', 'introduce-yourself', 'final-cta'],
    simplified: ['paint-the-problem', 'look-into-future'],
  },
  'tripwire-sales': {
    included: ['opening-headline', 'paint-the-problem', 'introduce-offer', 'the-features', 'the-investment', 'final-cta'],
    simplified: ['paint-the-problem'],
  },
  'core-offer-sales': {
    included: ['opening-headline', 'paint-the-problem', 'look-into-future', 'introduce-offer', 'offer-differentiator', 'the-results', 'the-features', 'the-investment', 'the-guarantee', 'introduce-yourself', 'is-this-for-you', 'why-now', 'frequent-objections', 'final-cta'],
  },
  'membership-sales': {
    included: ['opening-headline', 'paint-the-problem', 'look-into-future', 'introduce-offer', 'offer-differentiator', 'the-results', 'the-features', 'the-investment', 'the-guarantee', 'introduce-yourself', 'is-this-for-you', 'why-now', 'frequent-objections', 'final-cta'],
  },
  'application-page': {
    included: ['opening-headline', 'paint-the-problem', 'look-into-future', 'introduce-offer', 'offer-differentiator', 'the-results', 'introduce-yourself', 'is-this-for-you', 'frequent-objections', 'final-cta'],
    excluded: ['the-features', 'the-investment', 'the-guarantee', 'why-now'],
  },
  'thank-you': {
    included: ['opening-headline', 'the-features', 'final-cta'],
    simplified: ['opening-headline'],
  },
};

// Get sections for a specific funnel type and slot type
export function getSectionsForFunnelAndSlot(funnelType: string | null, slotType: string, price: number | null): SalesCopySection[] {
  // Determine page type based on slot and price
  let pageType: string;
  
  if (slotType === 'lead-magnet') {
    pageType = 'freebie-optin';
  } else if (slotType === 'tripwire' || (price !== null && price < 50)) {
    pageType = 'tripwire-sales';
  } else if (slotType === 'application') {
    pageType = 'application-page';
  } else {
    pageType = 'core-offer-sales';
  }
  
  const config = FUNNEL_SECTION_CONFIGS[pageType] || FUNNEL_SECTION_CONFIGS['core-offer-sales'];
  
  return SALES_PAGE_SECTIONS.filter(section => config.included.includes(section.id));
}

// Legacy function for backwards compatibility
export function getSectionsForOffer(slotType: string, price: number | null): SalesCopySection[] {
  return getSectionsForFunnelAndSlot(null, slotType, price);
}

// Group sections by their group type
export function getSectionsByGroup(sections: SalesCopySection[]): Record<SectionGroup, SalesCopySection[]> {
  return {
    beginning: sections.filter(s => s.group === 'beginning'),
    middle: sections.filter(s => s.group === 'middle'),
    ending: sections.filter(s => s.group === 'ending'),
    sprinkled: sections.filter(s => s.group === 'sprinkled'),
  };
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

// 21 Questions for sales page prep
export const TWENTY_ONE_QUESTIONS = [
  { number: 1, question: 'Who is the ideal customer for this offer?', category: 'audience' },
  { number: 2, question: 'What is a specific result your customer will experience because of your offer?', category: 'result' },
  { number: 3, question: 'How quickly can they experience transformation?', category: 'timeline' },
  { number: 4, question: 'Why do they want to experience this transformation?', category: 'motivation' },
  { number: 5, question: 'What has stopped them from taking action towards their desired result in the past?', category: 'blockers' },
  { number: 6, question: 'What does their life/business currently look/feel like?', category: 'current-state' },
  { number: 7, question: 'What kinds of problems and frustrations are they dealing with everyday?', category: 'pain' },
  { number: 8, question: 'What do they want their life/business to look/feel like?', category: 'desired-state' },
  { number: 9, question: 'What would achieving their desired result help them do/be/achieve?', category: 'outcomes' },
  { number: 10, question: 'What is the name of your offer?', category: 'offer' },
  { number: 11, question: 'Why did you decide to create this offer?', category: 'offer' },
  { number: 12, question: 'What makes your offer unique from what\'s already out there?', category: 'differentiator' },
  { number: 13, question: 'How long does it take to get through the offer?', category: 'offer' },
  { number: 14, question: 'What\'s included in your offer? Is it broken up into phases, modules, weeks, or something else?', category: 'features' },
  { number: 15, question: 'For each part, what are the features that make up the part?', category: 'features' },
  { number: 16, question: 'Are there any bonuses included with purchase?', category: 'bonuses' },
  { number: 17, question: 'What kind of support is included with your offer?', category: 'support' },
  { number: 18, question: 'What is the price of your offer? Are there any payment plans?', category: 'pricing' },
  { number: 19, question: 'Do you offer a guarantee? Describe what someone would need to do to qualify for their money back.', category: 'guarantee' },
  { number: 20, question: 'Who is this offer perfect for? Describe the type of person that will especially benefit.', category: 'ideal-fit' },
  { number: 21, question: 'What are 5-7 objections your ideal customer will have before they purchase?', category: 'objections' },
];

// Educational content about offer slot types and funnel-specific audio scripts

export interface SlotTypeEducation {
  term: string;
  whatItIs: string;
  howItsUsed: string;
  examples: string[];
}

export const SLOT_TYPE_EDUCATION: Record<string, SlotTypeEducation> = {
  'lead-magnet': {
    term: 'Lead Magnet',
    whatItIs: 'A free, high-value resource you offer in exchange for someone\'s email address. It\'s the first step in your relationship with a potential customer.',
    howItsUsed: 'Place it at the entry point of your funnel to attract your ideal audience. It should solve a specific, small problem that your paid offer addresses more comprehensively.',
    examples: ['PDF guides or ebooks', 'Checklists or cheat sheets', 'Templates or swipe files', 'Mini email courses', 'Free webinar recordings'],
  },
  'tripwire': {
    term: 'Tripwire',
    whatItIs: 'A low-priced offer (typically $7-$47) designed to convert a free subscriber into a paying customer. It\'s called a "tripwire" because once someone crosses the threshold of paying you, they\'re much more likely to buy again.',
    howItsUsed: 'Present it immediately after someone opts in for your lead magnet, usually on the thank-you page. It should deliver quick wins and build trust for your higher-priced offers.',
    examples: ['Template bundles', 'Workshop recordings', 'Mini-courses', 'Toolkit or resource packs', 'Quickstart guides'],
  },
  'core': {
    term: 'Core Offer',
    whatItIs: 'Your main product or service — this is where most of your revenue comes from. It delivers comprehensive transformation and is typically priced from $97 to $2,000+.',
    howItsUsed: 'This is what your entire funnel leads to. Everything else (lead magnet, tripwire, content) builds trust and prepares people to buy your core offer.',
    examples: ['Signature courses', 'Coaching programs', 'Group memberships', 'Done-for-you services', 'Comprehensive training programs'],
  },
  'upsell': {
    term: 'Upsell',
    whatItIs: 'An additional offer presented after someone makes a purchase, designed to enhance or accelerate their results. It\'s typically 30-50% of the original purchase price.',
    howItsUsed: 'Show it immediately after checkout (one-click add) or on the thank-you page. It should complement what they just bought, not replace it.',
    examples: ['Implementation support', 'Done-for-you templates', 'VIP access or coaching calls', 'Advanced training modules', 'Priority support'],
  },
  'downsell': {
    term: 'Downsell',
    whatItIs: 'A lower-priced alternative offered when someone doesn\'t buy your main offer. It\'s a way to still provide value and keep them in your ecosystem.',
    howItsUsed: 'Present it when someone declines your core offer or clicks "no thanks." It should be a simpler version that still delivers results.',
    examples: ['Self-paced versions', 'Payment plans', 'Lite or starter packages', 'DIY options', 'Entry-level memberships'],
  },
  'bonus': {
    term: 'Bonus',
    whatItIs: 'An added-value item included with your offer to increase perceived value and urgency. Bonuses can be time-limited to create scarcity.',
    howItsUsed: 'Stack bonuses on your sales page to make your offer irresistible. Early-bird bonuses reward fast action and increase conversion rates.',
    examples: ['Bonus training modules', 'Template libraries', '1:1 coaching calls', 'Community access', 'Exclusive resources'],
  },
};

// Voice scripts explaining offer slots in context of each funnel type
export const FUNNEL_OFFER_STACK_VOICE_SCRIPTS: Record<string, string> = {
  'freebie-funnel': `In a Freebie Funnel, your offer stack is beautifully simple. First, you have your Lead Magnet — this is the free resource you're giving away to capture emails. Think of it as your handshake with a new potential customer. Make it valuable enough that people are excited to give you their email. Then, optionally, you can add a Tripwire — a low-priced offer shown right after they sign up. This is your chance to turn a new subscriber into a paying customer while they're most engaged. Not every freebie funnel needs a tripwire, but it's a powerful way to offset your ad costs and build buyer momentum.`,

  'low-ticket-funnel': `Your Low-Ticket Funnel has three key offer slots working together. First, your Lead Magnet on the opt-in page attracts people with a free resource. Then comes your main Tripwire offer on the sales page — this is your star, a low-priced product that delivers real value and turns subscribers into customers. Finally, your Upsell offer appears after purchase, giving buyers a chance to go deeper with premium materials or support. The magic of this funnel is how each step builds on the last, increasing customer value with every click.`,

  'webinar-funnel': `In a Webinar Funnel, your offer stack centers around education and transformation. Your Lead Magnet is the webinar itself — people register to learn something valuable from you. During or after the webinar, you pitch your Core Offer — this is typically a higher-priced course, coaching program, or membership. For those who aren't ready for the full investment, you can offer a Downsell — a simpler, lower-priced alternative that still delivers results. This funnel works because you build trust through teaching before asking for the sale.`,

  'challenge-funnel': `A Challenge Funnel builds community and momentum over multiple days. Your Lead Magnet is the challenge registration itself — people join for free to participate. Through the challenge experience, you demonstrate your expertise and build relationships. At the end, you present your Core Offer — the next step for participants who want to continue working with you. You can also offer a VIP Upgrade during the challenge, giving participants access to additional support, live calls, or bonus materials for a small fee.`,

  'launch-funnel': `Your Launch Funnel creates excitement and urgency around a limited-time offer. Start with a Pre-Launch Lead Magnet — this builds your waitlist and warms up your audience before the cart opens. Your Core Offer is the main product you're launching, typically a course, program, or membership. Add Early Bird Bonuses to reward fast action during the first days. For those who need flexibility, offer a Downsell like a payment plan or lighter version. The open/close cart creates natural urgency that drives conversions.`,

  'membership-funnel': `In a Membership Funnel, you're building recurring revenue through ongoing value. Your Lead Magnet might be a free trial, sample content, or mini-course that demonstrates what members get. Your Core Offer is the membership itself — the monthly or annual subscription that delivers continuous value. As an Upsell, offer an Annual Plan at a discount — this improves retention and gives you revenue upfront. The key to this funnel is showing people the ongoing value they'll receive as a member.`,

  'application-funnel': `An Application Funnel is designed for high-ticket offers where you want to qualify leads before selling. Your Lead Magnet builds initial interest — this might be a free training, case study, or resource. Then, instead of a sales page, people complete an Application — this qualifies them and creates investment in the process. Your Core Offer is revealed during a sales call, where you present your premium coaching, done-for-you service, or high-ticket program. This funnel works because it filters for serious buyers and allows personalized conversations.`,

  'content_to_offer': `The Content to Offer path is the most direct approach — you create content that leads straight to your offer. Your Core Offer is front and center, whether it's a course, coaching, or product. Content acts as both your lead generation and nurture sequence, demonstrating your expertise while building trust. This path works especially well when you have an engaged audience already following your content.`,

  'freebie_email_offer': `This path uses a classic list-building approach. Your Lead Magnet is the entry point — a valuable free resource that captures emails. Then your Email Sequence nurtures new subscribers, building trust and demonstrating expertise over time. Finally, your Core Offer is presented to warmed-up subscribers who already know and trust you. This approach works well for building long-term customer relationships.`,

  'live_training_offer': `With Live Training to Offer, you lead with education. Your free live training — whether a webinar, workshop, or masterclass — is your Lead Magnet. During the training, you provide genuine value while naturally transitioning to your Core Offer. This approach works because people experience your teaching style before buying. Add urgency with limited-time bonuses for those who join during or right after the training.`,

  'application_call': `The Application to Call path qualifies high-ticket prospects before the sale. Your Lead Magnet attracts interest, then an Application filters for serious buyers and gathers information. On the Sales Call, you present your Core Offer — typically premium coaching, consulting, or done-for-you services. This path works best for offers priced at $2,000 or more, where personal conversations convert better than sales pages.`,

  'membership': `Your Membership path focuses on recurring revenue. Start with a Lead Magnet that gives people a taste of your membership value — maybe a free trial or sample content. Your Core Offer is the membership subscription itself. Consider offering both monthly and annual options, with the annual plan as an Upsell at a discounted rate. The key is demonstrating ongoing value that justifies the recurring investment.`,

  'challenge': `The Challenge path builds community and engagement over multiple days. Your Lead Magnet is the challenge registration — people join to participate in a focused experience. Through daily content and interaction, you build relationships and demonstrate results. At the end, your Core Offer is the natural next step for participants who want to continue their transformation with you.`,

  'launch': `The Launch path creates urgency through a limited-time cart open. Start by building your waitlist with a Lead Magnet before the launch. When the cart opens, present your Core Offer with clear enrollment dates. Early Bird Bonuses reward fast action, and the closing deadline creates urgency. This path works well for courses and programs where you want focused enrollment periods.`,
};

// Get the voice script for a specific funnel type
export function getOfferStackVoiceScript(funnelType: string): string {
  // Try the exact key first
  if (FUNNEL_OFFER_STACK_VOICE_SCRIPTS[funnelType]) {
    return FUNNEL_OFFER_STACK_VOICE_SCRIPTS[funnelType];
  }
  
  // Fallback to a generic script
  return `Your offer stack is the collection of products and services you'll offer in your funnel. Start with your Lead Magnet — the free resource that attracts your ideal audience. Then consider what paid offers naturally follow. Each offer should build on the last, guiding people toward your Core Offer — your main transformation. Take your time configuring each slot, and remember: you can always adjust as you learn what resonates with your audience.`;
}

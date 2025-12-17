export interface OfferSlotConfig {
  type: string;
  label: string;
  description: string;
  isRequired: boolean;
  recommendedOfferTypes: string[];
  priceRange?: string;
}

export interface AssetRequirement {
  id: string;
  category: 'pages' | 'emails' | 'content' | 'deliverables';
  title: string;
  description: string;
  linkedSection?: string; // Route to Launchely section
  offerSlotType?: string; // Which offer slot this relates to
}

export interface FunnelConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: string[];
  color: string;
  bgColor: string;
  offerSlots: OfferSlotConfig[];
  assets: AssetRequirement[];
}

export const FUNNEL_CONFIGS: Record<string, FunnelConfig> = {
  'freebie-funnel': {
    id: 'freebie-funnel',
    name: 'Freebie Funnel',
    description: 'Build your email list with a free lead magnet that converts to a low-ticket or core offer',
    icon: 'Gift',
    steps: ['Social/Ads Traffic', 'Opt-in Page', 'Lead Magnet Delivery', 'Welcome Sequence', 'Tripwire Offer (Optional)'],
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    offerSlots: [
      {
        type: 'lead-magnet',
        label: 'Lead Magnet',
        description: 'Free resource to capture emails',
        isRequired: true,
        recommendedOfferTypes: ['Ebook/Guide', 'Checklist', 'Template', 'Mini-Course'],
        priceRange: 'Free',
      },
      {
        type: 'tripwire',
        label: 'Tripwire (Optional)',
        description: 'Low-ticket offer on thank you page',
        isRequired: false,
        recommendedOfferTypes: ['Workshop Recording', 'Template Bundle', 'Mini-Course'],
        priceRange: '$7-$47',
      },
    ],
    assets: [
      { id: 'landing-page', category: 'pages', title: 'Opt-in Landing Page', description: 'Page to capture email signups', linkedSection: 'sales-copy', offerSlotType: 'lead-magnet' },
      { id: 'thank-you-page', category: 'pages', title: 'Thank You Page', description: 'Confirmation page with next steps', linkedSection: 'sales-copy', offerSlotType: 'lead-magnet' },
      { id: 'welcome-email', category: 'emails', title: 'Welcome Email', description: 'Immediate delivery of lead magnet', linkedSection: 'emails' },
      { id: 'nurture-sequence', category: 'emails', title: 'Nurture Sequence (3-5 emails)', description: 'Build relationship and introduce paid offer', linkedSection: 'emails' },
      { id: 'social-promo', category: 'content', title: 'Social Media Promo Posts', description: 'Posts promoting the freebie', linkedSection: 'content' },
      { id: 'lead-magnet-deliverable', category: 'deliverables', title: 'Lead Magnet File', description: 'The actual freebie content', linkedSection: 'deliverables', offerSlotType: 'lead-magnet' },
    ],
  },
  'low-ticket-funnel': {
    id: 'low-ticket-funnel',
    name: 'Low-Ticket Funnel',
    description: 'Convert leads to paying customers with an irresistible low-priced offer',
    icon: 'DollarSign',
    steps: ['Traffic Source', 'Opt-in Page', 'Sales Page', 'Checkout + Order Bump', 'Upsell Page', 'Confirmation'],
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    offerSlots: [
      {
        type: 'lead-magnet',
        label: 'Opt-in Page Offer',
        description: 'Free resource to capture emails on the opt-in page',
        isRequired: true,
        recommendedOfferTypes: ['Ebook/Guide', 'Checklist', 'Template', 'Cheat Sheet'],
        priceRange: 'Free',
      },
      {
        type: 'tripwire',
        label: 'Sales Page Offer',
        description: 'Main low-ticket product sold on the sales page',
        isRequired: true,
        recommendedOfferTypes: ['Workshop', 'Template Bundle', 'Mini-Course', 'Digital Product'],
        priceRange: '$17-$97',
      },
      {
        type: 'upsell',
        label: 'Upsell Page Offer',
        description: 'Additional offer presented after purchase',
        isRequired: false,
        recommendedOfferTypes: ['Implementation Guide', 'Done-For-You Templates', 'Bonus Training', 'Advanced Course'],
        priceRange: '$27-$197',
      },
    ],
    assets: [
      { id: 'opt-in-page', category: 'pages', title: 'Opt-in Page', description: 'Capture emails with freebie', linkedSection: 'sales-copy', offerSlotType: 'lead-magnet' },
      { id: 'thank-you-page', category: 'pages', title: 'Thank You / Confirmation Page', description: 'Confirmation after opt-in with next steps', linkedSection: 'sales-copy', offerSlotType: 'lead-magnet' },
      { id: 'sales-page', category: 'pages', title: 'Sales Page', description: 'Low-ticket offer sales page', linkedSection: 'sales-copy', offerSlotType: 'tripwire' },
      { id: 'checkout-page', category: 'pages', title: 'Checkout Page', description: 'Order form with bump offer', linkedSection: 'sales-copy', offerSlotType: 'tripwire' },
      { id: 'upsell-page', category: 'pages', title: 'Upsell Page', description: 'One-time offer after purchase', linkedSection: 'sales-copy', offerSlotType: 'upsell' },
      { id: 'welcome-email', category: 'emails', title: 'Welcome + Delivery Email', description: 'Deliver lead magnet', linkedSection: 'emails' },
      { id: 'sales-sequence', category: 'emails', title: 'Sales Sequence (3-5 emails)', description: 'Push to low-ticket offer', linkedSection: 'emails' },
      { id: 'purchase-confirmation', category: 'emails', title: 'Purchase Confirmation', description: 'Deliver product access', linkedSection: 'emails' },
      { id: 'social-content', category: 'content', title: 'Launch Content (5-7 posts)', description: 'Social posts for promotion', linkedSection: 'content' },
    ],
  },
  'webinar-funnel': {
    id: 'webinar-funnel',
    name: 'Webinar Funnel',
    description: 'Educate and pitch at scale with a live or evergreen webinar',
    icon: 'Video',
    steps: ['Registration Page', 'Thank You + Calendar', 'Reminder Emails', 'Live/Evergreen Webinar', 'Sales Page', 'Cart Close Sequence'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    offerSlots: [
      {
        type: 'lead-magnet',
        label: 'Webinar Registration',
        description: 'Free webinar as lead magnet',
        isRequired: true,
        recommendedOfferTypes: ['Live Webinar', 'Masterclass', 'Workshop'],
        priceRange: 'Free',
      },
      {
        type: 'core',
        label: 'Core Offer',
        description: 'Main offer pitched on webinar',
        isRequired: true,
        recommendedOfferTypes: ['Course', 'Program', 'Coaching Package'],
        priceRange: '$297-$2,000+',
      },
      {
        type: 'downsell',
        label: 'Downsell (Optional)',
        description: 'Lower-priced alternative for non-buyers',
        isRequired: false,
        recommendedOfferTypes: ['Self-Paced Course', 'Membership', 'Payment Plan'],
        priceRange: '$97-$497',
      },
    ],
    assets: [
      { id: 'registration-page', category: 'pages', title: 'Webinar Registration Page', description: 'Capture registrations', linkedSection: 'sales-copy', offerSlotType: 'lead-magnet' },
      { id: 'thank-you-page', category: 'pages', title: 'Registration Thank You', description: 'Confirmation with calendar add', linkedSection: 'sales-copy', offerSlotType: 'lead-magnet' },
      { id: 'sales-page', category: 'pages', title: 'Core Offer Sales Page', description: 'Full sales page for core offer', linkedSection: 'sales-copy', offerSlotType: 'core' },
      { id: 'replay-page', category: 'pages', title: 'Webinar Replay Page', description: 'For those who missed live', linkedSection: 'sales-copy', offerSlotType: 'lead-magnet' },
      { id: 'confirmation-email', category: 'emails', title: 'Registration Confirmation', description: 'Webinar details and link', linkedSection: 'emails' },
      { id: 'reminder-emails', category: 'emails', title: 'Reminder Emails (3)', description: '24hr, 1hr, starting now', linkedSection: 'emails' },
      { id: 'replay-email', category: 'emails', title: 'Replay Email', description: 'Link to replay', linkedSection: 'emails' },
      { id: 'cart-close-sequence', category: 'emails', title: 'Cart Close Sequence (3-5)', description: 'Urgency emails before close', linkedSection: 'emails' },
      { id: 'webinar-slides', category: 'deliverables', title: 'Webinar Slides', description: 'Presentation for the webinar', linkedSection: 'deliverables', offerSlotType: 'lead-magnet' },
      { id: 'promo-content', category: 'content', title: 'Webinar Promo Content', description: 'Social posts driving registrations', linkedSection: 'content' },
    ],
  },
  'challenge-funnel': {
    id: 'challenge-funnel',
    name: 'Challenge Funnel',
    description: 'Engage your audience with a multi-day challenge that leads to a core offer',
    icon: 'Trophy',
    steps: ['Registration Page', 'Welcome + Prep', 'Daily Challenge Content', 'Community Engagement', 'Pitch Sequence', 'Sales Page'],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    offerSlots: [
      {
        type: 'lead-magnet',
        label: 'Challenge Registration',
        description: 'Free challenge signup',
        isRequired: true,
        recommendedOfferTypes: ['5-Day Challenge', '7-Day Challenge', '21-Day Challenge'],
        priceRange: 'Free',
      },
      {
        type: 'core',
        label: 'Core Offer',
        description: 'Offer pitched at end of challenge',
        isRequired: true,
        recommendedOfferTypes: ['Course', 'Program', 'Coaching'],
        priceRange: '$297-$2,000+',
      },
      {
        type: 'upsell',
        label: 'VIP Upgrade (Optional)',
        description: 'Premium challenge experience',
        isRequired: false,
        recommendedOfferTypes: ['Live Q&A Access', 'Bonus Materials', 'Community Access'],
        priceRange: '$27-$97',
      },
    ],
    assets: [
      { id: 'registration-page', category: 'pages', title: 'Challenge Registration Page', description: 'Sign up for the challenge', linkedSection: 'sales-copy', offerSlotType: 'lead-magnet' },
      { id: 'challenge-hub', category: 'pages', title: 'Challenge Hub/Portal', description: 'Daily content access area', linkedSection: 'sales-copy', offerSlotType: 'lead-magnet' },
      { id: 'sales-page', category: 'pages', title: 'Core Offer Sales Page', description: 'Pitch page for main offer', linkedSection: 'sales-copy', offerSlotType: 'core' },
      { id: 'welcome-email', category: 'emails', title: 'Welcome + Day 0 Email', description: 'Challenge prep and expectations', linkedSection: 'emails' },
      { id: 'daily-emails', category: 'emails', title: 'Daily Challenge Emails', description: 'One email per challenge day', linkedSection: 'emails' },
      { id: 'pitch-emails', category: 'emails', title: 'Pitch Sequence (3-5)', description: 'Emails promoting core offer', linkedSection: 'emails' },
      { id: 'daily-content', category: 'content', title: 'Daily Challenge Content', description: 'Videos/posts for each day', linkedSection: 'content' },
      { id: 'community-posts', category: 'content', title: 'Community Engagement Posts', description: 'Keep participants engaged', linkedSection: 'content' },
      { id: 'challenge-workbook', category: 'deliverables', title: 'Challenge Workbook', description: 'Accompanying PDF workbook', linkedSection: 'deliverables', offerSlotType: 'lead-magnet' },
    ],
  },
  'launch-funnel': {
    id: 'launch-funnel',
    name: 'Launch Funnel',
    description: 'Open/close cart launch with urgency and scarcity',
    icon: 'Rocket',
    steps: ['Waitlist/Pre-Launch', 'Pre-Launch Content', 'Cart Open Announcement', 'Sales Page', 'Cart Close Urgency', 'Onboarding'],
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    offerSlots: [
      {
        type: 'lead-magnet',
        label: 'Pre-Launch Lead Magnet',
        description: 'Build list before launch',
        isRequired: true,
        recommendedOfferTypes: ['Waitlist', 'Free Training', 'Ebook'],
        priceRange: 'Free',
      },
      {
        type: 'core',
        label: 'Core Launch Offer',
        description: 'Main product being launched',
        isRequired: true,
        recommendedOfferTypes: ['Course', 'Program', 'Membership', 'Coaching'],
        priceRange: '$297-$5,000+',
      },
      {
        type: 'bonus',
        label: 'Early Bird Bonus',
        description: 'Incentive for fast action',
        isRequired: false,
        recommendedOfferTypes: ['Bonus Training', 'Templates', '1:1 Call'],
        priceRange: 'Included',
      },
      {
        type: 'downsell',
        label: 'Downsell / Payment Plan',
        description: 'Alternative for price objections',
        isRequired: false,
        recommendedOfferTypes: ['Payment Plan', 'Lite Version', 'Self-Paced Option'],
        priceRange: 'Varies',
      },
    ],
    assets: [
      { id: 'waitlist-page', category: 'pages', title: 'Waitlist/Pre-Launch Page', description: 'Build anticipation and capture leads', linkedSection: 'sales-copy', offerSlotType: 'lead-magnet' },
      { id: 'sales-page', category: 'pages', title: 'Sales Page', description: 'Main launch sales page', linkedSection: 'sales-copy', offerSlotType: 'core' },
      { id: 'checkout-page', category: 'pages', title: 'Checkout Page', description: 'Purchase flow', linkedSection: 'sales-copy', offerSlotType: 'core' },
      { id: 'thank-you-page', category: 'pages', title: 'Purchase Thank You', description: 'Welcome new customers', linkedSection: 'sales-copy', offerSlotType: 'core' },
      { id: 'waitlist-emails', category: 'emails', title: 'Waitlist Nurture (3-5)', description: 'Build excitement pre-launch', linkedSection: 'emails' },
      { id: 'launch-sequence', category: 'emails', title: 'Launch Sequence (7-10)', description: 'Cart open to close emails', linkedSection: 'emails' },
      { id: 'onboarding-emails', category: 'emails', title: 'Onboarding Sequence', description: 'Welcome new customers', linkedSection: 'emails' },
      { id: 'prelaunch-content', category: 'content', title: 'Pre-Launch Content (10-15)', description: 'Warm up your audience', linkedSection: 'content' },
      { id: 'launch-content', category: 'content', title: 'Launch Week Content (7-10)', description: 'Daily launch posts', linkedSection: 'content' },
      { id: 'core-deliverable', category: 'deliverables', title: 'Core Product Deliverables', description: 'The actual product content', linkedSection: 'deliverables', offerSlotType: 'core' },
    ],
  },
  'membership-funnel': {
    id: 'membership-funnel',
    name: 'Membership Funnel',
    description: 'Build recurring revenue with a membership or subscription offer',
    icon: 'Users',
    steps: ['Lead Magnet', 'Nurture Sequence', 'Sales Page', 'Checkout', 'Member Portal', 'Retention Loop'],
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    offerSlots: [
      {
        type: 'lead-magnet',
        label: 'Lead Magnet',
        description: 'Free resource to capture emails',
        isRequired: true,
        recommendedOfferTypes: ['Free Trial', 'Sample Content', 'Mini-Course'],
        priceRange: 'Free',
      },
      {
        type: 'core',
        label: 'Membership',
        description: 'Recurring subscription offer',
        isRequired: true,
        recommendedOfferTypes: ['Monthly Membership', 'Quarterly Membership', 'Annual Membership'],
        priceRange: '$27-$297/month',
      },
      {
        type: 'upsell',
        label: 'Annual Upgrade',
        description: 'Discounted annual option',
        isRequired: false,
        recommendedOfferTypes: ['Annual Plan', 'Lifetime Access'],
        priceRange: '$297-$2,000',
      },
    ],
    assets: [
      { id: 'opt-in-page', category: 'pages', title: 'Lead Magnet Page', description: 'Capture leads with freebie', linkedSection: 'sales-copy', offerSlotType: 'lead-magnet' },
      { id: 'sales-page', category: 'pages', title: 'Membership Sales Page', description: 'Sell the membership', linkedSection: 'sales-copy', offerSlotType: 'core' },
      { id: 'member-portal', category: 'pages', title: 'Member Portal', description: 'Where members access content', linkedSection: 'sales-copy', offerSlotType: 'core' },
      { id: 'welcome-email', category: 'emails', title: 'Welcome Sequence', description: 'Onboard new members', linkedSection: 'emails' },
      { id: 'nurture-sequence', category: 'emails', title: 'Nurture to Membership', description: 'Convert leads to members', linkedSection: 'emails' },
      { id: 'retention-emails', category: 'emails', title: 'Retention Emails', description: 'Keep members engaged', linkedSection: 'emails' },
      { id: 'ongoing-content', category: 'content', title: 'Monthly Content Plan', description: 'Regular member content', linkedSection: 'content' },
      { id: 'member-content', category: 'deliverables', title: 'Member Resources', description: 'Core membership content', linkedSection: 'deliverables', offerSlotType: 'core' },
    ],
  },
  'application-funnel': {
    id: 'application-funnel',
    name: 'Application Funnel',
    description: 'Qualify high-ticket clients with an application process',
    icon: 'ClipboardCheck',
    steps: ['Value Content', 'Application Page', 'Call Booking', 'Discovery Call', 'Proposal/Close'],
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    offerSlots: [
      {
        type: 'lead-magnet',
        label: 'Value-First Content',
        description: 'Free content that qualifies leads',
        isRequired: true,
        recommendedOfferTypes: ['Case Study', 'Webinar', 'Strategy Guide'],
        priceRange: 'Free',
      },
      {
        type: 'core',
        label: 'High-Ticket Offer',
        description: 'Main coaching/consulting offer',
        isRequired: true,
        recommendedOfferTypes: ['1:1 Coaching', 'Done-For-You Service', 'Mastermind'],
        priceRange: '$2,000-$25,000+',
      },
    ],
    assets: [
      { id: 'content-page', category: 'pages', title: 'Value Content Page', description: 'Case study or free training', linkedSection: 'sales-copy', offerSlotType: 'lead-magnet' },
      { id: 'application-page', category: 'pages', title: 'Application Page', description: 'Qualify potential clients', linkedSection: 'sales-copy', offerSlotType: 'core' },
      { id: 'booking-page', category: 'pages', title: 'Call Booking Page', description: 'Schedule discovery calls', linkedSection: 'sales-copy', offerSlotType: 'core' },
      { id: 'application-received', category: 'emails', title: 'Application Received', description: 'Confirm submission', linkedSection: 'emails' },
      { id: 'call-reminder', category: 'emails', title: 'Call Reminder Sequence', description: 'Prep for discovery call', linkedSection: 'emails' },
      { id: 'follow-up', category: 'emails', title: 'Follow-Up Sequence', description: 'After call follow-up', linkedSection: 'emails' },
      { id: 'authority-content', category: 'content', title: 'Authority Content', description: 'Establish expertise', linkedSection: 'content' },
    ],
  },
};

export const OFFER_TYPES = [
  'Ebook/Guide',
  'Checklist',
  'Template',
  'Template Bundle',
  'Mini-Course',
  'Workshop',
  'Workshop Recording',
  'Live Webinar',
  'Masterclass',
  'Course',
  'Program',
  'Coaching Package',
  '1:1 Coaching',
  'Group Coaching',
  'Membership',
  'Mastermind',
  'Done-For-You Service',
  'Implementation Guide',
  'Bonus Training',
  'Community Access',
];

export const SLOT_TYPE_COLORS: Record<string, string> = {
  'lead-magnet': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'tripwire': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'core': 'bg-primary/10 text-primary border-primary/20',
  'upsell': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'downsell': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'bonus': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
};

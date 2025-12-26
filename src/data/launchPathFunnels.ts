// Funnel step configurations for each launch path option
// Used in the "Choose how you'll sell" task to show visual funnel diagrams

export interface LaunchPathFunnelConfig {
  steps: string[];
  color: string;
  bgColor: string;
  offerSlots: string;
}

export const LAUNCH_PATH_FUNNEL_STEPS: Record<string, LaunchPathFunnelConfig> = {
  content_to_offer: {
    steps: ['Social/Content', 'Audience Engagement', 'Direct Offer', 'Purchase'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    offerSlots: '1 core offer',
  },
  freebie_email_offer: {
    steps: ['Social/Ads Traffic', 'Opt-in Page', 'Lead Magnet Delivery', 'Welcome Sequence', 'Tripwire Offer (Optional)'],
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    offerSlots: '1 lead magnet + 1 optional tripwire',
  },
  live_training_offer: {
    steps: ['Registration Page', 'Thank You + Calendar', 'Reminder Emails', 'Live/Evergreen Training', 'Sales Page'],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    offerSlots: '1 webinar + 1 core offer',
  },
  application_call: {
    steps: ['Lead Magnet or Content', 'Application Page', 'Application Review', 'Discovery Call', 'Enrollment'],
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    offerSlots: '1 lead magnet + 1 high-ticket offer',
  },
  membership: {
    steps: ['Lead Magnet or Content', 'Nurture Sequence', 'Membership Sales Page', 'Member Onboarding', 'Ongoing Value'],
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    offerSlots: '1 lead magnet + 1 recurring membership',
  },
};

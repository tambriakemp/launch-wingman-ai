export interface TimelineTemplate {
  phase: string;
  day_number: number;
  time_of_day: 'morning' | 'evening';
  template_type: string;
  content_type: string;
  title_template: string;
  description_template: string;
}

// Pre-Launch content templates based on the Beginner Launch Content Planner
// Each week follows a pattern: High-Value → Story → Testimonial → Value + Live → Engagement → Story → Value
const PRE_LAUNCH_WEEK_PATTERN: Omit<TimelineTemplate, 'phase'>[] = [
  {
    day_number: 1,
    time_of_day: 'morning',
    template_type: 'high-value',
    content_type: 'general',
    title_template: 'Quick tip or insight about [topic]',
    description_template: 'Share a valuable tip that solves a specific problem your audience faces. Make it actionable and immediately useful.',
  },
  {
    day_number: 2,
    time_of_day: 'morning',
    template_type: 'story',
    content_type: 'behind-the-scenes',
    title_template: 'Your journey or experience with [topic]',
    description_template: 'Share a personal story that connects with your audience. Be vulnerable and authentic about challenges or lessons learned.',
  },
  {
    day_number: 3,
    time_of_day: 'morning',
    template_type: 'testimonial',
    content_type: 'offer',
    title_template: 'Client success or transformation story',
    description_template: 'Share a testimonial, case study, or transformation from someone who got results. Focus on the before/after.',
  },
  {
    day_number: 4,
    time_of_day: 'morning',
    template_type: 'high-value',
    content_type: 'general',
    title_template: 'Educational content or how-to',
    description_template: 'Teach something valuable that positions you as an expert. Break down a concept or share a mini-tutorial.',
  },
  {
    day_number: 4,
    time_of_day: 'evening',
    template_type: 'live',
    content_type: 'stories',
    title_template: 'Live Q&A or training session',
    description_template: 'Go live to connect directly with your audience. Answer questions, share insights, or do a mini-training.',
  },
  {
    day_number: 5,
    time_of_day: 'morning',
    template_type: 'engagement',
    content_type: 'stories',
    title_template: 'Question or poll for your audience',
    description_template: 'Ask a thought-provoking question or create a poll to boost engagement and learn about your audience.',
  },
  {
    day_number: 6,
    time_of_day: 'morning',
    template_type: 'story',
    content_type: 'behind-the-scenes',
    title_template: 'Behind-the-scenes or day in the life',
    description_template: 'Show what goes on behind the scenes. Share your process, workspace, or a day in your life.',
  },
  {
    day_number: 7,
    time_of_day: 'morning',
    template_type: 'high-value',
    content_type: 'general',
    title_template: 'Myth-busting or perspective shift',
    description_template: 'Challenge a common misconception in your industry or share a unique perspective that makes people think.',
  },
];

// Launch week has a different pattern: Create Buzz → Sum Up + Share Offer
const LAUNCH_WEEK_TEMPLATES: TimelineTemplate[] = [
  // Day 1
  {
    phase: 'launch',
    day_number: 1,
    time_of_day: 'morning',
    template_type: 'buzz',
    content_type: 'offer',
    title_template: 'Doors are OPEN! Announcement post',
    description_template: 'The big reveal! Announce that your offer is now available. Create excitement and urgency.',
  },
  {
    phase: 'launch',
    day_number: 1,
    time_of_day: 'evening',
    template_type: 'offer-summary',
    content_type: 'stories',
    title_template: 'Day 1 recap + offer reminder',
    description_template: 'Share stories about day 1 excitement, early sign-ups, and remind people about the offer.',
  },
  // Day 2
  {
    phase: 'launch',
    day_number: 2,
    time_of_day: 'morning',
    template_type: 'testimonial',
    content_type: 'offer',
    title_template: 'Testimonial or case study spotlight',
    description_template: 'Share a powerful testimonial or result to build social proof during launch.',
  },
  {
    phase: 'launch',
    day_number: 2,
    time_of_day: 'evening',
    template_type: 'faq',
    content_type: 'stories',
    title_template: 'Answer common questions',
    description_template: 'Address FAQs and objections through stories. Help fence-sitters make a decision.',
  },
  // Day 3
  {
    phase: 'launch',
    day_number: 3,
    time_of_day: 'morning',
    template_type: 'behind-scenes',
    content_type: 'behind-the-scenes',
    title_template: 'Behind the scenes of the launch',
    description_template: 'Show the human side of your launch. Share the energy, the team, or your own experience.',
  },
  {
    phase: 'launch',
    day_number: 3,
    time_of_day: 'evening',
    template_type: 'buzz',
    content_type: 'stories',
    title_template: 'Enrollment updates + urgency',
    description_template: 'Share updates on how the launch is going. Create urgency about limited spots or time.',
  },
  // Day 4 (Final Day)
  {
    phase: 'launch',
    day_number: 4,
    time_of_day: 'morning',
    template_type: 'fomo',
    content_type: 'offer',
    title_template: 'Last chance - Doors closing soon!',
    description_template: 'Create urgency for the final push. Remind people this is their last chance to join.',
  },
  {
    phase: 'launch',
    day_number: 4,
    time_of_day: 'evening',
    template_type: 'final-call',
    content_type: 'stories',
    title_template: 'Final hours countdown',
    description_template: 'The final countdown! Multiple stories/posts reminding people doors are closing.',
  },
];

// Generate full template list for all phases
export const TIMELINE_TEMPLATES: TimelineTemplate[] = [
  // Pre-Launch Week 1
  ...PRE_LAUNCH_WEEK_PATTERN.map(t => ({ ...t, phase: 'pre-launch-week-1' })),
  // Pre-Launch Week 2
  ...PRE_LAUNCH_WEEK_PATTERN.map(t => ({ ...t, phase: 'pre-launch-week-2' })),
  // Pre-Launch Week 3
  ...PRE_LAUNCH_WEEK_PATTERN.map(t => ({ ...t, phase: 'pre-launch-week-3' })),
  // Pre-Launch Week 4
  ...PRE_LAUNCH_WEEK_PATTERN.map(t => ({ ...t, phase: 'pre-launch-week-4' })),
  // Launch Week
  ...LAUNCH_WEEK_TEMPLATES,
];

// Get templates for a specific phase
export const getPhaseTemplates = (phase: string): TimelineTemplate[] => {
  return TIMELINE_TEMPLATES.filter(t => t.phase === phase);
};

// Get templates for a specific day within a phase
export const getDayTemplates = (phase: string, dayNumber: number): TimelineTemplate[] => {
  return TIMELINE_TEMPLATES.filter(t => t.phase === phase && t.day_number === dayNumber);
};

// Get a single template by phase, day, and time
export const getTemplate = (
  phase: string, 
  dayNumber: number, 
  timeOfDay: 'morning' | 'evening'
): TimelineTemplate | undefined => {
  return TIMELINE_TEMPLATES.find(
    t => t.phase === phase && t.day_number === dayNumber && t.time_of_day === timeOfDay
  );
};

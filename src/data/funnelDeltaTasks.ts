/**
 * Funnel Delta Task System
 * 
 * This file defines the delta tasks that are injected for specific funnel types.
 * Delta tasks are ONLY for Build, Content, and Launch phases.
 * Planning, Messaging, and Post-Launch are ALWAYS universal.
 */

import { TaskTemplate, FunnelType } from '@/types/tasks';

// ============================================
// FREEBIE EMAIL OFFER DELTA TASKS
// ============================================
// Path: Freebie → Email nurture → Offer

export const FREEBIE_EMAIL_OFFER_DELTA_TASKS: TaskTemplate[] = [
  // BUILD Phase Additions
  {
    taskId: 'build_create_freebie',
    title: 'Create your free resource (minimum version)',
    phase: 'build',
    funnelTypes: ['freebie_email_offer'],
    order: 1.5, // Insert after build_choose_platform (order 1)
    priority: 1,
    estimatedMinutesMin: 30,
    estimatedMinutesMax: 60,
    blocking: true,
    dependencies: ['build_choose_platform'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your freebie exists and is ready to share',
      'It provides genuine value to your audience',
    ],
    whyItMatters: 'Your freebie is what brings people into your world. It should solve a real problem for your audience and give them a taste of what working with you is like.',
    instructions: [
      'Create a simple resource that solves one specific problem',
      'Keep it focused — a PDF, checklist, or short guide works well',
      'Make sure it connects naturally to your paid offer',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'freebie_name', label: 'What is your freebie called?', type: 'text', required: true, placeholder: 'e.g., The 5-Step Morning Routine Checklist' },
        { name: 'freebie_format', label: 'What format is it?', type: 'select', required: true, placeholder: 'Choose one...' },
        { name: 'freebie_problem', label: 'What problem does it solve?', type: 'textarea', required: true, placeholder: 'Describe the specific problem your freebie helps with...' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/build_create_freebie',
  },
  {
    taskId: 'build_freebie_delivery',
    title: 'Set up freebie access',
    phase: 'build',
    funnelTypes: ['freebie_email_offer'],
    order: 1.6,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['build_create_freebie'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'People can sign up and receive your freebie automatically',
      'You\'ve tested the delivery process',
    ],
    whyItMatters: 'Setting up delivery ensures your freebie reaches people automatically when they sign up. This builds trust and starts the relationship.',
    instructions: [
      'Set up a landing page or form for signups',
      'Connect your email platform to deliver the freebie',
      'Test the entire flow yourself',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'signup_form_ready', label: 'Signup form/page ready', description: 'People can enter their email to get the freebie' },
        { value: 'delivery_connected', label: 'Delivery connected', description: 'The freebie is sent automatically after signup' },
        { value: 'tested_flow', label: 'Tested the full flow', description: 'I\'ve signed up myself and received the freebie' },
      ],
    },
    aiAssistModes: ['simplify', 'help_me_choose'],
    route: '/projects/:id/tasks/build_freebie_delivery',
  },

  // CONTENT Phase Additions
  {
    taskId: 'content_freebie_invitation',
    title: 'Write your freebie invitation',
    phase: 'content',
    funnelTypes: ['freebie_email_offer'],
    order: 0.5, // Insert before content_choose_platforms
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['build_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a clear way to invite people to get your freebie',
      'The invitation feels helpful, not pushy',
    ],
    whyItMatters: 'Your freebie invitation is how people discover your free resource. It should clearly communicate the value and make signing up feel like an obvious choice.',
    instructions: [
      'Write a simple description of what they\'ll get',
      'Focus on the problem it solves',
      'Include a clear call to action',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'invitation_headline', label: 'Headline for your freebie invitation', type: 'text', required: true, placeholder: 'e.g., Get my free [resource name]' },
        { name: 'invitation_body', label: 'Body text (2-3 sentences)', type: 'textarea', required: true, placeholder: 'Describe what they\'ll get and why it matters...' },
        { name: 'invitation_cta', label: 'Call to action', type: 'text', required: true, placeholder: 'e.g., Download now, Get instant access' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/content_freebie_invitation',
  },

  // LAUNCH Phase Additions
  {
    taskId: 'launch_invite_subscribers',
    title: 'Invite subscribers to your offer',
    phase: 'launch',
    funnelTypes: ['freebie_email_offer'],
    order: 3.5, // After launch_share_offer
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['launch_share_offer'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your email subscribers have been invited to your offer',
      'The invitation feels natural and supportive',
    ],
    whyItMatters: 'Your email subscribers already trust you. Inviting them to your offer is a natural next step in the relationship you\'ve been building.',
    instructions: [
      'Write a simple email inviting subscribers to your offer',
      'Reference the freebie they received',
      'Connect it to the transformation your offer provides',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'email_drafted', label: 'Offer email drafted', description: 'I\'ve written the email invitation' },
        { value: 'email_sent', label: 'Email sent to subscribers', description: 'My subscribers have received the invitation' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/launch_invite_subscribers',
  },
];

// ============================================
// LIVE TRAINING OFFER DELTA TASKS
// ============================================
// Path: Live training/webinar → Offer

export const LIVE_TRAINING_OFFER_DELTA_TASKS: TaskTemplate[] = [
  // BUILD Phase Additions
  {
    taskId: 'build_prepare_training',
    title: 'Prepare your live training',
    phase: 'build',
    funnelTypes: ['live_training_offer'],
    order: 1.5,
    priority: 1,
    estimatedMinutesMin: 30,
    estimatedMinutesMax: 60,
    blocking: true,
    dependencies: ['build_choose_platform'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a clear outline for your training',
      'You know what you\'ll teach and how it connects to your offer',
    ],
    whyItMatters: 'Your live training is where you provide value and build trust. A clear outline helps you teach confidently and transition naturally to your offer.',
    instructions: [
      'Create a simple outline of what you\'ll cover',
      'Focus on teaching something valuable and actionable',
      'Plan how your training leads to your offer',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'training_title', label: 'What will you call your training?', type: 'text', required: true, placeholder: 'e.g., How to [achieve outcome] in [timeframe]' },
        { name: 'training_outline', label: 'Main topics you\'ll cover', type: 'textarea', required: true, placeholder: 'List 3-5 main points or sections...' },
        { name: 'training_to_offer', label: 'How does this lead to your offer?', type: 'textarea', required: true, placeholder: 'Describe the natural connection...' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/build_prepare_training',
  },
  {
    taskId: 'build_training_registration',
    title: 'Set up training registration',
    phase: 'build',
    funnelTypes: ['live_training_offer'],
    order: 1.6,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 45,
    blocking: true,
    dependencies: ['build_prepare_training'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'People can register for your training',
      'You can collect their email addresses',
    ],
    whyItMatters: 'Registration lets you know who\'s coming and gives you a way to follow up with attendees before and after your training.',
    instructions: [
      'Create a simple registration page',
      'Include the date, time, and topic',
      'Connect it to your email platform',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'registration_page_ready', label: 'Registration page ready', description: 'People can sign up for the training' },
        { value: 'date_time_set', label: 'Date and time confirmed', description: 'I know when the training will happen' },
        { value: 'email_connected', label: 'Email collection set up', description: 'Registrants are added to my email list' },
      ],
    },
    aiAssistModes: ['simplify', 'help_me_choose'],
    route: '/projects/:id/tasks/build_training_registration',
  },

  // CONTENT Phase Additions
  {
    taskId: 'content_training_invitation',
    title: 'Write your training invitation',
    phase: 'content',
    funnelTypes: ['live_training_offer'],
    order: 0.5,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['build_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a clear invitation for your training',
      'People understand what they\'ll learn and why it matters',
    ],
    whyItMatters: 'Your training invitation needs to excite people about attending. Focus on the value they\'ll receive and the outcome they\'ll walk away with.',
    instructions: [
      'Write a compelling description of what they\'ll learn',
      'Include the transformation or outcome they\'ll get',
      'Make registering feel like an easy yes',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'invitation_headline', label: 'Headline for your training invitation', type: 'text', required: true, placeholder: 'e.g., Join me for a free training on...' },
        { name: 'invitation_body', label: 'What will they learn? (2-3 sentences)', type: 'textarea', required: true, placeholder: 'Describe the value and outcome...' },
        { name: 'invitation_cta', label: 'Call to action', type: 'text', required: true, placeholder: 'e.g., Reserve your spot, Save your seat' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/content_training_invitation',
  },

  // LAUNCH Phase Additions
  {
    taskId: 'launch_share_training_offer',
    title: 'Share your offer during training',
    phase: 'launch',
    funnelTypes: ['live_training_offer'],
    order: 3.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['launch_share_offer'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve planned how to present your offer during the training',
      'The transition feels natural, not salesy',
    ],
    whyItMatters: 'The live training is where you demonstrate your expertise. Presenting your offer as the natural next step helps attendees who want more from you.',
    instructions: [
      'Plan a brief, clear presentation of your offer',
      'Focus on the continued transformation, not features',
      'Make it easy for people to take the next step',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'offer_pitch_planned', label: 'Offer presentation planned', description: 'I know how I\'ll present my offer' },
        { value: 'transition_natural', label: 'Transition feels natural', description: 'The move from teaching to offering is smooth' },
        { value: 'next_step_clear', label: 'Next step is clear', description: 'Attendees know how to join or buy' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/launch_share_training_offer',
  },
];

// ============================================
// APPLICATION CALL DELTA TASKS
// ============================================
// Path: Application → Call → Offer

export const APPLICATION_CALL_DELTA_TASKS: TaskTemplate[] = [
  // BUILD Phase Additions
  {
    taskId: 'build_clarify_applicants',
    title: 'Clarify who should apply',
    phase: 'build',
    funnelTypes: ['application_call'],
    order: 1.5,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['build_choose_platform'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'re clear on who your ideal applicant is',
      'You can articulate who is NOT a good fit',
    ],
    whyItMatters: 'Clarity on your ideal applicant helps you attract the right people and have more productive conversations. It also helps people self-select.',
    instructions: [
      'Describe your ideal applicant in detail',
      'Identify who this is NOT for',
      'Think about readiness signals',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'ideal_applicant', label: 'Who is your ideal applicant?', type: 'textarea', required: true, placeholder: 'Describe the person who\'s ready for this...' },
        { name: 'not_a_fit', label: 'Who is this NOT for?', type: 'textarea', required: true, placeholder: 'Describe who shouldn\'t apply...' },
        { name: 'readiness_signals', label: 'What shows they\'re ready?', type: 'textarea', required: true, placeholder: 'What indicates they\'re a good fit?' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/build_clarify_applicants',
  },
  {
    taskId: 'build_application_form',
    title: 'Set up your application form',
    phase: 'build',
    funnelTypes: ['application_call'],
    order: 1.6,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 45,
    blocking: true,
    dependencies: ['build_clarify_applicants'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your application form is ready to receive submissions',
      'Questions help you qualify applicants',
    ],
    whyItMatters: 'Your application form is the first step in qualifying leads. Good questions help you understand who you\'re talking to before the call.',
    instructions: [
      'Create a simple form with 5-10 questions',
      'Focus on questions that reveal readiness',
      'Include a way to schedule a call',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'form_created', label: 'Application form created', description: 'The form exists and is accessible' },
        { value: 'qualifying_questions', label: 'Qualifying questions added', description: 'Questions help me understand fit' },
        { value: 'scheduling_ready', label: 'Call scheduling set up', description: 'Qualified applicants can book a call' },
      ],
    },
    aiAssistModes: ['simplify', 'help_me_choose'],
    route: '/projects/:id/tasks/build_application_form',
  },

  // CONTENT Phase Additions
  {
    taskId: 'content_application_invitation',
    title: 'Write your application invitation',
    phase: 'content',
    funnelTypes: ['application_call'],
    order: 0.5,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['build_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a clear way to invite people to apply',
      'The invitation creates the right expectations',
    ],
    whyItMatters: 'Your application invitation sets the tone for the entire process. It should feel exclusive but accessible to the right people.',
    instructions: [
      'Describe what they\'re applying for',
      'Be clear about who this is for',
      'Explain what happens after they apply',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'invitation_headline', label: 'Headline for your application invitation', type: 'text', required: true, placeholder: 'e.g., Apply to work with me...' },
        { name: 'invitation_body', label: 'What are they applying for? (2-3 sentences)', type: 'textarea', required: true, placeholder: 'Describe the opportunity and who it\'s for...' },
        { name: 'invitation_cta', label: 'Call to action', type: 'text', required: true, placeholder: 'e.g., Apply now, Submit your application' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/content_application_invitation',
  },

  // LAUNCH Phase Additions
  {
    taskId: 'launch_invite_conversations',
    title: 'Invite conversations',
    phase: 'launch',
    funnelTypes: ['application_call'],
    order: 3.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['launch_share_offer'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve made it clear that you\'re open to applications',
      'Qualified leads know how to start the conversation',
    ],
    whyItMatters: 'Launching an application-based offer is about starting the right conversations. Make it easy for qualified people to take the first step.',
    instructions: [
      'Share your application openly',
      'Make the process feel welcoming, not intimidating',
      'Follow up with applicants promptly',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'applications_open', label: 'Applications are open', description: 'I\'ve announced that I\'m accepting applications' },
        { value: 'process_clear', label: 'Process is clear', description: 'People know what to expect after applying' },
        { value: 'ready_to_respond', label: 'Ready to respond', description: 'I\'m prepared to follow up with applicants' },
      ],
    },
    aiAssistModes: ['simplify', 'reassurance'],
    route: '/projects/:id/tasks/launch_invite_conversations',
  },
];

// ============================================
// DELTA TASK CONFIGURATION
// ============================================

export interface FunnelDeltaConfig {
  funnelType: Exclude<FunnelType, 'all' | 'content_to_offer'>;
  deltaTasks: TaskTemplate[];
  modifiedTasks: TaskModification[];
}

export interface TaskModification {
  taskId: string;
  changes: Partial<Pick<TaskTemplate, 'title' | 'blocking' | 'whyItMatters' | 'instructions'>>;
}

// Define which universal tasks are modified for each funnel type
export const FUNNEL_DELTA_CONFIGS: FunnelDeltaConfig[] = [
  {
    funnelType: 'freebie_email_offer',
    deltaTasks: FREEBIE_EMAIL_OFFER_DELTA_TASKS,
    modifiedTasks: [
      {
        taskId: 'build_email_platform',
        changes: {
          blocking: true,
          whyItMatters: 'Since you\'re using a freebie to build your list, your email platform is essential. This is how you\'ll deliver the freebie and nurture subscribers toward your offer.',
        },
      },
      {
        taskId: 'launch_share_offer',
        changes: {
          title: 'Share your free resource',
          whyItMatters: 'This is the moment you invite people to get your freebie. Sharing it publicly is the first step in building your email list for this launch.',
        },
      },
    ],
  },
  {
    funnelType: 'live_training_offer',
    deltaTasks: LIVE_TRAINING_OFFER_DELTA_TASKS,
    modifiedTasks: [
      {
        taskId: 'launch_share_offer',
        changes: {
          title: 'Invite people to your training',
          whyItMatters: 'This is when you invite people to register for your live training. The training is where you\'ll teach and present your offer.',
        },
      },
    ],
  },
  {
    funnelType: 'application_call',
    deltaTasks: APPLICATION_CALL_DELTA_TASKS,
    modifiedTasks: [
      {
        taskId: 'launch_share_offer',
        changes: {
          title: 'Open applications',
          whyItMatters: 'This is when you let people know you\'re accepting applications. It\'s the beginning of the conversation that leads to your offer.',
        },
      },
    ],
  },
];

// Helper function to get delta config for a funnel type
export function getFunnelDeltaConfig(funnelType: FunnelType): FunnelDeltaConfig | null {
  if (funnelType === 'all' || funnelType === 'content_to_offer') {
    return null;
  }
  return FUNNEL_DELTA_CONFIGS.find(config => config.funnelType === funnelType) || null;
}

// Helper function to get all delta tasks for a funnel type
export function getDeltaTasksForFunnel(funnelType: FunnelType): TaskTemplate[] {
  const config = getFunnelDeltaConfig(funnelType);
  return config?.deltaTasks || [];
}

// Helper function to get task modifications for a funnel type
export function getTaskModificationsForFunnel(funnelType: FunnelType): TaskModification[] {
  const config = getFunnelDeltaConfig(funnelType);
  return config?.modifiedTasks || [];
}

// Phases where injection is allowed
export const INJECTION_ALLOWED_PHASES = ['build', 'content', 'launch'] as const;

// Phases that are always universal (no injection)
export const UNIVERSAL_PHASES = ['planning', 'messaging', 'post-launch'] as const;

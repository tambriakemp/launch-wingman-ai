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
// Philosophy: Teaching as the bridge to the offer, not automation or optimization.
// Guardrails: No webinar tech setup, no slide builders, no email sequences,
// no reminders logic, no performance metrics. Goal is confidence and connection.

export const LIVE_TRAINING_OFFER_DELTA_TASKS: TaskTemplate[] = [
  // BUILD Phase Additions
  {
    taskId: 'build_define_training_focus',
    title: 'Define your live training focus',
    phase: 'build',
    funnelTypes: ['live_training_offer'],
    order: 1.5, // Insert after universal Build tasks
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 40,
    blocking: true,
    dependencies: ['build_choose_platform'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You know exactly what you\'ll teach',
      'Your training naturally leads into your offer',
    ],
    whyItMatters: 'Your live training is where you teach something genuinely helpful. When you\'re clear on your focus, you\'ll teach with confidence and your audience will see how your offer can take them further.',
    instructions: [
      'Pick one topic you can teach in a single session',
      'Focus on teaching over pitching — this is about helping first',
      'Your slides don\'t need to be perfect. You do.',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'training_topic', label: 'What topic will you teach?', type: 'text', required: true, placeholder: 'e.g., How to create a content plan in 30 minutes' },
        { name: 'training_promise', label: 'What\'s the one thing they\'ll learn or walk away with?', type: 'textarea', required: true, placeholder: 'Describe the single key takeaway...' },
        { name: 'training_to_offer', label: 'How does this training connect to your offer?', type: 'textarea', required: true, placeholder: 'Explain the natural bridge from what you teach to what you sell...' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/build_define_training_focus',
  },
  {
    taskId: 'build_choose_training_host',
    title: 'Choose how you\'ll host your training',
    phase: 'build',
    funnelTypes: ['live_training_offer'],
    order: 1.6,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['build_define_training_focus'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve decided where your training will happen',
      'You feel comfortable with your choice',
    ],
    whyItMatters: 'Choosing a platform you\'re comfortable with means you can focus on teaching, not troubleshooting. Use what you know.',
    instructions: [
      'Pick a platform where you can go live with your audience',
      'Examples: Zoom, Instagram Live, YouTube Live, Facebook Live',
      'Choose what feels simplest for you right now',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'training_platform', label: 'Where will you host your training?', type: 'text', required: true, placeholder: 'e.g., Zoom, Instagram Live, YouTube Live' },
        { name: 'why_this_platform', label: 'Why this platform? (optional)', type: 'textarea', required: false, placeholder: 'What makes this feel like the right choice?' },
      ],
    },
    aiAssistModes: ['simplify', 'help_me_choose'],
    route: '/projects/:id/tasks/build_choose_training_host',
  },

  // CONTENT Phase Additions
  {
    taskId: 'content_training_invitation',
    title: 'Write your live training invitation',
    phase: 'content',
    funnelTypes: ['live_training_offer'],
    order: 0.5, // Insert before "Plan your launch content"
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['build_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You can clearly explain what your training is about',
      'People will understand who it\'s for and what they\'ll learn',
    ],
    whyItMatters: 'Your invitation is how people decide to show up. When it\'s clear and welcoming, the right people will save their spot.',
    instructions: [
      'Write a short paragraph explaining what the training is',
      'Be clear about who it\'s for',
      'Include a simple call to action (e.g., "Save your spot")',
      'No urgency, hype, or countdown language needed',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'invitation_paragraph', label: 'Describe your training in one short paragraph', type: 'textarea', required: true, placeholder: 'What is it? Who is it for? What will they learn?' },
        { name: 'invitation_cta', label: 'Your call to action', type: 'text', required: true, placeholder: 'e.g., Save your spot, Register now, Join me live' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/content_training_invitation',
  },

  // LAUNCH Phase Additions
  {
    taskId: 'launch_schedule_training',
    title: 'Schedule your live training',
    phase: 'launch',
    funnelTypes: ['live_training_offer'],
    order: 2.5, // Before main announcement tasks
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['content_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your training has a date and time',
      'You know where it will happen',
    ],
    whyItMatters: 'Setting a date makes it real. Once you have a time on the calendar, you can invite people with confidence.',
    instructions: [
      'Pick a date and time that works for you',
      'Consider when your audience is most available',
      'You don\'t need calendar integrations or reminders set up',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'training_date', label: 'What date will you host your training?', type: 'text', required: true, placeholder: 'e.g., Saturday, February 15th' },
        { name: 'training_time', label: 'What time?', type: 'text', required: true, placeholder: 'e.g., 11am EST' },
        { name: 'training_platform_confirmed', label: 'Where will it happen? (confirm platform)', type: 'text', required: true, placeholder: 'e.g., Zoom, Instagram Live' },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/launch_schedule_training',
  },
  {
    taskId: 'launch_host_training',
    title: 'Host your live training',
    phase: 'launch',
    funnelTypes: ['live_training_offer'],
    order: 3.5, // After sharing the training announcement
    priority: 2,
    estimatedMinutesMin: 30,
    estimatedMinutesMax: 90,
    blocking: false,
    dependencies: ['launch_share_offer'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You showed up and taught',
      'You confirmed the training was delivered',
    ],
    whyItMatters: 'This is the moment you\'ve been building toward. You don\'t need to be perfect — just present and helpful. Show up, teach, and connect.',
    instructions: [
      'Show up at the scheduled time',
      'Teach what you planned',
      'Invite attendees to your offer at the end',
      'No need to track attendance or create a replay',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'training_delivered', label: 'Training delivered', description: 'I showed up and taught my training' },
        { value: 'offer_shared', label: 'Offer was shared', description: 'I invited attendees to learn more about my offer' },
      ],
    },
    aiAssistModes: ['reassurance'],
    route: '/projects/:id/tasks/launch_host_training',
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
        taskId: 'build_choose_platform',
        changes: {
          whyItMatters: 'This is where you\'ll invite people at the end of your training. Keep it simple — you just need somewhere to send them.',
        },
      },
      {
        taskId: 'content_plan_content',
        changes: {
          instructions: [
            'Most of your content will invite people to your live training, not directly to your offer',
            'Focus on building anticipation for what you\'ll teach',
            'Share why this training matters and who it\'s for',
          ],
        },
      },
      {
        taskId: 'launch_main_announcement',
        changes: {
          title: 'Announce your live training',
          whyItMatters: 'This is your moment to let people know about your training. Focus on what they\'ll learn and how to join — no sales language needed.',
        },
      },
      {
        taskId: 'launch_share_offer',
        changes: {
          title: 'Invite attendees to your offer',
          whyItMatters: 'After teaching, you\'ll invite people who want to go deeper. This should feel clear, warm, and optional — not pushy.',
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

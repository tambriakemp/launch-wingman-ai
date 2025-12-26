/**
 * Funnel Delta Task System
 * 
 * This file defines the delta tasks that are injected for specific funnel types.
 * Most delta tasks are for Build, Content, and Launch phases.
 * Membership funnel also includes Planning and Messaging phase tasks.
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
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/launch_host_training',
  },
];

// ============================================
// APPLICATION CALL DELTA TASKS
// ============================================
// Path: Application → Call → Offer
// Philosophy: Inviting conversations, not closing deals.
// Guardrails: No CRM, no pipelines, no lead scoring, no call scripts,
// no automation, no performance tracking. Launchely guides clarity and readiness.

export const APPLICATION_CALL_DELTA_TASKS: TaskTemplate[] = [
  // ==================== BUILD Phase Additions ====================
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
      'You have a simple readiness qualifier',
    ],
    whyItMatters: 'Clarity on your ideal applicant helps you attract the right people and have more productive conversations. It also helps people self-select out if they\'re not ready.',
    instructions: [
      'Describe your ideal applicant — be specific about their situation',
      'Identify who this is NOT for (this protects both of you)',
      'Think of one simple readiness qualifier (e.g., "willing to take action")',
      'Focus on clarity over persuasion — no pressure language',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'ideal_applicant', label: 'Who is your ideal applicant?', type: 'textarea', required: true, placeholder: 'Describe the person who\'s ready for this conversation...' },
        { name: 'not_a_fit', label: 'Who is this NOT for?', type: 'textarea', required: true, placeholder: 'Describe who shouldn\'t apply right now...' },
        { name: 'readiness_qualifier', label: 'What\'s one sign they\'re ready?', type: 'text', required: true, placeholder: 'e.g., Willing to take action, Already has some experience...' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/build_clarify_applicants',
  },
  {
    taskId: 'build_create_application',
    title: 'Create your application form',
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
      'You\'ve decided how people will apply',
      'You have 3–5 simple questions ready',
      'You know where applications will be submitted',
    ],
    whyItMatters: 'Your application is the first step in the conversation. Simple questions help you understand who you\'re talking to — without automation or scoring systems.',
    instructions: [
      'Decide on your format: form, DM, or email',
      'Write 3–5 simple questions that reveal readiness',
      'Choose where applications will land (no automation needed)',
      'Keep it human — no lead scoring or integrations',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'application_format', label: 'How will people apply?', type: 'select', required: true, placeholder: 'Choose a format...' },
        { name: 'application_questions', label: 'What questions will you ask? (3-5 questions)', type: 'textarea', required: true, placeholder: 'List your application questions...' },
        { name: 'application_destination', label: 'Where will applications be submitted?', type: 'text', required: true, placeholder: 'e.g., Google Form, DM on Instagram, email to...' },
      ],
    },
    aiAssistModes: ['simplify', 'examples', 'help_me_choose'],
    route: '/projects/:id/tasks/build_create_application',
  },

  // ==================== CONTENT Phase Additions ====================
  {
    taskId: 'content_application_invitation',
    title: 'Write your application invitation',
    phase: 'content',
    funnelTypes: ['application_call'],
    order: 0.5, // Before "Plan your launch content"
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['build_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You can clearly explain who the conversation is for',
      'You\'ve described what the call helps with',
      'You have a simple call to action',
    ],
    whyItMatters: 'Your invitation sets the tone for the entire process. It should feel warm and clear — inviting the right people into a genuine conversation.',
    instructions: [
      'Write one short paragraph explaining who this is for',
      'Describe what happens on the call and after applying',
      'Include a simple CTA (e.g., "Apply to work together")',
      'No urgency, scarcity, or pressure language',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'invitation_paragraph', label: 'Describe who this is for and what the call helps with', type: 'textarea', required: true, placeholder: 'One short paragraph explaining the opportunity...' },
        { name: 'invitation_cta', label: 'Your call to action', type: 'text', required: true, placeholder: 'e.g., Apply to work together, Start the conversation' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/content_application_invitation',
  },

  // ==================== LAUNCH Phase Additions ====================
  {
    taskId: 'launch_invite_applications',
    title: 'Invite applications',
    phase: 'launch',
    funnelTypes: ['application_call'],
    order: 3.3, // After main announcement
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['launch_prepare_announcement'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Application link or instructions have been shared',
      'People who are interested know how to raise their hand',
    ],
    whyItMatters: 'This is about inviting aligned people into a conversation — not running a sales process. Make it easy for the right people to take the first step.',
    instructions: [
      'Share your application link or instructions publicly or privately',
      'Keep the invitation warm and clear',
      'No deadlines or countdowns needed',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'application_shared', label: 'Application link/instructions shared', description: 'I\'ve made it clear how to apply' },
        { value: 'invitation_feels_right', label: 'Invitation feels inviting', description: 'The tone is warm and welcoming' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/launch_invite_applications',
  },
  {
    taskId: 'launch_hold_calls',
    title: 'Hold calls',
    phase: 'launch',
    funnelTypes: ['application_call'],
    order: 4.5, // Near end of launch phase
    priority: 2,
    estimatedMinutesMin: 30,
    estimatedMinutesMax: 120,
    blocking: false,
    dependencies: ['launch_invite_applications'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Calls were held, OR the launch window ended',
      'You showed up for the conversations',
    ],
    whyItMatters: 'This is about showing up for conversations with people who raised their hand. You don\'t need to track outcomes or conversions — just be present and helpful.',
    instructions: [
      'Show up for scheduled calls',
      'Listen and be present',
      'No tracking outcomes or conversion metrics required',
      'No notes or CRM entries needed',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'calls_held', label: 'Calls held or launch window ended', description: 'I showed up for the conversations' },
        { value: 'present_and_helpful', label: 'Was present and helpful', description: 'I focused on connection, not closing' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/launch_hold_calls',
  },
];

// ============================================
// MEMBERSHIP DELTA TASKS
// ============================================
// Path: Ongoing subscription with continuous value
// Philosophy: Sustainability over growth pressure, clarity over urgency.
// Guardrails: No pricing formulas, no churn metrics, no retention tactics,
// no scarcity, no urgency. Launchely guides thinking about ongoing value.

export const MEMBERSHIP_DELTA_TASKS: TaskTemplate[] = [
  // ==================== PLANNING Phase Additions ====================
  {
    taskId: 'planning_ongoing_promise',
    title: 'Define your ongoing promise',
    phase: 'planning',
    funnelTypes: ['membership'],
    order: 6.1, // After offer snapshot, before launch path
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['planning_offer_snapshot'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You can articulate what members stay for',
      'The promise feels sustainable, not exhausting',
    ],
    whyItMatters: 'Memberships succeed when people understand why they stay — not just why they join. This step helps you define the ongoing result or support members can expect.',
    instructions: [
      'Think about what members experience over time, not just at the start',
      'Focus on continuity, not completion',
      'Keep it realistic and sustainable for you to deliver',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'ongoing_promise', 
          label: 'What ongoing result or support do members expect over time?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe what keeps members engaged and supported...',
          helperText: 'Think in terms of continuity, not completion.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/planning_ongoing_promise',
  },
  {
    taskId: 'planning_monthly_evolution',
    title: 'What changes month to month?',
    phase: 'planning',
    funnelTypes: ['membership'],
    order: 6.2,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['planning_ongoing_promise'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You understand the nature of updates in your membership',
      'It feels sustainable to deliver',
    ],
    whyItMatters: 'This step reduces pressure to "constantly create" by helping you define what kind of value evolves or refreshes inside your membership.',
    instructions: [
      'Think about what changes or updates members can expect',
      'This doesn\'t need to be new every time — just relevant',
      'Focus on sustainability, not volume',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'monthly_value', 
          label: 'What kind of value evolves or refreshes inside your membership?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe what changes or updates members can expect...',
          helperText: 'This doesn\'t need to be new every time — just relevant.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/planning_monthly_evolution',
  },

  // ==================== MESSAGING Phase Additions ====================
  {
    taskId: 'messaging_why_membership',
    title: 'Why this works as a membership',
    phase: 'messaging',
    funnelTypes: ['membership'],
    order: 2.5, // After transformation statement
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['messaging_transformation_statement'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You can explain why this isn\'t a one-time product',
      'The reason feels honest and clear',
    ],
    whyItMatters: 'This step helps you articulate why your offer works better as ongoing support instead of a one-time solution — focusing on reality, not persuasion.',
    instructions: [
      'Think about why ongoing access makes sense',
      'Focus on reality, not marketing language',
      'Be honest about what the format provides',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'membership_reasoning', 
          label: 'Why does this work better as ongoing support instead of a one-time solution?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Explain why the membership format makes sense...',
          helperText: 'Focus on reality, not persuasion.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/messaging_why_membership',
  },
  {
    taskId: 'messaging_ongoing_access_framing',
    title: 'How you frame ongoing access',
    phase: 'messaging',
    funnelTypes: ['membership'],
    order: 2.6,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['messaging_why_membership'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You can address the "do I need this forever?" question',
      'The framing feels honest and pressure-free',
    ],
    whyItMatters: 'This step helps you reduce buyer resistance around commitment by explaining the value of staying without pressure.',
    instructions: [
      'Think about how members might wonder about long-term commitment',
      'Focus on clarity over urgency',
      'Keep it honest and reassuring',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'ongoing_framing', 
          label: 'How do you explain the value of staying without pressure?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Address the "do I need this forever?" question honestly...',
          helperText: 'Clarity builds trust more than urgency.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/messaging_ongoing_access_framing',
  },

  // ==================== BUILD Phase Additions ====================
  {
    taskId: 'build_membership_container',
    title: 'Define the core membership container',
    phase: 'build',
    funnelTypes: ['membership'],
    order: 1.5,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['build_choose_platform'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You know what members get access to',
      'The elements feel clear and deliverable',
    ],
    whyItMatters: 'This step helps you decide what members actually get access to — the main elements that make up your membership experience.',
    instructions: [
      'Think about the core elements members can expect',
      'Focus on what you can sustainably deliver',
      'Keep it simple — you can always add more later',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'membership_elements', 
          label: 'What are the main elements members can expect inside?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., Content library, ongoing guidance, community, regular touchpoints...',
          helperText: 'Think about core access, not tools or platforms.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/build_membership_container',
  },

  // ==================== CONTENT Phase Additions ====================
  {
    taskId: 'content_retention_content',
    title: 'Content that keeps members engaged',
    phase: 'content',
    funnelTypes: ['membership'],
    order: 0.5,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['build_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You understand what keeps members feeling supported',
      'The content approach feels sustainable',
    ],
    whyItMatters: 'This step shifts focus from acquisition to retention — thinking about what kind of content helps members feel supported over time.',
    instructions: [
      'Think steady and reassuring — not constant',
      'Focus on support, not novelty',
      'Consider what makes members feel connected',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'retention_content', 
          label: 'What kind of content helps members feel supported over time?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe content that keeps members engaged without overwhelming you...',
          helperText: 'Think steady and reassuring — not constant.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/content_retention_content',
  },

  // ==================== LAUNCH Phase Additions ====================
  {
    taskId: 'launch_set_joining_expectations',
    title: 'Set expectations for joining',
    phase: 'launch',
    funnelTypes: ['membership'],
    order: 2.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['content_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You can clearly explain what someone should know before joining',
      'Expectations are set to prevent churn',
    ],
    whyItMatters: 'This step helps prevent churn by aligning expectations early. Clear expectations reduce regret later.',
    instructions: [
      'Think about what someone should understand before joining',
      'Be honest about what the membership is and isn\'t',
      'Focus on clarity, not selling',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'joining_expectations', 
          label: 'What should someone understand before joining your membership?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe what new members should know upfront...',
          helperText: 'Clear expectations reduce regret later.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/launch_set_joining_expectations',
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
        taskId: 'launch_prepare_announcement',
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
        taskId: 'build_choose_platform',
        changes: {
          whyItMatters: 'This is where people will be directed after the call if it\'s a fit. Keep it simple.',
        },
      },
      {
        taskId: 'build_payment_setup',
        changes: {
          whyItMatters: 'Payments typically happen after the call for this type of offer. You don\'t need a checkout page — just a way to collect payment when the time is right.',
        },
      },
      {
        taskId: 'content_plan_content',
        changes: {
          instructions: [
            'Your content will invite people to apply for a conversation, not directly to purchase',
            'Focus on sharing who this is for and what the conversation helps with',
            'Keep it clear, warm, and invitational',
          ],
        },
      },
      {
        taskId: 'launch_prepare_announcement',
        changes: {
          title: 'Announce that you\'re opening applications',
          whyItMatters: 'This is when you let people know you\'re accepting applications. The tone should be clear, warm, and invitational — not sales-y.',
        },
      },
      {
        taskId: 'launch_share_offer',
        changes: {
          title: 'Share application details',
          whyItMatters: 'This is about making it easy for aligned people to start the conversation. Focus on clarity, not closing.',
        },
      },
    ],
  },
  {
    funnelType: 'membership',
    deltaTasks: MEMBERSHIP_DELTA_TASKS,
    modifiedTasks: [
      {
        taskId: 'build_email_platform',
        changes: {
          blocking: true,
          whyItMatters: 'Email is essential for membership onboarding and ongoing member communication. This is how you\'ll welcome new members and keep them engaged.',
        },
      },
      {
        taskId: 'content_plan_content',
        changes: {
          instructions: [
            'Your content will focus on both attracting new members and supporting existing ones',
            'Think about content that demonstrates ongoing value',
            'Balance acquisition with retention — both matter',
          ],
        },
      },
      {
        taskId: 'launch_share_offer',
        changes: {
          title: 'Invite people to join your membership',
          whyItMatters: 'This is the moment you open the doors. Focus on who this is for and what they can expect — no pressure or false urgency.',
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

// Phases where injection is allowed (now includes planning and messaging for membership)
export const INJECTION_ALLOWED_PHASES = ['planning', 'messaging', 'build', 'content', 'launch'] as const;

// Phases that are always universal (no injection)
export const UNIVERSAL_PHASES = ['planning', 'messaging', 'post-launch'] as const;

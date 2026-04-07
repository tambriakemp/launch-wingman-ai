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

  {
    taskId: 'build_welcome_email',
    title: 'Write your welcome email',
    phase: 'build',
    funnelTypes: ['freebie_email_offer'],
    order: 2.5,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['build_freebie_delivery'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your welcome email delivers the freebie',
      'It sets a warm, clear tone for what comes next',
    ],
    whyItMatters: 'Your welcome email is the first impression after someone opts in. It should deliver what you promised, introduce yourself briefly, and let them know what to expect — without overwhelming them.',
    instructions: [
      'Include the freebie link or access instructions clearly at the top',
      'Introduce yourself in one or two sentences — not a full bio',
      'Tell them what\'s coming next so they look out for your emails',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'welcome_subject', 
          label: 'What is the subject line of your welcome email?', 
          type: 'text', 
          required: true, 
          placeholder: 'e.g., "Here\'s your [freebie name] 🎉"',
          helperText: 'Keep it clear and direct — it should match exactly what they signed up for.'
        },
        { 
          name: 'welcome_body_notes', 
          label: 'What will you include in the email body?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., freebie link, brief intro, what\'s coming next...',
          helperText: 'You\'re not writing the full email here — just planning the key elements.'
        },
      ],
    },
    aiAssistModes: ['examples', 'help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/build_welcome_email',
  },
  {
    taskId: 'build_nurture_sequence',
    title: 'Plan your nurture sequence',
    phase: 'build',
    funnelTypes: ['freebie_email_offer'],
    order: 2.6,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 40,
    blocking: true,
    dependencies: ['build_welcome_email'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a simple sequence planned',
      'Each email has a clear purpose',
    ],
    whyItMatters: 'Your nurture sequence builds trust between the freebie and the offer. People rarely buy the first time they hear about something. These emails give them time to see the value — without pressure.',
    instructions: [
      'Plan 3–5 emails that build trust before mentioning your offer',
      'Each email should have one clear purpose — educate, relate, or invite',
      'The final email can introduce your paid offer naturally',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'email_2_purpose', 
          label: 'Email 2 — What\'s the focus?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., A quick win or tip related to the freebie topic...',
          helperText: 'Deliver value before you mention anything to sell.'
        },
        { 
          name: 'email_3_purpose', 
          label: 'Email 3 — What\'s the focus?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., A story, common mistake, or reframe...',
          helperText: 'This is where you deepen the relationship.'
        },
        { 
          name: 'email_4_purpose', 
          label: 'Email 4 — What\'s the focus?', 
          type: 'textarea', 
          required: false, 
          placeholder: 'e.g., Social proof, a result, or addressing a common objection...',
          sectionLabel: 'Optional emails (recommended)',
          helperText: 'Optional but powerful — this is where trust compounds.'
        },
        { 
          name: 'email_5_offer', 
          label: 'Final email — How will you introduce your offer?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., "If you\'ve found this helpful, here\'s how to go deeper..."',
          helperText: 'This should feel like a natural invitation, not a pitch.'
        },
      ],
    },
    aiAssistModes: ['examples', 'help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/build_nurture_sequence',
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
    order: 1, // After launch_share_offer_once
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['launch_share_offer_once'],
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

  // ==================== PRE-LAUNCH Phase Additions ====================
  {
    taskId: 'prelaunch_freebie_test_optin',
    title: 'Test your opt-in and freebie delivery',
    phase: 'pre-launch',
    funnelTypes: ['freebie_email_offer'],
    order: 1.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['prelaunch_share_signal'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'The opt-in form works',
      'The freebie actually arrives in the inbox',
    ],
    whyItMatters: 'If someone opts in and the freebie never arrives, you lose the subscriber and the trust. Testing the full opt-in flow before promoting is the single most important tech check for a freebie funnel.',
    instructions: [
      'Submit your opt-in form using a real email address',
      'Confirm the welcome email and freebie arrive',
      'Check that the thank you page shows correctly',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'form_works', label: 'Opt-in form submits correctly', description: 'No errors, redirects to thank you page' },
        { value: 'email_arrives', label: 'Welcome email arrives', description: 'Delivered to inbox, not spam' },
        { value: 'freebie_accessible', label: 'Freebie is accessible', description: 'Link works, file downloads, or page loads correctly' },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/prelaunch_freebie_test_optin',
  },

  // ==================== POST-LAUNCH Phase Additions ====================
  {
    taskId: 'postlaunch_freebie_list_review',
    title: 'Review your list growth',
    phase: 'post-launch',
    funnelTypes: ['freebie_email_offer'],
    order: 2.5,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: false,
    dependencies: ['postlaunch_acknowledge_completion'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You know how many people opted in',
      'You have a sense of what worked and what didn\'t',
    ],
    whyItMatters: 'List growth is the metric that matters most for a freebie funnel. Knowing how many opted in — and from which source — helps you understand what to do more of next time.',
    instructions: [
      'Check your email platform for new subscribers',
      'Note which posts or platforms drove the most sign-ups',
      'This is data, not judgment — just look and notice',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'new_subscribers',
          label: 'How many people opted in during your launch?',
          type: 'text',
          required: false,
          placeholder: 'e.g., 12, 47, not sure yet...',
          helperText: 'A rough number is fine. This is for your own reference.',
        },
        {
          name: 'top_source',
          label: 'Where did most of your opt-ins come from?',
          type: 'text',
          required: false,
          placeholder: 'e.g., Instagram, email, TikTok...',
          sectionLabel: 'Optional: What worked',
          helperText: 'Knowing this helps you focus your next launch.',
        },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/postlaunch_freebie_list_review',
  },
  {
    taskId: 'postlaunch_freebie_nurture_next',
    title: 'Plan your next step with new subscribers',
    phase: 'post-launch',
    funnelTypes: ['freebie_email_offer'],
    order: 2.6,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['postlaunch_freebie_list_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You know what comes next for your email subscribers',
      'The next step feels clear and intentional',
    ],
    whyItMatters: 'Your new subscribers opted in because they were interested. The worst thing you can do now is go quiet. Your nurture sequence is running — but you also need a clear next move to convert warm subscribers into buyers.',
    instructions: [
      'Decide what happens after the nurture sequence ends',
      'This could be a direct offer, another piece of content, or a conversation',
      'Make sure your email sequence ends with a clear invitation',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        { value: 'direct_offer', label: 'Send them directly to my offer', description: 'The nurture sequence ends with a clear link to buy.' },
        { value: 'conversation', label: 'Invite them to a conversation', description: 'Ask them to reply, DM, or book a call before pitching.' },
        { value: 'more_value', label: 'Send more value content first', description: 'Keep nurturing before introducing the offer.' },
        { value: 'not_sure', label: 'Still deciding — I\'ll figure this out', description: 'You can set this up later, but don\'t leave subscribers hanging too long.' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/postlaunch_freebie_nurture_next',
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

  // ==================== PRE-LAUNCH Phase Additions ====================
  {
    taskId: 'prelaunch_training_tech_test',
    title: 'Do a full dry run of your training setup',
    phase: 'pre-launch',
    funnelTypes: ['live_training_offer'],
    order: 1.5,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 40,
    blocking: true,
    dependencies: ['prelaunch_share_signal'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve tested your audio and video',
      'You know how to share your screen and manage participants',
    ],
    whyItMatters: 'Technical issues during a live training destroy trust instantly. Five minutes of testing before the session saves you from apologizing to your audience for thirty minutes.',
    instructions: [
      'Log into your platform and test audio and video',
      'Practice sharing your screen or slides',
      'Know how to manage questions, mute participants, and handle disruptions',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'audio_tested', label: 'Audio tested and clear', description: 'You can hear yourself, no echo or background noise' },
        { value: 'video_tested', label: 'Video tested', description: 'Camera works, lighting is acceptable' },
        { value: 'screen_share_tested', label: 'Screen share or slides tested', description: 'You know how to share what you need to show' },
        { value: 'link_confirmed', label: 'Join link confirmed', description: 'The link you\'re sharing actually works' },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/prelaunch_training_tech_test',
  },

  // ==================== POST-LAUNCH Phase Additions ====================
  {
    taskId: 'postlaunch_training_send_replay',
    title: 'Send the replay to registrants',
    phase: 'post-launch',
    funnelTypes: ['live_training_offer'],
    order: 1.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['postlaunch_acknowledge_completion'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'The replay has been sent to everyone who registered',
      'The replay email includes a clear CTA to your offer',
    ],
    whyItMatters: 'Most people who registered for a live training didn\'t attend. The replay email reaches the people who wanted to come but couldn\'t — and it\'s your second best chance to convert them.',
    instructions: [
      'Upload or host the recording somewhere accessible',
      'Email all registrants with the replay link within 24 hours',
      'Include your offer CTA naturally in the email',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'replay_location',
          label: 'Where is the replay hosted?',
          type: 'text',
          required: true,
          placeholder: 'e.g., YouTube (unlisted), Vimeo, Google Drive link...',
          helperText: 'It just needs to be accessible — it doesn\'t need to be fancy.',
        },
        {
          name: 'replay_sent',
          label: 'Have you sent the replay to registrants?',
          type: 'text',
          required: false,
          placeholder: 'Yes / Not yet',
          sectionLabel: 'Optional: Status',
        },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/postlaunch_training_send_replay',
  },
  {
    taskId: 'postlaunch_training_follow_up_attendees',
    title: 'Follow up with attendees who didn\'t buy',
    phase: 'post-launch',
    funnelTypes: ['live_training_offer'],
    order: 1.6,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['postlaunch_training_send_replay'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve sent a follow-up to people who attended but didn\'t buy',
      'The message feels warm and helpful — not chasing',
    ],
    whyItMatters: 'People who attended your training are warm. They invested their time. Many of them wanted to buy but had a question, a hesitation, or simply got distracted. A personal follow-up addresses that without pressure.',
    instructions: [
      'Export your attendee list from your hosting platform',
      'Cross-reference with who purchased',
      'Send a short, warm message to those who attended but didn\'t buy',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'followup_message',
          label: 'What will you say to attendees who didn\'t buy?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g., "Thanks for joining — I hope it was helpful. If you have any questions about [offer] or whether it\'s right for you, just reply here."',
          helperText: 'One question answered can convert a hesitant attendee into a buyer.',
        },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/postlaunch_training_follow_up_attendees',
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
    dependencies: ['planning_perceived_likelihood'],
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

  // ==================== POST-LAUNCH Phase Additions ====================
  {
    taskId: 'postlaunch_membership_onboard_personally',
    title: 'Personally welcome your first members',
    phase: 'post-launch',
    funnelTypes: ['membership'],
    order: 1.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['postlaunch_acknowledge_completion'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Each new member has heard from you personally',
      'They feel welcomed — not just processed',
    ],
    whyItMatters: 'First impressions in a membership determine whether someone stays past month one. A personal welcome — even just one message — creates a sense of belonging that automated onboarding can\'t replicate.',
    instructions: [
      'Send a personal message to each new member in the first 24–48 hours',
      'Introduce yourself and let them know you\'re glad they\'re here',
      'Ask one simple question to start a conversation',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'welcome_message',
          label: 'What will you say to welcome new members?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g., "Welcome — so glad you\'re here. I\'d love to know what brought you to join. What are you most hoping to get from this?"',
          helperText: 'Short and genuine. This isn\'t an onboarding email — it\'s a human moment.',
        },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/postlaunch_membership_onboard_personally',
  },
  {
    taskId: 'postlaunch_membership_plan_first_month',
    title: 'Plan your first month of member content',
    phase: 'post-launch',
    funnelTypes: ['membership'],
    order: 1.6,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['postlaunch_membership_onboard_personally'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a plan for what members will get in month one',
      'The plan feels sustainable, not overwhelming',
    ],
    whyItMatters: 'Your first month sets the precedent for what membership looks like. What you deliver — and how consistently — signals to members whether staying is worth it. A clear, simple plan is better than an ambitious one you can\'t keep up with.',
    instructions: [
      'Decide what members will receive in the first 30 days',
      'Prioritise consistency and sustainability over volume',
      'Remember: members stay for ongoing value, not a one-time dump of content',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'first_month_plan',
          label: 'What will members receive in the first 30 days?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g., Weekly training on [topic], monthly Q&A call, resource added on [date]...',
          helperText: 'Keep it simple and repeatable. This is your baseline promise.',
        },
      ],
    },
    aiAssistModes: ['examples', 'simplify', 'help_me_choose'],
    route: '/projects/:id/tasks/postlaunch_membership_plan_first_month',
  },
];

// ============================================
// CHALLENGE DELTA TASKS
// ============================================
// Path: Time-bound experience for momentum and activation
// Philosophy: Participation over perfection, clarity over completion.
// Guardrails: No daily actions, no live delivery requirements, no tools/platforms,
// no pressure or urgency. Launchely guides thinking about focused momentum.

export const CHALLENGE_DELTA_TASKS: TaskTemplate[] = [
  // ==================== PLANNING Phase Additions ====================
  {
    taskId: 'planning_challenge_focus',
    title: 'Define the challenge focus',
    phase: 'planning',
    funnelTypes: ['challenge'],
    order: 6.1,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['planning_offer_snapshot'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'The challenge has one clear focus',
      'It feels achievable within the timeframe',
    ],
    whyItMatters: 'A focused challenge prevents overwhelm. When participants know exactly what they\'re working toward, they\'re more likely to stay engaged.',
    instructions: [
      'Anchor the challenge to one clear outcome',
      'Avoid multiple goals or competing focuses',
      'Keep it achievable within the challenge window',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'challenge_focus', 
          label: 'What is the one thing participants will focus on during this challenge?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe the single focus of the challenge...',
          helperText: 'This should feel achievable within the challenge window.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/planning_challenge_focus',
  },
  {
    taskId: 'planning_challenge_duration',
    title: 'Choose the challenge length',
    phase: 'planning',
    funnelTypes: ['challenge'],
    order: 6.2,
    priority: 1,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: true,
    dependencies: ['planning_challenge_focus'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve chosen a duration',
      'The length feels realistic and supportive',
    ],
    whyItMatters: 'The right duration makes your challenge feel approachable. Shorter challenges often have higher completion rates.',
    instructions: [
      'Pick a timeframe that feels supportive, not exhausting',
      'Shorter is often more approachable',
      'Consider your audience\'s capacity',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        { value: '3_days', label: '3 days', description: 'Quick momentum — great for simple wins' },
        { value: '5_days', label: '5 days', description: 'Balanced length — most common choice' },
        { value: '7_days', label: '7 days', description: 'More depth — good for building habits' },
        { value: 'other', label: 'Other / Not sure yet', description: 'You can decide later' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples'],
    route: '/projects/:id/tasks/planning_challenge_duration',
  },

  // ==================== MESSAGING Phase Additions ====================
  {
    taskId: 'messaging_challenge_promise',
    title: 'Frame the challenge promise',
    phase: 'messaging',
    funnelTypes: ['challenge'],
    order: 2.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['messaging_transformation_statement'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'The promise focuses on transformation, not tasks',
      'It emphasizes momentum, not mastery',
    ],
    whyItMatters: 'Your challenge promise describes what participants gain by the end — not what they do daily. Focus on how they\'ll feel or think differently.',
    instructions: [
      'Describe the shift participants experience',
      'Focus on momentum, not mastery',
      'Keep it realistic and grounded',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'challenge_promise', 
          label: 'How will participants feel or think differently by the end of the challenge?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe the transformation or shift they\'ll experience...',
          helperText: 'Focus on momentum, not mastery.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/messaging_challenge_promise',
  },
  {
    taskId: 'messaging_reduce_pressure',
    title: 'How you reduce pressure to "keep up"',
    phase: 'messaging',
    funnelTypes: ['challenge'],
    order: 2.6,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['messaging_challenge_promise'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You can address fears of falling behind',
      'The framing feels supportive, not pressuring',
    ],
    whyItMatters: 'Many people drop out of challenges because they feel like they\'ve "failed" after missing a day. Normalizing imperfect participation increases completion.',
    instructions: [
      'Think about how you\'ll reassure participants',
      'Focus on progress, not perfection',
      'Remove fear of falling behind',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'pressure_reduction', 
          label: 'How do you explain that missing a day doesn\'t mean failing?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe how you\'ll reassure participants who fall behind...',
          helperText: 'Reassurance increases participation.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/messaging_reduce_pressure',
  },

  // ==================== BUILD Phase Additions ====================
  {
    taskId: 'build_participation_container',
    title: 'Define how people participate',
    phase: 'build',
    funnelTypes: ['challenge'],
    order: 1.5,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['build_choose_platform'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'The participation experience is clear',
      'It feels simple and accessible',
    ],
    whyItMatters: 'This step clarifies how participants experience the challenge — without prescribing specific delivery mechanics or tools.',
    instructions: [
      'Think about the experience, not the technology',
      'Keep it simple and accessible',
      'Focus on what participants do, not what you build',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'participation_experience', 
          label: 'Where and how do participants experience the challenge?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., Daily prompts, light guidance, shared space, simple check-ins...',
          helperText: 'Think about the experience, not platforms or tools.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/build_participation_container',
  },

  // ==================== CONTENT Phase Additions ====================
  {
    taskId: 'content_momentum_content',
    title: 'Content that keeps people moving',
    phase: 'content',
    funnelTypes: ['challenge'],
    order: 0.5,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['build_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You understand what keeps participants engaged',
      'The content approach feels simple and supportive',
    ],
    whyItMatters: 'Challenge content is about encouragement, not volume. Simple, supportive content keeps people moving without overwhelming them.',
    instructions: [
      'Think simple and supportive',
      'Focus on encouragement, not volume',
      'Consider what helps people feel connected',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'momentum_content', 
          label: 'What kind of content helps participants stay engaged without overwhelm?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe content that encourages without overwhelming...',
          helperText: 'Think simple and supportive.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/content_momentum_content',
  },

  // ==================== LAUNCH Phase Additions ====================
  {
    taskId: 'launch_challenge_expectations',
    title: 'Set expectations for joining the challenge',
    phase: 'launch',
    funnelTypes: ['challenge'],
    order: 2.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['content_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Participation expectations are clear',
      'People understand what to expect before joining',
    ],
    whyItMatters: 'Clear expectations reduce drop-off. When people understand what they\'re signing up for, they\'re more likely to participate fully.',
    instructions: [
      'Be clear about what the challenge involves',
      'Set realistic expectations',
      'Focus on clarity, not selling',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'challenge_expectations', 
          label: 'What should someone understand before they join?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe what participants should know upfront...',
          helperText: 'Clear expectations build trust.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/launch_challenge_expectations',
  },

  // ==================== POST-LAUNCH Phase Additions ====================
  {
    taskId: 'postlaunch_challenge_celebrate',
    title: 'Celebrate completers publicly',
    phase: 'post-launch',
    funnelTypes: ['challenge'],
    order: 1.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: false,
    dependencies: ['postlaunch_acknowledge_completion'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve acknowledged the people who completed the challenge',
      'The celebration feels genuine — not performative',
    ],
    whyItMatters: 'Challenge completers are your most engaged audience. Celebrating them publicly costs nothing and does three things: it rewards the people who showed up, it makes non-completers wish they had, and it creates social proof of real participation.',
    instructions: [
      'Publicly acknowledge people who completed the challenge',
      'A post, story, or community shoutout is enough',
      'Be specific — name names if you have permission',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'celebration_format',
          label: 'How will you celebrate your completers?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g., A post in the community, an Instagram story featuring their wins, a shoutout email...',
          helperText: 'Keep it genuine. Recognition goes a long way.',
        },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/postlaunch_challenge_celebrate',
  },
  {
    taskId: 'postlaunch_challenge_pitch_completers',
    title: 'Offer your core offer to challenge completers',
    phase: 'post-launch',
    funnelTypes: ['challenge'],
    order: 1.6,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['postlaunch_challenge_celebrate'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Challenge completers have heard about your core offer',
      'The invitation felt earned and natural',
    ],
    whyItMatters: 'People who completed your challenge are your hottest leads. They\'ve already done the work, experienced a taste of your method, and proven they follow through. This is the moment your challenge was building toward.',
    instructions: [
      'Share your core offer with people who completed the challenge',
      'Frame it as the natural next step after the challenge experience',
      'Keep it personal — they know you now',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'completer_pitch',
          label: 'How will you introduce your offer to challenge completers?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g., A personal email, a community post, or a final live session where you present the next step...',
          helperText: 'Frame it as a continuation of what they\'ve already started — not a new sale.',
        },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/postlaunch_challenge_pitch_completers',
  },
];

// ============================================
// LAUNCH DELTA TASKS
// ============================================
// Path: Time-bound window for introducing and selling an offer
// Philosophy: Preparation over pressure, understanding over hype.
// Guardrails: No marketing tactics, no urgency language, no tech stacks,
// no scarcity frameworks. Launchely guides clarity and intentionality.

export const LAUNCH_DELTA_TASKS: TaskTemplate[] = [
  // ==================== PLANNING Phase Additions ====================
  {
    taskId: 'planning_launch_window',
    title: 'Define your launch window',
    phase: 'planning',
    funnelTypes: ['launch'],
    order: 6.1,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['planning_offer_snapshot'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'The launch window is defined',
      'The timeframe feels clear and intentional',
    ],
    whyItMatters: 'Anchoring your launch to a clear timeframe provides structure without pressure. This is about clarity, not urgency.',
    instructions: [
      'Define when your offer will be available',
      'Choose a window that feels manageable',
      'Focus on clarity, not artificial deadlines',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'launch_window', 
          label: 'When will your offer be available?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe the timeframe for your launch...',
          helperText: 'This is about clarity, not urgency.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/planning_launch_window',
  },
  {
    taskId: 'planning_launch_completion',
    title: 'Define what completion looks like',
    phase: 'planning',
    funnelTypes: ['launch'],
    order: 6.2,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['planning_launch_window'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You know when the launch is "done"',
      'The endpoint reduces pressure and prevents burnout',
    ],
    whyItMatters: 'Defining completion reduces burnout by setting a clear endpoint. This could be a date, a feeling, or a decision — not a metric.',
    instructions: [
      'Think about what signals "done" for you',
      'Avoid tying completion to sales numbers',
      'Focus on a sustainable endpoint',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'launch_completion', 
          label: 'How will you know when this launch is complete?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe what "done" looks like for this launch...',
          helperText: 'This could be a date, a feeling, or a decision — not a metric.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/planning_launch_completion',
  },

  // ==================== MESSAGING Phase Additions ====================
  {
    taskId: 'messaging_why_now',
    title: 'Explain why this is being launched now',
    phase: 'messaging',
    funnelTypes: ['launch'],
    order: 2.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['messaging_transformation_statement'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'The timing feels relevant, not manufactured',
      'You can articulate why now without pressure',
    ],
    whyItMatters: 'Helping people understand timing without urgency builds trust. Focus on relevance, not pressure.',
    instructions: [
      'Think about why this moment matters',
      'Focus on relevance to your audience',
      'Avoid manufactured urgency',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'why_now', 
          label: 'Why is this the right moment to introduce this offer?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe the relevance of this timing...',
          helperText: 'Focus on relevance, not pressure.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/messaging_why_now',
  },
  {
    taskId: 'messaging_missed_timing',
    title: 'How you handle missed timing',
    phase: 'messaging',
    funnelTypes: ['launch'],
    order: 2.6,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['messaging_why_now'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You can address what happens if someone doesn\'t join now',
      'The framing reduces fear, not creates it',
    ],
    whyItMatters: 'Addressing what happens if someone misses the window reduces fear-based resistance. Clarity builds trust more than urgency.',
    instructions: [
      'Be honest about what happens after the window closes',
      'Focus on clarity, not FOMO',
      'Reduce fear, don\'t amplify it',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'missed_timing_framing', 
          label: 'How do you explain what happens if someone doesn\'t join during this window?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe what happens after — honestly and clearly...',
          helperText: 'Clarity builds trust more than urgency.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/messaging_missed_timing',
  },

  // ==================== BUILD Phase Additions ====================
  {
    taskId: 'build_launch_access',
    title: 'Define how the offer is accessed during launch',
    phase: 'build',
    funnelTypes: ['launch'],
    order: 1.5,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['build_choose_platform'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'The access method is clear',
      'It feels simple and intentional',
    ],
    whyItMatters: 'This step clarifies how people access or join during the launch window — without building infrastructure or prescribing specific tools.',
    instructions: [
      'Think about the experience, not the technology',
      'Keep it simple and accessible',
      'Focus on what people do, not what you build',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'launch_access', 
          label: 'How do people access or join during the launch window?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., Enrollment window, application period, limited access page, invite-based access...',
          helperText: 'Think about the experience, not platforms or tools.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/build_launch_access',
  },

  {
    taskId: 'build_launch_email_sequence',
    title: 'Plan your launch email sequence',
    phase: 'build',
    funnelTypes: ['launch'],
    order: 3.5,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 45,
    blocking: true,
    dependencies: ['build_launch_access'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a sequence mapped from cart open to close',
      'Each email has a clear role',
    ],
    whyItMatters: 'Your launch email sequence is where most of your sales happen. People who see one social post may scroll past it. People who receive 5–7 emails over a launch window have more touchpoints to decide. This is the engine of your launch.',
    instructions: [
      'Plan one email per day or every other day across your launch window',
      'Each email should do one thing — introduce, educate, address objections, or create urgency',
      'The final 1–2 emails are your most important — don\'t skip them',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'cart_open_email', 
          label: 'Cart open email — What will you say when doors open?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., Announce what\'s available, who it\'s for, and what\'s included...',
          helperText: 'This is your first impression — clarity over hype.'
        },
        { 
          name: 'value_emails', 
          label: 'Middle emails — What will you cover between open and close?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., what\'s inside, a story, FAQ, objection handling, a win from a past student...',
          helperText: 'Plan 2–4 emails that deepen interest and handle doubt.'
        },
        { 
          name: 'close_email', 
          label: 'Closing email — How will you close the cart?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., Cart closes tonight, last chance, what happens after close...',
          helperText: 'Your close email is often your highest-converting email — don\'t skip it.'
        },
      ],
    },
    aiAssistModes: ['examples', 'help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/build_launch_email_sequence',
  },

  // ==================== PRE-LAUNCH Phase Additions ====================
  {
    taskId: 'prelaunch_build_waitlist',
    title: 'Build your interest list',
    phase: 'pre-launch',
    funnelTypes: ['launch'],
    order: 0.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['content_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'People can express interest before you launch',
      'You have a way to follow up with interested people',
    ],
    whyItMatters: 'A launch to a waitlist almost always outperforms a cold launch. People who raised their hand before your cart opens are already warm — they\'re expecting you to share.',
    instructions: [
      'Create a simple way for people to say "I\'m interested" before you launch',
      'This can be a waitlist form, a DM keyword, or a reply to an email',
      'Share it at least once before launch day',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'waitlist_method', 
          label: 'How will people express interest before your launch?', 
          type: 'select', 
          required: true,
          options: [
            { value: '', label: 'Choose an approach...' },
            { value: 'waitlist_form', label: 'A waitlist signup form' },
            { value: 'dm_keyword', label: 'DM me a keyword' },
            { value: 'email_reply', label: 'Reply to my email' },
            { value: 'comment', label: 'Comment on a post' },
          ]
        },
        { 
          name: 'waitlist_shared', 
          label: 'Where will you share this?', 
          type: 'textarea', 
          required: false, 
          placeholder: 'e.g., Instagram stories, email list, TikTok bio...',
          sectionLabel: 'Optional: Where you\'ll share it',
          helperText: 'Pick one or two places — not everywhere at once.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples'],
    route: '/projects/:id/tasks/prelaunch_build_waitlist',
  },
  {
    taskId: 'prelaunch_warmup_content',
    title: 'Share pre-launch warmup content',
    phase: 'pre-launch',
    funnelTypes: ['launch'],
    order: 0.6,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['prelaunch_build_waitlist'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve shared at least one piece of pre-launch content',
      'Your audience has context before you open the cart',
    ],
    whyItMatters: 'Audiences who see 3–5 pieces of relevant content before a launch are more likely to buy than those who only see launch announcements. Pre-launch content does the warming — so launch week can do the selling.',
    instructions: [
      'Share content that relates to the problem your offer solves',
      'You don\'t need to mention the launch yet — just warm up the conversation',
      'Aim for 2–3 posts or emails in the week before you launch',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'warmup_content_plan', 
          label: 'What 2–3 pieces of content will you share before launch?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., a personal story, a tip related to the offer topic, a common mistake your audience makes...',
          helperText: 'These posts plant seeds — not pitches.'
        },
      ],
    },
    aiAssistModes: ['examples', 'help_me_choose'],
    route: '/projects/:id/tasks/prelaunch_warmup_content',
  },

  // ==================== CONTENT Phase Additions ====================
  {
    taskId: 'content_decision_support',
    title: 'Content that helps people decide',
    phase: 'content',
    funnelTypes: ['launch'],
    order: 0.5,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['build_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You understand what helps people decide',
      'The content approach shifts from awareness to clarity',
    ],
    whyItMatters: 'Launch content is about helping people understand if this is right for them — explanation, reassurance, and context.',
    instructions: [
      'Think explanation, reassurance, and context',
      'Focus on clarity, not persuasion',
      'Help people make an informed decision',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'decision_content', 
          label: 'What kind of content helps people understand if this is right for them?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe content that supports decision-making...',
          helperText: 'Think explanation, reassurance, and context.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/content_decision_support',
  },

  // ==================== LAUNCH Phase Additions ====================
  {
    taskId: 'launch_set_expectations',
    title: 'Set expectations for this launch',
    phase: 'launch',
    funnelTypes: ['launch'],
    order: 2.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['content_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Expectations are clear for both you and your audience',
      'People understand what to expect before engaging',
    ],
    whyItMatters: 'Aligning expectations for both you and your audience reduces stress for everyone. Clear expectations build trust.',
    instructions: [
      'Think about what people should know before engaging',
      'Set expectations for yourself too',
      'Focus on clarity and alignment',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'launch_expectations', 
          label: 'What should people understand about this launch before they engage?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe what participants and you should expect...',
          helperText: 'Clear expectations reduce stress for everyone.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/launch_set_expectations',
  },

  // ==================== POST-LAUNCH Phase Additions ====================
  {
    taskId: 'postlaunch_launch_debrief',
    title: 'Run a simple launch debrief',
    phase: 'post-launch',
    funnelTypes: ['launch'],
    order: 2.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['postlaunch_what_worked'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a simple record of how this launch performed',
      'You know one thing to keep and one thing to change',
    ],
    whyItMatters: 'A launch debrief doesn\'t need to be a spreadsheet. It just needs to capture what happened — so next time, you\'re not starting from zero. The creators who get better with every launch are the ones who take ten minutes to write it down.',
    instructions: [
      'Note your key numbers — revenue, buyers, email opens, link clicks',
      'Identify one thing that drove results',
      'Identify one thing you\'d change',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'launch_revenue',
          label: 'How much revenue did this launch generate?',
          type: 'text',
          required: false,
          placeholder: 'e.g., $0, $497, $2,300...',
          helperText: 'Numbers are just information — not a verdict.',
        },
        {
          name: 'launch_buyers',
          label: 'How many buyers did you get?',
          type: 'text',
          required: false,
          placeholder: 'e.g., 0, 3, 12...',
          sectionLabel: 'Your numbers',
        },
        {
          name: 'what_drove_results',
          label: 'What one thing seemed to drive the most interest or sales?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g., The email on day 3, a specific post, personal DMs, a testimonial I shared...',
          sectionLabel: 'What you learned',
          helperText: 'Even if results were low, something resonated — what was it?',
        },
        {
          name: 'what_to_change',
          label: 'What one thing would you do differently next time?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g., Start promoting earlier, write the close email sooner, set up the waitlist further in advance...',
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/postlaunch_launch_debrief',
  },
];

// ============================================
// CONTENT TO OFFER DELTA TASKS
// ============================================
// Path: Social content → direct offer (no injection)
// These tasks are specific to the content-to-offer funnel type.

export const CONTENT_TO_OFFER_DELTA_TASKS: TaskTemplate[] = [
  // ==================== BUILD Phase Additions ====================
  {
    taskId: 'build_link_in_bio',
    title: 'Set up your link in bio',
    phase: 'build',
    funnelTypes: ['content_to_offer'],
    order: 4.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['build_simple_launch_page'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your link in bio points somewhere useful',
      'Someone clicking it would know what to do next',
    ],
    whyItMatters: 'For content-to-offer, your link in bio is the bridge between your content and your offer. If it doesn\'t exist or leads nowhere, your content can\'t convert.',
    instructions: [
      'Choose one destination — your sales page, landing page, or direct DM',
      'Update your bio across the platforms you\'ll use',
      'Test it yourself to make sure it works',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'link_destination', 
          label: 'Where does your link in bio point?', 
          type: 'text', 
          required: true, 
          placeholder: 'e.g., sales page URL, Linktree, DM trigger...',
          helperText: 'One clear destination is better than many options.'
        },
        { 
          name: 'bio_updated', 
          label: 'Which platforms have you updated?', 
          type: 'textarea', 
          required: false, 
          placeholder: 'e.g., Instagram, TikTok, Twitter...',
          sectionLabel: 'Optional: Helpful context',
          helperText: 'Focus on where your audience actually is.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/build_link_in_bio',
  },
  {
    taskId: 'build_dm_response',
    title: 'Prepare your DM response',
    phase: 'build',
    funnelTypes: ['content_to_offer'],
    order: 4.6,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 15,
    blocking: false,
    dependencies: ['build_link_in_bio'],
    canSkip: true,
    skipReasonRequired: true,
    completionCriteria: [
      'You have a simple response ready when someone asks',
      'It feels natural, not scripted',
    ],
    whyItMatters: 'When your content works, people will DM you. Having a warm, clear response ready means you never miss a potential sale because you didn\'t know what to say.',
    instructions: [
      'Write 2–3 sentences you could paste or adapt when someone shows interest',
      'Include what the offer is, who it\'s for, and a clear next step',
      'Keep it conversational — not copy-pasted sales language',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'dm_response', 
          label: 'What will you say when someone DMs asking about your offer?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., "Hey! Yes, [offer name] is a [short description]. It\'s for [audience]. Here\'s the link: [link]"',
          helperText: 'Write it the way you would actually talk — not like a brochure.'
        },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/build_dm_response',
  },

  // ==================== CONTENT Phase Additions ====================
  {
    taskId: 'content_selling_post_structure',
    title: 'Plan your selling post structure',
    phase: 'content',
    funnelTypes: ['content_to_offer'],
    order: 0.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['build_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You understand how your content leads to your offer',
      'The structure feels natural, not salesy',
    ],
    whyItMatters: 'Content-to-offer works when your posts naturally create interest — not when they feel like ads. This step helps you understand the simple structure behind content that converts.',
    instructions: [
      'Think about content that teaches or resonates — then invites',
      'Your CTA should be one clear next step, not a pitch',
      'You\'ll write the actual posts in the next task',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'value_angle', 
          label: 'What will your content teach, share, or show?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'e.g., common mistakes, behind-the-scenes, quick wins, perspective shifts...',
          helperText: 'Value-first content earns the right to mention your offer.'
        },
        { 
          name: 'cta_style', 
          label: 'How will you invite people to take the next step?', 
          type: 'select', 
          required: false,
          sectionLabel: 'Optional: Your call to action style',
          helperText: 'Choose the approach that feels most natural.',
          options: [
            { value: '', label: 'Select an approach...' },
            { value: 'link_in_bio', label: 'Link in bio' },
            { value: 'dm_me', label: 'DM me a keyword' },
            { value: 'comment', label: 'Comment to get the link' },
            { value: 'direct_link', label: 'Direct link in post or caption' },
          ]
        },
      ],
    },
    aiAssistModes: ['examples', 'help_me_choose'],
    route: '/projects/:id/tasks/content_selling_post_structure',
  },

  // ==================== LAUNCH Phase Additions ====================
  {
    taskId: 'launch_content_to_offer_share',
    title: 'Share content that leads to your offer',
    phase: 'launch',
    funnelTypes: ['content_to_offer'],
    order: 1,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['prelaunch_share_signal'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve posted content that naturally mentions your offer',
      'One post is enough to start',
    ],
    whyItMatters: 'This is the simplest version of launching — share something valuable, then let people know how to go deeper. You don\'t need a campaign. One post with a clear next step is a real launch.',
    instructions: [
      'Share content that connects to the problem your offer solves',
      'At the end, invite people to take one clear next step',
      'Post it and let it land — no immediate follow-up required',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        { value: 'value_post_cta', label: 'A value post with a clear CTA', description: 'Teach or share something useful, then invite people to learn more.' },
        { value: 'personal_story', label: 'A personal story that leads to your offer', description: 'Share a relevant experience and connect it to how your offer helps.' },
        { value: 'problem_solution', label: 'A problem-to-solution post', description: 'Name the problem your audience faces, then position your offer as the next step.' },
        { value: 'direct_announcement', label: 'A direct offer announcement', description: 'Simply tell people what you have, who it\'s for, and how to get it.' },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/launch_content_to_offer_share',
  },
];

// ============================================
// DELTA TASK CONFIGURATION
// ============================================

export interface FunnelDeltaConfig {
  funnelType: Exclude<FunnelType, 'all'>;
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
    funnelType: 'content_to_offer',
    deltaTasks: CONTENT_TO_OFFER_DELTA_TASKS,
    modifiedTasks: [
      {
        taskId: 'build_email_platform',
        changes: {
          whyItMatters: 'For content-to-offer, email helps you stay connected with people who showed interest. It\'s not required to launch, but it extends your reach beyond the first post.',
        },
      },
      {
        taskId: 'launch_share_offer_once',
        changes: {
          title: 'Share your first selling post',
          whyItMatters: 'Your launch is one clear post that teaches, resonates, or tells a story — and then invites people to take one next step. That\'s all this needs to be.',
        },
      },
    ],
  },
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
  {
    funnelType: 'challenge',
    deltaTasks: CHALLENGE_DELTA_TASKS,
    modifiedTasks: [
      {
        taskId: 'build_email_platform',
        changes: {
          blocking: true,
          whyItMatters: 'Email is essential for challenge communication — welcoming participants, sending daily guidance, and following up afterward.',
        },
      },
      {
        taskId: 'content_plan_content',
        changes: {
          instructions: [
            'Your content will build anticipation for the challenge and keep participants engaged',
            'Focus on encouragement and momentum, not volume',
            'Think about what helps people feel supported',
          ],
        },
      },
      {
        taskId: 'launch_share_offer',
        changes: {
          title: 'Invite people to join your challenge',
          whyItMatters: 'This is the moment you open registration. Focus on who this is for and what they\'ll experience — no pressure or urgency.',
        },
      },
    ],
  },
  {
    funnelType: 'launch',
    deltaTasks: LAUNCH_DELTA_TASKS,
    modifiedTasks: [
      {
        taskId: 'build_email_platform',
        changes: {
          blocking: true,
          whyItMatters: 'Email is essential for launch communication — building anticipation, announcing availability, and supporting decision-making during the window.',
        },
      },
      {
        taskId: 'content_plan_content',
        changes: {
          instructions: [
            'Your content will explain and support — not push or pressure',
            'Focus on helping people understand if this is right for them',
            'Think preparation and clarity, not urgency',
          ],
        },
      },
      {
        taskId: 'launch_share_offer',
        changes: {
          title: 'Open your launch window',
          whyItMatters: 'This is the moment you announce availability. Focus on clarity and relevance — no countdown pressure or scarcity tactics.',
        },
      },
    ],
  },
];

// Helper function to get delta config for a funnel type
export function getFunnelDeltaConfig(funnelType: FunnelType): FunnelDeltaConfig | null {
  if (funnelType === 'all') {
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

// Phases where injection is allowed (includes planning and messaging for some funnels)
export const INJECTION_ALLOWED_PHASES = ['planning', 'messaging', 'build', 'content', 'launch'] as const;

// Phases that are always universal (no injection)
export const UNIVERSAL_PHASES = ['planning', 'messaging', 'post-launch'] as const;

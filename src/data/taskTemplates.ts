import { TaskTemplate } from '@/types/tasks';
import { 
  FREEBIE_EMAIL_OFFER_DELTA_TASKS, 
  LIVE_TRAINING_OFFER_DELTA_TASKS, 
  APPLICATION_CALL_DELTA_TASKS 
} from './funnelDeltaTasks';

// Universal tasks that apply to all funnel types
export const TASK_TEMPLATES: TaskTemplate[] = [
  // ==================== PLANNING PHASE ====================
  {
    taskId: 'planning_define_audience',
    title: 'Define your target audience',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 1,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: [],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve described a specific group of people',
      'You can clearly imagine who this offer is for',
    ],
    whyItMatters: 'This step helps you get clear on who your offer is for. When your audience is specific, your messaging, content, and sales decisions become much easier.',
    instructions: [
      'Describe the type of person you want to help',
      'Be specific about their situation or stage',
      'Avoid broad groups like "everyone" or "anyone"',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'audience_description', label: 'Who is your target audience?', type: 'textarea', required: true, placeholder: 'Describe the specific type of person you want to help...' },
        { 
          name: 'niche_context', 
          label: 'General niche (if it helps)', 
          type: 'select', 
          required: false, 
          placeholder: 'Select a niche...',
          sectionLabel: 'Optional: Helpful context',
          helperText: "This doesn't lock you in — it just helps with examples and wording.",
          options: [
            { value: '', label: 'Select a niche...' },
            { value: 'business_entrepreneurship', label: 'Business / Entrepreneurship' },
            { value: 'money_finance', label: 'Money / Finance' },
            { value: 'career', label: 'Career' },
            { value: 'health_wellness', label: 'Health / Wellness' },
            { value: 'personal_growth', label: 'Personal Growth' },
            { value: 'relationships', label: 'Relationships' },
            { value: 'creative_content', label: 'Creative / Content' },
            { value: 'other', label: 'Other / Not sure yet' },
          ]
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/planning_define_audience',
  },
  {
    taskId: 'planning_define_problem',
    title: "Identify your audience's main problem",
    phase: 'planning',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['planning_define_audience'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'The problem feels real and specific',
      'Your audience would say "yes, that\'s me"',
    ],
    whyItMatters: 'People don\'t buy offers — they buy solutions to problems they feel every day. This step helps you focus on the one problem your offer will help solve.',
    instructions: [
      'Think about what frustrates your audience most',
      'Focus on a problem they\'re actively aware of',
      'Write it in simple, everyday language',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'primary_problem', label: 'What is their main problem?', type: 'textarea', required: true, placeholder: 'Describe the core problem your audience faces...' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/planning_define_problem',
  },
  {
    taskId: 'planning_define_dream_outcome',
    title: "Define your audience's dream outcome",
    phase: 'planning',
    funnelTypes: ['all'],
    order: 3,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['planning_define_problem'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'The outcome sounds human, not marketing-heavy',
      'It feels achievable for your audience',
    ],
    whyItMatters: 'This step helps you describe what "success" looks like for your audience once their problem is solved — in real, human terms.',
    instructions: [
      'Describe what life looks like after the problem is solved',
      'Keep it realistic and grounded',
      'Focus on clarity, relief, or confidence — not hype',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'dream_outcome', label: 'What is their dream outcome?', type: 'textarea', required: true, placeholder: 'Describe what success looks like for them...' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/planning_define_dream_outcome',
  },
  {
    taskId: 'planning_time_effort_perception',
    title: 'Time & Effort Perception',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 4,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['planning_define_dream_outcome'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve identified an early relief or result',
      'You understand what your offer simplifies',
    ],
    whyItMatters: 'People often overestimate how hard change will be. This step helps you define why your offer feels lighter and more approachable than they expect.',
    instructions: [
      'Think about what feels easier than expected',
      'Focus on perception, not tactics or steps',
      'Keep it calm and realistic',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'quick_wins', 
          label: 'What\'s one small result or relief your audience can experience early?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe an early moment of relief or clarity...',
          helperText: 'This should feel reassuring — not impressive.'
        },
        { 
          name: 'friction_reducers', 
          label: 'What does your offer remove or simplify for them?', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Think about confusion, setup, or decision fatigue — not effort alone...',
          helperText: 'Think about confusion, setup, or decision fatigue — not effort alone.'
        },
        { 
          name: 'effort_reframe', 
          label: 'How would you honestly describe the effort required?', 
          type: 'textarea', 
          required: false, 
          placeholder: 'Use plain language. This should feel realistic and calming...',
          sectionLabel: 'Optional: Helpful context',
          helperText: 'This doesn\'t lock you in — it\'s just a way to think it through.'
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/planning_time_effort_perception',
  },
  {
    taskId: 'planning_perceived_likelihood',
    title: 'Increase belief that this will work',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 5,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['planning_define_dream_outcome'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You understand what makes your audience skeptical',
      'You\'ve identified at least one way to build trust',
    ],
    whyItMatters: 'Even if people want the outcome, they won\'t move forward unless they believe it can work for them. This step helps you understand and address that doubt.',
    instructions: [
      'Identify why your audience hasn\'t solved this yet',
      'Think about what they\'ve already tried',
      'Decide what would help them believe this is different',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'past_attempts', label: 'What have they tried before?', type: 'textarea', required: true, placeholder: 'Describe what they\'ve tried that didn\'t work...' },
        { name: 'belief_blockers', label: 'What makes them skeptical?', type: 'textarea', required: true, placeholder: 'What doubts or objections do they have?' },
        { name: 'belief_builders', label: 'How will you build trust?', type: 'textarea', required: true, placeholder: 'What will help them believe this is different? (e.g., clarity, support, proof, simplicity)' },
      ],
    },
    aiAssistModes: ['examples', 'help_me_choose'],
    route: '/projects/:id/tasks/planning_perceived_likelihood',
  },
  {
    taskId: 'planning_offer_snapshot',
    title: 'Create a simple offer snapshot',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 6,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['planning_time_effort_perception'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You can explain your offer in one or two sentences',
      'The offer clearly connects to the problem and outcome',
    ],
    whyItMatters: 'This step pulls everything together into a clear snapshot of what you\'re offering — without overthinking or overbuilding.',
    instructions: [
      'Name your offer (working name is fine)',
      'Describe what you help people do',
      'Keep it simple — this is not your sales page',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'offer_name', label: 'What will you call your offer?', type: 'text', required: true, placeholder: 'Working name for your offer...' },
        { name: 'offer_description', label: 'What does your offer help people do?', type: 'textarea', required: true, placeholder: 'Describe your offer in 1-2 sentences...' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/planning_offer_snapshot',
  },
  {
    taskId: 'planning_choose_launch_path',
    title: 'Choose how you\'ll sell your offer',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 7,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['planning_offer_snapshot'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve selected one launch path',
      'You understand why it fits your offer',
    ],
    whyItMatters: 'This step determines the path your audience will take from discovering your offer to buying it. Choosing a clear path prevents overcomplication later.',
    instructions: [
      'Review the launch path options',
      'Choose the option that feels simplest',
      'Save your selection to continue',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        { value: 'content_to_offer', label: 'Content → Offer', description: 'Share content that leads directly to your offer — simple and direct' },
        { value: 'freebie_email_offer', label: 'Freebie → Email → Offer', description: 'Offer something free to build your list, then nurture with emails' },
        { value: 'live_training_offer', label: 'Live Training → Offer', description: 'Teach something valuable live, then invite viewers to join your program' },
        { value: 'application_call', label: 'Application → Call', description: 'Qualify leads through an application, then close on a call' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples'],
    route: '/projects/:id/tasks/planning_choose_launch_path',
  },
  {
    taskId: 'planning_phase_review',
    title: 'Review your plan',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 8,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: false,
    dependencies: ['planning_choose_launch_path'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Everything feels clear and aligned',
      'You\'re ready to move into messaging',
    ],
    whyItMatters: 'This step helps you see everything you\'ve defined so far in one place and confirm it feels aligned before moving forward.',
    instructions: [
      'Review your audience, problem, and outcome',
      'Confirm your offer and launch path',
      'Make small edits if needed',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'audience_reviewed', label: 'Target audience defined', description: 'I know exactly who this is for' },
        { value: 'problem_reviewed', label: 'Main problem identified', description: 'The problem feels specific and real' },
        { value: 'outcome_reviewed', label: 'Dream outcome clear', description: 'I can describe success in human terms' },
        { value: 'time_effort_reviewed', label: 'Time & effort perception defined', description: 'Early relief • Reduced friction • Realistic effort' },
        { value: 'belief_reviewed', label: 'Trust factors identified', description: 'I know how to address skepticism' },
        { value: 'offer_reviewed', label: 'Offer snapshot ready', description: 'I can explain my offer simply' },
        { value: 'path_reviewed', label: 'Launch path selected', description: 'I know how I\'ll sell this' },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/planning_phase_review',
  },

  // ==================== MESSAGING PHASE ====================
  // Goal: "Know what to say about your offer — simply, confidently, and consistently."
  {
    taskId: 'messaging_core_message',
    title: 'Clarify your core message',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 1,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['planning_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your message is clear in one or two sentences',
      'You could explain it out loud without notes',
    ],
    whyItMatters: 'This step helps you define the main idea you want people to understand about your offer. Everything you say later will build from this.',
    instructions: [
      'Think about what you want your audience to "get" immediately',
      'Keep it simple — one main idea',
      'Avoid trying to explain everything at once',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'core_message', label: 'What is your core message?', type: 'textarea', required: true, placeholder: 'The one thing you want people to understand about your offer...' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/messaging_core_message',
  },
  {
    taskId: 'messaging_transformation_statement',
    title: 'Write your transformation statement',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['messaging_core_message'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'The statement sounds like something a real person would say',
      'It feels motivating but not exaggerated',
    ],
    whyItMatters: 'This statement describes the change your audience experiences after using your offer. It helps people quickly understand the value without details.',
    instructions: [
      'Start with where your audience is now',
      'End with where they want to be',
      'Keep it human and realistic',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'transformation_statement', label: 'Your transformation statement', type: 'textarea', required: true, placeholder: 'I help [audience] go from [current state] to [desired state]...' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/messaging_transformation_statement',
  },
  {
    taskId: 'messaging_talking_points',
    title: 'Define your key talking points',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 3,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['messaging_transformation_statement'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have at least 3 clear talking points',
      'Each point connects back to your offer',
    ],
    whyItMatters: 'Talking points help you stay consistent when creating content, writing emails, or explaining your offer — without memorizing scripts.',
    instructions: [
      'List 3–5 ideas you\'ll repeat often',
      'Each point should support your core message',
      'Keep them short and flexible',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'talking_point_1', label: 'Talking point #1', type: 'textarea', required: true, placeholder: 'A key idea you want to repeat...' },
        { name: 'talking_point_2', label: 'Talking point #2', type: 'textarea', required: true, placeholder: 'Another key idea...' },
        { name: 'talking_point_3', label: 'Talking point #3', type: 'textarea', required: true, placeholder: 'One more key idea...' },
        { name: 'talking_point_4', label: 'Talking point #4 (optional)', type: 'textarea', required: false, placeholder: 'Optional additional point...' },
        { name: 'talking_point_5', label: 'Talking point #5 (optional)', type: 'textarea', required: false, placeholder: 'Optional additional point...' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/messaging_talking_points',
  },
  {
    taskId: 'messaging_common_objections',
    title: 'Identify common objections',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 4,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['messaging_talking_points'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Objections sound realistic and familiar',
      'You can imagine hearing these from your audience',
    ],
    whyItMatters: 'This step helps you understand what might stop someone from saying yes — so you can address it naturally instead of sounding salesy.',
    instructions: [
      'Think about what your audience might hesitate over',
      'Write objections in their own words',
      'Focus on the most common concerns',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'objection_1', label: 'Common objection #1', type: 'textarea', required: true, placeholder: 'What might make them hesitate?' },
        { name: 'objection_2', label: 'Common objection #2', type: 'textarea', required: true, placeholder: 'Another concern they might have...' },
        { name: 'objection_3', label: 'Common objection #3', type: 'textarea', required: true, placeholder: 'One more thing that might hold them back...' },
        { name: 'objection_4', label: 'Common objection #4 (optional)', type: 'textarea', required: false, placeholder: 'Optional additional objection...' },
        { name: 'objection_5', label: 'Common objection #5 (optional)', type: 'textarea', required: false, placeholder: 'Optional additional objection...' },
      ],
    },
    aiAssistModes: ['examples', 'help_me_choose'],
    route: '/projects/:id/tasks/messaging_common_objections',
  },
  {
    taskId: 'messaging_phase_review',
    title: 'Review your messaging',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 5,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: false,
    dependencies: ['messaging_common_objections'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your messaging feels clear and consistent',
      'You\'re ready to move into building',
    ],
    whyItMatters: 'This step helps you see your messaging together and confirm it feels aligned — without overthinking or perfecting.',
    instructions: [
      'Review your core message and transformation statement',
      'Skim your talking points and objections',
      'Make small edits if needed',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'core_message_reviewed', label: 'Core message defined', description: 'I can explain my offer simply' },
        { value: 'transformation_reviewed', label: 'Transformation statement written', description: 'The change feels clear and real' },
        { value: 'talking_points_reviewed', label: 'Talking points identified', description: 'I have 3+ ideas to repeat' },
        { value: 'objections_reviewed', label: 'Common objections listed', description: 'I know what might hold them back' },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/messaging_phase_review',
  },

  // ==================== BUILD PHASE ====================
  // Goal: "Put your offer somewhere real so people can find it and buy it — without tech overwhelm."
  {
    taskId: 'build_choose_platform',
    title: 'Decide where your offer will live',
    phase: 'build',
    funnelTypes: ['all'],
    order: 1,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['messaging_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve chosen one place for your offer to live',
      'You feel comfortable starting there',
    ],
    whyItMatters: 'This step helps you choose one place where people can learn about and buy your offer. Choosing a starting point removes a lot of tech confusion.',
    instructions: [
      'Decide what type of platform you\'ll use (website, checkout page, course platform, etc.)',
      'Choose the option that feels simplest right now',
      'Remember: this does not need to be permanent',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'platform_type', label: 'What type of platform will you use?', type: 'select', required: true, placeholder: 'Choose one...' },
        { name: 'platform_name', label: 'Which specific platform? (optional)', type: 'text', required: false, placeholder: 'e.g., Kajabi, Gumroad, Squarespace...' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/build_choose_platform',
  },
  {
    taskId: 'build_main_page_setup',
    title: 'Set up your main page (minimum version)',
    phase: 'build',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 30,
    estimatedMinutesMax: 60,
    blocking: true,
    dependencies: ['build_choose_platform'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your page exists and is accessible',
      'Someone could understand your offer from it',
    ],
    whyItMatters: 'This step makes your offer real. You\'re creating a simple page where people can understand what you\'re offering and take the next step.',
    instructions: [
      'Create one page for your offer',
      'Add a short description of what it helps people do',
      'Include one clear next step (sign up, apply, or buy)',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'page_created', label: 'Page created', description: 'Your offer page exists online' },
        { value: 'description_added', label: 'Description added', description: 'Someone can understand what you offer' },
        { value: 'next_step_clear', label: 'Next step is clear', description: 'There\'s a way to sign up, apply, or buy' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/build_main_page_setup',
  },
  {
    taskId: 'build_email_platform',
    title: 'Connect your email platform',
    phase: 'build',
    funnelTypes: ['all'],
    order: 3,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['build_main_page_setup'],
    canSkip: true,
    skipReasonRequired: true,
    completionCriteria: [
      'You know how people will hear from you after signing up',
    ],
    whyItMatters: 'This allows you to stay in touch with people who show interest in your offer — even if they don\'t buy right away.',
    instructions: [
      'Decide where emails will come from',
      'Connect your signup form or opt-in',
      'Send a test email to yourself',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'email_platform', label: 'Which email platform will you use?', type: 'text', required: false, placeholder: 'e.g., ConvertKit, Mailchimp, Flodesk...' },
        { name: 'email_test_sent', label: 'Have you sent a test email?', type: 'text', required: false, placeholder: 'Yes / Not yet' },
      ],
    },
    aiAssistModes: ['simplify', 'help_me_choose'],
    route: '/projects/:id/tasks/build_email_platform',
  },
  {
    taskId: 'build_payments_setup',
    title: 'Set up payments',
    phase: 'build',
    funnelTypes: ['all'],
    order: 4,
    priority: 2,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 45,
    blocking: false,
    dependencies: ['build_main_page_setup'],
    canSkip: true,
    skipReasonRequired: true,
    completionCriteria: [
      'You understand how payment will happen for this offer',
    ],
    whyItMatters: 'This step ensures people can pay you when they\'re ready. It doesn\'t need to be fancy — it just needs to work.',
    instructions: [
      'Connect a payment provider',
      'Add a product or price',
      'Run a test payment if possible',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'payment_provider', label: 'Which payment provider will you use?', type: 'text', required: false, placeholder: 'e.g., Stripe, PayPal, Gumroad...' },
        { name: 'test_payment_complete', label: 'Have you run a test payment?', type: 'text', required: false, placeholder: 'Yes / Not yet' },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/build_payments_setup',
  },
  {
    taskId: 'build_phase_review',
    title: 'Review your setup',
    phase: 'build',
    funnelTypes: ['all'],
    order: 5,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: false,
    dependencies: ['build_main_page_setup'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your offer exists online',
      'You\'re ready to tell people about it',
    ],
    whyItMatters: 'This step helps you confirm you\'ve done enough to move forward — without getting stuck perfecting things.',
    instructions: [
      'Confirm your offer has a place to live',
      'Confirm people can take a next step',
      'Remind yourself you can improve later',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'platform_chosen', label: 'Platform chosen', description: 'I know where my offer lives' },
        { value: 'page_ready', label: 'Main page ready', description: 'People can find and understand my offer' },
        { value: 'ready_to_share', label: 'Ready to share', description: 'I\'m ready to tell people about it' },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/build_phase_review',
  },

  // ==================== CONTENT PHASE ====================
  // Goal: "Know what to say and have enough content planned to confidently launch — without pressure or perfection."
  {
    taskId: 'content_choose_platforms',
    title: 'Choose where you\'ll show up',
    phase: 'content',
    funnelTypes: ['all'],
    order: 1,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['build_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve chosen where you\'ll focus your content',
      'You\'re not trying to be everywhere',
    ],
    whyItMatters: 'This step helps you focus your energy instead of spreading yourself thin. You only need one or two places to show up consistently for this launch.',
    instructions: [
      'Choose 1–2 platforms you\'ll focus on',
      'Pick the platform(s) that feel easiest for you',
      'Ignore where you "should" be — choose what you\'ll actually use',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'platforms', label: 'Which platforms will you focus on? (pick 1-2)', type: 'textarea', required: true, placeholder: 'e.g., Instagram and Email, or just TikTok...' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/content_choose_platforms',
  },
  {
    taskId: 'content_define_themes',
    title: 'Define your content themes',
    phase: 'content',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['content_choose_platforms'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have 3–5 clear themes',
      'Each theme connects back to your offer',
    ],
    whyItMatters: 'Content themes give you direction so you\'re not starting from scratch every time. They help you repeat the same ideas in different ways.',
    instructions: [
      'Review your core message and talking points',
      'Choose 3–5 themes you\'ll talk about often',
      'Keep themes broad and flexible',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'theme_1', label: 'Theme 1', type: 'text', required: true, placeholder: 'e.g., Behind-the-scenes of my process' },
        { name: 'theme_2', label: 'Theme 2', type: 'text', required: true, placeholder: 'e.g., Common mistakes in my niche' },
        { name: 'theme_3', label: 'Theme 3', type: 'text', required: true, placeholder: 'e.g., Quick tips and wins' },
        { name: 'theme_4', label: 'Theme 4 (optional)', type: 'text', required: false, placeholder: 'e.g., Client/customer stories' },
        { name: 'theme_5', label: 'Theme 5 (optional)', type: 'text', required: false, placeholder: 'e.g., Personal stories and lessons' },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/content_define_themes',
  },
  {
    taskId: 'content_plan_launch_window',
    title: 'Plan your launch content',
    phase: 'content',
    funnelTypes: ['all'],
    order: 3,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 45,
    blocking: true,
    dependencies: ['content_define_themes'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You know what you\'re posting during this launch',
      'Each post has a clear purpose',
    ],
    whyItMatters: 'This step helps you plan just enough content for this launch — without overplanning or burning out.',
    instructions: [
      'Plan content for the next 7–14 days only',
      'Make sure each piece supports awareness, trust, or conversion',
      'Aim for consistency, not volume',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'launch_window_days', label: 'How many days will you plan for?', type: 'select', required: true, placeholder: 'Choose 7 or 14 days' },
        { name: 'planned_posts_summary', label: 'Outline your planned posts', type: 'textarea', required: true, placeholder: 'Post 1: [Theme] - [Goal: awareness/trust/conversion]\nPost 2: ...' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples'],
    route: '/projects/:id/tasks/content_plan_launch_window',
  },
  {
    taskId: 'content_write_captions',
    title: 'Write simple captions (first drafts)',
    phase: 'content',
    funnelTypes: ['all'],
    order: 4,
    priority: 1,
    estimatedMinutesMin: 30,
    estimatedMinutesMax: 60,
    blocking: true,
    dependencies: ['content_plan_launch_window'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Every planned post has a draft caption',
      'You\'re no longer staring at a blank page',
    ],
    whyItMatters: 'Writing first drafts removes the fear of posting. These do not need to be perfect — they just need to exist.',
    instructions: [
      'Write 1–3 sentences for each planned post',
      'Focus on clarity, not cleverness',
      'You can refine later — this is just a starting point',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'captions_written', label: 'Have you drafted captions for all planned posts?', type: 'text', required: true, placeholder: 'Yes / In progress' },
        { name: 'sample_caption', label: 'Share one of your draft captions', type: 'textarea', required: false, placeholder: 'Paste a sample caption here...' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/content_write_captions',
  },
  {
    taskId: 'content_phase_review',
    title: 'Review your content',
    phase: 'content',
    funnelTypes: ['all'],
    order: 5,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 15,
    blocking: false,
    dependencies: ['content_write_captions'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your content feels aligned with your offer',
      'You feel ready to share it publicly',
    ],
    whyItMatters: 'This step helps you confirm that you have enough content to launch — and stops you from overworking.',
    instructions: [
      'Review your platforms, themes, and captions',
      'Make small edits if something feels unclear',
      'Remind yourself this content does not need to be perfect',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'platforms_chosen', label: 'Platforms chosen', description: 'I know where I\'m showing up' },
        { value: 'themes_defined', label: 'Themes defined', description: 'I have 3–5 themes to guide my content' },
        { value: 'posts_planned', label: 'Posts planned', description: 'I know what I\'m posting for this launch' },
        { value: 'captions_drafted', label: 'Captions drafted', description: 'Each post has a first draft' },
        { value: 'ready_to_share', label: 'Ready to share', description: 'I feel ready to start posting' },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/content_phase_review',
  },

  // ==================== LAUNCH PHASE ====================
  // Goal: "Share your offer intentionally and complete your launch — without pressure, urgency, or burnout."
  {
    taskId: 'launch_set_window',
    title: 'Set your launch window',
    phase: 'launch',
    funnelTypes: ['all'],
    order: 1,
    priority: 1,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['content_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve chosen a clear launch window',
      'You know when your launch starts and ends',
    ],
    whyItMatters: 'This step gives your launch a clear beginning and end. Having a defined window reduces stress and prevents your launch from dragging on indefinitely.',
    instructions: [
      'Choose how many days you\'ll actively talk about your offer',
      'Pick a window that feels manageable',
      'Remember: this is flexible — not a rule',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'launch_window_days', label: 'How long will your launch window be?', type: 'select', required: true, placeholder: 'Choose 3, 5, or 7 days' },
        { name: 'launch_start_date', label: 'When does your launch start? (optional)', type: 'text', required: false, placeholder: 'e.g., Monday, January 15' },
      ],
    },
    aiAssistModes: ['simplify', 'help_me_choose'],
    route: '/projects/:id/tasks/launch_set_window',
  },
  {
    taskId: 'launch_prepare_announcement',
    title: 'Prepare your main announcement',
    phase: 'launch',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['launch_set_window'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have one clear announcement ready',
      'It sounds like something you\'d actually say',
    ],
    whyItMatters: 'This is the message where you tell people your offer exists. It doesn\'t need to be perfect — it just needs to be clear.',
    instructions: [
      'Decide where you\'ll share your main announcement',
      'Write a simple message using your existing messaging',
      'Focus on clarity, not hype',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'announcement_platform', label: 'Where will you share your main announcement?', type: 'text', required: true, placeholder: 'e.g., Instagram, Email, both...' },
        { name: 'announcement_copy', label: 'Draft your announcement message', type: 'textarea', required: true, placeholder: 'Write a simple, clear message about your offer...' },
      ],
    },
    aiAssistModes: ['simplify', 'examples'],
    route: '/projects/:id/tasks/launch_prepare_announcement',
  },
  {
    taskId: 'launch_share_offer',
    title: 'Share your offer',
    phase: 'launch',
    funnelTypes: ['all'],
    order: 3,
    priority: 1,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['launch_prepare_announcement'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your offer has been shared publicly or privately',
      'You\'ve taken action, regardless of the response',
    ],
    whyItMatters: 'This is the moment your launch becomes real. Sharing your offer is the most important step — everything else supports this.',
    instructions: [
      'Post or send your announcement',
      'Share the link or next step',
      'Take a breath — this part counts',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'shared_confirmation', label: 'I\'ve shared my offer', description: 'My announcement is live' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/launch_share_offer',
  },
  {
    taskId: 'launch_follow_up',
    title: 'Follow up during your launch',
    phase: 'launch',
    funnelTypes: ['all'],
    order: 4,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['launch_share_offer'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You know how and when you\'ll follow up',
      'Follow-ups feel natural, not forced',
    ],
    whyItMatters: 'Most people don\'t see things the first time. Following up helps remind people — without being pushy.',
    instructions: [
      'Plan 2–3 follow-up reminders',
      'Reuse your existing content themes',
      'Keep it conversational and supportive',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'follow_up_count', label: 'How many follow-up reminders will you send?', type: 'select', required: true, placeholder: 'Choose 2 or 3' },
        { name: 'follow_up_notes', label: 'Notes on your follow-up plan (optional)', type: 'textarea', required: false, placeholder: 'When and where will you follow up?' },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/launch_follow_up',
  },
  {
    taskId: 'launch_phase_review',
    title: 'Review & close your launch',
    phase: 'launch',
    funnelTypes: ['all'],
    order: 5,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 15,
    blocking: false,
    dependencies: ['launch_follow_up'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve marked your launch as complete',
      'You feel ready to move forward',
    ],
    whyItMatters: 'This step helps you intentionally end your launch so you don\'t stay in "launch mode" forever.',
    instructions: [
      'Acknowledge that this launch is complete',
      'Note anything that felt good or challenging',
      'Close this chapter — you can always launch again',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'launch_reflection', label: 'Any reflections on this launch? (optional)', type: 'textarea', required: false, placeholder: 'What felt good? What was challenging?' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/launch_phase_review',
  },

  // ==================== POST-LAUNCH PHASE ====================
  // Goal: "Reflect without shame, recognize progress, and decide what's next — calmly."
  {
    taskId: 'postlaunch_acknowledge_completion',
    title: 'You completed your launch',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 1,
    priority: 1,
    estimatedMinutesMin: 2,
    estimatedMinutesMax: 5,
    blocking: true,
    dependencies: ['launch_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'The launch is acknowledged as complete',
      'User intentionally moves forward',
    ],
    whyItMatters: 'Most people never finish a full launch. Pausing to acknowledge completion helps you build confidence and close this chapter before moving on.',
    instructions: [
      'Read the summary of what you completed',
      'Take a moment to recognize the work you did',
      'Continue when you\'re ready',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'acknowledged', label: 'I acknowledge my launch is complete', description: 'Take a moment to recognize everything you accomplished' },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/postlaunch_acknowledge_completion',
  },
  {
    taskId: 'postlaunch_reflection',
    title: 'Reflect on the experience',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['postlaunch_acknowledge_completion'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'At least one reflection is captured',
      'The user feels heard, not evaluated',
    ],
    whyItMatters: 'This step helps you notice what the launch felt like — without analyzing results or judging yourself.',
    instructions: [
      'Answer honestly — there are no right or wrong responses',
      'Focus on how the process felt, not how it performed',
      'Keep responses short and simple',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'felt_easier_than_expected', label: 'What felt easier than expected?', type: 'textarea', required: false, placeholder: 'Optional — share anything that surprised you positively' },
        { name: 'felt_more_challenging', label: 'What felt more challenging?', type: 'textarea', required: false, placeholder: 'Optional — share anything that was harder than you thought' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/postlaunch_reflection',
  },
  {
    taskId: 'postlaunch_what_worked',
    title: 'Notice what worked',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 3,
    priority: 1,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['postlaunch_reflection'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'At least one positive takeaway is identified',
      'User can see progress, not just gaps',
    ],
    whyItMatters: 'This step rebuilds confidence by focusing on wins — even small ones — instead of obsessing over outcomes.',
    instructions: [
      'Identify anything that felt positive or aligned',
      'This can be effort, clarity, follow-through, or confidence',
      'Numbers are not required',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'what_worked_1', label: 'Something that worked', type: 'text', required: true, placeholder: 'Even small wins count' },
        { name: 'what_worked_2', label: 'Another thing that worked', type: 'text', required: false },
        { name: 'what_worked_3', label: 'Something else', type: 'text', required: false },
        { name: 'what_worked_4', label: 'Keep going...', type: 'text', required: false },
        { name: 'what_worked_5', label: 'One more', type: 'text', required: false },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/postlaunch_what_worked',
  },
  {
    taskId: 'postlaunch_next_step',
    title: 'Decide what\'s next',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 4,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: false,
    dependencies: ['postlaunch_what_worked'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'A next step is selected',
      'The user feels grounded, not rushed',
    ],
    whyItMatters: 'Choosing a next step prevents quitting, spiraling, or overreacting. There\'s no "correct" option — just what fits right now.',
    instructions: [
      'Review the available options',
      'Choose the path that feels most supportive',
      'Remember: you can always change your mind',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        { value: 'relaunch', label: 'Relaunch this offer with small changes', description: 'Make minor adjustments and launch again' },
        { value: 'improve_phase', label: 'Improve one phase before relaunching', description: 'Focus on strengthening a specific area' },
        { value: 'pause_reflect', label: 'Pause and reflect before continuing', description: 'Take time to process before next steps' },
        { value: 'new_project', label: 'Start a new project', description: 'Begin something fresh with what you learned' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'simplify'],
    route: '/projects/:id/tasks/postlaunch_next_step',
  },
];

// Add all funnel delta tasks to the main TASK_TEMPLATES array
// This ensures they can be found by getTaskTemplate
TASK_TEMPLATES.push(
  ...FREEBIE_EMAIL_OFFER_DELTA_TASKS,
  ...LIVE_TRAINING_OFFER_DELTA_TASKS,
  ...APPLICATION_CALL_DELTA_TASKS
);

// Helper function to get tasks for a specific funnel type
export function getTasksForFunnelType(funnelType: string): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => 
    task.funnelTypes.includes('all') || task.funnelTypes.includes(funnelType as any)
  );
}

// Helper function to get universal tasks (applies to all funnel types)
export function getUniversalTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.funnelTypes.includes('all'));
}

// Get planning phase tasks specifically
export function getPlanningTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === 'planning');
}

// Get messaging phase tasks specifically
export function getMessagingTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === 'messaging');
}

// Get build phase tasks specifically (universal only)
export function getBuildTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === 'build' && task.funnelTypes.includes('all'));
}

// Get build phase tasks for a specific funnel type (universal + funnel-specific)
export function getBuildTasksForFunnel(funnelType: string | null): TaskTemplate[] {
  return TASK_TEMPLATES
    .filter(task => task.phase === 'build' && (
      task.funnelTypes.includes('all') || 
      (funnelType && task.funnelTypes.includes(funnelType as any))
    ))
    .sort((a, b) => a.order - b.order);
}

// Get content phase tasks specifically (universal only)
export function getContentTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === 'content' && task.funnelTypes.includes('all'));
}

// Get content phase tasks for a specific funnel type (universal + funnel-specific)
export function getContentTasksForFunnel(funnelType: string | null): TaskTemplate[] {
  return TASK_TEMPLATES
    .filter(task => task.phase === 'content' && (
      task.funnelTypes.includes('all') || 
      (funnelType && task.funnelTypes.includes(funnelType as any))
    ))
    .sort((a, b) => a.order - b.order);
}

// Get launch phase tasks specifically (universal only)
export function getLaunchTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === 'launch' && task.funnelTypes.includes('all'));
}

// Get launch phase tasks for a specific funnel type (universal + funnel-specific)
export function getLaunchTasksForFunnel(funnelType: string | null): TaskTemplate[] {
  return TASK_TEMPLATES
    .filter(task => task.phase === 'launch' && (
      task.funnelTypes.includes('all') || 
      (funnelType && task.funnelTypes.includes(funnelType as any))
    ))
    .sort((a, b) => a.order - b.order);
}

// Get post-launch phase tasks specifically
export function getPostLaunchTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === 'post-launch' && task.funnelTypes.includes('all'));
}

// Get tasks by phase
export function getTasksByPhase(phase: string): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === phase);
}

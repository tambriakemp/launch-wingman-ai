import { TaskTemplate } from '@/types/tasks';
import {
  FREEBIE_EMAIL_OFFER_DELTA_TASKS,
  LIVE_TRAINING_OFFER_DELTA_TASKS,
  APPLICATION_CALL_DELTA_TASKS,
  MEMBERSHIP_DELTA_TASKS,
  CHALLENGE_DELTA_TASKS,
  LAUNCH_DELTA_TASKS,
  CONTENT_TO_OFFER_DELTA_TASKS,
} from './funnelDeltaTasks';

// ============================================================
// V2 TASK TEMPLATES — active tasks for the new architecture
// 9 phases, 80 tasks, Cre8 Visions app companion
// ============================================================
export const TASK_TEMPLATES: TaskTemplate[] = [

  // ============================================================
  // PHASE 0 — BUSINESS FOUNDATION
  // "Get your business set up before you build on it."
  // 10 tasks. Every user goes through this first.
  // Established businesses fill it in fast.
  // New businesses use it as their build checklist.
  // Tasks 1-2 are blocking. All others are skippable.
  // ============================================================

  {
    taskId: 'foundation_business_name',
    title: 'Set your business name and tagline',
    phase: 'foundation',
    funnelTypes: ['all'],
    order: 1,
    priority: 1,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: [],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a business name you are actively using',
      'You have written a one-sentence description of what you do',
    ],
    whyItMatters: 'Your business name and tagline are the first things people see — on your site, your social profiles, your Google listing, and anywhere you show up. Getting these locked in now means every step that follows builds on a clear foundation instead of a moving target.',
    instructions: [
      'Enter the name you use (or want to use) for your business — this is what goes on your website, email, and everywhere else',
      'Write a one-liner that says who you help and what you help them do — keep it plain, no jargon',
      'If you operate under a different name than your legal business name, add that too',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'business_name',
          label: 'Business name',
          type: 'text',
          required: true,
          placeholder: 'e.g. Cre8 Visions, Auto Glass by Marcus, The Wellness Studio',
        },
        {
          name: 'tagline',
          label: 'What do you do? (one sentence)',
          type: 'textarea',
          required: true,
          placeholder: 'e.g. We build the websites and AI marketing systems that help small businesses grow.',
          helperText: 'Write it like you\'d say it to someone at a cookout — not a LinkedIn bio.',
        },
        {
          name: 'doing_business_as',
          label: 'DBA / trade name (if different from legal name)',
          type: 'text',
          required: false,
          placeholder: 'Leave blank if not applicable',
        },
      ],
    },
    aiAssistModes: ['ai_prompt', 'examples'],
    aiPrompt: 'I need help writing a one-sentence business tagline. My business is called [business name] and I help [describe who you help] to [describe what you help them do or achieve]. Write 5 tagline options that are plain, specific, and sound like a real person talking — not a marketing slogan. No jargon, no buzzwords.',
    toolLinks: [],
    route: '/projects/:id/tasks/foundation_business_name',
    exampleText: 'Auto Glass by Marcus → "I fix windshields and windows fast — same-day service for cars, trucks, and fleets in the Atlanta area."\n\nCre8 Visions → "We build the AI systems that run your business — from your first website to your full marketing engine."',
    brainUpdatePrompt: 'Add my business name and tagline to my business brain: Business name: [your answer]. Tagline: [your answer]. Use this as context whenever you help me with marketing, content, or messaging.',
  },

  {
    taskId: 'foundation_business_type',
    title: 'Confirm your business structure',
    phase: 'foundation',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: true,
    dependencies: ['foundation_business_name'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You know what type of business entity you are operating as right now',
      'You have noted anything still in progress so you can track it',
    ],
    whyItMatters: 'Banks, payment processors, clients, and platforms ask for this. Knowing your structure — and what\'s missing — helps you move faster and look like a real business from day one. If something is still being set up, noting it here keeps it on your radar.',
    instructions: [
      'Select the structure that best describes your business right now — if you\'re in progress, pick the one you\'re working toward',
      'Enter the industry you operate in — be specific, not broad (e.g. "auto glass repair" not "services")',
      'Note anything still in progress so you have a clear picture of what\'s needed',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'entity_type',
          label: 'Business structure',
          type: 'select',
          required: true,
          placeholder: 'Select your structure...',
          options: [
            { value: 'sole_prop', label: 'Sole Proprietor — operating under my own name' },
            { value: 'dba', label: 'DBA / Fictitious name — operating under a business name' },
            { value: 'llc', label: 'LLC — Limited Liability Company' },
            { value: 'llc_pending', label: 'LLC in progress — filing or renewing' },
            { value: 's_corp', label: 'S-Corp' },
            { value: 'c_corp', label: 'C-Corp' },
            { value: 'nonprofit', label: 'Nonprofit' },
            { value: 'not_sure', label: 'Not sure yet' },
          ],
        },
        {
          name: 'industry',
          label: 'What industry are you in?',
          type: 'text',
          required: true,
          placeholder: 'e.g. Auto glass repair, Digital marketing, Hair salon, Construction, Life coaching',
          helperText: 'Be specific — this helps the app give you more relevant guidance throughout.',
        },
        {
          name: 'years_in_business',
          label: 'How long have you been in business?',
          type: 'select',
          required: false,
          placeholder: 'Select...',
          options: [
            { value: 'idea_stage', label: 'Just getting started — pre-revenue' },
            { value: 'less_than_1', label: 'Less than a year' },
            { value: '1_to_3', label: '1–3 years' },
            { value: '3_to_5', label: '3–5 years' },
            { value: '5_plus', label: '5+ years' },
          ],
        },
        {
          name: 'structure_notes',
          label: 'Anything still in progress? (optional)',
          type: 'textarea',
          required: false,
          placeholder: 'e.g. Need to renew LLC, waiting on EIN, need to open a business bank account, need to register with state...',
          helperText: 'Noting gaps here keeps them visible so nothing falls through.',
        },
      ],
    },
    aiAssistModes: ['ai_prompt', 'simplify'],
    aiPrompt: 'I need to understand what business structure is right for me. My situation: [describe your business and current setup]. What are the key differences between a sole proprietor, DBA, and LLC for someone in my situation? What should I prioritize setting up first? Give me a clear, plain-language answer.',
    toolLinks: [],
    route: '/projects/:id/tasks/foundation_business_type',
    brainUpdatePrompt: 'Add my business structure to my business brain: Entity type: [your answer]. Industry: [your answer]. Years in business: [your answer]. Any pending items: [your notes]. Reference this when helping me with business setup, legal, or financial questions.',
  },

  {
    taskId: 'foundation_contact_info',
    title: 'Set up your professional contact info',
    phase: 'foundation',
    funnelTypes: ['all'],
    order: 3,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['foundation_business_name'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a professional email address that is not a personal Gmail or Hotmail',
      'You know what phone number you will use for business communication',
    ],
    whyItMatters: 'A professional email (you@yourbusiness.com) builds trust the moment someone sees it. Using a personal Gmail for business makes you look like a side hustle, not a company — even if your work is excellent. This is one of the cheapest credibility upgrades you can make.',
    instructions: [
      'Enter the email you currently use for business — if it\'s a personal Gmail, that\'s okay for now, but note it so you can upgrade',
      'Google Workspace gives you a professional email for $6/month — it connects to your domain and looks like you@yourbusiness.com',
      'Add your business phone number — if you don\'t have a separate one, Google Voice gives you a free one that keeps your personal number private',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'business_email',
          label: 'Business email address',
          type: 'text',
          required: true,
          placeholder: 'e.g. hello@yourbusiness.com or yourname@gmail.com',
        },
        {
          name: 'email_type',
          label: 'What kind of email is this?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'custom_domain', label: 'Custom domain email — you@yourbusiness.com' },
            { value: 'google_workspace', label: 'Google Workspace' },
            { value: 'personal_gmail', label: 'Personal Gmail — need to upgrade eventually' },
            { value: 'outlook_personal', label: 'Personal Outlook or Hotmail — need to upgrade' },
            { value: 'other_personal', label: 'Other personal email — need to upgrade' },
          ],
        },
        {
          name: 'business_phone',
          label: 'Business phone number',
          type: 'text',
          required: false,
          placeholder: 'e.g. (404) 555-0100 or your Google Voice number',
          sectionLabel: 'Optional — add when ready',
          helperText: 'A Google Voice number is free and keeps your personal number private.',
        },
      ],
    },
    aiAssistModes: ['simplify'],
    toolLinks: [
      { label: 'Set up Google Workspace ($6/mo)', url: 'https://workspace.google.com', icon: 'mail' },
      { label: 'Get a free Google Voice number', url: 'https://voice.google.com', icon: 'phone' },
    ],
    route: '/projects/:id/tasks/foundation_contact_info',
  },

  {
    taskId: 'foundation_domain',
    title: 'Claim your domain name',
    phase: 'foundation',
    funnelTypes: ['all'],
    order: 4,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['foundation_business_name'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You own a domain name for your business, or you have confirmed you will use social profiles only for now',
      'You know where your domain is registered and how to access it',
    ],
    whyItMatters: 'Your domain is your permanent address online. Without one, every link you share, every email you send, and every site you build is on rented ground. A .com runs about $12 a year — it\'s the cheapest credibility you can buy. You need this before you build your sales page.',
    instructions: [
      'Check if you already own a domain — log into Namecheap, GoDaddy, or wherever you registered it',
      'If you don\'t have one yet, search for something close to your business name — short, easy to spell, easy to say out loud',
      'Keep it simple: yourbusinessname.com or yourname.com — avoid hyphens, numbers, and anything that needs spelling out over the phone',
      'Register it at Namecheap (recommended — lower renewal fees than GoDaddy)',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'domain_status',
          label: 'Do you have a domain?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'owned_and_connected', label: 'Yes — I own one and it\'s connected to my site' },
            { value: 'owned_not_connected', label: 'Yes — I own one but haven\'t connected it yet' },
            { value: 'need_to_buy', label: 'No — I need to register one' },
            { value: 'social_only', label: 'Not yet — using social profiles only for now' },
          ],
        },
        {
          name: 'domain_name',
          label: 'Your domain name (if you have one)',
          type: 'text',
          required: false,
          placeholder: 'e.g. yourbusiness.com',
        },
        {
          name: 'registrar',
          label: 'Where is it registered?',
          type: 'text',
          required: false,
          placeholder: 'e.g. Namecheap, GoDaddy, Google Domains',
          helperText: 'You\'ll need to know this when connecting it to your Lovable site.',
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'I need help choosing a domain name for my business. My business name is [business name] and I\'m in [industry]. Suggest 10 domain name options that are short, memorable, easy to spell out loud, and available as .com. Explain the tradeoff between using my exact business name vs a more descriptive domain.',
    toolLinks: [
      { label: 'Search & register on Namecheap', url: 'https://www.namecheap.com', icon: 'globe' },
      { label: 'Search on GoDaddy', url: 'https://www.godaddy.com', icon: 'globe' },
    ],
    route: '/projects/:id/tasks/foundation_domain',
    exampleText: 'Good: cre8visions.com, marcusautoglass.com, thewellnessstudio.com\nAvoid: marcus-auto-glass-repair-llc.com, thewellnessstudiobylauren2024.com\n\nIf your exact name is taken, try adding your city, a short descriptor, or "the" at the start.',
  },

  {
    taskId: 'foundation_website_status',
    title: 'Know where your website stands',
    phase: 'foundation',
    funnelTypes: ['all'],
    order: 5,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: false,
    dependencies: ['foundation_domain'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You know exactly what stage your website is at right now',
      'You have a clear next step — whether that\'s building, updating, or leaving it as-is',
    ],
    whyItMatters: 'Your website is where everything points — your social bio, your Google listing, your email signature, your ads. Knowing exactly where it stands helps you make one clear decision about what to do next instead of staying stuck in "I should really update that."',
    instructions: [
      'Be honest about where your website actually is today — not where you want it to be',
      'If you need to build or rebuild, the Sales Page phase of this app will walk you through it step by step using Lovable',
      'If your site is live and working, you\'ll just add a product page in a later phase',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'website_status',
          label: 'Where is your website right now?',
          type: 'select',
          required: true,
          placeholder: 'Select the most accurate option...',
          options: [
            { value: 'live_happy', label: 'Live and I\'m happy with it — just need to add a product page' },
            { value: 'live_needs_work', label: 'Live but it needs a major update or rebuild' },
            { value: 'in_progress', label: 'Currently being built — in progress' },
            { value: 'need_to_build', label: 'I need to build one from scratch' },
            { value: 'not_priority', label: 'Not a priority right now — using social only' },
          ],
        },
        {
          name: 'website_url',
          label: 'Website URL (if you have one)',
          type: 'text',
          required: false,
          placeholder: 'https://yourbusiness.com',
        },
        {
          name: 'website_platform',
          label: 'What platform is it built on?',
          type: 'text',
          required: false,
          placeholder: 'e.g. WordPress, Squarespace, Wix, Lovable, Webflow, custom',
          helperText: 'This helps us give you the right guidance in the Build phase.',
        },
      ],
    },
    aiAssistModes: ['simplify'],
    toolLinks: [],
    route: '/projects/:id/tasks/foundation_website_status',
  },

  {
    taskId: 'foundation_social_profiles',
    title: 'Audit your social media presence',
    phase: 'foundation',
    funnelTypes: ['all'],
    order: 6,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 25,
    blocking: false,
    dependencies: ['foundation_business_name'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You know which platforms you are active on and what handle you use on each',
      'Your profile photo and business name are consistent across active profiles',
    ],
    whyItMatters: 'When someone looks you up after a referral, an ad, or a Google search, they\'ll check every platform they can find. Inconsistent handles, outdated bios, or a missing profile photo lose trust before you ever get a chance to talk to them. This takes 20 minutes and pays back every time someone looks you up.',
    instructions: [
      'Go through each platform you have an account on and check your profile photo, name, and bio',
      'Make sure your business name or handle is the same (or close) across platforms',
      'Update any bio that has old information — especially if you\'ve pivoted or rebranded recently',
      'You don\'t need to be everywhere — just make sure every platform you are on looks current',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'instagram_handle',
          label: 'Instagram handle',
          type: 'text',
          required: false,
          placeholder: '@yourbusiness',
        },
        {
          name: 'facebook_url',
          label: 'Facebook business page URL',
          type: 'text',
          required: false,
          placeholder: 'facebook.com/yourbusiness',
        },
        {
          name: 'tiktok_handle',
          label: 'TikTok handle',
          type: 'text',
          required: false,
          placeholder: '@yourbusiness',
        },
        {
          name: 'linkedin_url',
          label: 'LinkedIn profile or company page',
          type: 'text',
          required: false,
          placeholder: 'linkedin.com/in/yourname',
        },
        {
          name: 'other_platforms',
          label: 'Any other platforms you use?',
          type: 'text',
          required: false,
          placeholder: 'e.g. YouTube, Pinterest, X/Twitter — list them here',
        },
        {
          name: 'primary_platform',
          label: 'Which platform is your main one?',
          type: 'text',
          required: false,
          placeholder: 'e.g. Instagram — this is where most of my audience is',
          sectionLabel: 'Your primary focus',
          helperText: 'You\'ll build your content strategy around this platform in Phase 6.',
        },
        {
          name: 'handles_consistent',
          label: 'Are your handles consistent across platforms?',
          type: 'select',
          required: false,
          placeholder: 'Select...',
          options: [
            { value: 'yes', label: 'Yes — same or very similar handle everywhere' },
            { value: 'mostly', label: 'Mostly — a few are slightly different' },
            { value: 'no', label: 'No — they\'re pretty different, need to fix this' },
            { value: 'not_sure', label: 'Not sure — haven\'t checked recently' },
          ],
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Help me write a consistent social media bio for my business. Business name: [business name]. What I do: [your tagline]. Industry: [industry]. My primary platform is [platform]. Write 3 bio options — one for Instagram (150 char max), one for Facebook/LinkedIn (2-3 sentences), and one for TikTok (short and punchy). All should sound human, not corporate.',
    toolLinks: [],
    route: '/projects/:id/tasks/foundation_social_profiles',
    brainUpdatePrompt: 'Add my social media presence to my business brain: Primary platform: [your answer]. Handles: [your handles]. Consistency status: [your answer]. Reference this when helping me with content strategy and social media.',
  },

  {
    taskId: 'foundation_google_business',
    title: 'Set up your Google Business Profile',
    phase: 'foundation',
    funnelTypes: ['all'],
    order: 7,
    priority: 3,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['foundation_contact_info'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a Google Business Profile set up, claimed, and verified — or you have confirmed it\'s not applicable to your business model',
      'If you run Google Ads, your profile is verified and up to date',
    ],
    whyItMatters: 'Google Business Profile is free and shows up when people search your name or your service in your area. If you run Google Ads — like the client making $3,500 a week in auto glass — your ads get paused when this information is outdated or missing. Even for fully online businesses, it adds a layer of legitimacy that helps people trust you before they ever land on your site.',
    instructions: [
      'Go to business.google.com and search for your business name',
      'If a listing exists, claim it — someone may have auto-created it from Google Maps data',
      'If not, create a new listing with your business name, address or service area, phone number, hours, and website',
      'Add at least one photo — your logo or a photo of your work is enough to start',
      'If you run Google Ads, make sure this profile is verified before running any campaigns',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'gbp_status',
          label: 'Google Business Profile status',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'verified', label: 'Set up, claimed, and verified — ready to go' },
            { value: 'created_not_verified', label: 'Created but not yet verified — verification pending' },
            { value: 'needs_setup', label: 'Doesn\'t exist yet — need to create it' },
            { value: 'not_applicable', label: 'Not applicable — fully online business with no local customers' },
          ],
        },
        {
          name: 'gbp_url',
          label: 'Your Google Business Profile link (if you have one)',
          type: 'text',
          required: false,
          placeholder: 'maps.google.com/... or g.co/kgs/...',
        },
        {
          name: 'runs_google_ads',
          label: 'Do you currently run Google Ads?',
          type: 'select',
          required: false,
          placeholder: 'Select...',
          options: [
            { value: 'yes_active', label: 'Yes — currently active' },
            { value: 'yes_paused', label: 'Yes — but currently paused' },
            { value: 'want_to', label: 'No — but planning to in the future' },
            { value: 'no', label: 'No — not planning to use Google Ads' },
          ],
          sectionLabel: 'Optional: Google Ads',
          helperText: 'If you run ads, a verified GBP is required for them to run correctly.',
        },
      ],
    },
    aiAssistModes: ['simplify'],
    toolLinks: [
      { label: 'Open Google Business Profile Manager', url: 'https://business.google.com', icon: 'map-pin' },
    ],
    route: '/projects/:id/tasks/foundation_google_business',
  },

  {
    taskId: 'foundation_brand_basics',
    title: 'Lock in your brand basics',
    phase: 'foundation',
    funnelTypes: ['all'],
    order: 8,
    priority: 3,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['foundation_business_name'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a logo or know what you\'re using in its place',
      'You have one primary brand color you use consistently',
      'You can describe your visual style in a few words',
    ],
    whyItMatters: 'You don\'t need a perfect brand to start. But you need a consistent one. When your logo, colors, and profile photos match across every place you show up, you look like a real business — not someone figuring it out as they go. This foundation is what your sales page, social profiles, and marketing materials will be built on.',
    instructions: [
      'Note what you\'re currently using as your logo — even if it\'s just your business name in a font, that counts',
      'Pick one primary color — if you\'re not sure, think about what color makes you think of your brand',
      'Describe your visual style in one word or phrase — this tells Claude how to generate images and design prompts that match your brand',
      'If you need a logo, Claude\'s image generation can create one for you in the next step',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'logo_status',
          label: 'Logo',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'have_logo_consistent', label: 'I have a logo and use it consistently everywhere' },
            { value: 'have_logo_inconsistent', label: 'I have a logo but don\'t use it consistently' },
            { value: 'text_only', label: 'Using my business name as text for now — no graphic logo' },
            { value: 'need_logo', label: 'I need a logo — don\'t have one yet' },
          ],
        },
        {
          name: 'primary_color',
          label: 'Primary brand color',
          type: 'text',
          required: false,
          placeholder: 'e.g. #C65A3E (warm orange) or just "deep navy blue"',
          helperText: 'One color you use consistently — on your website, social graphics, and branded materials.',
        },
        {
          name: 'secondary_color',
          label: 'Secondary color (optional)',
          type: 'text',
          required: false,
          placeholder: 'e.g. cream, charcoal, gold',
        },
        {
          name: 'visual_direction',
          label: 'How would you describe your visual style?',
          type: 'select',
          required: false,
          placeholder: 'Pick the closest match...',
          options: [
            { value: 'clean_minimal', label: 'Clean and minimal — white space, simple, modern' },
            { value: 'bold_bright', label: 'Bold and bright — strong colors, high contrast, energetic' },
            { value: 'warm_earthy', label: 'Warm and earthy — neutrals, creams, organic textures' },
            { value: 'dark_professional', label: 'Dark and professional — dark backgrounds, sleek, premium' },
            { value: 'soft_feminine', label: 'Soft and feminine — pastels, florals, delicate details' },
            { value: 'techy_modern', label: 'Tech-forward and modern — gradients, sharp edges, digital feel' },
            { value: 'luxury_editorial', label: 'Luxury editorial — sophisticated, refined, high-end' },
            { value: 'bold_urban', label: 'Bold and urban — street-inspired, gritty, expressive' },
            { value: 'not_sure', label: 'Not sure yet — still figuring this out' },
          ],
        },
        {
          name: 'brand_inspiration',
          label: 'Any brands whose visual style you admire? (optional)',
          type: 'textarea',
          required: false,
          placeholder: 'e.g. Apple (minimal), Fenty Beauty (bold), Warby Parker (clean editorial)...',
          sectionLabel: 'Optional: Inspiration',
          helperText: 'This helps Claude generate design prompts that match the direction you\'re going.',
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Help me define the visual direction for my brand. Business name: [business name]. Industry: [industry]. Visual style I\'m going for: [your style selection]. Brands I admire: [your inspiration]. Generate: (1) a description of my brand visual identity in 2-3 sentences I can use in design prompts, (2) 3 suggested hex color combinations that match this direction, (3) 2 font pairing suggestions (Google Fonts), (4) a short list of visual elements to avoid.',
    toolLinks: [],
    route: '/projects/:id/tasks/foundation_brand_basics',
    exampleText: 'You do not need a perfect brand to move forward. A consistent text-based name in one color used everywhere is better than three different logo versions across your profiles. Start simple, stay consistent.',
    brainUpdatePrompt: 'Add my brand basics to my business brain: Logo status: [your answer]. Primary color: [your answer]. Visual style: [your answer]. Inspiration: [your answer]. Use this whenever you help me generate images, design prompts, or visual content for my brand.',
  },

  {
    taskId: 'foundation_ai_brain_setup',
    title: 'Set up your AI business brain',
    phase: 'foundation',
    funnelTypes: ['all'],
    order: 9,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['foundation_business_name'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have created a Claude Project for your business',
      'You have named it and written a system prompt that tells Claude what your business does',
      'You have tested it with at least one business question',
    ],
    whyItMatters: 'Every Cre8 Visions agency client gets an AI system built specifically for their business — a trained brain that knows their offer, their audience, their voice, and their goals. This task gives you the same thing, DIY. Once it\'s set up, every AI-assisted task in this app becomes more accurate and more useful because Claude already knows your business context.',
    instructions: [
      'Open Claude at claude.ai and click "Projects" in the left sidebar',
      'Create a new project — name it something like "[Your Business Name] — Business Brain"',
      'In the project instructions box, paste the system prompt from the "See an example" section below and fill in your details',
      'Test it by asking: "What do you know about my business?" — Claude should respond with your business details',
      'As you complete tasks throughout this app, you\'ll add outputs (your customer avatar, sales page copy, email sequences) to this project so it gets smarter over time',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'project_created',
          label: 'Have you created your Claude Project?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'yes_tested', label: 'Yes — created, system prompt written, tested and working' },
            { value: 'yes_not_tested', label: 'Yes — created but haven\'t tested it yet' },
            { value: 'in_progress', label: 'In progress — setting it up now' },
            { value: 'no_dont_have_claude', label: 'No — I don\'t have a Claude account yet' },
            { value: 'skip_for_now', label: 'Skipping for now — will set up later' },
          ],
        },
        {
          name: 'project_name',
          label: 'What did you name your project?',
          type: 'text',
          required: false,
          placeholder: 'e.g. Cre8 Visions — Business Brain',
        },
        {
          name: 'system_prompt_notes',
          label: 'Any notes on your system prompt? (optional)',
          type: 'textarea',
          required: false,
          placeholder: 'e.g. Added my business name, tagline, industry, audience, and brand voice...',
          helperText: 'You\'ll keep building this throughout the app — it doesn\'t need to be complete today.',
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Write a Claude Project system prompt for my business. This will be the instructions Claude reads at the start of every conversation in my business project. Include: business name and what it does, the industry, who we serve (target customer), our tone/voice, our main goal right now, and any important context. Here are my details: Business name: [name]. What I do: [tagline]. Industry: [industry]. Who I serve: [describe customer]. Brand voice: [describe how you like to communicate]. Current goal: [what are you working on right now]. Write this as a tight, useful system prompt — not a template, but the actual filled-in version I can paste directly.',
    toolLinks: [
      { label: 'Open Claude Projects', url: 'https://claude.ai', icon: 'brain' },
    ],
    route: '/projects/:id/tasks/foundation_ai_brain_setup',
    exampleText: 'Example system prompt to customize:\n\n"You are the AI business assistant for [Business Name], a [industry] business owned by [your name] based in [city/state].\n\nWhat we do: [your tagline]\n\nWho we serve: [describe your target customer in 1-2 sentences]\n\nOur tone: [describe how you communicate — e.g. direct and warm, professional but approachable]\n\nCurrent focus: [what you are building or launching right now]\n\nWhen helping me, always: keep responses practical and actionable, speak in our brand voice, and reference our specific business context rather than giving generic advice."',
  },

  {
    taskId: 'foundation_google_drive_connector',
    title: 'Connect Google Drive to your business brain',
    phase: 'foundation',
    funnelTypes: ['all'],
    order: 10,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['foundation_ai_brain_setup'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have created a Business Brain folder structure in Google Drive',
      'Google Drive is connected to your Claude Project',
      'You have tested that Claude can read a document from your Drive',
    ],
    whyItMatters: 'As you complete tasks in this app, you\'ll produce documents worth keeping — your customer avatar, your sales page copy, your email sequences, your brand voice guide. Google Drive becomes the filing system for your business brain. When Drive is connected to your Claude Project, you don\'t have to copy-paste anything — Claude reads your documents directly and uses them as context.',
    instructions: [
      'Open Google Drive and create a new folder called "Business Brain — [Your Business Name]"',
      'Inside it, create these subfolders: Foundation, Customer Research, Digital Product, Sales Page, Email Marketing, Messaging, Content Strategy, Launch, Post-Launch',
      'In your Claude Project, go to the project settings and look for "Add content" or "Integrations"',
      'Connect Google Drive — Claude will ask for permission to read your Drive files',
      'Test it: upload your completed foundation notes as a Google Doc, then ask Claude in your project: "What do you know about my business based on my foundation document?"',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'drive_folder_created',
          label: 'Have you created your Business Brain folder in Google Drive?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'yes_connected', label: 'Yes — folder created and Drive connected to Claude Project' },
            { value: 'yes_not_connected', label: 'Yes — folder created but Drive not connected yet' },
            { value: 'folder_only', label: 'Created the folder — still working on connecting Drive' },
            { value: 'no', label: 'Not yet — will do this later' },
          ],
        },
        {
          name: 'drive_folder_url',
          label: 'Google Drive folder link (optional)',
          type: 'text',
          required: false,
          placeholder: 'Paste your Google Drive folder URL here for easy access',
        },
      ],
    },
    aiAssistModes: ['simplify'],
    toolLinks: [
      { label: 'Open Google Drive', url: 'https://drive.google.com', icon: 'folder' },
      { label: 'Open Claude Projects', url: 'https://claude.ai', icon: 'brain' },
    ],
    route: '/projects/:id/tasks/foundation_google_drive_connector',
    exampleText: 'Folder structure to create inside "Business Brain — [Your Name]":\n\n📁 Foundation\n📁 Customer Research\n📁 Digital Product\n📁 Sales Page\n📁 Email Marketing\n📁 Messaging\n📁 Content Strategy\n📁 Launch\n📁 Post-Launch\n\nAs you complete each phase of the app, you\'ll save your outputs to the matching folder. Claude reads them directly — no copy-pasting needed.',
    brainUpdatePrompt: 'I have connected Google Drive to this Claude Project. My Business Brain folder is at: [paste your Drive folder link]. From now on, when I upload documents to the matching subfolders, reference them when helping me with related tasks. The folder structure is: Foundation, Customer Research, Digital Product, Sales Page, Email Marketing, Messaging, Content Strategy, Launch, Post-Launch.',
  },

  // ============================================================
  // PHASE 1 — KNOW YOUR CUSTOMER
  // ============================================================

  {
    taskId: 'customer_who_you_serve',
    title: 'Define who you serve',
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
      "You have described a specific type of person — not a broad category",
      "You can picture one real human being when you read what you wrote",
    ],
    whyItMatters: "The biggest mistake people make when building a business is trying to serve everyone. The more specific you are about who this is for, the easier every decision becomes: what to say, where to show up, what to charge, what to build next.",
    instructions: [
      "Describe the specific type of person you want to help — their situation, their stage, what their life looks like right now",
      "Be specific about what they do, where they are in their journey, and what is going on for them",
      "Think about the real people you have already helped, are currently helping, or most want to help",
      "Avoid broad labels like entrepreneurs or small business owners — get into the specific situation",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'audience_description', label: 'Describe your ideal customer', type: 'textarea', required: true, placeholder: 'e.g. A local auto glass repair business owner who has been running their business for 3-5 years, is making $3-5K/week in revenue, but has no real online presence and is still relying on word of mouth...', helperText: 'Write at least 3-4 sentences. The more specific, the better everything that follows will be.' },
        { name: 'gender_age', label: 'Gender and age range (optional)', type: 'text', required: false, placeholder: 'e.g. Women 30-45, Men 25-50, any gender 35-55' },
        { name: 'location', label: 'Location (optional)', type: 'text', required: false, placeholder: 'e.g. United States, Atlanta metro area, online globally' },
        { name: 'niche', label: 'What industry or niche are they in?', type: 'text', required: false, placeholder: 'e.g. Home services, health and wellness, digital marketing, real estate' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'ai_prompt'],
    aiPrompt: 'I need help getting specific about who I serve. Here is my rough description: [paste your description]. Help me make this more specific. Ask me 5 clarifying questions that will help me narrow down the exact person — their situation, their stage, their daily reality. Then use my answers to write a tighter, more specific audience description I can use.',
    toolLinks: [],
    route: '/projects/:id/tasks/customer_who_you_serve',
    exampleText: 'Too broad: "Small business owners who want to grow"\n\nSpecific: "Service-based business owners (plumbers, electricians, auto repair, cleaning services) who have been operating for 2-5 years, generating $2-8K/week mostly through referrals, but have no real website or digital presence and are leaving money on the table because people cannot find them online."',
  },

  {
    taskId: 'customer_main_problem',
    title: 'Identify their #1 problem',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['customer_who_you_serve'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      "You have named one specific problem — not a list of problems",
      "The problem is something your customer is actively aware of and would pay to solve today",
    ],
    whyItMatters: "People do not buy products — they buy solutions to problems they feel urgently. If you can name the problem more accurately than your customer can name it themselves, they will assume you have the answer.",
    instructions: [
      "Think about what your ideal customer complains about most — to their friends, in Facebook groups, in DMs to you",
      "Focus on the problem they feel right now, today — not a vague long-term struggle",
      "Write it in their language, not yours — the words they would actually use",
      "Pick one. If you have a list of five, pick the one that makes them lose sleep.",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'primary_problem', label: 'What is their #1 problem right now?', type: 'textarea', required: true, placeholder: 'e.g. They are generating decent revenue through referrals but Google Ads keep getting paused because their business information is not set up correctly, and they have no idea how to fix it...', helperText: 'Write it in their words. What would they say if you asked them what is your biggest frustration right now?' },
        { name: 'problem_urgency', label: 'Why is this urgent for them right now?', type: 'textarea', required: false, placeholder: 'e.g. They are leaving money on the table every day — their competitor just built a website and started showing up on Google...' },
        { name: 'problem_source', label: 'How do you know this is their real problem?', type: 'text', required: false, placeholder: 'e.g. Multiple clients have told me this, I see it in Facebook groups, I had this problem myself...', sectionLabel: 'Optional: Your evidence' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'ai_prompt'],
    aiPrompt: 'I help [your audience description]. Help me get to the real #1 problem they have. Here is what I currently think their problem is: [your description]. Is this the surface problem or the root problem? Help me go one level deeper — what is the painful daily reality caused by this problem? Rewrite the problem statement in a way that would make my ideal customer say "yes, exactly."',
    toolLinks: [],
    route: '/projects/:id/tasks/customer_main_problem',
    exampleText: 'Surface problem: "They do not have a website"\nReal problem: "Potential customers cannot find them online, their Google Ads keep getting paused, and they are watching competitors take jobs they could be getting — all because their digital foundation is broken"',
  },

  {
    taskId: 'customer_dream_outcome',
    title: 'Describe their dream outcome',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 3,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['customer_main_problem'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      "You can describe what life looks like for your customer after their problem is solved",
      "The outcome is specific, believable, and motivating — not vague or exaggerated",
    ],
    whyItMatters: "Your customer is not buying your product — they are buying the version of themselves that exists after the problem is gone. If you can paint that picture more vividly than anyone else, you win the sale before you even explain what you are selling.",
    instructions: [
      "Describe what your customer's life, business, or situation looks like after working with you — be specific and concrete",
      "Use before/after language: they go from X to Y",
      "Make it believable, not fantasy — realistic results feel safer to buy",
      "Think about both the external result (the thing they can measure) and the internal result (how they feel)",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'dream_outcome', label: 'What does success look like for your customer?', type: 'textarea', required: true, placeholder: 'e.g. Their Google Business Profile is verified, their website is live and ranking, their Google Ads are running without being paused, and new customers are finding them online consistently...' },
        { name: 'outcome_timeline', label: 'Roughly how quickly can they get there?', type: 'text', required: false, placeholder: 'e.g. Within 30 days, within 90 days, within 6 months', helperText: 'Be honest — this becomes part of your promise.' },
        { name: 'external_result', label: 'What is the concrete, measurable external result?', type: 'text', required: false, placeholder: 'e.g. Google Ads running, website live, 3+ new inbound leads per week', sectionLabel: 'Optional: Break it down' },
        { name: 'internal_result', label: 'How do they feel after?', type: 'text', required: false, placeholder: 'e.g. Confident their business looks legitimate, not stressed every time someone Googles them' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'ai_prompt'],
    aiPrompt: 'My customer problem is: [problem description]. Help me write a compelling dream outcome statement. I need: (1) a one-sentence before and after transformation statement, (2) a 2-3 sentence expanded outcome description that feels concrete and achievable, (3) the specific external result they can measure, (4) the internal emotional shift they experience. Audience context: [your audience description].',
    toolLinks: [],
    route: '/projects/:id/tasks/customer_dream_outcome',
  },

  {
    taskId: 'customer_biggest_obstacle',
    title: 'Name their biggest obstacle',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 4,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['customer_dream_outcome'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      "You have named the main thing that has stopped them from solving this problem already",
      "You understand why they have not fixed it on their own",
    ],
    whyItMatters: "If your customer could solve this problem themselves, they would have already. Understanding the obstacle is what lets you design an offer that actually removes it — and write copy that makes people feel understood.",
    instructions: [
      "Think about what has stopped your customer from solving this problem before you came along",
      "This might be time, money, technical knowledge, fear, not knowing where to start, or past bad experiences",
      "Be specific — lack of time is a starting point, but what specifically are they spending their time on instead?",
      "This answer becomes the core of why your offer works when other things have failed",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'biggest_obstacle', label: 'What has stopped them from solving this already?', type: 'textarea', required: true, placeholder: 'e.g. They have tried to figure it out themselves but got overwhelmed by conflicting advice online. They hired web designers before who delivered something that looked nice but never brought leads...' },
        { name: 'what_they_have_tried', label: 'What have they already tried that did not work?', type: 'textarea', required: false, placeholder: 'e.g. DIY website builder, hiring a cheap freelancer, watching YouTube tutorials, buying a course they never finished...', helperText: 'This becomes the "what makes us different" angle in your marketing.' },
      ],
    },
    aiAssistModes: ['examples', 'ai_prompt'],
    aiPrompt: 'My customer is [audience description] and their main problem is [problem]. Help me identify the real obstacle. Here is what I currently think stops them: [your answer]. Go deeper — what is the underlying reason this has been hard to solve? List 5 possible root obstacles and rank them by how likely each is for my specific audience. Then help me write one obstacle statement that captures the real friction.',
    toolLinks: [],
    route: '/projects/:id/tasks/customer_biggest_obstacle',
  },

  {
    taskId: 'customer_awareness_level',
    title: 'Understand their awareness level',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 5,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: false,
    dependencies: ['customer_biggest_obstacle'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      "You know whether your customer is unaware, problem aware, solution aware, or actively looking for someone like you",
    ],
    whyItMatters: "How you talk to your customer depends entirely on where they are in their awareness journey. Getting this wrong means your marketing lands flat — you are either explaining something they already know or selling to someone who does not know they have a problem.",
    instructions: [
      "Read each awareness level and pick the one that best describes where most of your ideal customers are right now",
      "Be honest — most people overestimate how aware their audience is",
      "This choice affects every piece of content you write from here on",
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        { value: 'unaware', label: 'Unaware', description: 'They do not know they have a problem yet. You have to show them something is wrong before you can offer a solution.' },
        { value: 'problem_aware', label: 'Problem aware', description: 'They know they have a problem but do not know solutions exist. You introduce the possibility of a fix.' },
        { value: 'solution_aware', label: 'Solution aware', description: 'They know solutions exist but have not found the right one. You show why yours is different.' },
        { value: 'product_aware', label: 'Product aware', description: 'They know about you but have not committed. You make the case for why now and why you specifically.' },
        { value: 'most_aware', label: 'Most aware', description: 'They know you, they want what you offer, they just need the right moment or offer to say yes.' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Help me figure out my audience awareness level. My ideal customer is [audience description] and their problem is [problem]. Describe what each of the 5 awareness levels looks like specifically for my audience — what would a person at each level say, think, or do? Then recommend which level I should assume when writing my first marketing content and why.',
    toolLinks: [],
    route: '/projects/:id/tasks/customer_awareness_level',
  },

  {
    taskId: 'customer_where_they_hang_out',
    title: 'Document where they hang out online',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 6,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['customer_who_you_serve'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      "You know which 1-2 platforms your ideal customer spends the most time on",
      "You know what they search for when they are looking for help with their problem",
    ],
    whyItMatters: "The best offer in the world fails if you are promoting it where your customer is not. This task makes sure your content strategy in Phase 6 is built around where your customer actually is.",
    instructions: [
      "Think about where your ideal customer goes when looking for answers, entertainment, or community related to their problem",
      "Consider both social platforms and search — some audiences Google everything, others ask in Facebook groups",
      "Think about what words they type into Google or YouTube when they have this problem",
      "Be specific about the type of content they consume — short videos, long posts, podcasts, tutorials",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'primary_platform', label: 'Where does your ideal customer spend the most time?', type: 'text', required: true, placeholder: 'e.g. Facebook groups, Instagram, YouTube, Google Search, LinkedIn, TikTok' },
        { name: 'search_terms', label: 'What do they search for when they have this problem?', type: 'textarea', required: false, placeholder: 'e.g. "how to fix suspended Google Ads", "website for auto glass business", "get more customers for small business"...', helperText: 'These become your SEO keywords and content topics.' },
        { name: 'communities', label: 'What groups, communities, or forums do they participate in?', type: 'textarea', required: false, placeholder: 'e.g. Small business Facebook groups, local chamber of commerce, industry-specific Slack groups...' },
        { name: 'content_they_consume', label: 'What type of content do they actually stop and watch or read?', type: 'text', required: false, placeholder: 'e.g. Short how-to videos, before/after transformations, case studies, live Q&As', sectionLabel: 'Optional: Content preferences' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'My ideal customer is [audience description] and their problem is [problem]. Help me figure out where they hang out online. Give me: (1) the top 3 platforms they are most likely on with a brief explanation of why, (2) 10 search terms they would type into Google or YouTube when dealing with this problem, (3) types of Facebook groups or online communities they are likely in, (4) the content format they are most likely to engage with.',
    toolLinks: [],
    route: '/projects/:id/tasks/customer_where_they_hang_out',
  },

  {
    taskId: 'customer_avatar',
    title: 'Write your customer avatar',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 7,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['customer_who_you_serve', 'customer_main_problem', 'customer_dream_outcome'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      "You have a named, specific customer persona that captures everything from the previous tasks",
      "You have saved it to your business brain so every future AI task has this context",
    ],
    whyItMatters: "A customer avatar takes everything you just figured out and turns it into a reference document you can use forever. When you brief Claude on a task, you paste this in. The more vivid and specific it is, the more everything you create will land with the right person.",
    instructions: [
      "Use the AI prompt below to generate your full avatar — it pulls everything from your previous answers into one cohesive document",
      "Give your avatar a name — make them feel like a real person",
      "Review the output and add any details from your own experience that the AI missed",
      "Save the final version to your Google Drive (Customer Research folder) and upload it to your Claude Project",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'avatar_name', label: 'What name did you give your avatar?', type: 'text', required: false, placeholder: 'e.g. Marcus, Angel, Sarah', helperText: 'A name makes the avatar feel real. Use it when briefing Claude.' },
        { name: 'avatar_summary', label: 'Paste a summary of your avatar here', type: 'textarea', required: false, placeholder: 'Paste the avatar document you generated, or summarize the most important details...', helperText: 'This saves the avatar in your project tasks so you can reference it later.' },
        { name: 'brain_updated', label: 'Have you added your avatar to your Claude Project?', type: 'select', required: false, placeholder: 'Select...', options: [ { value: 'yes_uploaded', label: 'Yes — uploaded to Google Drive and added to Claude Project' }, { value: 'yes_pasted', label: 'Yes — pasted directly into Claude Project' }, { value: 'not_yet', label: 'Not yet — will do after completing this task' } ], sectionLabel: 'Business brain update', helperText: 'Adding this to your Claude Project makes every future AI task more accurate.' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Create a detailed customer avatar document for my business. Use everything below.\n\nBusiness: [your business name and tagline]\nWho I serve: [your audience description]\nTheir #1 problem: [the problem]\nDream outcome: [the outcome]\nBiggest obstacle: [the obstacle]\nAwareness level: [awareness level]\nWhere they hang out: [platforms and search terms]\n\nWrite the avatar with: a name and brief backstory, their daily reality right now, their emotional state around this problem, what they have already tried, what they fear, what they desire, what they would say if asked what do you need most right now. End with a one-paragraph summary I can paste at the top of every Claude prompt to give context.',
    exportable: true,
    toolLinks: [],
    route: '/projects/:id/tasks/customer_avatar',
    brainUpdatePrompt: 'Here is my customer avatar document. Use this as context for every task you help me with from now on — especially when writing copy, creating content, or developing my offer.\n\n[paste your avatar document here]',
  },

  // ============================================================
  // PHASE 2 — YOUR DIGITAL PRODUCT
  // ============================================================

  {
    taskId: 'product_choose_type',
    title: 'Choose your digital product type',
    phase: 'build',
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
      "You have chosen one specific type of digital product",
      "You understand why this format fits your audience and what you are delivering",
    ],
    whyItMatters: "Every business — even a service business — should have at least one digital product. It creates a way for people to buy from you without your time being in the transaction. It brings awareness to your expertise. And it gives new customers a low-risk first step before committing to higher-ticket offers.",
    instructions: [
      "Read each option and pick the format that best matches what you know, what your customer needs, and what you can realistically produce in the next 2 weeks",
      "Think about your audience — are they readers or watchers? Do they want a quick reference or a guided experience?",
      "Pick the simplest format that still delivers real value — you can always make a more elaborate version later",
      "If you already have something in progress, select the type that matches it",
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        { value: 'guide_ebook', label: 'Guide or ebook', description: 'A written document (PDF) that teaches a process, explains a topic, or walks someone through a framework. Best when your audience is a reader and you have knowledge to share in structured form.' },
        { value: 'template', label: 'Template or swipe file', description: 'A fill-in-the-blank document, spreadsheet, or set of scripts people can use directly in their business. Best when your customer needs a tool more than a teaching.' },
        { value: 'mini_course', label: 'Mini course or video training', description: '3-7 short videos that walk someone through a specific skill or process. Best when the topic is better shown than told.' },
        { value: 'workshop_recording', label: 'Workshop or masterclass recording', description: 'A recorded live training session (60-90 min) delivered as a replay. Best when you have a topic you can teach deeply in a single sitting.' },
        { value: 'toolkit', label: 'Toolkit or resource bundle', description: 'A collection of templates, checklists, scripts, and guides packaged together around one theme. Best when your audience needs multiple tools for one problem.' },
        { value: 'checklist_workbook', label: 'Checklist or workbook', description: 'A step-by-step checklist or guided workbook with prompts and exercises. Best when your customer needs structure and accountability more than content.' },
        { value: 'digital_service_guide', label: 'Service guide or process document', description: 'A detailed guide that explains your service process, what to expect, or how to prepare for working with you. Best for service businesses wanting to educate clients before they buy.' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Help me choose the right digital product type for my business. My business is [business name and tagline]. My ideal customer is [avatar name/description] and their main problem is [problem]. Based on my audience, their learning preferences, and the nature of the problem — which product type would be most effective and most realistic for me to create? Give me your top 2 recommendations with specific reasons why each would work for my audience.',
    toolLinks: [],
    route: '/projects/:id/tasks/product_choose_type',
  },

  {
    taskId: 'product_promise',
    title: 'Define your product promise',
    phase: 'build',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['product_choose_type'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      "You have written a single sentence that says who this is for, what it does, and what result it delivers",
      "The promise is specific enough that your ideal customer would immediately understand if this is for them",
    ],
    whyItMatters: "Your product promise is the single most important sentence you will write. It determines your headline, your product name, your sales page hook, and every social post you write about it. A strong promise is specific and outcome-focused. A weak promise is vague and generic.",
    instructions: [
      "Fill in this formula: A [product type] for [specific audience] who want to [specific outcome] without [biggest obstacle or fear]",
      "Make the outcome as specific and measurable as possible",
      "The without part is optional but powerful — it removes the objection before they can raise it",
      "Read it out loud — if it sounds like a real sentence a real person would say, it is working",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'product_promise', label: 'Your product promise (one sentence)', type: 'textarea', required: true, placeholder: 'e.g. A step-by-step setup guide for local service business owners who want to get their Google Business Profile, website, and Google Ads running correctly within 30 days — without needing to hire a developer or figure it out from scratch...', helperText: 'Start with: A [type] for [audience] who want to [outcome] without [obstacle]' },
        { name: 'promise_result', label: 'What is the single most important result this delivers?', type: 'text', required: false, placeholder: 'e.g. Google Ads running and generating leads within 30 days', helperText: 'This becomes your headline option.' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'ai_prompt'],
    aiPrompt: 'Help me write a sharp product promise. Product type: [type you selected]. Audience: [customer avatar name/description]. Their problem: [problem]. Dream outcome: [outcome]. Write 5 product promise variations using the formula "A [type] for [audience] who want to [outcome] without [obstacle]." Then pick the strongest one and explain why.',
    toolLinks: [],
    route: '/projects/:id/tasks/product_promise',
    exampleText: 'Weak: "A guide to growing your small business online"\n\nStrong: "A 30-day digital foundation guide for local service businesses who want their website live, Google Business Profile verified, and Google Ads running — without paying an agency $3,000 upfront"',
  },

  {
    taskId: 'product_scope',
    title: 'Scope your minimum version',
    phase: 'build',
    funnelTypes: ['all'],
    order: 3,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['product_promise'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      "You have defined the smallest version of this product that still delivers the promise",
      "You could realistically complete this version within 2 weeks",
    ],
    whyItMatters: "Most digital products never get finished because the creator tried to build everything at once. The minimum version is the one that delivers the core promise — nothing more, nothing less. A complete minimum version that ships is worth more than a perfect version still on your hard drive.",
    instructions: [
      "Start with what someone absolutely needs to achieve the promised outcome — cut everything else",
      "If your guide has 10 potential chapters, which 3 are truly essential to the promise?",
      "The test: could someone get the promised result with only what is in the minimum version? If yes, that is your scope.",
      "List the exact deliverables — not topics you might cover, but the actual sections, modules, or pieces",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'minimum_scope', label: 'What is the minimum version of this product?', type: 'textarea', required: true, placeholder: 'e.g. A PDF guide with 4 sections: (1) Setting up Google Business Profile step-by-step, (2) Connecting your domain to a simple website, (3) Fixing common Google Ads suspension issues, (4) A launch checklist...', helperText: 'List the actual sections, modules, or pieces — not general topics.' },
        { name: 'what_to_cut', label: 'What are you intentionally leaving out of version 1?', type: 'textarea', required: false, placeholder: 'e.g. Advanced SEO, social media setup, video walkthroughs — those are version 2...', helperText: 'Naming what you are cutting makes it easier to stay in scope.' },
        { name: 'completion_estimate', label: 'How many days to complete this minimum version?', type: 'select', required: false, placeholder: 'Select...', options: [ { value: '1_3', label: '1-3 days' }, { value: '4_7', label: '4-7 days' }, { value: '1_2_weeks', label: '1-2 weeks' }, { value: '2_4_weeks', label: '2-4 weeks' }, { value: 'more', label: 'More than a month — I need to scope this down further' } ], sectionLabel: 'Optional: Reality check' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'simplify', 'ai_prompt'],
    aiPrompt: 'Help me scope the minimum version of my digital product. Product promise: [your promise]. Product type: [type]. Here is what I am thinking of including: [your list]. Help me cut this down to the absolute minimum that still delivers the promise. For each item, tell me: keep (essential to the promise), cut (not needed for version 1), or simplify (include a lighter version). Then give me a final lean scope I could complete in 1-2 weeks.',
    toolLinks: [],
    route: '/projects/:id/tasks/product_scope',
  },

  {
    taskId: 'product_name',
    title: 'Name your product',
    phase: 'build',
    funnelTypes: ['all'],
    order: 4,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['product_promise'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      "You have chosen a name for your product that you are confident using publicly",
    ],
    whyItMatters: "Your product name appears on your sales page, in your emails, in social posts, and in every conversation about it. A good name is memorable, hints at the outcome or audience, and does not need explaining.",
    instructions: [
      "Use the AI prompt to generate 15 name options across different styles",
      "Narrow down to 3-5 you like, then pick the one that feels most like you and most like your brand",
      "Test it: say it out loud, text it to someone — if it is confusing or hard to say, cut it",
      "Check that the name is not already in use by a direct competitor in your space",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'product_name', label: 'Your product name', type: 'text', required: true, placeholder: 'e.g. The Digital Foundation Kit, The 30-Day Visibility System, The Ops Blueprint' },
        { name: 'name_options_considered', label: 'Other names you considered (optional)', type: 'textarea', required: false, placeholder: 'List any names you were choosing between — helpful for future reference' },
      ],
    },
    aiAssistModes: ['examples', 'ai_prompt'],
    aiPrompt: 'Generate 15 product name options for my digital product. Product promise: [your promise]. Audience: [customer avatar]. Product type: [type]. Brand style: [describe your visual direction or brand feel].\n\nGenerate names across 4 styles:\n- Outcome-focused (names that say what you get)\n- Audience-focused (names that speak directly to who it is for)\n- Method-focused (names that hint at the approach or system)\n- Brand-style (names that feel like a product brand, could have a logo)\n\nFor each, explain in one sentence why it would work. Then recommend your top 3.',
    toolLinks: [],
    route: '/projects/:id/tasks/product_name',
    exampleText: 'Outcome-focused: "The 30-Day Visibility System", "The Google-Ready Guide"\nAudience-focused: "The Local Business Digital Kit", "The Tradesperson Online Starter"\nMethod-focused: "The Foundation Framework", "The Visibility Blueprint"\nBrand-style: "FoundationOS", "LocalEdge"',
  },

  {
    taskId: 'product_pricing',
    title: 'Set your price',
    phase: 'build',
    funnelTypes: ['all'],
    order: 5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['product_promise'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      "You have set a specific price for your product",
      "You can explain why that price is right for your audience and your offer",
    ],
    whyItMatters: "Pricing is a positioning decision as much as a math decision. Price too low and people do not take it seriously. Price too high without the right trust signals and people do not buy. The right price positions your product as valuable and accessible to your specific audience.",
    instructions: [
      "Think about the outcome your product delivers — what would it cost your customer to get that outcome a different way?",
      "Digital guides and templates typically price between $17-$97. Mini courses $97-$297. Toolkits $47-$197.",
      "Your price also signals positioning — $17 says quick resource, $97 says serious tool, $297 says premium system",
      "Pick a number and commit — you can always adjust after launch based on conversion data",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'price', label: 'Your product price (USD)', type: 'text', required: true, placeholder: 'e.g. $47, $97, $197' },
        { name: 'pricing_rationale', label: 'Why did you choose this price?', type: 'textarea', required: false, placeholder: 'e.g. It is accessible for my audience of small business owners who are budget-conscious, but high enough that people take it seriously...', helperText: 'Writing this out helps you defend the price confidently in your copy.' },
        { name: 'launch_price', label: 'Will you use an intro/launch price? (optional)', type: 'text', required: false, placeholder: 'e.g. Launch price of $27 for the first week, then $47', sectionLabel: 'Optional: Launch pricing', helperText: 'A launch price creates urgency and rewards early buyers.' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Help me set the right price for my digital product. Product name: [name]. Product type: [type]. Product promise: [promise]. Audience: [customer description including their income level or budget sensitivity if known]. Help me think through: (1) the value the product delivers versus alternative ways to get the same result, (2) what pricing signals to my specific audience, (3) a recommended price range with reasoning, (4) whether a launch price makes sense for my situation. Give me a clear recommendation.',
    toolLinks: [],
    route: '/projects/:id/tasks/product_pricing',
  },

  {
    taskId: 'product_outline',
    title: 'Outline your product content',
    phase: 'build',
    funnelTypes: ['all'],
    order: 6,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 40,
    blocking: true,
    dependencies: ['product_scope'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      "You have a complete section-by-section or module-by-module outline",
      "Every section directly serves the product promise",
      "You could hand this outline to someone and they would know exactly what to write",
    ],
    whyItMatters: "The outline is the architecture of your product. A clear outline means you sit down to create and just execute — no staring at a blank page. It also keeps you honest: every section that does not serve the promise gets cut before you spend time creating it.",
    instructions: [
      "For each section/module: write the title and one sentence describing what the reader/viewer will be able to do after completing it",
      "Order the sections logically — the reader should move from where they are now to the promised outcome step by step",
      "Keep sections focused — one main point per section is better than cramming multiple ideas together",
      "Use the AI prompt to generate a full draft outline, then edit it to match your knowledge and your minimum scope",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'product_outline', label: 'Your product outline (section by section)', type: 'textarea', required: true, placeholder: 'Section 1: [Title] — [What the reader can do after this section]\nSection 2: [Title] — [What the reader can do after this section]\nSection 3: [Title] — ...', helperText: 'Write the actual outline, not a description of what you will outline later.' },
        { name: 'total_sections', label: 'How many sections/modules total?', type: 'text', required: false, placeholder: 'e.g. 4 sections, 6 modules, 8 chapters' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'ai_prompt'],
    aiPrompt: 'Create a complete outline for my digital product. Product name: [name]. Product type: [type]. Product promise: [promise]. Minimum scope I committed to: [your scope]. Target audience: [avatar description].\n\nWrite a full section-by-section outline where each section has a clear specific title and a one-sentence outcome statement (After this section you will be able to...). The sections should flow logically from the reader current situation to the promised outcome. Match my minimum scope — do not add extra sections. Then flag any section that could be cut without losing the core promise.',
    exportable: true,
    toolLinks: [],
    route: '/projects/:id/tasks/product_outline',
    brainUpdatePrompt: 'Add my digital product outline to my business brain. Product name: [name]. Price: [price]. Promise: [promise]. Outline: [paste your outline]. Reference this when helping me write sales copy, email sequences, or content about this product.',
  },

  {
    taskId: 'product_create',
    title: 'Create your product',
    phase: 'build',
    funnelTypes: ['all'],
    order: 7,
    priority: 1,
    estimatedMinutesMin: 60,
    estimatedMinutesMax: 300,
    blocking: true,
    dependencies: ['product_outline'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      "Your product exists as a real, complete file you could deliver to a customer today",
      "Every section from your outline is covered",
      "You have proofread it at least once",
    ],
    whyItMatters: "This is where the product gets made. Use Claude to write the content, Claude image generation to create any visuals, and Google Docs to produce the final file. You do not need design software or a team.",
    instructions: [
      "Use the AI prompt below to generate a full first draft of each section — paste your outline and let Claude write",
      "For visual products like guides and templates, use Claude image generation for any graphics or covers",
      "Write in Google Docs for easy editing — export to PDF when finished",
      "For video products: record your screen or your face, keep each module under 10 minutes",
      "Do not perfect it during creation — write everything first, then edit",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'product_status', label: 'Where is your product right now?', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'complete', label: 'Complete — ready to deliver' }, { value: 'draft_complete', label: 'First draft complete — needs editing' }, { value: 'in_progress', label: 'In progress — still writing/recording' }, { value: 'just_started', label: 'Just started — outline stage' }, { value: 'not_started', label: 'Not started yet' } ] },
        { name: 'product_file_location', label: 'Where is your product file stored?', type: 'text', required: false, placeholder: 'e.g. Google Drive link, Dropbox, local file name', helperText: 'Save this here so you can find it when setting up delivery.' },
        { name: 'product_format', label: 'What is the final file format?', type: 'text', required: false, placeholder: 'e.g. PDF, Google Doc, MP4 video files, Notion template link' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Write [Section/Module name] of my digital product. Product name: [name]. Target audience: [avatar name/description]. Product promise: [promise].\n\nSection title: [section title]\nWhat the reader should be able to do after this section: [outcome statement from your outline]\n\nWrite this section in full. Use my brand voice: [describe your tone]. Include: a brief intro that connects to where the reader is right now, the core content with step-by-step clarity, and a brief close that bridges to the next section. Aim for [X] words. Every sentence should serve the outcome.',
    toolLinks: [
      { label: 'Open Google Docs', url: 'https://docs.google.com', icon: 'file-text' },
      { label: 'Open Claude (image generation)', url: 'https://claude.ai', icon: 'sparkles' },
    ],
    route: '/projects/:id/tasks/product_create',
  },

  {
    taskId: 'product_brain_update',
    title: 'Add your product to your business brain',
    phase: 'build',
    funnelTypes: ['all'],
    order: 8,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: false,
    dependencies: ['product_create'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      "Your product details are uploaded to Google Drive (Digital Product folder) and added to your Claude Project",
      "Claude knows your product name, promise, price, and outline",
    ],
    whyItMatters: "Your sales page copy, email sequences, and social content all need to reference your product accurately. Adding the product details to your Claude Project now means every piece of copy you write from here on will be specific to your actual product.",
    instructions: [
      "Upload your product outline to the Digital Product folder in your Google Drive Business Brain",
      "In your Claude Project, paste the brain update prompt below with your product details filled in",
      "Test it: ask Claude what is my digital product and what does it promise — it should respond with your specifics",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'brain_updated', label: 'Have you added your product to your Claude Project?', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'yes_both', label: 'Yes — uploaded to Google Drive and pasted into Claude Project' }, { value: 'yes_claude_only', label: 'Yes — pasted into Claude Project only' }, { value: 'yes_drive_only', label: 'Yes — uploaded to Google Drive only' }, { value: 'not_yet', label: 'Not yet' } ] },
      ],
    },
    aiAssistModes: [],
    toolLinks: [
      { label: 'Open Google Drive', url: 'https://drive.google.com', icon: 'folder' },
      { label: 'Open Claude Projects', url: 'https://claude.ai', icon: 'brain' },
    ],
    route: '/projects/:id/tasks/product_brain_update',
    brainUpdatePrompt: 'Add my digital product to my business brain:\n\nProduct name: [name]\nProduct type: [type]\nProduct promise: [promise]\nPrice: [price]\nTarget audience: [avatar name]\nOutline: [paste your outline]\nFile location: [Google Drive link if applicable]\n\nWhen I ask you to write sales copy, emails, social posts, or any content about my product — use these exact details.',
  },


  // ============================================================
  // PHASE 3 — YOUR SALES PAGE (build phase, orders 9-16)
  // ============================================================

  {
    taskId: 'salespage_anatomy',
    title: 'Learn what goes on a sales page',
    phase: 'build',
    funnelTypes: ['all'],
    order: 9,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['product_brain_update'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You know the 14 sections of a complete sales page and what each one does',
      'You understand the job of your headline and call-to-action before you write a word',
    ],
    whyItMatters: 'A sales page is not a wall of text — it is a sequence of decisions your reader makes as they scroll. Each section does one specific job. Knowing the job before you write makes everything faster and more effective.',
    instructions: [
      'Read through the 14 sections below — each has a one-sentence description of its job',
      'Think about your product and what your version of each section might say',
      'You do not need to write anything here — the next task does that',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'headline', label: 'Opening headline', description: 'States the outcome or names the problem so clearly that the right person immediately knows this is for them.' },
        { value: 'problem', label: 'Paint the problem', description: 'Describes the painful current situation in their own words. When done right, they feel seen before you have mentioned your product.' },
        { value: 'future', label: 'Look into the future', description: 'Paints what life looks like after the problem is gone. Emotional and specific.' },
        { value: 'introduce_offer', label: 'Introduce your offer', description: 'Names and briefly describes your product for the first time. One sentence, clear, no hype.' },
        { value: 'differentiator', label: 'Offer differentiator', description: 'Explains why this is different from what they have already tried.' },
        { value: 'results', label: 'The results', description: 'Testimonials, outcomes, or case examples. Real evidence that this works.' },
        { value: 'features', label: 'The features', description: 'What is actually included. Specific and tangible — not abstract benefits.' },
        { value: 'investment', label: 'The investment', description: 'The price, clearly stated. No hiding it.' },
        { value: 'guarantee', label: 'The guarantee', description: 'Reduces the risk of buying. Does not have to be a refund — can be a promise of quality.' },
        { value: 'about', label: 'Introduce yourself', description: 'A short, receipts-based bio. Not credentials — results.' },
        { value: 'is_this_for_you', label: 'Is this for you?', description: 'Explicitly names who this is and is not for. Qualifies the reader so they self-select in or out.' },
        { value: 'why_now', label: 'Why now', description: 'Addresses the delay objection. Why is acting today better than waiting?' },
        { value: 'objections', label: 'FAQ or objections', description: 'Answers the 3-5 most common questions or doubts before the final decision.' },
        { value: 'final_cta', label: 'Final call-to-action', description: 'The last buy button. Clear, direct, one action. No alternatives.' },
      ],
    },
    aiAssistModes: ['simplify'],
    toolLinks: [],
    route: '/projects/:id/tasks/salespage_anatomy',
  },

  {
    taskId: 'salespage_write_copy',
    title: 'Write your sales page copy',
    phase: 'build',
    funnelTypes: ['all'],
    order: 10,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 45,
    blocking: true,
    dependencies: ['salespage_anatomy'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have AI-generated copy for all 14 sales page sections',
      'You have reviewed it and made edits so it sounds like you',
      'You have saved the final copy to your Google Drive (Sales Page folder)',
    ],
    whyItMatters: 'Your sales page copy is the single document that does all your selling while you sleep. The Sales Page Writer pulls from your product details and customer avatar to generate a full first draft across all 14 sections. Your job is to review and make it sound like you.',
    instructions: [
      'Open the Sales Page Writer tool using the button below',
      'Enter your product details — the tool will pull from your project data if you completed Phase 2',
      'Generate the full page and review each section — edit anything that sounds generic or off-brand',
      'Copy the final output to a Google Doc and save it to your Sales Page folder in Google Drive',
      'You will use this document in the next task when building the page in Lovable',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'copy_status', label: 'Where is your sales page copy right now?', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'complete_saved', label: 'Complete — reviewed, edited, and saved to Google Drive' }, { value: 'generated_not_edited', label: 'Generated — not reviewed or edited yet' }, { value: 'in_progress', label: 'In progress — still editing' }, { value: 'not_started', label: 'Not started yet' } ] },
        { name: 'copy_doc_link', label: 'Google Doc link (once you save it)', type: 'text', required: false, placeholder: 'Paste your Google Doc URL here', helperText: 'You will need this link in the next task when building in Lovable.' },
      ],
    },
    aiAssistModes: ['help_me_choose'],
    toolLinks: [
      { label: 'Open Sales Page Writer', url: '/app/ai-studio/sales-page', icon: 'file-text' },
      { label: 'Open Google Drive', url: 'https://drive.google.com', icon: 'folder' },
    ],
    route: '/projects/:id/tasks/salespage_write_copy',
    brainUpdatePrompt: 'Add my sales page copy to my business brain. Product: [product name]. Here is the copy: [paste your complete sales page copy]. When I ask you to write emails, social posts, or any content about this offer — reference the tone, language, and positioning from this sales page copy.',
  },

  {
    taskId: 'salespage_build_lovable',
    title: 'Build your sales page in Lovable',
    phase: 'build',
    funnelTypes: ['all'],
    order: 11,
    priority: 1,
    estimatedMinutesMin: 30,
    estimatedMinutesMax: 60,
    blocking: true,
    dependencies: ['salespage_write_copy'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your sales page is built and published in Lovable',
      'All 14 sections are present with your actual copy',
      'The page looks correct on mobile',
      'You have the live URL',
    ],
    whyItMatters: 'Lovable lets you build a professional sales page without writing a single line of code. You paste your copy, describe how you want it to look, and Lovable builds it. The result is a real hosted page at your domain — not a landing page builder template that looks like everyone else's.',
    instructions: [
      'Open Lovable and create a new project or open your existing one',
      'Use the AI prompt below to generate your Lovable build prompt — paste your sales page copy directly in',
      'Describe your brand style from your Foundation phase (colors, fonts, visual direction)',
      'Lovable will build the page — review it section by section and ask it to adjust anything off',
      'Connect your domain in Lovable settings, then publish',
      'Test on mobile — make sure it looks right and all buttons work',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'page_url', label: 'Your published sales page URL', type: 'text', required: false, placeholder: 'e.g. https://yourbusiness.com/product-name', helperText: 'You will need this for your email setup and social bio.' },
        { name: 'lovable_status', label: 'Where is the page right now?', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'live', label: 'Live — published with my domain connected' }, { value: 'built_not_published', label: 'Built in Lovable — not published yet' }, { value: 'in_progress', label: 'In progress — still building' }, { value: 'not_started', label: 'Not started yet' } ] },
        { name: 'mobile_tested', label: 'Have you checked it on mobile?', type: 'select', required: false, placeholder: 'Select...', options: [ { value: 'yes', label: 'Yes — looks good on mobile' }, { value: 'needs_work', label: 'Checked — some things need fixing' }, { value: 'not_yet', label: 'Not yet' } ] },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Write me a detailed Lovable prompt to build my sales page. My details: Product name: [name]. Brand colors: [primary and secondary]. Visual style: [your visual direction]. Page sections needed: all 14 standard sales page sections. Sales page copy: [paste your complete sales page copy].\n\nWrite a Lovable prompt that: (1) describes the overall page design and feel, (2) specifies layout and visual hierarchy, (3) instructs Lovable to use my exact copy in each section without paraphrasing, (4) includes mobile responsiveness requirements, (5) asks for a sticky header with CTA on scroll. Make it detailed enough that Lovable gets it right on the first try.',
    toolLinks: [
      { label: 'Open Lovable', url: 'https://lovable.dev', icon: 'external-link' },
    ],
    route: '/projects/:id/tasks/salespage_build_lovable',
  },

  {
    taskId: 'salespage_connect_surecontact',
    title: 'Connect SureContact to your sales page',
    phase: 'build',
    funnelTypes: ['all'],
    order: 12,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['salespage_build_lovable'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'SureContact is integrated with your Lovable sales page',
      'When someone enters their email on your page, it flows into SureContact',
      'You have tested the opt-in and confirmed the contact appears in SureContact',
    ],
    whyItMatters: 'Every person who lands on your sales page and gives you their email is a potential buyer. Without SureContact connected, those emails go nowhere. This integration means every opt-in automatically enters your email list and can trigger your welcome sequence. It takes one Lovable prompt and your SureContact API key.',
    instructions: [
      'Find your SureContact API key: in SureContact go to Settings, then Integrations or API, and copy your key',
      'Open your Lovable project',
      'Paste the Lovable prompt from the example section into Lovable — it tells Lovable exactly how to integrate SureContact',
      'Lovable will ask for your API key — paste it when prompted',
      'After Lovable rebuilds, test the integration: enter a test email on your page and check that it appears in SureContact within 60 seconds',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'integration_status', label: 'SureContact integration status', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'connected_tested', label: 'Connected and tested — opt-ins flowing into SureContact' }, { value: 'connected_not_tested', label: 'Connected but not tested yet' }, { value: 'in_progress', label: 'In progress — setting it up now' }, { value: 'not_started', label: 'Not started yet' } ] },
        { name: 'surecontact_list', label: 'Which SureContact list do opt-ins go to?', type: 'text', required: false, placeholder: 'e.g. Product Waitlist, Main List, [Product Name] Subscribers', helperText: 'Create a dedicated list for this product if you do not have one.' },
      ],
    },
    aiAssistModes: ['simplify'],
    toolLinks: [
      { label: 'Open SureContact', url: 'https://app.surecontact.com', icon: 'mail' },
      { label: 'Open Lovable', url: 'https://lovable.dev', icon: 'external-link' },
    ],
    route: '/projects/:id/tasks/salespage_connect_surecontact',
    exampleText: 'Lovable prompt to integrate SureContact:

"Add a SureContact integration to the email opt-in form on this page. When a user submits their email:
1. Send their email and first name to SureContact via their API
2. Add them to the list named [your list name]
3. Show a success message: [your success message]
4. If the API call fails, show a graceful error without breaking the page

Here is my SureContact API key: [paste your key]

Use the SureContact REST API endpoint for adding contacts. Handle async correctly so the page does not freeze on submission."',
  },

  {
    taskId: 'salespage_setup_stripe',
    title: 'Set up Stripe payments',
    phase: 'build',
    funnelTypes: ['all'],
    order: 13,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 40,
    blocking: true,
    dependencies: ['salespage_build_lovable'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Stripe is connected to your Lovable sales page',
      'Your product is listed in Stripe with the correct price',
      'You have run a test payment and confirmed it goes through',
    ],
    whyItMatters: 'Without a payment link, your sales page is a brochure. Stripe handles security, receipts, and payouts automatically. Lovable can integrate with Stripe in one prompt. Once connected, anyone who clicks buy on your page can complete a real purchase.',
    instructions: [
      'Create a free Stripe account at stripe.com if you do not have one — it takes 5 minutes',
      'In Stripe, go to Products and create your product with the price from Phase 2',
      'Copy your Stripe publishable key and the price ID for your product',
      'Open Lovable and paste the integration prompt from the example section',
      'Test with Stripe test card 4242 4242 4242 4242, any future date, any 3-digit CVC',
      'Check your Stripe dashboard to confirm the test payment landed',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'stripe_status', label: 'Stripe setup status', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'live_tested', label: 'Live — Stripe connected, test payment confirmed' }, { value: 'connected_not_tested', label: 'Connected — not tested yet' }, { value: 'stripe_account_only', label: 'Stripe account created — not yet connected to page' }, { value: 'not_started', label: 'No Stripe account yet' } ] },
        { name: 'stripe_product_id', label: 'Your Stripe price ID (optional)', type: 'text', required: false, placeholder: 'e.g. price_1234abcd...', helperText: 'Save this here for post-purchase automations.' },
      ],
    },
    aiAssistModes: ['simplify', 'ai_prompt'],
    aiPrompt: 'Write me a Lovable prompt to integrate Stripe payments on my sales page. My details: Product name: [name]. Price: [price]. Stripe publishable key: [key]. Stripe price ID: [price ID]. After successful payment redirect to: [thank you page URL]. After failed payment show: [error message].

Write a complete Lovable prompt that adds a working Stripe checkout button, handles success and error states gracefully, and does not break the existing page design.',
    toolLinks: [
      { label: 'Create a Stripe account', url: 'https://stripe.com', icon: 'credit-card' },
      { label: 'Open Lovable', url: 'https://lovable.dev', icon: 'external-link' },
    ],
    route: '/projects/:id/tasks/salespage_setup_stripe',
    exampleText: 'Stripe test card numbers:
Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002
Expiry: any future date (e.g. 12/26)
CVC: any 3 digits

Always test before going live.',
  },

  {
    taskId: 'salespage_setup_delivery',
    title: 'Set up your product delivery',
    phase: 'build',
    funnelTypes: ['all'],
    order: 14,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['salespage_setup_stripe'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a delivery mechanism — the buyer receives their product automatically after purchase',
      'You have tested delivery yourself and confirmed you received the product',
    ],
    whyItMatters: 'The moment after purchase is the highest-trust moment in your customer relationship. If delivery is broken, clunky, or confusing — that is the first impression of your product. Delivery should be automatic, instant, and clean.',
    instructions: [
      'Choose your delivery method based on your product type',
      'For PDF products: upload to Google Drive, create a sharing link, add it to your Stripe success page or SureContact post-purchase email',
      'For Lovable-hosted access pages: build a simple page that unlocks after Stripe confirms payment',
      'Test it: complete a test purchase and confirm you receive the product at the end of the flow',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'delivery_method', label: 'How will buyers receive the product?', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'email_link', label: 'Email delivery — SureContact sends the download link after purchase' }, { value: 'stripe_redirect', label: 'Stripe redirect — buyer lands on a thank-you page with the download link' }, { value: 'lovable_gated_page', label: 'Lovable access page — a page that unlocks after payment' }, { value: 'manual_for_now', label: 'Manual for now — I will deliver personally until I set up automation' } ] },
        { name: 'delivery_link', label: 'Product file or access link', type: 'text', required: false, placeholder: 'e.g. Google Drive share link, Dropbox link, Notion page URL', helperText: 'Save this here — you will need it when writing your post-purchase email.' },
        { name: 'delivery_tested', label: 'Have you tested the delivery flow?', type: 'select', required: false, placeholder: 'Select...', options: [ { value: 'yes', label: 'Yes — purchased and received the product successfully' }, { value: 'not_yet', label: 'Not yet' } ] },
      ],
    },
    aiAssistModes: ['simplify', 'ai_prompt'],
    aiPrompt: 'Write me a Lovable prompt to build a simple product delivery thank-you page that appears after a successful Stripe payment. Page should include: a thank you message ([your message]), the product name ([name]), a clear download or access button linking to ([your product link]), next steps for the buyer ([e.g. check your email for your receipt]), my brand style ([colors and visual direction]). Keep it clean and simple. The buyer just paid — make them feel good about it.',
    toolLinks: [
      { label: 'Open Google Drive', url: 'https://drive.google.com', icon: 'folder' },
      { label: 'Open Lovable', url: 'https://lovable.dev', icon: 'external-link' },
    ],
    route: '/projects/:id/tasks/salespage_setup_delivery',
  },

  {
    taskId: 'salespage_test_flow',
    title: 'Test your full purchase flow',
    phase: 'build',
    funnelTypes: ['all'],
    order: 15,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['salespage_setup_delivery'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have gone through the complete buyer journey — from landing on the page to receiving the product',
      'Every step works correctly and nothing is broken',
      'You have fixed any issues found during testing',
    ],
    whyItMatters: 'Most launch failures are not strategy failures — they are broken links, undelivered products, and payment errors that could have been caught in 15 minutes. Testing your own flow before you promote is the simplest thing you can do to protect your first launch.',
    instructions: [
      'Go through the complete journey as a first-time buyer who found you on social media',
      'Click every link, scroll every section, fill out the email form, complete a test purchase, confirm you received the product',
      'Test on both desktop and mobile',
      'Fix anything that felt confusing, slow, or broken',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'page_loads', label: 'Sales page loads correctly', description: 'No broken images, no layout issues, all text readable' },
        { value: 'mobile_ok', label: 'Mobile experience is clean', description: 'Tested on a phone — buttons are tappable, text is not cut off' },
        { value: 'email_optin_works', label: 'Email opt-in flows to SureContact', description: 'Entered a test email and confirmed it appeared in SureContact within 60 seconds' },
        { value: 'payment_works', label: 'Test payment goes through', description: 'Used Stripe test card, payment confirmed in Stripe dashboard' },
        { value: 'delivery_confirmed', label: 'Product delivery works', description: 'Received the product at the end of the flow — download link works or access page loads' },
        { value: 'receipt_sent', label: 'Purchase receipt is sent', description: 'Stripe or SureContact sent a confirmation email after the test purchase' },
        { value: 'all_links_work', label: 'All links on the page work', description: 'Clicked every button and link — nothing goes to a 404 or blank page' },
      ],
    },
    aiAssistModes: [],
    toolLinks: [],
    route: '/projects/:id/tasks/salespage_test_flow',
  },

  {
    taskId: 'salespage_publish',
    title: 'Publish your sales page',
    phase: 'build',
    funnelTypes: ['all'],
    order: 16,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['salespage_test_flow'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your sales page is live at a real URL on your domain',
      'The URL is saved and ready to use in your email marketing, social bio, and launch posts',
    ],
    whyItMatters: 'Once your page is live, you have a permanent place to point every piece of marketing you create. Everything converges here.',
    instructions: [
      'In Lovable, connect your custom domain if you have not already',
      'Publish the project — Lovable makes it live immediately',
      'Copy the live URL and save it below',
      'Add the URL to your link in bio on your primary social platform',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'live_url', label: 'Your live sales page URL', type: 'text', required: true, placeholder: 'https://yourbusiness.com/your-product' },
        { name: 'domain_connected', label: 'Is your custom domain connected?', type: 'select', required: false, placeholder: 'Select...', options: [ { value: 'yes', label: 'Yes — live at my custom domain' }, { value: 'lovable_subdomain', label: 'Using Lovable subdomain for now' } ] },
        { name: 'bio_updated', label: 'Have you added this URL to your social bio?', type: 'select', required: false, placeholder: 'Select...', options: [ { value: 'yes', label: 'Yes — updated in my bio' }, { value: 'not_yet', label: 'Not yet' } ] },
      ],
    },
    aiAssistModes: [],
    toolLinks: [
      { label: 'Open Lovable', url: 'https://lovable.dev', icon: 'external-link' },
    ],
    route: '/projects/:id/tasks/salespage_publish',
    brainUpdatePrompt: 'My sales page is now live. URL: [your URL]. Use this URL whenever you help me write emails, social posts, or any marketing content that needs a link.',
  },

  // ============================================================
  // PHASE 4 — EMAIL MARKETING SETUP (build phase, orders 17-23)
  // ============================================================

  {
    taskId: 'email_surecontact_setup',
    title: 'Create your SureContact account',
    phase: 'build',
    funnelTypes: ['all'],
    order: 17,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['salespage_publish'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your SureContact account is created and set up with your business name and email',
      'You have verified your sending domain so your emails do not land in spam',
    ],
    whyItMatters: 'SureContact is your email marketing system — it is where your list lives, where your automations run, and where every email to your audience comes from. Domain verification at the start means your emails actually reach inboxes instead of spam folders.',
    instructions: [
      'Create your SureContact account at surecontact.com — use your professional business email',
      'In account settings, enter your business name and physical address (required by CAN-SPAM law)',
      'Go to Settings, then Sending Domains, and add your domain — verify it by adding the DNS records to your domain registrar',
      'Domain verification is critical — without it your emails have a high chance of going to spam',
      'If you get stuck on DNS records, use the AI prompt below for a step-by-step walkthrough',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'account_status', label: 'SureContact account status', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'setup_verified', label: 'Set up and domain verified — ready to send' }, { value: 'created_not_verified', label: 'Account created — domain not verified yet' }, { value: 'in_progress', label: 'Setting it up now' }, { value: 'not_started', label: 'No account yet' } ] },
        { name: 'sending_email', label: 'What email address will you send from?', type: 'text', required: false, placeholder: 'e.g. hello@yourbusiness.com', helperText: 'Use your custom domain email, not Gmail — this affects deliverability.' },
      ],
    },
    aiAssistModes: ['simplify', 'ai_prompt'],
    aiPrompt: 'Walk me through verifying my sending domain in SureContact. My domain is [your domain]. My domain registrar is [registrar, e.g. Namecheap, GoDaddy]. Give me step-by-step instructions for: (1) finding the DNS verification records in SureContact, (2) adding those records in my registrar, (3) verifying they worked. Include what the records should look like so I know if I did it right.',
    toolLinks: [
      { label: 'Open SureContact', url: 'https://app.surecontact.com', icon: 'mail' },
    ],
    route: '/projects/:id/tasks/email_surecontact_setup',
  },

  {
    taskId: 'email_import_contacts',
    title: 'Import your existing contacts',
    phase: 'build',
    funnelTypes: ['all'],
    order: 18,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['email_surecontact_setup'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'Any existing contacts you have permission to email are imported into SureContact',
    ],
    whyItMatters: 'If you have any contacts who have given you permission to email them — past clients, newsletter subscribers, event attendees — those people are your warmest audience for your launch. Importing them means your first emails reach people who already know you.',
    instructions: [
      'Export contacts from any existing tools — Gmail contacts, Mailchimp, Flodesk, spreadsheets',
      'Only import people who have explicitly opted in — do not import scraped lists or business cards',
      'In SureContact, go to Contacts, then Import, and upload your CSV',
      'Tag imported contacts as existing — this helps you segment your audience later',
      'If you have zero existing contacts, skip this task — your list starts now',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'contacts_imported', label: 'Did you have existing contacts to import?', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'imported', label: 'Yes — imported existing contacts into SureContact' }, { value: 'no_existing', label: 'No existing contacts — starting from zero' }, { value: 'not_eligible', label: 'Have contacts but they did not opt in — not importing' } ] },
        { name: 'starting_list_size', label: 'How many contacts are in your list right now?', type: 'text', required: false, placeholder: 'e.g. 0, 47, 230', helperText: 'Even starting at zero is fine — your list builds through your sales page and content.' },
      ],
    },
    aiAssistModes: ['simplify'],
    toolLinks: [
      { label: 'Open SureContact', url: 'https://app.surecontact.com', icon: 'mail' },
    ],
    route: '/projects/:id/tasks/email_import_contacts',
  },

  {
    taskId: 'email_welcome_sequence',
    title: 'Write your welcome email sequence',
    phase: 'build',
    funnelTypes: ['all'],
    order: 19,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 45,
    blocking: true,
    dependencies: ['email_surecontact_setup'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a 3-5 email welcome sequence written and saved',
      'Email 1 delivers the promise (free resource, confirmation, or welcome)',
      'The sequence naturally leads to your product without being a hard sell',
    ],
    whyItMatters: 'Your welcome sequence is the most important email automation you will ever set up. It is the first thing new subscribers receive — before they have forgotten who you are. The welcome sequence builds the relationship that eventually converts subscribers into buyers.',
    instructions: [
      'Open the Email Sequence Generator tool using the button below',
      'Select Welcome / Nurture as the sequence type',
      'Enter your product and audience details — the tool generates all 3-5 emails',
      'Review and edit each email to match your voice — remove anything that sounds generic',
      'Save the final sequence to your Google Drive (Email Marketing folder)',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'sequence_status', label: 'Welcome sequence status', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'written_saved', label: 'Written, reviewed, and saved to Google Drive' }, { value: 'generated_not_edited', label: 'Generated — not yet reviewed or edited' }, { value: 'in_progress', label: 'In progress' }, { value: 'not_started', label: 'Not started yet' } ] },
        { name: 'sequence_length', label: 'How many emails in your welcome sequence?', type: 'text', required: false, placeholder: 'e.g. 3 emails, 5 emails' },
        { name: 'sequence_doc_link', label: 'Google Doc link (once saved)', type: 'text', required: false, placeholder: 'Paste your Google Doc URL here' },
      ],
    },
    aiAssistModes: ['help_me_choose'],
    toolLinks: [
      { label: 'Open Email Sequence Generator', url: '/app/ai-studio/email-sequence', icon: 'mail' },
      { label: 'Open Google Drive', url: 'https://drive.google.com', icon: 'folder' },
    ],
    route: '/projects/:id/tasks/email_welcome_sequence',
    brainUpdatePrompt: 'Add my welcome email sequence to my business brain. Here are the emails: [paste your sequence]. When I ask you to write future emails or create new sequences, reference the tone and approach from this welcome sequence.',
  },

  {
    taskId: 'email_product_announcement',
    title: 'Write your product announcement email',
    phase: 'build',
    funnelTypes: ['all'],
    order: 20,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['email_welcome_sequence'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a product announcement email written for your existing list',
      'The email has a clear subject line, clear product description, and a single link to your sales page',
    ],
    whyItMatters: 'The announcement email goes to your existing list when you launch. It introduces the product, makes the value clear, and gives them one link to click. That is it.',
    instructions: [
      'Use the Email Sequence Generator set to Launch Sequence with 1 email',
      'Subject line: make it curious, specific, or direct — avoid all-caps and exclamation points',
      'Body: 3-5 short paragraphs — who it is for, what it does, what it costs, one link',
      'Call to action: one link, one action — do not add multiple links or options',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'announcement_subject', label: 'Your announcement email subject line', type: 'text', required: false, placeholder: 'e.g. "Something I built for you", "New: [Product Name] is ready"' },
        { name: 'announcement_status', label: 'Announcement email status', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'written_ready', label: 'Written and ready to send on launch day' }, { value: 'draft', label: 'Draft — needs more editing' }, { value: 'not_started', label: 'Not started yet' } ] },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Write a product announcement email to my existing email list. Product name: [name]. Product promise: [promise]. Price: [price]. Sales page URL: [URL]. Audience: [avatar description].

Requirements: 3 subject line options (one curious, one direct, one personal), short body (3-5 paragraphs), tone: [your brand voice], include who this is for + what it does + what it costs + one link, do not oversell or use hype language. Write the full email ready to copy and paste.',
    toolLinks: [
      { label: 'Open Email Sequence Generator', url: '/app/ai-studio/email-sequence', icon: 'mail' },
    ],
    route: '/projects/:id/tasks/email_product_announcement',
  },

  {
    taskId: 'email_build_automation',
    title: 'Set up your opt-in automation in SureContact',
    phase: 'build',
    funnelTypes: ['all'],
    order: 21,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 40,
    blocking: true,
    dependencies: ['email_welcome_sequence'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your welcome sequence is live in SureContact as an automation',
      'The automation triggers when someone opts in through your sales page form',
      'You have tested it and confirmed the first email fires',
    ],
    whyItMatters: 'Writing your emails is only half the job. Until they are inside SureContact as an active automation, no one receives them. This moves your welcome sequence from a document into a live system that sends automatically every time someone opts in.',
    instructions: [
      'In SureContact, go to Automations and create a new automation',
      'Set the trigger: Contact joins a list (select the list your sales page form connects to)',
      'Add a delay of 0 minutes, then Send Email and select Email 1 from your welcome sequence',
      'Add a 1-2 day delay, then Email 2, and continue for each email in your sequence',
      'Set the automation to Active and test it: opt in with a real email and confirm the first email arrives within 5 minutes',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'emails_created', label: 'Welcome emails created in SureContact', description: 'All emails from your sequence are created as email templates in SureContact' },
        { value: 'automation_created', label: 'Automation built in SureContact', description: 'Trigger, delays, and send email steps are all configured' },
        { value: 'automation_active', label: 'Automation set to Active', description: 'The automation is live — not in draft mode' },
        { value: 'test_opt_in', label: 'Test opt-in completed', description: 'Opted in with a real email and received Email 1 within 5 minutes' },
        { value: 'sequence_fires', label: 'Full sequence confirmed', description: 'Checked that subsequent emails will fire at the right intervals' },
      ],
    },
    aiAssistModes: ['simplify'],
    toolLinks: [
      { label: 'Open SureContact Automations', url: 'https://app.surecontact.com', icon: 'mail' },
    ],
    route: '/projects/:id/tasks/email_build_automation',
  },

  {
    taskId: 'email_broadcast_rhythm',
    title: 'Set your broadcast email rhythm',
    phase: 'build',
    funnelTypes: ['all'],
    order: 22,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: false,
    dependencies: ['email_build_automation'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have decided how often you will send broadcast emails to your list',
      'You know what types of emails you will send on a regular basis',
    ],
    whyItMatters: 'Automations send when someone is new. Broadcasts are how you stay in touch with your whole list over time. A consistent rhythm keeps your list warm so when you have something to sell, you are not a stranger in their inbox.',
    instructions: [
      'Pick a frequency you can actually sustain — once a week is ideal, twice a month is fine, once a month is the minimum',
      'Decide the types of emails you will send: value content, behind-the-scenes, product updates, promotions, or a mix',
      'Write this down as a commitment — you do not need to write the emails now, just decide the rhythm',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'broadcast_frequency', label: 'How often will you email your list?', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'twice_week', label: 'Twice a week' }, { value: 'once_week', label: 'Once a week (recommended)' }, { value: 'twice_month', label: 'Twice a month' }, { value: 'once_month', label: 'Once a month' } ] },
        { name: 'email_types', label: 'What types of emails will you send?', type: 'textarea', required: false, placeholder: 'e.g. Weekly tips related to my product topic, occasional product promotions, behind-the-scenes updates on what I am building...' },
        { name: 'send_day', label: 'What day will you typically send?', type: 'text', required: false, placeholder: 'e.g. Tuesday mornings, Thursday afternoons', helperText: 'Consistency matters more than the specific day.' },
      ],
    },
    aiAssistModes: ['simplify'],
    toolLinks: [],
    route: '/projects/:id/tasks/email_broadcast_rhythm',
  },

  {
    taskId: 'email_test_full_flow',
    title: 'Test your complete email flow',
    phase: 'build',
    funnelTypes: ['all'],
    order: 23,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['email_build_automation'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have tested the complete opt-in to welcome sequence journey yourself',
      'Emails arrive in inbox — not spam — from your verified sending domain',
      'All links in the emails work correctly',
    ],
    whyItMatters: 'Broken email flows are invisible to you until a real subscriber reports them. Five minutes of testing saves weeks of wondering why nobody is engaging.',
    instructions: [
      'Use a personal email address different from your SureContact account',
      'Go to your sales page, enter your test email in the opt-in form',
      'Confirm you receive the welcome email within 5 minutes — if it lands in spam, check domain verification',
      'Click every link in every email and confirm they go to the right places',
      'Check the sending name, subject lines, and preview text look correct',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'optin_works', label: 'Opt-in form submits and confirms', description: 'Form on the sales page submits successfully and shows a confirmation message' },
        { value: 'email1_received', label: 'Email 1 received in inbox not spam', description: 'First welcome email arrived in inbox within 5 minutes' },
        { value: 'sender_looks_correct', label: 'Sender name and email look correct', description: 'The from name and address match your business identity' },
        { value: 'links_work', label: 'All links in emails work', description: 'Clicked every link — all go to the right destination' },
        { value: 'sequence_timing_correct', label: 'Sequence timing is correct', description: 'Delays between emails are set correctly in the automation' },
      ],
    },
    aiAssistModes: [],
    toolLinks: [
      { label: 'Open SureContact', url: 'https://app.surecontact.com', icon: 'mail' },
    ],
    route: '/projects/:id/tasks/email_test_full_flow',
  },



  // ============================================================
  // PHASE 5 — MESSAGING & POSITIONING (messaging phase, orders 1-8)
  // "Before you say anything publicly, know exactly what
  //  you are saying and why."
  // 8 tasks. Happens after the product exists and the site is
  // built — because now there is something real to position.
  // Ends with everything added to the business brain so Claude
  // has full messaging context for every future content task.
  // ============================================================

  {
    taskId: 'messaging_core_message',
    title: 'Write your core message',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 1,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: [],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have one clear sentence that captures the central idea you want people to associate with your brand',
      'It is specific enough that your ideal customer would recognize it is for them',
    ],
    whyItMatters: 'Your core message is the central idea your entire brand orbits around. It is not your tagline, not your product name, not your mission statement — it is the one thing you want people to walk away thinking after any interaction with your brand. When your core message is clear, every social post, every email, every sales page section reinforces the same idea. Without it, your content feels scattered.',
    instructions: [
      'Think about what you want your ideal customer to believe after engaging with your brand — not just what you sell',
      'The core message is usually a strong point of view: a belief about how things should work, what is wrong with the current approach, or what is possible that most people do not realize',
      'Write it as a clear, bold statement — not a question, not a soft suggestion',
      'Test it: would your ideal customer say "yes, exactly" or "hmm, interesting"? It should be the first one.',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'core_message',
          label: 'Your core message',
          type: 'textarea',
          required: true,
          placeholder: 'e.g. Every local service business is leaving money on the table because their digital foundation is broken — and fixing it takes days, not months.',
          helperText: 'One to three sentences. Bold and specific. Should feel like a strong opinion, not a safe statement.',
        },
        {
          name: 'what_you_believe',
          label: 'What do you believe that most people in your space do not say out loud?',
          type: 'textarea',
          required: false,
          placeholder: 'e.g. Most web designers build sites that look good but do not actually bring in clients — because they do not understand marketing...',
          helperText: 'This is often where the core message lives. The thing you say that makes people go "finally, someone said it."',
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'ai_prompt'],
    aiPrompt: 'Help me write my brand core message. My business is [business name and tagline]. I serve [customer avatar description]. The problem I solve: [problem]. My approach is different because: [what makes you different]. What I believe that most people in my space do not say: [your answer].

Write 5 core message options. Each should be 1-3 sentences, bold and opinionated — not a soft mission statement. The best one should make my ideal customer feel seen and make anyone outside my audience feel it is not for them. Recommend the strongest one and explain why it would resonate with my specific audience.',
    toolLinks: [],
    route: '/projects/:id/tasks/messaging_core_message',
    exampleText: 'Weak: "I help small businesses grow with marketing."

Strong: "Local service businesses are the backbone of every community — and most of them are invisible online because nobody ever taught them the basics. That changes here."

The strong version has a point of view. It takes a side. It makes the right person feel understood.',
  },

  {
    taskId: 'messaging_transformation',
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
      'You have a before-and-after statement that describes the change your customer experiences',
      'It is specific, believable, and emotionally resonant — not vague or exaggerated',
    ],
    whyItMatters: 'People buy transformations, not products. Your transformation statement is the most persuasive sentence in your entire marketing toolkit — it goes in your sales page headline, your email subject lines, your social bio, and your pitch. When it is specific and real, it makes buyers feel that buying is obvious.',
    instructions: [
      'Use the formula: I help [specific audience] go from [painful before state] to [desired after state] [optional: in a specific timeframe]',
      'The before state should feel painful — specific frustration, not a vague situation',
      'The after state should feel achievable — specific result, not a fantasy',
      'Read it out loud — if you would say it to a real person, it is working',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'transformation_statement',
          label: 'Your transformation statement',
          type: 'textarea',
          required: true,
          placeholder: 'e.g. I help local service business owners go from scrambling for referrals and watching their Google Ads get paused to having a professional online presence that brings them consistent leads — without hiring an agency.',
          helperText: 'Formula: I help [audience] go from [before] to [after] without [obstacle].',
        },
        {
          name: 'before_state',
          label: 'Describe the before state in their words',
          type: 'text',
          required: false,
          placeholder: 'e.g. chasing every job through word of mouth, no Google presence, ads keep getting paused',
        },
        {
          name: 'after_state',
          label: 'Describe the after state specifically',
          type: 'text',
          required: false,
          placeholder: 'e.g. consistent inbound leads from Google, professional online presence, ads running correctly',
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'ai_prompt'],
    aiPrompt: 'Write my transformation statement. Audience: [customer avatar]. Before state (their painful current situation): [problem + obstacle]. After state (what they get): [dream outcome]. Timeline if applicable: [how long it takes].

Write 5 transformation statements using the formula: I help [audience] go from [before] to [after] [without/in]. Make the before state feel painful and specific. Make the after state feel achievable and concrete. Recommend the strongest one and explain what makes it work.',
    toolLinks: [],
    route: '/projects/:id/tasks/messaging_transformation',
    exampleText: 'Too vague: "I help business owners grow their business online."

Specific: "I help local service businesses go from invisible online and chasing every client through referrals to having a professional website, verified Google listing, and running ads — in 30 days."',
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
    dependencies: ['messaging_transformation'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have 3-5 specific talking points you will repeat consistently across all your content',
      'Each talking point connects back to your core message or your customer transformation',
    ],
    whyItMatters: 'Talking points are the 3-5 ideas you will come back to again and again — in social posts, in emails, in sales conversations, in podcasts. They are not topics. They are specific beliefs or perspectives that reinforce your core message and build your authority. Consistent talking points are what make a brand feel coherent over time instead of random.',
    instructions: [
      'Think about what you could talk about endlessly without getting bored — and that your audience needs to hear',
      'Each talking point should support the case for your product or your approach without being a direct pitch',
      'Make them specific enough to generate 10 different pieces of content each — not so broad they could apply to anyone',
      'Write each one as a strong statement, not a question or topic label',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'talking_point_1', label: 'Talking point 1', type: 'textarea', required: true, placeholder: 'e.g. Most businesses think they have a marketing problem — they actually have a visibility problem. No one can buy from someone they cannot find.' },
        { name: 'talking_point_2', label: 'Talking point 2', type: 'textarea', required: true, placeholder: 'Another core idea you will repeat often...' },
        { name: 'talking_point_3', label: 'Talking point 3', type: 'textarea', required: true, placeholder: 'Another core idea...' },
        { name: 'talking_point_4', label: 'Talking point 4 (optional)', type: 'textarea', required: false, placeholder: 'Optional fourth talking point...' },
        { name: 'talking_point_5', label: 'Talking point 5 (optional)', type: 'textarea', required: false, placeholder: 'Optional fifth talking point...' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'ai_prompt'],
    aiPrompt: 'Generate 8 talking points for my brand. Core message: [your core message]. Transformation: [your transformation statement]. Audience: [customer avatar]. Industry: [your industry].

Each talking point should be: a specific belief or perspective (not a generic tip), something that makes my audience feel understood and validated, something that builds the case for my approach without being a direct pitch, written as a bold statement I would say in a social post or podcast interview.

Then select the 5 strongest ones and explain why each would resonate with my specific audience.',
    toolLinks: [],
    route: '/projects/:id/tasks/messaging_talking_points',
  },

  {
    taskId: 'messaging_objections',
    title: 'Identify objections and your answers',
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
      'You have identified 3-5 objections your ideal customer has before buying',
      'You have a clear, confident answer to each one',
    ],
    whyItMatters: 'Every person who does not buy had a reason not to. Most of those reasons are predictable — the same 3-5 objections that come up over and over. When you know them in advance and address them in your marketing, your sales page, and your emails, you remove the friction before it becomes a reason to leave. The best marketers do not wait for objections — they answer them first.',
    instructions: [
      'Think about what has stopped people from working with you or buying from you in the past',
      'Think about what questions people ask before they commit — those questions are usually objections in disguise',
      'Write each objection in the voice of your customer — the exact words they would use',
      'Write a confident, honest answer for each — not a dismissal, a genuine response',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'objection_1', label: 'Objection 1', type: 'text', required: true, placeholder: 'e.g. "I already tried to build a website and it never brought me any clients"' },
        { name: 'answer_1', label: 'Your answer to objection 1', type: 'textarea', required: true, placeholder: 'e.g. A website that does not bring clients is usually missing one of three things: correct Google Business Profile setup, proper on-page SEO basics, or a clear call to action...' },
        { name: 'objection_2', label: 'Objection 2', type: 'text', required: true, placeholder: 'e.g. "I do not have time to deal with this"' },
        { name: 'answer_2', label: 'Your answer to objection 2', type: 'textarea', required: true, placeholder: 'Your answer...' },
        { name: 'objection_3', label: 'Objection 3', type: 'text', required: true, placeholder: 'e.g. "I cannot afford it right now"' },
        { name: 'answer_3', label: 'Your answer to objection 3', type: 'textarea', required: true, placeholder: 'Your answer...' },
        { name: 'objection_4', label: 'Objection 4 (optional)', type: 'text', required: false, placeholder: 'Additional objection...' },
        { name: 'answer_4', label: 'Your answer (optional)', type: 'textarea', required: false, placeholder: 'Your answer...' },
        { name: 'objection_5', label: 'Objection 5 (optional)', type: 'text', required: false, placeholder: 'Additional objection...' },
        { name: 'answer_5', label: 'Your answer (optional)', type: 'textarea', required: false, placeholder: 'Your answer...' },
      ],
    },
    aiAssistModes: ['examples', 'ai_prompt'],
    aiPrompt: 'Help me identify and answer the top objections my audience has before buying my product. Product: [product name and promise]. Audience: [customer avatar]. Price: [price]. What they have tried before: [biggest obstacle answer from Phase 1].

List the 7 most likely objections this specific audience has — written in their voice, the exact words they would use. For each, write a confident honest answer that acknowledges the concern and addresses it without being defensive or dismissive. Prioritize the 5 most important ones.',
    toolLinks: [],
    route: '/projects/:id/tasks/messaging_objections',
  },

  {
    taskId: 'messaging_social_bio',
    title: 'Write your social media bio',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 5,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: false,
    dependencies: ['messaging_transformation'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have an updated bio for your primary social platform that reflects your current offer and audience',
      'The bio tells the right person they are in the right place within the first 2 seconds',
    ],
    whyItMatters: 'Your bio is the first thing people read when they land on your profile. It has about 2 seconds to make the right person think "this is for me" before they scroll away. Most bios are about the creator — your bio should be about the audience. It should answer: who is this for, what do they get, and where do they go next.',
    instructions: [
      'Use the platform-specific character limits: Instagram 150 chars, TikTok 80 chars, LinkedIn 220 chars',
      'Start with who you help, not what you do — lead with the audience, not yourself',
      'Include one specific result or outcome, not a vague benefit',
      'End with a clear call to action and your link',
      'Update your bio on every active platform — inconsistency loses trust',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'primary_platform', label: 'Primary platform', type: 'text', required: true, placeholder: 'e.g. Instagram, TikTok, LinkedIn, Facebook' },
        { name: 'bio_primary', label: 'Bio for your primary platform', type: 'textarea', required: true, placeholder: 'Write your bio here — keep it within the platform character limit' },
        { name: 'bio_secondary', label: 'Bio for a secondary platform (optional)', type: 'textarea', required: false, placeholder: 'Adapted version for a second platform...' },
        { name: 'link_in_bio', label: 'What is your link in bio pointing to?', type: 'text', required: false, placeholder: 'e.g. Your sales page URL, a link tree, your main site', helperText: 'This should go directly to your sales page or a page that collects emails.' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'ai_prompt'],
    aiPrompt: 'Write optimized social media bios for my brand. Audience: [customer avatar]. What I do: [transformation statement]. My main offer: [product name and promise]. My link: [sales page URL]. Brand voice: [describe your tone].

Write bios for:
- Instagram (max 150 characters)
- TikTok (max 80 characters)
- LinkedIn (max 220 characters, more professional)
- Facebook page (2-3 sentences)

Each bio should: start with who you help (not your name or title), include a specific result, end with a CTA pointing to the link. Vary the wording for each platform — do not just truncate the same sentence.',
    toolLinks: [],
    route: '/projects/:id/tasks/messaging_social_bio',
  },

  {
    taskId: 'messaging_brand_voice',
    title: 'Define your brand voice',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 6,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['messaging_core_message'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have described how your brand sounds in writing — tone, vocabulary, what you never say',
      'You could hand this to someone else and they could write in your voice',
    ],
    whyItMatters: 'When you use AI to write your emails, social posts, and sales copy — the output is only as good as the voice instructions you give it. A clear brand voice definition means Claude writes in your voice, not a generic marketing voice. It also keeps your content consistent across every channel so your audience recognizes you everywhere they encounter you.',
    instructions: [
      'Think about how you naturally talk to someone you want to help — not a formal presentation, not a sales pitch',
      'List words and phrases you use naturally and ones you would never use',
      'Describe the feeling your content should leave the reader with',
      'Think about 3 brands or creators whose writing style you admire — what do they have in common?',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'voice_tone', label: 'How would you describe your tone in 3-5 words?', type: 'text', required: true, placeholder: 'e.g. Direct, warm, no-nonsense, encouraging, real' },
        { name: 'voice_words_use', label: 'Words and phrases you naturally use', type: 'textarea', required: false, placeholder: 'e.g. y'all, let me be real with you, here is the thing, straight up, receipts not credentials...' },
        { name: 'voice_words_avoid', label: 'Words and phrases you would never use', type: 'textarea', required: false, placeholder: 'e.g. leverage, synergy, unlock your potential, game-changer, hustle, as an expert...' },
        { name: 'voice_personality', label: 'If your brand were a person, how would you describe them?', type: 'textarea', required: false, placeholder: 'e.g. The friend who has done this before and just tells you exactly what to do — no fluff, no gatekeeping, genuinely wants you to win...' },
        { name: 'voice_inspiration', label: 'Whose writing style do you admire? (brands, creators, writers)', type: 'text', required: false, placeholder: 'e.g. [creator names whose tone resonates with you]', sectionLabel: 'Optional: Inspiration' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Write a brand voice guide for my business. Here is what I know about how I communicate:

Tone in 3-5 words: [your answer]
Words I naturally use: [your answer]
Words I never use: [your answer]
Personality description: [your answer]
Creators I admire: [your answer]
Core message: [your core message]
Audience: [customer avatar]

Write a concise brand voice guide with: (1) a 2-3 sentence voice description I can paste at the top of any Claude prompt, (2) a "sounds like / does not sound like" comparison with 3-4 examples each, (3) 5 specific writing rules for my brand (e.g. "never start a sentence with As an expert"), (4) a tone calibration scale from 1-5 showing when to be more formal vs casual. Make it something I can use as a standing instruction in my Claude Project.',
    exportable: true,
    toolLinks: [],
    route: '/projects/:id/tasks/messaging_brand_voice',
    brainUpdatePrompt: 'Add my brand voice guide to my business brain. Here is my voice guide: [paste your brand voice guide]. From now on, use this voice guide whenever you write anything for my brand — social posts, emails, sales copy, captions, anything. Check every output against the sounds-like/does-not-sound-like examples before finalizing.',
  },

  {
    taskId: 'messaging_elevator_pitch',
    title: 'Write your elevator pitch',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 7,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['messaging_transformation'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You can explain what you do and who you help in 30 seconds without sounding scripted',
      'The pitch would make the right person ask a follow-up question',
    ],
    whyItMatters: 'Someone will ask "what do you do?" at a networking event, a family gathering, or in a DM. If your answer is unclear, rambling, or too modest — the opportunity is gone. A clear 30-second pitch that names the problem, the audience, and the outcome makes people lean in instead of politely nodding.',
    instructions: [
      'Write a version you would actually say out loud — not what looks good on paper',
      'It should include: who you help, what problem you solve, what result they get',
      'It should NOT include: your business name, your certifications, your entire backstory',
      'Practice saying it until it sounds natural — the best pitches sound improvised',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'elevator_pitch',
          label: 'Your 30-second elevator pitch',
          type: 'textarea',
          required: true,
          placeholder: 'e.g. You know how a lot of local service businesses — plumbers, auto repair, landscapers — are doing good work but nobody can find them online? I fix that. I help them get their website live, their Google Business Profile verified, and their ads running correctly so new customers start finding them without having to chase every job through referrals.',
          helperText: 'Write it like you would say it, not like you would write it. No business jargon.',
        },
        {
          name: 'written_version',
          label: 'A slightly more polished written version (optional)',
          type: 'textarea',
          required: false,
          placeholder: 'For DMs, email signatures, or anywhere you need a written version...',
          sectionLabel: 'Optional: Written variant',
        },
      ],
    },
    aiAssistModes: ['examples', 'ai_prompt'],
    aiPrompt: 'Write my elevator pitch in 3 versions. Audience: [customer avatar]. Problem: [problem]. Outcome: [transformation]. My name: [your name]. Business: [business name].

1. Conversational (30 seconds spoken) — sounds like something you would say at a barbecue, uses simple language, maybe a question to open
2. Professional (30 seconds spoken) — appropriate for a networking event or conference, slightly more polished but still natural
3. Written (2-3 sentences) — for DMs, LinkedIn intro messages, email signatures

All three should: name the problem before naming the solution, say who specifically you help, end with the transformation or result. None of them should mention certifications, years of experience, or your business name in the first sentence.',
    toolLinks: [],
    route: '/projects/:id/tasks/messaging_elevator_pitch',
  },

  {
    taskId: 'messaging_brain_update',
    title: 'Add your messaging to your business brain',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 8,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: false,
    dependencies: ['messaging_core_message', 'messaging_transformation', 'messaging_talking_points'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'Your core message, transformation statement, talking points, and brand voice are saved to Google Drive (Messaging folder)',
      'They are added to your Claude Project so every future content task uses your real messaging',
    ],
    whyItMatters: 'This is the task that makes every future content task dramatically better. When your Claude Project has your core message, transformation statement, talking points, objections, and brand voice — every social post, every email, every caption Claude helps you write will sound like you and reinforce your positioning. Without this, you are starting from scratch every time.',
    instructions: [
      'Create a Messaging document in Google Docs combining your core message, transformation statement, talking points, objections, and brand voice guide',
      'Save it to the Messaging folder in your Google Drive Business Brain',
      'In your Claude Project, paste the brain update prompt below with your messaging filled in',
      'Test it: ask Claude to write a 3-sentence social post about [your main topic] in your brand voice — it should sound like you',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'brain_updated',
          label: 'Have you added your messaging to your Claude Project?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'yes_both', label: 'Yes — saved to Google Drive and added to Claude Project' },
            { value: 'yes_claude_only', label: 'Yes — added to Claude Project only' },
            { value: 'not_yet', label: 'Not yet' },
          ],
        },
        {
          name: 'messaging_doc_link',
          label: 'Google Doc link (optional)',
          type: 'text',
          required: false,
          placeholder: 'Paste your Messaging Google Doc URL here',
        },
      ],
    },
    aiAssistModes: [],
    toolLinks: [
      { label: 'Open Google Drive', url: 'https://drive.google.com', icon: 'folder' },
      { label: 'Open Claude Projects', url: 'https://claude.ai', icon: 'brain' },
    ],
    route: '/projects/:id/tasks/messaging_brain_update',
    exportable: true,
    brainUpdatePrompt: 'Add my complete messaging framework to my business brain.

Core message: [your core message]

Transformation statement: [your transformation statement]

Key talking points:
1. [talking point 1]
2. [talking point 2]
3. [talking point 3]
4. [talking point 4 if applicable]
5. [talking point 5 if applicable]

Main objections and answers:
[paste your objections and answers]

Brand voice: [paste your brand voice guide or description]

From now on, use this messaging framework for every piece of content you write for my brand. Every social post, email, caption, or copy should reinforce my core message and match my brand voice.',
  },

  // ============================================================
  // PHASE 6 — CONTENT STRATEGY (content phase, orders 1-10)
  // "Pick your lane, show up consistently, let the content
  //  do the selling."
  // 10 tasks. Goes from platform selection through the first
  // 5 published posts. SureContact link-in-bio page included.
  // Designed around a solo operator who batches content.
  // ============================================================

  {
    taskId: 'content_choose_platform',
    title: 'Choose your primary platform',
    phase: 'content',
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
      'You have chosen one primary platform to focus on first',
      'Your choice is based on where your customer is — not where you are most comfortable',
    ],
    whyItMatters: 'Every platform wants you to be everywhere. Being everywhere as a solo operator means being mediocre everywhere. Choosing one platform and going deep on it — really understanding the format, the audience, and the algorithm — produces better results than spreading thin across five. You can add platforms later. Win one first.',
    instructions: [
      'Refer back to your Phase 1 answer about where your customer hangs out — your platform should be where they already are',
      'Consider what content format you can realistically produce consistently: short video (TikTok, Reels), written posts (LinkedIn, Facebook), carousels (Instagram, LinkedIn)',
      'Pick the platform where your customer is AND you can show up in a format you can sustain',
      'Commit. The platform you pick first is the one you focus on for the next 90 days.',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        { value: 'instagram', label: 'Instagram', description: 'Best for visual businesses, personal brands, and anyone whose audience skews 25-45. Strong for carousels, Reels, and Stories. High discovery potential.' },
        { value: 'facebook', label: 'Facebook (Page or Group)', description: 'Best for local businesses, service providers, and audiences 35+. Facebook Groups build community. Pages work well with ads.' },
        { value: 'tiktok', label: 'TikTok', description: 'Best for educational or entertainment content with strong reach for new audiences. Short video only. Fastest organic growth platform currently.' },
        { value: 'linkedin', label: 'LinkedIn', description: 'Best for B2B, professional services, and corporate audiences. Written posts perform strongly. Higher intent audience.' },
        { value: 'youtube', label: 'YouTube', description: 'Best for longer educational content and tutorial-based businesses. Long-term SEO value. Requires video production comfort.' },
        { value: 'facebook_group', label: 'Facebook Group (community-led)', description: 'Best for building a specific community around your offer before you launch. High engagement but requires active moderation.' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Help me choose the right primary content platform for my business. Audience: [customer avatar including age range, industry, daily platforms they use]. Content formats I am comfortable producing: [e.g. short video, written posts, carousels, talking to camera]. My business type: [service-based, digital product, local business]. My goal for content: [brand awareness, lead generation, community building].

Analyze each major platform (Instagram, Facebook, TikTok, LinkedIn, YouTube) for my specific audience and situation. Give me: (1) a clear recommendation for my primary platform with reasoning, (2) the content format that performs best on that platform for my audience type, (3) what realistic growth looks like on that platform in the first 90 days.',
    toolLinks: [],
    route: '/projects/:id/tasks/content_choose_platform',
  },

  {
    taskId: 'content_choose_model',
    title: 'Choose your content model',
    phase: 'content',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['content_choose_platform'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have selected one content model that fits where you are right now and where you want to go',
      'You understand how the model works over time and what it is building toward',
    ],
    whyItMatters: 'A content model is not just a posting schedule — it is a strategic arc that your content follows. Without one, every post is a standalone decision and content feels exhausting. With one, you know exactly what to create because every post is part of something larger. The right model for where you are now makes consistent content feel possible instead of overwhelming.',
    instructions: [
      'Read each model and pick the one that fits your current situation — not the one that sounds the most impressive',
      'If you are building an audience from scratch with no product yet: Story Arc or Evergreen',
      'If you have a product and want to sell it: Pre-Launch + Launch',
      'If you want a sustainable long-term system: Evergreen or Episode Series',
      'You can switch models between launches — pick the best one for right now',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        { value: 'pre_launch', label: 'Pre-Launch + Launch', description: '4 weeks of warm-up content leading into a time-limited open cart. Each post builds anticipation for the launch. Best when you have a specific launch date and a product ready to sell.' },
        { value: 'story_arc', label: '30-Day Story Arc', description: 'A narrative-driven content series that takes your audience through a journey — your origin, your method, your results, your offer. Best for building an engaged audience before making any offer.' },
        { value: 'evergreen', label: 'Evergreen Authority', description: 'Ongoing value-first content organized around your talking points — teaching, behind-the-scenes, tools, case studies, and occasional soft promotion. No launch window required. Best for long-term audience building.' },
        { value: 'episode_series', label: 'Episode Series', description: 'A recurring numbered format — like a show — that your audience comes back for each week. Builds loyalty and makes content predictable to create. Best if you enjoy consistency and want a recognizable format.' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Help me choose the right content model for my situation. Here is my context: Primary platform: [platform]. Current audience size: [rough number or "starting from zero"]. Do I have a product ready to sell: [yes/no — if yes, what is the product]. Content creation time I can realistically commit per week: [e.g. 2 hours, 4 hours]. My goal for the next 90 days: [brand awareness, list building, product sales, community building].

For each content model (Pre-Launch + Launch, Story Arc, Evergreen, Episode Series), describe: how it works for my specific platform, what the first 4 weeks of content would look like for my business, what it is building toward, and who it is best for. Then give me a clear recommendation for my situation.',
    toolLinks: [],
    route: '/projects/:id/tasks/content_choose_model',
  },

  {
    taskId: 'content_define_pillars',
    title: 'Define your content pillars',
    phase: 'content',
    funnelTypes: ['all'],
    order: 3,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['content_choose_model'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have 3-4 content pillars that every post maps back to',
      'Each pillar connects to your audience, your expertise, or your product',
    ],
    whyItMatters: 'Content pillars are the 3-4 recurring themes your content lives inside. They give you structure without a script — you always know which pillar a post belongs to, and your audience begins to recognize and expect your recurring themes. Without pillars, content creation requires a new decision every time. With pillars, you are just choosing which bucket to fill.',
    instructions: [
      'Think about 3-4 topics you could create 20 different posts about without running out of ideas',
      'Each pillar should connect to either your audience's world, your expertise, or the product you sell',
      'They should be specific enough to be distinct — "marketing" is too broad, "getting found on Google without paying for ads" is a pillar',
      'One pillar should always be connected to your product or offer — not a hard sell, but content that builds toward it',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'pillar_1', label: 'Content pillar 1', type: 'text', required: true, placeholder: 'e.g. The digital foundation every local business needs (and most are missing)' },
        { name: 'pillar_1_description', label: 'What does this pillar cover? (1-2 sentences)', type: 'textarea', required: false, placeholder: 'e.g. Posts about Google Business Profile, domain setup, website basics, and why these matter for getting found locally...' },
        { name: 'pillar_2', label: 'Content pillar 2', type: 'text', required: true, placeholder: 'Another core theme...' },
        { name: 'pillar_2_description', label: 'What does this pillar cover?', type: 'textarea', required: false, placeholder: '' },
        { name: 'pillar_3', label: 'Content pillar 3', type: 'text', required: true, placeholder: 'Another core theme...' },
        { name: 'pillar_3_description', label: 'What does this pillar cover?', type: 'textarea', required: false, placeholder: '' },
        { name: 'pillar_4', label: 'Content pillar 4 (optional)', type: 'text', required: false, placeholder: 'Optional fourth pillar...' },
        { name: 'pillar_4_description', label: 'What does this pillar cover?', type: 'textarea', required: false, placeholder: '' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'ai_prompt'],
    aiPrompt: 'Define 4-5 content pillar options for my brand. Core message: [your core message]. Audience: [customer avatar]. Talking points: [list your talking points]. Primary platform: [platform]. Product: [product name and promise].

For each pillar option: give it a specific name (not a broad category like "tips"), describe what posts would live inside it in 1-2 sentences, give 3 example post ideas to show what it looks like in practice, and explain how it connects to my product or audience.

Then recommend the 3-4 pillars that work best together as a system, and explain why this combination would build authority with my specific audience.',
    toolLinks: [],
    route: '/projects/:id/tasks/content_define_pillars',
  },

  {
    taskId: 'content_posting_rhythm',
    title: 'Set your posting rhythm',
    phase: 'content',
    funnelTypes: ['all'],
    order: 4,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: false,
    dependencies: ['content_define_pillars'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have committed to a specific posting frequency you can realistically sustain',
      'You know which days you will post and roughly what type of content each post will be',
    ],
    whyItMatters: 'The algorithm rewards consistency. One post per week published every week beats three posts in one week and then silence for two weeks — every time. Your posting rhythm should be determined by what you can sustain, not what sounds impressive. An honest slow rhythm is better than a burned-out fast one.',
    instructions: [
      'Choose a frequency based on your available time — not your aspirations',
      'For Instagram and TikTok: 3-5 times per week is strong, 1-2 times is acceptable, under 1 is not enough',
      'For LinkedIn: 2-3 times per week is strong, 1 time per week is acceptable',
      'For YouTube: 1 time per week is strong, twice a month is acceptable',
      'Decide your posting days and keep them — consistency in timing builds audience habit',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'posting_frequency', label: 'How often will you post?', type: 'select', required: true, placeholder: 'Select...', options: [ { value: '5_week', label: '5x per week' }, { value: '4_week', label: '4x per week' }, { value: '3_week', label: '3x per week' }, { value: '2_week', label: '2x per week' }, { value: '1_week', label: '1x per week' }, { value: '2_month', label: '2x per month' } ] },
        { name: 'posting_days', label: 'Which days will you post?', type: 'text', required: false, placeholder: 'e.g. Monday, Wednesday, Friday — or Tuesday and Thursday' },
        { name: 'batch_day', label: 'When will you batch-create content?', type: 'text', required: false, placeholder: 'e.g. Sunday afternoon, Tuesday mornings', helperText: 'Blocking one creation session per week beats creating every day.' },
      ],
    },
    aiAssistModes: ['simplify'],
    toolLinks: [],
    route: '/projects/:id/tasks/content_posting_rhythm',
  },

  {
    taskId: 'content_optimize_profiles',
    title: 'Optimize your profile for launch',
    phase: 'content',
    funnelTypes: ['all'],
    order: 5,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['content_choose_platform'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'Your profile on your primary platform has been updated with your new bio, profile photo, and link',
      'Your link in bio points to your sales page or an opt-in page',
      'Your pinned post or highlight is set up if applicable',
    ],
    whyItMatters: 'When your content starts getting traction, people will click to your profile. If your profile looks stale, inconsistent, or does not have a clear link — that traffic goes nowhere. Your profile is the bridge between someone seeing your content and becoming a lead or buyer. Optimizing it before you start posting means every piece of content you publish is working harder.',
    instructions: [
      'Update your profile photo — it should be clear, professional, and consistent with your brand',
      'Update your bio using the version you wrote in the Messaging phase',
      'Set your link in bio to your sales page URL',
      'On Instagram: set up Story Highlights if relevant — at minimum one for your product and one for testimonials',
      'On Instagram/TikTok: pin your best or most introductory post to the top of your profile',
      'On LinkedIn: update your banner image and headline',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'photo_updated', label: 'Profile photo updated', description: 'Clear, professional, recognizable — matches your other platforms' },
        { value: 'bio_updated', label: 'Bio updated with new messaging', description: 'Uses the bio you wrote in the Messaging phase — leads with audience, ends with CTA' },
        { value: 'link_updated', label: 'Link in bio points to sales page or opt-in', description: 'One click from profile lands them on a page that can convert them' },
        { value: 'pinned_post', label: 'Pinned or featured post set up', description: 'Best introductory or most-shared post pinned to top of profile' },
        { value: 'highlights_set', label: 'Story Highlights or featured sections set up', description: 'Instagram Highlights or LinkedIn featured section showing product and social proof (if applicable)' },
      ],
    },
    aiAssistModes: [],
    toolLinks: [],
    route: '/projects/:id/tasks/content_optimize_profiles',
  },

  {
    taskId: 'content_link_in_bio',
    title: 'Set up your link in bio page',
    phase: 'content',
    funnelTypes: ['all'],
    order: 6,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: false,
    dependencies: ['salespage_publish'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a link in bio page that routes traffic to your most important destinations',
      'Your sales page and email opt-in are both accessible from one link',
    ],
    whyItMatters: 'When you have one link in bio and two places to send people (your sales page and your email opt-in), you need a bridge page. SureContact has a built-in link page feature. This task sets it up so you can send all traffic to one link that routes to the right destination based on what they want.',
    instructions: [
      'In SureContact, go to Pages or Link in Bio and create a new page',
      'Add your most important links in order: (1) your product sales page, (2) your email opt-in or freebie, (3) any other relevant links',
      'Use your product name and a short description for each link — not generic labels like "click here"',
      'Add your profile photo and a one-line bio to the page so it feels like a real landing page',
      'Copy the link and update your social bio with it',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { name: 'link_page_url', label: 'Your SureContact link page URL', type: 'text', required: false, placeholder: 'e.g. your SureContact link page URL' },
        { name: 'link_page_status', label: 'Link page status', type: 'select', required: true, placeholder: 'Select...', options: [ { value: 'live', label: 'Live — set up and linked in my bio' }, { value: 'created_not_linked', label: 'Created — not yet added to bio' }, { value: 'not_started', label: 'Not started yet' }, { value: 'skipping', label: 'Skipping — linking directly to sales page for now' } ] },
      ],
    },
    aiAssistModes: ['simplify'],
    toolLinks: [
      { label: 'Open SureContact', url: 'https://app.surecontact.com', icon: 'mail' },
    ],
    route: '/projects/:id/tasks/content_link_in_bio',
  },

  {
    taskId: 'content_plan_30_days',
    title: 'Plan your first 30 days of content',
    phase: 'content',
    funnelTypes: ['all'],
    order: 7,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 45,
    blocking: true,
    dependencies: ['content_define_pillars', 'content_posting_rhythm'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a 30-day content plan with a post idea for each planned posting slot',
      'Each post maps back to one of your content pillars',
      'Your product is naturally woven into the plan without every post being a pitch',
    ],
    whyItMatters: 'Deciding what to post in the moment is the fastest way to either not post or post something off-brand. A 30-day plan removes the daily decision and lets you focus on execution. It also lets you see the arc of your content — whether it is building toward something or just filling space.',
    instructions: [
      'Use your posting rhythm to determine how many posts you need (e.g. 3x per week = 12-13 posts for 30 days)',
      'Rotate through your pillars so no pillar dominates',
      'For every 5 posts: 3-4 pure value, 1 soft mention of your product, 1 more direct product post',
      'Use the AI prompt to generate a full 30-day calendar with post ideas',
      'Review and adjust — remove any that feel off-brand or too similar to each other',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'content_plan',
          label: 'Your 30-day content plan',
          type: 'textarea',
          required: true,
          placeholder: 'Week 1:
Day 1 (Pillar: [pillar name]) — [Post idea]
Day 3 (Pillar: [pillar name]) — [Post idea]
Day 5 (Pillar: [pillar name]) — [Post idea]

Week 2:
...',
          helperText: 'Can be a rough list of post ideas organized by week — does not need to be perfectly formatted.',
        },
        {
          name: 'total_posts_planned',
          label: 'How many posts are in your 30-day plan?',
          type: 'text',
          required: false,
          placeholder: 'e.g. 12 posts, 16 posts',
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Create a 30-day content plan for my brand. Here are my details:

Primary platform: [platform]
Content model: [your content model]
Posting frequency: [e.g. 3x per week]
Content pillars: [list your pillars]
Core message: [your core message]
Transformation statement: [your transformation]
Product: [product name and promise]
Audience: [customer avatar]

Create a 30-day calendar with a specific post idea for each posting slot. For each post include: the pillar it belongs to, the post format (e.g. carousel, Reel, text post), a specific post angle or hook (not just a topic — the actual angle), and whether it is pure value, a soft mention of the product, or a direct offer post. Follow a 4:1 ratio — 4 value posts for every 1 product post. Make sure the calendar builds toward the product naturally without feeling like a 30-day advertisement.',
    exportable: true,
    toolLinks: [],
    route: '/projects/:id/tasks/content_plan_30_days',
  },

  {
    taskId: 'content_write_first_5',
    title: 'Write your first 5 posts',
    phase: 'content',
    funnelTypes: ['all'],
    order: 8,
    priority: 1,
    estimatedMinutesMin: 30,
    estimatedMinutesMax: 60,
    blocking: true,
    dependencies: ['content_plan_30_days'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have 5 complete, ready-to-publish posts written and saved',
      'Each post has a caption, relevant hashtags if applicable, and you know what visual to pair it with',
    ],
    whyItMatters: 'The gap between "I have a plan" and "I am actually posting" closes when you have posts written and ready. Having 5 posts finished before you publish the first one means you will never be starting from zero — there is always something ready when you need it. This is the task that moves content from an intention to a practice.',
    instructions: [
      'Pick the first 5 posts from your 30-day plan',
      'For each post: write the full caption, write the hook first (first 1-2 lines), keep it scannable with line breaks',
      'Use the AI prompt to draft each one — then edit to make it sound exactly like you',
      'For visual content (carousels, graphics): note what the visual should be — you do not have to make it now, just plan it',
      'Save all 5 to a Google Doc in your Content Strategy folder',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'posts_written',
          label: 'How many posts are written and ready?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: '5_ready', label: '5 posts — written, edited, and ready to publish' },
            { value: '3_4_ready', label: '3-4 posts — almost there' },
            { value: '1_2_ready', label: '1-2 posts — just started' },
            { value: 'none', label: 'None yet — still working on it' },
          ],
        },
        {
          name: 'posts_doc_link',
          label: 'Google Doc link for your posts (optional)',
          type: 'text',
          required: false,
          placeholder: 'Paste your Google Doc URL here',
          helperText: 'Save all posts in one doc so they are easy to access when you schedule.',
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Write a social media post for me. Platform: [platform]. Post type: [e.g. educational carousel, Reel script, text post]. Pillar: [pillar name]. Post angle from my 30-day plan: [specific angle or hook from your plan].

Details to include:
- Audience: [avatar name]
- Core message: [your core message]
- Brand voice: [your voice description]
- Product to mention (if applicable): [product name and promise]

Write:
1. A strong hook (first 1-2 lines that make someone stop scrolling)
2. The full caption with line breaks for readability
3. 3-5 relevant hashtags if applicable
4. A brief note on what visual to pair with this post

Make it sound like [describe your voice — e.g. direct, warm, no-nonsense]. No marketing jargon. No exclamation point inflation.',
    toolLinks: [
      { label: 'Open Google Drive', url: 'https://drive.google.com', icon: 'folder' },
    ],
    route: '/projects/:id/tasks/content_write_first_5',
  },

  {
    taskId: 'content_workflow',
    title: 'Set up your content creation workflow',
    phase: 'content',
    funnelTypes: ['all'],
    order: 9,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: false,
    dependencies: ['content_write_first_5'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a clear, documented process for creating one week of content in a single batch session',
      'You know what tools you use, in what order, and roughly how long each step takes',
    ],
    whyItMatters: 'Content creation feels hard when it is unstructured — a different process every time, figuring out tools as you go, spending 3 hours on what should take 45 minutes. A documented workflow turns content creation into a repeatable process. Once it is written down, it gets faster every time you do it.',
    instructions: [
      'Write out the steps you go through to create one post — from idea to published',
      'Note the tools you use at each step',
      'Estimate how long each step takes',
      'Identify any steps you could batch (e.g. write all captions in one session, create all visuals in another)',
      'Decide your creation day and block it on your calendar',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'workflow_steps',
          label: 'Your content creation workflow',
          type: 'textarea',
          required: false,
          placeholder: 'Step 1: Review 30-day plan and pick this week's posts (10 min)
Step 2: Draft captions with Claude using the post prompts (20 min)
Step 3: Edit captions and add my voice (15 min)
Step 4: Create visuals in Canva or Claude image gen (20 min)
Step 5: Schedule in [scheduling tool] (10 min)
Total: ~75 minutes per week',
          helperText: 'Even a rough outline is better than no process.',
        },
        {
          name: 'creation_day',
          label: 'Your weekly content creation day and time',
          type: 'text',
          required: false,
          placeholder: 'e.g. Sunday 2pm — 1 hour batch session',
        },
        {
          name: 'tools_used',
          label: 'Tools you use to create and publish content',
          type: 'text',
          required: false,
          placeholder: 'e.g. Claude (captions), Canva (visuals), Later (scheduling), Google Docs (drafts)',
        },
      ],
    },
    aiAssistModes: ['simplify', 'ai_prompt'],
    aiPrompt: 'Help me design a content creation workflow. Platform: [platform]. Posting frequency: [e.g. 3x per week]. Content types I create: [e.g. carousels, Reels, text posts]. Tools I have: Claude, Canva, Google Docs, [any scheduling tool].

Design a weekly batch workflow that: (1) takes no more than 90 minutes total per week for my posting frequency, (2) batches similar tasks together (all writing in one session, all visual creation in another), (3) results in a week of content ready to schedule at the end of the session. Include specific time estimates for each step and a checklist format I can reuse every week.',
    toolLinks: [],
    route: '/projects/:id/tasks/content_workflow',
  },

  {
    taskId: 'content_brain_update',
    title: 'Add your content strategy to your business brain',
    phase: 'content',
    funnelTypes: ['all'],
    order: 10,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: false,
    dependencies: ['content_define_pillars', 'content_plan_30_days'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'Your content strategy is saved to Google Drive (Content Strategy folder)',
      'Your Claude Project knows your pillars, content model, platform, and posting rhythm',
    ],
    whyItMatters: 'Every post you ask Claude to write from now on should know your content pillars, your posting platform, your content model, and your voice. Adding the content strategy to your Claude Project means Claude can generate on-brand, on-pillar content with a single short prompt instead of requiring full context every time.',
    instructions: [
      'Save your 30-day content plan and first 5 posts to the Content Strategy folder in Google Drive',
      'Paste the brain update prompt below into your Claude Project with your content details filled in',
      'Test it: ask Claude to write a post for Pillar 1 in your brand voice — it should be specific, not generic',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'brain_updated',
          label: 'Have you added your content strategy to your Claude Project?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'yes_both', label: 'Yes — saved to Google Drive and added to Claude Project' },
            { value: 'yes_claude_only', label: 'Yes — added to Claude Project only' },
            { value: 'not_yet', label: 'Not yet' },
          ],
        },
      ],
    },
    aiAssistModes: [],
    toolLinks: [
      { label: 'Open Google Drive', url: 'https://drive.google.com', icon: 'folder' },
      { label: 'Open Claude Projects', url: 'https://claude.ai', icon: 'brain' },
    ],
    route: '/projects/:id/tasks/content_brain_update',
    brainUpdatePrompt: 'Add my content strategy to my business brain.

Primary platform: [platform]
Content model: [your content model]
Posting frequency: [frequency and days]

Content pillars:
1. [pillar 1 — name and description]
2. [pillar 2 — name and description]
3. [pillar 3 — name and description]
4. [pillar 4 if applicable]

Post ratio: [e.g. 4 value posts for every 1 product post]

When I ask you to write a social media post, email, or content piece: (1) use the relevant content pillar as the frame, (2) write in my brand voice (described in the messaging section above), (3) match the format and length for [platform], (4) include a natural connection to my product where appropriate without making every post a pitch.',
  },



  // ============================================================
  // PHASE 7 — LAUNCH (pre-launch + launch phases)
  // "You have a product, a site, an email list, and content.
  //  Now you tell people."
  // 8 tasks split across pre-launch (orders 1-3) and launch
  // (orders 1-5). Pre-launch warms the audience and finalizes
  // everything. Launch is the open cart window.
  // ============================================================

  {
    taskId: 'launch_choose_type',
    title: 'Choose your launch type',
    phase: 'pre-launch',
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
      'You have selected one launch type and understand what it requires',
      'You have a clear open and close date for your launch window',
    ],
    whyItMatters: 'A launch is not just "I posted about my product." A launch is a defined window with a beginning, a middle, and an end — and that structure is what creates urgency, drives decisions, and generates revenue in a concentrated period. Choosing your launch type before you write a word of launch content ensures everything you create is pointing toward the same moment.',
    instructions: [
      'Read each option and pick the one that fits your situation, your audience size, and your timeline',
      'If this is your first launch or your list is small — a Simple Open Window is the right call',
      'If you have an existing warm audience and want momentum — a Waitlist Launch adds urgency',
      'Set your open date and close date before moving to the next task',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        {
          value: 'simple_window',
          label: 'Simple Open Window',
          description: 'You announce the product, it is available to buy for 5-7 days, then the cart closes. Clean, low-pressure, works for any audience size. Best for first launches.',
        },
        {
          value: 'waitlist',
          label: 'Waitlist Launch',
          description: 'You collect interest before the product is available. Waitlist subscribers get early access and/or a discount. Builds anticipation and creates a warm list of buyers before the cart opens.',
        },
        {
          value: 'challenge_launch',
          label: 'Challenge Launch',
          description: 'A 3-5 day free challenge leads into an open cart. High engagement, high visibility, higher workload. Best when you have an engaged community and can facilitate daily content.',
        },
        {
          value: 'evergreen',
          label: 'Evergreen (Always Open)',
          description: 'The product is available at any time with no close date. Lower urgency but zero launch pressure. Best for products with consistent ongoing demand and strong SEO or ad traffic.',
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Help me choose the right launch type for my situation. Product: [product name and promise]. Price: [price]. Current email list size: [number]. Current social following on primary platform: [number]. Available time to run the launch: [e.g. 2 hours per day for a week, 30 minutes per day]. Have I launched anything before: [yes/no]. Goal for this launch: [e.g. first 10 buyers, $500 in revenue, validate the product].\n\nFor each launch type (Simple Open Window, Waitlist Launch, Challenge Launch, Evergreen), tell me: how it works for my specific audience size, what the realistic outcome looks like, what it requires from me in terms of time and content, and whether it is appropriate for a first launch. Then give me a clear recommendation.',
    toolLinks: [],
    route: '/projects/:id/tasks/launch_choose_type',
  },

  {
    taskId: 'launch_plan_window',
    title: 'Set your launch dates and warm-up plan',
    phase: 'pre-launch',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: ['launch_choose_type'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a specific open date, close date, and warm-up start date',
      'You have a rough plan for the 7-14 days of content before the cart opens',
    ],
    whyItMatters: 'The best launch copy in the world underperforms when the audience is cold. The two weeks before your cart opens are where the real work happens — your content is priming your audience for what is coming, building anticipation, and making the buy decision feel obvious before you ever say "cart is open." Warm-up content is the difference between crickets and momentum.',
    instructions: [
      'Work backward from your desired launch open date — plan at least 7 days of warm-up content before it',
      '14 days of warm-up is better if your audience is small or has not heard from you in a while',
      'Warm-up content is not teasers — it is value-first content that naturally points toward the problem your product solves',
      'Mark the open date, close date, and any mid-launch urgency points (e.g. price increase day, last day reminder) in your calendar',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'warmup_start_date',
          label: 'Warm-up content start date',
          type: 'text',
          required: true,
          placeholder: 'e.g. Monday June 16',
        },
        {
          name: 'cart_open_date',
          label: 'Cart open date (launch day)',
          type: 'text',
          required: true,
          placeholder: 'e.g. Monday June 23',
        },
        {
          name: 'cart_close_date',
          label: 'Cart close date',
          type: 'text',
          required: true,
          placeholder: 'e.g. Sunday June 29',
          helperText: '5-7 days is the standard window. Shorter for urgency, longer for bigger audiences.',
        },
        {
          name: 'warmup_plan',
          label: 'Your warm-up content plan (rough)',
          type: 'textarea',
          required: false,
          placeholder: 'Week 1 warm-up:\n- Day 1: Post about the problem [product] solves\n- Day 2: Email to list — a tip that connects to the product\n- Day 3: Behind-the-scenes of building the product\n- Day 5: Success story or result relevant to the problem\n...',
          helperText: 'Does not need to be detailed — a post topic per day is enough for now.',
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Create a 14-day launch warm-up plan for my product launch. Product: [product name and promise]. Launch open date: [date]. Primary platform: [platform]. Email list: [yes/no and rough size]. Content pillars: [your pillars].\n\nCreate a day-by-day warm-up calendar for the 14 days before my cart opens. For each day include: the content format (social post, email, or both), the specific angle or topic, how it connects to the problem my product solves without being a direct pitch. Follow a natural arc that builds awareness, desire, and anticipation over the two weeks — ending the day before launch with an audience that already wants what I am about to offer.',
    toolLinks: [],
    route: '/projects/:id/tasks/launch_plan_window',
  },

  {
    taskId: 'launch_final_checklist',
    title: 'Run your pre-launch checklist',
    phase: 'pre-launch',
    funnelTypes: ['all'],
    order: 3,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 40,
    blocking: true,
    dependencies: ['launch_plan_window'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Every item on the pre-launch checklist is confirmed working',
      'You have nothing to fix after the cart opens',
    ],
    whyItMatters: 'Launch day is not the time to discover your payment link is broken, your delivery email is going to spam, or your sales page has a typo in the price. This checklist is the final quality pass before real money is involved. Five minutes on each item here saves hours of firefighting during your launch window.',
    instructions: [
      'Go through each checklist item methodically — do not skip items because you think they are probably fine',
      'Use a different device or browser for testing where possible — what works on your computer may not work on someone else\'s phone',
      'Fix anything that is not working before you move forward',
      'If you find a significant issue, fix it now — do not launch with known problems',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'sales_page_live', label: 'Sales page is live at the correct URL', description: 'Loaded it on mobile and desktop — all sections present, no broken images, price is correct' },
        { value: 'payment_tested', label: 'Payment flow works end-to-end', description: 'Ran a Stripe test purchase — confirmation page loads, receipt email arrives' },
        { value: 'delivery_works', label: 'Product delivery is confirmed', description: 'Buyer receives the product after purchase — download link works or access page loads' },
        { value: 'welcome_sequence_active', label: 'Welcome sequence automation is active', description: 'Opted in with a test email — received Email 1 within 5 minutes, landed in inbox not spam' },
        { value: 'announcement_email_ready', label: 'Launch announcement email is written and staged', description: 'Written, reviewed, loaded into SureContact as a draft ready to send' },
        { value: 'social_posts_ready', label: 'Launch social posts are written and scheduled', description: 'At minimum 3 posts written — one for launch day, one for mid-launch, one for last day' },
        { value: 'link_in_bio_updated', label: 'Link in bio points to sales page', description: 'During the launch window, link in bio goes directly to the sales page — not a link tree' },
        { value: 'stripe_live_mode', label: 'Stripe is in live mode (not test mode)', description: 'Switched Stripe from test mode to live mode — real payments will now be processed' },
      ],
    },
    aiAssistModes: [],
    toolLinks: [
      { label: 'Open Stripe Dashboard', url: 'https://dashboard.stripe.com', icon: 'credit-card' },
      { label: 'Open SureContact', url: 'https://app.surecontact.com', icon: 'mail' },
    ],
    route: '/projects/:id/tasks/launch_final_checklist',
  },

  {
    taskId: 'launch_go_live',
    title: 'Launch — send the announcement',
    phase: 'launch',
    funnelTypes: ['all'],
    order: 1,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['launch_final_checklist'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your launch announcement email has been sent to your list',
      'Your launch day social post has been published',
      'Your sales page is live and accepting real purchases',
    ],
    whyItMatters: 'All the planning, building, and writing leads to this single action. The announcement email goes to your list. The social post goes live. The cart is open. This is where the business becomes real. Do not overthink it. Send the email. Post the post. Then step away for a few hours.',
    instructions: [
      'Send your launch announcement email from SureContact — use the draft you staged in the pre-launch checklist',
      'Publish your launch day social post immediately after — or schedule it to go live at the same time',
      'Confirm your sales page is loading correctly at the live URL',
      'Note the time and date you launched — this is your business history',
      'Then step away. Refreshing your analytics every 5 minutes helps no one. Let it run.',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'launch_status',
          label: 'Have you launched?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'launched', label: 'Yes — email sent, post published, cart is open' },
            { value: 'email_sent_post_pending', label: 'Email sent — social post going up shortly' },
            { value: 'launching_now', label: 'In the process of launching right now' },
            { value: 'not_yet', label: 'Not yet — still preparing' },
          ],
        },
        {
          name: 'launch_datetime',
          label: 'Date and time you launched',
          type: 'text',
          required: false,
          placeholder: 'e.g. Monday June 23, 9:00am',
          helperText: 'Document this — it is the start of your business history.',
        },
        {
          name: 'first_sale',
          label: 'Did you get your first sale? (update after)',
          type: 'select',
          required: false,
          placeholder: 'Select...',
          options: [
            { value: 'yes', label: 'Yes — first sale confirmed' },
            { value: 'not_yet', label: 'Not yet — launch is running' },
          ],
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Write my launch day social post. Product: [product name and promise]. Price: [price]. Sales page URL: [URL]. Launch close date: [date]. Platform: [platform].\n\nThis is the post that goes live on launch day — the moment the cart opens. Write it with: a hook that creates immediate curiosity or signals something new, a clear description of what the product is and who it is for, the price and how long the cart is open, a direct link to the sales page. Brand voice: [your voice description]. Length: appropriate for [platform]. No hype. No exclamation point inflation. Make it feel like an announcement from a real person, not a promotional broadcast.',
    toolLinks: [
      { label: 'Open SureContact', url: 'https://app.surecontact.com', icon: 'mail' },
    ],
    route: '/projects/:id/tasks/launch_go_live',
  },

  {
    taskId: 'launch_mid_launch_push',
    title: 'Send your mid-launch content',
    phase: 'launch',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 35,
    blocking: false,
    dependencies: ['launch_go_live'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have sent at least one mid-launch email and published at least one mid-launch social post',
      'The content addresses objections or adds social proof — it is not just "cart is still open"',
    ],
    whyItMatters: 'Most people who buy during a launch window do not buy on day one. They see it, they think about it, they wait. The mid-launch content is what nudges the fence-sitters. A well-timed email that answers the main objection or shares a relevant result can generate as many sales as launch day itself.',
    instructions: [
      'Send one email to your list during the middle of the launch window (day 3 of a 5-day window, or day 4 of a 7-day window)',
      'This email should: acknowledge they have seen the announcement, address the most common objection, share any relevant result or feedback if you have received any',
      'Publish 1-2 social posts that reinforce the value — not just reminders, but content that adds something new',
      'If you have received any purchases or positive responses, share them (with permission) — social proof mid-launch is powerful',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'mid_launch_email_sent',
          label: 'Mid-launch email sent?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'yes', label: 'Yes — sent' },
            { value: 'no', label: 'No — skipped or not yet sent' },
          ],
        },
        {
          name: 'mid_launch_posts',
          label: 'Mid-launch social posts published?',
          type: 'select',
          required: false,
          placeholder: 'Select...',
          options: [
            { value: 'yes', label: 'Yes — published' },
            { value: 'scheduled', label: 'Scheduled — will publish automatically' },
            { value: 'no', label: 'Not yet' },
          ],
        },
        {
          name: 'sales_so_far',
          label: 'Sales so far during the launch window',
          type: 'text',
          required: false,
          placeholder: 'e.g. 3 sales, $141 revenue — update as you go',
          helperText: 'Tracking this helps you understand which content drove purchases.',
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Write my mid-launch email. Product: [product name]. Launch close date: [date]. Main objection my audience has: [biggest objection from Phase 5]. Any results or feedback received so far: [if any — otherwise skip]. Sales page URL: [URL].\n\nThis email goes to everyone on my list who has not purchased yet. It should: acknowledge they have seen the launch (do not pretend it is new news), address the main objection directly and honestly, add something new — a perspective, a reminder of what they get, a relevant result — that was not in the announcement email, end with one clear CTA and the close date. Length: short — 4-6 paragraphs. Tone: [your brand voice]. Write the full email ready to send.',
    toolLinks: [
      { label: 'Open SureContact', url: 'https://app.surecontact.com', icon: 'mail' },
    ],
    route: '/projects/:id/tasks/launch_mid_launch_push',
  },

  {
    taskId: 'launch_close',
    title: 'Send your cart close sequence',
    phase: 'launch',
    funnelTypes: ['all'],
    order: 3,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 35,
    blocking: false,
    dependencies: ['launch_mid_launch_push'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have sent a last-day or last-hours reminder email',
      'Your social content on close day reminds your audience the cart is closing',
      'You have closed the cart at the time you committed to',
    ],
    whyItMatters: 'The close is not optional. Urgency only works when it is real — when you say the cart closes Friday at midnight, and it actually closes Friday at midnight. The final day of a launch typically generates as many sales as the opening day. The last-day email is not aggressive — it is a respectful reminder that the window is closing and a genuine invitation to act.',
    instructions: [
      'Send a last-day email the morning of the close date — subject line should clearly signal it is the last day',
      'Send a final hours email in the afternoon if your audience size justifies it (100+ subscribers)',
      'Publish a close day social post — make it personal, not pushy',
      'At the committed close time: switch your sales page to a waitlist or closed state, and remove the buy button if possible',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'close_email_sent',
          label: 'Last day email sent?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'yes', label: 'Yes — sent' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'not_yet', label: 'Not yet' },
          ],
        },
        {
          name: 'cart_closed',
          label: 'Did you close the cart at the committed time?',
          type: 'select',
          required: false,
          placeholder: 'Select...',
          options: [
            { value: 'yes', label: 'Yes — cart closed on time' },
            { value: 'extended', label: 'Extended — kept it open longer than planned' },
            { value: 'not_yet', label: 'Close date has not arrived yet' },
          ],
        },
        {
          name: 'final_sales',
          label: 'Total sales from this launch',
          type: 'text',
          required: false,
          placeholder: 'e.g. 7 sales, $329 revenue',
          helperText: 'Log this here — your Phase 8 review task uses this number.',
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Write my cart close email. Product: [product name]. Close date and time: [date/time]. Sales page URL: [URL]. Any final reason to act now (e.g. price going up after close, product going offline): [if applicable — otherwise just the deadline].\n\nThis is the last email before the cart closes. It should: be honest and direct — no manufactured urgency beyond the real deadline, remind them clearly what they get, state the exact close time, give them one final reason to act now if there is a genuine one, end with one link. Subject line should clearly say it is the last day. Length: short — 3-4 paragraphs. Tone: [your brand voice]. Write the full email.',
    toolLinks: [
      { label: 'Open SureContact', url: 'https://app.surecontact.com', icon: 'mail' },
      { label: 'Open Stripe Dashboard', url: 'https://dashboard.stripe.com', icon: 'credit-card' },
    ],
    route: '/projects/:id/tasks/launch_close',
  },

  {
    taskId: 'launch_monitor',
    title: 'Monitor and respond during the launch',
    phase: 'launch',
    funnelTypes: ['all'],
    order: 4,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['launch_go_live'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have checked your DMs, comments, and email replies during the launch window',
      'You have responded to every question or objection raised during the launch',
    ],
    whyItMatters: 'During a live launch, conversations close sales. Someone who DMs "is this right for me?" is one sentence away from buying. Someone who comments a question publicly is asking on behalf of everyone who was thinking the same thing. Responding promptly and specifically during the launch window is one of the highest-leverage things you can do — more than posting more content.',
    instructions: [
      'Check your DMs on your primary platform at least twice per day during the launch window',
      'Check replies to your launch emails — SureContact shows reply rates',
      'Respond to every question or comment publicly when possible — other potential buyers see your answers',
      'Use the AI prompt to help you craft responses to common objections if you get stuck',
      'Log the most common questions — they become your FAQ or future content',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'common_questions',
          label: 'What questions or objections came up most during the launch?',
          type: 'textarea',
          required: false,
          placeholder: 'e.g. "Does this work for service businesses?", "Is there a payment plan?", "How long will it take to see results?"...',
          helperText: 'Log these here — they are valuable for future launches and FAQ content.',
        },
        {
          name: 'conversations_had',
          label: 'Did you have any launch conversations (DMs, comments, email replies) that led to sales?',
          type: 'select',
          required: false,
          placeholder: 'Select...',
          options: [
            { value: 'yes', label: 'Yes — had conversations that directly led to purchases' },
            { value: 'conversations_no_sales', label: 'Had conversations but they did not convert' },
            { value: 'no_conversations', label: 'No inbound questions or conversations during launch' },
          ],
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Help me write a response to a launch objection I received. The objection is: [paste the exact message or question]. My product: [product name and promise]. Price: [price]. Audience: [avatar].\n\nWrite a response that: acknowledges their concern without being defensive, provides a specific honest answer, keeps it conversational — not a sales pitch, ends with a gentle invitation to buy or ask another question. Keep it short — 3-5 sentences. Match my brand voice: [your voice description].',
    toolLinks: [],
    route: '/projects/:id/tasks/launch_monitor',
  },

  {
    taskId: 'launch_post_close',
    title: 'Close the launch and capture the data',
    phase: 'launch',
    funnelTypes: ['all'],
    order: 5,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: false,
    dependencies: ['launch_close'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You know your total sales, revenue, and list size at the end of the launch',
      'You have noted what worked, what did not, and what you would change',
      'You have thanked your buyers',
    ],
    whyItMatters: 'The data from your first launch is more valuable than the revenue. It tells you which content drove sales, which objection came up most, how your list converted, and what to do differently next time. Capturing it now — while it is fresh — means your second launch will be materially better than the first.',
    instructions: [
      'Pull your final numbers from Stripe and SureContact',
      'Note what content drove the most engagement and any DMs or conversations that converted',
      'Send a personal thank you to every buyer — a simple email from your SureContact account, not automated',
      'Update your sales page: either close it, add a waitlist, or switch to evergreen if that is the plan',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'total_sales',
          label: 'Total units sold',
          type: 'text',
          required: false,
          placeholder: 'e.g. 7',
        },
        {
          name: 'total_revenue',
          label: 'Total revenue',
          type: 'text',
          required: false,
          placeholder: 'e.g. $329',
        },
        {
          name: 'list_size_at_close',
          label: 'Email list size at close',
          type: 'text',
          required: false,
          placeholder: 'e.g. 84 subscribers',
        },
        {
          name: 'what_worked',
          label: 'What content or action drove the most response?',
          type: 'textarea',
          required: false,
          placeholder: 'e.g. The mid-launch email with the objection answer got 3 replies and 2 purchases. The last day post got the most engagement of the launch...',
        },
        {
          name: 'what_to_change',
          label: 'What would you do differently next launch?',
          type: 'textarea',
          required: false,
          placeholder: 'e.g. Start warm-up content 2 weeks earlier, have more social proof ready, set up a proper waitlist before the window opens...',
          helperText: 'This becomes your brief for your next launch.',
        },
        {
          name: 'buyers_thanked',
          label: 'Have you personally thanked your buyers?',
          type: 'select',
          required: false,
          placeholder: 'Select...',
          options: [
            { value: 'yes', label: 'Yes — sent a personal thank you to each buyer' },
            { value: 'not_yet', label: 'Not yet' },
          ],
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Write a personal thank you email for my buyers. Product: [product name]. My name: [your name]. What they purchased: [what they now have access to]. One thing I want them to know going into using it: [your key advice for getting value from the product quickly]. Brand voice: [your voice].\n\nThis is a short, personal email — not a confirmation receipt. 3-4 sentences. It should feel like a real person wrote it, not a marketing sequence. Warm, genuine, and brief. No upsell. No next steps list. Just a real thank you and one useful thing to help them get started.',
    toolLinks: [
      { label: 'Open Stripe Dashboard', url: 'https://dashboard.stripe.com', icon: 'credit-card' },
      { label: 'Open SureContact', url: 'https://app.surecontact.com', icon: 'mail' },
    ],
    route: '/projects/:id/tasks/launch_post_close',
  },

  // ============================================================
  // PHASE 8 — POST-LAUNCH & GROWTH (post-launch phase, orders 1-10)
  // "The launch was the start. Now you build the machine."
  // 10 tasks. Covers buyer experience, testimonials, numbers
  // review, evergreen funnel setup, content continuation,
  // and the decision about what comes next.
  // ============================================================

  {
    taskId: 'postlaunch_confirm_access',
    title: 'Confirm every buyer has access',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 1,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: true,
    dependencies: [],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have confirmed every buyer has successfully received their product',
      'Any delivery issues have been resolved',
    ],
    whyItMatters: 'The window between purchase and delivery is when refund requests happen. A buyer who gets the product quickly and easily never questions the purchase. A buyer who has to chase it down loses trust fast. This task closes the loop so no one falls through.',
    instructions: [
      'Pull your buyer list from Stripe — confirm each transaction has a corresponding delivery',
      'Cross-reference with your SureContact list — every buyer should have received the post-purchase email with their download or access link',
      'If anyone is missing: send them the product link directly with a personal note',
      'Check that the download link or access page still works for every product format you delivered',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'access_confirmed',
          label: 'Have all buyers received their product?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'yes_all', label: 'Yes — all buyers confirmed with access' },
            { value: 'issue_resolved', label: 'Found an issue and resolved it' },
            { value: 'still_checking', label: 'Still checking' },
          ],
        },
        {
          name: 'issues_found',
          label: 'Any delivery issues found?',
          type: 'textarea',
          required: false,
          placeholder: 'e.g. One buyer did not receive the email — resent manually. Download link was broken — fixed and reshared.',
          helperText: 'Documenting issues helps you prevent them on the next launch.',
        },
      ],
    },
    aiAssistModes: [],
    toolLinks: [
      { label: 'Open Stripe Dashboard', url: 'https://dashboard.stripe.com', icon: 'credit-card' },
      { label: 'Open SureContact', url: 'https://app.surecontact.com', icon: 'mail' },
    ],
    route: '/projects/:id/tasks/postlaunch_confirm_access',
  },

  {
    taskId: 'postlaunch_collect_testimonials',
    title: 'Collect testimonials from buyers',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['postlaunch_confirm_access'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have sent a testimonial request to every buyer',
      'You have at least one written testimonial or result you can use in future marketing',
    ],
    whyItMatters: 'Social proof is the most persuasive element on any sales page — and it is the one thing you can only get after you have sold something. Your first testimonials, even small and early, are worth more than any copy you write about your product. Collecting them now means your next launch already has proof. Waiting means it never gets done.',
    instructions: [
      'Send a testimonial request email to all buyers 5-7 days after the launch — enough time for them to have started using the product',
      'Make the request easy: ask 2-3 specific questions instead of "would you write a review?"',
      'Specific questions get specific answers: "What was your biggest frustration before buying?" and "What has changed or what are you now able to do?" produce usable testimonials',
      'For anyone who responds enthusiastically: ask if they would be willing to do a short written testimonial you can use publicly',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'request_sent',
          label: 'Have you sent the testimonial request?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'yes', label: 'Yes — sent to all buyers' },
            { value: 'partial', label: 'Sent to some buyers' },
            { value: 'not_yet', label: 'Not yet — sending soon' },
          ],
        },
        {
          name: 'testimonials_received',
          label: 'Paste any testimonials you have received',
          type: 'textarea',
          required: false,
          placeholder: 'Paste testimonials here with the buyer\'s name (or first name and last initial) and any relevant context...',
          helperText: 'Save these here and in your Google Drive so they are ready for your next sales page.',
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Write a testimonial request email to my buyers. Product: [product name]. Days since launch: [number]. My name: [your name]. What I want to learn: how they felt before buying, whether they have used it yet, any early result or feeling.\n\nWrite a short, personal email that: opens warmly — not a form-letter opener, explains why I am asking (to help me improve and to help future buyers make a decision), asks 3 specific questions instead of a vague review request, makes it clear there is no obligation and any answer helps, ends with genuine appreciation. Length: short. Tone: [your brand voice].\n\nInclude the 3 questions in the email body so they can reply directly without going to a form.',
    toolLinks: [],
    route: '/projects/:id/tasks/postlaunch_collect_testimonials',
  },

  {
    taskId: 'postlaunch_review_numbers',
    title: 'Review your launch numbers',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 3,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['postlaunch_confirm_access'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You know your conversion rate, revenue, and list growth from this launch',
      'You have identified the one thing that most limited your result',
    ],
    whyItMatters: 'The numbers from your first launch tell you exactly where to focus next. Low sales from a small list means the priority is audience growth. Low sales from a decent list means the priority is conversion — offer positioning, objection handling, or sales page copy. You cannot improve what you do not measure.',
    instructions: [
      'Pull the numbers from Stripe and SureContact',
      'Calculate your conversion rate: sales divided by list size = percentage of your list that bought',
      'A conversion rate of 1-3% on a first launch to a warm list is normal',
      'Under 1% usually means a positioning or trust gap. Over 3% means you have a strong offer and should scale the audience.',
      'Identify the single biggest lever: more audience, better conversion, higher price, or more products',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'total_sales',
          label: 'Total sales',
          type: 'text',
          required: false,
          placeholder: 'e.g. 7 sales',
        },
        {
          name: 'total_revenue',
          label: 'Total revenue',
          type: 'text',
          required: false,
          placeholder: 'e.g. $329',
        },
        {
          name: 'list_size',
          label: 'Email list size at launch',
          type: 'text',
          required: false,
          placeholder: 'e.g. 84 subscribers',
        },
        {
          name: 'conversion_rate',
          label: 'Conversion rate (sales / list size)',
          type: 'text',
          required: false,
          placeholder: 'e.g. 8.3% (7 out of 84)',
          helperText: 'Sales ÷ list size × 100 = conversion rate percentage.',
        },
        {
          name: 'new_subscribers',
          label: 'New email subscribers during the launch window',
          type: 'text',
          required: false,
          placeholder: 'e.g. 23 new subscribers',
        },
        {
          name: 'biggest_lever',
          label: 'What is the single biggest lever for your next launch?',
          type: 'select',
          required: false,
          placeholder: 'Select...',
          options: [
            { value: 'audience_growth', label: 'Audience growth — my list is too small, need more people to sell to' },
            { value: 'conversion', label: 'Conversion — my offer or positioning needs to be sharper' },
            { value: 'price', label: 'Pricing — I may be underpriced for the value I deliver' },
            { value: 'more_products', label: 'More offers — one product limits total revenue per customer' },
            { value: 'launch_execution', label: 'Launch execution — I did not email or post enough during the window' },
          ],
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Analyze my launch results and tell me what to focus on next. Here are my numbers: Total sales: [number]. Revenue: [amount]. List size at launch: [number]. Conversion rate: [percentage]. New subscribers during launch: [number]. What worked: [your notes]. What I would change: [your notes].\n\nGive me: (1) an honest assessment of these numbers for a first launch — is this strong, average, or below average for my situation? (2) the single most important lever to pull for the next launch based on these numbers, (3) 3 specific actions I can take before my next launch to improve the result, (4) a revenue projection for what the same launch could look like if I doubled my list size.',
    toolLinks: [],
    route: '/projects/:id/tasks/postlaunch_review_numbers',
  },

  {
    taskId: 'postlaunch_add_testimonials',
    title: 'Add testimonials to your sales page',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 4,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: false,
    dependencies: ['postlaunch_collect_testimonials'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'At least one testimonial or result is now on your sales page',
    ],
    whyItMatters: 'Your sales page launched without testimonials because you did not have any yet. Now you do. Adding real social proof to the results section of your sales page immediately increases conversions for every future visitor. This is a one-time Lovable edit that compounds indefinitely.',
    instructions: [
      'Take the testimonials you collected and format them for your sales page — name, result, and their words',
      'Open Lovable and prompt it to update the results section with your testimonials',
      'Add at minimum: the buyer\'s first name (or first name + last initial), the specific outcome or feeling they described',
      'A screenshot of a DM or email is often more convincing than a polished quote — include both if you have them',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'testimonials_added',
          label: 'Have you added testimonials to your sales page?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'yes', label: 'Yes — sales page updated with testimonials' },
            { value: 'not_enough', label: 'Not yet — waiting for more testimonials to come in' },
            { value: 'no_testimonials', label: 'No testimonials received yet' },
          ],
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Write me a Lovable prompt to update the results/testimonials section of my sales page. Here are the testimonials I have received:\n\n[paste your testimonials]\n\nMy sales page URL: [URL]. My brand style: [colors and visual direction].\n\nWrite a Lovable prompt that: adds these testimonials to the results section, formats them clearly with the buyer name and their key result highlighted, keeps the design consistent with the existing page, and requests a screenshot-style card layout if appropriate for the format. Keep the original copy in the section — just add testimonials above or below the existing content.',
    toolLinks: [
      { label: 'Open Lovable', url: 'https://lovable.dev', icon: 'external-link' },
    ],
    route: '/projects/:id/tasks/postlaunch_add_testimonials',
  },

  {
    taskId: 'postlaunch_evergreen_funnel',
    title: 'Set up your evergreen funnel',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 5,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 40,
    blocking: false,
    dependencies: ['postlaunch_review_numbers'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'Your product is available for purchase at any time via your sales page',
      'New subscribers automatically receive your welcome sequence followed by a soft product offer',
    ],
    whyItMatters: 'A launch creates a burst of revenue in a defined window. An evergreen funnel creates a slow, consistent drip of revenue every time someone joins your list. The combination — launches for spikes, evergreen for the baseline — is what makes a digital product business sustainable. Setting up the evergreen funnel after your first launch means you earn from every person who discovers you between launches.',
    instructions: [
      'Your sales page is already live — the evergreen funnel just means keeping the buy button active after the launch closes',
      'In SureContact, add one product-focused email to the end of your welcome sequence — 5-7 days after the last welcome email',
      'This email introduces your product naturally: a relevant result, a connection to their problem, and one link',
      'This is not a hard sell — it is a natural next step for someone who has been receiving value from your welcome sequence',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'evergreen_status',
          label: 'Evergreen funnel status',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'full_setup', label: 'Set up — sales page live, product email added to welcome sequence' },
            { value: 'page_live_no_email', label: 'Sales page is live but no product email in welcome sequence yet' },
            { value: 'not_yet', label: 'Not set up yet' },
            { value: 'launch_only', label: 'Keeping as launch-only for now — not going evergreen' },
          ],
        },
        {
          name: 'product_email_day',
          label: 'What day in the welcome sequence does the product email send?',
          type: 'text',
          required: false,
          placeholder: 'e.g. Day 7 — after 3 value emails and a 4-day gap',
          helperText: 'Day 5-7 is typical — enough time to establish trust before mentioning the product.',
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Write the evergreen product email for my welcome sequence. This email goes out 5-7 days after the last welcome email. Product: [product name and promise]. Price: [price]. Sales page URL: [URL]. What the subscriber has already received in the welcome sequence: [brief summary of your welcome emails]. Audience: [avatar].\n\nThis email should: feel like a natural next step — not a sudden sales pitch, connect to a problem or idea already raised in the welcome sequence, describe the product in 2-3 sentences with one clear link, be honest about who it is for and who it is not for. Length: short. Tone: [your brand voice]. Subject line: 3 options.',
    toolLinks: [
      { label: 'Open SureContact', url: 'https://app.surecontact.com', icon: 'mail' },
    ],
    route: '/projects/:id/tasks/postlaunch_evergreen_funnel',
  },

  {
    taskId: 'postlaunch_continue_content',
    title: 'Continue your content rhythm',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 6,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 35,
    blocking: false,
    dependencies: [],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have resumed your regular posting schedule after the launch',
      'You have the next 2 weeks of content planned',
    ],
    whyItMatters: 'Most people go quiet after a launch — exhausted or waiting to see what happens. The audience notices. The algorithm notices. Momentum is much easier to maintain than rebuild. Resuming your content rhythm within 48 hours of close day signals to your audience (and the algorithm) that you are consistent, not transactional.',
    instructions: [
      'Within 48 hours of the launch closing: post something that is pure value with no mention of the product',
      'This resets the relationship from "person selling something" back to "person I learn from"',
      'Plan the next 2 weeks of content using your pillars and content model',
      'You do not need a new 30-day plan immediately — two weeks keeps you ahead without requiring another full planning session',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'content_resumed',
          label: 'Have you posted since the launch closed?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'yes', label: 'Yes — back to regular posting' },
            { value: 'not_yet', label: 'Not yet — launch just closed' },
          ],
        },
        {
          name: 'next_2_weeks_planned',
          label: 'Next 2 weeks of content planned?',
          type: 'select',
          required: false,
          placeholder: 'Select...',
          options: [
            { value: 'yes', label: 'Yes — have post ideas for the next 2 weeks' },
            { value: 'rough_plan', label: 'Rough plan — know the general direction' },
            { value: 'not_yet', label: 'Not yet' },
          ],
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Help me plan 2 weeks of post-launch content. Context: I just closed a launch for [product name]. Primary platform: [platform]. Content pillars: [your pillars]. I want to shift back to pure value content and rebuild the relationship with my audience after the sales-focused launch period.\n\nCreate a 10-post plan for the next 2 weeks that: starts with a strong value post on day 1 (no product mention), rotates through my content pillars, includes one behind-the-scenes or personal post, naturally re-engages people who did not buy without making them feel targeted, and ends week 2 with a soft evergreen mention of the product. Format: post topic, pillar, and one-sentence angle for each post.',
    toolLinks: [],
    route: '/projects/:id/tasks/postlaunch_continue_content',
  },

  {
    taskId: 'postlaunch_google_ads',
    title: 'Evaluate running Google Ads to your sales page',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 7,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['postlaunch_review_numbers'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have made a clear decision about whether Google Ads is the right next move for your business right now',
    ],
    whyItMatters: 'Once you have a proven offer with real buyers and testimonials, Google Ads can accelerate your growth by sending targeted traffic directly to your sales page. But ads before you have proven the offer is like pouring water into a leaky bucket — expensive and demoralizing. This task helps you evaluate whether ads make sense at this stage.',
    instructions: [
      'The right time for Google Ads is after you have: a proven offer (sales from real buyers), a converting sales page (at least 1-2% conversion), a verified Google Business Profile, and a budget you can commit for 60-90 days',
      'For local service businesses (like auto glass, home services, trades): Google Ads often deliver the highest ROI and the fastest results — this is a strong priority',
      'For digital product businesses: social content and email growth often come first — ads amplify what is already working',
      'If you decide to run ads: verify your Google Business Profile is set up (from Phase 0) and your Lovable site is connected to your domain',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'ads_decision',
          label: 'What is your decision on Google Ads?',
          type: 'select',
          required: true,
          placeholder: 'Select...',
          options: [
            { value: 'yes_starting', label: 'Yes — setting up Google Ads now' },
            { value: 'yes_planning', label: 'Yes — planning to start in the next 30 days' },
            { value: 'not_yet', label: 'Not yet — focusing on organic growth first' },
            { value: 'no', label: 'No — not the right channel for my business' },
          ],
        },
        {
          name: 'ads_budget',
          label: 'Monthly ad budget (if running ads)',
          type: 'text',
          required: false,
          placeholder: 'e.g. $500/month, $1,000/month',
          helperText: 'Start with a budget you can sustain for 90 days — do not start ads you will need to pause after 2 weeks.',
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Help me evaluate whether Google Ads make sense for my business right now. Business type: [service business / digital product / both]. My product: [product name and promise]. Sales page URL: [URL]. Current monthly revenue: [rough number]. Current list size: [number]. Monthly budget I could commit to ads: [amount].\n\nTell me: (1) whether Google Ads is the right next step given my current numbers and business type, (2) what I need to have in place before starting ads (site speed, GBP verification, conversion tracking), (3) the campaign type that typically performs best for my business type, (4) what a realistic 90-day outcome looks like at my budget. Be honest — if ads are not the right move yet, tell me what to do first.',
    toolLinks: [
      { label: 'Open Google Ads', url: 'https://ads.google.com', icon: 'trending-up' },
      { label: 'Open Google Business Profile', url: 'https://business.google.com', icon: 'map-pin' },
    ],
    route: '/projects/:id/tasks/postlaunch_google_ads',
  },

  {
    taskId: 'postlaunch_next_30_days',
    title: 'Plan your next 30 days',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 8,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['postlaunch_review_numbers'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a clear 30-day plan for what you will focus on after this launch',
      'The plan is based on what your numbers showed — not wishful thinking',
    ],
    whyItMatters: 'After the launch closes, there is a window of about 72 hours before the momentum fades and the business goes back to whatever it was before. What you decide to focus on in that window — and whether you write it down — largely determines whether this launch was a one-off event or the beginning of a real revenue system.',
    instructions: [
      'Look at your biggest lever from the review task — your next 30 days should be dominated by work on that lever',
      'If the lever is audience growth: your 30 days is content + list building + possibly ads',
      'If the lever is conversion: your 30 days is messaging refinement + testimonial collection + sales page optimization',
      'If the lever is more products: your 30 days starts another cycle of Phase 2',
      'Set one primary goal with a number attached — not "grow my audience" but "reach 200 email subscribers"',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'primary_goal',
          label: 'What is your #1 goal for the next 30 days?',
          type: 'text',
          required: true,
          placeholder: 'e.g. Reach 200 email subscribers, generate $500 in evergreen sales, build and launch Product #2',
          helperText: 'One goal with a number. Specific enough that you will know at day 30 whether you hit it.',
        },
        {
          name: 'primary_focus',
          label: 'What is your primary focus area?',
          type: 'select',
          required: false,
          placeholder: 'Select...',
          options: [
            { value: 'audience_growth', label: 'Audience growth — building list and social following' },
            { value: 'conversion_optimization', label: 'Conversion optimization — improving sales page and messaging' },
            { value: 'new_product', label: 'New product — starting Phase 2 again for product #2' },
            { value: 'google_ads', label: 'Google Ads — setting up and running paid traffic' },
            { value: 'relaunch', label: 'Relaunch — running the same product launch again in 60-90 days' },
          ],
        },
        {
          name: 'next_30_days_plan',
          label: 'Your rough 30-day plan',
          type: 'textarea',
          required: false,
          placeholder: 'Week 1: Resume content, collect testimonials, add to sales page\nWeek 2: Write 2 weeks of content in advance, send weekly email broadcast\nWeek 3: Start building product #2 outline\nWeek 4: Announce product #2 to list for early feedback...',
        },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    aiPrompt: 'Build my 30-day post-launch plan. My launch results: [sales, revenue, conversion rate]. Biggest lever for growth: [your answer from the review task]. Primary goal for next 30 days: [your goal with a number].\n\nCreate a week-by-week 30-day plan that: prioritizes the right lever for my situation, includes specific deliverables each week (not just themes), balances content creation with business building, has one clear weekly win I can measure. Be realistic — I am a solo operator with limited time. Build a plan that is achievable, not aspirational.',
    toolLinks: [],
    route: '/projects/:id/tasks/postlaunch_next_30_days',
  },

  {
    taskId: 'postlaunch_decide_next_move',
    title: 'Decide your next move',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 9,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: false,
    dependencies: ['postlaunch_next_30_days'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You have made a clear decision about what comes next — relaunch, new product, agency, or growth',
    ],
    whyItMatters: 'Most business owners finish a launch and drift back into busy work without a strategic decision about direction. This task forces that decision. Every path forward is valid — there is no wrong answer. But the fastest growth comes from choosing deliberately and executing specifically rather than dabbling in all directions at once.',
    instructions: [
      'Read each option and pick the one that is most aligned with your numbers, your energy, and your 90-day goal',
      'Relaunch: run the same product launch again with a bigger, warmer audience — strong choice if conversion was good but audience was small',
      'New product: start Phase 2 again with a second offer — good if you want to increase revenue per customer',
      'Agency/services: offer a done-for-you version of what your digital product teaches — high ticket, lower volume',
      'Growth mode: 90 days of pure audience building before the next launch — right if your numbers showed small list was the main constraint',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        {
          value: 'relaunch',
          label: 'Relaunch the same product',
          description: 'Build a bigger, warmer audience over 60-90 days, then run the same launch again with more social proof and a larger list. Best when conversion was strong but audience was small.',
        },
        {
          value: 'new_product',
          label: 'Build a second product',
          description: 'Start Phase 2 again with a new offer — either a higher-ticket upgrade for existing buyers or a complementary product for the same audience. Best when your current offer has proven demand.',
        },
        {
          value: 'agency_services',
          label: 'Add a done-for-you service',
          description: 'Offer a high-ticket service that delivers what your product teaches. Different customer, different offer, same expertise. Best if you have capacity and want to increase revenue per client.',
        },
        {
          value: 'growth_mode',
          label: 'Go into growth mode',
          description: '90 days focused on audience building — content, ads, SEO, or partnerships — before launching again. Best when your biggest constraint is a small list.',
        },
        {
          value: 'cre8visions_session',
          label: 'Book a Cre8 Visions strategy session',
          description: 'Work with the Cre8 Visions team to map your next phase — offer architecture, systems buildout, or a full agency engagement. Best when you are ready to accelerate with professional support.',
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'ai_prompt'],
    aiPrompt: 'Help me decide my next strategic move. My launch results: [sales, revenue, conversion rate, list size]. What worked: [your notes]. My energy level after the launch: [high/medium/low]. My primary goal for the next 90 days: [your goal]. My biggest constraint right now: [time/money/audience size/offer quality].\n\nFor each option (Relaunch, New Product, Agency/Services, Growth Mode), tell me: how it addresses my specific constraint, what the 90-day outcome looks like at my current trajectory, what it requires from me in terms of time and effort, and whether it is the right fit given my results. Then give me a clear recommendation with one-paragraph reasoning.',
    toolLinks: [
      { label: 'Book a Cre8 Visions session', url: 'https://cre8visions.com', icon: 'calendar' },
    ],
    route: '/projects/:id/tasks/postlaunch_decide_next_move',
  },

  {
    taskId: 'postlaunch_brain_final',
    title: 'Complete your business brain',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 10,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 25,
    blocking: false,
    dependencies: ['postlaunch_decide_next_move'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'Your Claude Project contains the full business context — foundation, avatar, product, messaging, content strategy, launch results, and next direction',
      'Your Google Drive Business Brain folder structure is complete and organized',
    ],
    whyItMatters: 'You have just built a complete business — foundation, product, sales page, email system, content strategy, and a launch. Everything you created is more valuable when it is organized and accessible. A complete business brain means every future task — whether it is writing a new email, planning a new product, or briefing a freelancer — starts from full context instead of blank page.',
    instructions: [
      'Go through your Google Drive Business Brain and make sure each subfolder has the relevant documents from that phase',
      'Check your Claude Project instructions — add any missing context from phases you completed',
      'Add your launch results and next move decision to the brain',
      'Test the brain: ask Claude a complex question about your business — "What is my strongest product positioning?" or "What should I prioritize in the next 30 days?" — and evaluate how well it responds',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'foundation_saved', label: 'Foundation docs saved to Google Drive', description: 'Business name, structure, domain, brand basics, social profiles' },
        { value: 'avatar_saved', label: 'Customer avatar saved to Google Drive', description: 'Full avatar doc in Customer Research folder' },
        { value: 'product_saved', label: 'Product docs saved to Google Drive', description: 'Outline, promise, pricing, and final product file in Digital Product folder' },
        { value: 'sales_page_saved', label: 'Sales page copy saved to Google Drive', description: 'Full copy doc and live URL in Sales Page folder' },
        { value: 'email_saved', label: 'Email sequences saved to Google Drive', description: 'Welcome sequence and announcement email in Email Marketing folder' },
        { value: 'messaging_saved', label: 'Messaging framework saved to Google Drive', description: 'Core message, transformation, talking points, objections, voice guide in Messaging folder' },
        { value: 'content_saved', label: 'Content strategy saved to Google Drive', description: '30-day plan, pillars, first 5 posts in Content Strategy folder' },
        { value: 'launch_saved', label: 'Launch data saved to Google Drive', description: 'Launch results, testimonials, what worked notes in Launch folder' },
        { value: 'claude_project_complete', label: 'Claude Project updated with all business context', description: 'System prompt includes all phases — avatar, product, messaging, voice, launch results, next direction' },
      ],
    },
    aiAssistModes: ['ai_prompt'],
    toolLinks: [
      { label: 'Open Google Drive', url: 'https://drive.google.com', icon: 'folder' },
      { label: 'Open Claude Projects', url: 'https://claude.ai', icon: 'brain' },
    ],
    route: '/projects/:id/tasks/postlaunch_brain_final',
    brainUpdatePrompt: 'Update my business brain with my launch results and next direction.\n\nLaunch results:\n- Product: [product name]\n- Sales: [number]\n- Revenue: [amount]\n- Conversion rate: [percentage]\n- List size: [number]\n- What worked best: [your notes]\n- What to improve: [your notes]\n\nNext move: [your decision]\n90-day goal: [your goal with number]\n\nFrom now on, when helping me with any business task, use this full context. My business is no longer in setup mode — I have a live product, real buyers, and a clear direction. Adjust your guidance accordingly.',
  },


];

// ============================================================
// RETIRED TASK TEMPLATES — v1 archive. Do not delete.
// Original task set before the June 2026 architecture swap.
// Any task here can be revived and remapped into TASK_TEMPLATES.
// Reference doc: retired-tasks-reference.html
// ============================================================
export const RETIRED_TASK_TEMPLATES: TaskTemplate[] = [
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
            // Business & Money
            { value: 'business_entrepreneurship', label: 'Business / Entrepreneurship' },
            { value: 'money_finance', label: 'Money / Finance' },
            { value: 'investing', label: 'Investing / Wealth Building' },
            { value: 'real_estate', label: 'Real Estate' },
            { value: 'ecommerce', label: 'E-commerce / Online Business' },
            { value: 'freelancing', label: 'Freelancing / Consulting' },
            { value: 'coaching_mentorship', label: 'Coaching / Mentorship' },
            { value: 'sales', label: 'Sales / Closing' },
            // Career & Professional
            { value: 'career', label: 'Career Development' },
            { value: 'leadership', label: 'Leadership / Management' },
            { value: 'productivity', label: 'Productivity / Time Management' },
            { value: 'remote_work', label: 'Remote Work / Digital Nomad' },
            { value: 'career_transition', label: 'Career Transition / Pivot' },
            // Marketing & Creative
            { value: 'marketing', label: 'Marketing / Advertising' },
            { value: 'social_media', label: 'Social Media / Influencing' },
            { value: 'content_creation', label: 'Content Creation' },
            { value: 'copywriting', label: 'Copywriting / Writing' },
            { value: 'branding', label: 'Branding / Personal Brand' },
            { value: 'photography', label: 'Photography / Videography' },
            { value: 'design', label: 'Design / Creative Arts' },
            { value: 'podcasting', label: 'Podcasting / Audio' },
            // Tech & Skills
            { value: 'tech', label: 'Tech / Software' },
            { value: 'ai_automation', label: 'AI / Automation' },
            { value: 'web_development', label: 'Web Development' },
            { value: 'data_analytics', label: 'Data / Analytics' },
            // Health & Wellness
            { value: 'health_wellness', label: 'Health / Wellness' },
            { value: 'fitness', label: 'Fitness / Exercise' },
            { value: 'nutrition', label: 'Nutrition / Diet' },
            { value: 'weight_loss', label: 'Weight Loss' },
            { value: 'mental_health', label: 'Mental Health / Therapy' },
            { value: 'meditation', label: 'Meditation / Mindfulness' },
            { value: 'sleep', label: 'Sleep / Recovery' },
            { value: 'chronic_illness', label: 'Chronic Illness / Pain Management' },
            { value: 'womens_health', label: "Women's Health / Hormones" },
            { value: 'mens_health', label: "Men's Health / Performance" },
            { value: 'aging', label: 'Aging / Longevity' },
            // Personal Growth
            { value: 'personal_growth', label: 'Personal Growth / Self-Improvement' },
            { value: 'confidence', label: 'Confidence / Self-Esteem' },
            { value: 'habits', label: 'Habits / Behavior Change' },
            { value: 'motivation', label: 'Motivation / Discipline' },
            { value: 'spirituality', label: 'Spirituality / Faith' },
            { value: 'manifestation', label: 'Manifestation / Law of Attraction' },
            // Relationships & Family
            { value: 'relationships', label: 'Relationships / Love' },
            { value: 'dating', label: 'Dating / Finding Love' },
            { value: 'marriage', label: 'Marriage / Couples' },
            { value: 'parenting', label: 'Parenting / Family' },
            { value: 'divorce', label: 'Divorce / Separation' },
            { value: 'communication', label: 'Communication / Conflict' },
            // Lifestyle
            { value: 'lifestyle', label: 'Lifestyle Design' },
            { value: 'travel', label: 'Travel / Adventure' },
            { value: 'minimalism', label: 'Minimalism / Decluttering' },
            { value: 'home_organization', label: 'Home Organization' },
            { value: 'fashion_style', label: 'Fashion / Style' },
            { value: 'beauty', label: 'Beauty / Skincare' },
            { value: 'cooking', label: 'Cooking / Food' },
            { value: 'pets', label: 'Pets / Animals' },
            { value: 'gardening', label: 'Gardening / Plants' },
            { value: 'sustainability', label: 'Sustainability / Eco-Living' },
            // Education & Learning
            { value: 'education', label: 'Education / Teaching' },
            { value: 'language_learning', label: 'Language Learning' },
            { value: 'music', label: 'Music / Instruments' },
            { value: 'homeschooling', label: 'Homeschooling' },
            { value: 'academic', label: 'Academic / Test Prep' },
            // Niche Industries
            { value: 'legal', label: 'Legal / Law' },
            { value: 'medical', label: 'Medical / Healthcare' },
            { value: 'nonprofit', label: 'Nonprofit / Social Impact' },
            { value: 'sports', label: 'Sports / Athletics' },
            { value: 'gaming', label: 'Gaming / Esports' },
            { value: 'entertainment', label: 'Entertainment / Events' },
            // Other
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
    taskId: 'planning_choose_launch_path',
    title: 'Choose how you\'ll sell your offer',
    phase: 'setup',
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
        { value: 'membership', label: 'Membership', description: 'An ongoing subscription where members receive continuous value over time, rather than a one-time outcome' },
        { value: 'challenge', label: 'Challenge', description: 'A short, time-bound experience designed to help people take focused action and experience momentum within a defined window' },
        { value: 'launch', label: 'Launch', description: 'A time-bound window where your offer is introduced, explained, and made available for a limited period' },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples'],
    route: '/projects/:id/tasks/planning_choose_launch_path',
  },
  {
    taskId: 'planning_offer_stack',
    title: 'Map your offer stack',
    phase: 'planning',
    funnelTypes: ['all'],
    order: 7,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['planning_choose_launch_path'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You can see what offers exist in your ecosystem',
      'You understand how they fit together',
      'At least one offer is defined',
    ],
    whyItMatters: 'This step helps you see your complete offer ecosystem — not perfect it. Understanding what exists and how offers relate gives you clarity and confidence moving forward.',
    instructions: [
      'Review the suggested offer slots based on your launch path',
      'Configure at least one offer (your core offer)',
      'Add, skip, or reorder slots as needed',
      'Remember: these are patterns, not requirements',
    ],
    inputType: 'custom',
    aiAssistModes: ['help_me_choose', 'examples'],
    route: '/projects/:id/tasks/planning_offer_stack',
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
    dependencies: ['planning_offer_stack'],
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
        { value: 'offer_reviewed', label: 'Offer stack mapped', description: 'I can see my offer ecosystem' },
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
    taskId: 'messaging_sales_copy',
    title: 'Write your sales page copy',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 7.5,
    priority: 2,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 45,
    blocking: false,
    dependencies: ['messaging_visual_direction'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve written copy for at least one offer',
      'Your messaging aligns with your transformation statement',
    ],
    whyItMatters: 'Your sales page is where you make the case for your offer. But you don\'t need to be a professional copywriter to write something that connects. This section-by-section approach helps you build momentum — one block at a time.',
    instructions: [
      'Select an offer to write copy for',
      'Work through each section at your own pace',
      'Use AI suggestions when you need inspiration',
    ],
    inputType: 'custom',
    inputSchema: {
      type: 'custom',
      customComponent: 'SalesCopyBuilder',
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/messaging_sales_copy',
  },
  {
    taskId: 'messaging_phase_review',
    title: 'Review your messaging',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 8,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: false,
    dependencies: ['messaging_sales_copy'],
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
        { value: 'social_bio_reviewed', label: 'Social media bio created', description: 'My bio sets the right first impression' },
        { value: 'visual_direction_reviewed', label: 'Visual direction set', description: 'I have a simple visual style for this launch' },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/messaging_phase_review',
  },
  {
    taskId: 'messaging_social_bio',
    title: 'Create your social media bio',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 6,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['messaging_transformation_statement'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'Your bio clearly communicates who you help',
      'The message feels aligned with your offer',
    ],
    whyItMatters: 'Your social media bio is often the first trust signal people see. It sets context for all your future content and helps the right audience know they\'re in the right place.',
    instructions: [
      'Speak directly to who you help',
      'Name the outcome you support',
      'Keep language simple and clear',
    ],
    inputType: 'custom',
    inputSchema: {
      type: 'custom',
      customComponent: 'SocialBioBuilder',
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
    route: '/projects/:id/tasks/messaging_social_bio',
  },
  {
    taskId: 'messaging_visual_direction',
    title: 'Set your launch visual direction',
    phase: 'messaging',
    funnelTypes: ['all'],
    order: 7,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    blocking: false,
    dependencies: ['messaging_social_bio'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'I\'ve chosen a simple visual direction',
      'I understand this is just for this launch',
    ],
    whyItMatters: 'When your visuals feel consistent, posting feels easier — and your audience understands you faster. This isn\'t about perfect branding. It\'s about choosing a direction so you don\'t second-guess every post.',
    instructions: [
      'Choose a small set of visual cues for this launch',
      'Keep it simple — less is better',
      'You can change this later or use a different direction next launch',
    ],
    inputType: 'custom',
    inputSchema: {
      type: 'custom',
      customComponent: 'VisualDirectionBuilder',
    },
    aiAssistModes: ['help_me_choose'],
    route: '/projects/:id/tasks/messaging_visual_direction',
  },

  // ==================== BUILD PHASE ====================
  // Goal: "Put your offer somewhere real so people can find it and buy it — without tech overwhelm."
  {
    taskId: 'build_choose_delivery_asset',
    title: 'Choose Your Delivery Asset',
    phase: 'build',
    funnelTypes: ['all'],
    order: 1,
    priority: 1,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: true,
    dependencies: ['messaging_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve selected one delivery option',
      'It feels simple and doable right now',
    ],
    whyItMatters: 'This task helps you decide what someone will receive when they say yes to your offer. You already know who this is for and what outcome you\'re helping them achieve. Now we\'re making the offer real by choosing how it\'s delivered.',
    instructions: [
      'Choose the option that best describes what someone receives first',
      'You are not building anything yet',
      'Simply choose the delivery format',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        { value: 'live_session', label: 'A live session or workshop', description: 'Real-time interaction with your audience' },
        { value: 'downloadable', label: 'A downloadable resource', description: 'Guide, planner, workbook, or similar' },
        { value: 'access_page', label: 'Access to a page or portal', description: 'Online space where they access content' },
        { value: 'curated_bundle', label: 'A curated bundle of resources', description: 'Collection of materials packaged together' },
        { value: 'affiliate_product', label: 'An affiliate product you recommend', description: 'Product from another creator you promote' },
        { value: 'mrr_plr_product', label: 'An MRR or PLR-based product', description: 'Master resell rights or private label product' },
      ],
    },
    aiAssistModes: ['help_me_choose'],
    route: '/projects/:id/tasks/build_choose_delivery_asset',
  },
  {
    taskId: 'build_create_asset',
    title: 'Create or Select the Asset',
    phase: 'build',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 45,
    blocking: true,
    dependencies: ['build_choose_delivery_asset'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You have a specific asset chosen or created',
      'You could deliver this today if needed',
    ],
    whyItMatters: 'This task helps you create or select the actual thing you\'re delivering — without starting from scratch. You don\'t need to make this perfect. You just need something real.',
    instructions: [
      'Based on your chosen delivery format, decide on the specific asset',
      'If using a live session, decide the topic and format',
      'If delivering a resource, choose or create the file',
      'If using affiliate, MRR, or PLR, select the product you\'ll use',
      'Pro plan users can use Content Vault templates to speed this up',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        { 
          name: 'asset_name', 
          label: 'What is the name or title of your asset?', 
          type: 'text', 
          required: true, 
          placeholder: 'e.g., "Getting Started Guide", "90-Minute Strategy Session"...' 
        },
        { 
          name: 'asset_description', 
          label: 'Briefly describe what this asset includes or covers', 
          type: 'textarea', 
          required: true, 
          placeholder: 'Describe the content, format, or what makes it valuable...' 
        },
        { 
          name: 'asset_source', 
          label: 'Where is this asset coming from?', 
          type: 'select', 
          required: false,
          sectionLabel: 'Optional: Helpful context',
          helperText: 'This helps us understand your workflow.',
          options: [
            { value: '', label: 'Select an option...' },
            { value: 'creating_new', label: 'Creating it myself' },
            { value: 'existing_resource', label: 'Using something I already have' },
            { value: 'content_vault', label: 'Using a Content Vault template (Pro)' },
            { value: 'affiliate', label: 'Affiliate product' },
            { value: 'mrr_plr', label: 'MRR/PLR product' },
          ]
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples'],
    route: '/projects/:id/tasks/build_create_asset',
  },
  {
    taskId: 'build_define_access_moment',
    title: 'Define the First Access Moment',
    phase: 'build',
    funnelTypes: ['all'],
    order: 3,
    priority: 1,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 15,
    blocking: true,
    dependencies: ['build_create_asset'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You know what happens after someone joins',
      'You know where they go next',
    ],
    whyItMatters: 'This task connects your offer to your tech setup. It answers the question: how does someone receive this after they say yes? You don\'t need automation yet — you\'re simply choosing the first access point.',
    instructions: [
      'Decide how the delivery happens',
      'Choose the first access point after someone says yes',
      'You don\'t need automation set up yet',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        { value: 'email_delivery', label: 'Email delivery', description: 'Asset is sent directly to their inbox' },
        { value: 'download_link', label: 'Download link', description: 'They receive a link to download the asset' },
        { value: 'access_page', label: 'Access page', description: 'They\'re directed to a page where they can access content' },
        { value: 'live_session_confirmation', label: 'Live session confirmation', description: 'They receive calendar invite or session details' },
        { value: 'affiliate_redirect', label: 'Affiliate redirect', description: 'They\'re sent to the affiliate product page' },
      ],
    },
    aiAssistModes: ['help_me_choose'],
    route: '/projects/:id/tasks/build_define_access_moment',
  },
  {
    taskId: 'build_simple_launch_page',
    title: 'Set up a simple launch page',
    phase: 'build',
    funnelTypes: ['all'],
    order: 4,
    priority: 1,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 45,
    blocking: true,
    dependencies: ['messaging_phase_review'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'Your page exists and is accessible',
      'Someone could understand what this is from looking at it',
      'There\'s one clear next step for interested people',
    ],
    whyItMatters: 'You don\'t need a complicated setup to launch. For a minimum viable launch, one simple page is enough. This step helps you get something live without overthinking.',
    instructions: [
      'Create one page for your offer',
      'Make sure it explains what this is',
      'Add one clear next step (sign up, apply, or buy)',
    ],
    inputType: 'custom',
    inputSchema: {
      type: 'custom',
      customComponent: 'SimpleLaunchPageTask',
    },
    aiAssistModes: [],
    route: '/projects/:id/tasks/build_simple_launch_page',
  },
  {
    taskId: 'build_email_platform',
    title: 'Connect your email platform',
    phase: 'build',
    funnelTypes: ['all'],
    order: 5,
    priority: 2,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: false,
    dependencies: ['build_simple_launch_page'],
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
    order: 6,
    priority: 2,
    estimatedMinutesMin: 20,
    estimatedMinutesMax: 45,
    blocking: false,
    dependencies: ['build_simple_launch_page'],
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
    order: 7,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: false,
    dependencies: ['build_simple_launch_page'],
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
        { value: 'delivery_asset_chosen', label: 'Delivery asset chosen', description: 'I know what I\'m delivering' },
        { value: 'asset_ready', label: 'Asset ready', description: 'I have something I could deliver today' },
        { value: 'access_defined', label: 'First access defined', description: 'I know how they\'ll receive it' },
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
    taskId: 'content_choose_model',
    title: 'Choose your content model',
    phase: 'content',
    funnelTypes: ['all'],
    order: 1.5,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['content_choose_platforms'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      "You've chosen a content model that fits your goals",
      "You understand how the model flows over time",
    ],
    whyItMatters: "A content model gives your posts a direction — not just topics, but a structure that builds on itself. Without one, content feels random and disconnected. With one, every post is part of something bigger.",
    instructions: [
      "Read each model description carefully",
      "Choose the one that fits where you are right now — not where you'd like to be",
      "You're not locked in — you can change models between launches",
      "If you're building an audience from scratch, start with Story Arc or Evergreen",
      "If you have an upcoming launch, choose Pre-Launch + Launch",
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        {
          value: 'pre_launch',
          label: 'Pre-Launch + Launch',
          description: '4 weeks of warm-up content leading into a time-limited open cart. Best when you have a specific launch date and an offer ready to sell.',
        },
        {
          value: 'story_arc',
          label: '30-Day Story Arc',
          description: "A narrative-driven series that takes your audience through a journey — Origin, How, Build, Momentum. Best for building an engaged audience before making any offer.",
        },
        {
          value: 'evergreen',
          label: 'Evergreen Authority',
          description: "Ongoing content that builds trust over time — teaching, tools, behind-the-scenes, and occasional soft promotions. No launch required. Best for long-term audience building.",
        },
        {
          value: 'episode_series',
          label: 'Episode Series',
          description: "A recurring, numbered content format your audience comes back for — like a TV show. Each episode is standalone but part of a larger arc. Best if you enjoy consistency and building loyalty.",
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples'],
    route: '/projects/:id/tasks/content_choose_model',
  },
  {
    taskId: 'content_define_themes',
    title: 'Define your content pillars',
    phase: 'content',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 30,
    blocking: true,
    dependencies: ['content_choose_model'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      "You have 3–5 clear content pillars",
      "Each pillar connects to your audience's world or your offer",
      "You've described your content voice and preferred formats",
    ],
    whyItMatters: "Content pillars are the recurring topics you'll come back to again and again. They give your content direction without boxing you in. When you know your pillars, you'll never stare at a blank page wondering what to post — and the AI generator will use these to build your entire content calendar around your specific voice and topics.",
    instructions: [
      "Think about the 3–5 topics you could talk about endlessly",
      "Each pillar should connect to your audience's struggles, goals, or world",
      "Keep pillars broad enough to give you flexibility",
      "Your voice and format choices help the AI personalize every post it generates",
      "The more specific you are here, the better your generated content will be",
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'pillar_1',
          label: 'Content Pillar 1',
          type: 'text',
          required: true,
          placeholder: 'e.g., Behind-the-scenes of building my business',
          helperText: "Your most important topic — the one you'd post about every week.",
        },
        {
          name: 'pillar_2',
          label: 'Content Pillar 2',
          type: 'text',
          required: true,
          placeholder: "e.g., Lessons I've learned the hard way",
          helperText: 'A topic that builds trust through your experience.',
        },
        {
          name: 'pillar_3',
          label: 'Content Pillar 3',
          type: 'text',
          required: true,
          placeholder: 'e.g., Quick tips and practical tools',
          helperText: 'A teaching or value-focused topic.',
        },
        {
          name: 'pillar_4',
          label: 'Content Pillar 4 (optional)',
          type: 'text',
          required: false,
          placeholder: 'e.g., Client wins and transformation stories',
        },
        {
          name: 'pillar_5',
          label: 'Content Pillar 5 (optional)',
          type: 'text',
          required: false,
          placeholder: 'e.g., Personal life and what keeps me going',
        },
        {
          name: 'content_voice',
          label: 'How would you describe your content voice?',
          type: 'select',
          required: true,
          placeholder: 'Choose the tone that feels most like you...',
          helperText: 'This shapes how every piece of generated content is written.',
          options: [
            { value: '', label: 'Choose your voice...' },
            { value: 'educational_helpful', label: 'Educational & helpful — I lead with value and teach clearly' },
            { value: 'storytelling_personal', label: 'Storytelling & personal — I share my journey and experiences' },
            { value: 'bold_direct', label: 'Bold & direct — I say it straight, no fluff' },
            { value: 'soft_conversational', label: 'Soft & conversational — I write like I talk to a friend' },
            { value: 'motivational_inspiring', label: 'Motivational & inspiring — I lift people up and challenge them' },
            { value: 'professional_authoritative', label: 'Professional & authoritative — I speak as an expert in my field' },
          ],
        },
        {
          name: 'content_formats',
          label: 'What content formats will you focus on?',
          type: 'textarea',
          required: false,
          placeholder: 'e.g., Short-form video (Reels/TikTok), written posts, carousels...',
          helperText: 'Knowing your formats helps the generator suggest content ideas that actually work for how you show up.',
        },
        {
          name: 'origin_hook',
          label: "What's the story behind why you're showing up? (optional)",
          type: 'textarea',
          required: false,
          placeholder: "e.g., I left my corporate job to build something I loved. I got laid off and decided to start over. I've been doing this quietly for years and I'm finally ready to share...",
          helperText: "Used for Story Arc content to create a narrative thread across your posts. Skip if you chose a different model.",
        },
      ],
    },
    aiAssistModes: ['help_me_choose', 'examples', 'simplify'],
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

  // ==================== PRE-LAUNCH PHASE ====================
  // Goal: "Give light context — not build momentum. One small signal is enough."
  {
    taskId: 'prelaunch_share_signal',
    title: 'Share one small signal',
    phase: 'pre-launch',
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
      'You\'ve shared one simple signal',
      'You feel calmer, not more pressured',
    ],
    whyItMatters: 'Your goal here isn\'t attention or engagement. It\'s simply to signal that you\'re working on something — so when you do share later, it feels familiar instead of out of the blue.',
    instructions: [
      'Choose one simple way to signal what you\'re working on',
      'Share a short post, story, quiet question, or waitlist link',
      'Remember: one signal is enough',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      options: [
        { value: 'short_post', label: 'A short post', description: 'Share a simple update about what you\'re building or thinking through.' },
        { value: 'story_message', label: 'A story or quick message', description: 'Mention what you\'re working on without explaining everything.' },
        { value: 'quiet_question', label: 'A quiet question', description: 'Ask something related to the problem your offer solves.' },
        { value: 'waitlist_link', label: 'A waitlist or "coming soon" link', description: 'Only if you already have one. This is not required.' },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/prelaunch_share_signal',
  },

  {
    taskId: 'prelaunch_test_tech',
    title: 'Test your tech end-to-end',
    phase: 'pre-launch',
    funnelTypes: ['all'],
    order: 2,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['prelaunch_share_signal'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve clicked every link yourself',
      'The full journey from discovery to delivery works',
    ],
    whyItMatters: 'Most launch failures aren\'t strategy problems — they\'re broken links, undelivered emails, and checkout errors that could have been caught in ten minutes. This step catches those before your audience does.',
    instructions: [
      'Go through the full journey as if you were a buyer',
      'Click every link, test checkout, confirm delivery',
      'Fix anything that feels confusing or broken',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'links_tested', label: 'All links work', description: 'Every button, bio link, and CTA goes to the right place' },
        { value: 'checkout_tested', label: 'Checkout works', description: 'Payment goes through and confirmation is received' },
        { value: 'delivery_tested', label: 'Delivery confirmed', description: 'The product, freebie, or access is delivered after purchase' },
        { value: 'email_tested', label: 'Emails arrive', description: 'Welcome, confirmation, and delivery emails actually land in the inbox' },
        { value: 'mobile_tested', label: 'Works on mobile', description: 'The experience looks and works on a phone' },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/prelaunch_test_tech',
  },

  {
    taskId: 'prelaunch_social_proof',
    title: 'Gather one piece of social proof',
    phase: 'pre-launch',
    funnelTypes: ['all'],
    order: 3,
    priority: 2,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['prelaunch_share_signal'],
    canSkip: true,
    skipReasonRequired: true,
    completionCriteria: [
      'You have at least one testimonial, result, or endorsement',
      'You can reference it naturally when sharing your offer',
    ],
    whyItMatters: 'Social proof reduces buyer hesitation more than any feature list. Even one real result from a beta tester, early user, or client gives your audience something to lean on when deciding.',
    instructions: [
      'Ask one person who\'s used your content, method, or a beta version of your offer',
      'A short honest response is more powerful than a polished quote',
      'You don\'t need permission to share a result — just a kind word',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'social_proof',
          label: 'What result, testimonial, or endorsement do you have?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g., "A beta tester said it helped them finally understand X" or "A client got Y result using this approach"',
          helperText: 'Write it in plain language — it doesn\'t need to be polished.',
        },
        {
          name: 'proof_source',
          label: 'Who is it from?',
          type: 'text',
          required: false,
          placeholder: 'e.g., beta tester, past client, workshop attendee...',
          sectionLabel: 'Optional: Context',
          helperText: 'You don\'t need a name — just a description of who they are.',
        },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/prelaunch_social_proof',
  },

  {
    taskId: 'prelaunch_prepare_response',
    title: 'Prepare for responses',
    phase: 'pre-launch',
    funnelTypes: ['all'],
    order: 4,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: false,
    dependencies: ['prelaunch_test_tech'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You know what to say when someone asks about your offer',
      'You feel prepared, not caught off guard',
    ],
    whyItMatters: 'When you share your offer, people will respond — with questions, interest, or both. Having a simple, natural response ready means you never miss a sale because you didn\'t know what to say.',
    instructions: [
      'Write 2–3 sentences you could send when someone asks "tell me more"',
      'Keep it conversational — not a pitch',
      'Include what it is, who it\'s for, and one clear next step',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'response_message',
          label: 'What will you say when someone asks about your offer?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g., "Hey! Yes — it\'s a [short description]. It\'s for [who]. Here\'s where you can learn more: [link]"',
          helperText: 'Write the way you actually talk — not like a brochure.',
        },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/prelaunch_prepare_response',
  },

  // ==================== LAUNCH PHASE ====================
  // Goal: "Share your offer once — without hype, pressure, or campaign thinking."
  {
    taskId: 'launch_share_offer_once',
    title: 'Share your offer once',
    phase: 'launch',
    funnelTypes: ['all'],
    order: 0,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: true,
    dependencies: ['prelaunch_share_signal'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve shared your offer once',
      'One clear share is enough for this step',
    ],
    whyItMatters: 'This is the launch. You\'re not announcing, hyping, or convincing. You\'re simply letting people know what this is and how to learn more.',
    instructions: [
      'Keep this simple and human.',
      'A sentence or two is enough.',
      'You don\'t need to explain everything.',
    ],
    inputType: 'selection',
    inputSchema: {
      type: 'radio',
      prompt: 'Choose how you want to share. One is enough.',
      helperText: 'You don\'t need more than one. More doesn\'t make this more valid.',
      options: [
        { value: 'one_post', label: 'One post', description: 'A simple post explaining what this is and who it\'s for.' },
        { value: 'warm_message', label: 'One message to a warm audience', description: 'A direct message or email to people who already know you.' },
        { value: 'post_and_reminder', label: 'One post + one reminder (optional)', description: 'Only if you want. This is not required.' },
      ],
    },
    exampleText: 'Example:\n"I\'ve been working on something to help people simplify this process. If that sounds useful, here\'s where you can learn more."',
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/launch_share_offer_once',
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
    dependencies: ['launch_share_offer_once'],
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
    taskId: 'postlaunch_confirm_delivery',
    title: 'Confirm buyers received their access',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 1.5,
    priority: 1,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 10,
    blocking: true,
    dependencies: ['postlaunch_acknowledge_completion'],
    canSkip: false,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve confirmed at least one buyer received what they paid for',
      'Anyone who had trouble getting access has been helped',
    ],
    whyItMatters: 'The moment after purchase is when your relationship with a buyer really begins. Confirming they have access — and actually reached out if they didn\'t — builds trust that turns buyers into repeat customers and referrers.',
    instructions: [
      'Check that purchase confirmation emails went through',
      'Verify access to the product, course, or resource works',
      'If you have multiple buyers, spot-check at least a few',
    ],
    inputType: 'checklist',
    inputSchema: {
      type: 'checkbox',
      options: [
        { value: 'confirmations_sent', label: 'Purchase confirmations sent', description: 'Buyers received a confirmation email or receipt' },
        { value: 'access_confirmed', label: 'Access confirmed', description: 'The product, link, or resource is accessible to buyers' },
        { value: 'issues_resolved', label: 'Any access issues resolved', description: 'Anyone who had trouble has been helped' },
      ],
    },
    aiAssistModes: ['simplify'],
    route: '/projects/:id/tasks/postlaunch_confirm_delivery',
  },

  {
    taskId: 'postlaunch_follow_up_interested',
    title: 'Follow up with people who showed interest',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 1.6,
    priority: 1,
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 20,
    blocking: false,
    dependencies: ['postlaunch_acknowledge_completion'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'You\'ve reached out to at least one person who engaged but didn\'t buy',
      'The message feels warm, not pushy',
    ],
    whyItMatters: 'People who asked questions, clicked your link, or replied to your content but didn\'t buy are your warmest leads. A simple, non-pushy follow-up is often the only difference between a missed sale and a conversion.',
    instructions: [
      'Think about who engaged with your launch — questions, replies, DMs, clicks',
      'Send a short, human message checking in — not a pitch',
      'One or two sentences is enough',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'followup_approach',
          label: 'How will you follow up with interested people?',
          type: 'select',
          required: true,
          options: [
            { value: '', label: 'Choose an approach...' },
            { value: 'dm', label: 'A personal DM or message' },
            { value: 'email', label: 'A reply to someone who emailed' },
            { value: 'comment_reply', label: 'A reply to a comment or engagement' },
            { value: 'no_interested_people', label: 'I didn\'t notice anyone specific — skipping this' },
          ],
        },
        {
          name: 'followup_message',
          label: 'What will you say?',
          type: 'textarea',
          required: false,
          placeholder: 'e.g., "Hey — I saw you asked about [offer]. Did you get a chance to check it out? Happy to answer any questions."',
          sectionLabel: 'Optional: Draft your message',
          helperText: 'Keep it short and genuine. No pitch needed.',
        },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/postlaunch_follow_up_interested',
  },

  {
    taskId: 'postlaunch_buyer_check_in',
    title: 'Check in with your buyers',
    phase: 'post-launch',
    funnelTypes: ['all'],
    order: 1.7,
    priority: 2,
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 15,
    blocking: false,
    dependencies: ['postlaunch_confirm_delivery'],
    canSkip: true,
    skipReasonRequired: false,
    completionCriteria: [
      'At least one buyer has heard from you after purchase',
      'The check-in felt supportive, not intrusive',
    ],
    whyItMatters: 'Most creators disappear after the sale. A simple check-in — even just one message — is rare enough to be memorable. It shows you care about their result, not just their payment. This is where loyalty and referrals are built.',
    instructions: [
      'Send a short, personal message to your buyers a few days after purchase',
      'Ask how they\'re getting on — don\'t ask for a review yet',
      'If they\'re stuck or confused, help them',
    ],
    inputType: 'form',
    inputSchema: {
      type: 'form',
      fields: [
        {
          name: 'checkin_message',
          label: 'What will you send to your buyers?',
          type: 'textarea',
          required: true,
          placeholder: 'e.g., "Hey — just checking in. Have you had a chance to get started with [offer]? Let me know if you have any questions."',
          helperText: 'Short and genuine. This isn\'t a sales email.',
        },
      ],
    },
    aiAssistModes: ['examples', 'simplify'],
    route: '/projects/:id/tasks/postlaunch_buyer_check_in',
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
]; // end RETIRED_TASK_TEMPLATES

// Push retired delta tasks into the retired array for completeness
RETIRED_TASK_TEMPLATES.push(
  ...FREEBIE_EMAIL_OFFER_DELTA_TASKS,
  ...LIVE_TRAINING_OFFER_DELTA_TASKS,
  ...APPLICATION_CALL_DELTA_TASKS,
  ...MEMBERSHIP_DELTA_TASKS,
  ...CHALLENGE_DELTA_TASKS,
  ...LAUNCH_DELTA_TASKS,
  ...CONTENT_TO_OFFER_DELTA_TASKS,
);

// ============================================================
// HELPER FUNCTIONS — operate on TASK_TEMPLATES (v2 active tasks)
// ============================================================

// Get tasks for a specific funnel type
export function getTasksForFunnelType(funnelType: string): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task =>
    task.funnelTypes.includes('all') || task.funnelTypes.includes(funnelType as any)
  );
}

// Get universal tasks (apply to all funnel types)
export function getUniversalTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.funnelTypes.includes('all'));
}

// Get planning phase tasks
export function getPlanningTasks(funnelType?: string | null): TaskTemplate[] {
  return TASK_TEMPLATES
    .filter(task => task.phase === 'planning' && (
      task.funnelTypes.includes('all') ||
      (funnelType && task.funnelTypes.includes(funnelType as any))
    ))
    .sort((a, b) => a.order - b.order);
}

// Get messaging phase tasks
export function getMessagingTasks(funnelType?: string | null): TaskTemplate[] {
  return TASK_TEMPLATES
    .filter(task => task.phase === 'messaging' && (
      task.funnelTypes.includes('all') ||
      (funnelType && task.funnelTypes.includes(funnelType as any))
    ))
    .sort((a, b) => a.order - b.order);
}

// Get build phase tasks (universal only)
export function getBuildTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === 'build' && task.funnelTypes.includes('all'));
}

// Get build phase tasks for a specific funnel type
export function getBuildTasksForFunnel(funnelType: string | null): TaskTemplate[] {
  return TASK_TEMPLATES
    .filter(task => task.phase === 'build' && (
      task.funnelTypes.includes('all') ||
      (funnelType && task.funnelTypes.includes(funnelType as any))
    ))
    .sort((a, b) => a.order - b.order);
}

// Get content phase tasks (universal only)
export function getContentTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === 'content' && task.funnelTypes.includes('all'));
}

// Get content phase tasks for a specific funnel type
export function getContentTasksForFunnel(funnelType: string | null): TaskTemplate[] {
  return TASK_TEMPLATES
    .filter(task => task.phase === 'content' && (
      task.funnelTypes.includes('all') ||
      (funnelType && task.funnelTypes.includes(funnelType as any))
    ))
    .sort((a, b) => a.order - b.order);
}

// Get launch phase tasks (universal only)
export function getLaunchTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === 'launch' && task.funnelTypes.includes('all'));
}

// Get launch phase tasks for a specific funnel type
export function getLaunchTasksForFunnel(funnelType: string | null): TaskTemplate[] {
  return TASK_TEMPLATES
    .filter(task => task.phase === 'launch' && (
      task.funnelTypes.includes('all') ||
      (funnelType && task.funnelTypes.includes(funnelType as any))
    ))
    .sort((a, b) => a.order - b.order);
}

// Get pre-launch phase tasks
export function getPreLaunchTasks(funnelType?: string | null): TaskTemplate[] {
  return TASK_TEMPLATES
    .filter(task => task.phase === 'pre-launch' && (
      task.funnelTypes.includes('all') ||
      (funnelType && task.funnelTypes.includes(funnelType as any))
    ))
    .sort((a, b) => a.order - b.order);
}

// Get post-launch phase tasks
export function getPostLaunchTasks(funnelType?: string | null): TaskTemplate[] {
  return TASK_TEMPLATES
    .filter(task => task.phase === 'post-launch' && (
      task.funnelTypes.includes('all') ||
      (funnelType && task.funnelTypes.includes(funnelType as any))
    ))
    .sort((a, b) => a.order - b.order);
}

// Get foundation phase tasks
export function getFoundationTasks(): TaskTemplate[] {
  return TASK_TEMPLATES
    .filter(task => task.phase === 'foundation')
    .sort((a, b) => a.order - b.order);
}

// Get tasks by any phase (generic)
export function getTasksByPhase(phase: string): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === phase);
}

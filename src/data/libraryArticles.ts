export interface LibraryArticle {
  id: string;
  title: string;
  descriptor: string;
  category: string;
  content: {
    whatThisIs: string;
    whyThisMattersHere: string;
    simpleWayToThink: string;
    example?: string;
    reassurance: string;
  };
}

export interface LibraryCategory {
  id: string;
  name: string;
  articles: LibraryArticle[];
}

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    articles: [
      {
        id: "how-launchely-works",
        title: "How Launchely Works",
        descriptor: "Understanding the guided approach to planning and launching",
        category: "getting-started",
        content: {
          whatThisIs: "Launchely is designed to guide you through planning and launching an offer without overwhelming you. Instead of showing you everything you could do, it focuses on what actually matters right now.\n\nEverything in Launchely lives inside a project. Each project moves through clear phases, and within each phase, you're guided step by step. You don't have to map out the entire launch or make every decision up front.\n\nYou're allowed to start messy here. Clarity builds as you move.",
          whyThisMattersHere: "Many people get stuck not because they lack ideas, but because they're trying to hold too many decisions at once. Launchely removes that pressure by narrowing your focus.\n\nThis structure exists so you can keep moving forward without constantly asking, \"Am I doing this right?\"",
          simpleWayToThink: "You're not managing a system — you're following a path. You only see what you need for the current phase. Progress matters more than perfection. You can always adjust later.",
          reassurance: "You don't need to understand everything about Launchely to use it well — starting is enough."
        }
      },
      {
        id: "what-is-a-project",
        title: "What a Project Actually Is",
        descriptor: "Understanding your project as a container for your launch",
        category: "getting-started",
        content: {
          whatThisIs: "In Launchely, a project is simply a container for one offer or launch. It holds your thinking, decisions, and progress in one place so nothing feels scattered.\n\nA project isn't a commitment to finish everything perfectly. It's just a way to focus on one thing at a time without mixing ideas, drafts, or half-finished plans together.\n\nIf you've ever had notes, docs, and tabs everywhere, this is Launchely's way of simplifying that.",
          whyThisMattersHere: "Many people get overwhelmed because they try to work on multiple ideas at once. Projects exist to reduce that mental load.\n\nBy keeping everything related to one offer inside a project, Launchely helps you stay focused and finish what you start.",
          simpleWayToThink: "One project = one offer or launch. Projects keep ideas from bleeding into each other. You don't need the full plan before starting. Projects can evolve as you go.",
          reassurance: "You can always start a new project later — this one just gives you a place to begin."
        }
      },
      {
        id: "phases-overview",
        title: "How Phases Work",
        descriptor: "The natural flow from planning to launching",
        category: "getting-started",
        content: {
          whatThisIs: "Phases are how Launchely organizes the work of planning and launching into manageable sections.\n\nEach phase focuses on one type of thinking — like clarity, messaging, or sharing — so you're not trying to solve everything at once. You move through phases in order, and only see the one you're currently in.\n\nThis is intentional.",
          whyThisMattersHere: "When people see the entire launch process all at once, it often feels heavier than it needs to be. Phases exist to protect your attention.\n\nBy narrowing your focus, Launchely helps you make better decisions without second-guessing every step.",
          simpleWayToThink: "Each phase has a single focus. You only work on what's relevant right now. Finishing a phase creates momentum. You're not missing anything ahead.",
          reassurance: "You don't need to think about future phases yet — they'll be there when you're ready."
        }
      }
    ]
  },
  {
    id: "planning-offers",
    name: "Planning & Offers",
    articles: [
      {
        id: "what-is-dream-outcome",
        title: "What a Dream Outcome Really Is",
        descriptor: "A simple way to think about outcomes without overthinking",
        category: "planning-offers",
        content: {
          whatThisIs: "A dream outcome is a simple description of what someone hopes their life, work, or situation will look like after the problem you're addressing is solved.\n\nIt's not a feature list. It's not a guarantee. And it's not about dramatic transformations.\n\nIn Launchely, the dream outcome helps you stay focused on why someone would care about your offer in the first place.",
          whyThisMattersHere: "When you're clear on the outcome someone wants, it becomes much easier to:\n\n• shape your offer\n• explain what you're helping with\n• decide what content actually matters\n\nThis step exists to prevent you from building something that sounds good but doesn't connect.",
          simpleWayToThink: "Focus on how someone wants to feel or function. Keep it realistic and human. One clear outcome is enough. You're describing progress, not perfection.",
          example: "Instead of:\n\"I want to help people build scalable businesses.\"\n\nYou might say:\n\"I want people to feel confident explaining what they offer and how it helps.\"",
          reassurance: "Your dream outcome can be simple — clarity is more useful than ambition here."
        }
      },
      {
        id: "pain-points-explained",
        title: "Pain Points vs. Symptoms",
        descriptor: "Understanding the difference for clearer messaging",
        category: "planning-offers",
        content: {
          whatThisIs: "A pain point is the core problem someone is dealing with. A symptom is how that problem shows up in their daily life.\n\nFor example, feeling overwhelmed might be a symptom — not knowing what to focus on is often the pain point underneath it.\n\nIn Launchely, this distinction helps you stay focused on what actually matters.",
          whyThisMattersHere: "When offers focus only on symptoms, they often sound vague or generic. Understanding the difference helps you describe the problem more clearly and connect with the right people.\n\nThis step isn't about psychology or digging deep — it's just about clarity.",
          simpleWayToThink: "Symptoms are what people complain about. Pain points are what cause those complaints. You only need one clear pain point. Simple understanding is enough.",
          example: "Symptom:\n\"I feel scattered all day.\"\n\nPain point:\n\"I don't have a clear plan for what matters most.\"",
          reassurance: "You don't need the perfect wording — recognizing the difference is already progress."
        }
      },
      {
        id: "perceived-likelihood",
        title: "Understanding Perceived Likelihood",
        descriptor: "Making your offer feel believable and approachable",
        category: "planning-offers",
        content: {
          whatThisIs: "Perceived likelihood is how believable your offer feels to someone — not whether it's technically possible, but whether they think it could work for them.\n\nIt's influenced by things like simplicity, clarity, and familiarity — not hype or guarantees.\n\nIn Launchely, this concept helps you remove unnecessary friction.",
          whyThisMattersHere: "Even a helpful offer can feel hard to trust if it sounds too complicated or unrealistic. This step exists to help you spot small changes that make your offer feel more approachable.\n\nYou're not trying to convince anyone — just reduce doubt.",
          simpleWayToThink: "Simple feels more believable. Clear beats impressive. Familiar paths feel safer. Fewer steps increase confidence.",
          reassurance: "You don't need to prove anything here — making things feel simpler is enough."
        }
      },
      {
        id: "simple-offer",
        title: "What Makes a \"Simple Offer\"",
        descriptor: "Clarity over complexity in offer design",
        category: "planning-offers",
        content: {
          whatThisIs: "A simple offer clearly explains:\n\n• who it's for\n• what it helps with\n• how it's delivered\n\nThat's it.\n\nIt doesn't need multiple layers, bonuses, or advanced positioning. In Launchely, simplicity is a strength — not a limitation.",
          whyThisMattersHere: "Many people overbuild offers because they're afraid of leaving something out. This often leads to confusion — for both you and your audience.\n\nThis step exists to help you create something clear enough to launch without getting stuck.",
          simpleWayToThink: "One main problem is enough. One clear outcome is enough. Extra details can come later. Finished beats expanded.",
          reassurance: "Your offer doesn't need to be big to be meaningful — it just needs to be clear."
        }
      },
      {
        id: "offer-stack-basics",
        title: "What an Offer Stack Is",
        descriptor: "How multiple offers work together",
        category: "planning-offers",
        content: {
          whatThisIs: "An offer stack is how your different offers relate to each other — from free content that attracts people, to low-ticket offers that build trust, to your core offer. It's not about having many products; it's about having a clear path.",
          whyThisMattersHere: "When you see your offers as a stack, you stop creating random things and start creating a journey.",
          simpleWayToThink: "Think of it as a path: free content helps people discover you, a smaller offer helps them get a quick win, and your main offer helps them achieve the bigger transformation.",
          example: "A free checklist → a $47 workshop → a $500 group program. Each step builds trust and moves people closer to the full transformation.",
          reassurance: "You don't need a complex offer stack to launch. Many successful launches have just one main offer with a simple lead magnet."
        }
      }
    ]
  },
  {
    id: "messaging",
    name: "Messaging",
    articles: [
      {
        id: "core-message-basics",
        title: "What a Core Message Is (and Isn't)",
        descriptor: "Your anchor when everything feels scattered",
        category: "messaging",
        content: {
          whatThisIs: "A core message is the simplest way to explain what you help with and who it's for.\n\nIt's not a slogan. It's not a headline. And it's not meant to sound clever or polished.\n\nIn Launchely, your core message acts as an anchor — something you can come back to when everything else feels scattered.",
          whyThisMattersHere: "Without a clear core message, it's easy for your content and offer to drift. You might explain things differently every time, which can feel confusing — both for you and your audience.\n\nThis step exists to give you one steady reference point so everything else feels easier to say.",
          simpleWayToThink: "Simple beats impressive. Clear beats clever. One sentence is enough. You can refine this later.",
          reassurance: "Your core message doesn't need to sound perfect — it just needs to make sense."
        }
      },
      {
        id: "transformation-statement",
        title: "Writing a Clear Transformation Statement",
        descriptor: "Describing the shift your offer creates",
        category: "messaging",
        content: {
          whatThisIs: "A transformation statement describes the shift someone experiences when they move from where they are now to where they want to be.\n\nIt's not a promise. It's not a guarantee. And it's not about dramatic change.\n\nIn Launchely, this statement helps you clearly connect the problem you're addressing to the outcome you're helping with.",
          whyThisMattersHere: "When people understand the transformation you're guiding them through, your message feels grounded and believable.\n\nThis step exists to help you explain progress, not perfection — so your offer feels realistic and human.",
          simpleWayToThink: "Focus on before → after. Keep the shift realistic. Emotional clarity matters. One transformation is enough.",
          example: "Before:\n\"I feel scattered when it comes to launching.\"\n\nAfter:\n\"I feel clear about what to work on next.\"",
          reassurance: "You don't need to describe a complete life change — small, meaningful shifts are enough."
        }
      },
      {
        id: "objections",
        title: "How to Think About Objections",
        descriptor: "Understanding hesitation as signals, not barriers",
        category: "messaging",
        content: {
          whatThisIs: "Objections are the reasons someone hesitates — not because they don't care, but because they're unsure.\n\nThey're often rooted in:\n\n• doubt\n• timing\n• confidence\n• past experiences\n\nIn Launchely, objections are treated as signals — not barriers.",
          whyThisMattersHere: "When you understand common objections, you can address uncertainty gently instead of trying to convince or persuade.\n\nThis step exists to help you communicate with empathy, not pressure.",
          simpleWayToThink: "Objections are questions, not resistance. Most objections are emotional, not logical. You don't need to answer everything. Clarity reduces hesitation.",
          reassurance: "You don't have to eliminate every objection — acknowledging a few is enough."
        }
      },
      {
        id: "talking-points",
        title: "What Talking Points Are For",
        descriptor: "Building blocks for your content",
        category: "messaging",
        content: {
          whatThisIs: "Talking points are the supporting ideas that make your core message believable and useful. They're the specific angles, stories, and explanations you'll use in your content.",
          whyThisMattersHere: "When you have talking points ready, creating content becomes much easier. You're not starting from scratch — you're drawing from a list.",
          simpleWayToThink: "Your core message is the headline. Talking points are the subheadings that support it.",
          reassurance: "You don't need dozens of talking points. A handful of strong ones will carry your entire launch."
        }
      }
    ]
  },
  {
    id: "funnels-launch",
    name: "Funnels & Launch Paths",
    articles: [
      {
        id: "what-is-funnel",
        title: "What Launchely Means by a Funnel",
        descriptor: "A path, not a machine",
        category: "funnels-launch",
        content: {
          whatThisIs: "In Launchely, a funnel isn't a system, a set of tools, or a technical setup. It's simply the path someone takes from first hearing about your offer to deciding if it's for them.\n\nThat's it.\n\nThere are no automations, no complicated flows, and no optimization layers here. A funnel in Launchely is about clarity — not conversion mechanics.",
          whyThisMattersHere: "Many people feel overwhelmed by funnels because they've been taught to think about them as complex systems. That pressure often causes people to stall or avoid launching altogether.\n\nThis step exists to help you choose a simple path that feels natural for how you want to show up.",
          simpleWayToThink: "A funnel is a path, not a machine. Simpler paths are easier to follow. You can change paths later. The goal is clarity, not optimization.",
          reassurance: "You don't need a \"perfect funnel\" — you just need a clear way for people to take the next step."
        }
      },
      {
        id: "content-to-offer",
        title: "Content → Offer",
        descriptor: "The most direct launch path",
        category: "funnels-launch",
        content: {
          whatThisIs: "Content → Offer is the most direct launch path. You talk about the problem you help with, explain your offer, and invite people to join.\n\nThere's no free resource, no warm-up sequence, and no extra steps. Your content leads straight to your offer.\n\nIn Launchely, this is considered the simplest place to start.",
          whyThisMattersHere: "Many beginners assume they need multiple layers before selling. This funnel exists to remind you that clarity and consistency can be enough.\n\nIf your offer is straightforward and your audience already understands the problem, this path keeps things simple.",
          simpleWayToThink: "Content explains the problem. Content introduces the offer. One clear place to send people. No extra steps required.",
          reassurance: "You're not skipping anything by choosing a simple path — you're reducing friction."
        }
      },
      {
        id: "freebie-email-offer",
        title: "Freebie → Email → Offer",
        descriptor: "Building trust before the ask",
        category: "funnels-launch",
        content: {
          whatThisIs: "This path starts by offering something free and helpful before inviting people into your paid offer.\n\nThe free resource helps people understand the problem more clearly and builds trust before asking them to buy.\n\nIn Launchely, this path focuses on comfort, not complexity.",
          whyThisMattersHere: "Some audiences need more time to feel confident before purchasing. This path gives them a low-pressure way to engage first.\n\nThis step exists to help you warm people up without forcing urgency or heavy sales language.",
          simpleWayToThink: "Free resource builds understanding. Email keeps the conversation going. Offer comes after trust. Simple is still effective.",
          reassurance: "Your free resource doesn't need to be impressive — it just needs to be helpful."
        }
      },
      {
        id: "live-training-offer",
        title: "Live Training → Offer",
        descriptor: "Teaching as the bridge to your offer",
        category: "funnels-launch",
        content: {
          whatThisIs: "Live Training → Offer uses teaching as the bridge to your offer. You host a live session where you explain the problem, share insights, and answer questions.\n\nAt the end, you invite people into your offer if it feels like a fit.\n\nIn Launchely, this path is about connection — not performance.",
          whyThisMattersHere: "Some people communicate best by talking things through. This path allows you to build trust by showing up live and helping in real time.\n\nThis step exists to make selling feel more natural and human.",
          simpleWayToThink: "Teach first, invite second. One session is enough. Clarity matters more than polish. Connection builds trust.",
          reassurance: "You don't need to be perfect on camera — showing up and helping is enough."
        }
      },
      {
        id: "launch-window-explained",
        title: "What a Launch Window Is",
        descriptor: "The focused period when you invite people to buy",
        category: "funnels-launch",
        content: {
          whatThisIs: "A launch window is a specific period of time when your offer is available and you're actively inviting people to buy. It creates natural urgency and gives you a clear end point.",
          whyThisMattersHere: "When you have a launch window, you can focus your energy. You know when you're 'on' and when you can rest.",
          simpleWayToThink: "Think of it like a pop-up shop. The doors open on one day and close on another. That constraint actually makes it easier, not harder.",
          example: "A 7-day launch window means you open enrollment on Monday and close it the following Sunday. During that week, you focus on selling. Before and after, you focus on other things.",
          reassurance: "You can always launch again. This one launch doesn't have to be perfect — it just has to happen."
        }
      },
      {
        id: "application-call",
        title: "Application → Call",
        descriptor: "Inviting conversations before purchasing",
        category: "funnels-launch",
        content: {
          whatThisIs: "Application → Call is a launch path where people apply to talk with you before purchasing.\n\nInstead of selling publicly or sending people straight to a checkout, you invite them into a conversation to see if your offer is a good fit.\n\nIn Launchely, this path is about alignment, not persuasion.",
          whyThisMattersHere: "Some offers work best when there's space to talk things through — especially services, coaching, or higher-touch support.\n\nThis path exists to help you invite conversations without turning your launch into a sales process or pipeline.",
          simpleWayToThink: "Application filters for fit. The call creates clarity. The offer comes after the conversation. Not everyone needs to apply.",
          reassurance: "You don't need to \"sell on the call\" — the conversation itself creates clarity."
        }
      }
    ]
  },
  {
    id: "using-launchely",
    name: "Using Launchely",
    articles: [
      {
        id: "next-best-task",
        title: "What \"Next Best Task\" Means",
        descriptor: "Avoiding decision fatigue with focused guidance",
        category: "using-launchely",
        content: {
          whatThisIs: "The Next Best Task is how Launchely helps you avoid decision fatigue.\n\nInstead of showing you everything that could be done, Launchely highlights one task that makes sense for where you are right now.\n\nYou're never behind — you're just on a path.",
          whyThisMattersHere: "When everything feels important, it's easy to freeze. The Next Best Task exists so you don't have to decide what to work on next — Launchely does that part for you.\n\nThis keeps your energy focused on progress, not planning.",
          simpleWayToThink: "One task is enough. Finishing creates momentum. You don't need the full roadmap. Trust the sequence.",
          reassurance: "If you're working on the task in front of you, you're exactly where you need to be."
        }
      },
      {
        id: "tasks-vs-steps",
        title: "How Tasks Work",
        descriptor: "Understanding guided actions vs. free-form work",
        category: "using-launchely",
        content: {
          whatThisIs: "Tasks in Launchely are guided actions that help you complete each part of your launch. They're not rigid requirements — they're suggestions based on what typically needs to happen next.",
          whyThisMattersHere: "When you're unsure what to do next, tasks give you a clear next step. When you already know what you're doing, you can move faster.",
          simpleWayToThink: "Tasks are like a GPS. They suggest the route, but you can take detours if you need to. The destination is still the same.",
          reassurance: "You don't have to complete every task perfectly. Done is better than perfect, and you can always improve later."
        }
      },
      {
        id: "project-board-basics",
        title: "What the Project Board Is For",
        descriptor: "Seeing all your work in one place",
        category: "using-launchely",
        content: {
          whatThisIs: "The Project Board shows all the tasks related to your launch in columns — to do, in progress, done. It helps you see the bigger picture while staying focused on what's next.",
          whyThisMattersHere: "When you can see everything at once, you feel more in control. Nothing falls through the cracks because it's all visible.",
          simpleWayToThink: "It's like a whiteboard with sticky notes. You move things from left to right as you work on them.",
          reassurance: "The board is a tool, not a taskmaster. Use it however helps you feel organized."
        }
      },
      {
        id: "content-planner-basics",
        title: "How the Content Planner Works",
        descriptor: "Organizing content by purpose, not schedule",
        category: "using-launchely",
        content: {
          whatThisIs: "The Content Planner in Launchely helps you organize what you want to say, not when or where to post it.\n\nIt focuses on intent — like awareness, trust, or inviting people to take the next step — instead of calendars, algorithms, or posting schedules.\n\nThis keeps content planning calm and flexible.",
          whyThisMattersHere: "Many people get stuck trying to plan content perfectly before they ever start sharing. This tool exists to remove that pressure.\n\nBy focusing on why you're posting instead of how often, Launchely helps you stay consistent without burnout.",
          simpleWayToThink: "Content is organized by purpose. You decide when and where to post. Fewer posts can still be effective. Clarity beats volume.",
          reassurance: "You don't need to post everywhere — sharing intentionally is enough."
        }
      },
      {
        id: "post-launch-reflection",
        title: "What Happens After You Launch",
        descriptor: "Pausing to reflect before moving on",
        category: "using-launchely",
        content: {
          whatThisIs: "After a launch, it's common to feel a mix of emotions — relief, excitement, doubt, or even disappointment.\n\nThis article exists to normalize that experience and help you pause before rushing into the next thing.\n\nIn Launchely, post-launch isn't about fixing or optimizing — it's about reflecting.",
          whyThisMattersHere: "Many people immediately move on without acknowledging what they just did. That often leads to burnout or repeating the same patterns.\n\nThis step exists to help you close the loop and decide what actually makes sense next.",
          simpleWayToThink: "Finishing is an achievement. Reflection creates clarity. Not every launch needs a pivot. Pausing is productive.",
          reassurance: "You don't need to have all the answers yet — noticing what you learned is enough."
        }
      },
      {
        id: "one-phase-at-a-time",
        title: "Why You Only See One Phase at a Time",
        descriptor: "Protecting your focus by design",
        category: "using-launchely",
        content: {
          whatThisIs: "In Launchely, you only see one phase of your project at a time on purpose.\n\nYou're not missing anything. Nothing is hidden from you. And there isn't a \"faster\" way you should be taking.\n\nThis design exists to help you focus on what matters right now, without pulling your attention into future decisions before you need to make them.",
          whyThisMattersHere: "When people can see everything at once, it often creates pressure to solve problems out of order.\n\nYou might start worrying about content before your message is clear. Or thinking about launch details before your offer makes sense.\n\nShowing one phase at a time protects you from that mental overload so each decision can be made with more confidence.",
          simpleWayToThink: "Each phase has a single purpose. Future phases don't need your attention yet. You're not falling behind. Focus creates momentum.",
          reassurance: "You're not late, stuck, or missing steps — you're exactly where you need to be right now."
        }
      }
    ]
  }
];

export const getAllArticles = (): LibraryArticle[] => {
  return LIBRARY_CATEGORIES.flatMap(category => category.articles);
};

export const getArticleById = (id: string): LibraryArticle | undefined => {
  return getAllArticles().find(article => article.id === id);
};

export const getCategoryById = (id: string): LibraryCategory | undefined => {
  return LIBRARY_CATEGORIES.find(category => category.id === id);
};

export const searchArticles = (query: string): LibraryArticle[] => {
  const lowerQuery = query.toLowerCase();
  return getAllArticles().filter(article => 
    article.title.toLowerCase().includes(lowerQuery) ||
    article.descriptor.toLowerCase().includes(lowerQuery) ||
    article.content.whatThisIs.toLowerCase().includes(lowerQuery)
  );
};

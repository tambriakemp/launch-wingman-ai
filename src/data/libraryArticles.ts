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
        id: "transformation-statement",
        title: "What a Transformation Statement Is",
        descriptor: "Describing the change your offer creates",
        category: "messaging",
        content: {
          whatThisIs: "A transformation statement describes the journey from where your audience is now to where they'll be after working with you. It's not a tagline or a promise — it's a simple description of change.",
          whyThisMattersHere: "When you can clearly describe the transformation, your audience can see themselves in it. It helps them understand what's actually possible.",
          simpleWayToThink: "Fill in the blank: 'Go from [current state] to [desired state].' That's your transformation in its simplest form.",
          example: "'Go from constantly second-guessing your content to posting with confidence and seeing real engagement.'",
          reassurance: "Transformation statements evolve. The one you write now will get clearer as you learn more about your audience."
        }
      },
      {
        id: "core-message-basics",
        title: "What a Core Message Is",
        descriptor: "The one thing you want people to remember",
        category: "messaging",
        content: {
          whatThisIs: "Your core message is the main idea you want to communicate throughout your launch. It's the thread that ties everything together — your content, your emails, your sales page.",
          whyThisMattersHere: "When you have a clear core message, you don't have to reinvent what to say every time. You just say it in different ways for different moments.",
          simpleWayToThink: "If someone only remembered one thing from your entire launch, what would you want it to be? That's your core message.",
          example: "'You don't need more followers to launch — you need a simple system that works with the audience you already have.'",
          reassurance: "Your core message doesn't need to be clever or catchy. Clear and true is better than creative and confusing."
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
        title: "What a Funnel Actually Is",
        descriptor: "Demystifying the path from stranger to customer",
        category: "funnels-launch",
        content: {
          whatThisIs: "A funnel is simply the path someone takes from first discovering you to buying from you. It's not complicated technology — it's just the steps in order.",
          whyThisMattersHere: "When you can see the path clearly, you know what to build and in what order. It takes the guesswork out of what to create next.",
          simpleWayToThink: "Think of a funnel as a simple journey: someone finds you, they learn something helpful, they trust you more, they decide to buy. That's it.",
          example: "A simple funnel: Someone sees your Instagram post → clicks the link in bio → downloads your free guide → gets emails from you → sees your offer → buys.",
          reassurance: "You don't need a fancy funnel to make sales. Simple funnels often work better because there's less to break."
        }
      },
      {
        id: "funnel-types-overview",
        title: "Why Different Funnel Types Exist",
        descriptor: "Choosing the right path for your offer",
        category: "funnels-launch",
        content: {
          whatThisIs: "Different funnel types exist because different offers and audiences need different paths. A low-ticket course sells differently than a high-ticket service. The funnel type matches how people need to make the buying decision.",
          whyThisMattersHere: "When you choose the right funnel type, the whole launch feels more natural because you're not forcing people through steps that don't make sense for your offer.",
          simpleWayToThink: "Ask yourself: How much does someone need to trust me before they'll buy this? Higher trust = more steps in the funnel. Lower trust = simpler funnel.",
          reassurance: "There's no perfect funnel type. The best one is the one you can actually build and run without burning out."
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
          whatThisIs: "The Next Best Task is Launchely's way of helping you avoid decision fatigue.\n\nInstead of showing you a long list of tasks or everything that needs to be done eventually, Launchely highlights one clear step that makes sense for where you are right now.\n\nYou're never behind. You're just where you are.",
          whyThisMattersHere: "When everything feels important, it's easy to freeze. The Next Best Task exists so you don't have to decide what to work on next — Launchely does that part for you.\n\nThis keeps your attention on progress, not planning.",
          simpleWayToThink: "You don't need to see the whole roadmap. One completed step creates momentum. Finishing beats optimizing. You can trust the sequence.",
          reassurance: "If you're completing the task in front of you, you're doing exactly what you need to do."
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
        title: "What the Content Planner Does",
        descriptor: "Planning your launch content in one place",
        category: "using-launchely",
        content: {
          whatThisIs: "The Content Planner helps you map out what content you'll create for your launch — before, during, and after. It's a simple calendar and list view of your content pieces.",
          whyThisMattersHere: "When your content is planned out, you don't wake up wondering what to post. You just look at the plan and create.",
          simpleWayToThink: "Think of it as a content calendar specifically for your launch. It shows you what's coming up and what you've already done.",
          reassurance: "You don't need to plan months in advance. Even planning a week ahead makes a big difference."
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

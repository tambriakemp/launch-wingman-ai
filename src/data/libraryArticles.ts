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
        id: "what-is-a-project",
        title: "What a Project Actually Is",
        descriptor: "Understanding your project as a container for your launch",
        category: "getting-started",
        content: {
          whatThisIs: "A project in Launchely is simply a container that holds everything related to one specific offer you want to launch. It's not a business plan or a strategy document — it's just a way to keep your launch elements organized in one place.",
          whyThisMattersHere: "When you have one clear container for your work, you don't have to remember where things are. Everything you need for this launch lives here.",
          simpleWayToThink: "Think of a project like a folder on your desk. Inside that folder is everything for one specific thing you're launching — the offer, the audience, the messaging, the content. One folder, one launch.",
          example: "If you're launching a group coaching program, that's one project. If you later want to launch a self-paced course, that would be a different project.",
          reassurance: "You don't need to figure out your whole business here. Just focus on this one thing you're launching right now."
        }
      },
      {
        id: "phases-overview",
        title: "How Phases Work",
        descriptor: "The natural flow from planning to launching",
        category: "getting-started",
        content: {
          whatThisIs: "Phases are the natural stages your project moves through — from initial planning, through messaging and content, to your actual launch. They're not deadlines or requirements, just a way to see where you are.",
          whyThisMattersHere: "Knowing which phase you're in helps you focus on the right kind of work at the right time, instead of trying to do everything at once.",
          simpleWayToThink: "Phases are like chapters in a book. You work through them in order, but you can always flip back if you need to. Each chapter builds on what came before.",
          reassurance: "There's no timer. You move through phases at your own pace, and you can always revisit earlier work if something needs to change."
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
          whatThisIs: "A dream outcome is the future state your audience wants to reach. It's not what you teach or what you deliver — it's what life looks like for them after they've achieved the result.",
          whyThisMattersHere: "When you're clear on the dream outcome, everything else gets easier. Your messaging, your offer, your content — it all points toward this one destination.",
          simpleWayToThink: "Imagine your ideal client waking up one morning after working with you. What's different? What do they notice? That's the dream outcome.",
          example: "Instead of 'learn to manage time better,' the dream outcome might be 'finally have evenings free to spend with family without feeling guilty about work.'",
          reassurance: "You don't need the perfect words yet. Just get close to what your audience actually wants — you can refine it as you go."
        }
      },
      {
        id: "pain-points-explained",
        title: "Pain Points vs. Symptoms",
        descriptor: "Understanding what your audience feels right now",
        category: "planning-offers",
        content: {
          whatThisIs: "Pain points are the core problems your audience faces. Symptoms are the specific, daily ways those problems show up in their lives. Both matter, but symptoms are often more useful for messaging.",
          whyThisMattersHere: "When you describe symptoms, your audience feels seen. When you only describe pain points, it can feel too abstract.",
          simpleWayToThink: "The pain point is 'I'm overwhelmed.' The symptoms are 'I can't sleep because my to-do list keeps running through my head' or 'I snap at my kids because I'm exhausted.'",
          reassurance: "You don't need to list every symptom. A few specific ones that resonate are more powerful than a long generic list."
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

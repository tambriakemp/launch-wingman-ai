import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { DashboardMockup } from "@/components/landing/screenshots/DashboardMockup";
import { TransformationMockup } from "@/components/landing/screenshots/TransformationMockup";
import { TasksMockup } from "@/components/landing/screenshots/TasksMockup";
import { PlannerMockup } from "@/components/landing/screenshots/PlannerMockup";
import { AIStudioMockup } from "@/components/landing/screenshots/AIStudioMockup";
import { SocialHubMockup } from "@/components/landing/screenshots/SocialHubMockup";
import { ContentVaultMockup } from "@/components/landing/screenshots/ContentVaultMockup";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, Plus } from "lucide-react";

const painPoints = [
  "Bought a course but never finished it",
  "Overwhelmed by all the steps to launch",
  "Spent thousands and still feel stuck",
  "Can't write sales copy that converts",
  "No clue what funnel type to use",
  "Wasting hours on things AI could do in seconds",
];

const oldVsNew = {
  old: [
    "Buy a $2,000 course",
    "Watch 40+ hours of videos",
    "Figure it out yourself",
    "Piece together templates",
    "Hope you don't miss anything",
  ],
  new: [
    "Start in 5 minutes",
    "AI generates your assets",
    "Guided step-by-step process",
    "Everything in one place",
    "Clear checklist of what to do",
  ],
};

const launchFeatures = [
  "Choose from 7 proven funnel paths — freebie, webinar, challenge, and more",
  "Configure your offer stack with pricing, bonuses, and urgency built in",
  "Follow a phase-by-phase checklist tailored to your funnel type",
  "Validate launch readiness with assessments before you go live",
];

const marketingFeatures = [
  "AI Studio — talking-head vlogs from a script with your own avatar and voice",
  "AI sales copy for every funnel page — headlines, bullets, CTAs, and guarantees",
  "Hook generator and carousel builder with proven psychological frameworks",
  "30-day social content planner with daily prompts and one-click scheduling",
  "Email sequence generator — welcome, launch, nurture, and cart-close flows",
];

const resourceFeatures = [
  "Browse Social Media, Email Marketing, Branding, LUTs, AI Prompts and more",
  "Ready-to-use Canva templates, swipe files, ebooks, and checklists",
  "AI image and video prompts you can copy and use instantly",
  "New resources added regularly — your vault keeps growing",
];

const planningFeatures = [
  "Weekly calendar view — schedule tasks, events, and deadlines",
  "Set measurable goals with quantifiable targets you can track over time",
  "Daily priorities and to-do lists to keep every day focused",
  "Habit tracker with streaks — build routines that stick",
  "Brain dump — capture ideas on the fly and promote them to tasks",
];

const aiFeatures = [
  {
    title: "Transformation statements",
    description: "Generate punchy bios and detailed sales-page language from your offer data.",
  },
  {
    title: "Sales copy generator",
    description: "Complete sales page copy — headlines, bullets, objections, CTAs — all from your funnel.",
  },
  {
    title: "Audience insights",
    description: "AI-generated sub-audiences, pain points, and buying triggers for sharper targeting.",
  },
  {
    title: "Content & offer ideas",
    description: "Offer titles, content hooks, social drafts, and email subject lines on demand.",
  },
];

const steps = [
  {
    number: "01",
    title: "Take the assessment",
    description: "Answer a few questions about your business, audience, and offer. We'll identify your launch readiness.",
  },
  {
    number: "02",
    title: "Follow your plan",
    description: "Launchely builds your personalized launch roadmap — funnel, copy, content calendar, and task list.",
  },
  {
    number: "03",
    title: "Launch with confidence",
    description: "Execute step-by-step with AI-generated assets, brand-ready visuals, and a clear timeline.",
  },
];

const audiences = [
  ["Online coaches", "Course creators", "Digital product sellers", "Membership owners"],
  ["Consultants", "Service providers", "Community builders", "Content creators"],
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with your first launch.",
    cta: "Start free",
    ctaLink: "/auth?tab=signup",
    popular: false,
    features: [
      "1 active project",
      "Full Planning & Messaging tasks",
      "Funnel type selection",
      "Offer stack mapping",
      "5 AI content ideas / day",
      "Up to 5 saved drafts",
      "Phase snapshot (view only)",
    ],
  },
  {
    name: "Content Vault",
    price: "$7",
    period: "/mo",
    description: "Premium templates, guides, and resources.",
    cta: "Get vault access",
    ctaLink: "/checkout?tier=content_vault",
    popular: false,
    features: [
      "Everything in Free",
      "Content Vault access",
      "Premium templates & guides",
      "Canva templates library",
      "Swipe files & examples",
      "LUTs & color presets",
    ],
  },
  {
    name: "Pro",
    price: "$25",
    period: "/mo",
    description: "Everything you need to launch like a pro.",
    cta: "Go Pro",
    ctaLink: "/checkout",
    popular: true,
    features: [
      "Unlimited projects",
      "Unlimited AI content ideas",
      "Unlimited saved drafts",
      "Full sales copy builder",
      "Social media scheduling",
      "Phase snapshot + export",
      "Relaunch mode",
      "Insights & analytics history",
    ],
  },
  {
    name: "Advanced",
    price: "$49",
    period: "/mo",
    description: "Full marketing suite for scaling your business.",
    cta: "Go Advanced",
    ctaLink: "/checkout?tier=advanced",
    popular: false,
    features: [
      "Everything in Pro",
      "Campaigns manager",
      "Social planner",
      "Ideas bank",
      "AI Studio",
      "Marketing analytics",
      "Priority support",
    ],
  },
];

const faqs = [
  {
    q: "Is Launchely really free to start?",
    a: "Yes. The free plan gives you access to assessments, one project, and core planning tools. Upgrade anytime for AI features, unlimited projects, and the Content Vault.",
  },
  {
    q: "Do I need tech skills to use this?",
    a: "Not at all. Launchely is designed for non-technical coaches and creators. If you can fill out a form, you can launch.",
  },
  {
    q: "How is this different from a launch course?",
    a: "Courses teach you theory. Launchely does the work with you — AI writes your copy, builds your plan, and gives you a checklist to follow.",
  },
  {
    q: "Can I use my own branding?",
    a: "Absolutely. Upload your logos, set your colors and fonts, and every generated asset will match your brand.",
  },
  {
    q: "What if I've already launched before?",
    a: "Even better. Use the Relaunch feature to analyze what worked, keep winning assets, and iterate for your next launch.",
  },
  {
    q: "Does it replace my funnel software?",
    a: "No — Launchely plans and prepares your launch. You'll still use your funnel platform (Kajabi, ThriveCart, etc.) to build the actual pages.",
  },
  {
    q: "Can I upgrade or downgrade at any time?",
    a: "Yes. You can upgrade at any time and get instant access. If you downgrade, you'll keep access until the end of your billing period.",
  },
  {
    q: "Do you offer refunds?",
    a: "We don't offer refunds. We provide a free plan so you can experience the platform before upgrading. All sales are final.",
  },
];

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="eyebrow flex items-center justify-center gap-2 mb-6">
    <span className="w-1.5 h-1.5 rotate-45 bg-accent" />
    <span>{children}</span>
    <span className="w-1.5 h-1.5 rotate-45 bg-accent" />
  </div>
);

const Landing = () => {
  return (
    <div className="landing-theme font-sans min-h-screen scroll-smooth">
      <LandingHeader />

      {/* ===== HERO ===== */}
      <section className="pt-36 pb-20 lg:pt-44 lg:pb-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Eyebrow>AI-Powered · Built for Coaches & Creators</Eyebrow>

            <motion.h1
              className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.05] tracking-tight text-foreground mb-7"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Stop buying courses.
              <br />
              <span className="italic text-accent font-medium">Start launching.</span>
            </motion.h1>

            <motion.p
              className="font-serif italic text-xl md:text-2xl text-foreground/70 mb-10 max-w-2xl mx-auto leading-snug"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              The AI-powered platform that replaces expensive launch courses — plan, brand, write, and ship your next digital product launch in one place.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                to="/auth?tab=signup"
                className="text-foreground font-medium underline-offset-4 underline decoration-accent decoration-2 hover:decoration-foreground transition-colors"
              >
                Start free today
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border hairline text-foreground hover:bg-card transition-colors"
              >
                See features <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>

            <motion.p
              className="text-sm text-foreground/50 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              No credit card required · Cancel anytime
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="max-w-5xl mx-auto mt-16"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <MarqueeStrip />

      {/* ===== SOUND FAMILIAR ===== */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Eyebrow>Sound Familiar?</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground tracking-tight max-w-3xl mx-auto">
              You're not alone. Most creators hit these walls{" "}
              <span className="italic text-accent">before</span> their first launch.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {painPoints.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
                className="bg-card hairline border rounded-2xl p-6 flex items-start gap-4"
              >
                <span className="mt-1 text-accent font-serif text-xl leading-none">✕</span>
                <span className="text-foreground/80">{p}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== THE SHIFT (Old vs New) ===== */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Eyebrow>The Shift</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground tracking-tight max-w-3xl mx-auto">
              Everything you need.{" "}
              <span className="italic text-accent">Nothing you don't.</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto bg-card hairline border rounded-3xl overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 lg:p-10 border-b md:border-b-0 md:border-r hairline">
                <h3 className="font-serif italic text-2xl text-foreground/60 mb-6">The old way</h3>
                <ul className="space-y-4">
                  {oldVsNew.old.map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-3 pb-4 ${
                        i < oldVsNew.old.length - 1 ? "border-b hairline" : ""
                      }`}
                    >
                      <span className="text-accent font-serif text-lg leading-none mt-0.5">✕</span>
                      <span className="text-foreground/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-8 lg:p-10">
                <h3 className="font-serif italic text-2xl text-foreground mb-6">The Launchely way</h3>
                <ul className="space-y-4">
                  {oldVsNew.new.map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-3 pb-4 ${
                        i < oldVsNew.new.length - 1 ? "border-b hairline" : ""
                      }`}
                    >
                      <span className="text-foreground font-serif text-lg leading-none mt-0.5">✓</span>
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURE PILLARS ===== */}
      <div id="features">
        <FeatureBlock
          eyebrow="Launch"
          headlineLead="Your step-by-step launch plan."
          headlineAccent="No course required."
          lede="Stop buying courses that leave you overwhelmed. Launchely guides you through every step — pick your funnel, configure your offer, check off each phase, and validate you're ready before you go live."
          features={launchFeatures}
          mockup={<TasksMockup />}
        />

        <FeatureBlock
          eyebrow="Marketing"
          headlineLead="Create content that converts."
          headlineAccent="Videos that connect."
          lede="From AI-generated vlogs to full sales pages, Launchely's marketing suite writes, designs, and schedules your launch content — all powered by your audience data."
          features={marketingFeatures}
          mockup={
            <div className="space-y-6">
              <AIStudioMockup />
              <SocialHubMockup />
            </div>
          }
          reversed
        />

        <FeatureBlock
          eyebrow="Resources"
          headlineLead="Your content vault."
          headlineAccent="Always growing."
          lede="Stop creating from scratch. The Content Vault gives you a growing library of templates, guides, AI prompts, LUTs, and done-for-you assets organized by category."
          features={resourceFeatures}
          mockup={<ContentVaultMockup />}
        />

        <FeatureBlock
          eyebrow="Planning"
          headlineLead="Stay organized. Stay on track."
          headlineAccent="Stay accountable."
          lede="Launching is a marathon, not a sprint. Launchely's built-in planner keeps your lifestyle, habits, and business in order — so nothing falls through the cracks."
          features={planningFeatures}
          mockup={<PlannerMockup />}
          reversed
        />
      </div>

      {/* ===== POWERED BY AI ===== */}
      <section className="py-24 lg:py-32 border-t hairline">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Eyebrow>Powered by AI</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground tracking-tight mb-5">
              Your AI <span className="italic text-accent">launch team.</span>
            </h2>
            <p className="font-serif italic text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
              Not just buzzwords. Real AI tools that save you hours of work on every launch.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto mb-16">
            {aiFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-card hairline border rounded-2xl p-6"
              >
                <h3 className="font-serif text-xl text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
          <div className="max-w-3xl mx-auto">
            <TransformationMockup />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Eyebrow>How It Works</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground tracking-tight max-w-3xl mx-auto">
              Three simple steps from{" "}
              <span className="italic text-accent">idea to launch.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 lg:gap-16 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={s.number}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="font-serif text-5xl text-foreground/15 mb-4">{s.number}</div>
                <h3 className="font-serif text-2xl text-foreground mb-3">{s.title}</h3>
                <p className="text-foreground/70 leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BUILT FOR YOU ===== */}
      <section className="py-24 lg:py-32 border-t hairline">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Eyebrow>Built for You</Eyebrow>
          <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground tracking-tight mb-12">
            For the people who <span className="italic text-accent">build the work.</span>
          </h2>
          <div className="space-y-3 max-w-3xl mx-auto mb-20">
            {audiences.map((row, i) => (
              <div
                key={i}
                className="flex flex-wrap justify-center items-baseline gap-x-8 gap-y-2 font-serif text-2xl md:text-3xl text-foreground/80"
              >
                {row.map((name, j) => (
                  <span key={name} className="flex items-baseline gap-8">
                    <span>{name}</span>
                    {j < row.length - 1 && (
                      <span className="text-accent">·</span>
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <blockquote className="max-w-3xl mx-auto">
            <p className="font-serif italic text-2xl md:text-3xl leading-relaxed text-foreground/85">
              "I went from a vague idea in a Google Doc to a fully launched coaching program in{" "}
              <span className="text-accent not-italic font-medium">under two weeks.</span>{" "}
              Launchely did the heavy lifting — I just executed."
            </p>
            <footer className="mt-6 text-sm text-foreground/60">
              — Sarah Chen, Mindset Coach
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-24 lg:py-32 border-t hairline">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground tracking-tight mb-5">
              Simple, <span className="italic text-accent">transparent.</span>
            </h2>
            <p className="font-serif italic text-lg md:text-xl text-foreground/70 max-w-xl mx-auto">
              No hidden fees. No surprise charges. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="eyebrow bg-card hairline border px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div
                  className={`h-full bg-card border rounded-3xl p-7 flex flex-col ${
                    plan.popular ? "border-accent" : "hairline"
                  }`}
                >
                  <h3 className="font-serif italic text-2xl text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="font-serif text-5xl font-medium text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-sm text-foreground/60">{plan.period}</span>
                  </div>
                  <p className="text-sm text-foreground/70 mb-6 min-h-[2.5rem]">
                    {plan.description}
                  </p>

                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <span className="text-accent mt-2 w-1 h-1 rounded-full bg-accent shrink-0" />
                        <span className="text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={plan.ctaLink}
                    className={`block text-center w-full px-5 py-3 rounded-full text-sm font-medium transition-colors ${
                      plan.popular
                        ? "bg-foreground text-background hover:opacity-90"
                        : "border hairline text-foreground hover:bg-muted"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-24 lg:py-32 border-t hairline">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground tracking-tight">
              Frequently asked <span className="italic text-accent">questions.</span>
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-0">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="faq-row border-b hairline border-t-0 border-l-0 border-r-0"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-6 group [&>svg]:hidden">
                    <span className="font-serif text-lg md:text-xl text-foreground pr-6">
                      {faq.q}
                    </span>
                    <span className="text-2xl text-accent leading-none transition-transform group-data-[state=open]:rotate-45">
                      <Plus className="w-5 h-5" strokeWidth={1.5} />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/70 pb-6 pr-10 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-28 lg:py-40 border-t hairline">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Eyebrow>Ready to Launch?</Eyebrow>
          <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium text-foreground tracking-tight leading-[1.05] mb-10 max-w-4xl mx-auto">
            Stop watching.
            <br />
            <span className="italic text-accent">Start shipping.</span>
          </h2>
          <Link
            to="/auth?tab=signup"
            className="inline-flex items-center gap-2 text-lg font-medium text-foreground underline underline-offset-4 decoration-accent decoration-2 hover:decoration-foreground transition-colors"
          >
            Start free today <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

interface FeatureBlockProps {
  eyebrow: string;
  headlineLead: string;
  headlineAccent: string;
  lede: string;
  features: string[];
  mockup: React.ReactNode;
  reversed?: boolean;
}

const FeatureBlock = ({
  eyebrow,
  headlineLead,
  headlineAccent,
  lede,
  features,
  mockup,
  reversed,
}: FeatureBlockProps) => {
  return (
    <section className="py-20 lg:py-28 border-t hairline">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: reversed ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={reversed ? "lg:order-2" : ""}
          >
            <div className="eyebrow mb-5">{eyebrow}</div>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground tracking-tight leading-[1.1] mb-5">
              {headlineLead}{" "}
              <span className="italic text-accent">{headlineAccent}</span>
            </h2>
            <p className="font-serif italic text-lg text-foreground/70 mb-8 leading-relaxed">
              {lede}
            </p>
            <ul className="space-y-3.5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-accent font-serif text-lg leading-none mt-1">✓</span>
                  <span className="text-foreground/85">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: reversed ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={reversed ? "lg:order-1" : ""}
          >
            {mockup}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Landing;

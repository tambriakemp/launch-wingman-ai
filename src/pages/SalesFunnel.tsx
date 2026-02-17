import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, CheckCircle2, X, Sparkles, Zap, Target, 
  PenTool, LayoutGrid, Calendar, Palette, Brain, 
  MessageSquare, FileText, TrendingUp, Users, Rocket,
  ChevronRight
} from "lucide-react";
import { LaunchelyLogo } from "@/components/ui/LaunchelyLogo";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { DashboardMockup } from "@/components/landing/screenshots/DashboardMockup";
import { FunnelBuilderMockup } from "@/components/landing/screenshots/FunnelBuilderMockup";
import { SalesCopyMockup } from "@/components/landing/screenshots/SalesCopyMockup";
import { TasksMockup } from "@/components/landing/screenshots/TasksMockup";
import { SocialHubMockup } from "@/components/landing/screenshots/SocialHubMockup";
import { BrandingMockup } from "@/components/landing/screenshots/BrandingMockup";
import { TransformationMockup } from "@/components/landing/screenshots/TransformationMockup";
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const CTA_LINK = "/auth?tab=signup";

const CTAButton = ({ size = "lg", className = "" }: { size?: "lg" | "default"; className?: string }) => (
  <Button asChild size={size} className={`bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all ${className}`}>
    <Link to={CTA_LINK}>
      Start Free Today <ArrowRight className="ml-2 h-5 w-5" />
    </Link>
  </Button>
);

/* ───────────────────── SECTION 1: HERO ───────────────────── */
const HeroSection = () => (
  <section className="relative bg-primary text-primary-foreground pt-32 pb-20 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(47_96%_53%/0.08),transparent_60%)]" />
    <div className="container mx-auto px-4 relative z-10">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-4xl mx-auto">
        <motion.p variants={fadeUp} className="text-accent font-semibold tracking-wide uppercase text-sm mb-4">
          Stop Learning. Start Launching.
        </motion.p>
        <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
          You Don't Need Another Course{" "}
          <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg inline-block mt-2">to Launch</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Launchely gives you the exact plan, copy, content, and tools to launch your coaching offer — without buying another $2,000 course.
        </motion.p>
        <motion.div variants={fadeUp}>
          <CTAButton />
          <p className="text-sm text-muted-foreground mt-4">Free forever plan. No credit card required.</p>
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.7 }} className="max-w-5xl mx-auto mt-16">
        <DashboardMockup />
      </motion.div>
    </div>
  </section>
);

/* ───────────────────── SECTION 2: PROBLEM AGITATION ───────────────────── */
const painPoints = [
  { emoji: "📚", text: "You've bought courses that are collecting digital dust" },
  { emoji: "⏰", text: "You've spent months 'getting ready' but still haven't launched" },
  { emoji: "😵", text: "You're overwhelmed by conflicting advice from 10 different gurus" },
  { emoji: "💸", text: "You've invested thousands in programs that gave you theory, not action" },
  { emoji: "🔄", text: "You keep going in circles — planning, second-guessing, restarting" },
  { emoji: "😩", text: "You know your offer can help people, but you can't get it out there" },
];

const ProblemSection = () => (
  <section className="py-20 md:py-28 bg-primary">
    <div className="container mx-auto px-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto text-center">
        <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-4">
          Sound familiar?
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground text-lg mb-12">
          You're not lazy. You're not behind. You just don't need more information — you need a system.
        </motion.p>
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {painPoints.map((p, i) => (
          <motion.div key={i} variants={fadeUp} className="bg-card/50 border border-border/30 rounded-xl p-5 flex items-start gap-3">
            <span className="text-2xl shrink-0">{p.emoji}</span>
            <p className="text-primary-foreground/90 text-sm leading-relaxed">{p.text}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ───────────────────── SECTION 3: BRIDGE / SOLUTION ───────────────────── */
const BridgeSection = () => (
  <section className="py-20 md:py-28 bg-primary border-t border-border/10">
    <div className="container mx-auto px-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-6">
            What if you could skip the course and{" "}
            <span className="text-accent">go straight to launching?</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Launchely replaces the course, the copywriter, the social media manager, and the project manager — with one intelligent platform that walks you through every step.
          </motion.p>
        </div>
        <motion.div variants={fadeUp}>
          <FunnelBuilderMockup />
        </motion.div>
      </motion.div>
    </div>
  </section>
);

/* ───────────────────── SECTION 4: FEATURE WALKTHROUGH ───────────────────── */
const features = [
  {
    title: "AI-Powered Sales Copy",
    subtitle: "Sales pages that convert — written for you",
    description: "Stop staring at a blank page. Launchely's AI generates persuasive sales copy tailored to your audience, your offer, and your voice. Headlines, bullet points, CTAs — done in minutes.",
    mockup: <SalesCopyMockup />,
  },
  {
    title: "Smart Funnel Planning",
    subtitle: "Your entire funnel, mapped out and ready",
    description: "Choose from 8+ proven funnel types. Launchely builds your complete funnel strategy — from lead magnet to checkout — with every asset and page planned for you.",
    mockup: <FunnelBuilderMockup />,
  },
  {
    title: "Step-by-Step Task Board",
    subtitle: "Know exactly what to do next",
    description: "No more guessing. Your personalized task board breaks your entire launch into clear, actionable steps. Just follow the sequence and check things off as you go.",
    mockup: <TasksMockup />,
  },
  {
    title: "Social Content Planner",
    subtitle: "Plan, create, and schedule launch content",
    description: "AI-generated content ideas for every phase of your launch — pre-launch, launch week, and post-launch. Plan your social calendar and publish directly to Pinterest, Instagram, and Facebook.",
    mockup: <SocialHubMockup />,
  },
  {
    title: "Brand Kit Builder",
    subtitle: "Professional branding without a designer",
    description: "Upload your logo, set your colors and fonts, and Launchely keeps everything consistent across your entire launch. Look polished and professional from day one.",
    mockup: <BrandingMockup />,
  },
];

const FeatureWalkthrough = () => (
  <section className="py-20 md:py-28 bg-primary border-t border-border/10">
    <div className="container mx-auto px-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
        <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-4">
          Everything you need.{" "}
          <span className="text-accent">Nothing you don't.</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Each tool is built specifically for coaches and creators who want to launch — not learn about launching.
        </motion.p>
      </motion.div>

      <div className="max-w-6xl mx-auto space-y-24">
        {features.map((f, i) => (
          <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={stagger}
            className={`flex flex-col ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-10 lg:gap-16 items-center`}>
            <motion.div variants={fadeUp} className="flex-1 space-y-4">
              <p className="text-accent font-semibold text-sm uppercase tracking-wide">{f.subtitle}</p>
              <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex-1 w-full">
              {f.mockup}
            </motion.div>
          </motion.div>
        ))}
      </div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mt-20">
        <CTAButton />
      </motion.div>
    </div>
  </section>
);

/* ───────────────────── SECTION 5: OLD WAY VS LAUNCHELY WAY ───────────────────── */
const oldWay = [
  "Buy a $2,000 launch course",
  "Hire a copywriter ($1,500+)",
  "Hire a designer ($500+)",
  "Figure out your funnel alone",
  "Manage tasks in scattered docs",
  "Spend 6+ months preparing",
];
const newWay = [
  "AI writes your sales copy instantly",
  "Step-by-step guided launch plan",
  "Brand kit built into the platform",
  "8+ proven funnel types to choose from",
  "Organized task board with deadlines",
  "Launch in weeks, not months",
];

const ComparisonSection = () => (
  <section className="py-20 md:py-28 bg-card/30 border-t border-border/10">
    <div className="container mx-auto px-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
        <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-4">
          The Old Way vs{" "}
          <span className="text-accent">The Launchely Way</span>
        </motion.h2>
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <motion.div variants={fadeUp} className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-destructive mb-6 flex items-center gap-2">
            <X className="h-6 w-6" /> The Old Way
          </h3>
          <ul className="space-y-4">
            {oldWay.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-muted-foreground">
                <X className="h-4 w-4 text-destructive shrink-0 mt-1" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div variants={fadeUp} className="bg-accent/10 border border-accent/30 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-accent mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6" /> The Launchely Way
          </h3>
          <ul className="space-y-4">
            {newWay.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-primary-foreground">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-1" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

/* ───────────────────── SECTION 6: HOW IT WORKS ───────────────────── */
const steps = [
  { num: "01", title: "Take a Quick Assessment", desc: "Answer a few questions about your offer, audience, and goals. Launchely uses your answers to build a personalized launch plan." },
  { num: "02", title: "Follow Your Launch Plan", desc: "Your custom task board shows you exactly what to do — from sales copy to social content. AI handles the heavy lifting." },
  { num: "03", title: "Launch With Confidence", desc: "Hit publish knowing every piece is in place. Sales page, email sequence, social content — all done and ready to go." },
];

const HowItWorksSection = () => (
  <section className="py-20 md:py-28 bg-primary border-t border-border/10">
    <div className="container mx-auto px-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
        <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-4">
          Three steps to{" "}
          <span className="text-accent">your next launch</span>
        </motion.h2>
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {steps.map((s) => (
          <motion.div key={s.num} variants={fadeUp} className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-accent-foreground text-2xl font-extrabold mx-auto">{s.num}</div>
            <h3 className="text-xl font-bold text-primary-foreground">{s.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </motion.div>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mt-14">
        <CTAButton />
      </motion.div>
    </div>
  </section>
);

/* ───────────────────── SECTION 7: AI FEATURES ───────────────────── */
const aiFeatures = [
  { icon: PenTool, label: "Sales Copy Generator" },
  { icon: MessageSquare, label: "Social Bio Writer" },
  { icon: FileText, label: "Email Sequence Builder" },
  { icon: Target, label: "Audience Targeting" },
  { icon: Sparkles, label: "Transformation Statement" },
  { icon: Calendar, label: "Content Calendar AI" },
  { icon: Brain, label: "Launch Strategy" },
  { icon: LayoutGrid, label: "Funnel Architecture" },
];

const AISection = () => (
  <section className="py-20 md:py-28 bg-card/30 border-t border-border/10">
    <div className="container mx-auto px-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-14 items-center">
          <motion.div variants={fadeUp} className="flex-1 space-y-6">
            <p className="text-accent font-semibold text-sm uppercase tracking-wide">AI-Powered Everything</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary-foreground">
              Your AI launch team.{" "}
              <span className="text-accent">No prompts required.</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Forget copy-pasting ChatGPT prompts. Launchely's AI is trained on proven launch frameworks and writes copy that actually converts — personalized to your offer, audience, and voice.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {aiFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-primary-foreground/80">
                  <f.icon className="h-4 w-4 text-accent shrink-0" />
                  {f.label}
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="flex-1 w-full">
            <TransformationMockup />
          </motion.div>
        </div>
      </motion.div>
    </div>
  </section>
);

/* ───────────────────── SECTION 8: SOCIAL PROOF / TRUST ───────────────────── */
const audiences = [
  "Life & Mindset Coaches",
  "Business Coaches & Consultants",
  "Health & Wellness Coaches",
  "Course Creators & Educators",
  "Fitness & Nutrition Coaches",
  "Relationship & Dating Coaches",
  "Career & Leadership Coaches",
  "Online Service Providers",
];

const stats = [
  { value: "AI-Powered", label: "Launch Assistant" },
  { value: "8+", label: "Funnel Types" },
  { value: "All-in-One", label: "Platform" },
];

const TrustSection = () => (
  <section className="py-20 md:py-28 bg-primary border-t border-border/10">
    <div className="container mx-auto px-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
        <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-4">
          Built for <span className="text-accent">coaches, creators, and entrepreneurs</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Whether you're launching your first offer or your fifteenth, Launchely adapts to you.
        </motion.p>
      </motion.div>

      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
        <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3 mb-14">
          {audiences.map((a, i) => (
            <span key={i} className="bg-accent/10 text-accent border border-accent/20 px-4 py-2 rounded-full text-sm font-medium">
              {a}
            </span>
          ))}
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-accent">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  </section>
);

/* ───────────────────── SECTION 9: FAQ ───────────────────── */
const faqs = [
  { q: "Is Launchely really free?", a: "Yes. The free plan gives you access to core features including assessments, funnel planning, and your task board. You can launch your first offer without paying a dime." },
  { q: "I'm not tech-savvy. Can I still use this?", a: "Absolutely. Launchely was built for coaches, not developers. Everything is guided, visual, and designed to be as simple as following a recipe." },
  { q: "How is this different from a launch course?", a: "Courses teach you theory. Launchely gives you the tools to execute. Instead of watching 40 hours of video, you get a personalized plan with AI that writes your copy, plans your content, and tells you exactly what to do next." },
  { q: "What kind of offers can I launch?", a: "Launchely supports 8+ funnel types including webinar funnels, challenge funnels, mini-course funnels, coaching program funnels, and more. If you sell knowledge or transformation, Launchely works for you." },
  { q: "Do I need to know how to write copy?", a: "No. Launchely's AI generates your sales page copy, email sequences, and social content for you — based on proven frameworks and tailored to your specific offer and audience." },
  { q: "Can I use Launchely for multiple launches?", a: "Yes! Once your first launch is complete, you can relaunch with optimized copy and strategy, or start a brand new project for a different offer." },
];

const FAQSection = () => (
  <section className="py-20 md:py-28 bg-card/30 border-t border-border/10">
    <div className="container mx-auto px-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto">
        <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-primary-foreground text-center mb-12">
          Got questions?
        </motion.h2>
        <motion.div variants={fadeUp}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card/50 border border-border/30 rounded-xl px-6 overflow-hidden">
                <AccordionTrigger className="text-primary-foreground font-semibold text-left hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

/* ───────────────────── SECTION 10: FINAL CTA ───────────────────── */
const FinalCTA = () => (
  <section className="py-24 md:py-32 bg-primary border-t border-border/10">
    <div className="container mx-auto px-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-3xl mx-auto">
        <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground mb-6">
          Your Next Launch{" "}
          <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg inline-block">Starts Here</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-muted-foreground text-lg mb-10">
          Stop overthinking. Stop over-preparing. Start launching.
        </motion.p>
        <motion.div variants={fadeUp}>
          <CTAButton size="lg" className="text-lg px-12 py-7" />
          <p className="text-sm text-muted-foreground mt-5">Free forever plan. No credit card required.</p>
        </motion.div>
        <motion.div variants={fadeUp} className="mt-14 flex justify-center">
          <LaunchelyLogo size="lg" textClassName="text-primary-foreground" />
        </motion.div>
      </motion.div>
    </div>
  </section>
);

/* ───────────────────── STICKY HEADER ───────────────────── */
const StickyHeader = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-border/10">
    <div className="container mx-auto px-4 flex items-center justify-between h-16">
      <Link to="/">
        <LaunchelyLogo size="sm" textClassName="text-primary-foreground" />
      </Link>
      <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-lg">
        <Link to={CTA_LINK}>
          Start Free <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </Button>
    </div>
  </header>
);

/* ───────────────────── PAGE ───────────────────── */
const SalesFunnel = () => (
  <div className="min-h-screen bg-primary">
    <StickyHeader />
    <HeroSection />
    <ProblemSection />
    <BridgeSection />
    <FeatureWalkthrough />
    <ComparisonSection />
    <HowItWorksSection />
    <AISection />
    <TrustSection />
    <FAQSection />
    <FinalCTA />
    <LandingFooter />
  </div>
);

export default SalesFunnel;

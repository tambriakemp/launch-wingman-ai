import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, CheckCircle2, X, Sparkles, Zap, Target, 
  PenTool, LayoutGrid, Calendar, Palette, Brain, 
  MessageSquare, FileText, TrendingUp, Users, Rocket,
  ChevronRight
} from "lucide-react";
import { LaunchelyLogo } from "@/components/ui/LaunchelyLogo";

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
        <motion.p variants={fadeUp} className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
          Launchely gives you the exact plan, copy, content, and tools to launch your coaching offer — without buying another $2,000 course.
        </motion.p>
        <motion.div variants={fadeUp}>
          <CTAButton />
          <p className="text-sm text-primary-foreground/70 mt-4">Free forever plan. No credit card required.</p>
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
        <motion.p variants={fadeUp} className="text-primary-foreground/80 text-lg mb-12">
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
        <motion.p variants={fadeUp} className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
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
        <motion.p variants={fadeUp} className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
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
              <p className="text-primary-foreground/80 leading-relaxed">{f.description}</p>
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
  <section className="py-20 md:py-28 bg-white border-t border-border/10">
    <div className="container mx-auto px-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
        <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-primary mb-4">
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
              <li key={i} className="flex items-start gap-3 text-primary/70">
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
              <li key={i} className="flex items-start gap-3 text-primary">
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
            <p className="text-primary-foreground/80 text-sm leading-relaxed">{s.desc}</p>
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
  <section className="py-20 md:py-28 bg-white border-t border-border/10">
    <div className="container mx-auto px-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-14 items-center">
          <motion.div variants={fadeUp} className="flex-1 space-y-6">
            <p className="text-accent font-semibold text-sm uppercase tracking-wide">AI-Powered Everything</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary">
              Your AI launch team.{" "}
              <span className="text-accent">No prompts required.</span>
            </h2>
            <p className="text-primary/70 leading-relaxed">
              Forget copy-pasting ChatGPT prompts. Launchely's AI is trained on proven launch frameworks and writes copy that actually converts — personalized to your offer, audience, and voice.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {aiFeatures.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-primary/80">
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
        <motion.p variants={fadeUp} className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
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
              <div className="text-sm text-primary-foreground/70 mt-1">{s.label}</div>
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
  <section className="py-20 md:py-28 bg-white border-t border-border/10">
    <div className="container mx-auto px-4">
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto">
        <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold text-primary text-center mb-12">
          Got questions?
        </motion.h2>
        <motion.div variants={fadeUp}>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-gray-50 border border-gray-200 rounded-xl px-6 overflow-hidden">
                <AccordionTrigger className="text-primary font-semibold text-left hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-primary/70 leading-relaxed">
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
        <motion.p variants={fadeUp} className="text-primary-foreground/80 text-lg mb-10">
          Stop overthinking. Stop over-preparing. Start launching.
        </motion.p>
        <motion.div variants={fadeUp}>
          <CTAButton size="lg" className="text-lg px-12 py-7" />
          <p className="text-sm text-primary-foreground/70 mt-5">Free forever plan. No credit card required.</p>
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
const SalesFunnel = () => {
  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const u = new URL("https://ydhagqgurqhlguxkkppb.supabase.co/functions/v1/campaign-pixel");
      u.searchParams.set("c", p.get("c") || "d56f0330-1875-4f2f-9670-e1ae6fabc085");
      ["utm_source", "utm_medium", "utm_campaign"].forEach(k => { if (p.get(k)) u.searchParams.set(k, p.get(k)!) });
      const rev = 0;
      if (rev) u.searchParams.set("revenue", String(rev));
      fetch(u.toString()).catch(() => {});
    } catch {}
  }, []);

  return (
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
    {/* Simplified Footer */}
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © {new Date().getFullYear()} Launchely. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://instagram.com/launchely" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="https://facebook.com/launchely" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="https://tiktok.com/@launchely" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
  );
};

export default SalesFunnel;

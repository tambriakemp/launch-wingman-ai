import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
import {
  X,
  Check,
  ArrowRight,
  Zap,
  Target,
  Users,
  Sparkles,
  Brain,
  FileText,
  Wand2,
  Calendar,
  CheckSquare,
  BarChart3,
  Lightbulb,
  BookOpen,
  Palette,
  Video,
  Film,
  Mail,
  PenTool,
  Layers,
  Package,
} from "lucide-react";

const painPoints = [
  { emoji: "😩", text: "Bought a course but never finished it" },
  { emoji: "🤯", text: "Overwhelmed by all the steps to launch" },
  { emoji: "💸", text: "Spent thousands and still feel stuck" },
  { emoji: "😤", text: "Can't write sales copy that converts" },
  { emoji: "🕳️", text: "No clue what funnel type to use" },
  { emoji: "⏰", text: "Wasting hours on things AI could do in seconds" },
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
  { icon: Layers, text: "Choose from 7 proven funnel paths — freebie, webinar, challenge, and more" },
  { icon: Target, text: "Configure your offer stack with pricing, bonuses, and urgency built in" },
  { icon: CheckSquare, text: "Follow a phase-by-phase checklist tailored to your funnel type" },
  { icon: BarChart3, text: "Validate launch readiness with assessments before you go live" },
];

const marketingFeatures = [
  { icon: Film, text: "AI Studio — generate talking-head vlogs from a script with your own avatar and voice" },
  { icon: FileText, text: "AI sales copy for every funnel page — headlines, bullets, CTAs, and guarantees" },
  { icon: PenTool, text: "Hook generator and carousel builder with psychological frameworks" },
  { icon: Calendar, text: "30-day social content planner with daily prompts and scheduling" },
  { icon: Mail, text: "Email sequence generator — welcome, launch, nurture, and cart-close flows" },
  { icon: Lightbulb, text: "Content idea bank — save hooks, formats, and platform-tagged ideas" },
  { icon: Brain, text: "Transformation statements and messaging pulled from your offer data" },
];

const resourceFeatures = [
  { icon: BookOpen, text: "Browse categories like Social Media, Email Marketing, Branding, and more" },
  { icon: Palette, text: "Ready-to-use Canva templates, swipe files, ebooks, and checklists" },
  { icon: Sparkles, text: "AI image and video prompts you can copy and use instantly" },
  { icon: Lightbulb, text: "New resources added regularly — your vault keeps growing" },
];

const planningFeatures = [
  { icon: Calendar, text: "Weekly calendar view — schedule tasks, events, and deadlines" },
  { icon: Target, text: "Set measurable goals with quantifiable targets you can track over time" },
  { icon: CheckSquare, text: "Daily priorities and to-do lists to keep every day focused" },
  { icon: BarChart3, text: "Habit tracker with streaks — build routines that stick" },
  { icon: Brain, text: "Brain dump — capture ideas on the fly and promote them to tasks" },
  { icon: Lightbulb, text: "Daily pages and weekly reviews to reflect and plan ahead" },
];

const aiFeatures = [
  { icon: Brain, title: "Transformation Statements", description: "Generate punchy bios and detailed sales page language from your offer data." },
  { icon: FileText, title: "Sales Copy Generator", description: "Complete sales page copy — headlines, bullets, objections, CTAs — all from your funnel." },
  { icon: Users, title: "Audience Insights", description: "AI-generated sub-audiences, pain points, and buying triggers for sharper targeting." },
  { icon: Wand2, title: "Content & Offer Ideas", description: "Offer titles, content hooks, social post drafts, and email subject lines on demand." },
];

const steps = [
  { number: "01", title: "Take the Assessment", description: "Answer a few questions about your business, audience, and offer. We'll identify your launch readiness." },
  { number: "02", title: "Follow Your Plan", description: "Launchely builds your personalized launch roadmap — funnel, copy, content calendar, and task list." },
  { number: "03", title: "Launch With Confidence", description: "Execute step-by-step with AI-generated assets, brand-ready visuals, and a clear timeline." },
];

const audiences = [
  "Online Coaches", "Course Creators", "Digital Product Sellers", "Membership Owners",
  "Consultants", "Service Providers", "Community Builders", "Content Creators",
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with your first launch",
    cta: "Start Free",
    ctaVariant: "outline" as const,
    ctaLink: "/auth?tab=signup",
    features: [
      { name: "1 Active Project", included: true },
      { name: "Full Planning & Messaging Tasks", included: true },
      { name: "Funnel Type Selection", included: true },
      { name: "Offer Stack Mapping", included: true },
      { name: "Branding & Visual Direction", included: true },
      { name: "5 AI Content Ideas per Day", included: true },
      { name: "Up to 5 Saved Drafts", included: true },
      { name: "Basic Sales Copy (Headline, CTA)", included: true },
      { name: "Phase Snapshot (View Only)", included: true },
      { name: "Full Library Access", included: true },
      { name: "Content Vault", included: false },
      { name: "Unlimited Projects", included: false },
      { name: "Marketing Tools", included: false },
    ],
  },
  {
    name: "Content Vault",
    price: "$7",
    period: "/month",
    description: "Access premium templates, guides, and resources",
    cta: "Get Vault Access",
    ctaVariant: "outline" as const,
    ctaLink: "/checkout?tier=content_vault",
    icon: Package,
    features: [
      { name: "Everything in Free", included: true, highlight: true },
      { name: "Content Vault Access", included: true },
      { name: "Premium Templates & Guides", included: true },
      { name: "Canva Templates Library", included: true },
      { name: "Swipe Files & Examples", included: true },
      { name: "Unlimited Projects", included: false },
      { name: "Full Sales Copy Builder", included: false },
      { name: "Marketing Tools", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$25",
    period: "/month",
    description: "Everything you need to launch like a pro",
    cta: "Go Pro",
    ctaVariant: "default" as const,
    ctaLink: "/checkout",
    features: [
      { name: "Unlimited Projects", included: true },
      { name: "Unlimited AI Content Ideas", included: true },
      { name: "Unlimited Saved Drafts", included: true },
      { name: "Full Sales Copy Builder", included: true },
      { name: "Multiple Offers per Sales Page", included: true },
      { name: "Social Media Scheduling", included: true },
      { name: "Phase Snapshot + Export", included: true },
      { name: "Relaunch Mode", included: true },
      { name: "Insights & Analytics History", included: true },
      { name: "Content Vault Access", included: true },
      { name: "Campaigns & Marketing Tools", included: false },
      { name: "AI Studio", included: false },
    ],
  },
  {
    name: "Advanced",
    price: "$49",
    period: "/month",
    description: "Full marketing suite for scaling your business",
    cta: "Go Advanced",
    ctaVariant: "default" as const,
    ctaLink: "/checkout?tier=advanced",
    popular: true,
    features: [
      { name: "Everything in Pro", included: true, highlight: true },
      { name: "Campaigns Manager", included: true },
      { name: "Social Planner", included: true },
      { name: "Ideas Bank", included: true },
      { name: "AI Studio", included: true },
      { name: "Marketing Analytics", included: true },
      { name: "Advanced Marketing Tools", included: true },
      { name: "Priority Support", included: true },
    ],
  },
];

const comparisonRows = [
  { feature: "Active Projects", free: "1", vault: "1", pro: "Unlimited", advanced: "Unlimited" },
  { feature: "Planning & Messaging Tasks", free: true, vault: true, pro: true, advanced: true },
  { feature: "AI Content Ideas", free: "5/day", vault: "5/day", pro: "Unlimited", advanced: "Unlimited" },
  { feature: "Saved Drafts", free: "5 max", vault: "5 max", pro: "Unlimited", advanced: "Unlimited" },
  { feature: "Sales Copy", free: "Basic", vault: "Basic", pro: "Full Builder", advanced: "Full Builder" },
  { feature: "Content Vault Access", free: false, vault: true, pro: true, advanced: true },
  { feature: "Social Media Scheduling", free: false, vault: false, pro: true, advanced: true },
  { feature: "Relaunch Mode", free: false, vault: false, pro: true, advanced: true },
  { feature: "Insights & Analytics", free: false, vault: false, pro: true, advanced: true },
  { feature: "Campaigns", free: false, vault: false, pro: false, advanced: true },
  { feature: "Social Planner", free: false, vault: false, pro: false, advanced: true },
  { feature: "Ideas Bank", free: false, vault: false, pro: false, advanced: true },
  { feature: "AI Studio", free: false, vault: false, pro: false, advanced: true },
  { feature: "Marketing Analytics", free: false, vault: false, pro: false, advanced: true },
  { feature: "Priority Support", free: false, vault: false, pro: false, advanced: true },
];

const faqs = [
  { q: "Is Launchely really free to start?", a: "Yes! The free plan gives you access to assessments, one project, and core planning tools. Upgrade anytime for AI features, unlimited projects, and the Content Vault." },
  { q: "Do I need tech skills to use this?", a: "Not at all. Launchely is designed for non-technical coaches and creators. If you can fill out a form, you can launch." },
  { q: "How is this different from a launch course?", a: "Courses teach you theory. Launchely does the work with you — AI writes your copy, builds your plan, and gives you a checklist to follow." },
  { q: "Can I use my own branding?", a: "Absolutely. Upload your logos, set your colors and fonts, and every generated asset will match your brand." },
  { q: "What if I've already launched before?", a: "Even better. Use the Relaunch feature to analyze what worked, keep winning assets, and iterate for your next launch." },
  { q: "Does it replace my funnel software?", a: "No — Launchely plans and prepares your launch. You'll still use your funnel platform (Kajabi, ThriveCart, etc.) to build the actual pages." },
  { q: "Can I upgrade or downgrade at any time?", a: "Yes! You can upgrade to Pro or Content Vault at any time and get instant access to all features. If you downgrade, you'll keep access until the end of your billing period." },
  { q: "What happens to my projects if I downgrade?", a: "Your projects and data are never deleted. If you downgrade to Free, you'll still be able to view all projects but can only actively work on 1 project at a time." },
  { q: "What's included in the Content Vault?", a: "The Content Vault includes premium Canva templates, swipe files, email sequences, social media templates, and exclusive guides created by launch experts. New resources are added regularly." },
  { q: "How does billing work?", a: "Pro ($25/month), Advanced ($49/month), and Content Vault ($7/month) are billed monthly. You can cancel anytime, and you'll keep access until the end of your billing period. No long-term contracts or hidden fees." },
  { q: "Do you offer refunds?", a: "We do not offer refunds. We provide a free plan so you can experience our features before upgrading, and due to the digital nature of our software, all sales are final." },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <LandingHeader />

      {/* ===== HERO (dark) ===== */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <motion.h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="block mb-2 md:mb-4">Stop Buying Courses.</span>
              <span className="inline-flex items-baseline gap-3 md:gap-4">
                <span>Start</span>
                <motion.span
                  className="bg-accent text-accent-foreground px-4 py-1 rounded-lg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  Launching.
                </motion.span>
              </span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-primary-foreground/70 mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              The AI-powered platform that replaces expensive launch courses. Plan, brand, write, and execute your next digital product launch—all in one place.
            </motion.p>

            <motion.div
              className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {[
                { icon: Zap, text: "AI-Powered" },
                { icon: Target, text: "8+ Funnel Types" },
                { icon: Users, text: "Built for Coaches" },
              ].map((badge) => (
                <div key={badge.text} className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full">
                  <badge.icon className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium">{badge.text}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8">
                <Link to="/auth?tab=signup">Start Free Today</Link>
              </Button>
              <Button asChild size="lg" className="border-2 border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 text-lg px-8">
                <a href="#features" className="flex items-center gap-2">
                  See Features <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-4xl mx-auto mt-8"
            >
              <DashboardMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <MarqueeStrip />

      {/* ===== PAIN POINTS (white) ===== */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Sound <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg">Familiar?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              You're not alone. Most coaches and creators hit these walls before their first launch.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {painPoints.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-5 flex items-start gap-4"
              >
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-foreground font-medium">{p.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== OLD VS NEW (white) ===== */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need.{" "}
              <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg">Nothing</span>{" "}
              You Don't.
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground">The Old Way</h3>
              </div>
              <ul className="space-y-4">
                {oldVsNew.old.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive/60 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-primary text-primary-foreground rounded-2xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <Check className="w-5 h-5 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-bold">The Launchely Way</h3>
              </div>
              <ul className="space-y-4">
                {oldVsNew.new.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== FEATURE PILLARS ===== */}
      <div id="features">
        {/* LAUNCH (white) */}
        <section className="py-20 lg:py-28 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="inline-block bg-accent/20 text-accent-foreground font-semibold text-sm px-4 py-1.5 rounded-full mb-4">Launch</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
                  Your Step-by-Step Launch Plan. <span className="text-accent">No Course Required.</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Stop buying courses that leave you overwhelmed. Launchely guides you through every step — pick your funnel path, configure your offer, check off each phase, and validate you're ready before you go live. It's like having a launch strategist built into your dashboard.
                </p>
                <ul className="space-y-4">
                  {launchFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <f.icon className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <span className="text-foreground">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <TasksMockup />
              </motion.div>
            </div>
          </div>
        </section>

        {/* MARKETING (light gray) */}
        <section className="py-20 lg:py-28 bg-muted/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-2 lg:order-1"
              >
                <div className="space-y-8">
                  <AIStudioMockup />
                  <SocialHubMockup />
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-1 lg:order-2"
              >
                <span className="inline-block bg-accent/20 text-accent-foreground font-semibold text-sm px-4 py-1.5 rounded-full mb-4">Marketing</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
                  Create Content That Converts. Videos That <span className="text-accent">Connect.</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  From AI-generated vlogs to full sales pages, Launchely's marketing suite writes, designs, and schedules your launch content — all powered by your audience data and offer details.
                </p>
                <ul className="space-y-4">
                  {marketingFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <f.icon className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <span className="text-foreground">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* RESOURCES (white) */}
        <section className="py-20 lg:py-28 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <span className="inline-block bg-accent/20 text-accent-foreground font-semibold text-sm px-4 py-1.5 rounded-full mb-4">Resources</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
                  Your <span className="text-accent">Content Vault.</span> Always Growing.
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Stop creating everything from scratch. The Content Vault gives you a growing library of templates, guides, AI prompts, and done-for-you assets organized by category — all included with your plan.
                </p>
                <ul className="space-y-4">
                  {resourceFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <f.icon className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <span className="text-foreground">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <ContentVaultMockup />
              </motion.div>
            </div>
          </div>
        </section>

        {/* PLANNING (light gray) */}
        <section className="py-20 lg:py-28 bg-muted/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-2 lg:order-1"
              >
                <PlannerMockup />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-1 lg:order-2"
              >
                <span className="inline-block bg-accent/20 text-accent-foreground font-semibold text-sm px-4 py-1.5 rounded-full mb-4">Planning</span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-5 leading-tight">
                  Stay Organized. Stay On Track. <span className="text-accent">Stay Accountable.</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Launching is a marathon, not a sprint. Launchely's built-in planner keeps your lifestyle, habits, and business in order — so nothing falls through the cracks.
                </p>
                <ul className="space-y-4">
                  {planningFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <f.icon className="w-4 h-4 text-accent-foreground" />
                      </div>
                      <span className="text-foreground">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>
      </div>

      {/* ===== AI SECTION (dark) ===== */}
      <section className="py-20 lg:py-28 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Powered by AI</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Your AI <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg">Launch Team</span>
            </h2>
            <p className="text-xl text-primary-foreground/70 max-w-2xl mx-auto">
              Not just buzzwords. Real AI tools that save you hours of work on every launch.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            {aiFeatures.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-2xl p-6"
              >
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-primary-foreground/70">{f.description}</p>
              </motion.div>
            ))}
          </div>
          <div className="max-w-3xl mx-auto">
            <TransformationMockup />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS (white) ===== */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              How It <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Three simple steps from idea to launch.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="text-center bg-card border border-border rounded-2xl p-8"
              >
                <div className="text-5xl font-bold text-accent/30 mb-4">{s.number}</div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{s.title}</h3>
                <p className="text-muted-foreground">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BUILT FOR (white) ===== */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-8">
              Built For <span className="text-accent">You</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mb-12">
              {audiences.map((a) => (
                <span key={a} className="bg-accent/10 text-foreground font-medium px-5 py-2.5 rounded-full text-sm border border-accent/20">
                  {a}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== PRICING (white) ===== */}
      <section id="pricing" className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Simple, <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg">Transparent</span> Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No hidden fees. No surprise charges. Just straightforward pricing for launching smarter.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-card rounded-2xl border-2 p-6 lg:p-8 ${
                  plan.popular ? "border-accent shadow-xl" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground text-sm font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {plan.icon && <plan.icon className="w-5 h-5 text-primary" />}
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground">{plan.name}</h3>
                  </div>
                  <div className="mb-2">
                    <span className="text-4xl lg:text-5xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.slice(0, 10).map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground/60"}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full ${
                    plan.popular
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : ""
                  }`}
                  variant={plan.ctaVariant}
                  size="lg"
                >
                  <Link to={plan.ctaLink}>
                    {plan.cta}
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COMPARE PLANS (light gray) ===== */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Compare Plans
            </h2>
            <p className="text-lg text-muted-foreground">
              See exactly what you get with each plan
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold text-foreground">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Package className="w-4 h-4" />
                      Vault
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Pro</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Advanced</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-4 px-4 text-foreground">{row.feature}</td>
                    {(['free', 'vault', 'pro', 'advanced'] as const).map((col) => (
                      <td key={col} className="py-4 px-4 text-center">
                        {typeof row[col] === "boolean" ? (
                          row[col] ? (
                            <Check className="w-5 h-5 text-accent mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className={`text-foreground ${col === 'advanced' ? 'font-medium' : ''}`}>{row[col]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== FAQ (white) ===== */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Frequently Asked <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg">Questions</span>
            </h2>
          </motion.div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-xl px-6 overflow-hidden">
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA (dark) ===== */}
      <section className="py-20 lg:py-28 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Ready to Launch Without the Learning Curve?
            </h2>
            <p className="text-xl text-primary-foreground/70 mb-8 max-w-2xl mx-auto">
              Join coaches and creators who are launching smarter, not harder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8">
                <Link to="/auth?tab=signup">Start Free Today</Link>
              </Button>
              <Button asChild size="lg" className="border-2 border-primary-foreground/30 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 text-lg">
                <a href="#pricing">View Pricing</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Landing;

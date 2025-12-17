import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { DashboardMockup } from "@/components/landing/screenshots/DashboardMockup";
import { FunnelBuilderMockup } from "@/components/landing/screenshots/FunnelBuilderMockup";
import { TransformationMockup } from "@/components/landing/screenshots/TransformationMockup";
import { ProjectBoardMockup } from "@/components/landing/screenshots/ProjectBoardMockup";
import {
  ClipboardCheck,
  Layout,
  Palette,
  MessageSquare,
  Rocket,
  Sparkles,
  X,
  Check,
  ArrowRight,
  Zap,
  Target,
  Users,
  FileText,
  Wand2,
  Brain,
} from "lucide-react";

const features = [
  {
    icon: ClipboardCheck,
    title: "Assessments",
    description: "Know where you stand with launch readiness quizzes and coaching style assessments.",
    href: "/features/assessments",
  },
  {
    icon: Layout,
    title: "Plan",
    description: "Build your funnel foundation with AI-powered audience insights and offer configuration.",
    href: "/features/plan",
  },
  {
    icon: Palette,
    title: "Branding",
    description: "Organize your logos, colors, fonts, and photos in one professional brand hub.",
    href: "/features/branding",
  },
  {
    icon: MessageSquare,
    title: "Messaging",
    description: "Generate sales copy, social bios, and email sequences with AI that gets your voice.",
    href: "/features/messaging",
  },
  {
    icon: Rocket,
    title: "Execute",
    description: "Manage tasks, schedule social posts, and track your launch timeline visually.",
    href: "/features/execute",
  },
  {
    icon: Sparkles,
    title: "AI Everywhere",
    description: "AI-powered tools throughout—from transformation statements to complete sales pages.",
    href: "/features/messaging",
  },
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

const aiFeatures = [
  {
    icon: Brain,
    title: "AI Transformation Statements",
    description: "Generate compelling transformation language in multiple styles—punchy for bios, detailed for sales pages.",
  },
  {
    icon: FileText,
    title: "AI Sales Copy",
    description: "Complete sales page copy generated from your audience data and transformation statement.",
  },
  {
    icon: Users,
    title: "AI Audience Insights",
    description: "Refine your target audience and generate sub-audience variations with AI suggestions.",
  },
  {
    icon: Wand2,
    title: "AI Offer Ideas",
    description: "Get AI-generated offer titles and descriptions based on your funnel type and audience.",
  },
];

const steps = [
  {
    number: "01",
    title: "Define Your Offer",
    description: "Choose your funnel type, define your audience, and configure your offer stack.",
  },
  {
    number: "02",
    title: "Generate Your Assets",
    description: "Use AI to create transformation statements, sales copy, and marketing content.",
  },
  {
    number: "03",
    title: "Launch With Confidence",
    description: "Execute with a clear checklist, project board, and launch calendar.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Stop Buying Courses.
                <br />
                Start{" "}
                <span className="bg-accent text-accent-foreground px-4 py-1 rounded-lg">
                  Launching.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-primary-foreground/70 mb-8 max-w-3xl mx-auto">
                The AI-powered platform that replaces expensive launch courses. Plan, brand, write, and execute your next digital product launch—all in one place.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10">
                <div className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full">
                  <Zap className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium">AI-Powered</span>
                </div>
                <div className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full">
                  <Target className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium">8+ Funnel Types</span>
                </div>
                <div className="flex items-center gap-2 bg-primary-foreground/10 px-4 py-2 rounded-full">
                  <Users className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium">Built for Coaches</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button
                  asChild
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8"
                >
                  <Link to="/auth">Start Free Today</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 text-lg"
                >
                  <Link to="/features/plan" className="flex items-center gap-2">
                    See How It Works <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* Hero Screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-4xl mx-auto mt-8"
            >
              <div className="transform perspective-1000 rotate-x-2 hover:rotate-x-0 transition-transform duration-500">
                <DashboardMockup />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Marquee Strip */}
      <MarqueeStrip />

      {/* No More Courses Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Everything You Need.{" "}
              <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg">Nothing</span>{" "}
              You Don't.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Launch courses taught you what to do. Launchely helps you actually do it.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Old Way */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
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
                {oldVsNew.old.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive/60 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* New Way */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
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
                {oldVsNew.new.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-primary-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-32 bg-accent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-accent-foreground mb-4">
              One Platform. Complete Launch System.
            </h2>
            <p className="text-xl text-accent-foreground/70 max-w-2xl mx-auto">
              From initial planning to execution—everything you need to launch successfully.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link
                  to={feature.href}
                  className="block bg-card border border-border rounded-2xl p-6 h-full hover:shadow-lg transition-all hover:-translate-y-1 group"
                >
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              How It <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg">Works</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps from idea to launch.
            </p>
          </motion.div>

          <div className="space-y-20 max-w-5xl mx-auto">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-8 items-center"
            >
              <div className="text-center md:text-left">
                <div className="text-6xl font-bold text-accent/20 mb-4">01</div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Define Your Offer</h3>
                <p className="text-muted-foreground text-lg">Choose your funnel type, define your audience, and configure your offer stack with AI-powered suggestions.</p>
              </div>
              <div className="transform hover:scale-[1.02] transition-transform duration-300">
                <FunnelBuilderMockup />
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-8 items-center"
            >
              <div className="order-2 md:order-1 transform hover:scale-[1.02] transition-transform duration-300">
                <TransformationMockup />
              </div>
              <div className="order-1 md:order-2 text-center md:text-left">
                <div className="text-6xl font-bold text-accent/20 mb-4">02</div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Generate Your Assets</h3>
                <p className="text-muted-foreground text-lg">Use AI to create transformation statements, sales copy, and marketing content that converts.</p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-8 items-center"
            >
              <div className="text-center md:text-left">
                <div className="text-6xl font-bold text-accent/20 mb-4">03</div>
                <h3 className="text-2xl font-semibold text-foreground mb-3">Launch With Confidence</h3>
                <p className="text-muted-foreground text-lg">Execute with a clear checklist, project board, and launch calendar that keeps everything on track.</p>
              </div>
              <div className="transform hover:scale-[1.02] transition-transform duration-300">
                <ProjectBoardMockup />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-20 lg:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Powered by AI</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              AI That Actually{" "}
              <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg">Helps</span>
            </h2>
            <p className="text-xl text-primary-foreground/70 max-w-2xl mx-auto">
              Not just buzzwords. Real AI tools that save you hours of work on every launch.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {aiFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-primary-foreground/5 border border-primary-foreground/10 rounded-2xl p-6"
              >
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-primary-foreground/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-32 bg-accent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-accent-foreground mb-4">
              Ready to Launch Without the Learning Curve?
            </h2>
            <p className="text-xl text-accent-foreground/70 mb-8 max-w-2xl mx-auto">
              Join thousands of coaches and creators who are launching smarter, not harder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8"
              >
                <Link to="/auth">Start Free Today</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-accent-foreground/20 text-accent-foreground hover:bg-accent-foreground/10 text-lg"
              >
                <Link to="/pricing">View Pricing</Link>
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

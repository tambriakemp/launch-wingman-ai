import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { AssessmentMockup } from "@/components/landing/screenshots/AssessmentMockup";
import { FunnelBuilderMockup } from "@/components/landing/screenshots/FunnelBuilderMockup";
import { AudienceBuilderMockup } from "@/components/landing/screenshots/AudienceBuilderMockup";
import { TransformationMockup } from "@/components/landing/screenshots/TransformationMockup";
import { BrandingMockup } from "@/components/landing/screenshots/BrandingMockup";
import { SalesCopyMockup } from "@/components/landing/screenshots/SalesCopyMockup";
import { TasksMockup } from "@/components/landing/screenshots/TasksMockup";
import { SocialHubMockup } from "@/components/landing/screenshots/SocialHubMockup";
import {
  ClipboardCheck,
  Layout,
  Users,
  Sparkles,
  Palette,
  MessageSquare,
  Rocket,
  ArrowRight,
  CheckCircle2,
  Package,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Take Your Assessment",
    description: "Discover your launch readiness, identify your coaching style, and create your personal why statement.",
    color: "bg-blue-500/10 text-blue-500",
    mockup: AssessmentMockup,
    details: [
      "Launch readiness quiz (15 questions)",
      "Coaching style assessment",
      "Personal why statement builder",
      "Score breakdown & recommendations",
    ],
  },
  {
    number: "02",
    icon: Layout,
    title: "Choose Your Funnel",
    description: "Select from 8+ proven funnel types and configure your offer stack with AI-powered suggestions.",
    color: "bg-green-500/10 text-green-500",
    mockup: FunnelBuilderMockup,
    details: [
      "8+ funnel types (Freebie, Low-Ticket, Webinar, etc.)",
      "Visual funnel diagrams",
      "Configurable offer slots",
      "AI-generated offer ideas",
    ],
  },
  {
    number: "03",
    icon: Users,
    title: "Define Your Audience",
    description: "Build a complete audience profile using the Value Equation framework with AI assistance.",
    color: "bg-purple-500/10 text-purple-500",
    mockup: AudienceBuilderMockup,
    details: [
      "WHO: Target audience + specificity scorer",
      "DREAM OUTCOME: AI style variations",
      "PAIN: Symptoms & primary struggles",
      "LIKELIHOOD: Objections + proof elements",
      "TIME & EFFORT: Quick wins + friction reducers",
    ],
  },
  {
    number: "04",
    icon: Sparkles,
    title: "Craft Your Transformation",
    description: "AI generates transformation statements in 3 versions—lock your statement as the single source of truth.",
    color: "bg-amber-500/10 text-amber-500",
    mockup: TransformationMockup,
    details: [
      "One-liner (bios & hooks)",
      "Standard (sales pages)",
      "Expanded (about sections)",
      "Lock & use across all content",
    ],
  },
  {
    number: "05",
    icon: Palette,
    title: "Organize Your Brand",
    description: "Upload and manage your brand assets—logos, colors, fonts, and photos—in one professional hub.",
    color: "bg-pink-500/10 text-pink-500",
    mockup: BrandingMockup,
    details: [
      "Logo library with variants",
      "Color palette manager",
      "Font selections",
      "Photo gallery",
    ],
  },
  {
    number: "06",
    icon: MessageSquare,
    title: "Generate Your Messaging",
    description: "AI-powered sales copy, social bios with proven formulas, and email sequence templates.",
    color: "bg-indigo-500/10 text-indigo-500",
    mockup: SalesCopyMockup,
    details: [
      "Full sales page copy generation",
      "Social bio formulas",
      "Email sequence templates",
      "Deliverable copy library",
    ],
  },
  {
    number: "07",
    icon: Rocket,
    title: "Execute Your Launch",
    description: "Manage tasks with a task list, schedule social posts, and track your launch calendar.",
    color: "bg-teal-500/10 text-teal-500",
    mockup: TasksMockup,
    secondaryMockup: SocialHubMockup,
    details: [
      "Asset checklist from funnel config",
      "Drag-and-drop task management",
      "Launch calendar timeline",
      "Social media scheduling",
    ],
  },
  {
    number: "08",
    icon: Package,
    title: "Access Your Resources",
    description: "Browse the Content Vault for ready-made templates, social posts, ebooks, and design assets.",
    color: "bg-orange-500/10 text-orange-500",
    mockup: TasksMockup,
    details: [
      "9+ resource categories",
      "Ready-to-use templates",
      "Canva links & presets",
      "Pro-exclusive access",
    ],
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="How Launchely Works — From Idea to Launch in 8 Steps"
        description="See exactly how Launchely guides you from assessment to launch: pick a funnel, define your audience, generate copy, organize branding, and execute."
        path="/how-it-works"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "How It Works", path: "/how-it-works" },
        ]}
      />
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              How{" "}
              <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg">
                Launchely
              </span>{" "}
              Works
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/70 mb-8 max-w-3xl mx-auto">
              From idea to launch in one streamlined workflow. See exactly how you'll go from zero to launching your digital product.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Overview Flow */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: Layout, label: "Plan", color: "bg-green-500" },
                { icon: Palette, label: "Brand", color: "bg-pink-500" },
                { icon: MessageSquare, label: "Message", color: "bg-indigo-500" },
                { icon: Rocket, label: "Execute", color: "bg-teal-500" },
              ].map((phase, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center p-6 bg-card rounded-2xl border border-border">
                    <div className={`w-14 h-14 ${phase.color} rounded-2xl flex items-center justify-center mb-3`}>
                      <phase.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="font-semibold text-foreground">{phase.label}</span>
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Detailed Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? "lg:grid-flow-dense" : ""
                }`}
              >
                {/* Content */}
                <div className={index % 2 === 1 ? "lg:col-start-2" : ""}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-5xl font-bold text-accent/30">{step.number}</span>
                    <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-foreground mb-4">{step.title}</h3>
                  <p className="text-lg text-muted-foreground mb-6">{step.description}</p>
                  <ul className="space-y-3">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mockup */}
                <div className={`space-y-6 ${index % 2 === 1 ? "lg:col-start-1" : ""}`}>
                  <div className="transform hover:scale-[1.02] transition-transform duration-300">
                    <step.mockup />
                  </div>
                  {step.secondaryMockup && (
                    <div className="transform hover:scale-[1.02] transition-transform duration-300">
                      <step.secondaryMockup />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Launch?
            </h2>
            <p className="text-xl text-primary-foreground/70 mb-8 max-w-2xl mx-auto">
              Join thousands of coaches and creators who are launching smarter, not harder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="accent">
                <Link to="/auth?tab=signup">Start Free Today</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/#pricing">View Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default HowItWorks;

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sparkles,
  ArrowRight,
  Calendar,
  Kanban,
  FileText,
  Zap,
  Check,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI Transformation Statements",
    description: "Generate compelling transformation statements that resonate with your audience.",
  },
  {
    icon: Calendar,
    title: "Launch Calendar",
    description: "Plan your quarterly launches with an intuitive visual calendar.",
  },
  {
    icon: Kanban,
    title: "Project Management",
    description: "Kanban boards with tasks and due dates to keep launches on track.",
  },
  {
    icon: FileText,
    title: "Content Planner",
    description: "Organize your launch content tied to your calendar milestones.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: ["1 active project", "AI transformation generator", "Basic calendar", "Kanban board"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$10",
    period: "/month",
    description: "For serious coaches and marketers",
    features: ["Unlimited projects", "AI transformation generator", "Advanced calendar", "Kanban board", "Content planner", "Priority support"],
    cta: "Start Free Trial",
    popular: true,
  },
];

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Coach Hub</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild>
                <Link to="/app">Go to App</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/auth?tab=signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_50%)]" />
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Trusted by 500+ coaches and marketers
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Launch Your Programs
              <br />
              <span className="gradient-primary bg-clip-text text-transparent">With Confidence</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              The all-in-one platform for coaches and digital marketers to plan, organize, and execute successful program launches. Powered by AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="xl" variant="hero" asChild>
                <Link to="/auth?tab=signup">
                  Start Free <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <a href="#features">See How It Works</a>
              </Button>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-20 -z-10 scale-95" />
            <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl">
              <div className="bg-card p-2">
                <div className="flex items-center gap-2 px-4 py-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/80" />
                    <div className="w-3 h-3 rounded-full bg-warning/80" />
                    <div className="w-3 h-3 rounded-full bg-success/80" />
                  </div>
                  <div className="flex-1 h-6 bg-muted rounded-md mx-20" />
                </div>
              </div>
              <div className="p-8 bg-background/50">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Active Projects", value: "3" },
                    { label: "Tasks Due", value: "12" },
                    { label: "Content Pieces", value: "24" },
                    { label: "Launch Days", value: "45" },
                  ].map((stat, i) => (
                    <Card key={i} className="p-4">
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </Card>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="col-span-2 h-48" />
                  <Card className="h-48" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need to Launch
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed specifically for coaches and digital marketers.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card variant="elevated" className="h-full hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mb-4 shadow-md">
                      <feature.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you need more.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  variant={plan.popular ? "gradient" : "elevated"}
                  className={`h-full relative ${plan.popular ? "scale-105" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-full shadow-md">
                      Most Popular
                    </div>
                  )}
                  <CardContent className="pt-8 pb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-5xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-lg opacity-80">{plan.period}</span>}
                    </div>
                    <p className="opacity-80 mb-6">{plan.description}</p>
                    <Button
                      size="lg"
                      variant={plan.popular ? "glass" : "default"}
                      className="w-full mb-6"
                      asChild
                    >
                      <Link to="/auth">{plan.cta}</Link>
                    </Button>
                    <ul className="space-y-3">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-3">
                          <Check className="w-5 h-5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <Card variant="gradient" className="p-12 md:p-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Launch with Confidence?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
              Join hundreds of coaches and marketers who trust Coach Hub for their launches.
            </p>
            <Button size="xl" variant="glass" asChild>
              <Link to="/auth?tab=signup">
                Start Your Free Account <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Coach Hub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Coach Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

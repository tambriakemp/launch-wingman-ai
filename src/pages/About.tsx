import { Link } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Rocket, Heart, Zap, Users } from "lucide-react";

const values = [
  {
    icon: Zap,
    title: "Simplicity First",
    description: "Launch planning shouldn't require a PhD. We make complex strategies accessible to everyone.",
  },
  {
    icon: Heart,
    title: "Creator Success",
    description: "Your success is our success. Every feature is designed to help you launch confidently.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Built by coaches, for coaches. We understand the challenges because we've lived them.",
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About Launchely — Helping Coaches Launch Without the Overwhelm"
        description="Launchely was built to replace expensive launch courses with a guided, AI-powered platform. Learn our mission, values, and why we exist."
        path="/about"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
      />
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Rocket className="w-4 h-4" />
            <span className="text-sm font-medium">About Launchely</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Helping Coaches Launch
            <span className="text-primary"> Without the Overwhelm</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We believe every coach deserves access to professional launch strategies—without spending thousands on courses or hiring expensive consultants.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground mb-4">
                Launchely was born from a simple frustration: why does launching a digital product have to be so complicated and expensive?
              </p>
              <p className="text-muted-foreground mb-4">
                We watched talented coaches spend months (and thousands of dollars) trying to figure out launch strategies, only to feel more confused than when they started.
              </p>
              <p className="text-muted-foreground">
                So we built something different—an AI-powered platform that guides you through every step of your launch, from defining your audience to creating your sales copy.
              </p>
            </div>
            <div className="bg-primary/10 rounded-2xl p-8">
              <blockquote className="text-lg italic">
                "We're not here to teach you theory. We're here to help you actually launch."
              </blockquote>
              <p className="mt-4 font-semibold">— The Launchely Team</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why We Built This */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Why We Built Launchely</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="mb-4">
              After years in the digital product space, we noticed a pattern: coaches were buying course after course, attending webinar after webinar, and still struggling to launch their programs.
            </p>
            <p className="mb-4">
              The problem wasn't lack of information—it was information overload. Every "guru" had a different method, a different funnel type, a different approach. Coaches were drowning in options and paralyzed by choice.
            </p>
            <p className="mb-4">
              We realized what coaches actually needed wasn't more education—they needed a practical tool that would guide them through the process step by step, with AI assistance to help them create the assets they needed.
            </p>
            <p>
              That's why Launchely exists: to turn the chaos of launching into a clear, manageable workflow that anyone can follow.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Launch?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of coaches who've simplified their launch process with Launchely.
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/auth?tab=signup">Get Started Free</Link>
          </Button>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default About;

import { RefreshCw, Brain, Sparkles, Layers, CheckSquare, GitBranch, RotateCcw, Zap } from "lucide-react";
import { FeaturePageLayout } from "@/components/landing/FeaturePageLayout";
import { RelaunchMockup } from "@/components/landing/screenshots/RelaunchMockup";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  {
    icon: Brain,
    title: "Intelligent Memory",
    description: "Your project remembers everything—audience insights, problem statements, and transformation messaging.",
  },
  {
    icon: Layers,
    title: "Foundational Memory",
    description: "Core elements like target audience, problem statement, and desired outcome carry forward automatically.",
  },
  {
    icon: RotateCcw,
    title: "Adaptive Memory",
    description: "Choose which elements to revisit—messaging, funnel configuration, content direction—and refresh only what needs updating.",
  },
  {
    icon: Sparkles,
    title: "Fresh Start Option",
    description: "Sometimes you need a clean slate. Start completely fresh while keeping your project history intact.",
  },
  {
    icon: CheckSquare,
    title: "Selective Preservation",
    description: "Granular control over what to keep versus what to revisit with simple checkboxes.",
  },
  {
    icon: GitBranch,
    title: "Project Lineage",
    description: "Track the evolution of your projects across multiple relaunches to see how your strategy has evolved.",
  },
];

const benefits = [
  "Launch again in a fraction of the time",
  "Keep what worked, improve what didn't",
  "No more starting from scratch every time",
  "Learn and iterate with each launch cycle",
];

const faqs = [
  {
    question: "What is Relaunch Mode?",
    answer: "Relaunch Mode lets you create a new version of an existing project while intelligently carrying forward the work you've already done. You choose what to keep and what to refresh.",
  },
  {
    question: "What's the difference between foundational and adaptive memory?",
    answer: "Foundational memory includes core elements that rarely change: your target audience, problem statement, and transformation. Adaptive memory includes elements you might want to update: messaging, funnel configuration, content direction, and visual branding.",
  },
  {
    question: "Can I start completely fresh instead?",
    answer: "Yes! The Fresh Start option lets you create a new project with a blank slate while keeping your original project intact for reference. This is great when you're pivoting to a new audience or offer.",
  },
  {
    question: "How does project lineage work?",
    answer: "Every relaunch is connected to its parent project. You can view the history of how a project has evolved over multiple launches, making it easy to track what changed between versions.",
  },
  {
    question: "Is Relaunch available on the Free plan?",
    answer: "Relaunch Mode is a Pro feature. Free users can create new projects manually but don't have access to the intelligent memory and selective preservation features.",
  },
];

const RelaunchFeature = () => {
  return (
    <FeaturePageLayout
      icon={RefreshCw}
      title="Launch Again,"
      highlightedWord="Smarter"
      subtitle="Iterate on what works, improve what doesn't"
      description="Every launch teaches you something. Relaunch Mode helps you build on your experience by intelligently preserving what worked while giving you the flexibility to refresh and improve."
      features={features}
      benefits={benefits}
      screenshot={<RelaunchMockup />}
      seo={{
        title: "Relaunch — Reuse What Worked, Iterate Smarter | Launchely",
        description: "Analyze previous launches, keep winning assets, and roll insights into your next launch with the Relaunch workflow.",
        path: "/features/relaunch",
      }}
    >
      {/* How It Works Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How Relaunch Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to launch your next version
            </p>
          </motion.div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Choose Your Base",
                  description: "Select an existing project to use as your foundation",
                  icon: Layers,
                },
                {
                  step: "2",
                  title: "Select Memory",
                  description: "Decide what to keep and what to revisit",
                  icon: CheckSquare,
                },
                {
                  step: "3",
                  title: "Launch Faster",
                  description: "Start with a head start instead of from scratch",
                  icon: Zap,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8 text-accent" />
                  </div>
                  <div className="text-4xl font-bold text-accent/20 mb-2">{item.step}</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-foreground hover:text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </FeaturePageLayout>
  );
};

export default RelaunchFeature;

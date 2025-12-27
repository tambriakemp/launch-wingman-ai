import { BarChart3, TrendingUp, LineChart, GitCompare, Calendar, BookOpen, Camera, Target } from "lucide-react";
import { FeaturePageLayout } from "@/components/landing/FeaturePageLayout";
import { InsightsMockup } from "@/components/landing/screenshots/InsightsMockup";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  {
    icon: Camera,
    title: "Starting Snapshot",
    description: "Capture your baseline metrics before each launch—email list size, social followers, and current revenue.",
  },
  {
    icon: Target,
    title: "Ending Snapshot",
    description: "Record your results after launch to see exactly how much you've grown across all channels.",
  },
  {
    icon: LineChart,
    title: "Growth Dashboard",
    description: "Visual charts and graphs showing your progress over time with clear trend indicators.",
  },
  {
    icon: GitCompare,
    title: "Project Comparisons",
    description: "Compare results across different launches to see which strategies worked best.",
  },
  {
    icon: Calendar,
    title: "Monthly Tracking",
    description: "Regular metric updates with reminders so you never lose sight of your growth trajectory.",
  },
  {
    icon: BookOpen,
    title: "Playbook Patterns",
    description: "AI-detected patterns from your completed projects showing what worked and what to repeat.",
  },
];

const benefits = [
  "Know exactly what's working in your launches",
  "Make data-driven decisions for future projects",
  "Track your business growth over time",
  "Learn from your own launch history",
];

const faqs = [
  {
    question: "What metrics can I track?",
    answer: "You can track email list size, social media followers (Instagram, TikTok, Facebook), monthly revenue, launch revenue, and custom metrics. Both starting and ending snapshots capture these to show your growth.",
  },
  {
    question: "What is the Playbook?",
    answer: "The Playbook is an AI-powered feature that analyzes patterns from your completed projects. It identifies what worked well, what didn't, and provides recommendations for future launches based on your own data.",
  },
  {
    question: "Can I compare multiple launches?",
    answer: "Yes! The comparison view lets you look at any two projects side-by-side to see which strategies, messaging, or funnels performed better across all your tracked metrics.",
  },
  {
    question: "How often should I update my metrics?",
    answer: "We recommend monthly updates to maintain an accurate growth picture. The Insights feature includes optional reminders to help you stay consistent with your tracking.",
  },
  {
    question: "Is Insights available on the Free plan?",
    answer: "Starting and ending snapshots are available on Free in view-only mode. Full analytics history, comparisons, Playbook access, and exports require the Pro plan.",
  },
];

const InsightsFeature = () => {
  return (
    <FeaturePageLayout
      icon={BarChart3}
      title="Track Your Launch"
      highlightedWord="Progress"
      subtitle="Know what's working and grow with confidence"
      description="Stop guessing whether your launches are successful. Capture starting and ending snapshots, compare results across projects, and let AI identify patterns from your launch history."
      features={features}
      benefits={benefits}
      screenshot={<InsightsMockup />}
    >
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

export default InsightsFeature;

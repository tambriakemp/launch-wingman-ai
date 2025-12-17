import { Rocket, KanbanSquare, Calendar, Share2, CheckSquare, Clock, ListTodo, Timer } from "lucide-react";
import { FeaturePageLayout } from "@/components/landing/FeaturePageLayout";
import { ProjectBoardMockup } from "@/components/landing/screenshots/ProjectBoardMockup";
import { SocialHubMockup } from "@/components/landing/screenshots/SocialHubMockup";
import { motion } from "framer-motion";

const features = [
  {
    icon: KanbanSquare,
    title: "Project Board",
    description: "Visual task management with drag-and-drop columns—To Do, In Progress, Review, and Done.",
  },
  {
    icon: Share2,
    title: "Social Media Hub",
    description: "Plan, schedule, and post your launch content directly to Pinterest and Twitter from one dashboard.",
  },
  {
    icon: Calendar,
    title: "Launch Calendar",
    description: "Visualize your entire launch timeline with content creation, prelaunch, enrollment, and delivery phases.",
  },
  {
    icon: ListTodo,
    title: "Asset Checklist",
    description: "Auto-generated checklist of every asset you need to create based on your funnel configuration.",
  },
  {
    icon: Timer,
    title: "Due Date Tracking",
    description: "Color-coded due dates and reminders so nothing falls through the cracks during your launch.",
  },
  {
    icon: CheckSquare,
    title: "Progress Tracking",
    description: "See your overall launch progress at a glance with completion percentages and status indicators.",
  },
];

const benefits = [
  "Everything you need to execute in one place",
  "Clear visual progress on your launch",
  "Direct social media posting integration",
  "Never miss a deadline with smart tracking",
];

const ExecuteFeature = () => {
  return (
    <FeaturePageLayout
      icon={Rocket}
      title="Launch With Confidence"
      highlightedWord="Confidence"
      subtitle="Manage and execute your launch like a pro"
      description="Planning is nothing without execution. Our project management and scheduling tools help you stay on track, hit your deadlines, and launch with the confidence that everything is in place."
      features={features}
      benefits={benefits}
      screenshot={<ProjectBoardMockup />}
    >
      {/* Additional Screenshot */}
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
              Social Media Scheduling
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Plan and schedule your launch content across multiple platforms from one unified dashboard.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto transform hover:scale-[1.01] transition-transform duration-300"
          >
            <SocialHubMockup />
          </motion.div>
        </div>
      </section>
    </FeaturePageLayout>
  );
};

export default ExecuteFeature;

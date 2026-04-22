import { MessageSquare, FileText, Mail, AtSign, Sparkles, Copy, Wand2, BookOpen } from "lucide-react";
import { FeaturePageLayout } from "@/components/landing/FeaturePageLayout";
import { MessagingMockup } from "@/components/landing/screenshots/MessagingMockup";

const features = [
  {
    icon: FileText,
    title: "AI Sales Copy Generator",
    description: "Generate complete sales page copy with headlines, benefits, FAQs, and CTAs—customized for your funnel type.",
  },
  {
    icon: AtSign,
    title: "Social Bio Builder",
    description: "Create platform-optimized bios for Instagram, TikTok, Pinterest and more using proven formulas.",
  },
  {
    icon: Mail,
    title: "Email Sequence Library",
    description: "Store and organize your email sequences with easy access for launch campaigns and automations.",
  },
  {
    icon: BookOpen,
    title: "Deliverable Copy Storage",
    description: "Keep all your course content, lead magnet copy, and deliverable text organized and accessible.",
  },
  {
    icon: Wand2,
    title: "AI-Powered Generation",
    description: "Use your transformation statement and audience data to generate copy that speaks directly to your ideal customer.",
  },
  {
    icon: Copy,
    title: "One-Click Copy",
    description: "Copy any generated content instantly to paste into your sales pages, emails, or social posts.",
  },
];

const benefits = [
  "Generate sales copy in minutes, not days",
  "AI trained on high-converting launch content",
  "Copy that uses your unique transformation language",
  "Organized library for all your messaging",
];

const MessagingFeature = () => {
  return (
    <FeaturePageLayout
      icon={MessageSquare}
      title="Words That Convert"
      highlightedWord="Convert"
      subtitle="AI-powered copywriting for your entire launch"
      description="Writer's block is expensive. Our AI tools help you create compelling sales copy, email sequences, and social content that speaks directly to your audience's desires and pain points."
      features={features}
      benefits={benefits}
      screenshot={<MessagingMockup />}
      seo={{
        title: "AI Messaging — Sales Copy, Bios & Email Sequences | Launchely",
        description: "Generate sales pages, social bios with proven formulas, and complete email sequences with AI tuned to your audience and offer.",
        path: "/features/messaging",
      }}
    />
  );
};

export default MessagingFeature;

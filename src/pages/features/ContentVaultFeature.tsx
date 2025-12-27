import { Package, FolderOpen, Download, Palette, FileText, Video, Image, Type, Sparkles } from "lucide-react";
import { FeaturePageLayout } from "@/components/landing/FeaturePageLayout";

const features = [
  {
    icon: FolderOpen,
    title: "9+ Resource Categories",
    description: "Organized library with social media posts, ebooks, planners, videos, photos, fonts, and more.",
  },
  {
    icon: FileText,
    title: "Ready-to-Use Templates",
    description: "Professionally designed templates for social posts, lead magnets, and marketing materials.",
  },
  {
    icon: Download,
    title: "Instant Downloads",
    description: "Direct links to Canva templates, downloadable PDFs, presets, and digital assets.",
  },
  {
    icon: Video,
    title: "Video Resources",
    description: "Tutorial videos, B-roll footage, and video templates to enhance your content.",
  },
  {
    icon: Palette,
    title: "Design Assets",
    description: "Color palettes, font pairings, and visual elements to maintain brand consistency.",
  },
  {
    icon: Sparkles,
    title: "Pro-Exclusive Access",
    description: "Unlock the full library with a Pro subscription for unlimited resources.",
  },
];

const benefits = [
  "Save hours with ready-made templates and resources",
  "Access professionally designed marketing materials",
  "Browse 36+ subcategories for organized discovery",
  "Download assets directly or use Canva templates",
];

const ContentVaultFeature = () => {
  return (
    <FeaturePageLayout
      icon={Package}
      title="Your Resource Library"
      highlightedWord="Library"
      subtitle="Templates, assets, and resources at your fingertips"
      description="Stop creating everything from scratch. The Content Vault gives you access to a curated library of templates, social posts, ebooks, presets, and more—all designed to accelerate your launch."
      features={features}
      benefits={benefits}
    />
  );
};

export default ContentVaultFeature;

import { Palette, Image, Type, Pipette, FolderOpen, Download, Upload, Eye } from "lucide-react";
import { FeaturePageLayout } from "@/components/landing/FeaturePageLayout";
import { BrandingMockup } from "@/components/landing/screenshots/BrandingMockup";

const features = [
  {
    icon: Image,
    title: "Logo Management",
    description: "Upload and organize multiple logo variations for different use cases—primary, secondary, icon, and wordmark.",
  },
  {
    icon: Pipette,
    title: "Color Palette Builder",
    description: "Create and save your brand color palette with hex codes, names, and visual swatches for consistency.",
  },
  {
    icon: Type,
    title: "Typography Selection",
    description: "Choose from Google Fonts or upload custom fonts for headlines and body text that match your brand voice.",
  },
  {
    icon: FolderOpen,
    title: "Photo Library",
    description: "Store your brand photos, headshots, and lifestyle images in one organized, accessible location.",
  },
  {
    icon: Download,
    title: "Easy Export",
    description: "Download your brand assets anytime for use across your website, social media, and marketing materials.",
  },
  {
    icon: Eye,
    title: "Visual Preview",
    description: "See how your brand elements work together before using them in your launch materials.",
  },
];

const benefits = [
  "All your brand assets in one organized place",
  "Consistent branding across all launch materials",
  "Quick access when creating content",
  "Professional appearance without a designer",
];

const BrandingFeature = () => {
  return (
    <FeaturePageLayout
      icon={Palette}
      title="Look Professional Fast"
      highlightedWord="Professional"
      subtitle="Your brand assets, organized and ready"
      description="Professional branding doesn't require a design degree. Organize your logos, colors, fonts, and photos in one place so you always have what you need for consistent, polished launch materials."
      features={features}
      benefits={benefits}
      screenshot={<BrandingMockup />}
    />
  );
};

export default BrandingFeature;

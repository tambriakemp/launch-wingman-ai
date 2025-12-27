import { Package, FolderOpen, Download, Palette, FileText, Video, Image, Type, Sparkles, ChevronDown } from "lucide-react";
import { FeaturePageLayout } from "@/components/landing/FeaturePageLayout";
import { ContentVaultMockup } from "@/components/landing/screenshots/ContentVaultMockup";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const faqs = [
  {
    question: "What types of resources are included in the Content Vault?",
    answer: "The Content Vault includes 9+ categories of resources: Social Media Posts (carousel templates, story templates, quote graphics), Ebooks & Guides (lead magnets, workbooks, planners), Video Resources (B-roll footage, video templates, tutorials), Stock Photos, Font Pairings, Color Palettes, Audio/Music, Presets & Filters, and Mockup Templates. Each category has multiple subcategories for easy browsing.",
  },
  {
    question: "How do I access resources in the Content Vault?",
    answer: "Once you're on a Pro plan, navigate to the Content Vault from your sidebar. Browse by category or use the search function to find specific resources. Click on any resource to view details, then use the provided link to access Canva templates directly or download PDFs and other files.",
  },
  {
    question: "Are the Canva templates free to use?",
    answer: "Yes! All Canva templates in the Content Vault are included with your Pro subscription. Simply click the Canva link, and the template will open in your Canva account where you can customize it with your own branding, colors, and content.",
  },
  {
    question: "Can I use these resources for my clients?",
    answer: "The resources in the Content Vault are designed for your personal business use. If you're a coach or service provider, you can use them to create content for your own brand and marketing. For agency or white-label use, please contact us about our Business plan options.",
  },
  {
    question: "How often are new resources added?",
    answer: "We regularly update the Content Vault with fresh templates, designs, and resources. New additions are highlighted in the vault so you can easily discover the latest content to keep your marketing fresh and on-trend.",
  },
  {
    question: "Is the Content Vault available on the Free plan?",
    answer: "The Content Vault is a Pro-exclusive feature. Free plan users can see the vault categories but will need to upgrade to Pro to access and download the full library of resources.",
  },
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
      screenshot={<ContentVaultMockup />}
    >
      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked <span className="text-accent">Questions</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about the Content Vault
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-accent/50 transition-colors"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline py-5">
                    <span className="font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>
    </FeaturePageLayout>
  );
};

export default ContentVaultFeature;

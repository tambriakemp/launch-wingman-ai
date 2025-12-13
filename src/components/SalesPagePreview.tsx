import { X, CheckCircle2, Star, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface HeroSectionData {
  headlines: string[];
  selectedHeadline: number;
  subheadline: string;
  cta: string;
}

interface WhyDifferentData {
  openingParagraph: string;
  comparisonBullets: string[];
  bridgeSentence: string;
}

interface BenefitsSectionData {
  benefits: { title: string; description: string }[];
}

interface OfferDetailsSectionData {
  introduction: string;
  modules: { name: string; description: string }[];
  bonuses: { name: string; value: string; description: string }[];
  guarantee: string;
}

interface TestimonialsSectionData {
  testimonials: { name: string; result: string; quote: string }[];
}

interface FAQsSectionData {
  faqs: { question: string; answer: string }[];
}

interface HeroManualData {
  headlines?: string;
  subheadline?: string;
  cta?: string;
}

interface WhyDifferentManualData {
  openingParagraph?: string;
  comparisonBullets?: string;
  bridgeSentence?: string;
}

interface OfferDetailsManualData {
  introduction?: string;
  modules?: string;
  bonuses?: string;
  guarantee?: string;
}

interface SalesPagePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerName: string;
  sections: {
    hero?: HeroSectionData;
    heroManual?: HeroManualData;
    whyDifferent?: WhyDifferentData;
    whyDifferentManual?: WhyDifferentManualData;
    benefits?: BenefitsSectionData;
    benefitsManual?: string;
    offerDetails?: OfferDetailsSectionData;
    offerDetailsManual?: OfferDetailsManualData;
    testimonials?: TestimonialsSectionData;
    testimonialsManual?: string;
    faqs?: FAQsSectionData;
    faqsManual?: string;
  };
  sectionModes?: Record<string, "ai" | "manual">;
}

export const SalesPagePreview = ({ open, onOpenChange, offerName, sections, sectionModes = {} }: SalesPagePreviewProps) => {
  // Determine which content to show based on mode
  const heroMode = sectionModes.hero || "ai";
  const whyDifferentMode = sectionModes.whyDifferent || "ai";
  const benefitsMode = sectionModes.benefits || "ai";
  const offerDetailsMode = sectionModes.offerDetails || "ai";
  const testimonialsMode = sectionModes.testimonials || "ai";
  const faqsMode = sectionModes.faqs || "ai";

  const hasHeroManual = sections.heroManual?.headlines || sections.heroManual?.subheadline || sections.heroManual?.cta;
  const hasHeroAi = !!(sections.hero?.headlines?.length);
  const hasHero = hasHeroAi || hasHeroManual;
  
  const hasWhyDifferentManual = sections.whyDifferentManual?.openingParagraph || sections.whyDifferentManual?.comparisonBullets || sections.whyDifferentManual?.bridgeSentence;
  const hasWhyDifferentAi = !!sections.whyDifferent?.openingParagraph;
  const hasWhyDifferent = hasWhyDifferentAi || hasWhyDifferentManual;
  
  const hasBenefits = (sections.benefits?.benefits?.length) || sections.benefitsManual;
  
  const hasOfferDetailsManual = sections.offerDetailsManual?.introduction || sections.offerDetailsManual?.modules || sections.offerDetailsManual?.bonuses || sections.offerDetailsManual?.guarantee;
  const hasOfferDetailsAi = !!sections.offerDetails?.introduction;
  const hasOfferDetails = hasOfferDetailsAi || hasOfferDetailsManual;
  
  const hasTestimonials = (sections.testimonials?.testimonials?.length) || sections.testimonialsManual;
  const hasFaqs = (sections.faqs?.faqs?.length) || sections.faqsManual;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Sales Page Preview</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-80px)]">
          <div className="px-6 py-8 space-y-12">
            {/* Hero Section */}
            {hasHero && (
              <section className="text-center space-y-6 pb-8 border-b">
                {heroMode === "manual" && hasHeroManual ? (
                  <div className="space-y-6">
                    {sections.heroManual?.headlines && (
                      <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                        {sections.heroManual.headlines}
                      </h1>
                    )}
                    {sections.heroManual?.subheadline && (
                      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {sections.heroManual.subheadline}
                      </p>
                    )}
                    {sections.heroManual?.cta && (
                      <Button size="lg" className="mt-4">
                        {sections.heroManual.cta}
                      </Button>
                    )}
                  </div>
                ) : hasHeroAi && sections.hero ? (
                  <>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                      {sections.hero.headlines[sections.hero.selectedHeadline]}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      {sections.hero.subheadline}
                    </p>
                    <Button size="lg" className="mt-4">
                      {sections.hero.cta}
                    </Button>
                  </>
                ) : hasHeroManual ? (
                  <div className="space-y-6">
                    {sections.heroManual?.headlines && (
                      <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                        {sections.heroManual.headlines}
                      </h1>
                    )}
                    {sections.heroManual?.subheadline && (
                      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        {sections.heroManual.subheadline}
                      </p>
                    )}
                    {sections.heroManual?.cta && (
                      <Button size="lg" className="mt-4">
                        {sections.heroManual.cta}
                      </Button>
                    )}
                  </div>
                ) : null}
              </section>
            )}

            {/* Why Different Section */}
            {hasWhyDifferent && (
              <section className="space-y-6 pb-8 border-b">
                <h2 className="text-2xl font-bold text-center text-foreground">Why This Is Different</h2>
                {whyDifferentMode === "manual" && hasWhyDifferentManual ? (
                  <div className="max-w-2xl mx-auto space-y-4">
                    {sections.whyDifferentManual?.openingParagraph && (
                      <p className="text-muted-foreground italic">
                        {sections.whyDifferentManual.openingParagraph}
                      </p>
                    )}
                    {sections.whyDifferentManual?.comparisonBullets && (
                      <div className="text-muted-foreground whitespace-pre-wrap">
                        {sections.whyDifferentManual.comparisonBullets}
                      </div>
                    )}
                    {sections.whyDifferentManual?.bridgeSentence && (
                      <p className="text-foreground font-medium pt-2">
                        {sections.whyDifferentManual.bridgeSentence}
                      </p>
                    )}
                  </div>
                ) : hasWhyDifferentAi && sections.whyDifferent ? (
                  <div className="max-w-2xl mx-auto space-y-4">
                    <p className="text-muted-foreground italic">
                      {sections.whyDifferent.openingParagraph}
                    </p>
                    <ul className="space-y-3">
                      {sections.whyDifferent.comparisonBullets?.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-primary font-bold mt-0.5">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-foreground font-medium pt-2">
                      {sections.whyDifferent.bridgeSentence}
                    </p>
                  </div>
                ) : hasWhyDifferentManual ? (
                  <div className="max-w-2xl mx-auto space-y-4">
                    {sections.whyDifferentManual?.openingParagraph && (
                      <p className="text-muted-foreground italic">
                        {sections.whyDifferentManual.openingParagraph}
                      </p>
                    )}
                    {sections.whyDifferentManual?.comparisonBullets && (
                      <div className="text-muted-foreground whitespace-pre-wrap">
                        {sections.whyDifferentManual.comparisonBullets}
                      </div>
                    )}
                    {sections.whyDifferentManual?.bridgeSentence && (
                      <p className="text-foreground font-medium pt-2">
                        {sections.whyDifferentManual.bridgeSentence}
                      </p>
                    )}
                  </div>
                ) : null}
              </section>
            )}

            {/* Benefits Section */}
            {hasBenefits && (
              <section className="space-y-6 pb-8 border-b">
                <h2 className="text-2xl font-bold text-center text-foreground">What You'll Get</h2>
                {sections.benefits ? (
                  <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {sections.benefits.benefits?.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-accent/30">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-foreground">{benefit.title}</h4>
                          <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-2xl mx-auto">
                    <p className="whitespace-pre-wrap">{sections.benefitsManual}</p>
                  </div>
                )}
              </section>
            )}

            {/* Offer Details Section */}
            {hasOfferDetails && (
              <section className="space-y-6 pb-8 border-b">
                <h2 className="text-2xl font-bold text-center text-foreground">What's Included</h2>
                {offerDetailsMode === "manual" && hasOfferDetailsManual ? (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {sections.offerDetailsManual?.introduction && (
                      <p className="text-center text-muted-foreground">
                        {sections.offerDetailsManual.introduction}
                      </p>
                    )}
                    {sections.offerDetailsManual?.modules && (
                      <div className="p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold text-foreground mb-2">Modules</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sections.offerDetailsManual.modules}</p>
                      </div>
                    )}
                    {sections.offerDetailsManual?.bonuses && (
                      <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                        <h4 className="font-semibold text-foreground mb-2">Bonuses</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sections.offerDetailsManual.bonuses}</p>
                      </div>
                    )}
                    {sections.offerDetailsManual?.guarantee && (
                      <div className="p-4 rounded-lg bg-accent/50 text-center">
                        <p className="font-medium text-foreground">{sections.offerDetailsManual.guarantee}</p>
                      </div>
                    )}
                  </div>
                ) : hasOfferDetailsAi && sections.offerDetails ? (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <p className="text-center text-muted-foreground">
                      {sections.offerDetails.introduction}
                    </p>
                    
                    {/* Modules */}
                    <div className="space-y-3">
                      {sections.offerDetails.modules?.map((module, idx) => (
                        <div key={idx} className="p-4 rounded-lg border bg-card">
                          <h4 className="font-semibold text-foreground">
                            Module {idx + 1}: {module.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Bonuses */}
                    {(sections.offerDetails.bonuses?.length ?? 0) > 0 && (
                      <div className="space-y-3 pt-4">
                        <h3 className="font-semibold text-center text-foreground">
                          Plus These Bonuses
                        </h3>
                        {sections.offerDetails.bonuses?.map((bonus, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                            <div className="flex items-center gap-2 mb-1">
                              <Star className="w-4 h-4 text-primary" />
                              <h4 className="font-semibold text-foreground">{bonus.name}</h4>
                              <Badge variant="secondary" className="ml-auto">
                                Value: {bonus.value}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{bonus.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Guarantee */}
                    {sections.offerDetails.guarantee && (
                      <div className="p-4 rounded-lg bg-accent/50 text-center">
                        <p className="font-medium text-foreground">{sections.offerDetails.guarantee}</p>
                      </div>
                    )}
                  </div>
                ) : hasOfferDetailsManual ? (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {sections.offerDetailsManual?.introduction && (
                      <p className="text-center text-muted-foreground">
                        {sections.offerDetailsManual.introduction}
                      </p>
                    )}
                    {sections.offerDetailsManual?.modules && (
                      <div className="p-4 rounded-lg border bg-card">
                        <h4 className="font-semibold text-foreground mb-2">Modules</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sections.offerDetailsManual.modules}</p>
                      </div>
                    )}
                    {sections.offerDetailsManual?.bonuses && (
                      <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                        <h4 className="font-semibold text-foreground mb-2">Bonuses</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sections.offerDetailsManual.bonuses}</p>
                      </div>
                    )}
                    {sections.offerDetailsManual?.guarantee && (
                      <div className="p-4 rounded-lg bg-accent/50 text-center">
                        <p className="font-medium text-foreground">{sections.offerDetailsManual.guarantee}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </section>
            )}

            {/* Testimonials Section */}
            {hasTestimonials && (
              <section className="space-y-6 pb-8 border-b">
                <h2 className="text-2xl font-bold text-center text-foreground">What Others Say</h2>
                {sections.testimonials ? (
                  <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {sections.testimonials.testimonials?.map((testimonial, idx) => (
                      <div key={idx} className="p-4 rounded-lg border bg-card flex flex-col">
                        <p className="text-sm text-muted-foreground italic flex-1">
                          "{testimonial.quote}"
                        </p>
                        <div className="mt-4 pt-3 border-t">
                          <p className="font-medium text-foreground text-sm">{testimonial.name}</p>
                          <p className="text-xs text-primary">{testimonial.result}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-2xl mx-auto">
                    <p className="whitespace-pre-wrap">{sections.testimonialsManual}</p>
                  </div>
                )}
              </section>
            )}

            {/* FAQ Section */}
            {hasFaqs && (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-center text-foreground">
                  Frequently Asked Questions
                </h2>
                {sections.faqs ? (
                  <Accordion type="single" collapsible className="max-w-2xl mx-auto">
                    {sections.faqs.faqs?.map((faq, idx) => (
                      <AccordionItem key={idx} value={`faq-${idx}`}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                            <span>{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pl-6">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="prose dark:prose-invert max-w-2xl mx-auto">
                    <p className="whitespace-pre-wrap">{sections.faqsManual}</p>
                  </div>
                )}
              </section>
            )}

            {/* Empty State */}
            {!hasHero && !hasWhyDifferent && !hasBenefits && !hasOfferDetails && !hasTestimonials && !hasFaqs && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No sections have been completed yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add content to see your sales page preview.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

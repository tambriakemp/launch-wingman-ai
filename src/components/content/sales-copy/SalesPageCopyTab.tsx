import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, Check, Copy, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  SalesPageCopyData, 
  SectionType, 
  SECTION_CONFIG,
  HeroSection,
  WhyDifferentSection,
  BenefitsSection,
  OfferDetailsSection,
  TestimonialsSection,
  FAQsSection
} from "./types";
import { Json } from "@/integrations/supabase/types";

interface SalesPageCopyTabProps {
  projectId: string;
}

export function SalesPageCopyTab({ projectId }: SalesPageCopyTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState<Set<SectionType>>(new Set(['hero']));
  const [generatingSection, setGeneratingSection] = useState<SectionType | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Fetch project and offer data
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("selected_funnel_type, transformation_statement")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch funnel data for audience context
  const { data: funnel } = useQuery({
    queryKey: ["funnel", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funnels")
        .select("target_audience, desired_outcome, primary_pain_point, niche")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch primary offer for context
  const { data: primaryOffer } = useQuery({
    queryKey: ["primary-offer", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("project_id", projectId)
        .eq("slot_type", "core")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing sales copy
  const { data: existingSalesCopy, isLoading: loadingSalesCopy } = useQuery({
    queryKey: ["sales-page-copy", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_page_copy")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const salesCopyData: SalesPageCopyData = (existingSalesCopy?.sections as unknown as SalesPageCopyData) || {};

  // Generate section mutation
  const generateSection = useMutation({
    mutationFn: async (sectionType: SectionType) => {
      const { data, error } = await supabase.functions.invoke('generate-sales-copy', {
        body: {
          sectionType,
          audience: funnel?.target_audience,
          problem: funnel?.primary_pain_point,
          desiredOutcome: funnel?.desired_outcome,
          offerName: primaryOffer?.title || 'Your Offer',
          offerType: primaryOffer?.offer_type,
          deliverables: primaryOffer?.main_deliverables,
          price: primaryOffer?.price,
          priceType: primaryOffer?.price_type,
          transformationStatement: project?.transformation_statement,
          inferContext: true,
        },
      });
      if (error) throw error;
      return { sectionType, data };
    },
    onSuccess: async ({ sectionType, data }) => {
      // Save to database
      const updatedSections = {
        ...salesCopyData,
        [sectionType]: data,
      };

      if (existingSalesCopy) {
        await supabase
          .from("sales_page_copy")
          .update({ sections: updatedSections as unknown as Json })
          .eq("id", existingSalesCopy.id);
      } else {
        await supabase
          .from("sales_page_copy")
          .insert({
            project_id: projectId,
            user_id: user!.id,
            deliverable_id: 'sales-page',
            sections: updatedSections as unknown as Json,
          });
      }

      queryClient.invalidateQueries({ queryKey: ["sales-page-copy", projectId] });
      toast.success(`${SECTION_CONFIG[sectionType].label} generated!`);
    },
    onError: (error) => {
      console.error('Generate error:', error);
      toast.error('Failed to generate copy. Please try again.');
    },
    onSettled: () => {
      setGeneratingSection(null);
    },
  });

  const handleGenerate = (sectionType: SectionType) => {
    setGeneratingSection(sectionType);
    setExpandedSections(prev => new Set([...prev, sectionType]));
    generateSection.mutate(sectionType);
  };

  const toggleSection = (sectionType: SectionType) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionType)) {
        next.delete(sectionType);
      } else {
        next.add(sectionType);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
    toast.success('Copied to clipboard');
  };

  const hasContext = funnel?.target_audience || funnel?.primary_pain_point;

  if (loadingSalesCopy) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context Warning */}
      {!hasContext && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-4">
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Complete your audience and offer details first for better results. 
              The AI uses your transformation statement, audience pain points, and offer details to generate relevant copy.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Section Cards */}
      {(Object.keys(SECTION_CONFIG) as SectionType[]).map((sectionType) => {
        const config = SECTION_CONFIG[sectionType];
        const sectionData = salesCopyData[sectionType];
        const isExpanded = expandedSections.has(sectionType);
        const isGenerating = generatingSection === sectionType;

        return (
          <Card key={sectionType} className="overflow-hidden">
            <Collapsible open={isExpanded} onOpenChange={() => toggleSection(sectionType)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {config.label}
                        {sectionData && (
                          <Check className="w-4 h-4 text-emerald-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{config.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerate(sectionType);
                        }}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : sectionData ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerate
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate
                          </>
                        )}
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 border-t">
                  {sectionData ? (
                    <SectionContent
                      sectionType={sectionType}
                      data={sectionData}
                      onCopy={copyToClipboard}
                      copiedItem={copiedItem}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">
                      Click "Generate" to create copy for this section.
                    </p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}

interface SectionContentProps {
  sectionType: SectionType;
  data: HeroSection | WhyDifferentSection | BenefitsSection | OfferDetailsSection | TestimonialsSection | FAQsSection;
  onCopy: (text: string, id: string) => void;
  copiedItem: string | null;
}

function SectionContent({ sectionType, data, onCopy, copiedItem }: SectionContentProps) {
  switch (sectionType) {
    case 'hero':
      return <HeroContent data={data as HeroSection} onCopy={onCopy} copiedItem={copiedItem} />;
    case 'whyDifferent':
      return <WhyDifferentContent data={data as WhyDifferentSection} onCopy={onCopy} copiedItem={copiedItem} />;
    case 'benefits':
      return <BenefitsContent data={data as BenefitsSection} onCopy={onCopy} copiedItem={copiedItem} />;
    case 'offerDetails':
      return <OfferDetailsContent data={data as OfferDetailsSection} onCopy={onCopy} copiedItem={copiedItem} />;
    case 'testimonials':
      return <TestimonialsContent data={data as TestimonialsSection} onCopy={onCopy} copiedItem={copiedItem} />;
    case 'faqs':
      return <FAQsContent data={data as FAQsSection} onCopy={onCopy} copiedItem={copiedItem} />;
    default:
      return null;
  }
}

function CopyButton({ text, id, copiedItem, onCopy }: { text: string; id: string; copiedItem: string | null; onCopy: (text: string, id: string) => void }) {
  return (
    <button
      onClick={() => onCopy(text, id)}
      className="p-1.5 rounded hover:bg-muted transition-colors shrink-0"
      title="Copy to clipboard"
    >
      {copiedItem === id ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
}

function HeroContent({ data, onCopy, copiedItem }: { data: HeroSection; onCopy: (text: string, id: string) => void; copiedItem: string | null }) {
  return (
    <div className="space-y-6 py-4">
      {/* Headlines */}
      <div>
        <h4 className="text-sm font-medium mb-3">Headlines</h4>
        <div className="space-y-2">
          {data.headlines?.map((headline, i) => (
            <div key={i} className={cn(
              "flex items-start gap-2 p-3 rounded-lg border",
              i === data.recommendedHeadline && "border-primary bg-primary/5"
            )}>
              <p className="flex-1 text-sm">{headline}</p>
              <CopyButton text={headline} id={`headline-${i}`} copiedItem={copiedItem} onCopy={onCopy} />
            </div>
          ))}
        </div>
      </div>

      {/* Subheadlines */}
      <div>
        <h4 className="text-sm font-medium mb-3">Subheadlines</h4>
        <div className="space-y-2">
          {data.subheadlines?.map((sub, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg border">
              <p className="flex-1 text-sm">{sub}</p>
              <CopyButton text={sub} id={`subheadline-${i}`} copiedItem={copiedItem} onCopy={onCopy} />
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div>
        <h4 className="text-sm font-medium mb-3">Call-to-Action Buttons</h4>
        <div className="flex flex-wrap gap-2">
          {data.ctas?.map((cta, i) => (
            <div key={i} className="flex items-center gap-1 px-3 py-2 rounded-lg border bg-muted/50">
              <span className="text-sm font-medium">{cta}</span>
              <CopyButton text={cta} id={`cta-${i}`} copiedItem={copiedItem} onCopy={onCopy} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WhyDifferentContent({ data, onCopy, copiedItem }: { data: WhyDifferentSection; onCopy: (text: string, id: string) => void; copiedItem: string | null }) {
  return (
    <div className="space-y-6 py-4">
      {/* Opening Paragraphs */}
      <div>
        <h4 className="text-sm font-medium mb-3">Opening Paragraphs</h4>
        <div className="space-y-2">
          {data.openingParagraphs?.map((para, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg border">
              <p className="flex-1 text-sm">{para}</p>
              <CopyButton text={para} id={`opening-${i}`} copiedItem={copiedItem} onCopy={onCopy} />
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Bullets */}
      <div>
        <h4 className="text-sm font-medium mb-3">Comparison Bullets</h4>
        <div className="space-y-2">
          {data.comparisonBullets?.map((bullet, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg border">
              <p className="flex-1 text-sm">• {bullet}</p>
              <CopyButton text={bullet} id={`bullet-${i}`} copiedItem={copiedItem} onCopy={onCopy} />
            </div>
          ))}
        </div>
      </div>

      {/* Bridge Sentences */}
      <div>
        <h4 className="text-sm font-medium mb-3">Bridge Sentences</h4>
        <div className="space-y-2">
          {data.bridgeSentences?.map((bridge, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg border">
              <p className="flex-1 text-sm">{bridge}</p>
              <CopyButton text={bridge} id={`bridge-${i}`} copiedItem={copiedItem} onCopy={onCopy} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BenefitsContent({ data, onCopy, copiedItem }: { data: BenefitsSection; onCopy: (text: string, id: string) => void; copiedItem: string | null }) {
  return (
    <div className="space-y-3 py-4">
      {data.benefits?.map((benefit, i) => (
        <div key={i} className="flex items-start gap-2 p-4 rounded-lg border">
          <div className="flex-1">
            <h5 className="font-medium text-sm">{benefit.title}</h5>
            <p className="text-sm text-muted-foreground mt-1">{benefit.description}</p>
          </div>
          <CopyButton 
            text={`${benefit.title}\n${benefit.description}`} 
            id={`benefit-${i}`} 
            copiedItem={copiedItem} 
            onCopy={onCopy} 
          />
        </div>
      ))}
    </div>
  );
}

function OfferDetailsContent({ data, onCopy, copiedItem }: { data: OfferDetailsSection; onCopy: (text: string, id: string) => void; copiedItem: string | null }) {
  return (
    <div className="space-y-6 py-4">
      {/* Introductions */}
      <div>
        <h4 className="text-sm font-medium mb-3">Introduction Options</h4>
        <div className="space-y-2">
          {data.introductions?.map((intro, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg border">
              <p className="flex-1 text-sm">{intro}</p>
              <CopyButton text={intro} id={`intro-${i}`} copiedItem={copiedItem} onCopy={onCopy} />
            </div>
          ))}
        </div>
      </div>

      {/* Modules */}
      <div>
        <h4 className="text-sm font-medium mb-3">Modules</h4>
        <div className="space-y-2">
          {data.modules?.map((module, i) => (
            <div key={i} className="flex items-start gap-2 p-4 rounded-lg border">
              <div className="flex-1">
                <h5 className="font-medium text-sm">{module.name}</h5>
                <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
              </div>
              <CopyButton 
                text={`${module.name}\n${module.description}`} 
                id={`module-${i}`} 
                copiedItem={copiedItem} 
                onCopy={onCopy} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bonuses */}
      <div>
        <h4 className="text-sm font-medium mb-3">Bonuses</h4>
        <div className="space-y-2">
          {data.bonuses?.map((bonus, i) => (
            <div key={i} className="flex items-start gap-2 p-4 rounded-lg border bg-primary/5">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h5 className="font-medium text-sm">{bonus.name}</h5>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {bonus.value} value
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{bonus.description}</p>
              </div>
              <CopyButton 
                text={`${bonus.name} (${bonus.value} value)\n${bonus.description}`} 
                id={`bonus-${i}`} 
                copiedItem={copiedItem} 
                onCopy={onCopy} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Guarantees */}
      <div>
        <h4 className="text-sm font-medium mb-3">Guarantee Options</h4>
        <div className="space-y-2">
          {data.guarantees?.map((guarantee, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg border">
              <p className="flex-1 text-sm">{guarantee}</p>
              <CopyButton text={guarantee} id={`guarantee-${i}`} copiedItem={copiedItem} onCopy={onCopy} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsContent({ data, onCopy, copiedItem }: { data: TestimonialsSection; onCopy: (text: string, id: string) => void; copiedItem: string | null }) {
  return (
    <div className="space-y-3 py-4">
      <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
        These are sample testimonials. Replace with real customer testimonials before publishing.
      </p>
      {data.testimonials?.map((testimonial, i) => (
        <div key={i} className="flex items-start gap-2 p-4 rounded-lg border">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-sm">{testimonial.name}</span>
              <span className="text-xs text-muted-foreground">• {testimonial.result}</span>
            </div>
            <p className="text-sm italic">"{testimonial.quote}"</p>
          </div>
          <CopyButton 
            text={`"${testimonial.quote}" - ${testimonial.name}`} 
            id={`testimonial-${i}`} 
            copiedItem={copiedItem} 
            onCopy={onCopy} 
          />
        </div>
      ))}
    </div>
  );
}

function FAQsContent({ data, onCopy, copiedItem }: { data: FAQsSection; onCopy: (text: string, id: string) => void; copiedItem: string | null }) {
  return (
    <div className="space-y-3 py-4">
      {data.faqs?.map((faq, i) => (
        <div key={i} className="flex items-start gap-2 p-4 rounded-lg border">
          <div className="flex-1">
            <h5 className="font-medium text-sm">{faq.question}</h5>
            <p className="text-sm text-muted-foreground mt-2">{faq.answer}</p>
          </div>
          <CopyButton 
            text={`Q: ${faq.question}\nA: ${faq.answer}`} 
            id={`faq-${i}`} 
            copiedItem={copiedItem} 
            onCopy={onCopy} 
          />
        </div>
      ))}
    </div>
  );
}

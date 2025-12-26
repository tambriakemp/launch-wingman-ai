import { useState } from "react";
import { ArrowLeft, Sparkles, Eye, Wand2, Loader2, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import type { SalesCopySection, SectionDraft, OfferForCopy } from "./types";
import { AiSuggestions } from "./AiSuggestions";
import type { Json } from "@/integrations/supabase/types";

interface SectionEditorProps {
  projectId: string;
  section: SalesCopySection;
  offer: OfferForCopy;
  draft?: SectionDraft;
  funnel: {
    target_audience: string | null;
    desired_outcome: string | null;
    primary_pain_point: string | null;
    niche: string | null;
    problem_statement: string | null;
  } | null;
  transformationStatement: string | null | undefined;
  onClose: () => void;
}

export const SectionEditor = ({
  projectId,
  section,
  offer,
  draft,
  funnel,
  transformationStatement,
  onClose,
}: SectionEditorProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState(draft?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = async (status: 'drafted' | 'skipped' = 'drafted') => {
    if (!user) return;
    setIsSaving(true);

    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from("sales_page_copy")
        .select("id, sections")
        .eq("project_id", projectId)
        .eq("deliverable_id", offer.id)
        .maybeSingle();

      const sectionDraft: SectionDraft = {
        sectionId: section.id,
        content: status === 'skipped' ? '' : content,
        status,
        updatedAt: new Date().toISOString(),
      };

      const updatedSections = {
        ...(existing?.sections as Record<string, unknown> || {}),
        [section.id]: sectionDraft,
      };

      if (existing) {
        await supabase
          .from("sales_page_copy")
          .update({ sections: updatedSections as Json })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("sales_page_copy")
          .insert({
            project_id: projectId,
            user_id: user.id,
            deliverable_id: offer.id,
            sections: updatedSections as Json,
          });
      }

      queryClient.invalidateQueries({ queryKey: ["sales-copy-content", projectId] });
      toast.success(status === 'skipped' ? "Section skipped" : "Draft saved");
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAi = async () => {
    if (!section.aiEnabled) return;
    setIsGenerating(true);
    setShowAiSuggestions(true);

    try {
      const response = await supabase.functions.invoke("generate-sales-copy", {
        body: {
          sectionType: mapSectionToApiType(section.id),
          audience: funnel?.target_audience || offer.targetAudience,
          problem: funnel?.primary_pain_point || offer.primaryPainPoint,
          desiredOutcome: funnel?.desired_outcome || offer.desiredOutcome,
          offerName: offer.title || "This offer",
          offerType: offer.offerType,
          deliverables: offer.mainDeliverables,
          priceType: offer.priceType,
          price: offer.price,
          transformationStatement,
        },
      });

      if (response.error) throw response.error;

      // Parse suggestions from response
      const suggestions = extractSuggestions(response.data, section.id);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Could not generate suggestions. Try again.");
      setShowAiSuggestions(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseSuggestion = (suggestion: string) => {
    // Don't overwrite - append or show options
    if (content.trim()) {
      setContent(prev => prev + "\n\n" + suggestion);
    } else {
      setContent(suggestion);
    }
    setShowAiSuggestions(false);
    toast.success("Suggestion added to your draft");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to sections
      </Button>

      {/* Section header */}
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">{section.label}</h1>
        
        <Card className="bg-muted/30 border-border/50">
          <CardContent className="py-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Why this matters
              </p>
              <p className="text-sm">{section.whyItMatters}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                What to do
              </p>
              <p className="text-sm">{section.whatToDo}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editor */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Your draft</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="min-h-[200px] resize-y"
        />
      </div>

      {/* AI Suggestions Panel */}
      {showAiSuggestions && (
        <AiSuggestions
          suggestions={aiSuggestions}
          isLoading={isGenerating}
          onUseSuggestion={handleUseSuggestion}
          onClose={() => setShowAiSuggestions(false)}
        />
      )}

      {/* AI Help buttons */}
      {section.aiEnabled && !showAiSuggestions && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAi}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1.5" />
            )}
            Help me write this
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Show examples - could be another modal or inline
              toast.info("Examples coming soon");
            }}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Show examples
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (content.trim()) {
                // Simplify existing content
                toast.info("Simplify feature coming soon");
              }
            }}
            disabled={!content.trim()}
          >
            <Wand2 className="w-4 h-4 mr-1.5" />
            Simplify this
          </Button>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSave('skipped')}
          disabled={isSaving}
        >
          <SkipForward className="w-4 h-4 mr-1.5" />
          Skip for now
        </Button>

        <Button
          onClick={() => handleSave('drafted')}
          disabled={isSaving || !content.trim()}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : null}
          Save draft
        </Button>
      </div>
    </div>
  );
};

// Helper to map section IDs to API section types
function mapSectionToApiType(sectionId: string): string {
  const mapping: Record<string, string> = {
    'headline': 'hero',
    'problem-awareness': 'whyDifferent',
    'desired-outcome': 'benefits',
    'why-different': 'whyDifferent',
    'offer-breakdown': 'offerDetails',
    'who-its-for': 'benefits',
    'social-proof': 'testimonials',
    'cta': 'hero',
    'pain-point': 'whyDifferent',
    'promise': 'benefits',
    'whats-inside': 'offerDetails',
    'authority': 'whyDifferent',
    'why-application': 'whyDifferent',
    'confirmation': 'hero',
    'next-steps': 'offerDetails',
  };
  return mapping[sectionId] || 'hero';
}

// Helper to extract suggestions from AI response
function extractSuggestions(data: unknown, sectionId: string): string[] {
  if (!data || typeof data !== 'object') return [];
  
  const response = data as Record<string, unknown>;
  
  // Try different response formats
  if (response.headlines && Array.isArray(response.headlines)) {
    return response.headlines as string[];
  }
  if (response.subheadlines && Array.isArray(response.subheadlines)) {
    return response.subheadlines as string[];
  }
  if (response.openingParagraphs && Array.isArray(response.openingParagraphs)) {
    return response.openingParagraphs as string[];
  }
  if (response.benefits && Array.isArray(response.benefits)) {
    return (response.benefits as Array<{ title?: string; description?: string }>).map(
      b => `${b.title || ''}: ${b.description || ''}`
    );
  }
  
  return [];
}

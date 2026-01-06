import { useState } from "react";
import { ArrowLeft, Sparkles, Loader2, SkipForward, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [formulasOpen, setFormulasOpen] = useState(false);
  const [questionsOpen, setQuestionsOpen] = useState(false);

  const handleSave = async (status: 'drafted' | 'skipped' = 'drafted') => {
    if (!user) return;
    setIsSaving(true);

    try {
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
          sectionId: section.id,
          audience: funnel?.target_audience || offer.targetAudience,
          problem: funnel?.primary_pain_point || offer.primaryPainPoint,
          desiredOutcome: funnel?.desired_outcome || offer.desiredOutcome,
          offerName: offer.title || "This offer",
          offerType: offer.offerType,
          deliverables: offer.mainDeliverables,
          priceType: offer.priceType,
          price: offer.price,
          transformationStatement,
          projectId,
          niche: funnel?.niche || offer.niche,
          problemStatement: funnel?.problem_statement,
        },
      });

      if (response.error) throw response.error;

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
    if (content.trim()) {
      setContent(prev => prev + "\n\n" + suggestion);
    } else {
      setContent(suggestion);
    }
    setShowAiSuggestions(false);
    toast.success("Suggestion added to your draft");
  };

  const hasFormulas = section.headlineFormulas && section.headlineFormulas.length > 0;
  const hasQuestions = section.questionPrompts && section.questionPrompts.length > 0;

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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Block {section.blockNumber}</Badge>
          <Badge variant="secondary" className="text-xs capitalize">{section.group}</Badge>
        </div>
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

      {/* Headline Formulas */}
      {hasFormulas && (
        <Collapsible open={formulasOpen} onOpenChange={setFormulasOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
              <span className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Headline Formulas ({section.headlineFormulas!.length})
              </span>
              {formulasOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-3 space-y-3">
                {section.headlineFormulas!.map((formula, idx) => (
                  <div key={idx} className="text-sm space-y-1">
                    <p className="font-mono text-xs bg-background/50 p-2 rounded">{formula.template}</p>
                    <p className="text-muted-foreground italic pl-2">Ex: {formula.example}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Question Prompts */}
      {hasQuestions && (
        <Collapsible open={questionsOpen} onOpenChange={setQuestionsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
              <span className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Questions to Answer ({section.questionPrompts!.length})
              </span>
              {questionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Card className="bg-secondary/30">
              <CardContent className="py-3">
                <ul className="space-y-2 text-sm">
                  {section.questionPrompts!.map((q, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-muted-foreground">{idx + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

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

      {/* AI Help button */}
      {section.aiEnabled && !showAiSuggestions && (
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
    'opening-headline': 'hero',
    'paint-the-problem': 'paintProblem',
    'look-into-future': 'lookFuture',
    'introduce-offer': 'introduceOffer',
    'offer-differentiator': 'whyDifferent',
    'the-results': 'results',
    'the-features': 'offerDetails',
    'the-investment': 'investment',
    'the-guarantee': 'guarantee',
    'introduce-yourself': 'aboutMe',
    'is-this-for-you': 'isThisForYou',
    'why-now': 'whyNow',
    'frequent-objections': 'faqs',
    'final-cta': 'finalCta',
  };
  return mapping[sectionId] || 'hero';
}

// Helper to extract suggestions from AI response
function extractSuggestions(data: unknown, sectionId: string): string[] {
  if (!data || typeof data !== 'object') return [];
  
  const response = data as Record<string, unknown>;
  
  // Try different response formats based on what the AI returns
  const possibleKeys = [
    'headlines', 'subheadlines', 'openingParagraphs', 'paragraphs',
    'bullets', 'results', 'features', 'guarantees', 'questions',
    'options', 'suggestions', 'copy'
  ];
  
  for (const key of possibleKeys) {
    if (response[key] && Array.isArray(response[key])) {
      const arr = response[key] as unknown[];
      return arr.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          if (obj.text) return String(obj.text);
          if (obj.title && obj.description) return `${obj.title}: ${obj.description}`;
          if (obj.question && obj.answer) return `Q: ${obj.question}\nA: ${obj.answer}`;
          return JSON.stringify(item);
        }
        return String(item);
      });
    }
  }
  
  return [];
}

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
            {hasQuestions && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Questions to answer
                </p>
                <ul className="space-y-1 text-sm">
                  {section.questionPrompts!.map((q, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-muted-foreground">{idx + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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

// Section-specific response key mappings for 14-block structure
const SECTION_RESPONSE_KEYS: Record<string, string[]> = {
  'opening-headline': ['headlines', 'options', 'suggestions'],
  'paint-the-problem': ['openingParagraphs', 'paragraphs', 'problemParagraphs', 'suggestions'],
  'look-into-future': ['futureParagraphs', 'paragraphs', 'visionStatements', 'suggestions'],
  'introduce-offer': ['introductions', 'paragraphs', 'offerIntros', 'suggestions'],
  'offer-differentiator': ['differentiators', 'paragraphs', 'uniquePoints', 'suggestions'],
  'the-results': ['results', 'bullets', 'outcomes', 'transformations', 'suggestions'],
  'the-features': ['features', 'bullets', 'modules', 'deliverables', 'suggestions'],
  'the-investment': ['investmentFrames', 'pricingCopy', 'paragraphs', 'suggestions'],
  'the-guarantee': ['guarantees', 'paragraphs', 'promiseCopy', 'suggestions'],
  'introduce-yourself': ['bioParagraphs', 'paragraphs', 'aboutSections', 'suggestions'],
  'is-this-for-you': ['qualifiers', 'bullets', 'forYouStatements', 'notForYouStatements', 'suggestions'],
  'why-now': ['urgencyCopy', 'paragraphs', 'timingReasons', 'suggestions'],
  'frequent-objections': ['faqs', 'objectionHandlers', 'questions', 'suggestions'],
  'final-cta': ['ctaCopy', 'closingParagraphs', 'finalStatements', 'suggestions'],
};

// Helper to extract suggestions from AI response
function extractSuggestions(data: unknown, sectionId: string): string[] {
  if (!data || typeof data !== 'object') return [];
  
  const response = data as Record<string, unknown>;
  
  // Get section-specific keys first, then fall back to generic keys
  const sectionKeys = SECTION_RESPONSE_KEYS[sectionId] || [];
  const genericKeys = [
    'headlines', 'subheadlines', 'openingParagraphs', 'paragraphs',
    'bullets', 'results', 'features', 'guarantees', 'questions',
    'options', 'suggestions', 'copy', 'content'
  ];
  
  const keysToTry = [...sectionKeys, ...genericKeys.filter(k => !sectionKeys.includes(k))];
  
  for (const key of keysToTry) {
    if (response[key] && Array.isArray(response[key])) {
      const arr = response[key] as unknown[];
      return arr.map(item => formatSuggestionItem(item, sectionId)).filter(Boolean);
    }
  }
  
  // If no array found, check for direct text content
  if (response.content && typeof response.content === 'string') {
    return [response.content];
  }
  if (response.copy && typeof response.copy === 'string') {
    return [response.copy];
  }
  
  return [];
}

// Format individual suggestion items based on their structure
function formatSuggestionItem(item: unknown, sectionId: string): string {
  if (typeof item === 'string') return item.trim();
  
  if (typeof item === 'object' && item !== null) {
    const obj = item as Record<string, unknown>;
    
    // Handle FAQ/objection format
    if (obj.question && obj.answer) {
      return `**Q: ${obj.question}**\n${obj.answer}`;
    }
    
    // Handle result/feature with title + description
    if (obj.title && obj.description) {
      return `**${obj.title}**\n${obj.description}`;
    }
    
    // Handle "for you" / "not for you" format
    if (obj.forYou || obj.notForYou) {
      const parts: string[] = [];
      if (obj.forYou) parts.push(`✓ This is for you if: ${obj.forYou}`);
      if (obj.notForYou) parts.push(`✗ This is NOT for you if: ${obj.notForYou}`);
      return parts.join('\n');
    }
    
    // Handle feature/module with bullets
    if (obj.name && obj.bullets && Array.isArray(obj.bullets)) {
      const bullets = (obj.bullets as string[]).map(b => `  • ${b}`).join('\n');
      return `**${obj.name}**\n${bullets}`;
    }
    
    // Handle headline with subheadline
    if (obj.headline && obj.subheadline) {
      return `${obj.headline}\n\n${obj.subheadline}`;
    }
    
    // Handle simple text field
    if (obj.text) return String(obj.text).trim();
    if (obj.copy) return String(obj.copy).trim();
    if (obj.content) return String(obj.content).trim();
    
    // Handle result transformations
    if (obj.before && obj.after) {
      return `From: ${obj.before}\nTo: ${obj.after}`;
    }
    
    // Last resort: stringify non-empty objects
    const str = JSON.stringify(item);
    return str !== '{}' ? str : '';
  }
  
  return String(item).trim();
}

import { useState } from "react";
import { Plus, FileText, MoreHorizontal, Pencil, Trash2, Lock, X, Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

// New AI-enabled sections
const SALES_PAGE_SECTIONS = [
  { id: "hero", label: "Hero Section", aiEnabled: true },
  { id: "whyDifferent", label: "Why This Is Different", aiEnabled: true },
  { id: "offerDetails", label: "Offer Details", aiEnabled: false, placeholder: "Detail what's included in your offer..." },
  { id: "testimonials", label: "Testimonials", aiEnabled: false, placeholder: "Add client testimonials and social proof..." },
  { id: "faqs", label: "FAQs", aiEnabled: false, placeholder: "Add frequently asked questions and answers..." },
];

interface HeroSectionData {
  headlines: string[];
  recommendedHeadline: number;
  selectedHeadline: number;
  subheadline: string;
  benefits: string[];
  cta: string;
}

interface WhyDifferentData {
  openingParagraph: string;
  comparisonBullets: string[];
  bridgeSentence: string;
}

interface SalesPageCopy {
  id: string;
  deliverableId: string;
  deliverableName: string;
  sections: Record<string, unknown>;
}

interface SalesPageCopyBuilderProps {
  projectId: string;
}

const DELIVERABLE_NAMES: Record<string, string> = {
  "step-by-step-tutorials": "Step-by-Step Tutorials",
  "checklists": "Checklists",
  "cheat-sheets": "Cheat Sheets",
  "coaching-sessions": "1:1 or Group Coaching Sessions",
  "workbooks": "Workbooks",
  "planners": "Planners",
  "templates": "Templates",
  "trello-boards": "Trello Boards",
  "audio-files": "Audio Files",
  "affirmations": "Affirmations",
  "journals": "Journals",
  "support-groups": "Support Groups",
  "voice-message-support": "Voice Message Support",
  "text-message-support": "Text Message Support",
  "email-support": "Email Support",
  "live-chat-support": "Live Chat Support",
};

export const SalesPageCopyBuilder = ({ projectId }: SalesPageCopyBuilderProps) => {
  const { isSubscribed, user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingItem, setEditingItem] = useState<SalesPageCopy | null>(null);
  const [selectedDeliverable, setSelectedDeliverable] = useState<string>("");
  const [sections, setSections] = useState<Record<string, unknown>>({});
  
  // AI generation states
  const [sectionModes, setSectionModes] = useState<Record<string, "ai" | "manual">>({
    hero: "ai",
    whyDifferent: "ai",
  });
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [heroData, setHeroData] = useState<HeroSectionData | null>(null);
  const [whyDifferentData, setWhyDifferentData] = useState<WhyDifferentData | null>(null);
  
  // Context inputs for "Why Different" section
  const [contextMode, setContextMode] = useState<"infer" | "provide">("infer");
  const [attemptedSolutions, setAttemptedSolutions] = useState("");
  const [whyFails, setWhyFails] = useState("");
  const [uniqueApproach, setUniqueApproach] = useState("");
  const [contextOpen, setContextOpen] = useState(false);

  // Fetch sales page copy from database
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["sales-page-copy", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_page_copy")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return (data || []).map((item) => ({
        id: item.id,
        deliverableId: item.deliverable_id,
        deliverableName: DELIVERABLE_NAMES[item.deliverable_id] || item.deliverable_id,
        sections: (item.sections as Record<string, unknown>) || {},
      }));
    },
    enabled: !!projectId,
  });

  const canAddMore = isSubscribed || items.length < 1;

  // Fetch offer to get deliverables and other data
  const { data: offer } = useQuery({
    queryKey: ["offer", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const deliverables = offer?.main_deliverables || [];

  const getDeliverableName = (id: string) => DELIVERABLE_NAMES[id] || id;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: { deliverableId: string; sections: Record<string, unknown> }) => {
      const { error } = await supabase.from("sales_page_copy").insert({
        project_id: projectId,
        user_id: user?.id,
        deliverable_id: data.deliverableId,
        sections: data.sections as Json,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-page-copy", projectId] });
      toast.success("Sales page copy added");
      resetForm();
    },
    onError: () => toast.error("Failed to save sales page copy"),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; deliverableId: string; sections: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("sales_page_copy")
        .update({
          deliverable_id: data.deliverableId,
          sections: data.sections as Json,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-page-copy", projectId] });
      toast.success("Sales page copy updated");
      resetForm();
    },
    onError: () => toast.error("Failed to update sales page copy"),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales_page_copy").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-page-copy", projectId] });
      toast.success("Sales page copy deleted");
    },
    onError: () => toast.error("Failed to delete sales page copy"),
  });

  const resetForm = () => {
    setIsAddMode(false);
    setEditingItem(null);
    setSelectedDeliverable("");
    setSections({});
    setHeroData(null);
    setWhyDifferentData(null);
    setSectionModes({ hero: "ai", whyDifferent: "ai" });
    setContextMode("infer");
    setAttemptedSolutions("");
    setWhyFails("");
    setUniqueApproach("");
  };

  const handleAdd = () => {
    setEditingItem(null);
    setSelectedDeliverable("");
    setSections({});
    setHeroData(null);
    setWhyDifferentData(null);
    setIsAddMode(true);
  };

  const handleEdit = (item: SalesPageCopy) => {
    setEditingItem(item);
    setSelectedDeliverable(item.deliverableId);
    setSections(item.sections);
    
    // Restore AI data if present
    if (item.sections.hero) {
      setHeroData(item.sections.hero as HeroSectionData);
      setSectionModes(prev => ({ ...prev, hero: "ai" }));
    }
    if (item.sections.whyDifferent) {
      setWhyDifferentData(item.sections.whyDifferent as WhyDifferentData);
      setSectionModes(prev => ({ ...prev, whyDifferent: "ai" }));
    }
    
    setIsAddMode(true);
  };

  const handleDelete = (item: SalesPageCopy) => {
    deleteMutation.mutate(item.id);
  };

  const handleSave = () => {
    if (!selectedDeliverable) {
      toast.error("Please select a deliverable");
      return;
    }

    // Build final sections object
    const finalSections: Record<string, unknown> = { ...sections };
    
    if (sectionModes.hero === "ai" && heroData) {
      finalSections.hero = heroData;
    }
    if (sectionModes.whyDifferent === "ai" && whyDifferentData) {
      finalSections.whyDifferent = whyDifferentData;
    }

    const hasContent = Object.values(finalSections).some((s) => {
      if (typeof s === "string") return s.trim();
      if (typeof s === "object" && s !== null) return true;
      return false;
    });

    if (!hasContent) {
      toast.error("Please add content for at least one section");
      return;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, deliverableId: selectedDeliverable, sections: finalSections });
    } else {
      const existing = items.find((i) => i.deliverableId === selectedDeliverable);
      if (existing) {
        toast.error("Sales page copy already exists for this deliverable. Edit the existing one instead.");
        return;
      }
      createMutation.mutate({ deliverableId: selectedDeliverable, sections: finalSections });
    }
  };

  const updateSection = (sectionId: string, value: string) => {
    setSections((prev) => ({ ...prev, [sectionId]: value }));
  };

  // Generate AI copy for a section
  const generateSectionCopy = async (sectionType: "hero" | "whyDifferent") => {
    if (!offer) {
      toast.error("Please create an offer first to generate copy");
      return;
    }

    setIsGenerating(prev => ({ ...prev, [sectionType]: true }));

    try {
      const payload: Record<string, unknown> = {
        sectionType,
        audience: offer.target_audience,
        problem: offer.primary_pain_point || offer.problem_statement,
        desiredOutcome: offer.desired_outcome,
        offerName: offer.title,
        offerType: offer.offer_type,
        deliverables: offer.main_deliverables,
      };

      if (sectionType === "whyDifferent") {
        if (contextMode === "provide") {
          payload.attemptedSolutions = attemptedSolutions;
          payload.whyFails = whyFails;
          payload.uniqueApproach = uniqueApproach;
          payload.inferContext = false;
        } else {
          payload.inferContext = true;
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-sales-copy", {
        body: payload,
      });

      if (error) throw error;

      if (sectionType === "hero") {
        setHeroData({
          headlines: data.headlines,
          recommendedHeadline: data.recommendedHeadline,
          selectedHeadline: data.recommendedHeadline,
          subheadline: data.subheadline,
          benefits: data.benefits,
          cta: data.cta,
        });
      } else {
        setWhyDifferentData({
          openingParagraph: data.openingParagraph,
          comparisonBullets: data.comparisonBullets,
          bridgeSentence: data.bridgeSentence,
        });
      }

      toast.success(`${sectionType === "hero" ? "Hero" : "Why Different"} section generated!`);
    } catch (error) {
      console.error("Error generating copy:", error);
      toast.error("Failed to generate copy. Please try again.");
    } finally {
      setIsGenerating(prev => ({ ...prev, [sectionType]: false }));
    }
  };

  const availableDeliverables = deliverables.filter(
    (d) => editingItem?.deliverableId === d || !items.find((i) => i.deliverableId === d)
  );

  // Render Hero Section UI
  const renderHeroSection = () => {
    const mode = sectionModes.hero;
    
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Hero Section</Label>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setSectionModes(prev => ({ ...prev, hero: v as "ai" | "manual" }))}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="ai" id="hero-ai" />
              <Label htmlFor="hero-ai" className="text-sm cursor-pointer">Generate with AI</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="manual" id="hero-manual" />
              <Label htmlFor="hero-manual" className="text-sm cursor-pointer">Write my own</Label>
            </div>
          </RadioGroup>
        </div>

        {mode === "ai" ? (
          <div className="space-y-4">
            {!heroData ? (
              <Button
                onClick={() => generateSectionCopy("hero")}
                disabled={isGenerating.hero || !offer}
                className="w-full"
              >
                {isGenerating.hero ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Hero Copy
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Headlines */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Choose Your Headline</Label>
                  <RadioGroup
                    value={String(heroData.selectedHeadline)}
                    onValueChange={(v) => setHeroData(prev => prev ? { ...prev, selectedHeadline: parseInt(v) } : null)}
                    className="space-y-2"
                  >
                    {heroData.headlines.map((headline, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <RadioGroupItem value={String(idx)} id={`headline-${idx}`} className="mt-1" />
                        <Label htmlFor={`headline-${idx}`} className="flex-1 cursor-pointer text-sm">
                          {headline}
                          {idx === heroData.recommendedHeadline && (
                            <Badge variant="secondary" className="ml-2 text-xs">Recommended</Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Subheadline */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Subheadline</Label>
                  <Textarea
                    value={heroData.subheadline}
                    onChange={(e) => setHeroData(prev => prev ? { ...prev, subheadline: e.target.value } : null)}
                    rows={2}
                  />
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Benefit Bullets</Label>
                  {heroData.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-muted-foreground">•</span>
                      <Input
                        value={benefit}
                        onChange={(e) => {
                          const newBenefits = [...heroData.benefits];
                          newBenefits[idx] = e.target.value;
                          setHeroData(prev => prev ? { ...prev, benefits: newBenefits } : null);
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">CTA Button Text</Label>
                  <Input
                    value={heroData.cta}
                    onChange={(e) => setHeroData(prev => prev ? { ...prev, cta: e.target.value } : null)}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateSectionCopy("hero")}
                  disabled={isGenerating.hero}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating.hero ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Textarea
            placeholder="Write your hero section copy..."
            value={(sections.heroManual as string) || ""}
            onChange={(e) => updateSection("heroManual", e.target.value)}
            rows={6}
          />
        )}
      </div>
    );
  };

  // Render Why Different Section UI
  const renderWhyDifferentSection = () => {
    const mode = sectionModes.whyDifferent;
    
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Why This Is Different</Label>
          <RadioGroup
            value={mode}
            onValueChange={(v) => setSectionModes(prev => ({ ...prev, whyDifferent: v as "ai" | "manual" }))}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="ai" id="why-ai" />
              <Label htmlFor="why-ai" className="text-sm cursor-pointer">Generate with AI</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="manual" id="why-manual" />
              <Label htmlFor="why-manual" className="text-sm cursor-pointer">Write my own</Label>
            </div>
          </RadioGroup>
        </div>

        {mode === "ai" ? (
          <div className="space-y-4">
            {!whyDifferentData && (
              <>
                {/* Context mode selection */}
                <div className="space-y-3">
                  <RadioGroup
                    value={contextMode}
                    onValueChange={(v) => setContextMode(v as "infer" | "provide")}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="infer" id="context-infer" />
                      <Label htmlFor="context-infer" className="flex-1 cursor-pointer">
                        <span className="font-medium">Let AI infer context</span>
                        <p className="text-xs text-muted-foreground">AI will determine what solutions your audience has tried based on their problem</p>
                      </Label>
                    </div>
                    <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="provide" id="context-provide" />
                      <Label htmlFor="context-provide" className="flex-1 cursor-pointer">
                        <span className="font-medium">I'll provide specific context</span>
                        <p className="text-xs text-muted-foreground">Enter details about solutions they've tried and why they fail</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Context inputs when providing */}
                {contextMode === "provide" && (
                  <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-between">
                        <span>Context Details</span>
                        {contextOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 mt-3">
                      <div className="space-y-2">
                        <Label className="text-sm">What solutions has your audience tried?</Label>
                        <Textarea
                          placeholder="e.g., Free YouTube tutorials, generic courses, DIY approaches..."
                          value={attemptedSolutions}
                          onChange={(e) => setAttemptedSolutions(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Why do those solutions typically fail? (optional)</Label>
                        <Textarea
                          placeholder="e.g., Too generic, no personalized support, outdated information..."
                          value={whyFails}
                          onChange={(e) => setWhyFails(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">What makes your approach different? (1-2 sentences)</Label>
                        <Textarea
                          placeholder="e.g., Personalized feedback combined with a proven step-by-step framework..."
                          value={uniqueApproach}
                          onChange={(e) => setUniqueApproach(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </>
            )}

            {!whyDifferentData ? (
              <Button
                onClick={() => generateSectionCopy("whyDifferent")}
                disabled={isGenerating.whyDifferent || !offer}
                className="w-full"
              >
                {isGenerating.whyDifferent ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Copy
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Opening Paragraph */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Opening Paragraph</Label>
                  <Textarea
                    value={whyDifferentData.openingParagraph}
                    onChange={(e) => setWhyDifferentData(prev => prev ? { ...prev, openingParagraph: e.target.value } : null)}
                    rows={3}
                  />
                </div>

                {/* Comparison Bullets */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Comparison Bullets</Label>
                  {whyDifferentData.comparisonBullets.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-2">•</span>
                      <Textarea
                        value={bullet}
                        onChange={(e) => {
                          const newBullets = [...whyDifferentData.comparisonBullets];
                          newBullets[idx] = e.target.value;
                          setWhyDifferentData(prev => prev ? { ...prev, comparisonBullets: newBullets } : null);
                        }}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>

                {/* Bridge Sentence */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Bridge Sentence</Label>
                  <Textarea
                    value={whyDifferentData.bridgeSentence}
                    onChange={(e) => setWhyDifferentData(prev => prev ? { ...prev, bridgeSentence: e.target.value } : null)}
                    rows={2}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setWhyDifferentData(null);
                  }}
                  disabled={isGenerating.whyDifferent}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Start Over
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Textarea
            placeholder="Write your 'Why This Is Different' copy..."
            value={(sections.whyDifferentManual as string) || ""}
            onChange={(e) => updateSection("whyDifferentManual", e.target.value)}
            rows={6}
          />
        )}
      </div>
    );
  };

  // Render manual-only sections
  const renderManualSection = (section: typeof SALES_PAGE_SECTIONS[0]) => {
    return (
      <div key={section.id} className="space-y-2 p-4 border rounded-lg bg-background">
        <Label className="text-base font-medium">{section.label}</Label>
        <Textarea
          placeholder={section.placeholder}
          value={(sections[section.id] as string) || ""}
          onChange={(e) => updateSection(section.id, e.target.value)}
          rows={4}
        />
      </div>
    );
  };

  // Show inline form when adding/editing
  if (isAddMode) {
    return (
      <Card className="border bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {editingItem ? "Edit" : "Add"} Sales Page Copy
                </CardTitle>
                <CardDescription className="text-sm">
                  Create compelling copy with AI assistance or write your own
                </CardDescription>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Deliverable Selection */}
          <div className="space-y-2">
            <Label>Select Deliverable</Label>
            <Select value={selectedDeliverable} onValueChange={setSelectedDeliverable}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a deliverable..." />
              </SelectTrigger>
              <SelectContent>
                {availableDeliverables.map((d) => (
                  <SelectItem key={d} value={d}>
                    {getDeliverableName(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* No offer warning */}
          {!offer && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Create an offer first to enable AI-powered copy generation. The AI uses your offer details to create targeted copy.
              </p>
            </div>
          )}

          {/* Sales Page Sections */}
          <div className="space-y-4">
            {renderHeroSection()}
            {renderWhyDifferentSection()}
            {SALES_PAGE_SECTIONS.filter(s => !s.aiEnabled).map(renderManualSection)}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? "Save Changes" : "Save Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Sales Page Copy</CardTitle>
              <CardDescription className="text-sm">
                AI-powered headlines, benefits, and persuasive copy
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdd}
            disabled={deliverables.length === 0 || !canAddMore}
          >
            {!canAddMore && <Lock className="w-4 h-4" />}
            <Plus className="w-4 h-4" />
            Add New
          </Button>
        </div>
        {!isSubscribed && items.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-amber-700 dark:text-amber-400">
                Free plan: 1 sales page copy. Upgrade to Pro to create copy for multiple deliverables.
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {deliverables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">No deliverables found</p>
            <p className="text-xs text-muted-foreground">
              Add deliverables in the Offer Builder first
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">No sales page copy added yet</p>
            <Button size="sm" variant="ghost" onClick={handleAdd}>
              <Plus className="w-4 h-4" />
              Add Your First
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-foreground">{offer?.title || "Untitled Offer"}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {item.deliverableName}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Object.keys(item.sections).length} sections completed
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(item)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

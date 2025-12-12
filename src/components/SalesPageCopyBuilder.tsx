import { useState } from "react";
import { Plus, FileText, MoreHorizontal, Pencil, Trash2, Lock, X, Sparkles, RefreshCw, ChevronDown, ChevronUp, Eye, Check, Wand2, PenLine } from "lucide-react";
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
import { SalesPagePreview } from "./SalesPagePreview";

// Section definitions with AI capability
const SALES_PAGE_SECTIONS = [
  { id: "hero", label: "Hero Section", aiEnabled: true },
  { id: "whyDifferent", label: "Why This Is Different", aiEnabled: true },
  { id: "benefits", label: "Key Benefits", aiEnabled: true },
  { id: "offerDetails", label: "What's Included", aiEnabled: true },
  { id: "testimonials", label: "Testimonials", aiEnabled: true },
  { id: "faqs", label: "FAQs", aiEnabled: true },
];

interface HeroSectionData {
  headlines: string[];
  recommendedHeadline: number;
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

interface SalesPageCopySections {
  hero?: HeroSectionData;
  heroManual?: string;
  whyDifferent?: WhyDifferentData;
  whyDifferentManual?: string;
  benefits?: BenefitsSectionData;
  benefitsManual?: string;
  offerDetails?: OfferDetailsSectionData;
  offerDetailsManual?: string;
  testimonials?: TestimonialsSectionData;
  testimonialsManual?: string;
  faqs?: FAQsSectionData;
  faqsManual?: string;
}

interface SalesPageCopy {
  id: string;
  deliverableId: string;
  deliverableName: string;
  sections: SalesPageCopySections;
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
  const [sections, setSections] = useState<SalesPageCopySections>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // AI generation states
  const [sectionModes, setSectionModes] = useState<Record<string, "ai" | "manual">>({});
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [hasGenerated, setHasGenerated] = useState<Record<string, boolean>>({});
  
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
        sections: (item.sections as SalesPageCopySections) || {},
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
    mutationFn: async (data: { deliverableId: string; sections: SalesPageCopySections }) => {
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
      toast.success("Sales page copy saved");
      resetForm();
    },
    onError: () => toast.error("Failed to save sales page copy"),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; deliverableId: string; sections: SalesPageCopySections }) => {
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
    setSectionModes({});
    setEditingSection(null);
    setContextMode("infer");
    setAttemptedSolutions("");
    setWhyFails("");
    setUniqueApproach("");
  };

  const handleAdd = () => {
    setEditingItem(null);
    setSelectedDeliverable("");
    setSections({});
    setSectionModes({});
    setIsAddMode(true);
  };

  const handleEdit = (item: SalesPageCopy) => {
    setEditingItem(item);
    setSelectedDeliverable(item.deliverableId);
    setSections(item.sections);
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

    const hasContent = Object.values(sections).some((s) => {
      if (typeof s === "string") return s.trim();
      if (typeof s === "object" && s !== null) return true;
      return false;
    });

    if (!hasContent) {
      toast.error("Please add content for at least one section");
      return;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, deliverableId: selectedDeliverable, sections });
    } else {
      const existing = items.find((i) => i.deliverableId === selectedDeliverable);
      if (existing) {
        toast.error("Sales page copy already exists for this deliverable. Edit the existing one instead.");
        return;
      }
      createMutation.mutate({ deliverableId: selectedDeliverable, sections });
    }
  };

  const saveSectionContent = (sectionId: string) => {
    setEditingSection(null);
    toast.success(`${SALES_PAGE_SECTIONS.find(s => s.id === sectionId)?.label} saved`);
  };

  // Generate AI copy for a section
  const generateSectionCopy = async (sectionType: string) => {
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
        price: offer.price,
        priceType: offer.price_type,
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

      // Update sections based on type
      if (sectionType === "hero") {
        setSections(prev => ({
          ...prev,
          hero: {
            headlines: data.headlines,
            recommendedHeadline: data.recommendedHeadline,
            selectedHeadline: data.recommendedHeadline,
            subheadline: data.subheadline,
            cta: data.cta,
          },
        }));
      } else if (sectionType === "whyDifferent") {
        setSections(prev => ({
          ...prev,
          whyDifferent: {
            openingParagraph: data.openingParagraph,
            comparisonBullets: data.comparisonBullets,
            bridgeSentence: data.bridgeSentence,
          },
        }));
      } else if (sectionType === "benefits") {
        setSections(prev => ({
          ...prev,
          benefits: { benefits: data.benefits },
        }));
      } else if (sectionType === "offerDetails") {
        setSections(prev => ({
          ...prev,
          offerDetails: {
            introduction: data.introduction,
            modules: data.modules,
            bonuses: data.bonuses,
            guarantee: data.guarantee,
          },
        }));
      } else if (sectionType === "testimonials") {
        setSections(prev => ({
          ...prev,
          testimonials: { testimonials: data.testimonials },
        }));
      } else if (sectionType === "faqs") {
        setSections(prev => ({
          ...prev,
          faqs: { faqs: data.faqs },
        }));
      }

      setHasGenerated(prev => ({ ...prev, [sectionType]: true }));
      toast.success(`${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} section generated!`);
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

  // Check if a section has content
  const sectionHasContent = (sectionId: string): boolean => {
    const aiData = sections[sectionId as keyof SalesPageCopySections];
    const manualData = sections[`${sectionId}Manual` as keyof SalesPageCopySections];
    return !!(aiData || (typeof manualData === "string" && manualData.trim()));
  };

  // Get section mode (defaults to ai)
  const getSectionMode = (sectionId: string): "ai" | "manual" => {
    return sectionModes[sectionId] || "ai";
  };

  // Render read-only view for a section
  const renderSectionReadOnly = (sectionId: string) => {
    const section = SALES_PAGE_SECTIONS.find(s => s.id === sectionId);
    if (!section) return null;

    const aiData = sections[sectionId as keyof SalesPageCopySections];
    const manualData = sections[`${sectionId}Manual` as keyof SalesPageCopySections] as string | undefined;

    if (!aiData && !manualData) {
      return (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-accent/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">{SALES_PAGE_SECTIONS.findIndex(s => s.id === sectionId) + 1}</span>
            </div>
            <span className="text-muted-foreground">{section.label}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setEditingSection(sectionId)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      );
    }

    return (
      <div className="p-4 border rounded-lg bg-background">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <span className="font-medium">{section.label}</span>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setEditingSection(sectionId)}>
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Show preview of content */}
        <div className="text-sm text-muted-foreground pl-11 space-y-1">
          {sectionId === "hero" && sections.hero && sections.hero.headlines && (
            <>
              <p className="truncate font-medium text-foreground">{sections.hero.headlines[sections.hero.selectedHeadline]}</p>
              <p className="truncate">{sections.hero.subheadline}</p>
            </>
          )}
          {sectionId === "whyDifferent" && sections.whyDifferent && (
            <p className="line-clamp-2">{sections.whyDifferent.openingParagraph}</p>
          )}
          {sectionId === "benefits" && sections.benefits?.benefits && (
            <p>{sections.benefits.benefits.length} benefits added</p>
          )}
          {sectionId === "offerDetails" && sections.offerDetails && (
            <p>{sections.offerDetails.modules?.length || 0} modules, {sections.offerDetails.bonuses?.length || 0} bonuses</p>
          )}
          {sectionId === "testimonials" && sections.testimonials?.testimonials && (
            <p>{sections.testimonials.testimonials.length} testimonials</p>
          )}
          {sectionId === "faqs" && sections.faqs?.faqs && (
            <p>{sections.faqs.faqs.length} FAQs</p>
          )}
          {manualData && (
            <p className="line-clamp-2">{manualData}</p>
          )}
        </div>
      </div>
    );
  };

  // Render Hero Section Editor
  const renderHeroEditor = () => {
    const mode = getSectionMode("hero");
    const heroData = sections.hero;
    
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b">
          <Label className="text-base font-semibold">Hero Section</Label>
          <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mode Selection Cards */}
        {!heroData && !sections.heroManual && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSectionModes(prev => ({ ...prev, hero: "ai" }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                mode === "ai" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Wand2 className="w-5 h-5 mb-2 text-primary" />
              <div className="font-medium text-sm">AI Generate</div>
              <p className="text-xs text-muted-foreground mt-1">Let AI create compelling copy</p>
            </button>
            <button
              type="button"
              onClick={() => setSectionModes(prev => ({ ...prev, hero: "manual" }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                mode === "manual" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <PenLine className="w-5 h-5 mb-2 text-primary" />
              <div className="font-medium text-sm">Write My Own</div>
              <p className="text-xs text-muted-foreground mt-1">Write from scratch</p>
            </button>
          </div>
        )}

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
                    {hasGenerated.hero ? "Regenerate" : "Generate"} Hero Copy
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Choose Your Headline</Label>
                  <RadioGroup
                    value={String(heroData.selectedHeadline)}
                    onValueChange={(v) => setSections(prev => ({
                      ...prev,
                      hero: { ...prev.hero!, selectedHeadline: parseInt(v) }
                    }))}
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

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Subheadline</Label>
                  <Textarea
                    value={heroData.subheadline}
                    onChange={(e) => setSections(prev => ({
                      ...prev,
                      hero: { ...prev.hero!, subheadline: e.target.value }
                    }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">CTA Button Text</Label>
                  <Input
                    value={heroData.cta}
                    onChange={(e) => setSections(prev => ({
                      ...prev,
                      hero: { ...prev.hero!, cta: e.target.value }
                    }))}
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
          <div className="space-y-3">
            <Textarea
              placeholder="Write your hero section copy..."
              value={sections.heroManual || ""}
              onChange={(e) => setSections(prev => ({ ...prev, heroManual: e.target.value }))}
              rows={6}
            />
          </div>
        )}

        <div className="flex justify-between gap-2 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => saveSectionContent("hero")}>
            <Check className="w-4 h-4 mr-1" />
            Save Section
          </Button>
        </div>
      </div>
    );
  };

  // Render Why Different Editor
  const renderWhyDifferentEditor = () => {
    const mode = getSectionMode("whyDifferent");
    const whyDifferentData = sections.whyDifferent;
    
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b">
          <Label className="text-base font-semibold">Why This Is Different</Label>
          <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mode Selection Cards */}
        {!whyDifferentData && !sections.whyDifferentManual && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSectionModes(prev => ({ ...prev, whyDifferent: "ai" }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                mode === "ai" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Wand2 className="w-5 h-5 mb-2 text-primary" />
              <div className="font-medium text-sm">AI Generate</div>
              <p className="text-xs text-muted-foreground mt-1">Let AI create compelling copy</p>
            </button>
            <button
              type="button"
              onClick={() => setSectionModes(prev => ({ ...prev, whyDifferent: "manual" }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                mode === "manual" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <PenLine className="w-5 h-5 mb-2 text-primary" />
              <div className="font-medium text-sm">Write My Own</div>
              <p className="text-xs text-muted-foreground mt-1">Write from scratch</p>
            </button>
          </div>
        )}

        {mode === "ai" ? (
          <div className="space-y-4">
            {!whyDifferentData && (
              <>
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
                        <p className="text-xs text-muted-foreground">AI will determine what solutions your audience has tried</p>
                      </Label>
                    </div>
                    <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="provide" id="context-provide" />
                      <Label htmlFor="context-provide" className="flex-1 cursor-pointer">
                        <span className="font-medium">I'll provide specific context</span>
                        <p className="text-xs text-muted-foreground">Enter details about solutions they've tried</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

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
                          placeholder="e.g., Free YouTube tutorials, generic courses..."
                          value={attemptedSolutions}
                          onChange={(e) => setAttemptedSolutions(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Why do those solutions typically fail?</Label>
                        <Textarea
                          placeholder="e.g., Too generic, no personalized support..."
                          value={whyFails}
                          onChange={(e) => setWhyFails(e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">What makes your approach different?</Label>
                        <Textarea
                          placeholder="e.g., Personalized feedback combined with..."
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
                    {hasGenerated.whyDifferent ? "Regenerate" : "Generate"} Copy
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Opening Paragraph</Label>
                  <Textarea
                    value={whyDifferentData.openingParagraph}
                    onChange={(e) => setSections(prev => ({
                      ...prev,
                      whyDifferent: { ...prev.whyDifferent!, openingParagraph: e.target.value }
                    }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Comparison Bullets</Label>
                  {whyDifferentData.comparisonBullets?.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-2">•</span>
                      <Textarea
                        value={bullet}
                        onChange={(e) => {
                          const newBullets = [...(whyDifferentData.comparisonBullets || [])];
                          newBullets[idx] = e.target.value;
                          setSections(prev => ({
                            ...prev,
                            whyDifferent: { ...prev.whyDifferent!, comparisonBullets: newBullets }
                          }));
                        }}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Bridge Sentence</Label>
                  <Textarea
                    value={whyDifferentData.bridgeSentence}
                    onChange={(e) => setSections(prev => ({
                      ...prev,
                      whyDifferent: { ...prev.whyDifferent!, bridgeSentence: e.target.value }
                    }))}
                    rows={2}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSections(prev => ({ ...prev, whyDifferent: undefined }))}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Start Over
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="Write your 'Why This Is Different' copy..."
              value={sections.whyDifferentManual || ""}
              onChange={(e) => setSections(prev => ({ ...prev, whyDifferentManual: e.target.value }))}
              rows={6}
            />
          </div>
        )}

        <div className="flex justify-between gap-2 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => saveSectionContent("whyDifferent")}>
            <Check className="w-4 h-4 mr-1" />
            Save Section
          </Button>
        </div>
      </div>
    );
  };

  // Render Benefits Editor
  const renderBenefitsEditor = () => {
    const mode = getSectionMode("benefits");
    const benefitsData = sections.benefits;

    const addBenefit = () => {
      const newBenefits = [...(benefitsData?.benefits || []), { title: "", description: "" }];
      setSections(prev => ({ ...prev, benefits: { benefits: newBenefits } }));
    };

    const removeBenefit = (idx: number) => {
      const newBenefits = (benefitsData?.benefits || []).filter((_, i) => i !== idx);
      setSections(prev => ({ ...prev, benefits: { benefits: newBenefits } }));
    };
    
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b">
          <Label className="text-base font-semibold">Key Benefits</Label>
          <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mode Selection Cards */}
        {!benefitsData && !sections.benefitsManual && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSectionModes(prev => ({ ...prev, benefits: "ai" }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                mode === "ai" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Wand2 className="w-5 h-5 mb-2 text-primary" />
              <div className="font-medium text-sm">AI Generate</div>
              <p className="text-xs text-muted-foreground mt-1">Generate 4 benefits, add more manually</p>
            </button>
            <button
              type="button"
              onClick={() => setSectionModes(prev => ({ ...prev, benefits: "manual" }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                mode === "manual" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <PenLine className="w-5 h-5 mb-2 text-primary" />
              <div className="font-medium text-sm">Write My Own</div>
              <p className="text-xs text-muted-foreground mt-1">Write from scratch</p>
            </button>
          </div>
        )}

        {mode === "ai" ? (
          <div className="space-y-4">
            {!benefitsData ? (
              <Button
                onClick={() => generateSectionCopy("benefits")}
                disabled={isGenerating.benefits || !offer}
                className="w-full"
              >
                {isGenerating.benefits ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {hasGenerated.benefits ? "Regenerate" : "Generate"} Benefits
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                {benefitsData.benefits?.map((benefit, idx) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-2 relative group">
                    {benefitsData.benefits.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeBenefit(idx)}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                    <Input
                      value={benefit.title}
                      onChange={(e) => {
                        const newBenefits = [...(benefitsData.benefits || [])];
                        newBenefits[idx] = { ...newBenefits[idx], title: e.target.value };
                        setSections(prev => ({ ...prev, benefits: { benefits: newBenefits } }));
                      }}
                      placeholder="Benefit title"
                      className="font-medium pr-8"
                    />
                    <Textarea
                      value={benefit.description}
                      onChange={(e) => {
                        const newBenefits = [...(benefitsData.benefits || [])];
                        newBenefits[idx] = { ...newBenefits[idx], description: e.target.value };
                        setSections(prev => ({ ...prev, benefits: { benefits: newBenefits } }));
                      }}
                      placeholder="Benefit description"
                      rows={2}
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addBenefit}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Benefit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateSectionCopy("benefits")}
                    disabled={isGenerating.benefits}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating.benefits ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="List your key benefits..."
              value={sections.benefitsManual || ""}
              onChange={(e) => setSections(prev => ({ ...prev, benefitsManual: e.target.value }))}
              rows={6}
            />
          </div>
        )}

        <div className="flex justify-between gap-2 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => saveSectionContent("benefits")}>
            <Check className="w-4 h-4 mr-1" />
            Save Section
          </Button>
        </div>
      </div>
    );
  };

  // Render Offer Details Editor
  const renderOfferDetailsEditor = () => {
    const mode = getSectionMode("offerDetails");
    const offerDetailsData = sections.offerDetails;
    
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b">
          <Label className="text-base font-semibold">What's Included</Label>
          <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mode Selection Cards */}
        {!offerDetailsData && !sections.offerDetailsManual && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSectionModes(prev => ({ ...prev, offerDetails: "ai" }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                mode === "ai" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Wand2 className="w-5 h-5 mb-2 text-primary" />
              <div className="font-medium text-sm">AI Generate</div>
              <p className="text-xs text-muted-foreground mt-1">Let AI create compelling copy</p>
            </button>
            <button
              type="button"
              onClick={() => setSectionModes(prev => ({ ...prev, offerDetails: "manual" }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                mode === "manual" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <PenLine className="w-5 h-5 mb-2 text-primary" />
              <div className="font-medium text-sm">Write My Own</div>
              <p className="text-xs text-muted-foreground mt-1">Write from scratch</p>
            </button>
          </div>
        )}

        {mode === "ai" ? (
          <div className="space-y-4">
            {!offerDetailsData ? (
              <Button
                onClick={() => generateSectionCopy("offerDetails")}
                disabled={isGenerating.offerDetails || !offer}
                className="w-full"
              >
                {isGenerating.offerDetails ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {hasGenerated.offerDetails ? "Regenerate" : "Generate"} Offer Details
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Introduction</Label>
                  <Textarea
                    value={offerDetailsData.introduction}
                    onChange={(e) => setSections(prev => ({
                      ...prev,
                      offerDetails: { ...prev.offerDetails!, introduction: e.target.value }
                    }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Modules</Label>
                  {offerDetailsData.modules?.map((module, idx) => (
                    <div key={idx} className="p-3 border rounded-lg space-y-2">
                      <Input
                        value={module.name}
                        onChange={(e) => {
                          const newModules = [...(offerDetailsData.modules || [])];
                          newModules[idx] = { ...newModules[idx], name: e.target.value };
                          setSections(prev => ({ ...prev, offerDetails: { ...prev.offerDetails!, modules: newModules } }));
                        }}
                        placeholder="Module name"
                        className="font-medium"
                      />
                      <Textarea
                        value={module.description}
                        onChange={(e) => {
                          const newModules = [...(offerDetailsData.modules || [])];
                          newModules[idx] = { ...newModules[idx], description: e.target.value };
                          setSections(prev => ({ ...prev, offerDetails: { ...prev.offerDetails!, modules: newModules } }));
                        }}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Bonuses</Label>
                  {offerDetailsData.bonuses?.map((bonus, idx) => (
                    <div key={idx} className="p-3 border rounded-lg space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={bonus.name}
                          onChange={(e) => {
                            const newBonuses = [...(offerDetailsData.bonuses || [])];
                            newBonuses[idx] = { ...newBonuses[idx], name: e.target.value };
                            setSections(prev => ({ ...prev, offerDetails: { ...prev.offerDetails!, bonuses: newBonuses } }));
                          }}
                          placeholder="Bonus name"
                          className="flex-1"
                        />
                        <Input
                          value={bonus.value}
                          onChange={(e) => {
                            const newBonuses = [...(offerDetailsData.bonuses || [])];
                            newBonuses[idx] = { ...newBonuses[idx], value: e.target.value };
                            setSections(prev => ({ ...prev, offerDetails: { ...prev.offerDetails!, bonuses: newBonuses } }));
                          }}
                          placeholder="Value"
                          className="w-24"
                        />
                      </div>
                      <Textarea
                        value={bonus.description}
                        onChange={(e) => {
                          const newBonuses = [...(offerDetailsData.bonuses || [])];
                          newBonuses[idx] = { ...newBonuses[idx], description: e.target.value };
                          setSections(prev => ({ ...prev, offerDetails: { ...prev.offerDetails!, bonuses: newBonuses } }));
                        }}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Guarantee</Label>
                  <Textarea
                    value={offerDetailsData.guarantee}
                    onChange={(e) => setSections(prev => ({
                      ...prev,
                      offerDetails: { ...prev.offerDetails!, guarantee: e.target.value }
                    }))}
                    rows={2}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateSectionCopy("offerDetails")}
                  disabled={isGenerating.offerDetails}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating.offerDetails ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="Describe what's included in your offer..."
              value={sections.offerDetailsManual || ""}
              onChange={(e) => setSections(prev => ({ ...prev, offerDetailsManual: e.target.value }))}
              rows={8}
            />
          </div>
        )}

        <div className="flex justify-between gap-2 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => saveSectionContent("offerDetails")}>
            <Check className="w-4 h-4 mr-1" />
            Save Section
          </Button>
        </div>
      </div>
    );
  };

  // Render Testimonials Editor
  const renderTestimonialsEditor = () => {
    const mode = getSectionMode("testimonials");
    const testimonialsData = sections.testimonials;
    
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b">
          <Label className="text-base font-semibold">Testimonials</Label>
          <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mode Selection Cards */}
        {!testimonialsData && !sections.testimonialsManual && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSectionModes(prev => ({ ...prev, testimonials: "ai" }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                mode === "ai" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Wand2 className="w-5 h-5 mb-2 text-primary" />
              <div className="font-medium text-sm">AI Generate</div>
              <p className="text-xs text-muted-foreground mt-1">Create sample testimonials</p>
            </button>
            <button
              type="button"
              onClick={() => setSectionModes(prev => ({ ...prev, testimonials: "manual" }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                mode === "manual" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <PenLine className="w-5 h-5 mb-2 text-primary" />
              <div className="font-medium text-sm">Write My Own</div>
              <p className="text-xs text-muted-foreground mt-1">Add real testimonials</p>
            </button>
          </div>
        )}

        {mode === "ai" ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">AI generates sample testimonials as templates. Replace with real testimonials before publishing.</p>
            {!testimonialsData ? (
              <Button
                onClick={() => generateSectionCopy("testimonials")}
                disabled={isGenerating.testimonials || !offer}
                className="w-full"
              >
                {isGenerating.testimonials ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {hasGenerated.testimonials ? "Regenerate" : "Generate"} Sample Testimonials
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                {testimonialsData.testimonials?.map((testimonial, idx) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={testimonial.name}
                        onChange={(e) => {
                          const newTestimonials = [...(testimonialsData.testimonials || [])];
                          newTestimonials[idx] = { ...newTestimonials[idx], name: e.target.value };
                          setSections(prev => ({ ...prev, testimonials: { testimonials: newTestimonials } }));
                        }}
                        placeholder="Name"
                        className="flex-1"
                      />
                      <Input
                        value={testimonial.result}
                        onChange={(e) => {
                          const newTestimonials = [...(testimonialsData.testimonials || [])];
                          newTestimonials[idx] = { ...newTestimonials[idx], result: e.target.value };
                          setSections(prev => ({ ...prev, testimonials: { testimonials: newTestimonials } }));
                        }}
                        placeholder="Result achieved"
                        className="flex-1"
                      />
                    </div>
                    <Textarea
                      value={testimonial.quote}
                      onChange={(e) => {
                        const newTestimonials = [...(testimonialsData.testimonials || [])];
                        newTestimonials[idx] = { ...newTestimonials[idx], quote: e.target.value };
                        setSections(prev => ({ ...prev, testimonials: { testimonials: newTestimonials } }));
                      }}
                      placeholder="Testimonial quote"
                      rows={2}
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateSectionCopy("testimonials")}
                  disabled={isGenerating.testimonials}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating.testimonials ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="Add your testimonials..."
              value={sections.testimonialsManual || ""}
              onChange={(e) => setSections(prev => ({ ...prev, testimonialsManual: e.target.value }))}
              rows={6}
            />
          </div>
        )}

        <div className="flex justify-between gap-2 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => saveSectionContent("testimonials")}>
            <Check className="w-4 h-4 mr-1" />
            Save Section
          </Button>
        </div>
      </div>
    );
  };

  // Render FAQs Editor
  const renderFaqsEditor = () => {
    const mode = getSectionMode("faqs");
    const faqsData = sections.faqs;
    
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b">
          <Label className="text-base font-semibold">FAQs</Label>
          <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Mode Selection Cards */}
        {!faqsData && !sections.faqsManual && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSectionModes(prev => ({ ...prev, faqs: "ai" }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                mode === "ai" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Wand2 className="w-5 h-5 mb-2 text-primary" />
              <div className="font-medium text-sm">AI Generate</div>
              <p className="text-xs text-muted-foreground mt-1">Create common FAQs</p>
            </button>
            <button
              type="button"
              onClick={() => setSectionModes(prev => ({ ...prev, faqs: "manual" }))}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                mode === "manual" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              }`}
            >
              <PenLine className="w-5 h-5 mb-2 text-primary" />
              <div className="font-medium text-sm">Write My Own</div>
              <p className="text-xs text-muted-foreground mt-1">Add your own FAQs</p>
            </button>
          </div>
        )}

        {mode === "ai" ? (
          <div className="space-y-4">
            {!faqsData ? (
              <Button
                onClick={() => generateSectionCopy("faqs")}
                disabled={isGenerating.faqs || !offer}
                className="w-full"
              >
                {isGenerating.faqs ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {hasGenerated.faqs ? "Regenerate" : "Generate"} FAQs
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                {faqsData.faqs?.map((faq, idx) => (
                  <div key={idx} className="p-3 border rounded-lg space-y-2">
                    <Input
                      value={faq.question}
                      onChange={(e) => {
                        const newFaqs = [...(faqsData.faqs || [])];
                        newFaqs[idx] = { ...newFaqs[idx], question: e.target.value };
                        setSections(prev => ({ ...prev, faqs: { faqs: newFaqs } }));
                      }}
                      placeholder="Question"
                      className="font-medium"
                    />
                    <Textarea
                      value={faq.answer}
                      onChange={(e) => {
                        const newFaqs = [...(faqsData.faqs || [])];
                        newFaqs[idx] = { ...newFaqs[idx], answer: e.target.value };
                        setSections(prev => ({ ...prev, faqs: { faqs: newFaqs } }));
                      }}
                      placeholder="Answer"
                      rows={2}
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateSectionCopy("faqs")}
                  disabled={isGenerating.faqs}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating.faqs ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="Add your FAQs..."
              value={sections.faqsManual || ""}
              onChange={(e) => setSections(prev => ({ ...prev, faqsManual: e.target.value }))}
              rows={6}
            />
          </div>
        )}

        <div className="flex justify-between gap-2 pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => saveSectionContent("faqs")}>
            <Check className="w-4 h-4 mr-1" />
            Save Section
          </Button>
        </div>
      </div>
    );
  };

  // Render the appropriate section editor
  const renderSectionEditor = (sectionId: string) => {
    switch (sectionId) {
      case "hero": return renderHeroEditor();
      case "whyDifferent": return renderWhyDifferentEditor();
      case "benefits": return renderBenefitsEditor();
      case "offerDetails": return renderOfferDetailsEditor();
      case "testimonials": return renderTestimonialsEditor();
      case "faqs": return renderFaqsEditor();
      default: return null;
    }
  };

  // Show inline form when adding/editing
  if (isAddMode) {
    return (
      <>
        <Card className="border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {editingItem ? "Edit" : "Create"} Sales Page Copy
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Build compelling sales copy section by section
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowPreview(true)}>
                  <Eye className="w-4 h-4 mr-1" />
                  Preview Sales Page Copy
                </Button>
                <Button size="icon" variant="ghost" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
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
                  Create an offer first to enable AI-powered copy generation.
                </p>
              </div>
            )}

            {/* Sales Page Sections */}
            <div className="space-y-3">
              {SALES_PAGE_SECTIONS.map((section) => (
                <div key={section.id}>
                  {editingSection === section.id ? (
                    renderSectionEditor(section.id)
                  ) : (
                    renderSectionReadOnly(section.id)
                  )}
                </div>
              ))}
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

        <SalesPagePreview
          open={showPreview}
          onOpenChange={setShowPreview}
          offerName={offer?.title || "Untitled Offer"}
          sections={sections}
        />
      </>
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
                Free plan: 1 sales page copy. Upgrade to Pro for unlimited.
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
                      {Object.keys(item.sections).filter(k => !k.endsWith("Manual") || item.sections[k as keyof SalesPageCopySections]).length} sections completed
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

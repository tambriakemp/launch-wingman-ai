import { useState } from "react";
import { Plus, FileText, MoreHorizontal, Pencil, Trash2, Lock, X, Sparkles, RefreshCw, Eye, Check, Wand2, PenLine, ArrowLeft, GripVertical } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import { SalesPagePreview } from "./SalesPagePreview";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ChevronDown, ChevronUp } from "lucide-react";

// Section definitions with AI capability
const DEFAULT_SECTIONS = [
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

interface CustomSection {
  id: string;
  label: string;
  content: string;
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
  customSections?: CustomSection[];
  sectionOrder?: string[];
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
  const [showAddCustomSection, setShowAddCustomSection] = useState(false);
  const [customSectionName, setCustomSectionName] = useState("");
  
  // Section order state
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => 
    DEFAULT_SECTIONS.map(s => s.id)
  );
  
  // AI generation states
  const [sectionModes, setSectionModes] = useState<Record<string, "ai" | "manual">>({});
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [hasGenerated, setHasGenerated] = useState<Record<string, boolean>>({});
  
  // Hero part selection
  const [selectedHeroPart, setSelectedHeroPart] = useState("headlines");
  
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
        sections: { ...data.sections, sectionOrder } as unknown as Json,
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
          sections: { ...data.sections, sectionOrder } as unknown as Json,
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
    setSectionOrder(DEFAULT_SECTIONS.map(s => s.id));
  };

  const handleAdd = () => {
    setEditingItem(null);
    setSelectedDeliverable("");
    setSections({});
    setSectionModes({});
    setSectionOrder(DEFAULT_SECTIONS.map(s => s.id));
    setIsAddMode(true);
  };

  const handleEdit = (item: SalesPageCopy) => {
    setEditingItem(item);
    setSelectedDeliverable(item.deliverableId);
    setSections(item.sections);
    setSectionOrder(item.sections.sectionOrder || DEFAULT_SECTIONS.map(s => s.id));
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
    toast.success(`${getAllSections().find(s => s.id === sectionId)?.label} saved`);
  };

  // Get all sections including custom ones
  const getAllSections = () => {
    const customSections = sections.customSections || [];
    const allSections = [
      ...DEFAULT_SECTIONS,
      ...customSections.map(cs => ({ id: cs.id, label: cs.label, aiEnabled: false }))
    ];
    
    // Sort by sectionOrder
    return allSections.sort((a, b) => {
      const aIdx = sectionOrder.indexOf(a.id);
      const bIdx = sectionOrder.indexOf(b.id);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  };

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const newOrder = Array.from(sectionOrder);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    
    setSectionOrder(newOrder);
  };

  // Add custom section
  const handleAddCustomSection = () => {
    if (!customSectionName.trim()) {
      toast.error("Please enter a section name");
      return;
    }

    const customId = `custom_${Date.now()}`;
    const newCustomSections = [
      ...(sections.customSections || []),
      { id: customId, label: customSectionName.trim(), content: "" }
    ];
    
    setSections(prev => ({ ...prev, customSections: newCustomSections }));
    setSectionOrder(prev => [...prev, customId]);
    setCustomSectionName("");
    setShowAddCustomSection(false);
    toast.success("Custom section added");
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
    // Check for custom section
    if (sectionId.startsWith("custom_")) {
      const customSection = sections.customSections?.find(cs => cs.id === sectionId);
      return !!(customSection?.content?.trim());
    }
    
    const aiData = sections[sectionId as keyof SalesPageCopySections];
    const manualData = sections[`${sectionId}Manual` as keyof SalesPageCopySections];
    return !!(aiData || (typeof manualData === "string" && manualData.trim()));
  };

  // Check if section is AI mode
  const isSectionAiMode = (sectionId: string): boolean => {
    if (sectionId.startsWith("custom_")) return false;
    const mode = sectionModes[sectionId] || "ai";
    const hasAiData = !!sections[sectionId as keyof SalesPageCopySections];
    return mode === "ai" || hasAiData;
  };

  // Get section preview text
  const getSectionPreview = (sectionId: string): string => {
    if (sectionId === "hero" && sections.hero?.headlines) {
      return sections.hero.headlines[sections.hero.selectedHeadline] || "";
    }
    if (sectionId === "whyDifferent" && sections.whyDifferent) {
      return sections.whyDifferent.openingParagraph || "";
    }
    if (sectionId === "benefits" && sections.benefits?.benefits) {
      return `${sections.benefits.benefits.length} benefits`;
    }
    if (sectionId === "offerDetails" && sections.offerDetails) {
      return `${sections.offerDetails.modules?.length || 0} modules, ${sections.offerDetails.bonuses?.length || 0} bonuses`;
    }
    if (sectionId === "testimonials" && sections.testimonials?.testimonials) {
      return `${sections.testimonials.testimonials.length} testimonials`;
    }
    if (sectionId === "faqs" && sections.faqs?.faqs) {
      return `${sections.faqs.faqs.length} FAQs`;
    }
    
    // Check for manual content
    const manualKey = `${sectionId}Manual` as keyof SalesPageCopySections;
    if (typeof sections[manualKey] === "string") {
      return (sections[manualKey] as string).slice(0, 50) + "...";
    }
    
    // Check for custom section
    if (sectionId.startsWith("custom_")) {
      const customSection = sections.customSections?.find(cs => cs.id === sectionId);
      return customSection?.content?.slice(0, 50) || "";
    }
    
    return "";
  };

  // Get section mode
  const getSectionMode = (sectionId: string): "ai" | "manual" => {
    return sectionModes[sectionId] || "ai";
  };

  // ============ SECTION LIST VIEW ============
  const renderSectionsList = () => {
    const allSections = getAllSections();
    
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {allSections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-3 p-4 border rounded-lg bg-card transition-all ${
                        snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : "hover:shadow-sm"
                      } ${sectionHasContent(section.id) ? "border-border" : "border-dashed border-muted-foreground/30"}`}
                    >
                      {/* Drag Handle */}
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>

                      {/* Index Badge */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium ${
                          sectionHasContent(section.id)
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {sectionHasContent(section.id) ? <Check className="w-4 h-4" /> : index + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${!sectionHasContent(section.id) && "text-muted-foreground"}`}>
                            {section.label}
                          </span>
                          {sectionHasContent(section.id) && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              {isSectionAiMode(section.id) ? (
                                <Wand2 className="w-3 h-3" />
                              ) : (
                                <PenLine className="w-3 h-3" />
                              )}
                            </span>
                          )}
                        </div>
                        {getSectionPreview(section.id) && (
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {getSectionPreview(section.id)}
                          </p>
                        )}
                      </div>

                      {/* Action */}
                      <Button
                        size="sm"
                        variant={sectionHasContent(section.id) ? "ghost" : "outline"}
                        onClick={() => setEditingSection(section.id)}
                        className="shrink-0"
                      >
                        {sectionHasContent(section.id) ? (
                          <>
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  };

  // ============ FULL-SCREEN SECTION EDITOR ============
  const renderFullSectionEditor = () => {
    if (!editingSection) return null;
    
    const section = getAllSections().find(s => s.id === editingSection);
    if (!section) return null;

    const mode = getSectionMode(editingSection);
    const isCustom = editingSection.startsWith("custom_");

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Sections
            </Button>
            <div className="h-4 w-px bg-border" />
            <h2 className="font-semibold">{section.label}</h2>
          </div>
          <Button onClick={() => saveSectionContent(editingSection)}>
            <Check className="w-4 h-4 mr-1" />
            Save Section
          </Button>
        </div>

        {/* Two-Panel Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x overflow-hidden">
          {/* Left Panel - Inputs */}
          <div className="flex flex-col overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Mode Selection (not for custom sections) */}
              {!isCustom && section.aiEnabled && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">How would you like to create this section?</Label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSectionModes(prev => ({ ...prev, [editingSection]: "ai" }))}
                      className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
                        mode === "ai" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Wand2 className="w-5 h-5 mb-2 text-primary" />
                      <div className="font-medium text-sm">AI Generate</div>
                      <p className="text-xs text-muted-foreground mt-1">Let AI create compelling copy</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectionModes(prev => ({ ...prev, [editingSection]: "manual" }))}
                      className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
                        mode === "manual" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <PenLine className="w-5 h-5 mb-2 text-primary" />
                      <div className="font-medium text-sm">Write My Own</div>
                      <p className="text-xs text-muted-foreground mt-1">Write from scratch</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Section-specific editor content */}
              {renderSectionEditorContent(editingSection, mode, isCustom)}

              {/* Generate Button (AI mode only, not custom) */}
              {!isCustom && mode === "ai" && section.aiEnabled && (
                <Button
                  onClick={() => generateSectionCopy(editingSection)}
                  disabled={isGenerating[editingSection] || !offer}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating[editingSection] ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {hasGenerated[editingSection] ? "Regenerate" : "Generate"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Right Panel - Outputs/Preview */}
          <div className="flex flex-col bg-muted/10 overflow-y-auto">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-medium text-sm">
                {mode === "ai" ? "Generated Outputs" : "Preview"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mode === "ai" ? "Click to select an option" : "Your content will appear here"}
              </p>
            </div>
            <div className="flex-1 p-4">
              {renderSectionOutputPanel(editingSection, mode)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render section-specific editor content
  const renderSectionEditorContent = (sectionId: string, mode: "ai" | "manual", isCustom: boolean) => {
    // Custom section
    if (isCustom) {
      const customSection = sections.customSections?.find(cs => cs.id === sectionId);
      return (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Section Content</Label>
          <Textarea
            placeholder="Write your section content..."
            value={customSection?.content || ""}
            onChange={(e) => {
              const newCustomSections = sections.customSections?.map(cs =>
                cs.id === sectionId ? { ...cs, content: e.target.value } : cs
              ) || [];
              setSections(prev => ({ ...prev, customSections: newCustomSections }));
            }}
            rows={10}
          />
        </div>
      );
    }

    // Manual mode - just a textarea
    if (mode === "manual") {
      const manualKey = `${sectionId}Manual` as keyof SalesPageCopySections;
      return (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Section Content</Label>
          <Textarea
            placeholder={`Write your ${getAllSections().find(s => s.id === sectionId)?.label.toLowerCase()} content...`}
            value={(sections[manualKey] as string) || ""}
            onChange={(e) => setSections(prev => ({ ...prev, [manualKey]: e.target.value }))}
            rows={10}
          />
        </div>
      );
    }

    // AI mode - section-specific editors
    switch (sectionId) {
      case "hero":
        return renderHeroEditorInputs();
      case "whyDifferent":
        return renderWhyDifferentEditorInputs();
      case "benefits":
        return renderBenefitsEditorInputs();
      case "offerDetails":
        return renderOfferDetailsEditorInputs();
      case "testimonials":
        return renderTestimonialsEditorInputs();
      case "faqs":
        return renderFaqsEditorInputs();
      default:
        return null;
    }
  };

  // Hero Editor Inputs
  const renderHeroEditorInputs = () => {
    const heroData = sections.hero;
    
    const parts = [
      { id: "headlines", label: "Headlines", hasContent: !!heroData?.headlines?.length },
      { id: "subheadline", label: "Subheadline", hasContent: !!heroData?.subheadline },
      { id: "cta", label: "CTA Button", hasContent: !!heroData?.cta },
    ];

    return (
      <div className="space-y-4">
        {/* Part Selector */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Select Part to Edit
          </p>
          {parts.map((part) => (
            <button
              key={part.id}
              onClick={() => setSelectedHeroPart(part.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-sm transition-all ${
                selectedHeroPart === part.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              <span>{part.label}</span>
              {part.hasContent && <Check className="w-3.5 h-3.5 text-green-500" />}
            </button>
          ))}
        </div>

        {/* Part-specific inputs */}
        <div className="pt-4 border-t">
          {selectedHeroPart === "headlines" && heroData?.headlines && (
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
                        <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">Recommended</span>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {selectedHeroPart === "subheadline" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subheadline</Label>
              <Textarea
                value={heroData?.subheadline || ""}
                onChange={(e) => setSections(prev => ({
                  ...prev,
                  hero: { ...prev.hero!, subheadline: e.target.value }
                }))}
                placeholder="Enter your subheadline..."
                rows={3}
              />
            </div>
          )}

          {selectedHeroPart === "cta" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">CTA Button Text</Label>
              <Input
                value={heroData?.cta || ""}
                onChange={(e) => setSections(prev => ({
                  ...prev,
                  hero: { ...prev.hero!, cta: e.target.value }
                }))}
                placeholder="e.g., Get Started Now"
              />
            </div>
          )}

          {!heroData && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Click "Generate" to create headline options
            </p>
          )}
        </div>
      </div>
    );
  };

  // WhyDifferent Editor Inputs
  const renderWhyDifferentEditorInputs = () => {
    const whyDifferentData = sections.whyDifferent;

    return (
      <div className="space-y-4">
        {!whyDifferentData && (
          <>
            <div className="space-y-3">
              <Label className="text-sm font-medium">Context Source</Label>
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

        {whyDifferentData && (
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
          </div>
        )}

        {!whyDifferentData && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click "Generate" to create differentiating copy
          </p>
        )}
      </div>
    );
  };

  // Benefits Editor Inputs
  const renderBenefitsEditorInputs = () => {
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
      <div className="space-y-4">
        {benefitsData?.benefits?.map((benefit, idx) => (
          <div key={idx} className="p-4 border rounded-lg space-y-3 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => removeBenefit(idx)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Benefit {idx + 1} Title</Label>
              <Input
                value={benefit.title}
                onChange={(e) => {
                  const newBenefits = [...(benefitsData?.benefits || [])];
                  newBenefits[idx] = { ...newBenefits[idx], title: e.target.value };
                  setSections(prev => ({ ...prev, benefits: { benefits: newBenefits } }));
                }}
                placeholder="Benefit title..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea
                value={benefit.description}
                onChange={(e) => {
                  const newBenefits = [...(benefitsData?.benefits || [])];
                  newBenefits[idx] = { ...newBenefits[idx], description: e.target.value };
                  setSections(prev => ({ ...prev, benefits: { benefits: newBenefits } }));
                }}
                rows={2}
                placeholder="Benefit description..."
              />
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addBenefit} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Add Benefit
        </Button>

        {!benefitsData?.benefits?.length && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click "Generate" to create 4 key benefits
          </p>
        )}
      </div>
    );
  };

  // Offer Details Editor Inputs
  const renderOfferDetailsEditorInputs = () => {
    const offerDetailsData = sections.offerDetails;

    if (!offerDetailsData) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">
          Click "Generate" to create offer details
        </p>
      );
    }

    return (
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
      </div>
    );
  };

  // Testimonials Editor Inputs
  const renderTestimonialsEditorInputs = () => {
    const testimonialsData = sections.testimonials;

    if (!testimonialsData) {
      return (
        <>
          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            AI generates sample testimonials as templates. Replace with real testimonials before publishing.
          </p>
          <p className="text-sm text-muted-foreground text-center py-4">
            Click "Generate" to create sample testimonials
          </p>
        </>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          AI generates sample testimonials as templates. Replace with real testimonials before publishing.
        </p>
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
      </div>
    );
  };

  // FAQs Editor Inputs
  const renderFaqsEditorInputs = () => {
    const faqsData = sections.faqs;

    if (!faqsData) {
      return (
        <p className="text-sm text-muted-foreground text-center py-4">
          Click "Generate" to create FAQs
        </p>
      );
    }

    return (
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
      </div>
    );
  };

  // Render output panel for section
  const renderSectionOutputPanel = (sectionId: string, mode: "ai" | "manual") => {
    if (mode === "manual" || sectionId.startsWith("custom_")) {
      const manualKey = `${sectionId}Manual` as keyof SalesPageCopySections;
      const content = sectionId.startsWith("custom_") 
        ? sections.customSections?.find(cs => cs.id === sectionId)?.content
        : (sections[manualKey] as string);
      
      if (!content) {
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Your content will appear here as you type</p>
          </div>
        );
      }
      
      return (
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      );
    }

    // AI mode outputs
    const sectionData = sections[sectionId as keyof SalesPageCopySections];
    
    if (!sectionData) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">Click "Generate" to see AI-generated options</p>
        </div>
      );
    }

    // Display based on section type
    switch (sectionId) {
      case "hero":
        const heroData = sectionData as HeroSectionData;
        return (
          <div className="space-y-3">
            {heroData.headlines?.map((headline, idx) => (
              <div
                key={idx}
                onClick={() => setSections(prev => ({
                  ...prev,
                  hero: { ...prev.hero!, selectedHeadline: idx }
                }))}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  heroData.selectedHeadline === idx
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Headline {idx + 1}</span>
                  {idx === heroData.recommendedHeadline && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">Recommended</span>
                  )}
                  {heroData.selectedHeadline === idx && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-sm font-medium">{headline}</p>
              </div>
            ))}
          </div>
        );
      
      case "benefits":
        const benefitsData = sectionData as BenefitsSectionData;
        return (
          <div className="space-y-3">
            {benefitsData.benefits?.map((benefit, idx) => (
              <div key={idx} className="p-4 border rounded-lg bg-card">
                <h4 className="font-medium text-sm">{benefit.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{benefit.description}</p>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <div className="p-4 border rounded-lg bg-card">
            <p className="text-sm text-muted-foreground">Content generated successfully</p>
          </div>
        );
    }
  };

  // ============ MAIN RENDER ============

  // Show full-screen section editor when editing
  if (isAddMode && editingSection) {
    return (
      <Card className="border bg-card h-[calc(100vh-200px)] min-h-[600px]">
        {renderFullSectionEditor()}
        <SalesPagePreview
          open={showPreview}
          onOpenChange={setShowPreview}
          offerName={offer?.title || "Untitled Offer"}
          sections={sections}
        />
      </Card>
    );
  }

  // Show add/edit mode with section list
  if (isAddMode) {
    return (
      <>
        <Card className="border bg-card">
          <CardHeader className="pb-3">
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
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Sections</Label>
                <p className="text-xs text-muted-foreground">Drag to reorder</p>
              </div>
              {renderSectionsList()}
              
              {/* Add Custom Section Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCustomSection(true)}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Section
              </Button>
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

        {/* Add Custom Section Dialog */}
        <Dialog open={showAddCustomSection} onOpenChange={setShowAddCustomSection}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Section</DialogTitle>
              <DialogDescription>
                Create a new section with your own content.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Section Name</Label>
                <Input
                  value={customSectionName}
                  onChange={(e) => setCustomSectionName(e.target.value)}
                  placeholder="e.g., About the Creator"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddCustomSection(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomSection}>
                Add Section
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, FileText, MoreHorizontal, Pencil, Trash2, X, Sparkles, RefreshCw, Eye, Check, Wand2, PenLine, ArrowLeft, GripVertical, Save, AlertTriangle } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import { SalesPagePreview } from "./SalesPagePreview";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FUNNEL_CONFIGS, AssetRequirement } from "@/data/funnelConfigs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

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
  subheadlines?: string[];
  selectedSubheadline?: number;
  cta: string;
  ctas?: string[];
  selectedCta?: number;
}

interface WhyDifferentData {
  openingParagraph: string;
  openingParagraphs?: string[];
  selectedOpeningParagraph?: number;
  comparisonBullets: string[];
  generatedComparisonBullets?: string[];
  savedComparisonBullets?: string[];
  bridgeSentence: string;
  bridgeSentences?: string[];
  selectedBridgeSentence?: number;
}

interface Benefit {
  title: string;
  description: string;
}

interface BenefitsSectionData {
  benefits: Benefit[];
  generatedBenefits?: Benefit[];
  savedBenefits?: Benefit[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface Module {
  name: string;
  description: string;
}

interface Bonus {
  name: string;
  value: string;
  description: string;
}

interface OfferDetailsSectionData {
  introduction: string;
  introductions?: string[];
  selectedIntroduction?: number;
  modules: Module[];
  generatedModules?: Module[];
  savedModules?: Module[];
  bonuses: Bonus[];
  generatedBonuses?: Bonus[];
  savedBonuses?: Bonus[];
  guarantee: string;
  guarantees?: string[];
  selectedGuarantee?: number;
}

interface TestimonialsSectionData {
  testimonials: { name: string; result: string; quote: string }[];
}

interface FAQsSectionData {
  faqs: FAQ[];
  generatedFaqs?: FAQ[];
  savedFaqs?: FAQ[];
}

interface CustomSection {
  id: string;
  label: string;
  content: string;
}

interface SalesPageCopySections {
  hero?: HeroSectionData;
  heroManual?: { headlines?: string; subheadline?: string; cta?: string };
  whyDifferent?: WhyDifferentData;
  whyDifferentManual?: { openingParagraph?: string; comparisonBullets?: string; bridgeSentence?: string };
  benefits?: BenefitsSectionData;
  benefitsManual?: string;
  offerDetails?: OfferDetailsSectionData;
  offerDetailsManual?: { introduction?: string; modules?: string; bonuses?: string; guarantee?: string };
  testimonials?: TestimonialsSectionData;
  testimonialsManual?: string;
  faqs?: FAQsSectionData;
  faqsManual?: string;
  customSections?: CustomSection[];
  sectionOrder?: string[];
  sectionModes?: Record<string, "ai" | "manual">;
  _customPageTitle?: string;  // Stores original custom page name for display
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
  // Original deliverables
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
  // Funnel page IDs
  "landing-page": "Opt-in Landing Page",
  "thank-you-page": "Thank You Page",
  "opt-in-page": "Opt-in Page",
  "sales-page": "Sales Page",
  "checkout-page": "Checkout Page",
  "upsell-page": "Upsell Page",
  "registration-page": "Registration Page",
  "replay-page": "Webinar Replay Page",
  "challenge-hub": "Challenge Hub/Portal",
  "waitlist-page": "Waitlist Page",
  "member-portal": "Member Portal",
  "content-page": "Value Content Page",
  "application-page": "Application Page",
  "booking-page": "Call Booking Page",
};

export const SalesPageCopyBuilder = ({ projectId }: SalesPageCopyBuilderProps) => {
  const { isSubscribed, user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingItem, setEditingItem] = useState<SalesPageCopy | null>(null);
  const [selectedDeliverable, setSelectedDeliverable] = useState<string>("");
  const [sections, setSections] = useState<SalesPageCopySections>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddCustomSection, setShowAddCustomSection] = useState(false);
  const [customSectionName, setCustomSectionName] = useState("");
  const [showAddCustomPageDialog, setShowAddCustomPageDialog] = useState(false);
  const [customPageName, setCustomPageName] = useState("");
  
  // Section order state
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => 
    DEFAULT_SECTIONS.map(s => s.id)
  );
  
  // AI generation states
  const [sectionModes, setSectionModes] = useState<Record<string, "ai" | "manual">>({});
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [hasGenerated, setHasGenerated] = useState<Record<string, boolean>>({});
  
  // Part selection states for all sections
  const [selectedHeroPart, setSelectedHeroPart] = useState("headlines");
  const [selectedWhyDifferentPart, setSelectedWhyDifferentPart] = useState("openingParagraph");
  const [selectedOfferDetailsPart, setSelectedOfferDetailsPart] = useState("introduction");
  
  // Benefits specific state
  const [benefitsCount, setBenefitsCount] = useState(4);
  const [generatedBenefits, setGeneratedBenefits] = useState<Benefit[]>([]);
  const [savedBenefits, setSavedBenefits] = useState<Benefit[]>([]);
  const [showAddBenefitForm, setShowAddBenefitForm] = useState(false);
  const [newBenefitTitle, setNewBenefitTitle] = useState("");
  const [newBenefitDescription, setNewBenefitDescription] = useState("");
  
  // FAQs specific state (like benefits)
  const [faqsCount, setFaqsCount] = useState(5);
  const [generatedFaqs, setGeneratedFaqs] = useState<FAQ[]>([]);
  const [savedFaqs, setSavedFaqs] = useState<FAQ[]>([]);
  const [showAddFaqForm, setShowAddFaqForm] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newFaqAnswer, setNewFaqAnswer] = useState("");
  
  // Comparison bullets specific state (like benefits)
  const [generatedComparisonBullets, setGeneratedComparisonBullets] = useState<string[]>([]);
  const [savedComparisonBullets, setSavedComparisonBullets] = useState<string[]>([]);
  const [showAddBulletForm, setShowAddBulletForm] = useState(false);
  const [newBulletText, setNewBulletText] = useState("");
  
  // Modules specific state (like benefits)
  const [generatedModules, setGeneratedModules] = useState<Module[]>([]);
  const [savedModules, setSavedModules] = useState<Module[]>([]);
  const [showAddModuleForm, setShowAddModuleForm] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [newModuleDescription, setNewModuleDescription] = useState("");
  
  // Bonuses specific state (like benefits)
  const [generatedBonuses, setGeneratedBonuses] = useState<Bonus[]>([]);
  const [savedBonuses, setSavedBonuses] = useState<Bonus[]>([]);
  const [showAddBonusForm, setShowAddBonusForm] = useState(false);
  const [newBonusName, setNewBonusName] = useState("");
  const [newBonusValue, setNewBonusValue] = useState("");
  const [newBonusDescription, setNewBonusDescription] = useState("");
  
  // Context inputs for "Why Different" section
  const [contextMode, setContextMode] = useState<"infer" | "provide">("infer");
  const [attemptedSolutions, setAttemptedSolutions] = useState("");
  const [whyFails, setWhyFails] = useState("");
  const [uniqueApproach, setUniqueApproach] = useState("");
  const [contextOpen, setContextOpen] = useState(false);

  // Funnel change detection state
  const [funnelTypeChanged, setFunnelTypeChanged] = useState(false);
  const [currentFunnelType, setCurrentFunnelType] = useState<string | null>(null);
  const [isUpdatingPages, setIsUpdatingPages] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  
  // Delete confirmation state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<SalesPageCopy | null>(null);

  // Fetch funnel data
  const { data: funnelData } = useQuery({
    queryKey: ["funnel-for-sales-copy", projectId],
    queryFn: async () => {
      const { data: funnel, error } = await supabase
        .from("funnels")
        .select("id, funnel_type")
        .eq("project_id", projectId)
        .maybeSingle();
      
      if (error) throw error;
      return funnel;
    },
    enabled: !!projectId,
  });

  // Fetch project snapshot for change detection
  const { data: projectSnapshot } = useQuery({
    queryKey: ["project-snapshot", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("sales_copy_funnel_snapshot, transformation_statement, transformation_locked")
        .eq("id", projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch offers for linking pages to offers
  const { data: funnelOffers = [] } = useQuery({
    queryKey: ["offers-for-sales-copy", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("project_id", projectId)
        .order("slot_position");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Detect funnel type changes
  React.useEffect(() => {
    if (funnelData?.funnel_type) {
      setCurrentFunnelType(funnelData.funnel_type);
      if (projectSnapshot?.sales_copy_funnel_snapshot && 
          funnelData.funnel_type !== projectSnapshot.sales_copy_funnel_snapshot) {
        setFunnelTypeChanged(true);
      }
    }
  }, [funnelData?.funnel_type, projectSnapshot?.sales_copy_funnel_snapshot]);

  // Get funnel pages (assets with linkedSection = 'sales-copy')
  const funnelPages: (AssetRequirement & { offerTitle?: string })[] = React.useMemo(() => {
    if (!currentFunnelType) return [];
    const config = FUNNEL_CONFIGS[currentFunnelType];
    if (!config) return [];
    
    return config.assets
      .filter(asset => asset.linkedSection === 'sales-copy')
      .map(asset => {
        // Find related offer for this asset
        const relatedOffer = asset.offerSlotType 
          ? funnelOffers.find(o => o.slot_type === asset.offerSlotType)
          : null;
        
        return {
          ...asset,
          offerTitle: relatedOffer?.title || undefined,
        };
      });
  }, [currentFunnelType, funnelOffers]);

  // Fetch tasks for bidirectional sync
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, column_id")
        .eq("project_id", projectId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Check if a page has sales copy created OR task is marked done
  const getPageCopyStatus = (pageId: string) => {
    return items.find(item => item.deliverableId === pageId);
  };

  // Check if a page is complete (based ONLY on task status for bidirectional sync)
  const isPageComplete = (pageId: string, pageTitle: string) => {
    const taskIsDone = tasks.some(t => t.title === pageTitle && t.column_id === 'done');
    return taskIsDone;
  };

  // Toggle page completion status
  const togglePageCompletion = async (pageId: string, pageTitle: string, isCustom: boolean = false) => {
    if (!user) return;
    
    const currentlyComplete = isPageComplete(pageId, pageTitle);
    const newColumnId = currentlyComplete ? 'todo' : 'done';
    
    const existingTask = tasks.find(t => t.title === pageTitle);
    
    if (existingTask) {
      // Update existing task
      await supabase
        .from('tasks')
        .update({ column_id: newColumnId })
        .eq('id', existingTask.id);
    } else {
      // Create new task for this page (typically for custom pages)
      await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          user_id: user.id,
          title: pageTitle,
          column_id: newColumnId,
          labels: ['Pages'],
        });
    }
    
    queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
  };

  // Reset form when navigating away via sidebar
  useEffect(() => {
    if (isAddMode) {
      // Check if we're on the sales-copy page but location changed
      const isSalesCopyRoute = location.pathname.endsWith('/sales-copy');
      if (isSalesCopyRoute) {
        // User clicked sidebar link while in edit mode, reset
        resetForm();
      }
    }
  }, [location.key]); // Use location.key to detect navigation events

  // Handle updating pages to match new funnel
  const handleUpdatePages = async () => {
    if (!currentFunnelType || !user) return;
    
    setIsUpdatingPages(true);
    
    // Update the snapshot
    await supabase
      .from("projects")
      .update({ sales_copy_funnel_snapshot: currentFunnelType })
      .eq("id", projectId);
    
    setFunnelTypeChanged(false);
    setIsUpdatingPages(false);
    queryClient.invalidateQueries({ queryKey: ["project-snapshot", projectId] });
    toast.success("Sales copy pages updated to match new funnel type");
  };

  // Handle dismissing the funnel change alert
  const handleDismissFunnelChange = async () => {
    await supabase
      .from("projects")
      .update({ sales_copy_funnel_snapshot: currentFunnelType })
      .eq("id", projectId);
    
    setFunnelTypeChanged(false);
    queryClient.invalidateQueries({ queryKey: ["project-snapshot", projectId] });
  };

  // Fetch sales page copy from database
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["sales-page-copy", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_page_copy")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return (data || []).map((item) => {
        const sections = (item.sections as SalesPageCopySections) || {};
        // For custom pages, use stored title; otherwise use DELIVERABLE_NAMES or format the id
        const deliverableName = sections._customPageTitle as string ||
          DELIVERABLE_NAMES[item.deliverable_id] || 
          item.deliverable_id.replace(/^custom_/, '').replace(/[-_]/g, ' ');
        return {
          id: item.id,
          deliverableId: item.deliverable_id,
          deliverableName,
          sections,
        };
      });
    },
    enabled: !!projectId,
  });

  // Free plan restriction removed - all users can create unlimited sales copy pages

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

  // Use transformation from projectSnapshot query
  const transformationStatement = projectSnapshot?.transformation_statement || '';
  const transformationLocked = projectSnapshot?.transformation_locked || false;

  const deliverables = offer?.main_deliverables || [];


  const getDeliverableName = (id: string) => DELIVERABLE_NAMES[id] || id;

  // Create mutation with task sync
  const createMutation = useMutation({
    mutationFn: async (data: { deliverableId: string; sections: SalesPageCopySections }) => {
      const { error } = await supabase.from("sales_page_copy").insert({
        project_id: projectId,
        user_id: user?.id,
        deliverable_id: data.deliverableId,
        sections: { ...data.sections, sectionOrder } as unknown as Json,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["sales-page-copy", projectId] });
      toast.success("Sales page copy saved");
      setEditingSection(null);
      
      // Sync with tasks - mark corresponding task as done
      const funnelPage = funnelPages.find(p => p.id === data.deliverableId);
      // For custom pages, use deliverableId as-is to match how deliverableName is derived in items query
      const pageTitle = funnelPage?.title || data.deliverableId;
      
      if (pageTitle && user) {
        const existingTask = tasks.find(t => t.title === pageTitle);
        if (existingTask) {
          await supabase
            .from('tasks')
            .update({ column_id: 'done' })
            .eq('id', existingTask.id);
        } else {
          // Create task for custom pages
          await supabase
            .from('tasks')
            .insert({
              project_id: projectId,
              user_id: user.id,
              title: pageTitle,
              column_id: 'done',
              labels: ['Pages'],
            });
        }
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      }
    },
    onError: () => toast.error("Failed to save sales page copy"),
  });

  // Update mutation with task sync
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
      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ["sales-page-copy", projectId] });
      toast.success("Sales page copy updated");
      setEditingSection(null);
      
      // Sync with tasks - mark corresponding task as done
      const funnelPage = funnelPages.find(p => p.id === data.deliverableId);
      const pageTitle = funnelPage?.title || data.deliverableId;
      
      if (pageTitle && user) {
        const existingTask = tasks.find(t => t.title === pageTitle);
        if (existingTask) {
          await supabase
            .from('tasks')
            .update({ column_id: 'done' })
            .eq('id', existingTask.id);
        } else {
          await supabase
            .from('tasks')
            .insert({
              project_id: projectId,
              user_id: user.id,
              title: pageTitle,
              column_id: 'done',
              labels: ['Pages'],
            });
        }
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      }
    },
    onError: () => toast.error("Failed to update sales page copy"),
  });

  // Delete mutation with task sync
  const deleteMutation = useMutation({
    mutationFn: async (item: SalesPageCopy) => {
      const { error } = await supabase.from("sales_page_copy").delete().eq("id", item.id);
      if (error) throw error;
      return item;
    },
    onSuccess: async (item) => {
      queryClient.invalidateQueries({ queryKey: ["sales-page-copy", projectId] });
      toast.success("Sales page copy deleted");
      
      // Sync with tasks - delete the corresponding task entirely
      const funnelPage = funnelPages.find(p => p.id === item.deliverableId);
      const pageTitle = funnelPage?.title || item.deliverableId;
      
      if (pageTitle && user) {
        await supabase
          .from('tasks')
          .delete()
          .eq('project_id', projectId)
          .eq('title', pageTitle)
          .eq('user_id', user.id);
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      }
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
    setGeneratedBenefits([]);
    setSavedBenefits([]);
    setBenefitsCount(4);
    setGeneratedFaqs([]);
    setSavedFaqs([]);
    setFaqsCount(5);
    setGeneratedComparisonBullets([]);
    setSavedComparisonBullets([]);
    setGeneratedModules([]);
    setSavedModules([]);
    setGeneratedBonuses([]);
    setSavedBonuses([]);
  };

  const handleAdd = () => {
    // Open the custom page dialog instead of immediately entering edit mode
    setCustomPageName("");
    setShowAddCustomPageDialog(true);
  };

  const handleCreateCustomPage = () => {
    if (!customPageName.trim()) {
      toast.error("Please enter a page name");
      return;
    }
    
    const customId = `custom_${customPageName.toLowerCase().replace(/\s+/g, '-')}`;
    
    setEditingItem(null);
    setSelectedDeliverable(customId);
    // Store original page name in sections for display
    setSections({ _customPageTitle: customPageName.trim() });
    setSectionModes({});
    setSectionOrder(DEFAULT_SECTIONS.map(s => s.id));
    setGeneratedBenefits([]);
    setSavedBenefits([]);
    setGeneratedFaqs([]);
    setSavedFaqs([]);
    setGeneratedComparisonBullets([]);
    setSavedComparisonBullets([]);
    setGeneratedModules([]);
    setSavedModules([]);
    setGeneratedBonuses([]);
    setSavedBonuses([]);
    setShowAddCustomPageDialog(false);
    setIsAddMode(true);
  };

  const handleEdit = (item: SalesPageCopy) => {
    setEditingItem(item);
    setSelectedDeliverable(item.deliverableId);
    setSections(item.sections);
    setSectionOrder(item.sections.sectionOrder || DEFAULT_SECTIONS.map(s => s.id));
    // Restore saved benefits from sections
    if (item.sections.benefits?.savedBenefits) {
      setSavedBenefits(item.sections.benefits.savedBenefits);
    } else if (item.sections.benefits?.benefits) {
      setSavedBenefits(item.sections.benefits.benefits);
    }
    // Restore saved FAQs from sections
    if (item.sections.faqs?.savedFaqs) {
      setSavedFaqs(item.sections.faqs.savedFaqs);
    } else if (item.sections.faqs?.faqs) {
      setSavedFaqs(item.sections.faqs.faqs);
    }
    // Restore saved comparison bullets from sections
    if (item.sections.whyDifferent?.savedComparisonBullets) {
      setSavedComparisonBullets(item.sections.whyDifferent.savedComparisonBullets);
    } else if (item.sections.whyDifferent?.comparisonBullets) {
      setSavedComparisonBullets(item.sections.whyDifferent.comparisonBullets);
    }
    // Restore saved modules from sections
    if (item.sections.offerDetails?.savedModules) {
      setSavedModules(item.sections.offerDetails.savedModules);
    } else if (item.sections.offerDetails?.modules) {
      setSavedModules(item.sections.offerDetails.modules);
    }
    // Restore saved bonuses from sections
    if (item.sections.offerDetails?.savedBonuses) {
      setSavedBonuses(item.sections.offerDetails.savedBonuses);
    } else if (item.sections.offerDetails?.bonuses) {
      setSavedBonuses(item.sections.offerDetails.bonuses);
    }
    // Restore section modes from sections
    if (item.sections.sectionModes) {
      setSectionModes(item.sections.sectionModes);
    }
    setIsAddMode(true);
  };

  const handleDelete = (item: SalesPageCopy) => {
    setDeleteConfirmItem(item);
  };
  
  const confirmDelete = () => {
    if (deleteConfirmItem) {
      deleteMutation.mutate(deleteConfirmItem);
      setDeleteConfirmItem(null);
    }
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

    // Allow custom pages to be saved without content
    const isCustomPage = selectedDeliverable.startsWith('custom_');
    if (!hasContent && !isCustomPage) {
      toast.error("Please add content for at least one section");
      return;
    }

    const sectionsWithModes = { ...sections, sectionModes };
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, deliverableId: selectedDeliverable, sections: sectionsWithModes });
    } else {
      const existing = items.find((i) => i.deliverableId === selectedDeliverable);
      if (existing) {
        toast.error("Sales page copy already exists for this deliverable. Edit the existing one instead.");
        return;
      }
      createMutation.mutate({ deliverableId: selectedDeliverable, sections: sectionsWithModes });
    }
  };

  const saveSectionContent = (sectionId: string) => {
    // Include saved benefits in sections for benefits section
    let updatedSections = { ...sections };
    if (sectionId === "benefits" && savedBenefits.length > 0) {
      updatedSections = {
        ...updatedSections,
        benefits: {
          ...updatedSections.benefits,
          benefits: savedBenefits,
          savedBenefits: savedBenefits,
        }
      };
      setSections(updatedSections);
    }
    
    // Include saved FAQs in sections for faqs section
    if (sectionId === "faqs" && savedFaqs.length > 0) {
      updatedSections = {
        ...updatedSections,
        faqs: {
          ...updatedSections.faqs,
          faqs: savedFaqs,
          savedFaqs: savedFaqs,
        }
      };
      setSections(updatedSections);
    }
    
    // Include saved comparison bullets in sections for whyDifferent section
    if (sectionId === "whyDifferent" && savedComparisonBullets.length > 0) {
      updatedSections = {
        ...updatedSections,
        whyDifferent: {
          ...updatedSections.whyDifferent!,
          comparisonBullets: savedComparisonBullets,
          savedComparisonBullets: savedComparisonBullets,
        }
      };
      setSections(updatedSections);
    }
    
    // Include saved modules and bonuses in sections for offerDetails section
    if (sectionId === "offerDetails") {
      updatedSections = {
        ...updatedSections,
        offerDetails: {
          ...updatedSections.offerDetails!,
          modules: savedModules,
          savedModules: savedModules,
          bonuses: savedBonuses,
          savedBonuses: savedBonuses,
        }
      };
      setSections(updatedSections);
    }
    
    const sectionsWithOrder = { ...updatedSections, sectionOrder, sectionModes };
    
    if (!selectedDeliverable) {
      toast.error("Please select a deliverable first");
      return;
    }
    
    // Actually persist to database
    if (editingItem) {
      updateMutation.mutate({ 
        id: editingItem.id, 
        deliverableId: selectedDeliverable, 
        sections: sectionsWithOrder 
      });
    } else {
      const existing = items.find((i) => i.deliverableId === selectedDeliverable);
      if (existing) {
        updateMutation.mutate({ 
          id: existing.id, 
          deliverableId: selectedDeliverable, 
          sections: sectionsWithOrder 
        });
      } else {
        createMutation.mutate({ 
          deliverableId: selectedDeliverable, 
          sections: sectionsWithOrder 
        });
      }
    }
    
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

  // Save a benefit from generated list
  const saveBenefit = (benefit: Benefit) => {
    if (!savedBenefits.find(b => b.title === benefit.title)) {
      const newSavedBenefits = [...savedBenefits, benefit];
      setSavedBenefits(newSavedBenefits);
      setSections(prev => ({
        ...prev,
        benefits: {
          ...prev.benefits,
          benefits: newSavedBenefits,
          savedBenefits: newSavedBenefits,
        }
      }));
      toast.success("Benefit saved");
    }
  };

  // Remove a saved benefit
  const removeSavedBenefit = (index: number) => {
    const newSavedBenefits = savedBenefits.filter((_, i) => i !== index);
    setSavedBenefits(newSavedBenefits);
    setSections(prev => ({
      ...prev,
      benefits: {
        ...prev.benefits,
        benefits: newSavedBenefits,
        savedBenefits: newSavedBenefits,
      }
    }));
  };

  // Add a manual benefit
  const addManualBenefit = () => {
    if (!newBenefitTitle.trim() || !newBenefitDescription.trim()) {
      toast.error("Please enter both title and description");
      return;
    }
    const newBenefit: Benefit = { title: newBenefitTitle.trim(), description: newBenefitDescription.trim() };
    const newSavedBenefits = [...savedBenefits, newBenefit];
    setSavedBenefits(newSavedBenefits);
    setSections(prev => ({
      ...prev,
      benefits: {
        ...prev.benefits,
        benefits: newSavedBenefits,
        savedBenefits: newSavedBenefits,
      }
    }));
    setNewBenefitTitle("");
    setNewBenefitDescription("");
    setShowAddBenefitForm(false);
    toast.success("Benefit added");
  };

  // Save a FAQ from generated list
  const saveFaq = (faq: FAQ) => {
    if (!savedFaqs.find(f => f.question === faq.question)) {
      const newSavedFaqs = [...savedFaqs, faq];
      setSavedFaqs(newSavedFaqs);
      setSections(prev => ({
        ...prev,
        faqs: {
          ...prev.faqs,
          faqs: newSavedFaqs,
          savedFaqs: newSavedFaqs,
        }
      }));
      toast.success("FAQ saved");
    }
  };

  // Remove a saved FAQ
  const removeSavedFaq = (index: number) => {
    const newSavedFaqs = savedFaqs.filter((_, i) => i !== index);
    setSavedFaqs(newSavedFaqs);
    setSections(prev => ({
      ...prev,
      faqs: {
        ...prev.faqs,
        faqs: newSavedFaqs,
        savedFaqs: newSavedFaqs,
      }
    }));
  };

  // Add a manual FAQ
  const addManualFaq = () => {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
      toast.error("Please enter both question and answer");
      return;
    }
    const newFaq: FAQ = { question: newFaqQuestion.trim(), answer: newFaqAnswer.trim() };
    const newSavedFaqs = [...savedFaqs, newFaq];
    setSavedFaqs(newSavedFaqs);
    setSections(prev => ({
      ...prev,
      faqs: {
        ...prev.faqs,
        faqs: newSavedFaqs,
        savedFaqs: newSavedFaqs,
      }
    }));
    setNewFaqQuestion("");
    setNewFaqAnswer("");
    setShowAddFaqForm(false);
    toast.success("FAQ added");
  };

  // Save a comparison bullet from generated list
  const saveComparisonBullet = (bullet: string) => {
    if (!savedComparisonBullets.includes(bullet)) {
      const newSavedBullets = [...savedComparisonBullets, bullet];
      setSavedComparisonBullets(newSavedBullets);
      setSections(prev => ({
        ...prev,
        whyDifferent: {
          ...prev.whyDifferent!,
          comparisonBullets: newSavedBullets,
          savedComparisonBullets: newSavedBullets,
        }
      }));
      toast.success("Bullet saved");
    }
  };

  // Remove a saved comparison bullet
  const removeSavedComparisonBullet = (index: number) => {
    const newSavedBullets = savedComparisonBullets.filter((_, i) => i !== index);
    setSavedComparisonBullets(newSavedBullets);
    setSections(prev => ({
      ...prev,
      whyDifferent: {
        ...prev.whyDifferent!,
        comparisonBullets: newSavedBullets,
        savedComparisonBullets: newSavedBullets,
      }
    }));
  };

  // Add a manual comparison bullet
  const addManualComparisonBullet = () => {
    if (!newBulletText.trim()) {
      toast.error("Please enter bullet text");
      return;
    }
    const newSavedBullets = [...savedComparisonBullets, newBulletText.trim()];
    setSavedComparisonBullets(newSavedBullets);
    setSections(prev => ({
      ...prev,
      whyDifferent: {
        ...prev.whyDifferent!,
        comparisonBullets: newSavedBullets,
        savedComparisonBullets: newSavedBullets,
      }
    }));
    setNewBulletText("");
    setShowAddBulletForm(false);
    toast.success("Bullet added");
  };

  // Save a module from generated list
  const saveModule = (module: Module) => {
    if (!savedModules.find(m => m.name === module.name)) {
      const newSavedModules = [...savedModules, module];
      setSavedModules(newSavedModules);
      setSections(prev => ({
        ...prev,
        offerDetails: {
          ...prev.offerDetails!,
          modules: newSavedModules,
          savedModules: newSavedModules,
        }
      }));
      toast.success("Module saved");
    }
  };

  // Remove a saved module
  const removeSavedModule = (index: number) => {
    const newSavedModules = savedModules.filter((_, i) => i !== index);
    setSavedModules(newSavedModules);
    setSections(prev => ({
      ...prev,
      offerDetails: {
        ...prev.offerDetails!,
        modules: newSavedModules,
        savedModules: newSavedModules,
      }
    }));
  };

  // Add a manual module
  const addManualModule = () => {
    if (!newModuleName.trim() || !newModuleDescription.trim()) {
      toast.error("Please enter both name and description");
      return;
    }
    const newModule: Module = { name: newModuleName.trim(), description: newModuleDescription.trim() };
    const newSavedModules = [...savedModules, newModule];
    setSavedModules(newSavedModules);
    setSections(prev => ({
      ...prev,
      offerDetails: {
        ...prev.offerDetails!,
        modules: newSavedModules,
        savedModules: newSavedModules,
      }
    }));
    setNewModuleName("");
    setNewModuleDescription("");
    setShowAddModuleForm(false);
    toast.success("Module added");
  };

  // Save a bonus from generated list
  const saveBonus = (bonus: Bonus) => {
    if (!savedBonuses.find(b => b.name === bonus.name)) {
      const newSavedBonuses = [...savedBonuses, bonus];
      setSavedBonuses(newSavedBonuses);
      setSections(prev => ({
        ...prev,
        offerDetails: {
          ...prev.offerDetails!,
          bonuses: newSavedBonuses,
          savedBonuses: newSavedBonuses,
        }
      }));
      toast.success("Bonus saved");
    }
  };

  // Remove a saved bonus
  const removeSavedBonus = (index: number) => {
    const newSavedBonuses = savedBonuses.filter((_, i) => i !== index);
    setSavedBonuses(newSavedBonuses);
    setSections(prev => ({
      ...prev,
      offerDetails: {
        ...prev.offerDetails!,
        bonuses: newSavedBonuses,
        savedBonuses: newSavedBonuses,
      }
    }));
  };

  // Add a manual bonus
  const addManualBonus = () => {
    if (!newBonusName.trim() || !newBonusDescription.trim()) {
      toast.error("Please enter name and description");
      return;
    }
    const newBonus: Bonus = { 
      name: newBonusName.trim(), 
      value: newBonusValue.trim() || "$99 value", 
      description: newBonusDescription.trim() 
    };
    const newSavedBonuses = [...savedBonuses, newBonus];
    setSavedBonuses(newSavedBonuses);
    setSections(prev => ({
      ...prev,
      offerDetails: {
        ...prev.offerDetails!,
        bonuses: newSavedBonuses,
        savedBonuses: newSavedBonuses,
      }
    }));
    setNewBonusName("");
    setNewBonusValue("");
    setNewBonusDescription("");
    setShowAddBonusForm(false);
    toast.success("Bonus added");
  };

  // Generate AI copy for a section (with optional part for part-specific regeneration)
  const generateSectionCopy = async (sectionType: string, part?: string) => {
    if (!offer) {
      toast.error("Please create an offer first to generate copy");
      return;
    }

    setIsGenerating(prev => ({ ...prev, [sectionType]: true }));

    try {
      const payload: Record<string, unknown> = {
        sectionType,
        part, // Optional: specific part to regenerate
        audience: offer.target_audience,
        problem: offer.primary_pain_point || offer.problem_statement,
        desiredOutcome: offer.desired_outcome,
        offerName: offer.title,
        offerType: offer.offer_type,
        deliverables: offer.main_deliverables,
        price: offer.price,
        priceType: offer.price_type,
        // Include transformation statement for cohesive messaging
        transformationStatement: transformationStatement || undefined,
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

      if (sectionType === "benefits") {
        payload.count = benefitsCount;
      }

      if (sectionType === "faqs") {
        payload.count = faqsCount;
      }

      const { data, error } = await supabase.functions.invoke("generate-sales-copy", {
        body: payload,
      });

      if (error) throw error;

      // Update sections based on type - merge with existing data for part-specific generation
      if (sectionType === "hero") {
        setSections(prev => {
          const existingHero = prev.hero;
          return {
            ...prev,
            hero: {
              // Keep existing data, override only what was regenerated
              headlines: data.headlines || existingHero?.headlines || [],
              recommendedHeadline: data.recommendedHeadline ?? existingHero?.recommendedHeadline ?? 0,
              selectedHeadline: data.recommendedHeadline ?? existingHero?.selectedHeadline ?? 0,
              subheadline: data.subheadlines?.[0] || existingHero?.subheadline || "",
              subheadlines: data.subheadlines || existingHero?.subheadlines,
              selectedSubheadline: data.subheadlines ? 0 : existingHero?.selectedSubheadline ?? 0,
              cta: data.ctas?.[0] || existingHero?.cta || "",
              ctas: data.ctas || existingHero?.ctas,
              selectedCta: data.ctas ? 0 : existingHero?.selectedCta ?? 0,
            },
          };
        });
      } else if (sectionType === "whyDifferent") {
        // Handle comparison bullets like benefits - store in separate state for selection
        if (data.comparisonBullets) {
          setGeneratedComparisonBullets(data.comparisonBullets);
        }
        setSections(prev => {
          const existingWhy = prev.whyDifferent;
          return {
            ...prev,
            whyDifferent: {
              openingParagraph: data.openingParagraphs?.[0] || existingWhy?.openingParagraph || "",
              openingParagraphs: data.openingParagraphs || existingWhy?.openingParagraphs,
              selectedOpeningParagraph: data.openingParagraphs ? 0 : existingWhy?.selectedOpeningParagraph ?? 0,
              comparisonBullets: existingWhy?.comparisonBullets || savedComparisonBullets || [],
              savedComparisonBullets: existingWhy?.savedComparisonBullets || savedComparisonBullets || [],
              generatedComparisonBullets: data.comparisonBullets || existingWhy?.generatedComparisonBullets || [],
              bridgeSentence: data.bridgeSentences?.[0] || existingWhy?.bridgeSentence || "",
              bridgeSentences: data.bridgeSentences || existingWhy?.bridgeSentences,
              selectedBridgeSentence: data.bridgeSentences ? 0 : existingWhy?.selectedBridgeSentence ?? 0,
            },
          };
        });
      } else if (sectionType === "benefits") {
        // Store generated benefits separately for selection
        setGeneratedBenefits(data.benefits);
      } else if (sectionType === "offerDetails") {
        // Store generated modules and bonuses separately for selection (like benefits)
        if (data.modules) {
          setGeneratedModules(data.modules);
        }
        if (data.bonuses) {
          setGeneratedBonuses(data.bonuses);
        }
        setSections(prev => {
          const existingOffer = prev.offerDetails;
          return {
            ...prev,
            offerDetails: {
              introduction: data.introductions?.[0] || existingOffer?.introduction || "",
              introductions: data.introductions || existingOffer?.introductions,
              selectedIntroduction: data.introductions ? 0 : existingOffer?.selectedIntroduction ?? 0,
              modules: existingOffer?.modules || savedModules || [],
              savedModules: existingOffer?.savedModules || savedModules || [],
              generatedModules: data.modules || existingOffer?.generatedModules || [],
              bonuses: existingOffer?.bonuses || savedBonuses || [],
              savedBonuses: existingOffer?.savedBonuses || savedBonuses || [],
              generatedBonuses: data.bonuses || existingOffer?.generatedBonuses || [],
              guarantee: data.guarantees?.[0] || existingOffer?.guarantee || "",
              guarantees: data.guarantees || existingOffer?.guarantees,
              selectedGuarantee: data.guarantees ? 0 : existingOffer?.selectedGuarantee ?? 0,
            },
          };
        });
      } else if (sectionType === "testimonials") {
        setSections(prev => ({
          ...prev,
          testimonials: { testimonials: data.testimonials },
        }));
      } else if (sectionType === "faqs") {
        // Store generated FAQs separately for selection (like benefits)
        setGeneratedFaqs(data.faqs);
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
    if (sectionId.startsWith("custom_")) {
      const customSection = sections.customSections?.find(cs => cs.id === sectionId);
      return !!(customSection?.content?.trim());
    }
    
    if (sectionId === "benefits") {
      return savedBenefits.length > 0 || (sections.benefits?.benefits?.length || 0) > 0;
    }
    
    if (sectionId === "faqs") {
      return savedFaqs.length > 0 || (sections.faqs?.faqs?.length || 0) > 0;
    }
    
    const aiData = sections[sectionId as keyof SalesPageCopySections];
    const manualData = sections[`${sectionId}Manual` as keyof SalesPageCopySections];
    return !!(aiData || (typeof manualData === "object" && manualData !== null) || (typeof manualData === "string" && manualData.trim()));
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
    const mode = sectionModes[sectionId] || "ai";
    
    // Check manual content first if in manual mode
    if (mode === "manual") {
      if (sectionId === "hero" && sections.heroManual) {
        const manual = sections.heroManual as { headlines?: string; subheadline?: string; cta?: string };
        return manual.headlines?.slice(0, 50) || manual.subheadline?.slice(0, 50) || "";
      }
      if (sectionId === "whyDifferent" && sections.whyDifferentManual) {
        const manual = sections.whyDifferentManual as { openingParagraph?: string; comparisonBullets?: string; bridgeSentence?: string };
        return manual.openingParagraph?.slice(0, 50) || "";
      }
      if (sectionId === "offerDetails" && sections.offerDetailsManual) {
        const manual = sections.offerDetailsManual as { introduction?: string; modules?: string; bonuses?: string; guarantee?: string };
        return manual.introduction?.slice(0, 50) || "";
      }
    }
    
    // AI content
    if (sectionId === "hero" && sections.hero?.headlines) {
      return sections.hero.headlines[sections.hero.selectedHeadline] || "";
    }
    if (sectionId === "whyDifferent") {
      const bulletCount = savedComparisonBullets.length || sections.whyDifferent?.comparisonBullets?.length || 0;
      const hasBullets = bulletCount > 0;
      const hasOpening = !!sections.whyDifferent?.openingParagraph;
      if (hasBullets && hasOpening) {
        return `${bulletCount} bullets`;
      }
      return sections.whyDifferent?.openingParagraph?.slice(0, 50) || (bulletCount > 0 ? `${bulletCount} bullets` : "");
    }
    if (sectionId === "benefits") {
      const count = savedBenefits.length || sections.benefits?.benefits?.length || 0;
      return count > 0 ? `${count} benefits` : "";
    }
    if (sectionId === "offerDetails") {
      const moduleCount = savedModules.length || sections.offerDetails?.modules?.length || 0;
      const bonusCount = savedBonuses.length || sections.offerDetails?.bonuses?.length || 0;
      return `${moduleCount} modules, ${bonusCount} bonuses`;
    }
    if (sectionId === "testimonials" && sections.testimonials?.testimonials) {
      return `${sections.testimonials.testimonials.length} testimonials`;
    }
    if (sectionId === "faqs") {
      const count = savedFaqs.length || sections.faqs?.faqs?.length || 0;
      return count > 0 ? `${count} FAQs` : "";
    }
    
    const manualKey = `${sectionId}Manual` as keyof SalesPageCopySections;
    const manualData = sections[manualKey];
    if (typeof manualData === "string") {
      return manualData.slice(0, 50) + "...";
    }
    
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
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>

                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium ${
                          sectionHasContent(section.id)
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {sectionHasContent(section.id) ? <Check className="w-4 h-4" /> : index + 1}
                      </div>

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

  // Get AI description for each section type
  const getAiDescription = (sectionId: string): string => {
    switch (sectionId) {
      case "hero":
        return "AI will generate 3 compelling headline options, a supporting subheadline, and an action-driven CTA button based on your offer and transformation statement.";
      case "whyDifferent":
        return "AI will create an opening paragraph, comparison bullets showing why other solutions fail, and a bridge sentence that positions your offer as the solution.";
      case "benefits":
        return "AI will generate key benefits that highlight the transformation your audience will experience, with clear titles and compelling descriptions.";
      case "offerDetails":
        return "AI will create an introduction, module breakdown, bonus descriptions, and a guarantee statement that builds trust and showcases value.";
      case "testimonials":
        return "AI will help structure your testimonials with compelling quotes, names, and results that resonate with your target audience.";
      case "faqs":
        return "AI will generate frequently asked questions with clear, objection-handling answers that address your audience's concerns.";
      default:
        return "AI will generate compelling copy tailored to your offer and audience.";
    }
  };

  // ============ FULL-SCREEN SECTION EDITOR ============
  const renderFullSectionEditor = () => {
    if (!editingSection) return null;
    
    const section = getAllSections().find(s => s.id === editingSection);
    if (!section) return null;

    const mode = getSectionMode(editingSection);
    const isCustom = editingSection.startsWith("custom_");
    const isBenefitsOrFaqs = editingSection === "benefits" || editingSection === "faqs";

    return (
      <div className="h-full flex flex-col">
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

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x overflow-hidden">
          <div className="flex flex-col overflow-y-auto">
            <div className="p-6 space-y-6">
              {!isCustom && section.aiEnabled && (
                <div className="space-y-4">
                  {/* Pill-style mode tabs */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSectionModes(prev => ({ ...prev, [editingSection]: "ai" }))}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        mode === "ai" 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      AI Generate
                    </button>
                    <button
                      type="button"
                      onClick={() => setSectionModes(prev => ({ ...prev, [editingSection]: "manual" }))}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        mode === "manual" 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <PenLine className="w-4 h-4" />
                      Write My Own
                    </button>
                  </div>
                  
                  {/* AI Description - only show when AI mode is selected */}
                  {mode === "ai" && (
                    <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                      <p className="text-sm text-muted-foreground">
                        {getAiDescription(editingSection)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {renderSectionEditorContent(editingSection, mode, isCustom)}

              {!isCustom && mode === "ai" && section.aiEnabled && !isBenefitsOrFaqs && (
                <Button
                  onClick={() => {
                    // Pass the selected part for sections that have part selectors
                    let part: string | undefined;
                    if (editingSection === "hero") {
                      part = selectedHeroPart;
                    } else if (editingSection === "whyDifferent") {
                      part = selectedWhyDifferentPart;
                    } else if (editingSection === "offerDetails") {
                      part = selectedOfferDetailsPart;
                    }
                    generateSectionCopy(editingSection, part);
                  }}
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

    if (mode === "manual") {
      return renderManualModeContent(sectionId);
    }

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

  // Manual mode content with part selectors
  const renderManualModeContent = (sectionId: string) => {
    switch (sectionId) {
      case "hero":
        return renderHeroManualInputs();
      case "whyDifferent":
        return renderWhyDifferentManualInputs();
      case "benefits":
        return renderBenefitsManualInputs();
      case "offerDetails":
        return renderOfferDetailsManualInputs();
      case "testimonials":
        return (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Testimonials</Label>
            <Textarea
              placeholder="Enter your testimonials..."
              value={(sections.testimonialsManual as string) || ""}
              onChange={(e) => setSections(prev => ({ ...prev, testimonialsManual: e.target.value }))}
              rows={10}
            />
          </div>
        );
      case "faqs":
        return renderFaqsManualInputs();
      default:
        return null;
    }
  };

  // Hero Manual Inputs with part selector
  const renderHeroManualInputs = () => {
    const manualData = (sections.heroManual as { headlines?: string; subheadline?: string; cta?: string }) || {};
    const parts = [
      { id: "headlines", label: "Headlines" },
      { id: "subheadline", label: "Subheadline" },
      { id: "cta", label: "CTA Button" },
    ];

    return (
      <div className="space-y-4">
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
              {manualData[part.id as keyof typeof manualData] && <Check className="w-3.5 h-3.5 text-green-500" />}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t space-y-3">
          {selectedHeroPart === "headlines" && (
            <>
              <Label className="text-sm font-medium">Headline</Label>
              <Textarea
                placeholder="Enter your headline..."
                value={manualData.headlines || ""}
                onChange={(e) => setSections(prev => ({ ...prev, heroManual: { ...manualData, headlines: e.target.value } }))}
                rows={3}
              />
            </>
          )}
          {selectedHeroPart === "subheadline" && (
            <>
              <Label className="text-sm font-medium">Subheadline</Label>
              <Textarea
                placeholder="Enter your subheadline..."
                value={manualData.subheadline || ""}
                onChange={(e) => setSections(prev => ({ ...prev, heroManual: { ...manualData, subheadline: e.target.value } }))}
                rows={3}
              />
            </>
          )}
          {selectedHeroPart === "cta" && (
            <>
              <Label className="text-sm font-medium">CTA Button Text</Label>
              <Input
                placeholder="Enter CTA text..."
                value={manualData.cta || ""}
                onChange={(e) => setSections(prev => ({ ...prev, heroManual: { ...manualData, cta: e.target.value } }))}
              />
            </>
          )}
        </div>
      </div>
    );
  };

  // WhyDifferent Manual Inputs with part selector
  const renderWhyDifferentManualInputs = () => {
    const manualData = (sections.whyDifferentManual as { openingParagraph?: string; comparisonBullets?: string; bridgeSentence?: string }) || {};
    const parts = [
      { id: "openingParagraph", label: "Opening Paragraph" },
      { id: "comparisonBullets", label: "Comparison Bullets" },
      { id: "bridgeSentence", label: "Bridge Sentence" },
    ];

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Select Part to Edit
          </p>
          {parts.map((part) => (
            <button
              key={part.id}
              onClick={() => setSelectedWhyDifferentPart(part.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-sm transition-all ${
                selectedWhyDifferentPart === part.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              <span>{part.label}</span>
              {manualData[part.id as keyof typeof manualData] && <Check className="w-3.5 h-3.5 text-green-500" />}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t space-y-3">
          {selectedWhyDifferentPart === "openingParagraph" && (
            <>
              <Label className="text-sm font-medium">Opening Paragraph</Label>
              <Textarea
                placeholder="You're tired of..."
                value={manualData.openingParagraph || ""}
                onChange={(e) => setSections(prev => ({ ...prev, whyDifferentManual: { ...manualData, openingParagraph: e.target.value } }))}
                rows={4}
              />
            </>
          )}
          {selectedWhyDifferentPart === "comparisonBullets" && (
            <>
              <Label className="text-sm font-medium">Comparison Bullets</Label>
              <Textarea
                placeholder="• You thought about X BUT Y...&#10;• You also considered A BUT B..."
                value={manualData.comparisonBullets || ""}
                onChange={(e) => setSections(prev => ({ ...prev, whyDifferentManual: { ...manualData, comparisonBullets: e.target.value } }))}
                rows={6}
              />
            </>
          )}
          {selectedWhyDifferentPart === "bridgeSentence" && (
            <>
              <Label className="text-sm font-medium">Bridge Sentence</Label>
              <Textarea
                placeholder="Enter the bridge sentence that transitions to your solution..."
                value={manualData.bridgeSentence || ""}
                onChange={(e) => setSections(prev => ({ ...prev, whyDifferentManual: { ...manualData, bridgeSentence: e.target.value } }))}
                rows={3}
              />
            </>
          )}
        </div>
      </div>
    );
  };

  // Benefits Manual Inputs
  const renderBenefitsManualInputs = () => {
    return (
      <div className="space-y-4">
        {/* Saved Benefits */}
        {savedBenefits.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Saved Benefits ({savedBenefits.length})
            </p>
            <div className="space-y-2">
              {savedBenefits.map((benefit, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-card relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSavedBenefit(idx)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex items-start gap-2 pr-8">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">{benefit.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Benefit Form */}
        {showAddBenefitForm ? (
          <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
            <div className="space-y-2">
              <Label className="text-xs">Benefit Title</Label>
              <Input
                value={newBenefitTitle}
                onChange={(e) => setNewBenefitTitle(e.target.value)}
                placeholder="e.g., Save Hours Every Week"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={newBenefitDescription}
                onChange={(e) => setNewBenefitDescription(e.target.value)}
                placeholder="Explain the benefit..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addManualBenefit}>
                <Check className="w-3.5 h-3.5 mr-1" />
                Add Benefit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddBenefitForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddBenefitForm(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Benefit
          </Button>
        )}
      </div>
    );
  };

  // OfferDetails Manual Inputs with part selector
  const renderOfferDetailsManualInputs = () => {
    const manualData = (sections.offerDetailsManual as { introduction?: string; modules?: string; bonuses?: string; guarantee?: string }) || {};
    const parts = [
      { id: "introduction", label: "Introduction" },
      { id: "modules", label: "Modules" },
      { id: "bonuses", label: "Bonuses" },
      { id: "guarantee", label: "Guarantee" },
    ];

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Select Part to Edit
          </p>
          {parts.map((part) => (
            <button
              key={part.id}
              onClick={() => setSelectedOfferDetailsPart(part.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-sm transition-all ${
                selectedOfferDetailsPart === part.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              <span>{part.label}</span>
              {manualData[part.id as keyof typeof manualData] && <Check className="w-3.5 h-3.5 text-green-500" />}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t space-y-3">
          {selectedOfferDetailsPart === "introduction" && (
            <>
              <Label className="text-sm font-medium">Introduction</Label>
              <Textarea
                placeholder="When you join..."
                value={manualData.introduction || ""}
                onChange={(e) => setSections(prev => ({ ...prev, offerDetailsManual: { ...manualData, introduction: e.target.value } }))}
                rows={4}
              />
            </>
          )}
          {selectedOfferDetailsPart === "modules" && (
            <>
              <Label className="text-sm font-medium">Modules</Label>
              <Textarea
                placeholder="Module 1: Title - Description&#10;Module 2: Title - Description..."
                value={manualData.modules || ""}
                onChange={(e) => setSections(prev => ({ ...prev, offerDetailsManual: { ...manualData, modules: e.target.value } }))}
                rows={8}
              />
            </>
          )}
          {selectedOfferDetailsPart === "bonuses" && (
            <>
              <Label className="text-sm font-medium">Bonuses</Label>
              <Textarea
                placeholder="Bonus 1: Name ($Value) - Description&#10;Bonus 2: Name ($Value) - Description..."
                value={manualData.bonuses || ""}
                onChange={(e) => setSections(prev => ({ ...prev, offerDetailsManual: { ...manualData, bonuses: e.target.value } }))}
                rows={6}
              />
            </>
          )}
          {selectedOfferDetailsPart === "guarantee" && (
            <>
              <Label className="text-sm font-medium">Guarantee</Label>
              <Textarea
                placeholder="We're so confident that..."
                value={manualData.guarantee || ""}
                onChange={(e) => setSections(prev => ({ ...prev, offerDetailsManual: { ...manualData, guarantee: e.target.value } }))}
                rows={4}
              />
            </>
          )}
        </div>
      </div>
    );
  };

  // FAQs Manual Inputs (like benefits)
  const renderFaqsManualInputs = () => {
    return (
      <div className="space-y-4">
        {/* Saved FAQs */}
        {savedFaqs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Saved FAQs ({savedFaqs.length})
            </p>
            <div className="space-y-2">
              {savedFaqs.map((faq, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-card relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSavedFaq(idx)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex items-start gap-2 pr-8">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">{faq.question}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add FAQ Form */}
        {showAddFaqForm ? (
          <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
            <div className="space-y-2">
              <Label className="text-xs">Question</Label>
              <Input
                value={newFaqQuestion}
                onChange={(e) => setNewFaqQuestion(e.target.value)}
                placeholder="e.g., How long do I have access?"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Answer</Label>
              <Textarea
                value={newFaqAnswer}
                onChange={(e) => setNewFaqAnswer(e.target.value)}
                placeholder="Enter the answer..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addManualFaq}>
                <Check className="w-3.5 h-3.5 mr-1" />
                Add FAQ
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddFaqForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddFaqForm(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom FAQ
          </Button>
        )}
      </div>
    );
  };

  // Hero Editor Inputs - Only show part selector after generation
  const renderHeroEditorInputs = () => {
    const heroData = sections.hero;
    
    // Don't show part selector before generation - AI will generate all parts at once
    if (!heroData?.headlines?.length) {
      return null;
    }
    
    const parts = [
      { id: "headlines", label: "Headlines", hasContent: !!heroData?.headlines?.length },
      { id: "subheadline", label: "Subheadline", hasContent: !!heroData?.subheadlines?.length },
      { id: "cta", label: "CTA Button", hasContent: !!heroData?.ctas?.length },
    ];

    return (
      <div className="space-y-4">
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
      </div>
    );
  };

  // WhyDifferent Editor Inputs - With part selector like Hero
  const renderWhyDifferentEditorInputs = () => {
    const whyDifferentData = sections.whyDifferent;

    const parts = [
      { id: "openingParagraph", label: "Opening Paragraph", hasContent: !!whyDifferentData?.openingParagraphs?.length },
      { id: "comparisonBullets", label: "Comparison Bullets", hasContent: savedComparisonBullets.length > 0 },
      { id: "bridgeSentence", label: "Bridge Sentence", hasContent: !!whyDifferentData?.bridgeSentences?.length },
    ];

    // Show context inputs before generation
    if (!whyDifferentData) {
      return (
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Context Source</Label>
            <RadioGroup
              value={contextMode}
              onValueChange={(v) => setContextMode(v as "infer" | "provide")}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="infer"
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  contextMode === "infer" ? "border-primary bg-primary/5" : "hover:bg-accent"
                }`}
              >
                <RadioGroupItem value="infer" id="infer" />
                <span className="text-sm">Let AI infer</span>
              </Label>
              <Label
                htmlFor="provide"
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                  contextMode === "provide" ? "border-primary bg-primary/5" : "hover:bg-accent"
                }`}
              >
                <RadioGroupItem value="provide" id="provide" />
                <span className="text-sm">I'll provide details</span>
              </Label>
            </RadioGroup>
          </div>

          {contextMode === "provide" && (
            <Collapsible open={contextOpen} onOpenChange={setContextOpen} className="space-y-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span>Provide Context Details</span>
                  {contextOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs">What has your audience tried before?</Label>
                  <Textarea
                    value={attemptedSolutions}
                    onChange={(e) => setAttemptedSolutions(e.target.value)}
                    placeholder="e.g., Other courses, DIY methods, generic advice..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Why did those approaches fail? (optional)</Label>
                  <Textarea
                    value={whyFails}
                    onChange={(e) => setWhyFails(e.target.value)}
                    placeholder="e.g., Too complicated, not personalized, missing key elements..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">What makes your approach unique?</Label>
                  <Textarea
                    value={uniqueApproach}
                    onChange={(e) => setUniqueApproach(e.target.value)}
                    placeholder="e.g., Step-by-step guidance, proven framework, community support..."
                    rows={2}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      );
    }

    // Show part selector after generation
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Select Part to Edit
          </p>
          {parts.map((part) => (
            <button
              key={part.id}
              onClick={() => setSelectedWhyDifferentPart(part.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-sm transition-all ${
                selectedWhyDifferentPart === part.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              <span>{part.label}</span>
              {part.hasContent && <Check className="w-3.5 h-3.5 text-green-500" />}
            </button>
          ))}
        </div>

        {/* Show saved bullets when comparisonBullets part is selected */}
        {selectedWhyDifferentPart === "comparisonBullets" && (
          <div className="space-y-4 pt-4 border-t">
            {/* Saved Bullets */}
            {savedComparisonBullets.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Saved Bullets ({savedComparisonBullets.length})
                </p>
                <div className="space-y-2">
                  {savedComparisonBullets.map((bullet, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-card relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSavedComparisonBullet(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-start gap-2 pr-8">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <p className="text-sm">{bullet}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Bullet Form */}
            {showAddBulletForm ? (
              <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div className="space-y-2">
                  <Label className="text-xs">Comparison Bullet</Label>
                  <Textarea
                    value={newBulletText}
                    onChange={(e) => setNewBulletText(e.target.value)}
                    placeholder="You thought about X BUT Y..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addManualComparisonBullet}>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Add Bullet
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddBulletForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddBulletForm(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Bullet
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Benefits Editor Inputs - Redesigned with count input and saved benefits display
  const renderBenefitsEditorInputs = () => {
    return (
      <div className="space-y-4">
        {/* Saved Benefits */}
        {savedBenefits.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Saved Benefits ({savedBenefits.length})
            </p>
            <div className="space-y-2">
              {savedBenefits.map((benefit, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-card relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSavedBenefit(idx)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex items-start gap-2 pr-8">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">{benefit.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Manual Benefit */}
        {showAddBenefitForm ? (
          <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
            <div className="space-y-2">
              <Label className="text-xs">Benefit Title</Label>
              <Input
                value={newBenefitTitle}
                onChange={(e) => setNewBenefitTitle(e.target.value)}
                placeholder="e.g., Save Hours Every Week"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={newBenefitDescription}
                onChange={(e) => setNewBenefitDescription(e.target.value)}
                placeholder="Explain the benefit..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addManualBenefit}>
                <Check className="w-3.5 h-3.5 mr-1" />
                Add Benefit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddBenefitForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddBenefitForm(true)}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Benefit
          </Button>
        )}

        {/* Generate Controls */}
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium whitespace-nowrap">Generate</Label>
            <Select value={String(benefitsCount)} onValueChange={(v) => setBenefitsCount(Number(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6, 8].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">benefits</span>
          </div>

          <Button
            onClick={() => generateSectionCopy("benefits")}
            disabled={isGenerating["benefits"] || !offer}
            className="w-full"
            size="lg"
          >
            {isGenerating["benefits"] ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {generatedBenefits.length > 0 ? "Regenerate Benefits" : "Generate Benefits"}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Offer Details Editor Inputs - With part selector and saved items display
  const renderOfferDetailsEditorInputs = () => {
    const offerDetailsData = sections.offerDetails;

    const parts = [
      { id: "introduction", label: "Introduction", hasContent: !!offerDetailsData?.introductions?.length || !!offerDetailsData?.introduction },
      { id: "modules", label: "Modules", hasContent: savedModules.length > 0 },
      { id: "bonuses", label: "Bonuses", hasContent: savedBonuses.length > 0 },
      { id: "guarantee", label: "Guarantee", hasContent: !!offerDetailsData?.guarantees?.length || !!offerDetailsData?.guarantee },
    ];

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Select Part to Edit
          </p>
          {parts.map((part) => (
            <button
              key={part.id}
              onClick={() => setSelectedOfferDetailsPart(part.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-sm transition-all ${
                selectedOfferDetailsPart === part.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              <span>{part.label}</span>
              {part.hasContent && <Check className="w-3.5 h-3.5 text-green-500" />}
            </button>
          ))}
        </div>

        {/* Saved Modules Section */}
        {selectedOfferDetailsPart === "modules" && (
          <div className="space-y-3 pt-4 border-t">
            {savedModules.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Saved Modules ({savedModules.length})
                </p>
                <div className="space-y-2">
                  {savedModules.map((mod, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-card relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSavedModule(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-start gap-2 pr-8">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="font-medium text-sm">{mod.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Manual Module */}
            {showAddModuleForm ? (
              <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div className="space-y-2">
                  <Label className="text-xs">Module Name</Label>
                  <Input
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    placeholder="e.g., Module 1: Getting Started"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={newModuleDescription}
                    onChange={(e) => setNewModuleDescription(e.target.value)}
                    placeholder="What students will learn in this module..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addManualModule}>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Add Module
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddModuleForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddModuleForm(true)}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Module
              </Button>
            )}
          </div>
        )}

        {/* Saved Bonuses Section */}
        {selectedOfferDetailsPart === "bonuses" && (
          <div className="space-y-3 pt-4 border-t">
            {savedBonuses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Saved Bonuses ({savedBonuses.length})
                </p>
                <div className="space-y-2">
                  {savedBonuses.map((bonus, idx) => (
                    <div key={idx} className="p-3 border rounded-lg bg-card relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeSavedBonus(idx)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-start gap-2 pr-8">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{bonus.name}</h4>
                            <Badge variant="secondary" className="text-xs">{bonus.value}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{bonus.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Manual Bonus */}
            {showAddBonusForm ? (
              <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div className="space-y-2">
                  <Label className="text-xs">Bonus Name</Label>
                  <Input
                    value={newBonusName}
                    onChange={(e) => setNewBonusName(e.target.value)}
                    placeholder="e.g., Private Community Access"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Value (optional)</Label>
                  <Input
                    value={newBonusValue}
                    onChange={(e) => setNewBonusValue(e.target.value)}
                    placeholder="e.g., $197 value"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={newBonusDescription}
                    onChange={(e) => setNewBonusDescription(e.target.value)}
                    placeholder="What's included in this bonus..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addManualBonus}>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Add Bonus
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddBonusForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddBonusForm(true)}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Bonus
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Testimonials Editor Inputs - Simplified
  const renderTestimonialsEditorInputs = () => {
    const testimonialsData = sections.testimonials;

    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          AI generates sample testimonials as templates. Replace with real testimonials before publishing.
        </p>

        {testimonialsData?.testimonials && testimonialsData.testimonials.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Generated Testimonials ({testimonialsData.testimonials.length})
            </p>
            <div className="space-y-2">
              {testimonialsData.testimonials.map((t, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-card">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">{t.name}</h4>
                      <p className="text-xs text-muted-foreground">{t.result}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // FAQs Editor Inputs - Redesigned like benefits
  const renderFaqsEditorInputs = () => {
    return (
      <div className="space-y-4">
        {/* Saved FAQs */}
        {savedFaqs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Saved FAQs ({savedFaqs.length})
            </p>
            <div className="space-y-2">
              {savedFaqs.map((faq, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-card relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeSavedFaq(idx)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex items-start gap-2 pr-8">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">{faq.question}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Manual FAQ */}
        {showAddFaqForm ? (
          <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
            <div className="space-y-2">
              <Label className="text-xs">Question</Label>
              <Input
                value={newFaqQuestion}
                onChange={(e) => setNewFaqQuestion(e.target.value)}
                placeholder="e.g., How long do I have access?"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Answer</Label>
              <Textarea
                value={newFaqAnswer}
                onChange={(e) => setNewFaqAnswer(e.target.value)}
                placeholder="Enter the answer..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addManualFaq}>
                <Check className="w-3.5 h-3.5 mr-1" />
                Add FAQ
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddFaqForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddFaqForm(true)}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom FAQ
          </Button>
        )}

        {/* Generate Controls */}
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium whitespace-nowrap">Generate</Label>
            <Select value={String(faqsCount)} onValueChange={(v) => setFaqsCount(Number(v))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 4, 5, 6, 7, 8].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">FAQs</span>
          </div>

          <Button
            onClick={() => generateSectionCopy("faqs")}
            disabled={isGenerating["faqs"] || !offer}
            className="w-full"
            size="lg"
          >
            {isGenerating["faqs"] ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {generatedFaqs.length > 0 ? "Regenerate FAQs" : "Generate FAQs"}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  // Render output panel for section
  const renderSectionOutputPanel = (sectionId: string, mode: "ai" | "manual") => {
    if (mode === "manual" || sectionId.startsWith("custom_")) {
      return renderManualOutputPreview(sectionId);
    }

    // AI mode outputs based on section type
    switch (sectionId) {
      case "hero":
        return renderHeroOutputPanel();
      case "whyDifferent":
        return renderWhyDifferentOutputPanel();
      case "benefits":
        return renderBenefitsOutputPanel();
      case "offerDetails":
        return renderOfferDetailsOutputPanel();
      case "testimonials":
        return renderTestimonialsOutputPanel();
      case "faqs":
        return renderFaqsOutputPanel();
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Click "Generate" to see AI-generated options</p>
          </div>
        );
    }
  };

  // Manual output preview
  const renderManualOutputPreview = (sectionId: string) => {
    if (sectionId.startsWith("custom_")) {
      const customSection = sections.customSections?.find(cs => cs.id === sectionId);
      if (!customSection?.content) {
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Your content will appear here as you type</p>
          </div>
        );
      }
      return (
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm whitespace-pre-wrap">{customSection.content}</p>
        </div>
      );
    }

    // For structured manual content
    if (sectionId === "hero") {
      const manualData = (sections.heroManual as { headlines?: string; subheadline?: string; cta?: string }) || {};
      if (!manualData.headlines && !manualData.subheadline && !manualData.cta) {
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Your content will appear here as you type</p>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          {manualData.headlines && (
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-1">Headline</p>
              <p className="font-bold text-lg">{manualData.headlines}</p>
            </div>
          )}
          {manualData.subheadline && (
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-1">Subheadline</p>
              <p className="text-sm">{manualData.subheadline}</p>
            </div>
          )}
          {manualData.cta && (
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-1">CTA Button</p>
              <Button variant="outline" size="sm" className="pointer-events-none">{manualData.cta}</Button>
            </div>
          )}
        </div>
      );
    }

    if (sectionId === "benefits") {
      if (savedBenefits.length === 0) {
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Add benefits to see them here</p>
          </div>
        );
      }
      return (
        <div className="space-y-3">
          {savedBenefits.map((benefit, idx) => (
            <div key={idx} className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium">{benefit.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{benefit.description}</p>
            </div>
          ))}
        </div>
      );
    }

    if (sectionId === "faqs") {
      if (savedFaqs.length === 0) {
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Add FAQs to see them here</p>
          </div>
        );
      }
      return (
        <div className="space-y-3">
          {savedFaqs.map((faq, idx) => (
            <div key={idx} className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium">{faq.question}</h4>
              <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Your content will appear here as you type</p>
      </div>
    );
  };

  // Hero Output Panel
  const renderHeroOutputPanel = () => {
    const heroData = sections.hero;
    
    if (!heroData) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">Click "Generate" to see AI-generated options</p>
        </div>
      );
    }

    if (selectedHeroPart === "headlines") {
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
                <div className="flex items-center gap-2">
                  {idx === heroData.recommendedHeadline && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">Recommended</span>
                  )}
                  {heroData.selectedHeadline === idx && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </div>
              <p className="text-sm font-medium">{headline}</p>
            </div>
          ))}
        </div>
      );
    }

    if (selectedHeroPart === "subheadline") {
      const subheadlines = heroData.subheadlines || [heroData.subheadline];
      return (
        <div className="space-y-3">
          {subheadlines.map((sub, idx) => (
            <div
              key={idx}
              onClick={() => setSections(prev => ({
                ...prev,
                hero: { ...prev.hero!, subheadline: sub, selectedSubheadline: idx }
              }))}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                (heroData.selectedSubheadline ?? 0) === idx
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Subheadline {idx + 1}</span>
                {(heroData.selectedSubheadline ?? 0) === idx && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm">{sub}</p>
            </div>
          ))}
        </div>
      );
    }

    if (selectedHeroPart === "cta") {
      const ctas = heroData.ctas || [heroData.cta];
      return (
        <div className="space-y-3">
          {ctas.map((cta, idx) => (
            <div
              key={idx}
              onClick={() => setSections(prev => ({
                ...prev,
                hero: { ...prev.hero!, cta, selectedCta: idx }
              }))}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                (heroData.selectedCta ?? 0) === idx
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">CTA {idx + 1}</span>
                {(heroData.selectedCta ?? 0) === idx && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <Button variant="outline" size="sm" className="pointer-events-none">{cta}</Button>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  // Why Different Output Panel
  const renderWhyDifferentOutputPanel = () => {
    const whyDifferentData = sections.whyDifferent;
    
    if (!whyDifferentData) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">Click "Generate" to see AI-generated options</p>
        </div>
      );
    }

    if (selectedWhyDifferentPart === "openingParagraph") {
      const paragraphs = whyDifferentData.openingParagraphs || [whyDifferentData.openingParagraph];
      return (
        <div className="space-y-3">
          {paragraphs.map((para, idx) => (
            <div
              key={idx}
              onClick={() => setSections(prev => ({
                ...prev,
                whyDifferent: { ...prev.whyDifferent!, openingParagraph: para, selectedOpeningParagraph: idx }
              }))}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                (whyDifferentData.selectedOpeningParagraph ?? 0) === idx
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Opening {idx + 1}</span>
                {(whyDifferentData.selectedOpeningParagraph ?? 0) === idx && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm">{para}</p>
            </div>
          ))}
        </div>
      );
    }

    if (selectedWhyDifferentPart === "comparisonBullets") {
      // Show generated comparison bullets with "Save as Bullet" buttons (like benefits)
      if (generatedComparisonBullets.length === 0) {
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Click "Generate" to see AI-generated comparison bullets</p>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Click "Save as Bullet" to add to your saved bullets</p>
          {generatedComparisonBullets.map((bullet, idx) => {
            const isSaved = savedComparisonBullets.includes(bullet);
            return (
              <div key={idx} className={`p-4 border rounded-lg ${isSaved ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-card"}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm flex-1">{bullet}</p>
                  {isSaved ? (
                    <div className="flex items-center gap-1 text-green-600 text-xs shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      Saved
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveComparisonBullet(bullet)}
                      className="shrink-0"
                    >
                      <Save className="w-3.5 h-3.5 mr-1" />
                      Save as Bullet
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (selectedWhyDifferentPart === "bridgeSentence") {
      const bridges = whyDifferentData.bridgeSentences || [whyDifferentData.bridgeSentence];
      return (
        <div className="space-y-3">
          {bridges.map((bridge, idx) => (
            <div
              key={idx}
              onClick={() => setSections(prev => ({
                ...prev,
                whyDifferent: { ...prev.whyDifferent!, bridgeSentence: bridge, selectedBridgeSentence: idx }
              }))}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                (whyDifferentData.selectedBridgeSentence ?? 0) === idx
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Bridge {idx + 1}</span>
                {(whyDifferentData.selectedBridgeSentence ?? 0) === idx && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm">{bridge}</p>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  // Benefits Output Panel - Shows generated benefits with "Save as Benefit" button
  const renderBenefitsOutputPanel = () => {
    if (generatedBenefits.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">Click "Generate Benefits" to see AI-generated options</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Click "Save as Benefit" to add to your saved benefits</p>
        {generatedBenefits.map((benefit, idx) => {
          const isSaved = savedBenefits.some(b => b.title === benefit.title);
          return (
            <div key={idx} className={`p-4 border rounded-lg ${isSaved ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-card"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{benefit.description}</p>
                </div>
                {isSaved ? (
                  <div className="flex items-center gap-1 text-green-600 text-xs shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    Saved
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveBenefit(benefit)}
                    className="shrink-0"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Save as Benefit
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Offer Details Output Panel - Read-only selectable
  const renderOfferDetailsOutputPanel = () => {
    const offerDetailsData = sections.offerDetails;
    
    if (!offerDetailsData) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">Click "Generate" to see AI-generated options</p>
        </div>
      );
    }

    if (selectedOfferDetailsPart === "introduction") {
      const introductions = offerDetailsData.introductions || [offerDetailsData.introduction];
      return (
        <div className="space-y-3">
          {introductions.map((intro, idx) => (
            <div
              key={idx}
              onClick={() => setSections(prev => ({
                ...prev,
                offerDetails: { ...prev.offerDetails!, introduction: intro, selectedIntroduction: idx }
              }))}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                (offerDetailsData.selectedIntroduction ?? 0) === idx
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Introduction {idx + 1}</span>
                {(offerDetailsData.selectedIntroduction ?? 0) === idx && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm">{intro}</p>
            </div>
          ))}
        </div>
      );
    }

    if (selectedOfferDetailsPart === "modules") {
      // Show generated modules with "Save as Module" buttons (like benefits)
      if (generatedModules.length === 0) {
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Click "Generate" to see AI-generated modules</p>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Click "Save as Module" to add to your saved modules</p>
          {generatedModules.map((mod, idx) => {
            const isSaved = savedModules.some(m => m.name === mod.name);
            return (
              <div key={idx} className={`p-4 border rounded-lg ${isSaved ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-card"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{mod.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
                  </div>
                  {isSaved ? (
                    <div className="flex items-center gap-1 text-green-600 text-xs shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      Saved
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveModule(mod)}
                      className="shrink-0"
                    >
                      <Save className="w-3.5 h-3.5 mr-1" />
                      Save as Module
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (selectedOfferDetailsPart === "bonuses") {
      // Show generated bonuses with "Save as Bonus" buttons (like benefits)
      if (generatedBonuses.length === 0) {
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Click "Generate" to see AI-generated bonuses</p>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Click "Save as Bonus" to add to your saved bonuses</p>
          {generatedBonuses.map((bonus, idx) => {
            const isSaved = savedBonuses.some(b => b.name === bonus.name);
            return (
              <div key={idx} className={`p-4 border rounded-lg ${isSaved ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-card"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{bonus.name}</h4>
                      <Badge variant="secondary" className="text-xs">{bonus.value}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{bonus.description}</p>
                  </div>
                  {isSaved ? (
                    <div className="flex items-center gap-1 text-green-600 text-xs shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      Saved
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => saveBonus(bonus)}
                      className="shrink-0"
                    >
                      <Save className="w-3.5 h-3.5 mr-1" />
                      Save as Bonus
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (selectedOfferDetailsPart === "guarantee") {
      const guarantees = offerDetailsData.guarantees || [offerDetailsData.guarantee];
      return (
        <div className="space-y-3">
          {guarantees.map((guarantee, idx) => (
            <div
              key={idx}
              onClick={() => setSections(prev => ({
                ...prev,
                offerDetails: { ...prev.offerDetails!, guarantee, selectedGuarantee: idx }
              }))}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                (offerDetailsData.selectedGuarantee ?? 0) === idx
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Guarantee {idx + 1}</span>
                {(offerDetailsData.selectedGuarantee ?? 0) === idx && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <p className="text-sm">{guarantee}</p>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  // Testimonials Output Panel - Read-only display
  const renderTestimonialsOutputPanel = () => {
    const testimonialsData = sections.testimonials;
    
    if (!testimonialsData) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">Click "Generate" to see AI-generated testimonials</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Generated sample testimonials (replace with real ones):</p>
        {testimonialsData.testimonials?.map((testimonial, idx) => (
          <div key={idx} className="p-4 border rounded-lg bg-card">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-medium text-primary">
                  {testimonial.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm">{testimonial.name}</h4>
                  <Badge variant="secondary" className="text-xs">{testimonial.result}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2 italic">"{testimonial.quote}"</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // FAQs Output Panel - Shows generated FAQs with "Save as FAQ" button
  const renderFaqsOutputPanel = () => {
    if (generatedFaqs.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">Click "Generate FAQs" to see AI-generated options</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Click "Save as FAQ" to add to your saved FAQs</p>
        {generatedFaqs.map((faq, idx) => {
          const isSaved = savedFaqs.some(f => f.question === faq.question);
          return (
            <div key={idx} className={`p-4 border rounded-lg ${isSaved ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-card"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{faq.question}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{faq.answer}</p>
                </div>
                {isSaved ? (
                  <div className="flex items-center gap-1 text-green-600 text-xs shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    Saved
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveFaq(faq)}
                    className="shrink-0"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    Save as FAQ
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
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
          sectionModes={sectionModes}
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
                    {editingItem ? "Edit Sales Page Copy" : "Create Sales Page Copy"}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Build compelling copy for your sales page
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Page Title Display (replaces deliverable selector) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Page</Label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {getDeliverableName(selectedDeliverable) || selectedDeliverable.replace('custom_', '').replace(/-/g, ' ')}
                </span>
                {selectedDeliverable.startsWith('custom_') && (
                  <Badge variant="secondary" className="text-xs">Custom</Badge>
                )}
              </div>
            </div>

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
          sectionModes={sectionModes}
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
    <div className="space-y-4">
      {/* Funnel change detection alert */}
      {funnelTypeChanged && (
        <Alert className="border-amber-500/20 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm text-amber-700 dark:text-amber-400">
              Your funnel type has changed. Update your sales copy pages to match?
            </span>
            <div className="flex gap-2 ml-4">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDismissFunnelChange}
                disabled={isUpdatingPages}
              >
                Keep Current
              </Button>
              <Button 
                size="sm" 
                onClick={handleUpdatePages}
                disabled={isUpdatingPages}
              >
                {isUpdatingPages ? "Updating..." : "Update Pages"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Indicator */}
      {currentFunnelType && funnelPages.length > 0 && (
        <div className="mb-4">
          {(() => {
            const customPages = items.filter(item => !funnelPages.some(p => p.id === item.deliverableId));
            const totalPages = funnelPages.length + customPages.length;
            const completedFunnelPages = funnelPages.filter(p => isPageComplete(p.id, p.title)).length;
            const completedCustomPages = customPages.filter(item => isPageComplete(item.deliverableId, item.deliverableName)).length;
            const completed = completedFunnelPages + completedCustomPages;
            const percentage = totalPages > 0 ? Math.round((completed / totalPages) * 100) : 0;
            
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">{percentage}% Complete ({completed}/{totalPages} pages)</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })()}
        </div>
      )}

      {/* Funnel pages list */}
      {!currentFunnelType ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">No funnel configured</p>
          <p className="text-xs text-muted-foreground">
            Select a funnel type first to see required pages
          </p>
        </div>
      ) : funnelPages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">No pages require copy</p>
          <p className="text-xs text-muted-foreground">
            This funnel type doesn't have pages linked to sales copy
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          {/* Category Header */}
          <div className="p-4 flex items-center gap-3 border-b border-border">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-foreground flex-1">Pages</span>
            <span className="text-sm text-muted-foreground">
              {(() => {
                const customPages = items.filter(item => !funnelPages.some(p => p.id === item.deliverableId));
                const completedFunnelPages = funnelPages.filter(p => isPageComplete(p.id, p.title)).length;
                const completedCustomPages = customPages.filter(item => isPageComplete(item.deliverableId, item.deliverableName)).length;
                const total = funnelPages.length + customPages.length;
                const completed = completedFunnelPages + completedCustomPages;
                return `${completed}/${total}`;
              })()}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
            >
              <Plus className="w-4 h-4" />
              Add Custom
            </Button>
          </div>

          {/* List Items - Combined funnel pages and custom pages */}
          <div>
            {/* Funnel Pages */}
            {funnelPages.map((page, index) => {
              const existingCopy = getPageCopyStatus(page.id);
              const isComplete = isPageComplete(page.id, page.title);
              const customPages = items.filter(item => !funnelPages.some(p => p.id === item.deliverableId));
              const isLastItem = index === funnelPages.length - 1 && customPages.length === 0;
              
              return (
                <div 
                  key={page.id}
                  className={`flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors ${
                    !isLastItem ? 'border-b border-border' : ''
                  }`}
                >
                  {/* Clickable Circle Checkbox */}
                  <button
                    onClick={() => togglePageCompletion(page.id, page.title, false)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                      isComplete 
                        ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/80' 
                        : 'border-muted-foreground/40 hover:border-primary/60'
                    }`}
                  >
                    {isComplete && <Check className="w-3 h-3" />}
                  </button>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isComplete ? 'text-muted-foreground' : ''}`}>
                      {page.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {page.description}
                      {page.offerTitle && (
                        <span className="ml-1">• {page.offerTitle}</span>
                      )}
                    </p>
                  </div>
                  
                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        if (existingCopy) {
                          handleEdit(existingCopy);
                        } else {
                          setEditingItem(null);
                          setSelectedDeliverable(page.id);
                          setSections({});
                          setSectionModes({});
                          setSectionOrder(DEFAULT_SECTIONS.map(s => s.id));
                          setGeneratedBenefits([]);
                          setSavedBenefits([]);
                          setGeneratedFaqs([]);
                          setSavedFaqs([]);
                          setGeneratedComparisonBullets([]);
                          setSavedComparisonBullets([]);
                          setGeneratedModules([]);
                          setSavedModules([]);
                          setGeneratedBonuses([]);
                          setSavedBonuses([]);
                          setIsAddMode(true);
                        }
                      }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        {existingCopy ? 'Edit' : 'Add Copy'}
                      </DropdownMenuItem>
                      {existingCopy && (
                        <DropdownMenuItem
                          onClick={() => handleDelete(existingCopy)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
            
            {/* Custom Pages - Merged into same list */}
            {items
              .filter(item => !funnelPages.some(p => p.id === item.deliverableId))
              .map((item, index, arr) => {
                const isLastItem = index === arr.length - 1;
                const isComplete = isPageComplete(item.deliverableId, item.deliverableName);
                
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors ${
                      !isLastItem ? 'border-b border-border' : ''
                    }`}
                  >
                    {/* Clickable Circle Checkbox */}
                    <button
                      onClick={() => togglePageCompletion(item.deliverableId, item.deliverableName, true)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                        isComplete 
                          ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/80' 
                          : 'border-muted-foreground/40 hover:border-primary/60'
                      }`}
                    >
                      {isComplete && <Check className="w-3 h-3" />}
                    </button>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm ${isComplete ? 'text-muted-foreground' : ''}`}>
                          {item.deliverableName}
                        </p>
                        <Badge variant="secondary" className="text-xs">Custom</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Object.keys(item.sections).filter(k => !k.includes("Manual") && k !== "sectionOrder" && k !== "customSections" && k !== "sectionModes").length} sections
                      </p>
                    </div>
                    
                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Add Custom Page Dialog */}
      <Dialog open={showAddCustomPageDialog} onOpenChange={setShowAddCustomPageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Page</DialogTitle>
            <DialogDescription>
              Enter a name for your custom sales page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Page Name</Label>
              <Input
                value={customPageName}
                onChange={(e) => setCustomPageName(e.target.value)}
                placeholder="e.g., Bonus Page, Downsell Page"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCustomPageDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomPage}>
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This will remove the content and its task from the Project Board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

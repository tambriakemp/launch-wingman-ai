import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RelaunchIntentScreen } from "./RelaunchIntentScreen";
import { RelaunchSelectionScreen, RelaunchSection } from "./RelaunchSelectionScreen";
import { RelaunchSummaryScreen } from "./RelaunchSummaryScreen";
import { Phase } from "@/types/tasks";
import { ADAPTIVE_MEMORY_KEYS, AdaptiveMemoryKey } from "@/types/projectMemory";

type RelaunchStep = "intent" | "selection" | "summary";

interface RelaunchFlowProps {
  projectId: string;
  projectName: string;
  onCancel: () => void;
}

// Determine starting phase based on revisited sections
function determineStartingPhase(revisitSections: RelaunchSection[]): Phase {
  if (revisitSections.includes("messaging")) return "messaging";
  if (revisitSections.includes("funnel_path")) return "build";
  if (revisitSections.includes("content_direction")) return "content";
  if (revisitSections.includes("launch_window")) return "launch";
  return "launch"; // Default if nothing selected
}

// Map relaunch sections to adaptive memory keys
function getAdaptiveMemoryKeysForRevisit(revisitSections: RelaunchSection[]): AdaptiveMemoryKey[] {
  const mapping: Record<RelaunchSection, AdaptiveMemoryKey | null> = {
    target_audience: null, // Foundational, not adaptive
    core_problem: null,
    dream_outcome: null,
    offer_format: null,
    messaging: 'messaging',
    funnel_path: 'funnel_type',
    content_direction: 'content_themes',
    launch_window: 'launch_window_length',
  };
  
  return revisitSections
    .map(section => mapping[section])
    .filter((key): key is AdaptiveMemoryKey => key !== null);
}

export function RelaunchFlow({ projectId, projectName, onCancel }: RelaunchFlowProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<RelaunchStep>("intent");
  const [keptSections, setKeptSections] = useState<RelaunchSection[]>([]);
  const [revisitSections, setRevisitSections] = useState<RelaunchSection[]>([]);
  const [skipMemory, setSkipMemory] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleIntentContinue = () => {
    setStep("selection");
  };

  const handleSelectionContinue = (
    kept: RelaunchSection[],
    revisit: RelaunchSection[],
    skip: boolean
  ) => {
    setKeptSections(kept);
    setRevisitSections(revisit);
    setSkipMemory(skip);
    setStep("summary");
  };

  const handleConfirmRelaunch = async () => {
    if (!user) return;

    setIsCreating(true);

    try {
      // If skip_memory is true, create a fresh project without copying data
      if (skipMemory) {
        const { data: newProject, error: createError } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            name: `${projectName} — Fresh Start`,
            project_type: "launch",
            status: "in_progress",
            active_phase: "planning",
            parent_project_id: projectId,
            is_relaunch: true,
            skip_memory: true,
            relaunch_kept_sections: [],
            relaunch_revisit_sections: [],
          })
          .select()
          .single();

        if (createError) throw createError;
        toast.success("Fresh project created!");
        navigate(`/projects/${newProject.id}`);
        return;
      }

      // 1. Fetch original project data
      const { data: originalProject, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      // 2. Fetch original funnel data
      const { data: originalFunnel } = await supabase
        .from("funnels")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      // 3. Fetch original offers
      const { data: originalOffers } = await supabase
        .from("offers")
        .select("*")
        .eq("project_id", projectId);

      // 4. Determine starting phase
      const startingPhase = determineStartingPhase(revisitSections);

      // 5. Create phase statuses based on starting phase
      const phaseOrder: Phase[] = ["planning", "messaging", "build", "content", "launch", "post-launch"];
      const startIndex = phaseOrder.indexOf(startingPhase);
      const phaseStatuses: Record<Phase, string> = {
        planning: "complete",
        messaging: "complete",
        build: "complete",
        content: "complete",
        launch: "locked",
        "post-launch": "locked",
      };
      
      // Mark starting phase as active and later phases as locked
      phaseOrder.forEach((phase, index) => {
        if (index === startIndex) {
          phaseStatuses[phase] = "active";
        } else if (index > startIndex) {
          phaseStatuses[phase] = "locked";
        }
      });

      // 6. Create new project with Foundational Memory copied
      const { data: newProject, error: createError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: `${projectName} — Relaunch`,
          description: originalProject.description,
          project_type: originalProject.project_type,
          status: "in_progress",
          active_phase: startingPhase,
          phase_statuses: phaseStatuses,
          // Always copy transformation (Foundational)
          transformation_statement: originalProject.transformation_statement,
          transformation_style: originalProject.transformation_style,
          transformation_locked: originalProject.transformation_locked,
          // Always copy funnel type (will be marked for review if in revisit)
          selected_funnel_type: originalProject.selected_funnel_type,
          parent_project_id: projectId,
          is_relaunch: true,
          skip_memory: false,
          relaunch_kept_sections: keptSections,
          relaunch_revisit_sections: revisitSections,
        })
        .select()
        .single();

      if (createError) throw createError;

      // 7. Create project_memory records for Adaptive Memory elements that need review
      const adaptiveKeysToReview = getAdaptiveMemoryKeysForRevisit(revisitSections);
      const allAdaptiveKeys = ADAPTIVE_MEMORY_KEYS as readonly string[];
      
      // Create memory records - mark as needs_review if in revisit list
      const memoryRecords = allAdaptiveKeys.map(key => ({
        project_id: newProject.id,
        user_id: user.id,
        memory_key: key,
        needs_review: adaptiveKeysToReview.includes(key as AdaptiveMemoryKey),
      }));
      
      if (memoryRecords.length > 0) {
        await supabase.from("project_memory").insert(memoryRecords);
      }

      // 8. Copy funnel data (Foundational Memory - always copy core elements)
      if (originalFunnel) {
        await supabase.from("funnels").insert({
          user_id: user.id,
          project_id: newProject.id,
          funnel_type: originalFunnel.funnel_type,
          // Always copy Foundational Memory elements
          target_audience: keptSections.includes("target_audience") ? originalFunnel.target_audience : null,
          niche: originalFunnel.niche,
          primary_pain_point: keptSections.includes("core_problem") ? originalFunnel.primary_pain_point : null,
          desired_outcome: keptSections.includes("dream_outcome") ? originalFunnel.desired_outcome : null,
          problem_statement: keptSections.includes("core_problem") ? originalFunnel.problem_statement : null,
          pain_symptoms: keptSections.includes("core_problem") ? originalFunnel.pain_symptoms : [],
          // Copy value equation elements
          likelihood_elements: originalFunnel.likelihood_elements,
          time_effort_elements: originalFunnel.time_effort_elements,
          sub_audiences: originalFunnel.sub_audiences,
          specificity_score: originalFunnel.specificity_score,
        });
      }

      // 9. Copy offers if keeping offer format (Foundational Memory)
      if (originalOffers && originalOffers.length > 0 && keptSections.includes("offer_format")) {
        for (const offer of originalOffers) {
          await supabase.from("offers").insert({
            user_id: user.id,
            project_id: newProject.id,
            niche: offer.niche,
            offer_category: offer.offer_category,
            offer_type: offer.offer_type,
            slot_type: offer.slot_type,
            slot_position: offer.slot_position,
            is_required: offer.is_required,
            title: offer.title,
            description: offer.description,
            price: offer.price,
            price_type: offer.price_type,
            main_deliverables: offer.main_deliverables,
            target_audience: offer.target_audience,
            primary_pain_point: offer.primary_pain_point,
            desired_outcome: offer.desired_outcome,
            transformation_statement: offer.transformation_statement,
            funnel_type: offer.funnel_type,
          });
        }
      }

      // NOTE: Ephemeral Memory (tasks, drafts, dates, metrics) is NEVER copied

      toast.success("Relaunch project created!");
      navigate(`/projects/${newProject.id}`);
    } catch (error) {
      console.error("Error creating relaunch project:", error);
      toast.error("Failed to create relaunch project");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {step === "intent" && (
        <RelaunchIntentScreen
          key="intent"
          projectName={projectName}
          onContinue={handleIntentContinue}
          onCancel={onCancel}
        />
      )}
      {step === "selection" && (
        <RelaunchSelectionScreen
          key="selection"
          onContinue={handleSelectionContinue}
          onBack={() => setStep("intent")}
        />
      )}
      {step === "summary" && (
        <RelaunchSummaryScreen
          key="summary"
          projectName={projectName}
          keptSections={keptSections}
          revisitSections={revisitSections}
          isCreating={isCreating}
          onConfirm={handleConfirmRelaunch}
          onBack={() => setStep("selection")}
          skipMemory={skipMemory}
        />
      )}
    </AnimatePresence>
  );
}

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

export function RelaunchFlow({ projectId, projectName, onCancel }: RelaunchFlowProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<RelaunchStep>("intent");
  const [keptSections, setKeptSections] = useState<RelaunchSection[]>([]);
  const [revisitSections, setRevisitSections] = useState<RelaunchSection[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleIntentContinue = () => {
    setStep("selection");
  };

  const handleSelectionContinue = (
    kept: RelaunchSection[],
    revisit: RelaunchSection[]
  ) => {
    setKeptSections(kept);
    setRevisitSections(revisit);
    setStep("summary");
  };

  const handleConfirmRelaunch = async () => {
    if (!user) return;

    setIsCreating(true);

    try {
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

      // 6. Create new project
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
          transformation_statement: originalProject.transformation_statement,
          transformation_style: originalProject.transformation_style,
          transformation_locked: originalProject.transformation_locked,
          selected_funnel_type: originalProject.selected_funnel_type,
          parent_project_id: projectId,
          is_relaunch: true,
          relaunch_kept_sections: keptSections,
          relaunch_revisit_sections: revisitSections,
        })
        .select()
        .single();

      if (createError) throw createError;

      // 7. Copy funnel data if keeping audience info
      if (originalFunnel && keptSections.some(s => 
        ["target_audience", "core_problem", "dream_outcome"].includes(s)
      )) {
        await supabase.from("funnels").insert({
          user_id: user.id,
          project_id: newProject.id,
          funnel_type: originalFunnel.funnel_type,
          target_audience: keptSections.includes("target_audience") ? originalFunnel.target_audience : null,
          niche: originalFunnel.niche,
          primary_pain_point: keptSections.includes("core_problem") ? originalFunnel.primary_pain_point : null,
          desired_outcome: keptSections.includes("dream_outcome") ? originalFunnel.desired_outcome : null,
          problem_statement: keptSections.includes("core_problem") ? originalFunnel.problem_statement : null,
          pain_symptoms: keptSections.includes("core_problem") ? originalFunnel.pain_symptoms : [],
          likelihood_elements: originalFunnel.likelihood_elements,
          time_effort_elements: originalFunnel.time_effort_elements,
          sub_audiences: originalFunnel.sub_audiences,
          specificity_score: originalFunnel.specificity_score,
        });
      }

      // 8. Copy offers if keeping offer format
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

      // 9. Create project tasks for completed phases (mark as completed)
      // and for active phase (mark as not_started)
      // This is handled by the task engine when the project loads

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
        />
      )}
    </AnimatePresence>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TASK_TEMPLATES } from "@/data/taskTemplates";
import { Phase, PHASES, PHASE_LABELS } from "@/types/tasks";

export interface TaskOutput {
  taskId: string;
  taskTitle: string;
  phase: Phase;
  inputData: Record<string, unknown>;
  completedAt: string | null;
  route: string;
}

export interface SummaryBlock {
  id: string;
  label: string;
  bullets: string[];
  fullContent: string;
  taskId: string;
  taskRoute: string;
}

export interface PhaseData {
  phase: Phase;
  phaseLabel: string;
  blocks: SummaryBlock[];
  hasContent: boolean;
}

// Helper to extract meaningful display text from task input data
function extractDisplayContent(taskId: string, inputData: Record<string, unknown>): { bullets: string[]; fullContent: string } {
  const bullets: string[] = [];
  let fullContent = "";
  
  if (!inputData || Object.keys(inputData).length === 0) {
    return { bullets: [], fullContent: "" };
  }

  // Handle different task types
  switch (taskId) {
    case "planning_define_audience":
      if (inputData.audience_description) {
        const desc = String(inputData.audience_description);
        bullets.push(desc.length > 100 ? desc.substring(0, 100) + "..." : desc);
        fullContent = desc;
      }
      break;

    case "planning_define_problem":
      if (inputData.primary_problem) {
        const prob = String(inputData.primary_problem);
        bullets.push(prob.length > 100 ? prob.substring(0, 100) + "..." : prob);
        fullContent = prob;
      }
      break;

    case "planning_define_dream_outcome":
      if (inputData.dream_outcome) {
        const outcome = String(inputData.dream_outcome);
        bullets.push(outcome.length > 100 ? outcome.substring(0, 100) + "..." : outcome);
        fullContent = outcome;
      }
      break;

    case "planning_time_effort_perception":
      if (inputData.quick_wins) bullets.push(`Quick wins: ${String(inputData.quick_wins).substring(0, 80)}...`);
      if (inputData.friction_reducers) bullets.push(`Friction reducers: ${String(inputData.friction_reducers).substring(0, 80)}...`);
      fullContent = [
        inputData.quick_wins && `Quick wins: ${inputData.quick_wins}`,
        inputData.friction_reducers && `Friction reducers: ${inputData.friction_reducers}`,
        inputData.effort_reframe && `Effort reframe: ${inputData.effort_reframe}`,
      ].filter(Boolean).join("\n\n");
      break;

    case "planning_perceived_likelihood":
      if (inputData.belief_builders) bullets.push(`Trust builders: ${String(inputData.belief_builders).substring(0, 80)}...`);
      fullContent = [
        inputData.past_attempts && `Past attempts: ${inputData.past_attempts}`,
        inputData.belief_blockers && `Belief blockers: ${inputData.belief_blockers}`,
        inputData.belief_builders && `Belief builders: ${inputData.belief_builders}`,
      ].filter(Boolean).join("\n\n");
      break;

    case "planning_choose_launch_path":
      if (inputData.selected) {
        const pathLabels: Record<string, string> = {
          content_to_offer: "Content → Offer",
          freebie_email_offer: "Freebie → Email → Offer",
          live_training_offer: "Live Training → Offer",
          application_call: "Application → Call",
          membership: "Membership",
          challenge: "Challenge",
          launch: "Launch",
        };
        const label = pathLabels[String(inputData.selected)] || String(inputData.selected);
        bullets.push(label);
        fullContent = label;
      }
      break;

    case "messaging_core_message":
      if (inputData.core_message) {
        const msg = String(inputData.core_message);
        bullets.push(msg.length > 120 ? msg.substring(0, 120) + "..." : msg);
        fullContent = msg;
      }
      break;

    case "messaging_transformation_statement":
      if (inputData.transformation_statement) {
        const stmt = String(inputData.transformation_statement);
        bullets.push(`"${stmt.length > 120 ? stmt.substring(0, 120) + "..." : stmt}"`);
        fullContent = stmt;
      }
      break;

    case "messaging_talking_points":
      const points = [
        inputData.talking_point_1,
        inputData.talking_point_2,
        inputData.talking_point_3,
        inputData.talking_point_4,
        inputData.talking_point_5,
      ].filter(Boolean).map(String);
      bullets.push(...points.slice(0, 3).map(p => p.length > 60 ? p.substring(0, 60) + "..." : p));
      fullContent = points.join("\n\n");
      break;

    case "messaging_common_objections":
      const objections = [
        inputData.objection_1,
        inputData.objection_2,
        inputData.objection_3,
        inputData.objection_4,
        inputData.objection_5,
      ].filter(Boolean).map(String);
      bullets.push(...objections.slice(0, 3).map(o => o.length > 60 ? o.substring(0, 60) + "..." : o));
      fullContent = objections.join("\n\n");
      break;

    default:
      // Generic extraction for other tasks
      const values = Object.entries(inputData)
        .filter(([key, val]) => 
          typeof val === "string" && 
          val.trim() !== "" && 
          !key.includes("checked") &&
          key !== "selected"
        )
        .map(([_, val]) => String(val));
      
      if (values.length > 0) {
        bullets.push(...values.slice(0, 2).map(v => v.length > 80 ? v.substring(0, 80) + "..." : v));
        fullContent = values.join("\n\n");
      }
      break;
  }

  return { bullets, fullContent };
}

// Map task IDs to human-readable block labels
const TASK_LABELS: Record<string, string> = {
  planning_define_audience: "Audience",
  planning_define_problem: "Problem",
  planning_define_dream_outcome: "Dream Outcome",
  planning_time_effort_perception: "Time & Effort",
  planning_perceived_likelihood: "Belief Building",
  planning_choose_launch_path: "Launch Path",
  planning_offer_stack: "Offer Stack",
  planning_phase_review: "Planning Review",
  messaging_core_message: "Core Message",
  messaging_transformation_statement: "Transformation",
  messaging_talking_points: "Talking Points",
  messaging_common_objections: "Common Objections",
  messaging_phase_review: "Messaging Review",
  messaging_social_bio: "Social Bio",
  messaging_visual_direction: "Visual Direction",
  build_choose_platform: "Platform Choice",
  build_main_page_setup: "Main Page",
  build_email_platform: "Email Platform",
  build_payments_setup: "Payments",
  build_phase_review: "Build Review",
  content_calendar_setup: "Content Calendar",
  content_prelaunch_content: "Pre-launch Content",
  content_phase_review: "Content Review",
  launch_set_dates: "Launch Dates",
  launch_capture_starting_point: "Starting Metrics",
  launch_phase_review: "Launch Review",
  postlaunch_review: "Post-Launch Review",
  postlaunch_capture_ending_point: "Ending Metrics",
};

export function usePhaseSnapshot(projectId: string | undefined) {
  return useQuery({
    queryKey: ["phase-snapshot", projectId],
    queryFn: async (): Promise<PhaseData[]> => {
      if (!projectId) throw new Error("No project ID");

      // Fetch all completed project tasks
      const { data: projectTasks, error } = await supabase
        .from("project_tasks")
        .select("task_id, input_data, completed_at, status")
        .eq("project_id", projectId)
        .eq("status", "completed");

      if (error) throw error;

      // Also fetch offers for the offer stack
      const { data: offers } = await supabase
        .from("offers")
        .select("title, offer_type, price, price_type, slot_type")
        .eq("project_id", projectId)
        .order("slot_position");

      // Build task outputs map
      const taskOutputs = new Map<string, TaskOutput>();
      
      for (const pt of projectTasks || []) {
        const template = TASK_TEMPLATES.find(t => t.taskId === pt.task_id);
        if (!template) continue;

        taskOutputs.set(pt.task_id, {
          taskId: pt.task_id,
          taskTitle: template.title,
          phase: template.phase as Phase,
          inputData: (pt.input_data as Record<string, unknown>) || {},
          completedAt: pt.completed_at,
          route: template.route?.replace(":id", projectId) || `/projects/${projectId}/tasks/${pt.task_id}`,
        });
      }

      // Build phase data
      const phaseData: PhaseData[] = PHASES.map(phase => {
        const phaseTasks = TASK_TEMPLATES.filter(t => t.phase === phase);
        const blocks: SummaryBlock[] = [];

        for (const template of phaseTasks) {
          const output = taskOutputs.get(template.taskId);
          if (!output) continue;

          // Special handling for offer stack
          if (template.taskId === "planning_offer_stack" && offers && offers.length > 0) {
            const offerBullets = offers.slice(0, 3).map(o => {
              const price = o.price ? `$${o.price.toLocaleString()}${o.price_type === "recurring" ? "/mo" : ""}` : "";
              return `${o.title || o.offer_type}${price ? ` • ${price}` : ""}`;
            });
            
            blocks.push({
              id: template.taskId,
              label: TASK_LABELS[template.taskId] || template.title,
              bullets: offerBullets,
              fullContent: offers.map(o => `${o.title || o.offer_type} (${o.slot_type})${o.price ? ` - $${o.price}` : ""}`).join("\n"),
              taskId: template.taskId,
              taskRoute: output.route,
            });
            continue;
          }

          const { bullets, fullContent } = extractDisplayContent(template.taskId, output.inputData);
          
          if (bullets.length === 0 && !fullContent) continue;

          blocks.push({
            id: template.taskId,
            label: TASK_LABELS[template.taskId] || template.title,
            bullets,
            fullContent,
            taskId: template.taskId,
            taskRoute: output.route,
          });
        }

        return {
          phase,
          phaseLabel: PHASE_LABELS[phase] || phase,
          blocks,
          hasContent: blocks.length > 0,
        };
      });

      return phaseData;
    },
    enabled: !!projectId,
  });
}

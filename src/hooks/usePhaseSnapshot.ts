import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TASK_TEMPLATES } from "@/data/taskTemplates";
import { Phase, PHASES, PHASE_LABELS } from "@/types/tasks";

export type ContentType = 
  | "paragraph" 
  | "quote" 
  | "numbered-list" 
  | "key-value" 
  | "offer-stack" 
  | "badge" 
  | "visual-palette"
  | "social-bio"
  | "metrics"
  | "checklist"
  | "dates";

export interface StructuredContent {
  type: ContentType;
  items: ContentItem[];
}

export interface ContentItem {
  label?: string;
  value: string;
  secondary?: string;
  color?: string;
}

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
  phase: Phase;
  contentType: ContentType;
  structuredContent: StructuredContent;
}

export interface PhaseData {
  phase: Phase;
  phaseLabel: string;
  blocks: SummaryBlock[];
  hasContent: boolean;
}

// Helper to truncate text
function truncate(text: string, maxLength: number = 100): string {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

// Helper to extract meaningful display text from task input data
function extractDisplayContent(taskId: string, inputData: Record<string, unknown>): { 
  bullets: string[]; 
  fullContent: string;
  contentType: ContentType;
  structuredContent: StructuredContent;
} {
  const bullets: string[] = [];
  let fullContent = "";
  let contentType: ContentType = "paragraph";
  const structuredContent: StructuredContent = { type: "paragraph", items: [] };
  
  if (!inputData || Object.keys(inputData).length === 0) {
    return { bullets: [], fullContent: "", contentType, structuredContent };
  }

  // Handle different task types
  switch (taskId) {
    // ==================== PLANNING PHASE ====================
    case "planning_define_audience":
      if (inputData.audience_description) {
        const desc = String(inputData.audience_description);
        bullets.push(truncate(desc));
        fullContent = desc;
        contentType = "paragraph";
        structuredContent.type = "paragraph";
        structuredContent.items = [{ value: desc }];
      }
      break;

    case "planning_define_problem":
      if (inputData.primary_problem) {
        const prob = String(inputData.primary_problem);
        bullets.push(truncate(prob));
        fullContent = prob;
        contentType = "paragraph";
        structuredContent.type = "paragraph";
        structuredContent.items = [{ value: prob }];
      }
      break;

    case "planning_define_dream_outcome":
      if (inputData.dream_outcome) {
        const outcome = String(inputData.dream_outcome);
        bullets.push(truncate(outcome));
        fullContent = outcome;
        contentType = "paragraph";
        structuredContent.type = "paragraph";
        structuredContent.items = [{ value: outcome }];
      }
      break;

    case "planning_time_effort_perception":
      contentType = "key-value";
      structuredContent.type = "key-value";
      if (inputData.quick_wins) {
        bullets.push(`Quick wins: ${truncate(String(inputData.quick_wins), 80)}`);
        structuredContent.items.push({ label: "Quick Wins", value: String(inputData.quick_wins) });
      }
      if (inputData.friction_reducers) {
        bullets.push(`Friction reducers: ${truncate(String(inputData.friction_reducers), 80)}`);
        structuredContent.items.push({ label: "Friction Reducers", value: String(inputData.friction_reducers) });
      }
      if (inputData.effort_reframe) {
        structuredContent.items.push({ label: "Effort Reframe", value: String(inputData.effort_reframe) });
      }
      fullContent = [
        inputData.quick_wins && `Quick wins: ${inputData.quick_wins}`,
        inputData.friction_reducers && `Friction reducers: ${inputData.friction_reducers}`,
        inputData.effort_reframe && `Effort reframe: ${inputData.effort_reframe}`,
      ].filter(Boolean).join("\n\n");
      break;

    case "planning_perceived_likelihood":
      contentType = "key-value";
      structuredContent.type = "key-value";
      if (inputData.past_attempts) {
        structuredContent.items.push({ label: "Past Attempts", value: String(inputData.past_attempts) });
      }
      if (inputData.belief_blockers) {
        structuredContent.items.push({ label: "Belief Blockers", value: String(inputData.belief_blockers) });
      }
      if (inputData.belief_builders) {
        bullets.push(`Trust builders: ${truncate(String(inputData.belief_builders), 80)}`);
        structuredContent.items.push({ label: "Belief Builders", value: String(inputData.belief_builders) });
      }
      fullContent = [
        inputData.past_attempts && `Past attempts: ${inputData.past_attempts}`,
        inputData.belief_blockers && `Belief blockers: ${inputData.belief_blockers}`,
        inputData.belief_builders && `Belief builders: ${inputData.belief_builders}`,
      ].filter(Boolean).join("\n\n");
      break;

    case "planning_choose_launch_path":
      contentType = "badge";
      structuredContent.type = "badge";
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
        structuredContent.items = [{ value: label }];
      }
      break;

    // ==================== MESSAGING PHASE ====================
    case "messaging_core_message":
      if (inputData.core_message) {
        const msg = String(inputData.core_message);
        bullets.push(truncate(msg, 120));
        fullContent = msg;
        contentType = "quote";
        structuredContent.type = "quote";
        structuredContent.items = [{ value: msg }];
      }
      break;

    case "messaging_transformation_statement":
      if (inputData.transformation_statement) {
        const stmt = String(inputData.transformation_statement);
        bullets.push(`"${truncate(stmt, 120)}"`);
        fullContent = stmt;
        contentType = "quote";
        structuredContent.type = "quote";
        structuredContent.items = [{ value: stmt }];
      }
      break;

    case "messaging_talking_points":
      contentType = "numbered-list";
      structuredContent.type = "numbered-list";
      const points = [
        inputData.talking_point_1,
        inputData.talking_point_2,
        inputData.talking_point_3,
        inputData.talking_point_4,
        inputData.talking_point_5,
      ].filter(Boolean).map(String);
      bullets.push(...points.slice(0, 3).map(p => truncate(p, 60)));
      fullContent = points.join("\n\n");
      structuredContent.items = points.map(p => ({ value: p }));
      break;

    case "messaging_common_objections":
      contentType = "numbered-list";
      structuredContent.type = "numbered-list";
      const objections = [
        inputData.objection_1,
        inputData.objection_2,
        inputData.objection_3,
        inputData.objection_4,
        inputData.objection_5,
      ].filter(Boolean).map(String);
      bullets.push(...objections.slice(0, 3).map(o => truncate(o, 60)));
      fullContent = objections.join("\n\n");
      structuredContent.items = objections.map(o => ({ value: o }));
      break;

    // ==================== BUILD PHASE ====================
    case "build_choose_platform":
      contentType = "key-value";
      structuredContent.type = "key-value";
      if (inputData.platform_type) {
        bullets.push(`Platform type: ${inputData.platform_type}`);
        structuredContent.items.push({ label: "Platform Type", value: String(inputData.platform_type) });
      }
      if (inputData.platform_name) {
        bullets.push(`Using: ${inputData.platform_name}`);
        structuredContent.items.push({ label: "Platform", value: String(inputData.platform_name) });
      }
      fullContent = [
        inputData.platform_type && `Platform type: ${inputData.platform_type}`,
        inputData.platform_name && `Specific platform: ${inputData.platform_name}`,
      ].filter(Boolean).join("\n\n");
      break;

    case "build_main_page_setup":
      contentType = "checklist";
      structuredContent.type = "checklist";
      const pageChecks: ContentItem[] = [];
      if (inputData.page_created) pageChecks.push({ value: "Page created" });
      if (inputData.description_added) pageChecks.push({ value: "Description added" });
      if (inputData.next_step_clear) pageChecks.push({ value: "Next step is clear" });
      bullets.push(...pageChecks.slice(0, 3).map(c => c.value));
      fullContent = pageChecks.map(c => c.value).join("\n");
      structuredContent.items = pageChecks;
      break;

    case "build_email_platform":
      contentType = "key-value";
      structuredContent.type = "key-value";
      if (inputData.email_platform) {
        bullets.push(`Email platform: ${inputData.email_platform}`);
        structuredContent.items.push({ label: "Email Platform", value: String(inputData.email_platform) });
      }
      if (inputData.email_test_sent) {
        bullets.push(`Test email: ${inputData.email_test_sent}`);
        structuredContent.items.push({ label: "Test Email Sent", value: String(inputData.email_test_sent) });
      }
      fullContent = [
        inputData.email_platform && `Email platform: ${inputData.email_platform}`,
        inputData.email_test_sent && `Test email sent: ${inputData.email_test_sent}`,
      ].filter(Boolean).join("\n\n");
      break;

    case "build_payments_setup":
      contentType = "key-value";
      structuredContent.type = "key-value";
      if (inputData.payment_provider) {
        bullets.push(`Payment provider: ${inputData.payment_provider}`);
        structuredContent.items.push({ label: "Payment Provider", value: String(inputData.payment_provider) });
      }
      if (inputData.test_payment_complete) {
        bullets.push(`Test payment: ${inputData.test_payment_complete}`);
        structuredContent.items.push({ label: "Test Payment", value: String(inputData.test_payment_complete) });
      }
      fullContent = [
        inputData.payment_provider && `Payment provider: ${inputData.payment_provider}`,
        inputData.test_payment_complete && `Test payment: ${inputData.test_payment_complete}`,
      ].filter(Boolean).join("\n\n");
      break;

    case "build_phase_review":
      contentType = "checklist";
      structuredContent.type = "checklist";
      const buildChecks: ContentItem[] = [];
      if (inputData.platform_chosen) buildChecks.push({ value: "Platform chosen" });
      if (inputData.page_ready) buildChecks.push({ value: "Main page ready" });
      if (inputData.ready_to_share) buildChecks.push({ value: "Ready to share" });
      bullets.push(...buildChecks.slice(0, 3).map(c => c.value));
      fullContent = buildChecks.map(c => c.value).join("\n");
      structuredContent.items = buildChecks;
      break;

    // ==================== CONTENT PHASE ====================
    case "content_choose_platforms":
      if (inputData.platforms) {
        const platforms = String(inputData.platforms);
        bullets.push(truncate(platforms, 80));
        fullContent = platforms;
        contentType = "paragraph";
        structuredContent.type = "paragraph";
        structuredContent.items = [{ value: platforms }];
      }
      break;

    case "content_define_themes":
      contentType = "numbered-list";
      structuredContent.type = "numbered-list";
      const themes = [
        inputData.theme_1,
        inputData.theme_2,
        inputData.theme_3,
        inputData.theme_4,
        inputData.theme_5,
      ].filter(Boolean).map(String);
      bullets.push(...themes.slice(0, 3).map(t => truncate(t, 50)));
      fullContent = themes.join("\n");
      structuredContent.items = themes.map(t => ({ value: t }));
      break;

    case "content_plan_launch_window":
      contentType = "key-value";
      structuredContent.type = "key-value";
      if (inputData.launch_window_days) {
        bullets.push(`${inputData.launch_window_days} day launch window`);
        structuredContent.items.push({ label: "Launch Window", value: `${inputData.launch_window_days} days` });
      }
      if (inputData.planned_posts_summary) {
        bullets.push(truncate(String(inputData.planned_posts_summary), 80));
        structuredContent.items.push({ label: "Planned Posts", value: String(inputData.planned_posts_summary) });
      }
      fullContent = [
        inputData.launch_window_days && `Launch window: ${inputData.launch_window_days} days`,
        inputData.planned_posts_summary && `Posts:\n${inputData.planned_posts_summary}`,
      ].filter(Boolean).join("\n\n");
      break;

    case "content_write_captions":
      contentType = "key-value";
      structuredContent.type = "key-value";
      if (inputData.captions_written) {
        bullets.push(`Captions: ${inputData.captions_written}`);
        structuredContent.items.push({ label: "Captions Status", value: String(inputData.captions_written) });
      }
      if (inputData.sample_caption) {
        bullets.push(truncate(String(inputData.sample_caption), 80));
        structuredContent.items.push({ label: "Sample Caption", value: String(inputData.sample_caption) });
      }
      fullContent = [
        inputData.captions_written && `Status: ${inputData.captions_written}`,
        inputData.sample_caption && `Sample caption:\n${inputData.sample_caption}`,
      ].filter(Boolean).join("\n\n");
      break;

    case "content_phase_review":
      contentType = "checklist";
      structuredContent.type = "checklist";
      const contentChecks: ContentItem[] = [];
      if (inputData.platforms_chosen) contentChecks.push({ value: "Platforms chosen" });
      if (inputData.themes_defined) contentChecks.push({ value: "Themes defined" });
      if (inputData.posts_planned) contentChecks.push({ value: "Posts planned" });
      if (inputData.captions_drafted) contentChecks.push({ value: "Captions drafted" });
      if (inputData.ready_to_share) contentChecks.push({ value: "Ready to share" });
      bullets.push(...contentChecks.slice(0, 3).map(c => c.value));
      fullContent = contentChecks.map(c => c.value).join("\n");
      structuredContent.items = contentChecks;
      break;

    // ==================== LAUNCH PHASE ====================
    case "launch_set_dates":
      contentType = "dates";
      structuredContent.type = "dates";
      if (inputData.launch_date) {
        bullets.push(`Launch date: ${inputData.launch_date}`);
        structuredContent.items.push({ label: "Launch Date", value: String(inputData.launch_date) });
      }
      if (inputData.cart_open_date) {
        bullets.push(`Cart opens: ${inputData.cart_open_date}`);
        structuredContent.items.push({ label: "Cart Opens", value: String(inputData.cart_open_date) });
      }
      if (inputData.cart_close_date) {
        bullets.push(`Cart closes: ${inputData.cart_close_date}`);
        structuredContent.items.push({ label: "Cart Closes", value: String(inputData.cart_close_date) });
      }
      fullContent = [
        inputData.launch_date && `Launch date: ${inputData.launch_date}`,
        inputData.cart_open_date && `Cart opens: ${inputData.cart_open_date}`,
        inputData.cart_close_date && `Cart closes: ${inputData.cart_close_date}`,
      ].filter(Boolean).join("\n");
      break;

    case "launch_confirm_checklist":
    case "launch_phase_review":
      contentType = "checklist";
      structuredContent.type = "checklist";
      const launchChecks = Object.entries(inputData)
        .filter(([key, val]) => val === true && !key.includes("_"))
        .map(([key]) => ({ value: key.replace(/_/g, " ") }));
      bullets.push(...launchChecks.slice(0, 3).map(c => c.value));
      fullContent = launchChecks.map(c => c.value).join("\n");
      structuredContent.items = launchChecks;
      break;

    // ==================== POST-LAUNCH PHASE ====================
    case "postlaunch_review":
      contentType = "key-value";
      structuredContent.type = "key-value";
      if (inputData.wins) {
        bullets.push(`Wins: ${truncate(String(inputData.wins), 60)}`);
        structuredContent.items.push({ label: "Wins", value: String(inputData.wins) });
      }
      if (inputData.lessons) {
        bullets.push(`Lessons: ${truncate(String(inputData.lessons), 60)}`);
        structuredContent.items.push({ label: "Lessons", value: String(inputData.lessons) });
      }
      if (inputData.next_steps) {
        structuredContent.items.push({ label: "Next Steps", value: String(inputData.next_steps) });
      }
      fullContent = [
        inputData.wins && `Wins:\n${inputData.wins}`,
        inputData.lessons && `Lessons:\n${inputData.lessons}`,
        inputData.next_steps && `Next steps:\n${inputData.next_steps}`,
      ].filter(Boolean).join("\n\n");
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
        bullets.push(...values.slice(0, 2).map(v => truncate(v, 80)));
        fullContent = values.join("\n\n");
        structuredContent.items = values.map(v => ({ value: v }));
      }
      break;
  }

  return { bullets, fullContent, contentType, structuredContent };
}

// Map task IDs to human-readable block labels
const TASK_LABELS: Record<string, string> = {
  // Planning
  planning_define_audience: "Audience",
  planning_define_problem: "Problem",
  planning_define_dream_outcome: "Dream Outcome",
  planning_time_effort_perception: "Time & Effort",
  planning_perceived_likelihood: "Belief Building",
  planning_choose_launch_path: "Launch Path",
  planning_offer_stack: "Offer Stack",
  planning_phase_review: "Planning Review",
  // Messaging
  messaging_core_message: "Core Message",
  messaging_transformation_statement: "Transformation",
  messaging_talking_points: "Talking Points",
  messaging_common_objections: "Common Objections",
  messaging_phase_review: "Messaging Review",
  messaging_social_bio: "Social Bio",
  messaging_visual_direction: "Visual Direction",
  // Build
  build_choose_platform: "Platform Choice",
  build_main_page_setup: "Main Page Setup",
  build_email_platform: "Email Platform",
  build_payments_setup: "Payments Setup",
  build_phase_review: "Build Review",
  // Content
  content_choose_platforms: "Content Platforms",
  content_define_themes: "Content Themes",
  content_plan_launch_window: "Launch Content Plan",
  content_write_captions: "Captions",
  content_phase_review: "Content Review",
  // Launch
  launch_set_dates: "Launch Dates",
  launch_capture_starting_point: "Starting Metrics",
  launch_confirm_checklist: "Launch Checklist",
  launch_phase_review: "Launch Review",
  // Post-Launch
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

      // Fetch additional data in parallel
      const [offersRes, socialBiosRes, brandColorsRes, brandFontsRes, launchSnapshotsRes] = await Promise.all([
        supabase
          .from("offers")
          .select("title, offer_type, price, price_type, slot_type, description")
          .eq("project_id", projectId)
          .order("slot_position"),
        supabase
          .from("social_bios")
          .select("platform, bio_content, formula_id")
          .eq("project_id", projectId),
        supabase
          .from("brand_colors")
          .select("hex_color, name, position")
          .eq("project_id", projectId)
          .order("position"),
        supabase
          .from("brand_fonts")
          .select("font_family, font_category, font_source")
          .eq("project_id", projectId),
        supabase
          .from("launch_snapshots")
          .select("*")
          .eq("project_id", projectId)
          .eq("snapshot_type", "starting")
          .maybeSingle(),
      ]);

      const offers = offersRes.data || [];
      const socialBios = socialBiosRes.data || [];
      const brandColors = brandColorsRes.data || [];
      const brandFonts = brandFontsRes.data || [];
      const startingSnapshot = launchSnapshotsRes.data;

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
          if (template.taskId === "planning_offer_stack" && offers.length > 0) {
            const offerBullets = offers.slice(0, 3).map(o => {
              const price = o.price ? `$${o.price.toLocaleString()}${o.price_type === "recurring" ? "/mo" : ""}` : "";
              return `${o.title || o.offer_type}${price ? ` • ${price}` : ""}`;
            });
            
            const offerItems: ContentItem[] = offers.map(o => ({
              label: o.title || o.offer_type,
              value: o.description || o.slot_type || "",
              secondary: o.price ? `$${o.price.toLocaleString()}${o.price_type === "recurring" ? "/mo" : ""}` : "Free",
            }));
            
            blocks.push({
              id: template.taskId,
              label: TASK_LABELS[template.taskId] || template.title,
              bullets: offerBullets,
              fullContent: offers.map(o => `${o.title || o.offer_type} (${o.slot_type})${o.price ? ` - $${o.price}` : ""}`).join("\n"),
              taskId: template.taskId,
              taskRoute: output.route,
              phase,
              contentType: "offer-stack",
              structuredContent: { type: "offer-stack", items: offerItems },
            });
            continue;
          }

          // Special handling for social bio
          if (template.taskId === "messaging_social_bio" && socialBios.length > 0) {
            const bioBullets = socialBios.slice(0, 3).map(b => 
              `${b.platform}: ${truncate(b.bio_content, 60)}`
            );
            
            const bioItems: ContentItem[] = socialBios.map(b => ({
              label: b.platform.charAt(0).toUpperCase() + b.platform.slice(1),
              value: b.bio_content,
            }));
            
            blocks.push({
              id: template.taskId,
              label: TASK_LABELS[template.taskId] || template.title,
              bullets: bioBullets,
              fullContent: socialBios.map(b => `${b.platform.toUpperCase()}\n${b.bio_content}`).join("\n\n"),
              taskId: template.taskId,
              taskRoute: output.route,
              phase,
              contentType: "social-bio",
              structuredContent: { type: "social-bio", items: bioItems },
            });
            continue;
          }

          // Special handling for visual direction
          if (template.taskId === "messaging_visual_direction" && (brandColors.length > 0 || brandFonts.length > 0)) {
            const visualBullets: string[] = [];
            const visualItems: ContentItem[] = [];
            
            if (brandColors.length > 0) {
              visualBullets.push(`Colors: ${brandColors.slice(0, 4).map(c => c.hex_color).join(", ")}`);
              brandColors.forEach(c => {
                visualItems.push({ 
                  label: "color", 
                  value: c.name || "", 
                  color: c.hex_color 
                });
              });
            }
            if (brandFonts.length > 0) {
              const fontList = brandFonts.slice(0, 3).map(f => f.font_family).join(", ");
              visualBullets.push(`Fonts: ${fontList}`);
              brandFonts.forEach(f => {
                visualItems.push({ 
                  label: f.font_category, 
                  value: f.font_family,
                  secondary: f.font_source,
                });
              });
            }
            
            const fullParts: string[] = [];
            if (brandColors.length > 0) {
              fullParts.push(`COLORS\n${brandColors.map(c => c.name ? `${c.name}: ${c.hex_color}` : c.hex_color).join("\n")}`);
            }
            if (brandFonts.length > 0) {
              fullParts.push(`FONTS\n${brandFonts.map(f => `${f.font_category}: ${f.font_family} (${f.font_source})`).join("\n")}`);
            }
            
            blocks.push({
              id: template.taskId,
              label: TASK_LABELS[template.taskId] || template.title,
              bullets: visualBullets,
              fullContent: fullParts.join("\n\n"),
              taskId: template.taskId,
              taskRoute: output.route,
              phase,
              contentType: "visual-palette",
              structuredContent: { type: "visual-palette", items: visualItems },
            });
            continue;
          }

          // Special handling for starting point metrics
          if (template.taskId === "launch_capture_starting_point" && startingSnapshot) {
            const metricBullets: string[] = [];
            const metricItems: ContentItem[] = [];
            
            if (startingSnapshot.email_list_size) {
              metricBullets.push(`Email list: ${startingSnapshot.email_list_size.toLocaleString()}`);
              metricItems.push({ label: "Email List", value: startingSnapshot.email_list_size.toLocaleString() });
            }
            const totalFollowers = (startingSnapshot.instagram_followers || 0) + 
              (startingSnapshot.facebook_followers || 0) + 
              (startingSnapshot.tiktok_followers || 0);
            if (totalFollowers > 0) {
              metricBullets.push(`Social followers: ${totalFollowers.toLocaleString()}`);
            }
            if (startingSnapshot.instagram_followers) {
              metricItems.push({ label: "Instagram", value: startingSnapshot.instagram_followers.toLocaleString() });
            }
            if (startingSnapshot.facebook_followers) {
              metricItems.push({ label: "Facebook", value: startingSnapshot.facebook_followers.toLocaleString() });
            }
            if (startingSnapshot.tiktok_followers) {
              metricItems.push({ label: "TikTok", value: startingSnapshot.tiktok_followers.toLocaleString() });
            }
            if (startingSnapshot.monthly_revenue) {
              metricBullets.push(`Monthly revenue: $${startingSnapshot.monthly_revenue.toLocaleString()}`);
              metricItems.push({ label: "Monthly Revenue", value: `$${startingSnapshot.monthly_revenue.toLocaleString()}` });
            }
            if (startingSnapshot.ytd_revenue) {
              metricItems.push({ label: "YTD Revenue", value: `$${startingSnapshot.ytd_revenue.toLocaleString()}` });
            }
            if (startingSnapshot.confidence_level) {
              metricItems.push({ label: "Confidence", value: startingSnapshot.confidence_level });
            }
            
            if (metricBullets.length > 0) {
              blocks.push({
                id: template.taskId,
                label: TASK_LABELS[template.taskId] || template.title,
                bullets: metricBullets,
                fullContent: metricItems.map(m => `${m.label}: ${m.value}`).join("\n"),
                taskId: template.taskId,
                taskRoute: output.route,
                phase,
                contentType: "metrics",
                structuredContent: { type: "metrics", items: metricItems },
              });
            }
            continue;
          }

          const { bullets, fullContent, contentType, structuredContent } = extractDisplayContent(template.taskId, output.inputData);
          
          if (bullets.length === 0 && !fullContent) continue;

          blocks.push({
            id: template.taskId,
            label: TASK_LABELS[template.taskId] || template.title,
            bullets,
            fullContent,
            taskId: template.taskId,
            taskRoute: output.route,
            phase,
            contentType,
            structuredContent,
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

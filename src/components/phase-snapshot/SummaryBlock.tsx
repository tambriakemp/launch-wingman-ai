import { useState } from "react";
import { ChevronRight, Users, AlertCircle, Target, Clock, Shield, Route, MessageSquare, Sparkles, Palette, Layout, Mail, CreditCard, CheckCircle, Share2, Lightbulb, Calendar, BarChart3, Award, Package, FileText, ArrowRightCircle, type LucideIcon } from "lucide-react";
import { ViewMoreDialog } from "./ViewMoreDialog";
import { cn } from "@/lib/utils";
import type { Phase } from "@/types/tasks";

interface SummaryBlockProps {
  label: string;
  bullets: string[];
  fullContent: string;
  taskRoute: string;
  taskId: string;
  phase: Phase;
}

// Map task IDs to contextual icons
const TASK_ICONS: Record<string, LucideIcon> = {
  // Planning
  planning_define_audience: Users,
  planning_define_problem: AlertCircle,
  planning_define_dream_outcome: Target,
  planning_time_effort_perception: Clock,
  planning_perceived_likelihood: Shield,
  planning_choose_launch_path: Route,
  planning_offer_stack: Sparkles,
  planning_phase_review: CheckCircle,
  // Messaging
  messaging_core_message: MessageSquare,
  messaging_transformation_statement: Target,
  messaging_talking_points: Lightbulb,
  messaging_common_objections: Shield,
  messaging_phase_review: CheckCircle,
  messaging_social_bio: Share2,
  messaging_visual_direction: Palette,
  // Build
  build_choose_delivery_asset: Package,
  build_create_asset: FileText,
  build_define_access_moment: ArrowRightCircle,
  build_choose_platform: Layout,
  build_main_page_setup: Layout,
  build_simple_launch_page: Layout,
  build_email_platform: Mail,
  build_payments_setup: CreditCard,
  build_phase_review: CheckCircle,
  // Content
  content_choose_platforms: Share2,
  content_define_themes: Lightbulb,
  content_plan_launch_window: Calendar,
  content_write_captions: MessageSquare,
  content_phase_review: CheckCircle,
  // Launch
  launch_set_dates: Calendar,
  launch_capture_starting_point: BarChart3,
  launch_confirm_checklist: CheckCircle,
  launch_phase_review: CheckCircle,
  // Post-Launch
  postlaunch_review: Award,
  postlaunch_capture_ending_point: BarChart3,
};

// Phase accent colors
const PHASE_COLORS: Record<Phase, string> = {
  planning: "border-l-blue-500",
  messaging: "border-l-purple-500",
  build: "border-l-emerald-500",
  content: "border-l-amber-500",
  "pre-launch": "border-l-cyan-500",
  launch: "border-l-rose-500",
  "post-launch": "border-l-teal-500",
};

const PHASE_ICON_COLORS: Record<Phase, string> = {
  planning: "text-blue-500",
  messaging: "text-purple-500",
  build: "text-emerald-500",
  content: "text-amber-500",
  "pre-launch": "text-cyan-500",
  launch: "text-rose-500",
  "post-launch": "text-teal-500",
};

const PHASE_DOT_COLORS: Record<Phase, string> = {
  planning: "bg-blue-500",
  messaging: "bg-purple-500",
  build: "bg-emerald-500",
  content: "bg-amber-500",
  "pre-launch": "bg-cyan-500",
  launch: "bg-rose-500",
  "post-launch": "bg-teal-500",
};

const PHASE_LINK_COLORS: Record<Phase, string> = {
  planning: "text-blue-500 hover:text-blue-600",
  messaging: "text-purple-500 hover:text-purple-600",
  build: "text-emerald-500 hover:text-emerald-600",
  content: "text-amber-500 hover:text-amber-600",
  "pre-launch": "text-cyan-500 hover:text-cyan-600",
  launch: "text-rose-500 hover:text-rose-600",
  "post-launch": "text-teal-500 hover:text-teal-600",
};

export function SummaryBlock({ label, bullets, fullContent, taskRoute, taskId, phase }: SummaryBlockProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const showViewMore = fullContent.length > 200 || bullets.length > 2;
  const Icon = TASK_ICONS[taskId] || MessageSquare;
  const accentColor = PHASE_COLORS[phase];
  const iconColor = PHASE_ICON_COLORS[phase];

  // Check if this is a single quote-style value
  const isSingleValue = bullets.length === 1 && !bullets[0].includes(":");
  const isListContent = bullets.length > 1;

  return (
    <>
      <div 
        className={cn(
          "relative p-5 bg-card/50 rounded-lg border-l-4 transition-all hover:bg-card/80",
          accentColor
        )}
      >
        {/* Header with icon and label */}
        <div className="flex items-center gap-3 mb-3">
          <div className={cn("p-2 rounded-lg bg-background/80", iconColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-foreground tracking-wide uppercase">
            {label}
          </h4>
        </div>

        {/* Content area */}
        <div className="relative">
          {isSingleValue ? (
            // Quote-style for single values
            <blockquote className="pl-4 border-l-2 border-border/50 italic text-base text-foreground/80 leading-relaxed">
              "{bullets[0]}"
            </blockquote>
          ) : isListContent ? (
            // Formatted list for multiple values
            <div className="space-y-2">
              {bullets.slice(0, 3).map((bullet, i) => (
                <p key={i} className="text-base text-foreground/80 leading-relaxed flex items-start gap-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0", PHASE_DOT_COLORS[phase])} />
                  <span>{bullet}</span>
                </p>
              ))}
            </div>
          ) : (
            // Fallback flowing paragraph
            <p className="text-base text-foreground/80 leading-relaxed">
              {bullets.length > 0 ? bullets.slice(0, 2).join(" • ") : ""}
            </p>
          )}

          {/* Fade gradient for truncated content */}
          {showViewMore && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card/50 to-transparent pointer-events-none" />
          )}
        </div>

        {/* Continue reading link */}
        {showViewMore && (
          <button
            onClick={() => setDialogOpen(true)}
            className={cn(
              "mt-4 text-sm font-medium flex items-center gap-1.5 transition-colors",
              PHASE_LINK_COLORS[phase]
            )}
          >
            Continue reading
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <ViewMoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={label}
        content={fullContent}
        taskRoute={taskRoute}
        phase={phase}
      />
    </>
  );
}

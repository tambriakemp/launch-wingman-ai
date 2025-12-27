import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Users, AlertCircle, Target, Clock, Shield, Route, MessageSquare, Sparkles, Palette, Layout, Mail, CreditCard, CheckCircle, Share2, Lightbulb, Calendar, BarChart3, Award, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewMoreDialog } from "./ViewMoreDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Phase } from "@/types/tasks";

interface SummaryCardProps {
  label: string;
  bullets: string[];
  fullContent: string;
  taskRoute: string;
  taskId: string;
  phase: Phase;
}

// Map task IDs to contextual icons
const TASK_ICONS: Record<string, LucideIcon> = {
  planning_define_audience: Users,
  planning_define_problem: AlertCircle,
  planning_define_dream_outcome: Target,
  planning_time_effort_perception: Clock,
  planning_perceived_likelihood: Shield,
  planning_choose_launch_path: Route,
  planning_offer_stack: Sparkles,
  planning_phase_review: CheckCircle,
  messaging_core_message: MessageSquare,
  messaging_transformation_statement: Target,
  messaging_talking_points: Lightbulb,
  messaging_common_objections: Shield,
  messaging_phase_review: CheckCircle,
  messaging_social_bio: Share2,
  messaging_visual_direction: Palette,
  build_choose_platform: Layout,
  build_main_page_setup: Layout,
  build_email_platform: Mail,
  build_payments_setup: CreditCard,
  build_phase_review: CheckCircle,
  content_choose_platforms: Share2,
  content_define_themes: Lightbulb,
  content_plan_launch_window: Calendar,
  content_write_captions: MessageSquare,
  content_phase_review: CheckCircle,
  launch_set_dates: Calendar,
  launch_capture_starting_point: BarChart3,
  launch_confirm_checklist: CheckCircle,
  launch_phase_review: CheckCircle,
  postlaunch_review: Award,
  postlaunch_capture_ending_point: BarChart3,
};

const PHASE_ICON_BG: Record<Phase, string> = {
  planning: "bg-blue-500/10 text-blue-500",
  messaging: "bg-purple-500/10 text-purple-500",
  build: "bg-emerald-500/10 text-emerald-500",
  content: "bg-amber-500/10 text-amber-500",
  launch: "bg-rose-500/10 text-rose-500",
  "post-launch": "bg-teal-500/10 text-teal-500",
};

const PHASE_BUTTON_COLORS: Record<Phase, string> = {
  planning: "bg-blue-500 hover:bg-blue-600 text-white",
  messaging: "bg-purple-500 hover:bg-purple-600 text-white",
  build: "bg-emerald-500 hover:bg-emerald-600 text-white",
  content: "bg-amber-500 hover:bg-amber-600 text-white",
  launch: "bg-rose-500 hover:bg-rose-600 text-white",
  "post-launch": "bg-teal-500 hover:bg-teal-600 text-white",
};

const MAX_LINES = 7;

export function SummaryCard({ label, bullets, fullContent, taskRoute, taskId, phase }: SummaryCardProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const Icon = TASK_ICONS[taskId] || MessageSquare;

  // Check if content exceeds 4 lines
  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = parseFloat(getComputedStyle(contentRef.current).lineHeight);
      const maxHeight = lineHeight * MAX_LINES;
      setNeedsTruncation(contentRef.current.scrollHeight > maxHeight + 8);
    }
  }, [bullets, fullContent]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleViewTask = () => {
    navigate(taskRoute);
  };

  // Format content as flowing paragraph text
  const displayContent = bullets.join(" ");

  return (
    <>
      <div 
        className="relative p-5 bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Copy button - top right */}
        <button
          onClick={handleCopy}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Copy content"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {/* Header with icon and label */}
        <div className="flex items-center gap-3 mb-4 pr-10">
          <div className={cn("p-2.5 rounded-xl", PHASE_ICON_BG[phase])}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {label}
          </h3>
        </div>

        {/* Content area */}
        <div className="relative">
          <div 
            ref={contentRef}
            className={cn(
              "text-sm text-muted-foreground leading-relaxed whitespace-normal",
              needsTruncation && "[display:-webkit-box] [-webkit-line-clamp:7] [-webkit-box-orient:vertical] overflow-hidden"
            )}
          >
            {displayContent}
          </div>

          {/* Fade gradient for truncated content */}
          {needsTruncation && (
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-5">
          <Button 
            size="sm"
            onClick={handleViewTask}
            className={cn("text-sm", PHASE_BUTTON_COLORS[phase])}
          >
            View Task
          </Button>
          
          {needsTruncation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View More
            </Button>
          )}
        </div>
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

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Users, AlertCircle, Target, Clock, Shield, Route, MessageSquare, Sparkles, Palette, Layout, Mail, CreditCard, CheckCircle, Share2, Lightbulb, Calendar, BarChart3, Award, Package, FileText, ArrowRightCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewMoreDialog } from "./ViewMoreDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Phase } from "@/types/tasks";
import type { ContentType, StructuredContent, ContentItem } from "@/hooks/usePhaseSnapshot";

interface SummaryCardProps {
  label: string;
  bullets: string[];
  fullContent: string;
  taskRoute: string;
  taskId: string;
  phase: Phase;
  contentType: ContentType;
  structuredContent: StructuredContent;
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
  build_choose_delivery_asset: Package,
  build_create_asset: FileText,
  build_define_access_moment: ArrowRightCircle,
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


const MAX_LINES = 7;

// Content Renderer Component
function ContentRenderer({ 
  contentType, 
  structuredContent, 
  phase 
}: { 
  contentType: ContentType; 
  structuredContent: StructuredContent;
  phase: Phase;
}) {
  const items = structuredContent.items;
  
  if (!items || items.length === 0) {
    return null;
  }

  switch (contentType) {
    case "paragraph":
      return (
        <div className="space-y-1">
          {items.map((item, idx) => (
            <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
              {item.value}
            </p>
          ))}
        </div>
      );

    case "quote":
      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <p key={idx} className="text-sm text-muted-foreground italic leading-relaxed">
              "{item.value}"
            </p>
          ))}
        </div>
      );

    case "numbered-list":
      return (
        <div className="space-y-2">
          {items.slice(0, 5).map((item, idx) => (
            <div key={idx} className="flex gap-2.5">
              <span className="text-sm font-medium text-muted-foreground/70 shrink-0 w-5">
                {idx + 1}.
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      );

    case "key-value":
      return (
        <div className="space-y-3">
          {items.slice(0, 4).map((item, idx) => (
            <div key={idx}>
              <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
                {item.label}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      );

    case "offer-stack":
      return (
        <div className="space-y-3">
          {items.slice(0, 3).map((item, idx) => (
            <div key={idx} className={cn(
              idx > 0 && "pt-3 border-t border-border/50"
            )}>
              <p className="text-sm font-semibold text-foreground">
                {item.label}
              </p>
              {item.value && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                  {item.value}
                </p>
              )}
              <p className="text-sm font-medium text-primary mt-1">
                {item.secondary}
              </p>
            </div>
          ))}
        </div>
      );

    case "badge":
      return (
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <span 
              key={idx}
              className={cn(
                "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border",
                PHASE_BADGE_COLORS[phase]
              )}
            >
              {item.value}
            </span>
          ))}
        </div>
      );

    case "visual-palette":
      const colors = items.filter(i => i.label === "color");
      const fonts = items.filter(i => i.label !== "color");
      
      return (
        <div className="space-y-3">
          {colors.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
                Colors
              </span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {colors.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <div 
                      className="w-5 h-5 rounded-full border border-border/50 shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.value && (
                      <span className="text-xs text-muted-foreground">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {fonts.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
                Fonts
              </span>
              <div className="space-y-1 mt-1">
                {fonts.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-baseline gap-2">
                    <span className="text-xs text-muted-foreground/70 capitalize">{item.label}:</span>
                    <span className="text-sm text-muted-foreground font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case "social-bio":
      return (
        <div className="space-y-3">
          {items.slice(0, 2).map((item, idx) => (
            <div key={idx} className={cn(
              idx > 0 && "pt-3 border-t border-border/50"
            )}>
              <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
                {item.label}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      );

    case "metrics":
      return (
        <div className="grid grid-cols-2 gap-3">
          {items.slice(0, 6).map((item, idx) => (
            <div key={idx}>
              <span className="text-xs text-muted-foreground/70">
                {item.label}
              </span>
              <p className="text-sm font-semibold text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      );

    case "checklist":
      return (
        <div className="space-y-1.5">
          {items.slice(0, 5).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-sm text-muted-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      );

    case "dates":
      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground/80">
                {item.label}
              </span>
              <span className="text-sm font-medium text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className="space-y-1">
          {items.map((item, idx) => (
            <p key={idx} className="text-sm text-muted-foreground leading-relaxed">
              {item.value}
            </p>
          ))}
        </div>
      );
  }
}

export function SummaryCard({ 
  label, 
  bullets, 
  fullContent, 
  taskRoute, 
  taskId, 
  phase,
  contentType,
  structuredContent 
}: SummaryCardProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const Icon = TASK_ICONS[taskId] || MessageSquare;

  // Check if content exceeds max lines
  useEffect(() => {
    if (contentRef.current) {
      const lineHeight = parseFloat(getComputedStyle(contentRef.current).lineHeight);
      const maxHeight = lineHeight * MAX_LINES;
      setNeedsTruncation(contentRef.current.scrollHeight > maxHeight + 8);
    }
  }, [structuredContent, contentType]);

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

        {/* Content area with smart formatting */}
        <div className="relative">
          <div 
            ref={contentRef}
            className={cn(
              "min-h-[2rem]",
              needsTruncation && "[display:-webkit-box] [-webkit-line-clamp:7] [-webkit-box-orient:vertical] overflow-hidden"
            )}
          >
            <ContentRenderer 
              contentType={contentType} 
              structuredContent={structuredContent}
              phase={phase}
            />
          </div>

          {/* Fade gradient for truncated content */}
          {needsTruncation && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
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
        contentType={contentType}
        structuredContent={structuredContent}
      />
    </>
  );
}

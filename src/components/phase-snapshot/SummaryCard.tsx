import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Copy, Check, Pencil, ChevronDown, ChevronUp,
  Users, AlertCircle, Target, Clock, Shield, Route,
  MessageSquare, Sparkles, Palette, Layout, Mail,
  CreditCard, CheckCircle2, Share2, Lightbulb,
  Calendar, BarChart3, Award, Package, FileText,
  ArrowRightCircle, type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Phase } from "@/types/tasks";
import type { ContentType, StructuredContent } from "@/hooks/usePhaseSnapshot";

interface AccordionBlockProps {
  label: string;
  index: number;
  bullets: string[];
  fullContent: string;
  taskRoute: string;
  taskId: string;
  phase: Phase;
  contentType: ContentType;
  structuredContent: StructuredContent;
  defaultOpen?: boolean;
}

const TASK_ICONS: Record<string, LucideIcon> = {
  planning_define_audience: Users,
  planning_define_problem: AlertCircle,
  planning_define_dream_outcome: Target,
  planning_time_effort_perception: Clock,
  planning_perceived_likelihood: Shield,
  planning_choose_launch_path: Route,
  planning_offer_stack: Sparkles,
  planning_phase_review: CheckCircle2,
  messaging_core_message: MessageSquare,
  messaging_transformation_statement: Target,
  messaging_talking_points: Lightbulb,
  messaging_common_objections: Shield,
  messaging_phase_review: CheckCircle2,
  messaging_social_bio: Share2,
  messaging_visual_direction: Palette,
  build_choose_delivery_asset: Package,
  build_create_asset: FileText,
  build_define_access_moment: ArrowRightCircle,
  build_choose_platform: Layout,
  build_main_page_setup: Layout,
  build_email_platform: Mail,
  build_payments_setup: CreditCard,
  build_phase_review: CheckCircle2,
  content_choose_platforms: Share2,
  content_define_themes: Lightbulb,
  content_plan_launch_window: Calendar,
  content_write_captions: MessageSquare,
  content_phase_review: CheckCircle2,
  launch_set_dates: Calendar,
  launch_capture_starting_point: BarChart3,
  launch_confirm_checklist: CheckCircle2,
  launch_phase_review: CheckCircle2,
  postlaunch_review: Award,
  postlaunch_capture_ending_point: BarChart3,
};

function ContentRenderer({ contentType, structuredContent }: {
  contentType: ContentType;
  structuredContent: StructuredContent;
}) {
  const items = structuredContent.items;
  if (!items || items.length === 0) return null;

  switch (contentType) {
    case "paragraph":
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <p key={idx} className="text-sm text-foreground/80 leading-relaxed">{item.value}</p>
          ))}
        </div>
      );
    case "quote":
      return (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="border-l-2 border-primary/30 pl-4">
              <p className="text-sm italic text-foreground/80 leading-relaxed">"{item.value}"</p>
            </div>
          ))}
        </div>
      );
    case "numbered-list":
      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3 text-sm">
              <span className="font-semibold text-muted-foreground shrink-0 w-5 text-right">{idx + 1}.</span>
              <p className="text-foreground/80 leading-relaxed">{item.value}</p>
            </div>
          ))}
        </div>
      );
    case "key-value":
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="text-sm text-foreground/80 leading-relaxed mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      );
    case "offer-stack":
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className={cn("pb-3", idx < items.length - 1 && "border-b border-border/50")}>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                {item.value && <p className="text-sm text-foreground/70 mt-0.5">{item.value}</p>}
              </div>
              {item.secondary && (
                <span className="inline-block mt-1.5 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {item.secondary}
                </span>
              )}
            </div>
          ))}
        </div>
      );
    case "badge":
      return (
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border bg-secondary/15 text-secondary border-secondary/30">
              {item.value}
            </span>
          ))}
        </div>
      );
    case "visual-palette": {
      const colors = items.filter(i => i.label === "color");
      const fonts = items.filter(i => i.label !== "color");
      return (
        <div className="space-y-4">
          {colors.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Colors</p>
              <div className="flex flex-wrap gap-3">
                {colors.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border border-border/50 shrink-0" style={{ backgroundColor: item.color }} />
                    {item.value && <span className="text-xs text-foreground/70">{item.value}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {fonts.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Fonts</p>
              <div className="space-y-1">
                {fonts.map((item, idx) => (
                  <div key={idx} className="flex items-baseline gap-2 text-sm">
                    <span className="text-muted-foreground capitalize text-xs w-16">{item.label}</span>
                    <span className="text-foreground font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    case "social-bio":
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className={cn("pb-3", idx < items.length - 1 && "border-b border-border/50")}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="text-sm text-foreground/80 leading-relaxed mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      );
    case "metrics":
      return (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold text-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      );
    case "checklist":
      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-sm text-foreground/80">{item.value}</span>
            </div>
          ))}
        </div>
      );
    case "dates":
      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0 text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      );
    default:
      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <p key={idx} className="text-sm text-foreground/80 leading-relaxed">{item.value}</p>
          ))}
        </div>
      );
  }
}

export function AccordionBlock({
  label, index, fullContent, taskRoute, taskId, phase,
  contentType, structuredContent, defaultOpen = false
}: AccordionBlockProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const Icon = TASK_ICONS[taskId] || MessageSquare;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(taskRoute);
  };

  return (
    <div className="border-b border-border/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-card hover:bg-muted/30 transition-colors text-left"
      >
        <span className="text-xs font-mono text-muted-foreground/60 w-6 shrink-0">
          {String(index).padStart(2, "0")}
        </span>
        <div className="p-1.5 rounded-md bg-secondary/10 text-secondary">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-foreground flex-1 truncate">{label}</span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors"
            title="Copy content"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleEdit}
            className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-muted-foreground/50">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 bg-card">
          <div className="pl-[calc(1.5rem+0.75rem+2.25rem)]">
            <ContentRenderer contentType={contentType} structuredContent={structuredContent} />
          </div>
        </div>
      )}
    </div>
  );
}

export { AccordionBlock as SummaryCard };

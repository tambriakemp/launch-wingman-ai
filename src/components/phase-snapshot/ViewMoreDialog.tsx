import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import type { Phase } from "@/types/tasks";
import type { ContentType, StructuredContent } from "@/hooks/usePhaseSnapshot";

interface ViewMoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  taskRoute: string;
  phase?: Phase;
  contentType?: ContentType;
  structuredContent?: StructuredContent;
}

const PHASE_BUTTON_COLORS: Record<Phase, string> = {
  planning: "bg-blue-500 hover:bg-blue-600",
  messaging: "bg-purple-500 hover:bg-purple-600",
  build: "bg-emerald-500 hover:bg-emerald-600",
  content: "bg-amber-500 hover:bg-amber-600",
  "pre-launch": "bg-cyan-500 hover:bg-cyan-600",
  launch: "bg-rose-500 hover:bg-rose-600",
  "post-launch": "bg-teal-500 hover:bg-teal-600",
};

const PHASE_BADGE_COLORS: Record<Phase, string> = {
  planning: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  messaging: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  build: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  content: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  "pre-launch": "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
  launch: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  "post-launch": "bg-teal-500/15 text-teal-600 border-teal-500/30",
};

// Full Content Renderer - shows all items without truncation
function FullContentRenderer({ 
  contentType, 
  structuredContent, 
  phase,
  fallbackContent
}: { 
  contentType?: ContentType; 
  structuredContent?: StructuredContent;
  phase: Phase;
  fallbackContent: string;
}) {
  const items = structuredContent?.items;
  
  if (!items || items.length === 0 || !contentType) {
    // Fallback to paragraph rendering
    return (
      <div className="space-y-4">
        {fallbackContent.split("\n\n").map((paragraph, i) => (
          <p key={i} className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {paragraph}
          </p>
        ))}
      </div>
    );
  }

  switch (contentType) {
    case "paragraph":
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <p key={idx} className="text-base text-foreground/90 leading-relaxed">
              {item.value}
            </p>
          ))}
        </div>
      );

    case "quote":
      return (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <p key={idx} className="text-base text-foreground/90 italic leading-relaxed border-l-2 border-primary/30 pl-4">
              "{item.value}"
            </p>
          ))}
        </div>
      );

    case "numbered-list":
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="text-base font-semibold text-primary shrink-0 w-6">
                {idx + 1}.
              </span>
              <p className="text-base text-foreground/90 leading-relaxed">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      );

    case "key-value":
      return (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx}>
              <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {item.label}
              </span>
              <p className="text-base text-foreground/90 leading-relaxed mt-1">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      );

    case "offer-stack":
      return (
        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className={cn(
              "pb-4",
              idx < items.length - 1 && "border-b border-border/50"
            )}>
              <p className="text-base font-semibold text-foreground">
                {item.label}
              </p>
              {item.value && (
                <p className="text-base text-foreground/80 leading-relaxed mt-1">
                  {item.value}
                </p>
              )}
              <p className="text-base font-medium text-primary mt-2">
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
                "inline-flex items-center px-4 py-2 rounded-full text-base font-medium border",
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
        <div className="space-y-5">
          {colors.length > 0 && (
            <div>
              <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Colors
              </span>
              <div className="flex flex-wrap gap-3 mt-2">
                {colors.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border border-border/50 shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.value && (
                      <span className="text-sm text-foreground/80">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {fonts.length > 0 && (
            <div>
              <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Fonts
              </span>
              <div className="space-y-2 mt-2">
                {fonts.map((item, idx) => (
                  <div key={idx} className="flex items-baseline gap-3">
                    <span className="text-sm text-foreground/60 capitalize w-20">{item.label}:</span>
                    <span className="text-base text-foreground font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case "social-bio":
      return (
        <div className="space-y-5">
          {items.map((item, idx) => (
            <div key={idx} className={cn(
              "pb-4",
              idx < items.length - 1 && "border-b border-border/50"
            )}>
              <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {item.label}
              </span>
              <p className="text-base text-foreground/90 leading-relaxed mt-2">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      );

    case "metrics":
      return (
        <div className="grid grid-cols-2 gap-4">
          {items.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-muted/30">
              <span className="text-sm text-foreground/60">
                {item.label}
              </span>
              <p className="text-lg font-semibold text-foreground mt-1">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      );

    case "checklist":
      return (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-base text-foreground/90">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      );

    case "dates":
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-base text-foreground/80">
                {item.label}
              </span>
              <span className="text-base font-semibold text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <p key={idx} className="text-base text-foreground/90 leading-relaxed">
              {item.value}
            </p>
          ))}
        </div>
      );
  }
}

export function ViewMoreDialog({
  open,
  onOpenChange,
  title,
  content,
  taskRoute,
  phase = "planning",
  contentType,
  structuredContent,
}: ViewMoreDialogProps) {
  const navigate = useNavigate();

  const handleEdit = () => {
    onOpenChange(false);
    navigate(taskRoute);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            View the full content for {title}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] px-6">
          <div className="pb-6">
            <FullContentRenderer 
              contentType={contentType}
              structuredContent={structuredContent}
              phase={phase}
              fallbackContent={content}
            />
          </div>
        </ScrollArea>

        <div className="flex justify-end p-6 pt-4 border-t border-border/30 bg-muted/30">
          <Button 
            onClick={handleEdit} 
            className={cn("text-white", PHASE_BUTTON_COLORS[phase])}
          >
            View Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
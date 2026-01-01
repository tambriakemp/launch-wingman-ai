import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTENT_TYPE_COLORS: Record<string, string> = {
  general: "bg-slate-500",
  stories: "bg-amber-500",
  offer: "bg-emerald-500",
  "behind-the-scenes": "bg-cyan-500",
};

interface SuggestionViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestion: {
    title: string;
    description: string;
    template_type: string;
    content_type: string;
  } | null;
  templateInfo?: {
    phase: string;
    day_number: number;
    time_of_day: string;
  };
  onAdd: () => void;
  onRegenerate: () => void;
  isAdding?: boolean;
  isRegenerating?: boolean;
}

export const SuggestionViewDialog = ({
  open,
  onOpenChange,
  suggestion,
  templateInfo,
  onAdd,
  onRegenerate,
  isAdding,
  isRegenerating,
}: SuggestionViewDialogProps) => {
  if (!suggestion) return null;

  const formatPhase = (phase: string) => {
    return phase
      .replace(/-/g, ' ')
      .replace(/week/i, 'Week')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div 
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                CONTENT_TYPE_COLORS[suggestion.content_type] || "bg-slate-500"
              )}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                AI Generated
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {suggestion.content_type.replace("-", " ")}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {suggestion.template_type.replace(/-/g, " ")}
              </Badge>
            </div>
          </div>
          <DialogTitle className="text-lg">{suggestion.title}</DialogTitle>
          {templateInfo && (
            <p className="text-sm text-muted-foreground mt-1">
              {formatPhase(templateInfo.phase)} • Day {templateInfo.day_number} • {templateInfo.time_of_day}
            </p>
          )}
        </DialogHeader>

        <div className="py-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Suggested Caption/Hook</h4>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {suggestion.description}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onRegenerate}
            disabled={isRegenerating || isAdding}
            className="w-full sm:w-auto"
          >
            {isRegenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Regenerate
          </Button>
          <Button
            onClick={onAdd}
            disabled={isAdding || isRegenerating}
            className="w-full sm:w-auto"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add to Timeline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

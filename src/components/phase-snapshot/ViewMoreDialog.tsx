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
import type { Phase } from "@/types/tasks";

interface ViewMoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  taskRoute: string;
  phase?: Phase;
}

// Phase accent colors for the dialog
const PHASE_HEADER_COLORS: Record<Phase, string> = {
  planning: "border-l-blue-500",
  messaging: "border-l-purple-500",
  build: "border-l-emerald-500",
  content: "border-l-amber-500",
  launch: "border-l-rose-500",
  "post-launch": "border-l-teal-500",
};

const PHASE_BUTTON_COLORS: Record<Phase, string> = {
  planning: "bg-blue-500 hover:bg-blue-600",
  messaging: "bg-purple-500 hover:bg-purple-600",
  build: "bg-emerald-500 hover:bg-emerald-600",
  content: "bg-amber-500 hover:bg-amber-600",
  launch: "bg-rose-500 hover:bg-rose-600",
  "post-launch": "bg-teal-500 hover:bg-teal-600",
};

export function ViewMoreDialog({
  open,
  onOpenChange,
  title,
  content,
  taskRoute,
  phase = "planning",
}: ViewMoreDialogProps) {
  const navigate = useNavigate();

  const handleEdit = () => {
    onOpenChange(false);
    navigate(taskRoute);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <div className={cn("border-l-4", PHASE_HEADER_COLORS[phase])}>
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
            <DialogDescription className="sr-only">
              View the full content for {title}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] px-6">
            <div className="space-y-4 pb-6">
              {content.split("\n\n").map((paragraph, i) => (
                <p 
                  key={i} 
                  className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap"
                >
                  {paragraph}
                </p>
              ))}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

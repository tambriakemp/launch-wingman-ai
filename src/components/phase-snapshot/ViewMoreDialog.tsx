import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ViewMoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  taskRoute: string;
}

export function ViewMoreDialog({
  open,
  onOpenChange,
  title,
  content,
  taskRoute,
}: ViewMoreDialogProps) {
  const navigate = useNavigate();

  const handleEdit = () => {
    onOpenChange(false);
    navigate(taskRoute);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            View the full content for {title}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {content.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleEdit} className="gap-2">
            <Pencil className="w-4 h-4" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

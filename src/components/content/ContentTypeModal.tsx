import { useState } from "react";
import { Palette, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContentTypeOption {
  id: string;
  name: string;
  color: string;
  hex: string;
}

export const CONTENT_TYPES: ContentTypeOption[] = [
  { id: "general", name: "General", color: "bg-slate-500", hex: "#64748b" },
  { id: "stories", name: "Stories", color: "bg-amber-500", hex: "#f59e0b" },
  { id: "offer", name: "Offer", color: "bg-emerald-500", hex: "#10b981" },
  { id: "behind-the-scenes", name: "Behind the Scenes", color: "bg-cyan-500", hex: "#06b6d4" },
];

interface ContentTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedContentType: string;
  onContentTypeChange: (contentType: string) => void;
}

export function ContentTypeModal({
  open,
  onOpenChange,
  selectedContentType,
  onContentTypeChange,
}: ContentTypeModalProps) {
  const [localContentType, setLocalContentType] = useState<string>(selectedContentType);

  // Sync local state when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalContentType(selectedContentType);
    }
    onOpenChange(isOpen);
  };

  const selectContentType = (typeId: string) => {
    setLocalContentType(typeId);
  };

  const handleSave = () => {
    onContentTypeChange(localContentType);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Content Type
          </DialogTitle>
          <DialogDescription>
            Select a content type to categorize your post.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {CONTENT_TYPES.map((type) => {
            const isSelected = localContentType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => selectContentType(type.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className={cn("w-3 h-3 rounded-full", type.color)} />
                <span className="flex-1 text-sm">{type.name}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { ContentTypeOption };

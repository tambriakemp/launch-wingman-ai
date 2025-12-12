import { GripVertical, Check, Plus, Wand2, PenLine, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  index: number;
  label: string;
  hasContent: boolean;
  isAiMode: boolean;
  preview?: string;
  onEdit: () => void;
  dragHandleProps?: any;
}

export const SectionCard = ({
  index,
  label,
  hasContent,
  isAiMode,
  preview,
  onEdit,
  dragHandleProps,
}: SectionCardProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 border rounded-lg bg-card transition-all hover:shadow-sm",
        hasContent ? "border-border" : "border-dashed border-muted-foreground/30"
      )}
    >
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {/* Index Badge */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium",
          hasContent
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {hasContent ? <Check className="w-4 h-4" /> : index}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("font-medium", !hasContent && "text-muted-foreground")}>
            {label}
          </span>
          {hasContent && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {isAiMode ? (
                <Wand2 className="w-3 h-3" />
              ) : (
                <PenLine className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
        {preview && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">{preview}</p>
        )}
      </div>

      {/* Action */}
      <Button
        size="sm"
        variant={hasContent ? "ghost" : "outline"}
        onClick={onEdit}
        className="shrink-0"
      >
        {hasContent ? (
          <>
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </>
        )}
      </Button>
    </div>
  );
};

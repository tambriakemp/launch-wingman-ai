import { useState, useRef, useEffect } from "react";
import { Pin, PinOff, Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { PlannerSpace } from "@/hooks/usePlannerSpaces";

interface SpaceNotesSectionProps {
  space: PlannerSpace & { description?: string; description_pinned?: boolean };
  onUpdateSpace: (id: string, updates: { description?: string; description_pinned?: boolean }) => Promise<void>;
}

export const SpaceNotesSection = ({ space, onUpdateSpace }: SpaceNotesSectionProps) => {
  const isPinned = space.description_pinned ?? false;
  const description = space.description ?? "";
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(description);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(description);
    setIsEditing(false);
  }, [space.id, description]);

  const handleSave = async () => {
    await onUpdateSpace(space.id, { description: draft });
    setIsEditing(false);
  };

  const handleTogglePin = async () => {
    await onUpdateSpace(space.id, { description_pinned: !isPinned });
  };

  // If not pinned and not editing and no content, show a subtle "Add description" link
  if (!isPinned && !isEditing && !description.trim()) {
    return (
      <div className="px-4 pt-3 pb-1">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="w-3 h-3" />
          Add space description…
        </button>
      </div>
    );
  }

  // If not pinned and has content but not editing, hide it (collapsed)
  if (!isPinned && !isEditing) {
    return (
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          onClick={handleTogglePin}
        >
          <Pin className="w-3 h-3" />
          Show pinned description
        </button>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-2">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Description</span>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => { setIsEditing(true); setDraft(description); }}
              >
                <Pencil className="w-3 h-3" />
              </Button>
            )}
            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-emerald-500"
                onClick={handleSave}
              >
                <Check className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-6 w-6", isPinned && "text-primary")}
              onClick={handleTogglePin}
              title={isPinned ? "Unpin description" : "Pin description"}
            >
              {isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
            </Button>
          </div>
        </div>

        {isEditing ? (
          <AutoResizeTextarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add notes, links, or a description for this space…"
            className="text-sm bg-background min-h-[60px]"
            minRows={3}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
              if (e.key === "Escape") { setIsEditing(false); setDraft(description); }
            }}
          />
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {description || <span className="text-muted-foreground italic">No description</span>}
          </p>
        )}
      </div>
    </div>
  );
};

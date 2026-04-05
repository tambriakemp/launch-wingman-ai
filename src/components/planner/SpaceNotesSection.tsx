import { useState, useRef, useEffect } from "react";
import { Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { PlannerSpace } from "@/hooks/usePlannerSpaces";

interface SpaceNotesSectionProps {
  space: PlannerSpace & { description?: string; description_pinned?: boolean };
  onUpdateSpace: (id: string, updates: { description?: string; description_pinned?: boolean }) => Promise<void>;
}

export const SpaceNotesSection = ({ space, onUpdateSpace }: SpaceNotesSectionProps) => {
  const description = space.description ?? "";
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(description);

  useEffect(() => {
    setDraft(description);
    setIsEditing(false);
  }, [space.id, description]);

  const handleSave = async () => {
    await onUpdateSpace(space.id, { description: draft });
    setIsEditing(false);
  };

  return (
    <div className="px-4 pt-3 pb-2">
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Description</span>
          <div className="flex items-center gap-1">
            {!isEditing ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => { setIsEditing(true); setDraft(description); }}
              >
                <Pencil className="w-3 h-3" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-emerald-500"
                onClick={handleSave}
              >
                <Check className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
          <AutoResizeTextarea
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
          <button
            type="button"
            className="w-full text-left"
            onClick={() => { setIsEditing(true); setDraft(description); }}
          >
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {description || <span className="text-muted-foreground italic">Click to add a description…</span>}
            </p>
          </button>
        )}
      </div>
    </div>
  );
};

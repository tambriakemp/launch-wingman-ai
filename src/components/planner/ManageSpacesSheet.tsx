import { useState } from "react";
import { Trash2, Plus, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { cn } from "@/lib/utils";
import type { PlannerSpace } from "@/hooks/usePlannerSpaces";

const PRESET_COLORS = [
  "#3b82f6", "#0ea572", "#f5c842", "#f43f5e",
  "#8b5cf6", "#f97316", "#06b6d4", "#ec4899",
  "#84cc16", "#6366f1", "#14b8a6", "#ef4444",
];

interface ManageSpacesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaces: PlannerSpace[];
  /** Live count of tasks per space — shown next to each row. */
  taskCountsBySpace: Record<string, number>;
  onCreateSpace: (name: string, color?: string) => Promise<PlannerSpace | null | unknown>;
  onUpdateSpace: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
  onDeleteSpace: (id: string) => Promise<void>;
}

/**
 * Editorial right-side sheet for managing planner spaces. Inline rename
 * (commit on blur or Enter), inline color via a swatch popover, delete
 * with confirmation. New spaces are added from the row at the bottom.
 */
export function ManageSpacesSheet({
  open,
  onOpenChange,
  spaces,
  taskCountsBySpace,
  onCreateSpace,
  onUpdateSpace,
  onDeleteSpace,
}: ManageSpacesSheetProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlannerSpace | null>(null);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      await onCreateSpace(trimmed, newColor);
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-hidden p-0 flex flex-col">
          <SheetHeader eyebrow="Manage" className="pr-12 pb-5 pt-7 gap-1.5">
            <SheetTitle>
              Your{" "}
              <em
                className="font-display italic"
                style={{ color: "hsl(var(--terracotta-500))" }}
              >
                spaces
              </em>
              .
            </SheetTitle>
            <SheetDescription className="max-w-[46ch]">
              Rename, recolor, or retire a space. Deleting a space removes its
              categories — tasks already filed under it stay, just unfiled.
            </SheetDescription>
          </SheetHeader>

          <SheetBody className="flex flex-col gap-0">
            <div className="rounded-xl border border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-50))] overflow-hidden">
              {spaces.map((space, i) => (
                <SpaceRow
                  key={space.id}
                  space={space}
                  taskCount={taskCountsBySpace[space.id] ?? 0}
                  onRename={(name) => onUpdateSpace(space.id, { name })}
                  onRecolor={(color) => onUpdateSpace(space.id, { color })}
                  onDelete={() => setDeleteTarget(space)}
                  divider={i < spaces.length - 1}
                />
              ))}

              {/* + New space row */}
              <div className="flex items-center gap-3 px-3 py-2.5 border-t border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-100))]">
                <ColorDot color={newColor} onChange={setNewColor} />
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                  placeholder="Add a new space…"
                  className="h-8 border-0 shadow-none px-0 text-[13.5px] focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ink-900))] px-3 py-1.5 text-[11.5px] font-semibold text-[hsl(var(--paper-100))] disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>
            </div>
          </SheetBody>

          <SheetFooter className="flex-row items-center justify-end gap-2 border-t border-[hsl(var(--ink-900))] bg-[hsl(var(--paper-200))] px-7 py-3.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-[hsl(var(--ink-900))] bg-[hsl(var(--ink-900))] px-4 py-2 font-body text-[13px] font-semibold text-[hsl(var(--paper-100))] transition-opacity hover:opacity-90"
            >
              Done
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {deleteTarget && (
        <DeleteConfirmationDialog
          open={!!deleteTarget}
          onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
          onConfirm={async () => {
            await onDeleteSpace(deleteTarget.id);
            setDeleteTarget(null);
          }}
          title={`Delete "${deleteTarget.name}"?`}
          description={`This deletes the space and its ${taskCountsBySpace[deleteTarget.id] ?? 0} task${(taskCountsBySpace[deleteTarget.id] ?? 0) === 1 ? "'s" : "s'"} category labels. Tasks themselves remain. Type DELETE to confirm.`}
        />
      )}
    </>
  );
}

interface SpaceRowProps {
  space: PlannerSpace;
  taskCount: number;
  onRename: (name: string) => Promise<void>;
  onRecolor: (color: string) => Promise<void>;
  onDelete: () => void;
  divider: boolean;
}

function SpaceRow({ space, taskCount, onRename, onRecolor, onDelete, divider }: SpaceRowProps) {
  const [draftName, setDraftName] = useState(space.name);

  const commit = () => {
    const next = draftName.trim();
    if (!next || next === space.name) {
      setDraftName(space.name);
      return;
    }
    onRename(next);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 bg-[hsl(var(--paper-50))]",
        divider && "border-b border-[hsl(var(--border-hairline))]",
      )}
    >
      <ColorDot color={space.color} onChange={onRecolor} />
      <Input
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "Escape") {
            setDraftName(space.name);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="h-8 border-0 shadow-none px-0 text-[13.5px] font-medium focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
      />
      <span className="font-mono text-[10px] tabular-nums tracking-tight text-muted-foreground shrink-0">
        {taskCount} {taskCount === 1 ? "task" : "tasks"}
      </span>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${space.name}`}
        className="shrink-0 opacity-0 group-hover:opacity-100 inline-flex h-7 w-7 items-center justify-center rounded-md text-[hsl(var(--fg-muted))] hover:bg-[hsl(var(--destructive)/0.08)] hover:text-[hsl(var(--destructive))] transition"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface ColorDotProps {
  color: string;
  onChange: (color: string) => void;
}

function ColorDot({ color, onChange }: ColorDotProps) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Pick color"
          className="shrink-0 h-4 w-4 rounded-full border-2 border-transparent hover:border-[hsl(var(--ink-400))] transition"
          style={{ background: color }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-6 gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              aria-label={`Color ${c}`}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 inline-flex items-center justify-center",
                color === c ? "border-[hsl(var(--ink-900))]" : "border-transparent",
              )}
              style={{ background: c }}
            >
              {color === c && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

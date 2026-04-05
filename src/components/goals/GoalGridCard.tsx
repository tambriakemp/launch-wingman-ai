import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Pencil, FolderInput, FolderMinus, Archive, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Goal, GoalTarget } from "@/pages/Goals";

interface GoalGridCardProps {
  goal: Goal;
  targets: GoalTarget[];
  folders?: { id: string; name: string }[];
  onRename?: (goal: Goal) => void;
  onMoveToFolder?: (goalId: string, folderId: string | null) => void;
  onArchive?: (goalId: string) => void;
  onDelete?: (goalId: string) => void;
}

export function GoalGridCard({ goal, targets, folders, onRename, onMoveToFolder, onArchive, onDelete }: GoalGridCardProps) {
  const navigate = useNavigate();

  const doneTargets = targets.filter((t) => t.is_done).length;
  const totalTargets = targets.length;
  const progress =
    totalTargets > 0 ? Math.round((doneTargets / totalTargets) * 100) : 0;
  const isCompleted = goal.status === "completed";
  const isArchived = goal.status === "archived";

  const circumference = 2 * Math.PI * 40;
  const strokeDash = (progress / 100) * circumference;

  return (
    <div
      onClick={() => navigate(`/goals/${goal.id}`)}
      className={cn(
        "rounded-xl border bg-card overflow-hidden cursor-pointer group transition-all relative",
        isCompleted || isArchived
          ? "border-border/50 opacity-70"
          : "border-border hover:shadow-md hover:border-primary/20"
      )}
    >
      {/* Color bar */}
      <div className="h-1.5" style={{ backgroundColor: goal.color }} />

      {/* Options menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-3 p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground opacity-0 group-hover:opacity-100 z-10"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {onRename && (
            <DropdownMenuItem onClick={() => onRename(goal)}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
            </DropdownMenuItem>
          )}
          {onMoveToFolder && folders && folders.filter(f => f.id !== goal.folder_id).length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <FolderInput className="w-3.5 h-3.5 mr-2" /> Move to Folder
                </DropdownMenuItem>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                {folders.filter(f => f.id !== goal.folder_id).map((f) => (
                  <DropdownMenuItem key={f.id} onClick={() => onMoveToFolder(goal.id, f.id)}>
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {onArchive && (
            <DropdownMenuItem onClick={() => onArchive(goal.id)}>
              <Archive className="w-3.5 h-3.5 mr-2" /> {isArchived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
          )}
          {onMoveToFolder && goal.folder_id && (
            <DropdownMenuItem onClick={() => onMoveToFolder(goal.id, null)}>
              <FolderMinus className="w-3.5 h-3.5 mr-2" /> Remove from Folder
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem onClick={() => onDelete(goal.id)} className="text-destructive">
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="p-5 flex flex-col items-center gap-4">
        {/* Progress ring */}
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke={goal.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
            {progress}%
          </span>
        </div>

        {/* Title */}
        <h3
          className={cn(
            "text-sm font-semibold text-foreground text-center line-clamp-2",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {goal.title}
        </h3>

        {/* Targets link */}
        <p className="text-xs text-primary font-medium">
          {totalTargets} target{totalTargets !== 1 ? "s" : ""}
        </p>

        {/* Footer */}
        <div className="w-full flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border">
          <span>{format(parseISO(goal.created_at), "MMM d, yyyy")}</span>
          {isCompleted && (
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
              ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

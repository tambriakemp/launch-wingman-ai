import { Folder, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GoalFolderCardProps {
  id: string;
  name: string;
  goalCount: number;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function GoalFolderCard({
  name,
  goalCount,
  onClick,
  onRename,
  onDelete,
}: GoalFolderCardProps) {
  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-md hover:border-primary/20 transition-all group min-h-[160px] relative"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
            <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Folder className="w-6 h-6 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">
          ({goalCount} goal{goalCount !== 1 ? "s" : ""})
        </p>
      </div>
    </div>
  );
}

interface NewFolderCardProps {
  onClick: () => void;
}

export function NewFolderCard({ onClick }: NewFolderCardProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border-2 border-dashed border-border p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/40 transition-all min-h-[160px] text-muted-foreground hover:text-foreground"
    >
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
        <span className="text-2xl font-light">+</span>
      </div>
      <p className="text-sm font-medium">New Folder</p>
    </button>
  );
}

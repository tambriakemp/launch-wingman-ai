import { useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Layers,
  FolderOpen,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";
import type { PlannerTask } from "./PlannerTaskDialog";

const PRESET_COLORS = [
  "#3b82f6", "#f5c842", "#0ea572", "#f43f5e",
  "#8b5cf6", "#f97316", "#06b6d4", "#ec4899",
  "#84cc16", "#6366f1", "#14b8a6", "#ef4444",
];

interface SpacesSidebarProps {
  spaces: PlannerSpace[];
  categories: SpaceCategory[];
  tasks: PlannerTask[];
  selectedSpaceId: string | null;
  onSelectSpace: (id: string | null) => void;
  onCreateSpace: (name: string, color: string) => Promise<PlannerSpace | null>;
  onUpdateSpace: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
  onDeleteSpace: (id: string) => Promise<void>;
  onCreateCategory: (spaceId: string, name: string, color: string) => Promise<SpaceCategory | null>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export const SpacesSidebar = ({
  spaces,
  categories,
  tasks,
  selectedSpaceId,
  onSelectSpace,
  onCreateSpace,
  onUpdateSpace,
  onDeleteSpace,
  onCreateCategory,
  onDeleteCategory,
}: SpacesSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [managingCatsForSpace, setManagingCatsForSpace] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[1]);

  const getTaskCount = (spaceId: string | null) => {
    const filtered = spaceId ? tasks.filter(t => (t as any).space_id === spaceId) : tasks;
    return filtered.filter(t => t.column_id !== "done").length;
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await onCreateSpace(newName.trim(), newColor);
    setNewName("");
    setNewColor(PRESET_COLORS[0]);
    setIsAdding(false);
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    await onUpdateSpace(id, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  const handleAddCategory = async (spaceId: string) => {
    if (!newCatName.trim()) return;
    await onCreateCategory(spaceId, newCatName.trim(), newCatColor);
    setNewCatName("");
    setNewCatColor(PRESET_COLORS[1]);
  };

  if (collapsed) {
    return (
      <div className="w-10 shrink-0 border-r border-border bg-muted/20 flex flex-col items-center py-3 gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(false)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center mt-2">
          <Layers className="w-3 h-3 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-[220px] shrink-0 border-r border-border bg-muted/20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spaces</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAdding(true)}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCollapsed(true)}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* All Spaces */}
        <button
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
            selectedSpaceId === null
              ? "bg-primary/10 text-primary font-medium"
              : "text-foreground hover:bg-accent/50"
          )}
          onClick={() => onSelectSpace(null)}
        >
          <Layers className="w-4 h-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">All Spaces</span>
          <span className="text-[10px] text-muted-foreground">{getTaskCount(null)}</span>
        </button>

        {/* Individual spaces */}
        {spaces.map(space => (
          <div key={space.id}>
            {editingId === space.id ? (
              <div className="px-2 py-1.5 space-y-2">
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleEdit(space.id)}
                  className="h-8 text-xs"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      className={cn("w-5 h-5 rounded-full border-2 transition-transform hover:scale-110", editColor === c ? "border-foreground" : "border-transparent")}
                      style={{ background: c }}
                      onClick={() => setEditColor(c)}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-xs flex-1" onClick={() => handleEdit(space.id)}>Save</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center group">
                <button
                  className={cn(
                    "flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left min-w-0",
                    selectedSpaceId === space.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-accent/50"
                  )}
                  onClick={() => onSelectSpace(space.id)}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: space.color }} />
                  <span className="flex-1 truncate">{space.name}</span>
                  <span className="text-[10px] text-muted-foreground">{getTaskCount(space.id)}</span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => { setEditingId(space.id); setEditName(space.name); setEditColor(space.color); }}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit Space
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setManagingCatsForSpace(managingCatsForSpace === space.id ? null : space.id)}>
                      <Palette className="w-4 h-4 mr-2" /> Categories
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => onDeleteSpace(space.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Space
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Category manager for this space */}
            {managingCatsForSpace === space.id && (
              <div className="ml-5 pl-3 border-l-2 border-border mt-1 mb-2 space-y-1">
                {categories.filter(c => c.space_id === space.id).map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 py-1 px-2 rounded text-xs group/cat">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                    <span className="flex-1 truncate">{cat.name}</span>
                    <button
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover/cat:opacity-100 transition-opacity"
                      onClick={() => onDeleteCategory(cat.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-1.5 items-center pt-1">
                  <Input
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="New category"
                    className="h-7 text-xs flex-1"
                    onKeyDown={e => e.key === "Enter" && handleAddCategory(space.id)}
                  />
                  <div className="flex gap-1">
                    {PRESET_COLORS.slice(0, 4).map(c => (
                      <button
                        key={c}
                        className={cn("w-4 h-4 rounded-full border", newCatColor === c ? "border-foreground" : "border-transparent")}
                        style={{ background: c }}
                        onClick={() => setNewCatColor(c)}
                      />
                    ))}
                  </div>
                </div>
                <Button size="sm" className="h-6 text-[10px] w-full" onClick={() => handleAddCategory(space.id)}>
                  Add
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Add space form */}
        {isAdding && (
          <div className="px-2 py-2 space-y-2 border border-border rounded-lg bg-background mt-1">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Space name"
              className="h-8 text-xs"
              autoFocus
              onKeyDown={e => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setIsAdding(false);
              }}
            />
            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  className={cn("w-5 h-5 rounded-full border-2 transition-transform hover:scale-110", newColor === c ? "border-foreground" : "border-transparent")}
                  style={{ background: c }}
                  onClick={() => setNewColor(c)}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={handleAdd}>Create</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

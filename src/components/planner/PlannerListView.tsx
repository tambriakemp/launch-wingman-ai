import { useState, useEffect } from "react";
import { format, parseISO, isPast, isToday, startOfWeek, endOfWeek, isBefore, isAfter } from "date-fns";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2, Plus, X, FolderOpen, Tag, CircleDot, Square, CheckSquare } from "lucide-react";
import { SpaceNotesSection } from "./SpaceNotesSection";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PlannerTask } from "./PlannerTaskDialog";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";

interface PlannerListViewProps {
  tasks: PlannerTask[];
  isLoading: boolean;
  onToggleComplete: (task: PlannerTask) => void;
  onEditTask: (task: PlannerTask) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask?: () => void;
  categories?: SpaceCategory[];
  spaces?: PlannerSpace[];
  onBulkMoveSpace?: (ids: string[], spaceId: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkUpdateCategory?: (ids: string[], categoryId: string) => void;
  onBulkUpdateStatus?: (ids: string[], status: string) => void;
  onCreateCategory?: (spaceId: string, name: string) => Promise<SpaceCategory | null>;
  selectedSpaceId?: string | null;
  allCategories?: SpaceCategory[];
  onUpdateSpace?: (id: string, updates: { description?: string; description_pinned?: boolean }) => Promise<void>;
}

type GroupKey = "overdue" | "today" | "this_week" | "anytime" | "completed";

const GROUP_CONFIG: { key: GroupKey; label: string; defaultOpen: boolean; color: string }[] = [
  { key: "overdue", label: "OVERDUE", defaultOpen: true, color: "bg-destructive" },
  { key: "today", label: "TODAY", defaultOpen: true, color: "bg-blue-500" },
  { key: "this_week", label: "THIS WEEK", defaultOpen: true, color: "bg-amber-500" },
  { key: "anytime", label: "ANYTIME", defaultOpen: true, color: "bg-muted-foreground" },
  { key: "completed", label: "DONE", defaultOpen: false, color: "bg-emerald-500" },
];

function groupTasks(tasks: PlannerTask[]): Record<GroupKey, PlannerTask[]> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const groups: Record<GroupKey, PlannerTask[]> = { overdue: [], today: [], this_week: [], anytime: [], completed: [] };

  for (const task of tasks) {
    if (task.column_id === "done") { groups.completed.push(task); continue; }
    const due = task.due_at ? parseISO(task.due_at) : null;
    if (due) {
      if (isToday(due)) groups.today.push(task);
      else if (isPast(due)) groups.overdue.push(task);
      else if (!isBefore(due, weekStart) && !isAfter(due, weekEnd)) groups.this_week.push(task);
      else groups.anytime.push(task);
    } else {
      groups.anytime.push(task);
    }
  }
  return groups;
}

function getStatusBadge(columnId: string) {
  switch (columnId) {
    case "done":
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Done</span>;
    case "in_progress":
    case "in-progress":
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400">In Progress</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground">To Do</span>;
  }
}

const STATUSES = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "Doing" },
  { id: "done", label: "Done" },
];

export const PlannerListView = ({
  tasks, isLoading, onToggleComplete, onEditTask, onDeleteTask, onAddTask,
  categories = [], spaces = [],
  onBulkMoveSpace, onBulkDelete, onBulkUpdateCategory, onBulkUpdateStatus,
  onCreateCategory, selectedSpaceId, allCategories = [],
}: PlannerListViewProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUP_CONFIG.map((g) => [g.key, g.defaultOpen]))
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Clear selection when space changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [selectedSpaceId]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const grouped = groupTasks(tasks);
  const toggleGroup = (key: string) => setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkAction = (action: () => void) => {
    action();
    clearSelection();
  };

  const selectedArray = Array.from(selectedIds);

  return (
    <div className="px-4 pb-4 relative">
      <div className="grid grid-cols-[minmax(0,1fr)_100px_100px_90px_36px] gap-2 items-center px-4 py-1.5 border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none sticky top-0 bg-background z-10">
        <span className="pl-8">Name</span>
        <span>Due Date</span>
        <span>Category</span>
        <span>Status</span>
        <span />
      </div>

      {GROUP_CONFIG.map(({ key, label, color }) => {
        const items = grouped[key];
        if (items.length === 0) return null;
        const isOpen = expandedGroups[key];

        return (
          <div key={key} className="mt-1">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/40 transition-colors text-left rounded-sm"
              onClick={() => toggleGroup(key)}
            >
              {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className={cn("w-2 h-2 rounded-full shrink-0", color)} />
              <span className="text-xs font-semibold tracking-wide text-foreground">{label}</span>
              <span className="text-[10px] text-muted-foreground ml-1">{items.length}</span>
            </button>

            {isOpen && (
              <div>
                {items.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    categories={categories}
                    isSelected={selectedIds.has(task.id)}
                    onToggleSelect={toggleSelect}
                    hasSelection={selectedIds.size > 0}
                  />
                ))}
                {onAddTask && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors pl-12"
                    onClick={onAddTask}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm font-medium">No tasks yet</p>
          <p className="text-xs mt-1 mb-4">Get started by adding your first task.</p>
          {onAddTask && (
            <Button size="sm" className="gap-1.5" onClick={onAddTask}>
              <Plus className="w-4 h-4" /> Add Task
            </Button>
          )}
        </div>
      )}

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3 backdrop-blur-sm">
          <span className="text-sm font-medium whitespace-nowrap">{selectedIds.size} task{selectedIds.size > 1 ? "s" : ""} selected</span>

          {/* Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                <CircleDot className="w-3.5 h-3.5" /> Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {STATUSES.map(s => (
                <DropdownMenuItem key={s.id} onClick={() => handleBulkAction(() => onBulkUpdateStatus?.(selectedArray, s.id))}>
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Move to Space */}
          {spaces.length > 0 && onBulkMoveSpace && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                  <FolderOpen className="w-3.5 h-3.5" /> Move
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {spaces.map(sp => (
                  <DropdownMenuItem key={sp.id} onClick={() => handleBulkAction(() => onBulkMoveSpace(selectedArray, sp.id))}>
                    <div className="w-2 h-2 rounded-full mr-2" style={{ background: sp.color }} />
                    {sp.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Category — only when inside a specific space */}
          {selectedSpaceId && (
            <BulkCategoryPicker
              categories={allCategories.length > 0 ? allCategories : categories}
              selectedSpaceId={selectedSpaceId}
              onSelect={(catId) => handleBulkAction(() => onBulkUpdateCategory?.(selectedArray, catId))}
              onCreateCategory={onCreateCategory}
            />
          )}

          {/* Delete */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive"
            onClick={() => handleBulkAction(() => onBulkDelete?.(selectedArray))}
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>

          <button type="button" className="ml-1 p-1 rounded hover:bg-muted transition-colors" onClick={clearSelection}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
};

// --- Bulk Category Picker (Combobox) ---
function BulkCategoryPicker({
  categories, selectedSpaceId, onSelect, onCreateCategory,
}: {
  categories: SpaceCategory[];
  selectedSpaceId?: string | null;
  onSelect: (catId: string) => void;
  onCreateCategory?: (spaceId: string, name: string) => Promise<SpaceCategory | null>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const spaceCats = selectedSpaceId
    ? categories.filter(c => c.space_id === selectedSpaceId)
    : categories;

  const filtered = search.trim()
    ? spaceCats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : spaceCats;

  const exactMatch = spaceCats.some(c => c.name.toLowerCase() === search.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
          <Tag className="w-3.5 h-3.5" /> Category
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="center">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search or create..."
          className="h-8 text-sm mb-2"
          autoFocus
        />
        <div className="max-h-40 overflow-y-auto space-y-0.5">
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent/50 text-left"
              onClick={() => { onSelect(c.id); setOpen(false); setSearch(""); }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
              {c.name}
            </button>
          ))}
          {search.trim() && !exactMatch && selectedSpaceId && onCreateCategory && (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent/50 text-left text-primary"
              onClick={async () => {
                const cat = await onCreateCategory(selectedSpaceId, search.trim());
                if (cat) { onSelect(cat.id); setOpen(false); setSearch(""); }
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Create "{search.trim()}"
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Task Row ---
function TaskRow({ task, onToggleComplete, onEdit, onDelete, categories, isSelected, onToggleSelect, hasSelection }: {
  task: PlannerTask;
  onToggleComplete: (t: PlannerTask) => void;
  onEdit: (t: PlannerTask) => void;
  onDelete: (id: string) => void;
  categories: SpaceCategory[];
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  hasSelection: boolean;
}) {
  const isDone = task.column_id === "done";

  const getCategoryName = (id: string | null | undefined) => {
    if (!id) return "—";
    const found = categories.find(c => c.id === id);
    if (found) return found.name;
    return id;
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_100px_100px_90px_36px] gap-2 items-center px-4 h-9 hover:bg-accent/40 transition-colors cursor-pointer group border-b border-border/50",
        isSelected && "bg-primary/5"
      )}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Checkbox: visible on hover or when selected or when any selection active */}
        <button
          type="button"
          className={cn(
            "shrink-0 transition-opacity",
            isSelected || hasSelection ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(task.id); }}
        >
          {isSelected
            ? <CheckSquare className="w-4 h-4 text-primary" />
            : <Square className="w-4 h-4 text-muted-foreground/50 hover:text-primary transition-colors" />
          }
        </button>

        {/* Completion circle: always visible */}
        <button
          type="button"
          className="shrink-0"
          onClick={(e) => { e.stopPropagation(); onToggleComplete(task); }}
        >
          {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-muted-foreground/50 hover:text-primary transition-colors" />}
        </button>

        <span className={cn("text-sm truncate", isDone && "line-through text-muted-foreground")}>{task.title}</span>
      </div>

      <span className={cn("text-xs truncate", task.due_at && isPast(parseISO(task.due_at)) && !isToday(parseISO(task.due_at)) && !isDone ? "text-destructive" : "text-muted-foreground")}>
        {task.due_at ? format(parseISO(task.due_at), "MMM d") : "—"}
      </span>

      <span className="text-xs text-muted-foreground truncate capitalize">{getCategoryName(task.category)}</span>

      {getStatusBadge(task.column_id)}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

import { useState, useEffect } from "react";
import { format, parseISO, isPast, isToday, startOfWeek, endOfWeek, isBefore, isAfter } from "date-fns";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2, Plus, X, FolderOpen, Tag, CircleDot, Square, CheckSquare, Settings2 } from "lucide-react";
import { SpaceNotesSection } from "./SpaceNotesSection";
import { Switch } from "@/components/ui/switch";
import {
  Popover as SettingsPopover,
  PopoverContent as SettingsPopoverContent,
  PopoverTrigger as SettingsPopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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

type GroupKey = "overdue" | "today" | "this_week" | "anytime" | "completed" | "in_review" | "blocked" | "abandoned";

const GROUP_CONFIG: { key: GroupKey; label: string; defaultOpen: boolean; color: string; sub?: string }[] = [
  { key: "overdue", label: "Overdue", defaultOpen: true, color: "bg-destructive", sub: "needs your attention" },
  { key: "today", label: "Today", defaultOpen: true, color: "bg-primary", sub: "what you said yes to" },
  { key: "this_week", label: "This week", defaultOpen: true, color: "bg-amber-500", sub: "the shape of the days ahead" },
  { key: "anytime", label: "Anytime", defaultOpen: true, color: "bg-muted-foreground", sub: "no date — just intent" },
  { key: "in_review", label: "In review", defaultOpen: true, color: "bg-purple-500" },
  { key: "completed", label: "Done", defaultOpen: false, color: "bg-emerald-500" },
  { key: "blocked", label: "Blocked", defaultOpen: false, color: "bg-red-500" },
  { key: "abandoned", label: "Abandoned", defaultOpen: false, color: "bg-zinc-400" },
];

function groupTasks(tasks: PlannerTask[]): Record<GroupKey, PlannerTask[]> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const groups: Record<GroupKey, PlannerTask[]> = { overdue: [], today: [], this_week: [], anytime: [], completed: [], in_review: [], blocked: [], abandoned: [] };

  for (const task of tasks) {
    if (task.column_id === "done") { groups.completed.push(task); continue; }
    if (task.column_id === "in-review") { groups.in_review.push(task); continue; }
    if (task.column_id === "blocked") { groups.blocked.push(task); continue; }
    if (task.column_id === "abandoned") { groups.abandoned.push(task); continue; }
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
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wide whitespace-nowrap";
  const dot = "w-1 h-1 rounded-full";
  switch (columnId) {
    case "done":
      return <span className={cn(base, "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400")}><span className={cn(dot, "bg-emerald-500")} />Done</span>;
    case "in_progress":
    case "in-progress":
      return <span className={cn(base, "bg-blue-500/12 text-blue-700 dark:text-blue-400")}><span className={cn(dot, "bg-blue-500")} />In progress</span>;
    case "in-review":
      return <span className={cn(base, "bg-purple-500/12 text-purple-700 dark:text-purple-400")}><span className={cn(dot, "bg-purple-500")} />In review</span>;
    case "blocked":
      return <span className={cn(base, "bg-red-500/12 text-red-700 dark:text-red-400")}><span className={cn(dot, "bg-red-500")} />Blocked</span>;
    case "abandoned":
      return <span className={cn(base, "bg-zinc-400/15 text-zinc-600 dark:text-zinc-400")}><span className={cn(dot, "bg-zinc-400")} />Abandoned</span>;
    default:
      return <span className={cn(base, "bg-muted text-muted-foreground")}><span className={cn(dot, "bg-muted-foreground/60")} />To do</span>;
  }
}

const STATUSES = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "Doing" },
  { id: "in-review", label: "In Review" },
  { id: "done", label: "Done" },
  { id: "blocked", label: "Blocked" },
  { id: "abandoned", label: "Abandoned" },
];

export const PlannerListView = ({
  tasks, isLoading, onToggleComplete, onEditTask, onDeleteTask, onAddTask,
  categories = [], spaces = [],
  onBulkMoveSpace, onBulkDelete, onBulkUpdateCategory, onBulkUpdateStatus,
  onCreateCategory, selectedSpaceId, allCategories = [],
  onUpdateSpace,
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

  const activeSpace = selectedSpaceId ? spaces.find(s => s.id === selectedSpaceId) : null;

  return (
    <div className="h-full overflow-y-auto px-4 md:px-6 pb-8 relative bg-background">
      {activeSpace && onUpdateSpace && activeSpace.description_pinned && (
        <SpaceNotesSection space={activeSpace} onUpdateSpace={onUpdateSpace} />
      )}
      <div className={cn(
        "gap-2 items-center px-4 py-2 border-b border-border text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground select-none sticky top-0 bg-background z-10 grid",
        !selectedSpaceId
          ? "grid-cols-[minmax(0,1fr)_100px_120px_120px_110px_36px]"
          : "grid-cols-[minmax(0,1fr)_100px_120px_110px_36px]"
      )}>
        <span className="pl-8">Task</span>
        <span>Due</span>
        {!selectedSpaceId && <span>Space</span>}
        <span>Category</span>
        <span>Status</span>
        <span>
          {activeSpace && onUpdateSpace && (
            <SettingsPopover>
              <SettingsPopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Settings2 className="w-3.5 h-3.5" />
                </Button>
              </SettingsPopoverTrigger>
              <SettingsPopoverContent align="end" className="w-64 p-0">
                <div className="px-4 py-3 border-b border-border">
                  <span className="text-sm font-medium text-foreground">Layout options</span>
                </div>
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Pin description</span>
                    <Switch
                      checked={activeSpace.description_pinned ?? false}
                      onCheckedChange={(checked) => onUpdateSpace(activeSpace.id, { description_pinned: checked })}
                    />
                  </div>
                </div>
              </SettingsPopoverContent>
            </SettingsPopover>
          )}
        </span>
      </div>

      {GROUP_CONFIG.map(({ key, label, color, sub }) => {
        const items = grouped[key];
        if (items.length === 0) return null;
        const isOpen = expandedGroups[key];

        return (
          <section key={key} className="mt-6 first:mt-4">
            <button
              type="button"
              className="w-full flex items-baseline gap-3 px-2 py-2 text-left rounded-sm hover:bg-muted/30 transition-colors"
              onClick={() => toggleGroup(key)}
            >
              {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground self-center" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground self-center" />}
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 self-center", color)} />
              <span className="font-serif italic text-2xl tracking-tight text-foreground leading-none">{label}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{items.length}</span>
              {sub && (
                <span className="hidden sm:inline text-[11px] text-muted-foreground/80 ml-1">— {sub}</span>
              )}
            </button>

            {isOpen && (
              <div className="mt-1 rounded-lg overflow-hidden border border-border/60 bg-card">
                {items.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onMoveToSpace={onBulkMoveSpace}
                    categories={categories}
                    spaces={spaces}
                    isSelected={selectedIds.has(task.id)}
                    onToggleSelect={toggleSelect}
                    hasSelection={selectedIds.size > 0}
                    showSpaceColumn={!selectedSpaceId}
                  />
                ))}
                {onAddTask && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-4 py-2 text-[11.5px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors pl-12 border-t border-dashed border-border"
                    onClick={onAddTask}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add task</span>
                  </button>
                )}
              </div>
            )}
          </section>
        );
      })}

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-24 px-6">
          <p className="font-serif italic text-3xl text-foreground/90 leading-tight">
            A clear page.
          </p>
          <p className="text-sm text-muted-foreground mt-3 max-w-sm">
            Nothing scheduled, nothing overdue. Add a task when you're ready to commit.
          </p>
          {onAddTask && (
            <Button size="sm" className="gap-1.5 mt-6 rounded-full px-4" onClick={onAddTask}>
              <Plus className="w-4 h-4" /> Add a task
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
function TaskRow({ task, onToggleComplete, onEdit, onDelete, onMoveToSpace, categories, spaces, isSelected, onToggleSelect, hasSelection, showSpaceColumn }: {
  task: PlannerTask;
  onToggleComplete: (t: PlannerTask) => void;
  onEdit: (t: PlannerTask) => void;
  onDelete: (id: string) => void;
  onMoveToSpace?: (ids: string[], spaceId: string) => void;
  categories: SpaceCategory[];
  spaces: PlannerSpace[];
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  hasSelection: boolean;
  showSpaceColumn: boolean;
}) {
  const isDone = task.column_id === "done";

  const getCategoryName = (id: string | null | undefined) => {
    if (!id) return "—";
    const found = categories.find(c => c.id === id);
    if (found) return found.name;
    return id;
  };

  const getSpaceName = () => {
    const spaceId = (task as any).space_id;
    if (!spaceId) return "—";
    const found = spaces.find(s => s.id === spaceId);
    return found ? found.name : "—";
  };

  const getSpaceColor = () => {
    const spaceId = (task as any).space_id;
    if (!spaceId) return undefined;
    const found = spaces.find(s => s.id === spaceId);
    return found?.color;
  };

  return (
    <div
      className={cn(
        "gap-2 items-center px-4 h-11 hover:bg-accent/30 transition-colors cursor-pointer group border-b border-border/50 last:border-b-0 grid",
        showSpaceColumn
          ? "grid-cols-[minmax(0,1fr)_100px_120px_120px_110px_36px]"
          : "grid-cols-[minmax(0,1fr)_100px_120px_110px_36px]",
        isSelected && "bg-primary/5"
      )}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-center gap-2.5 min-w-0">
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

        <button
          type="button"
          className="shrink-0"
          onClick={(e) => { e.stopPropagation(); onToggleComplete(task); }}
        >
          {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-muted-foreground/50 hover:text-primary transition-colors" />}
        </button>

        <span className={cn("text-[13px] font-medium leading-snug truncate text-foreground", isDone && "line-through text-muted-foreground font-normal")}>{task.title}</span>
      </div>

      <span className={cn(
        "font-mono text-[11px] tracking-wide truncate",
        task.due_at && isPast(parseISO(task.due_at)) && !isToday(parseISO(task.due_at)) && !isDone
          ? "text-destructive"
          : "text-muted-foreground"
      )}>
        {task.due_at ? format(parseISO(task.due_at), "MMM d").toLowerCase() : "—"}
      </span>

      {showSpaceColumn && (
        <span className="text-[12px] text-foreground/80 truncate flex items-center gap-1.5">
          {getSpaceColor() && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getSpaceColor() }} />}
          {getSpaceName()}
        </span>
      )}

      <span className="text-[12px] text-muted-foreground truncate capitalize">{getCategoryName(task.category)}</span>

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
          {onMoveToSpace && spaces.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                <FolderOpen className="w-4 h-4 mr-2" /> Move to space
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {spaces.filter(s => s.id !== (task as any).space_id).map(s => (
                  <DropdownMenuItem key={s.id} onClick={(e) => { e.stopPropagation(); onMoveToSpace([task.id], s.id); }}>
                    <div className="w-2 h-2 rounded-full mr-2" style={{ background: s.color }} />
                    {s.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

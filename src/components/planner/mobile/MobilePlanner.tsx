import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { addDays, format, isToday, isPast, parseISO, startOfDay, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { Plus, Check, Trash2, Flame } from "lucide-react";
import type { PlannerTask } from "@/components/planner/PlannerTaskDialog";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";
import { SpacePicker } from "@/components/planner/SpacePicker";

const SF = '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif';
const SERIF = '"Fraunces", "New York", Georgia, serif';
const TERRACOTTA = "#C65A3E";
const PAPER = "#FBF7F1";
const INK = "#1F1B17";
const INK_60 = "rgba(31,27,23,0.62)";
const INK_40 = "rgba(31,27,23,0.42)";
const INK_20 = "rgba(31,27,23,0.20)";
const HAIRLINE = "rgba(31,27,23,0.10)";

type FilterId = "open" | "overdue" | "today" | "upcoming" | "done";
const VALID_FILTERS: ReadonlyArray<FilterId> = ["open", "overdue", "today", "upcoming", "done"];
const UPCOMING_WINDOW_DAYS = 14;

interface Props {
  tasks: PlannerTask[];
  spaces: PlannerSpace[];
  categories: SpaceCategory[];
  selectedSpaceId: string | null;
  selectedCategoryIds: string[];
  onSelectSpace: (id: string | null) => void;
  onToggleCategory: (id: string) => void;
  onClearCategories: () => void;
  onEditTask: (task: PlannerTask) => void;
  onToggleComplete: (task: PlannerTask) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: () => void;
}

const statusLabel = (col?: string | null) => {
  switch (col) {
    case "in_progress":
      return "IN PROGRESS";
    case "blocked":
      return "BLOCKED";
    case "done":
      return "DONE";
    default:
      return "TO DO";
  }
};

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; border: string; fg: string }> = {
    "IN PROGRESS": { bg: "rgba(168,110,156,0.12)", border: "rgba(168,110,156,0.3)", fg: "#7B4F73" },
    BLOCKED: { bg: "rgba(198,90,62,0.10)", border: "rgba(198,90,62,0.3)", fg: "#A14730" },
    DONE: { bg: "rgba(126,144,110,0.14)", border: "rgba(126,144,110,0.3)", fg: "#475838" },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.fg,
        fontFamily: SF,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    >
      {status}
    </span>
  );
};

const TaskRow = ({
  task,
  isLast,
  spaces,
  categories,
  onToggle,
  onDelete,
  onEdit,
}: {
  task: PlannerTask;
  isLast: boolean;
  spaces: PlannerSpace[];
  categories: SpaceCategory[];
  onToggle: (t: PlannerTask) => void;
  onDelete: (id: string) => void;
  onEdit: (t: PlannerTask) => void;
}) => {
  const [swiped, setSwiped] = useState(false);
  const startX = useRef<number | null>(null);

  const done = task.column_id === "done";
  const status = statusLabel(task.column_id);
  const dueDate = task.due_at || task.start_at;
  const dueParsed = dueDate ? parseISO(dueDate) : null;
  const overdue = !!dueParsed && isPast(dueParsed) && !isToday(dueParsed) && !done;
  const dueText = dueParsed
    ? isToday(dueParsed)
      ? format(dueParsed, "h:mma").toLowerCase()
      : format(dueParsed, "MMM d")
    : "No date";

  const space = spaces.find((s) => s.id === (task as any).space_id);
  const spaceColor = space?.color || "#94a3b8";
  const spaceName = space?.name || "Unassigned";
  const category = task.category ? categories.find((c) => c.id === task.category) : null;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40) setSwiped(true);
    else if (dx > 40) setSwiped(false);
    startX.current = null;
  };

  return (
    <div style={{ position: "relative", overflow: "hidden", background: "#fff" }}>
      {/* Reveal actions */}
      <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => {
            onToggle(task);
            setSwiped(false);
          }}
          style={{
            width: 72,
            background: "#7E906E",
            border: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="Complete"
        >
          <Check color="#fff" size={22} strokeWidth={2.4} />
        </button>
        <button
          onClick={() => {
            onDelete(task.id);
            setSwiped(false);
          }}
          style={{
            width: 72,
            background: TERRACOTTA,
            border: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="Delete"
        >
          <Trash2 color="#fff" size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Foreground row */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => !swiped && onEdit(task)}
        style={{
          position: "relative",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          transform: swiped ? "translateX(-144px)" : "translateX(0)",
          transition: "transform 240ms cubic-bezier(0.22, 0.61, 0.36, 1)",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task);
          }}
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            flexShrink: 0,
            border: `1.8px solid ${done ? TERRACOTTA : INK_20}`,
            background: done ? TERRACOTTA : "transparent",
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 160ms ease",
          }}
        >
          {done && <Check color="#fff" size={12} strokeWidth={3.5} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: SF,
              fontSize: 15.5,
              fontWeight: 500,
              color: done ? INK_40 : INK,
              letterSpacing: -0.3,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textDecoration: done ? "line-through" : "none",
            }}
          >
            {task.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span
              style={{
                fontFamily: overdue ? SERIF : SF,
                fontStyle: overdue ? "italic" : "normal",
                fontSize: 12.5,
                fontWeight: 500,
                color: overdue ? TERRACOTTA : INK_60,
                letterSpacing: -0.1,
              }}
            >
              {overdue && "· "}
              {dueText}
            </span>
            <span style={{ width: 2, height: 2, borderRadius: 999, background: INK_40 }} />
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontFamily: SF,
                fontSize: 11.5,
                fontWeight: 500,
                color: INK_60,
                letterSpacing: -0.1,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: spaceColor }} />
              {spaceName}
            </span>
            {category && (
              <>
                <span style={{ width: 2, height: 2, borderRadius: 999, background: INK_40 }} />
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: SF,
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: INK_60,
                    letterSpacing: -0.1,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: category.color || "#94a3b8" }} />
                  {category.name}
                </span>
              </>
            )}
          </div>
        </div>

        {status !== "TO DO" && status !== "DONE" && <StatusPill status={status} />}
      </div>
    </div>
  );
};

const Section = ({
  label,
  count,
  accent,
  tasks,
  spaces,
  categories,
  onToggle,
  onDelete,
  onEdit,
}: {
  label: string;
  count: number;
  accent: "terracotta" | "ink";
  tasks: PlannerTask[];
  spaces: PlannerSpace[];
  categories: SpaceCategory[];
  onToggle: (t: PlannerTask) => void;
  onDelete: (id: string) => void;
  onEdit: (t: PlannerTask) => void;
}) => {
  if (tasks.length === 0) return null;
  const accentColor = accent === "terracotta" ? TERRACOTTA : INK;
  const accentBg = accent === "terracotta" ? "rgba(198,90,62,0.10)" : "rgba(31,27,23,0.06)";
  return (
    <div style={{ marginTop: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 22px 8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 22,
              letterSpacing: -0.5,
              color: accentColor,
            }}
          >
            {label}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 22,
              height: 20,
              padding: "0 7px",
              background: accentBg,
              color: accentColor,
              borderRadius: 999,
              fontFamily: SF,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.2,
            }}
          >
            {count}
          </span>
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          margin: "0 16px",
          boxShadow: "0 1px 2px rgba(31,27,23,0.04)",
          overflow: "hidden",
        }}
      >
        {tasks.map((t, i) => (
          <div key={t.id}>
            <TaskRow
              task={t}
              isLast={i === tasks.length - 1}
              spaces={spaces}
              categories={categories}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
            />
            {i < tasks.length - 1 && <div style={{ height: 0.5, background: HAIRLINE, marginLeft: 52 }} />}
          </div>
        ))}
      </div>
    </div>
  );
};

const OverdueCard = ({ count }: { count: number }) => (
  <div style={{ margin: "14px 16px 4px" }}>
    <div
      style={{
        background: "linear-gradient(135deg, rgba(198,90,62,0.10), rgba(198,90,62,0.04))",
        border: "1px solid rgba(198,90,62,0.20)",
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          flexShrink: 0,
          background: "rgba(198,90,62,0.15)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Flame color={TERRACOTTA} size={22} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: 16,
            letterSpacing: -0.3,
            color: INK,
            lineHeight: 1.15,
          }}
        >
          {count} overdue. Reschedule together?
        </div>
        <div style={{ fontFamily: SF, fontSize: 12.5, color: INK_60, marginTop: 2 }}>
          AI can spread these across this week.
        </div>
      </div>
    </div>
  </div>
);

export const MobilePlanner = ({
  tasks,
  spaces,
  categories = [],
  selectedSpaceId,
  selectedCategoryIds,
  onSelectSpace,
  onToggleCategory,
  onClearCategories,
  onEditTask,
  onToggleComplete,
  onDeleteTask,
  onAddTask,
}: Props) => {
  // Seed from ?filter=… so links from the dashboard (Due Today / Upcoming
  // cards) land on the correct chip. Keep state in sync if the URL changes
  // while the page is mounted.
  const [searchParams] = useSearchParams();
  const initialFilter = (() => {
    const f = searchParams.get("filter") as FilterId | null;
    return f && VALID_FILTERS.includes(f) ? f : ("open" as FilterId);
  })();
  const [filter, setFilter] = useState<FilterId>(initialFilter);
  useEffect(() => {
    const f = searchParams.get("filter") as FilterId | null;
    if (f && VALID_FILTERS.includes(f)) setFilter(f);
  }, [searchParams]);

  const [scrolled, setScrolled] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 80);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const spaceCategories = useMemo(
    () => (selectedSpaceId ? categories.filter((c) => c.space_id === selectedSpaceId) : []),
    [categories, selectedSpaceId]
  );

  // Apply filter chips
  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (selectedSpaceId) list = list.filter((t) => (t as any).space_id === selectedSpaceId);
    if (selectedCategoryIds.length > 0) {
      list = list.filter((t) => t.category && selectedCategoryIds.includes(t.category));
    }
    if (filter === "open") list = list.filter((t) => t.column_id !== "done");
    else if (filter === "done") list = list.filter((t) => t.column_id === "done");
    else if (filter === "overdue")
      list = list.filter((t) => {
        const d = t.due_at;
        if (!d || t.column_id === "done") return false;
        const p = parseISO(d);
        return isPast(p) && !isToday(p);
      });
    else if (filter === "today")
      list = list.filter((t) => {
        const d = t.due_at || t.start_at;
        return d && isToday(parseISO(d)) && t.column_id !== "done";
      });
    else if (filter === "upcoming") {
      const tomorrowStart = startOfDay(addDays(new Date(), 1));
      const upcomingEnd = addDays(tomorrowStart, UPCOMING_WINDOW_DAYS);
      list = list.filter((t) => {
        const d = t.due_at || t.start_at;
        if (!d || t.column_id === "done") return false;
        const p = parseISO(d);
        return p >= tomorrowStart && p < upcomingEnd;
      });
    }
    return list;
  }, [tasks, selectedSpaceId, filter, selectedCategoryIds]);

  const now = new Date();
  const wkStart = startOfWeek(now, { weekStartsOn: 1 });
  const wkEnd = endOfWeek(now, { weekStartsOn: 1 });

  const overdue = filteredTasks.filter((t) => {
    const d = t.due_at;
    if (!d || t.column_id === "done") return false;
    const p = parseISO(d);
    return isPast(p) && !isToday(p);
  });
  const today = filteredTasks.filter((t) => {
    const d = t.due_at || t.start_at;
    if (!d || t.column_id === "done") return false;
    return isToday(parseISO(d));
  });
  const week = filteredTasks.filter((t) => {
    const d = t.due_at || t.start_at;
    if (!d || t.column_id === "done") return false;
    const p = parseISO(d);
    if (isToday(p) || isPast(p)) return false;
    return isWithinInterval(p, { start: wkStart, end: wkEnd });
  });
  const later = filteredTasks.filter((t) => {
    if (t.column_id === "done") return false;
    const d = t.due_at || t.start_at;
    if (!d) return true;
    const p = parseISO(d);
    if (isPast(p) || isToday(p)) return false;
    return !isWithinInterval(p, { start: wkStart, end: wkEnd });
  });
  const doneTasks = filteredTasks.filter((t) => t.column_id === "done");

  const openCount = tasks.filter((t) => t.column_id !== "done").length;
  const todayCount = tasks.filter((t) => {
    const d = t.due_at || t.start_at;
    return d && isToday(parseISO(d)) && t.column_id !== "done";
  }).length;
  const overdueCount = tasks.filter((t) => {
    const d = t.due_at;
    if (!d || t.column_id === "done") return false;
    const p = parseISO(d);
    return isPast(p) && !isToday(p);
  }).length;
  const upcomingCount = useMemo(() => {
    const tomorrowStart = startOfDay(addDays(new Date(), 1));
    const upcomingEnd = addDays(tomorrowStart, UPCOMING_WINDOW_DAYS);
    return tasks.filter((t) => {
      const d = t.due_at || t.start_at;
      if (!d || t.column_id === "done") return false;
      const p = parseISO(d);
      return p >= tomorrowStart && p < upcomingEnd;
    }).length;
  }, [tasks]);

  // Spaces chips with counts
  const spaceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      const sid = (t as any).space_id;
      if (sid) counts[sid] = (counts[sid] || 0) + 1;
    }
    return spaces.map((s) => ({ space: s, count: counts[s.id] || 0 }));
  }, [tasks, spaces]);

  const dateLine = `${format(now, "EEE · MMM d")} · ${openCount} open`;

  return (
    <div
      className="md:hidden"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: PAPER,
        fontFamily: SF,
        color: INK,
        zIndex: 30,
      }}
    >
      {/* Scroller */}
      <div
        ref={scrollerRef}
        className="scrollbar-hide"
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "var(--mobile-tabbar-h, 8px)",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Greeting + inline actions */}
        <div style={{ padding: "16px 22px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div
              style={{
                fontFamily: SF,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: INK_60,
              }}
            >
              {dateLine}
            </div>
            <SpacePicker
              spaces={spaces}
              categories={categories}
              tasks={tasks as any}
              selectedSpaceId={selectedSpaceId}
              selectedCategoryIds={selectedCategoryIds}
              onSelectSpace={onSelectSpace}
              onToggleCategory={onToggleCategory}
              onClearCategories={onClearCategories}
            />
          </div>
          <h1
            style={{
              margin: "2px 0 0",
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: 38,
              lineHeight: 1.05,
              letterSpacing: -1.2,
              color: INK,
            }}
          >
            <em style={{ color: TERRACOTTA, fontWeight: 400 }}>To do.</em>
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 15,
              color: INK_60,
              lineHeight: 1.4,
              maxWidth: 320,
            }}
          >
            Everything you owe yourself. Start at the top.
          </p>
        </div>

        {/* Segmented filter */}
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              margin: "0 16px",
              background: "rgba(31,27,23,0.06)",
              borderRadius: 10,
              padding: 2,
              display: "flex",
              gap: 2,
            }}
          >
            {([
              { id: "open" as FilterId, label: "Open", count: openCount },
              { id: "overdue" as FilterId, label: "Overdue", count: overdueCount },
              { id: "today" as FilterId, label: "Today", count: todayCount },
              { id: "upcoming" as FilterId, label: "Upcoming", count: upcomingCount },
              { id: "done" as FilterId, label: "Done" },
            ]).map((it) => {
              const active = filter === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => setFilter(it.id)}
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 8,
                    border: 0,
                    background: active ? "#fff" : "transparent",
                    color: active ? INK : INK_60,
                    fontFamily: SF,
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: -0.2,
                    boxShadow: active
                      ? "0 1px 2px rgba(31,27,23,0.10), 0 0 0 0.5px rgba(31,27,23,0.04)"
                      : "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
                  {it.label}
                  {it.count !== undefined && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: active ? TERRACOTTA : INK_40,
                      }}
                    >
                      {it.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {overdue.length > 0 && <OverdueCard count={overdue.length} />}

        <Section
          label="Overdue"
          count={overdue.length}
          accent="terracotta"
          tasks={overdue}
          spaces={spaces}
          categories={categories}
          onToggle={onToggleComplete}
          onDelete={onDeleteTask}
          onEdit={onEditTask}
        />
        <Section
          label="Today"
          count={today.length}
          accent="ink"
          tasks={today}
          spaces={spaces}
          categories={categories}
          onToggle={onToggleComplete}
          onDelete={onDeleteTask}
          onEdit={onEditTask}
        />
        <Section
          label="This week"
          count={week.length}
          accent="ink"
          tasks={week}
          spaces={spaces}
          categories={categories}
          onToggle={onToggleComplete}
          onDelete={onDeleteTask}
          onEdit={onEditTask}
        />
        <Section
          label="Later"
          count={later.length}
          accent="ink"
          tasks={later}
          spaces={spaces}
          categories={categories}
          onToggle={onToggleComplete}
          onDelete={onDeleteTask}
          onEdit={onEditTask}
        />
        {filter === "done" && (
          <Section
            label="Done"
            count={doneTasks.length}
            accent="ink"
            tasks={doneTasks}
            spaces={spaces}
          categories={categories}
            onToggle={onToggleComplete}
            onDelete={onDeleteTask}
            onEdit={onEditTask}
          />
        )}

        <div style={{ textAlign: "center", padding: "32px 24px 24px" }}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: INK_60 }}>
            {openCount} things. <span style={{ color: TERRACOTTA }}>Tap + to add another.</span>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={onAddTask}
        aria-label="New task"
        style={{
          position: "absolute",
          right: 18,
          bottom: "calc(var(--mobile-tabbar-h, 24px) + 16px)",
          zIndex: 35,
          width: 56,
          height: 56,
          borderRadius: 18,
          border: 0,
          background: TERRACOTTA,
          color: "#fff",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 24px -4px rgba(198,90,62,0.55), 0 2px 6px rgba(31,27,23,0.18)",
        }}
      >
        <Plus size={26} color="#fff" strokeWidth={2.4} />
      </button>


    </div>
  );
};

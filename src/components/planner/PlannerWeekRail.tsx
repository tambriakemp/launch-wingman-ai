import { useMemo } from "react";
import { format } from "date-fns";
import type { PlannerTask } from "./PlannerTaskDialog";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";

interface Props {
  tasks: PlannerTask[]; // already filtered to visible week
  weekStart: Date;
  weekEnd: Date;
  spaces?: PlannerSpace[];
  categories?: SpaceCategory[];
  intent?: string;
}



export const PlannerWeekRail = ({ tasks, weekStart, weekEnd, spaces = [], categories = [], intent }: Props) => {
  const weekTasks = useMemo(() => {
    const startKey = format(weekStart, "yyyy-MM-dd");
    const endKey = format(weekEnd, "yyyy-MM-dd");
    return tasks.filter((t) => {
      const dStr = t.start_at || t.due_at;
      if (!dStr) return false;
      const k = dStr.slice(0, 10);
      return k >= startKey && k <= endKey;
    });
  }, [tasks, weekStart, weekEnd]);

  const total = weekTasks.length;
  const completed = weekTasks.filter((t) => t.column_id === "done").length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  const spaceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      const sid = (t as any).space_id || "__none__";
      counts[sid] = (counts[sid] || 0) + 1;
    }
    const list = spaces.map((s) => ({ space: s, count: counts[s.id] || 0 }));
    if (counts["__none__"]) {
      list.push({ space: { id: "__none__", name: "Unassigned", color: "#94a3b8" } as any, count: counts["__none__"] });
    }
    return list;
  }, [tasks, spaces]);

  const maxSpaceCount = Math.max(1, ...spaceCounts.map((x) => x.count));

  return (
    <aside className="hidden lg:flex flex-col gap-7 w-[280px] shrink-0 px-7 py-8">
      {/* Intent */}
      <section>
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
          This week is for
        </div>
        <div className="font-serif italic text-[18px] leading-snug tracking-tight text-foreground">
          {intent || "Plan your week, schedule your day."}
        </div>
      </section>

      {/* Progress */}
      <section className="bg-[hsl(var(--paper-100))] border border-[hsl(var(--border-hairline))] rounded-xl px-[18px] py-4">
        <div className="flex items-baseline justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Done this week
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {completed}/{total}
          </div>
        </div>
        <div className="mt-2.5 h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--terracotta-500))] rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <div className="font-serif italic font-medium text-[28px] leading-none text-foreground">{pct}%</div>
          <div className="text-[12px] text-muted-foreground">into the week</div>
        </div>
      </section>

      {/* Spaces */}
      {spaceCounts.length > 0 && (
        <section>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
            Spaces
          </div>
          <div className="grid gap-2.5">
            {spaceCounts.map(({ space, count }) => {
              const color = space.color || "#94a3b8";
              return (
                <div key={space.id} className="flex items-center gap-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wide whitespace-nowrap"
                    style={{ background: `${color}1f`, color: "hsl(var(--ink-900))" }}
                  >
                    <span className="w-[5px] h-[5px] rounded-full" style={{ background: color }} />
                    {space.name}
                  </span>
                  <div className="flex-1 h-1 bg-foreground/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(count / total) * 100}%`, background: color }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground min-w-[18px] text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tambra suggests (placeholder) */}
      <section className="relative overflow-hidden rounded-2xl px-5 pt-[18px] pb-5" style={{ background: "#1F1B17", color: "hsl(var(--paper-100))" }}>
        <div
          className="absolute -top-5 -right-5 w-20 h-20 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(198,90,62,0.4), transparent 70%)" }}
        />
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] mb-2 relative" style={{ color: "hsl(var(--terracotta-500))" }}>
          Tambra suggests
        </div>
        <div className="font-serif italic text-[16px] leading-snug mb-3.5 relative" style={{ color: "hsl(var(--paper-100))" }}>
          You've got two writing days back-to-back. Want me to batch the welcome emails into Tuesday?
        </div>
        <div className="flex gap-2 relative">
          <button
            className="px-3 py-1.5 rounded-full text-[11.5px] font-semibold border-0 cursor-pointer text-white"
            style={{ background: "hsl(var(--terracotta-500))" }}
          >
            Yes, do it
          </button>
          <button
            className="px-3 py-1.5 rounded-full text-[11.5px] font-medium cursor-pointer"
            style={{ background: "transparent", color: "hsl(var(--paper-100))", border: "1px solid rgba(245,239,231,0.25)" }}
          >
            Not now
          </button>
        </div>
      </section>
    </aside>
  );
};

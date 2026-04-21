import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { MoreHorizontal, Compass, Calendar, ArrowRight, Pencil, Archive, Trash2, FolderInput } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Goal, GoalTarget } from "@/pages/Goals";

interface GoalFolder {
  id: string;
  name: string;
}

interface EditorialGoalCardProps {
  goal: Goal;
  targets: GoalTarget[];
  folders: GoalFolder[];
  hero?: boolean;
  onEdit: (g: Goal) => void;
  onMoveToFolder: (goalId: string, folderId: string | null) => void;
  onArchive: (goalId: string) => void;
  onDelete: (goalId: string) => void;
}

type Tone = "clay" | "moss" | "ink" | "terracotta";

const toneStyles: Record<Tone, { bg: string; accent: string; chipBg: string; chipFg: string }> = {
  clay: {
    bg: "linear-gradient(160deg, #fff 0%, hsl(var(--clay-200)) 100%)",
    accent: "hsl(var(--terracotta-500))",
    chipBg: "rgba(198,90,62,0.08)",
    chipFg: "hsl(var(--terracotta-500))",
  },
  moss: {
    bg: "#fff",
    accent: "hsl(var(--moss-500))",
    chipBg: "hsl(var(--moss-100))",
    chipFg: "hsl(var(--moss-700))",
  },
  ink: {
    bg: "#fff",
    accent: "hsl(var(--ink-800))",
    chipBg: "rgba(31,27,23,0.06)",
    chipFg: "hsl(var(--ink-800))",
  },
  terracotta: {
    bg: "#fff",
    accent: "hsl(var(--terracotta-500))",
    chipBg: "rgba(198,90,62,0.08)",
    chipFg: "hsl(var(--terracotta-500))",
  },
};

type GoalState = "in-motion" | "planning" | "not-started" | "done";

function deriveState(targets: GoalTarget[], status: string): GoalState {
  if (status === "completed") return "done";
  if (targets.length === 0) return "planning";
  if (targets.every((t) => t.is_done)) return "done";
  const hasMotion = targets.some((t) => t.current_value > t.start_value || t.is_done);
  if (hasMotion) return "in-motion";
  return "not-started";
}

function deriveTone(state: GoalState, hero: boolean): Tone {
  if (hero) return "clay";
  if (state === "in-motion") return "moss";
  if (state === "not-started") return "terracotta";
  if (state === "done") return "moss";
  return "ink";
}

const stateLabel: Record<GoalState, string> = {
  "in-motion": "In motion",
  planning: "Planning",
  "not-started": "Not started",
  done: "Complete",
};

export function EditorialGoalCard({
  goal,
  targets,
  folders,
  hero = false,
  onEdit,
  onMoveToFolder,
  onArchive,
  onDelete,
}: EditorialGoalCardProps) {
  const navigate = useNavigate();
  const state = deriveState(targets, goal.status);
  const tone = deriveTone(state, hero);
  const t = toneStyles[tone];

  const done = targets.filter((tg) => tg.is_done).length;
  const totalRange = targets.reduce(
    (s, tg) => s + Math.max(0, tg.target_value - tg.start_value),
    0
  );
  const totalCurrent = targets.reduce(
    (s, tg) => s + Math.max(0, tg.current_value - tg.start_value),
    0
  );
  const pct =
    totalRange > 0
      ? Math.round((totalCurrent / totalRange) * 100)
      : targets.length > 0 && targets.every((tg) => tg.is_done)
      ? 100
      : 0;

  // Pulse: prefer why_statement, else next-up target
  const nextTarget = targets.find((tg) => !tg.is_done);
  const pulse =
    goal.why_statement?.trim() ||
    (nextTarget ? `Next: ${nextTarget.name}` : targets.length === 0 ? "No targets yet" : "All targets complete");

  const dueLabel = goal.target_date ? format(parseISO(goal.target_date), "MMM d") : "—";

  return (
    <div
      onClick={() => navigate(`/goals/${goal.id}`)}
      className="group relative flex cursor-pointer flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: t.bg,
        border: "1px solid hsl(var(--border-hairline))",
        borderRadius: 16,
        padding: hero ? 28 : 22,
        gridColumn: hero ? "span 2" : "auto",
        gridRow: hero ? "span 2" : "auto",
      }}
    >
      {/* Top: state chip + menu */}
      <div className="flex items-start justify-between gap-3">
        <span
          className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold"
          style={{
            padding: "3px 10px",
            background: t.chipBg,
            color: t.chipFg,
            borderRadius: 999,
            fontFamily: "var(--font-body)",
            fontSize: 11,
            letterSpacing: "0.03em",
          }}
        >
          {state === "in-motion" && (
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.accent }} />
          )}
          {stateLabel[state]}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="rounded p-1 text-[hsl(var(--fg-muted))] opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-[15px] w-[15px]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => onEdit(goal)}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            {folders.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderInput className="mr-2 h-3.5 w-3.5" /> Move to folder
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => onMoveToFolder(goal.id, null)}>
                    Unfiled
                  </DropdownMenuItem>
                  {folders.map((f) => (
                    <DropdownMenuItem key={f.id} onClick={() => onMoveToFolder(goal.id, f.id)}>
                      {f.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuItem onClick={() => onArchive(goal.id)}>
              <Archive className="mr-2 h-3.5 w-3.5" />{" "}
              {goal.status === "archived" ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(goal.id)} className="text-destructive">
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontSize: hero ? 36 : 20,
          letterSpacing: "-0.02em",
          color: "hsl(var(--ink-900))",
          marginTop: hero ? 18 : 16,
          lineHeight: 1.1,
        }}
      >
        {goal.title}
      </div>

      {/* Hero story */}
      {hero && goal.why_statement && (
        <div
          className="italic"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            lineHeight: 1.55,
            color: "hsl(var(--fg-secondary))",
            marginTop: 12,
            maxWidth: 380,
          }}
        >
          "{goal.why_statement}"
        </div>
      )}

      {/* Pulse */}
      <div
        className="flex items-center gap-1.5"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 12.5,
          color: "hsl(var(--fg-secondary))",
          marginTop: 10,
        }}
      >
        <Compass className="h-3 w-3" style={{ color: "hsl(var(--fg-muted))" }} />
        <span className="truncate">{pulse}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" style={{ minHeight: hero ? 24 : 18 }} />

      {/* Progress */}
      <div>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "hsl(var(--fg-secondary))",
              lineHeight: 1.3,
              paddingBottom: 4,
            }}
          >
            <strong style={{ color: "hsl(var(--ink-900))", fontWeight: 600 }}>{done}</strong> /{" "}
            {targets.length} targets
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: hero ? 32 : 22,
              letterSpacing: "-0.015em",
              color: t.accent,
              lineHeight: 1,
            }}
          >
            {pct}%
          </div>
        </div>
        <div
          className="relative h-1 overflow-hidden rounded-full"
          style={{ background: "hsl(var(--paper-200))" }}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
              background: t.accent,
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        className="mt-4 flex items-center justify-between border-t pt-3.5"
        style={{
          borderColor: "hsl(var(--border-hairline))",
          fontFamily: "var(--font-body)",
          fontSize: 11.5,
          color: "hsl(var(--fg-muted))",
        }}
      >
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Calendar className="h-2.5 w-2.5" /> Due {dueLabel}
        </span>
        <ArrowRight className="h-3.5 w-3.5" style={{ color: t.accent }} />
      </div>
    </div>
  );
}

interface NewGoalCardProps {
  onClick: () => void;
  folderName?: string;
}

export function NewEditorialGoalCard({ onClick, folderName }: NewGoalCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2.5 bg-transparent transition-all duration-150"
      style={{
        border: "1.5px dashed hsl(var(--border-default))",
        borderRadius: 16,
        padding: 22,
        minHeight: 280,
        color: "hsl(var(--fg-muted))",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "hsl(var(--terracotta-500))";
        e.currentTarget.style.color = "hsl(var(--terracotta-500))";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "hsl(var(--border-default))";
        e.currentTarget.style.color = "hsl(var(--fg-muted))";
      }}
    >
      <div
        className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border-[1.5px] border-dashed"
        style={{ borderColor: "currentColor" }}
      >
        <span className="text-base">+</span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontSize: 16,
          letterSpacing: "-0.01em",
          color: "hsl(var(--ink-900))",
        }}
      >
        New goal
      </div>
      <div
        className="max-w-[180px] text-center"
        style={{ fontFamily: "var(--font-body)", fontSize: 11.5, lineHeight: 1.5 }}
      >
        {folderName ? `Add another intention for ${folderName}.` : "Add another intention."}
      </div>
    </button>
  );
}

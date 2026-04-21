import { Folder, MoreHorizontal, ArrowRight, Plus, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface EditorialFolderData {
  id: string;
  name: string;
  tag?: string;
  active?: boolean;
  goals: number;
  complete: number;
  inMotion: number;
  idle: number;
  pct: number;
  note?: string | null;
  last?: string | null;
}

interface EditorialFolderCardProps {
  folder: EditorialFolderData;
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCreateGoal: () => void;
}

export function EditorialFolderCard({
  folder: f,
  onClick,
  onRename,
  onDelete,
  onCreateGoal,
}: EditorialFolderCardProps) {
  const inMotionPct = f.goals ? (f.inMotion / f.goals) * 100 : 0;
  const completePct = f.goals ? (f.complete / f.goals) * 100 : 0;

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-[18px] border border-[hsl(var(--border-hairline))] p-7 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: f.active
          ? "linear-gradient(160deg, #fff 0%, hsl(var(--clay-200)) 100%)"
          : "#fff",
      }}
    >
      {/* Top row: tag + menu */}
      <div className="flex items-start justify-between gap-4">
        <div
          className="inline-flex items-center gap-2 rounded-full px-2.5 py-[3px]"
          style={{ background: "rgba(31,27,23,0.05)" }}
        >
          <Folder
            className="h-3 w-3"
            style={{ color: f.active ? "hsl(var(--terracotta-500))" : "hsl(var(--fg-muted))" }}
          />
          <span
            className="font-semibold uppercase"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              letterSpacing: "0.08em",
              color: "hsl(var(--fg-secondary))",
            }}
          >
            {f.tag || f.name.match(/^\d{4}/)?.[0] || "Folder"}
          </span>
          {f.active && (
            <span
              className="h-[5px] w-[5px] rounded-full"
              style={{ background: "hsl(var(--terracotta-500))" }}
            />
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-[hsl(var(--fg-muted))] opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateGoal(); }}>
              <Plus className="mr-2 h-3.5 w-3.5" /> New Goal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(); }}>
              <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title */}
      <div
        className="mt-5"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 400,
          fontSize: 34,
          letterSpacing: "-0.02em",
          color: "hsl(var(--ink-900))",
          lineHeight: 1.05,
        }}
      >
        {f.name}
      </div>

      {/* Note */}
      {f.note && (
        <div
          className="mt-2.5 max-w-[280px] italic"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            lineHeight: 1.5,
            color: "hsl(var(--fg-secondary))",
          }}
        >
          "{f.note}"
        </div>
      )}

      {/* Pacing */}
      <div className="mt-6">
        <div className="mb-2.5 flex items-end justify-between gap-2">
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: 22,
              letterSpacing: "-0.015em",
              color: "hsl(var(--ink-900))",
              lineHeight: 1,
            }}
          >
            {f.goals}{" "}
            <span
              style={{
                fontSize: 13,
                color: "hsl(var(--fg-muted))",
                fontFamily: "var(--font-body)",
              }}
            >
              goal{f.goals === 1 ? "" : "s"}
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "hsl(var(--fg-muted))",
            }}
          >
            {f.pct}%
          </div>
        </div>
        <div
          className="flex h-[5px] gap-[2px] overflow-hidden rounded-full"
          style={{ background: "hsl(var(--paper-200))" }}
        >
          {f.complete > 0 && (
            <div
              style={{ width: `${completePct}%`, background: "hsl(var(--moss-500))" }}
            />
          )}
          {f.inMotion > 0 && (
            <div
              style={{ width: `${inMotionPct}%`, background: "hsl(var(--terracotta-500))" }}
            />
          )}
        </div>
        <div
          className="mt-3 flex flex-wrap gap-3.5"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 11.5,
            color: "hsl(var(--fg-secondary))",
          }}
        >
          {f.complete > 0 && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "hsl(var(--moss-500))" }}
              />
              {f.complete} complete
            </span>
          )}
          {f.inMotion > 0 && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "hsl(var(--terracotta-500))" }}
              />
              {f.inMotion} in motion
            </span>
          )}
          {f.idle > 0 && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span
                className="h-1.5 w-1.5 rounded-full border"
                style={{
                  background: "hsl(var(--paper-200))",
                  borderColor: "hsl(var(--border-default))",
                }}
              />
              {f.idle} not started
            </span>
          )}
          {f.goals === 0 && <span className="text-[hsl(var(--fg-muted))]">Empty folder</span>}
        </div>
      </div>

      {/* Footer */}
      <div
        className="mt-5 flex items-center justify-between border-t pt-4"
        style={{
          borderColor: "hsl(var(--border-hairline))",
          fontFamily: "var(--font-body)",
          fontSize: 11.5,
          color: "hsl(var(--fg-muted))",
        }}
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {f.last || "—"}
        </span>
        <ArrowRight
          className="h-3.5 w-3.5 flex-shrink-0"
          style={{ color: f.active ? "hsl(var(--terracotta-500))" : "hsl(var(--fg-muted))" }}
        />
      </div>
    </div>
  );
}

interface NewEditorialFolderCardProps {
  onClick: () => void;
}

export function NewEditorialFolderCard({ onClick }: NewEditorialFolderCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex min-h-[340px] flex-col items-center justify-center gap-3 rounded-[18px] border-[1.5px] border-dashed bg-transparent p-7 transition-colors duration-150"
      style={{ borderColor: "hsl(var(--border-default))", color: "hsl(var(--fg-muted))" }}
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
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-dashed"
        style={{ borderColor: "currentColor" }}
      >
        <Plus className="h-[18px] w-[18px]" />
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontSize: 18,
          letterSpacing: "-0.01em",
          color: "hsl(var(--ink-900))",
        }}
      >
        New folder
      </div>
      <div
        className="max-w-[180px] text-center"
        style={{ fontFamily: "var(--font-body)", fontSize: 12, lineHeight: 1.5 }}
      >
        Group goals by year, theme, or season.
      </div>
    </button>
  );
}

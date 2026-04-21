import { ReactNode, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskEngine } from "@/hooks/useTaskEngine";
import { PHASE_LABELS, PHASES, type Phase } from "@/types/tasks";

const PHASE_SUMMARIES: Record<string, string> = {
  Setup: "Pick the shape of the thing you're launching.",
  Planning: "Clarify who this is for and why it works.",
  Messaging: "Turn what you know into language people feel.",
  Build: "Put the pieces in place — calmly, one by one.",
  Content: "The pieces that bring the launch into the world.",
  "Pre-Launch": "Warm the room before you open the doors.",
  Launch: "Ship it. Then take an afternoon off.",
  "Post-Launch": "Reflect, refine, and rest before the next one.",
};

const QUIET_REMINDERS = [
  "Imperfect and shipped beats perfect and stuck.",
  "You don't have to finish today. You just have to begin.",
  "One quiet step is still forward motion.",
];

export interface EditorialTaskShellProps {
  projectId: string;
  taskId: string;
  phase: Phase;
  title: string;
  whyItMatters: string;
  instructions?: string[];
  estimatedTimeRange: string;
  /** Optional eyebrow slot rendered to the right of the time chip (e.g. autosave indicator, Learn more). */
  headerActions?: ReactNode;
  /** Optional voice snippet button rendered next to the "Why this matters" eyebrow. */
  voiceButton?: ReactNode;
  /** Custom middle content — the page-specific UI. */
  children: ReactNode;
  /** Footer action bar (Save & Complete, Save for Later, etc.). Replaces the default if provided. */
  footer?: ReactNode;
}

/**
 * Shared editorial layout for Launch Task pages.
 * Matches the design used by TaskDetail.tsx so all task pages feel identical.
 */
export function EditorialTaskShell({
  projectId,
  taskId,
  phase,
  title,
  whyItMatters,
  instructions,
  estimatedTimeRange,
  headerActions,
  voiceButton,
  children,
  footer,
}: EditorialTaskShellProps) {
  const { getTaskTemplate, projectTasks, nextBestTask } = useTaskEngine({
    projectId,
  });

  const phaseLabel = PHASE_LABELS[phase] || phase;
  const phaseNumber = PHASES.indexOf(phase) + 1;
  const phaseSummary = PHASE_SUMMARIES[phaseLabel] || "";

  const siblingTasks = useMemo(() => {
    return projectTasks
      .map((pt) => ({ pt, tmpl: getTaskTemplate(pt.taskId) }))
      .filter((x) => x.tmpl?.phase === phase)
      .map((x) => ({
        taskId: x.pt.taskId,
        title: x.tmpl?.title || x.pt.taskId,
        status: x.pt.status,
      }));
  }, [projectTasks, getTaskTemplate, phase]);

  const phaseCompleted = siblingTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const phaseTotal = siblingTasks.length;
  const phaseProgressPct =
    phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;

  const reminderIndex = taskId
    ? taskId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) %
      QUIET_REMINDERS.length
    : 0;
  const quietReminder = QUIET_REMINDERS[reminderIndex];

  return (
    <div className="min-h-screen bg-paper-100">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-10 pt-7 pb-20">
        {/* Back link */}
        <Link
          to={`/projects/${projectId}/tasks`}
          className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Launch Tasks
        </Link>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-12">
          <div className="min-w-0">
            {/* Hero */}
            <div className="mt-5 mb-9">
              <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-clay-200 text-terracotta text-[11px] font-semibold tracking-[0.08em] uppercase">
                  {phaseLabel}
                </span>
                <span className="font-mono text-[12px] text-fg-muted inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {estimatedTimeRange}
                </span>
                {headerActions}
              </div>
              <h1 className="font-display-hero text-[32px] sm:text-[44px] md:text-[48px] font-normal leading-[1.05] tracking-[-0.025em] text-ink-900 m-0">
                {title}
              </h1>
            </div>

            {/* Why this matters */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-3.5">
                <span className="editorial-eyebrow">Why this matters</span>
                {voiceButton}
              </div>
              <p className="font-display text-[18px] sm:text-[20px] leading-[1.5] tracking-[-0.005em] text-ink-900 font-normal m-0">
                {whyItMatters}
              </p>
            </section>

            {/* What to do */}
            {instructions && instructions.length > 0 && (
              <section className="mb-10">
                <div className="editorial-eyebrow mb-3.5">What to do</div>
                <ol className="grid gap-3 m-0 p-0 list-none">
                  {instructions.map((instruction, index) => (
                    <li
                      key={index}
                      className="grid grid-cols-[28px_1fr] gap-3.5 items-baseline"
                    >
                      <span className="font-display italic font-normal text-[22px] text-terracotta tracking-[-0.02em] leading-none">
                        {index + 1}
                      </span>
                      <span className="text-[15px] leading-[1.6] text-ink-800">
                        {instruction}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <div className="h-px bg-hairline mb-10" />

            {/* Page-specific content */}
            <section className="mb-10">{children}</section>

            {/* Footer actions */}
            {footer && <div className="pt-4 border-t border-hairline">{footer}</div>}
          </div>

          {/* ===== Side rail (desktop) ===== */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-6">
              {/* Phase progress strip */}
              <div className="rounded-2xl border border-hairline bg-white p-5">
                <div className="editorial-eyebrow mb-2">
                  Phase {phaseNumber} · {phaseLabel}
                </div>
                {phaseSummary && (
                  <div className="font-display italic text-[14px] leading-snug text-ink-800 mb-4">
                    {phaseSummary}
                  </div>
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11.5px] text-fg-muted">
                    {phaseCompleted}/{phaseTotal}
                  </span>
                  <span className="font-mono text-[11.5px] text-fg-muted">
                    {phaseProgressPct}%
                  </span>
                </div>
                <div className="h-px w-full bg-hairline relative overflow-hidden mb-4">
                  <div
                    className="absolute inset-y-0 left-0 bg-terracotta"
                    style={{ width: `${phaseProgressPct}%`, height: "1px" }}
                  />
                </div>
                <ul className="space-y-2">
                  {siblingTasks.map((s) => {
                    const isCurrent = s.taskId === taskId;
                    const isDone = s.status === "completed";
                    return (
                      <li
                        key={s.taskId}
                        className="flex items-start gap-2 text-[12.5px] leading-snug"
                      >
                        <span className="mt-0.5 w-3.5 inline-flex justify-center shrink-0">
                          {isDone ? (
                            <Check className="w-3 h-3 text-terracotta" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-ink-300 inline-block" />
                          )}
                        </span>
                        <span
                          className={cn(
                            "min-w-0",
                            isCurrent
                              ? "text-ink-900 font-semibold"
                              : isDone
                                ? "text-fg-muted"
                                : "text-ink-800",
                          )}
                        >
                          {s.title}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Up next card */}
              {nextBestTask && nextBestTask.taskId !== taskId && (
                <div className="rounded-2xl border border-hairline bg-white p-5">
                  <div className="editorial-eyebrow mb-2">Up next</div>
                  <Link
                    to={nextBestTask.route}
                    className="block font-display text-[18px] leading-snug text-ink-900 tracking-[-0.01em] hover:text-terracotta transition-colors"
                  >
                    {nextBestTask.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="font-mono text-[11.5px] text-fg-muted inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {nextBestTask.estimatedTimeRange}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-clay-100 text-terracotta text-[10.5px] font-semibold tracking-[0.08em] uppercase">
                      {PHASE_LABELS[nextBestTask.phase] || nextBestTask.phase}
                    </span>
                  </div>
                  <Link
                    to={nextBestTask.route}
                    className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-terracotta hover:underline"
                  >
                    Open <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {/* Quiet reminder */}
              <div className="rounded-2xl bg-ink-900 text-paper-100 p-5">
                <p className="font-display italic text-[14.5px] leading-snug">
                  "Work one quiet step at a time."
                </p>
                <div className="my-3 h-px w-10 bg-terracotta" />
                <p className="font-sans text-[12.5px] text-paper-100/75 leading-relaxed">
                  {quietReminder}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Search, Download } from "lucide-react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { ExportSnapshotButton } from "@/components/phase-snapshot/ExportSnapshotButton";
import { usePhaseSnapshot, type SummaryBlock } from "@/hooks/usePhaseSnapshot";
import { useProjectSummary } from "@/hooks/useProjectSummary";
import { Phase, PHASE_LABELS } from "@/types/tasks";
import { PageLoader } from "@/components/ui/page-loader";
import { cn } from "@/lib/utils";

// ─── Phase accent colors (terracotta / plum / moss / amber rotation) ─────
const PHASE_ACCENTS: Record<Phase, string> = {
  setup: "hsl(var(--terracotta-500))",
  planning: "hsl(290 38% 36%)", // plum
  messaging: "hsl(var(--moss-500))",
  build: "hsl(38 70% 47%)", // amber
  content: "hsl(var(--terracotta-500))",
  "pre-launch": "hsl(290 38% 36%)",
  launch: "hsl(var(--moss-500))",
  "post-launch": "hsl(38 70% 47%)",
};

interface BriefTask {
  id: string;
  n: number;
  topic: Phase;
  title: string;
  short: string;
  long: boolean;
  status: "done" | "in-progress" | "empty";
  answer: string;
  featured: boolean;
  taskRoute: string;
}

interface BriefTopic {
  id: Phase;
  label: string;
  accent: string;
  items: BriefTask[];
  done: number;
  total: number;
}

// Convert a SummaryBlock + structured content into a readable answer string
function blockToAnswer(block: SummaryBlock): string {
  const items = block.structuredContent?.items || [];
  if (block.fullContent && block.fullContent.length > 0) {
    return block.fullContent;
  }
  return items.map(i => (i.label ? `${i.label}: ${i.value}` : i.value)).join("\n");
}

function blockToShort(block: SummaryBlock): string {
  if (block.bullets.length > 0) return block.bullets[0];
  const items = block.structuredContent?.items || [];
  if (items.length > 0) return items[0].value;
  return "";
}

export default function PhaseSnapshot() {
  const { id } = useParams();
  const { data: phases, isLoading, error } = usePhaseSnapshot(id);
  const { data: summary } = useProjectSummary(id);

  // Build editorial topic structure from phases
  const { topics, totalTasks, completedTasks } = useMemo(() => {
    if (!phases) return { topics: [] as BriefTopic[], totalTasks: 0, completedTasks: 0 };

    let runningN = 0;
    const builtTopics: BriefTopic[] = phases
      .filter(p => p.blocks.length > 0)
      .map((p) => {
        const items: BriefTask[] = p.blocks.map((b, i) => {
          runningN += 1;
          const answer = blockToAnswer(b);
          const short = blockToShort(b);
          return {
            id: b.id,
            n: runningN,
            topic: p.phase,
            title: b.label,
            short,
            long: answer.length > 300,
            status: "done" as const,
            answer,
            featured: i === 0 && answer.length > 100,
            taskRoute: b.taskRoute,
          };
        });
        return {
          id: p.phase,
          label: p.phaseLabel,
          accent: PHASE_ACCENTS[p.phase] || "hsl(var(--terracotta-500))",
          items,
          done: items.length,
          total: items.length,
        };
      });

    const total = builtTopics.reduce((s, t) => s + t.total, 0);
    const done = builtTopics.reduce((s, t) => s + t.done, 0);
    return { topics: builtTopics, totalTasks: total, completedTasks: done };
  }, [phases]);

  const projectName = summary?.projectName || "Your Launch";
  const tagline = summary?.transformationStatement || "A launch in motion.";
  const lastUpdated = summary?.projectUpdatedAt
    ? new Date(summary.projectUpdatedAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Launch date / days remaining
  const launchDateRaw = summary?.launchWindow?.enrollmentOpens || null;
  const launchDate = launchDateRaw
    ? new Date(launchDateRaw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "TBD";
  const daysToLaunch = launchDateRaw
    ? Math.max(0, Math.ceil((new Date(launchDateRaw).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="bg-paper-100 min-h-screen">
          <div className="max-w-[1280px] mx-auto px-10 py-24">
            <PageLoader />
          </div>
        </div>
      </ProjectLayout>
    );
  }

  if (error || !phases) {
    return (
      <ProjectLayout>
        <div className="bg-paper-100 min-h-screen">
          <div className="max-w-[1280px] mx-auto px-10 py-24 text-center">
            <p className="text-fg-muted font-body">Unable to load launch brief.</p>
          </div>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="bg-paper-100 min-h-screen">
        {/* ───── COVER ───── */}
        <BCover
          projectName={projectName}
          tagline={tagline}
          owner={summary?.projectName ? "Author" : "—"}
          lastUpdated={lastUpdated}
          launchDate={launchDate}
          daysToLaunch={daysToLaunch}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
          pct={pct}
          topics={topics}
          phases={phases}
        />

        {/* ───── BODY: Sticky TOC + Content ───── */}
        <div className="max-w-[1280px] mx-auto px-10 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-16">
          <BSideTOC
            topics={topics}
            completedTasks={completedTasks}
            totalTasks={totalTasks}
            pct={pct}
            daysToLaunch={daysToLaunch}
          />

          <main className="py-16 lg:py-24 pb-24">
            <BLede projectName={projectName} />

            {topics.map((tp, i) => (
              <BTopicSection key={tp.id} topic={tp} index={i} />
            ))}

            <BClosingNote />
          </main>
        </div>

        {/* ───── FOOTER ───── */}
        <footer className="border-t border-[hsl(var(--border-hairline))] py-7 px-20 max-w-[1280px] mx-auto flex justify-between items-center font-body text-[11px] tracking-[0.2em] uppercase text-fg-muted font-semibold">
          <span>Launchely · The Launch Brief</span>
          <span className="hidden md:inline">{projectName}</span>
          <span>Printed {lastUpdated}</span>
        </footer>
      </div>
    </ProjectLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// COVER
// ─────────────────────────────────────────────────────────────────────────
interface BCoverProps {
  projectName: string;
  tagline: string;
  owner: string;
  lastUpdated: string;
  launchDate: string;
  daysToLaunch: number | null;
  completedTasks: number;
  totalTasks: number;
  pct: number;
  topics: BriefTopic[];
  phases: ReturnType<typeof usePhaseSnapshot>["data"];
}

function BCover({
  projectName, tagline, lastUpdated, launchDate, daysToLaunch,
  completedTasks, totalTasks, pct, topics, phases,
}: BCoverProps) {
  // Split projectName onto two lines if multi-word, like "Quiet Hours"
  const words = projectName.trim().split(" ");
  const firstLine = words.length > 1 ? words.slice(0, -1).join(" ") : projectName;
  const lastWord = words.length > 1 ? words[words.length - 1] : "";

  return (
    <div className="relative overflow-hidden bg-paper-200 border-b border-[hsl(var(--border-hairline))]">
      {/* editorial border rule */}
      <div
        className="absolute pointer-events-none rounded-sm hidden md:block"
        style={{ inset: "28px 40px", border: "1px solid hsl(var(--ink-900) / 0.08)" }}
      />

      <div className="max-w-[1280px] mx-auto relative px-6 pt-8 pb-10 md:px-20 md:pt-12 md:pb-[60px]">
        {/* top masthead */}
        <div className="flex justify-between items-center border-b border-[hsl(var(--ink-900)/0.12)] pb-[14px] mb-10 md:mb-[60px] font-body text-[11px] tracking-[0.2em] uppercase font-semibold gap-4" style={{ color: "hsl(var(--ink-800))" }}>
          <span className="inline-flex items-center gap-2.5">
            <span className="w-2 h-2 bg-terracotta-500 rounded-full" />
            The Launch Brief
          </span>
          <span className="hidden md:inline">Volume I · Issue 01</span>
          <span className="truncate">{lastUpdated}</span>
        </div>

        {/* Big cover */}
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-10 md:gap-20 items-end">
          <div>
            <div className="font-body text-[13px] tracking-[0.2em] uppercase text-terracotta-500 font-semibold mb-6">
              The brief for —
            </div>
            <h1
              className="font-display font-light text-[64px] sm:text-[96px] md:text-[140px] leading-[0.92] tracking-[-0.04em] m-0 text-ink-900"
              style={{ fontVariationSettings: '"opsz" 144' }}
            >
              {lastWord ? (
                <>
                  {firstLine}<br />
                  <span className="italic font-light text-terracotta-500">{lastWord}.</span>
                </>
              ) : (
                <>
                  {projectName}<span className="italic font-light text-terracotta-500">.</span>
                </>
              )}
            </h1>
            <p className="font-display italic font-light text-[22px] md:text-[30px] leading-[1.2] mt-9 max-w-[560px] tracking-[-0.01em]" style={{ color: "hsl(var(--ink-800))" }}>
              {tagline}
            </p>
          </div>

          {/* Cover info column */}
          <div className="md:pl-12 md:border-l border-[hsl(var(--ink-900)/0.1)]">
            <BCoverMeta label="Project" value={projectName} />
            <BCoverMeta label="Launch date" value={launchDate} big />
            {daysToLaunch !== null && (
              <BCoverMeta label="Days remaining" value={`${daysToLaunch}`} accent />
            )}
            <BCoverMeta
              label="Prompts answered"
              value={`${completedTasks} of ${totalTasks} · ${pct}%`}
            />

            {phases && (
              <div className="mt-7">
                <ExportSnapshotButton phases={phases} projectName={projectName} />
              </div>
            )}
          </div>
        </div>

        {/* Contents stripe */}
        {topics.length > 0 && (
          <div className="mt-12 md:mt-[72px] pt-7 border-t border-[hsl(var(--ink-900)/0.12)] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {topics.map((tp, i) => (
              <a key={tp.id} href={`#b-topic-${tp.id}`} className="no-underline text-inherit group">
                <div className="font-mono text-[11px] text-fg-muted mb-1">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="font-display text-[17px] font-medium text-ink-900 tracking-[-0.01em] leading-[1.15] group-hover:text-terracotta-500 transition-colors">
                  {tp.label}
                </div>
                <div className="font-body text-[11px] text-fg-muted mt-1">
                  {tp.done}/{tp.total}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BCoverMeta({
  label, value, big, accent,
}: { label: string; value: string; big?: boolean; accent?: boolean }) {
  return (
    <div className="mb-4.5" style={{ marginBottom: 18 }}>
      <div className="font-body text-[10px] tracking-[0.22em] uppercase text-fg-muted font-semibold mb-[3px]">
        {label}
      </div>
      <div
        className={cn(
          "font-display font-normal tracking-[-0.015em] leading-[1.15]",
          big ? "text-[28px]" : "text-[20px]",
          accent ? "text-terracotta-500" : "text-ink-900"
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SIDE TOC
// ─────────────────────────────────────────────────────────────────────────
function BSideTOC({
  topics, completedTasks, totalTasks, pct, daysToLaunch,
}: {
  topics: BriefTopic[]; completedTasks: number; totalTasks: number; pct: number; daysToLaunch: number | null;
}) {
  return (
    <aside className="hidden lg:block py-12">
      <div className="sticky top-8">
        <div className="font-body text-[11px] tracking-[0.22em] uppercase text-fg-muted font-semibold mb-5">
          Contents
        </div>

        {/* mini progress */}
        <div className="mb-7 px-4 py-3.5 bg-white border border-[hsl(var(--border-hairline))] rounded-[10px]">
          <div className="flex justify-between items-baseline mb-2">
            <span className="font-body text-[12px] font-semibold text-ink-900">Progress</span>
            <span className="font-mono text-[11px] text-fg-muted">
              {completedTasks}/{totalTasks}
            </span>
          </div>
          <div className="h-1 bg-[hsl(var(--clay-100))] rounded overflow-hidden">
            <div
              className="h-full bg-terracotta-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {daysToLaunch !== null && (
            <div className="mt-2.5 font-body text-[11.5px] text-fg-muted">
              {daysToLaunch} days to launch
            </div>
          )}
        </div>

        {/* topic list */}
        <nav className="flex flex-col gap-0.5">
          {topics.map((tp, i) => {
            const complete = tp.done === tp.total;
            return (
              <a
                key={tp.id}
                href={`#b-topic-${tp.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg no-underline text-ink-800 font-body text-[14px] hover:bg-paper-200 transition-colors"
              >
                <span className="font-mono text-[11px] text-fg-muted min-w-[22px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-medium">{tp.label}</span>
                <span
                  className={cn(
                    "font-mono text-[11px] font-semibold",
                    complete ? "text-moss-500" : "text-fg-muted"
                  )}
                >
                  {complete ? "✓" : `${tp.done}/${tp.total}`}
                </span>
              </a>
            );
          })}
        </nav>

        {/* search hint */}
        <div className="mt-7 px-3.5 py-2.5 rounded-[10px] border border-dashed border-[hsl(var(--border-hairline))] flex items-center gap-2.5 font-body text-[12.5px] text-fg-muted">
          <Search className="w-3.5 h-3.5" />
          <span>Search all answers…</span>
          <span className="ml-auto font-mono text-[10px] px-1.5 py-0.5 bg-[hsl(var(--clay-100))] rounded">
            ⌘K
          </span>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LEDE
// ─────────────────────────────────────────────────────────────────────────
function BLede({ projectName }: { projectName: string }) {
  const firstLetter = projectName.trim().charAt(0).toUpperCase() || "Q";
  const rest = projectName.trim().slice(1);

  return (
    <section className="mb-24 pb-14 border-b border-[hsl(var(--border-hairline))]">
      <div className="font-body text-[11px] tracking-[0.22em] uppercase text-terracotta-500 font-semibold mb-5">
        Editor's note
      </div>
      <p
        className="font-display font-light text-[28px] md:text-[34px] leading-[1.28] tracking-[-0.01em] text-ink-900 m-0 max-w-[52ch]"
      >
        <span
          className="font-display font-medium float-left mr-3.5 mt-1 text-terracotta-500 leading-[0.9] tracking-[-0.04em]"
          style={{ fontSize: 88 }}
        >
          {firstLetter}
        </span>
        {rest || "uiet Hours"} is built on a single conviction: that careful work deserves
        careful structure. This brief captures every decision, every response, every rough
        edge of a launch still in motion.
      </p>
      <p className="font-body text-[15px] text-fg-muted mt-10 italic">
        A living document — updated as the work progresses.
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TOPIC SECTION
// ─────────────────────────────────────────────────────────────────────────
function BTopicSection({ topic, index }: { topic: BriefTopic; index: number }) {
  const featured = topic.items.find(t => t.featured);
  const rest = topic.items.filter(t => !t.featured);

  return (
    <section id={`b-topic-${topic.id}`} className="mb-22" style={{ marginBottom: 88 }}>
      {/* Topic header */}
      <header className="mb-10">
        <div className="flex items-baseline gap-4 mb-4">
          <span
            className="font-mono text-[13px] font-medium"
            style={{ color: topic.accent }}
          >
            § {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex-1 h-px bg-[hsl(var(--border-hairline))]" />
          <span className="font-body text-[11px] tracking-[0.22em] uppercase text-fg-muted font-semibold">
            {topic.done} of {topic.total} complete
          </span>
        </div>
        <h2
          className="font-display font-normal text-[48px] md:text-[72px] leading-none tracking-[-0.03em] m-0 text-ink-900"
          style={{ fontVariationSettings: '"opsz" 96' }}
        >
          {topic.label}
          <span style={{ color: topic.accent }}>.</span>
        </h2>
      </header>

      {featured && <BFeaturedAnswer t={featured} accent={topic.accent} />}

      <div className="flex flex-col gap-1">
        {rest.map(t => (
          <BAnswerRow key={t.id} t={t} accent={topic.accent} />
        ))}
      </div>
    </section>
  );
}

function BFeaturedAnswer({ t, accent }: { t: BriefTask; accent: string }) {
  return (
    <article
      className="mb-8 py-7"
      style={{
        borderTop: `2px solid ${accent}`,
        borderBottom: "1px solid hsl(var(--border-hairline))",
      }}
    >
      <div
        className={cn(
          "grid gap-8 md:gap-12 items-start",
          t.long ? "grid-cols-1" : "grid-cols-1 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
        )}
      >
        {/* Headline */}
        <div>
          <div className="flex items-center gap-3 mb-3.5 font-body text-[11px] tracking-[0.22em] uppercase text-fg-muted font-semibold">
            <span>Featured response · No. {String(t.n).padStart(2, "0")}</span>
            <StatusChip status={t.status} />
          </div>
          <h3
            className={cn(
              "font-display font-normal leading-[1.08] tracking-[-0.02em] m-0 text-ink-900",
              t.long ? "text-[32px] md:text-[40px]" : "text-[26px] md:text-[34px]"
            )}
            style={{ fontVariationSettings: '"opsz" 72' }}
          >
            {t.title}
          </h3>
          {t.short && (
            <p
              className="font-display italic font-light text-[22px] leading-[1.35] mt-4.5 tracking-[-0.005em]"
              style={{ color: accent, marginTop: 18 }}
            >
              "{t.short}"
            </p>
          )}
        </div>

        {/* Body */}
        {t.answer && (
          <div
            className={cn(
              "min-w-0 overflow-hidden font-body text-[15.5px] leading-[1.7] text-ink-800 whitespace-pre-line tracking-[-0.003em]",
              t.long && "md:columns-2 md:gap-8"
            )}
          >
            {t.answer}
          </div>
        )}
      </div>
    </article>
  );
}

function BAnswerRow({ t, accent }: { t: BriefTask; accent: string }) {
  const isEmpty = t.status === "empty";
  return (
    <article
      className={cn(
        "py-5 border-b border-[hsl(var(--border-hairline))]",
        isEmpty && "opacity-50"
      )}
    >
      <div className="grid grid-cols-[40px_1fr_auto] md:grid-cols-[60px_1fr_auto] gap-4 md:gap-6 items-baseline">
        <span className="font-mono text-[12px] text-fg-muted font-medium pt-0.5">
          {String(t.n).padStart(2, "0")}
        </span>
        <div>
          <h4 className="font-display font-medium text-[18px] md:text-[22px] leading-[1.2] tracking-[-0.015em] m-0 text-ink-900">
            {t.title}
          </h4>
          {t.short && !isEmpty && (
            <p className="font-body text-[15px] leading-[1.55] text-ink-800 mt-2 max-w-[62ch]">
              {t.short}
            </p>
          )}
          {t.answer && !t.long && t.answer !== t.short && (
            <p className="font-body text-[14px] leading-[1.65] text-fg-muted mt-2.5 max-w-[68ch] whitespace-pre-line">
              {t.answer}
            </p>
          )}
        </div>
        <StatusChip status={t.status} />
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CLOSING NOTE
// ─────────────────────────────────────────────────────────────────────────
function BClosingNote() {
  return (
    <section className="mt-24 px-12 py-12 bg-ink-900 text-paper-100 rounded-sm relative overflow-hidden">
      <div className="font-body text-[11px] tracking-[0.22em] uppercase font-semibold mb-5" style={{ color: "hsl(13 56% 70%)" }}>
        Appendix · Closing note
      </div>
      <p
        className="font-display font-light italic text-[24px] md:text-[32px] leading-[1.3] tracking-[-0.01em] m-0 max-w-[28ch]"
        style={{ color: "hsl(var(--paper-100))" }}
      >
        A brief is a promise to your future self. Re-read this on launch day.
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STATUS CHIP
// ─────────────────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: "done" | "in-progress" | "empty" }) {
  const cfg = {
    done: { bg: "hsl(var(--moss-100))", fg: "hsl(var(--moss-700))", label: "Complete" },
    "in-progress": { bg: "hsl(var(--clay-100))", fg: "hsl(var(--terracotta-600))", label: "In progress" },
    empty: { bg: "hsl(var(--ink-900) / 0.06)", fg: "hsl(var(--fg-muted))", label: "Not started" },
  }[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full font-body text-[11px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.fg }} />
      {cfg.label}
    </span>
  );
}

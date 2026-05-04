import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookMarked,
  Search,
  Book,
  Check,
  Bookmark,
  MoreHorizontal,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { usePlaybookData, PatternInsight } from "@/hooks/usePlaybookData";
import { PageLoader } from "@/components/ui/page-loader";

// ————— Constants —————

const PHASE_WISDOM: Record<string, { tip: string; source: string }[]> = {
  setup: [
    { tip: "Choosing your launch path early prevents scope creep.", source: "On getting started" },
    { tip: "Most creators who struggle never made a clear decision about how they'd sell.", source: "On clarity" },
  ],
  planning: [
    { tip: "The more specific your audience, the easier every other decision becomes.", source: "On audience clarity" },
    { tip: "You don't need your offer fully built to start planning.", source: "On sequencing" },
    { tip: "Most launches fail in planning — not execution.", source: "On foundations" },
    { tip: "Specifics convert. Adjectives don't.", source: "Field note" },
  ],
  messaging: [
    { tip: "A messy first draft beats a polished outline.", source: "Field note" },
    { tip: "Show the offer before you sell the offer.", source: "Field note" },
    { tip: "The headline is a promise — keep it.", source: "Field note" },
    { tip: "Specifics convert. Adjectives don't.", source: "Field note" },
  ],
  build: [
    { tip: "A simple page that explains the offer, audience, and next step beats a complex one.", source: "On simplicity" },
    { tip: "Test every link the night before you launch.", source: "On tech" },
    { tip: "Your delivery mechanism is a trust signal.", source: "On delivery" },
  ],
  content: [
    { tip: "Content that teaches builds more trust than content that sells.", source: "On content strategy" },
    { tip: "You don't need 30 pieces. You need 5–7 that each do one job.", source: "On volume" },
    { tip: "The best pre-launch content makes people feel understood.", source: "On connection" },
  ],
  "pre-launch": [
    { tip: "Repetition isn't annoying — it's necessary.", source: "On warming up" },
    { tip: "Share one small signal before you launch.", source: "On preparation" },
    { tip: "If you only do one thing in pre-launch, test your tech.", source: "On testing" },
  ],
  launch: [
    { tip: "Most sales happen on the last day. Send the close email.", source: "On close day" },
    { tip: "DMs are often your warmest leads. Answer personally.", source: "On DMs" },
    { tip: "Don't interpret early silence as failure.", source: "On patience" },
  ],
  "post-launch": [
    { tip: "What you learned matters more than the revenue number.", source: "On reflection" },
    { tip: "Follow up with people who showed interest but didn't buy.", source: "On follow-up" },
    { tip: "Every launch teaches you something the next can use.", source: "On learning" },
  ],
};

const PHASES_ORDERED = [
  { id: "planning", num: "01", title: "Planning", weeks: "W 1" },
  { id: "messaging", num: "02", title: "Messaging", weeks: "W 2" },
  { id: "build", num: "03", title: "Build", weeks: "W 3–4" },
  { id: "content", num: "04", title: "Content", weeks: "W 5" },
  { id: "pre-launch", num: "05", title: "Pre-launch", weeks: "W 6" },
  { id: "launch", num: "06", title: "Launch", weeks: "W 7" },
];

const CATEGORY_TAGS: Record<PatternInsight["category"], string> = {
  messaging: "On voice",
  launch_path: "On launch path",
  content: "On content",
  offer: "On offer",
  general: "On rhythm",
};

const CATEGORY_META: Record<PatternInsight["category"], string> = {
  messaging: "Synthesized from your drafts",
  launch_path: "Tied to your funnel choice",
  content: "From your content themes",
  offer: "From your offer brief",
  general: "Across your projects",
};

// Split insight text into headline + body (first sentence vs rest)
function splitInsight(text: string): { headline: string; body: string } {
  const match = text.match(/^([^.!?]+[.!?])\s*(.*)$/);
  if (match && match[2]) return { headline: match[1].trim(), body: match[2].trim() };
  return { headline: text, body: "" };
}

// ————— Reusable bits —————

const TERRA = "hsl(var(--terracotta-500))";
const INK = "hsl(var(--ink-900))";
const PAPER = "hsl(var(--paper-100))";
const HAIR = "hsl(var(--border-hairline))";
const FG_MUTED = "hsl(var(--fg-muted))";
const FG_SECONDARY = "hsl(var(--fg-secondary))";

function Eyebrow({ children, color = TERRA }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-body)",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

// ————— Desktop —————

function DesktopPlaybook({
  insights,
  currentPhase,
  phaseLabel,
  pattern,
  helpsNow,
  upNext,
}: {
  insights: { n: string; tag: string; headline: string; body: string; meta: string }[];
  currentPhase: string;
  phaseLabel: string;
  pattern: { quote: string; meta: string };
  helpsNow: { tip: string; source: string }[];
  upNext: { num: string; title: string; count: number } | null;
}) {
  const featured = insights[0];
  const numbered = insights.slice(1);

  const chapters = PHASES_ORDERED.map((p) => {
    const activeIdx = PHASES_ORDERED.findIndex((x) => x.id === currentPhase);
    const myIdx = PHASES_ORDERED.findIndex((x) => x.id === p.id);
    const state =
      activeIdx === -1 ? "upcoming" : myIdx < activeIdx ? "done" : myIdx === activeIdx ? "active" : "upcoming";
    return { ...p, state, count: PHASE_WISDOM[p.id]?.length ?? 0 };
  });

  const totalEntries = chapters.reduce((s, c) => s + c.count, 0);
  const activeChapter = chapters.find((c) => c.state === "active") ?? chapters[1];

  return (
    <div className="hidden md:block" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 40px 96px" }}>
      {/* Editorial header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 24,
          paddingBottom: 28,
          borderBottom: `1px solid ${HAIR}`,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 520px" }}>
          <Eyebrow>Playbook · Field guide</Eyebrow>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: 48,
              letterSpacing: "-0.02em",
              color: INK,
              margin: "6px 0 0",
              lineHeight: 1.05,
              fontVariationSettings: '"opsz" 96',
            }}
          >
            Your launch <em style={{ fontWeight: 400, color: TERRA }}>playbook</em>.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 18.5,
              lineHeight: 1.45,
              color: FG_SECONDARY,
              margin: "12px 0 0",
              maxWidth: 640,
              letterSpacing: "-0.005em",
            }}
          >
            Patterns from your projects, plus the lessons experienced launchers wish they'd known. It grows quietly as you ship — what's here now is what helps in{" "}
            <strong style={{ color: INK, fontWeight: 500, fontStyle: "normal" }}>{phaseLabel}</strong>.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button
            style={{
              background: "transparent",
              border: `1px solid ${HAIR}`,
              borderRadius: 999,
              padding: "8px 14px",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: INK,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Search className="w-3.5 h-3.5" /> Search the playbook
          </button>
          <button
            style={{
              background: INK,
              color: PAPER,
              border: 0,
              borderRadius: 999,
              padding: "9px 18px",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Book className="w-3.5 h-3.5" /> Read mode
          </button>
        </div>
      </div>

      {/* Two-column main */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 28, marginTop: 32 }}>
        {/* Primary column */}
        <div style={{ display: "grid", gap: 24 }}>
          {/* Featured pull-quote */}
          {featured && (
            <div
              style={{
                background: "hsl(var(--clay-200))",
                borderRadius: 18,
                padding: "40px 44px 36px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -60,
                  right: -60,
                  width: 220,
                  height: 220,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(198,90,62,0.18), transparent 70%)",
                  pointerEvents: "none",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: TERRA }} />
                <Eyebrow color={INK}>Pattern noticed in your launches</Eyebrow>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 32,
                  lineHeight: 1.2,
                  letterSpacing: "-0.015em",
                  color: INK,
                  margin: "20px 0 0",
                  position: "relative",
                  maxWidth: 640,
                }}
              >
                <span
                  style={{
                    color: TERRA,
                    fontFamily: "var(--font-display)",
                    fontSize: 44,
                    lineHeight: 0,
                    verticalAlign: "-0.18em",
                    marginRight: 4,
                  }}
                >
                  “
                </span>
                {featured.headline} {featured.body}
              </div>
              <div
                style={{
                  marginTop: 22,
                  paddingTop: 18,
                  borderTop: "1px solid rgba(31,27,23,0.12)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  position: "relative",
                }}
              >
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12.5, color: FG_SECONDARY }}>
                  {featured.meta}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <button
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: INK,
                      background: "transparent",
                      border: 0,
                      borderBottom: `1px solid ${INK}`,
                      cursor: "pointer",
                      paddingBottom: 1,
                    }}
                  >
                    Apply to homepage
                  </button>
                  <button
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: FG_SECONDARY,
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section title */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 8 }}>
            <div>
              <Eyebrow>
                Chapter {activeChapter.num} · {activeChapter.title}
              </Eyebrow>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: 26,
                  letterSpacing: "-0.015em",
                  color: INK,
                  marginTop: 4,
                }}
              >
                What helps when you're in {phaseLabel.toLowerCase()}.
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: FG_MUTED }}>
              {numbered.length} of {activeChapter.count} entries
            </div>
          </div>

          {/* Numbered entries */}
          <div style={{ display: "grid", gap: 0 }}>
            {numbered.map((it, i) => (
              <article
                key={it.n}
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr auto",
                  gap: 20,
                  padding: "26px 4px",
                  borderTop: `1px solid ${HAIR}`,
                  borderBottom: i === numbered.length - 1 ? `1px solid ${HAIR}` : 0,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    fontSize: 36,
                    color: TERRA,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    fontVariationSettings: '"opsz" 72',
                    fontStyle: "italic",
                  }}
                >
                  {it.n}
                </div>
                <div style={{ minWidth: 0 }}>
                  <Eyebrow color={FG_MUTED}>{it.tag}</Eyebrow>
                  <h3
                    style={{
                      margin: "6px 0 8px",
                      fontFamily: "var(--font-display)",
                      fontWeight: 500,
                      fontSize: 22,
                      letterSpacing: "-0.01em",
                      color: INK,
                      lineHeight: 1.25,
                    }}
                  >
                    {it.headline}
                  </h3>
                  {it.body && (
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "var(--font-body)",
                        fontSize: 14.5,
                        lineHeight: 1.6,
                        color: FG_SECONDARY,
                        maxWidth: 580,
                      }}
                    >
                      {it.body}
                    </p>
                  )}
                  <div
                    style={{
                      marginTop: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: FG_MUTED,
                    }}
                  >
                    <span style={{ width: 4, height: 4, borderRadius: 999, background: TERRA }} />
                    {it.meta}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <button
                    title="Save"
                    style={{
                      background: "transparent",
                      border: `1px solid ${HAIR}`,
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: FG_MUTED,
                    }}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="More"
                    style={{
                      background: "transparent",
                      border: `1px solid ${HAIR}`,
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: FG_MUTED,
                    }}
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "12px 0 0",
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: 15,
              color: FG_MUTED,
            }}
          >
            More entries appear as you finish steps.{" "}
            <span style={{ color: TERRA, borderBottom: `1px solid ${TERRA}` }}>
              See all {activeChapter.count} in {activeChapter.title} →
            </span>
          </div>
        </div>

        {/* Secondary column */}
        <div style={{ display: "grid", gap: 20, alignContent: "start", position: "sticky", top: 80 }}>
          {/* What helps now */}
          <div style={{ background: "#fff", border: `1px solid ${HAIR}`, borderRadius: 14, padding: 24 }}>
            <Eyebrow>What helps now</Eyebrow>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 20,
                letterSpacing: "-0.01em",
                color: INK,
                marginTop: 4,
                lineHeight: 1.25,
              }}
            >
              You're in {phaseLabel.toLowerCase()}.
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                lineHeight: 1.55,
                color: FG_SECONDARY,
                margin: "8px 0 16px",
              }}
            >
              Short field notes that experienced launchers reach for in this exact moment.
            </p>
            <div style={{ display: "grid", gap: 0 }}>
              {helpsNow.slice(0, 4).map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 10,
                    alignItems: "center",
                    padding: "12px 0",
                    borderTop: i === 0 ? 0 : `1px solid ${HAIR}`,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        letterSpacing: "0.06em",
                        color: FG_MUTED,
                        textTransform: "uppercase",
                      }}
                    >
                      {s.source}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 15,
                        fontWeight: 500,
                        letterSpacing: "-0.005em",
                        color: INK,
                        marginTop: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {s.tip}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" style={{ color: FG_MUTED }} />
                </div>
              ))}
            </div>
          </div>

          {/* Your pattern (dark) */}
          <div style={{ background: INK, color: PAPER, borderRadius: 14, padding: 22 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: TERRA }} />
              <Eyebrow>Your pattern</Eyebrow>
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 17,
                lineHeight: 1.4,
                marginTop: 12,
                letterSpacing: "-0.005em",
              }}
            >
              "{pattern.quote}"
            </div>
            <div style={{ marginTop: 14, fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(251,247,241,0.6)" }}>
              {pattern.meta}
            </div>
          </div>

          {/* Up next */}
          {upNext && (
            <div style={{ background: "hsl(var(--paper-200))", border: `1px solid ${HAIR}`, borderRadius: 14, padding: 22 }}>
              <Eyebrow color={FG_MUTED}>Up next</Eyebrow>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: 18,
                  letterSpacing: "-0.01em",
                  color: INK,
                  marginTop: 6,
                }}
              >
                Chapter {upNext.num} · {upNext.title}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 12.5,
                  color: FG_SECONDARY,
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                Unlocks when you finish {phaseLabel}. {upNext.count} entries on what comes next.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ————— Mobile —————

function MobilePlaybook({
  insights,
  currentPhase,
  phaseLabel,
  pattern,
  upNext,
}: {
  insights: { n: string; tag: string; headline: string; body: string; meta: string }[];
  currentPhase: string;
  phaseLabel: string;
  pattern: { quote: string; meta: string };
  upNext: { num: string; title: string; count: number } | null;
}) {
  const featured = insights[0];
  const numbered = insights.slice(1);
  const activeIdx = PHASES_ORDERED.findIndex((p) => p.id === currentPhase);

  return (
    <div className="md:hidden" style={{ background: PAPER, paddingBottom: 32 }}>
      {/* Title */}
      <div style={{ padding: "20px 22px 2px" }}>
        <Eyebrow>Field guide</Eyebrow>
        <h1
          style={{
            margin: "6px 0 0",
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 38,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: INK,
            fontVariationSettings: '"opsz" 96',
          }}
        >
          Your launch
          <br />
          <em style={{ color: TERRA, fontWeight: 400 }}>playbook</em>.
        </h1>
        <p
          style={{
            margin: "12px 0 0",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontWeight: 300,
            fontSize: 16,
            lineHeight: 1.4,
            color: FG_SECONDARY,
            letterSpacing: "-0.005em",
          }}
        >
          Patterns from your projects, plus what experienced launchers wish they'd known.
        </p>
      </div>

      {/* Featured quote */}
      {featured && (
        <div style={{ margin: "20px 16px 0" }}>
          <div
            style={{
              borderRadius: 26,
              background: "linear-gradient(155deg, #EFE4D3 0%, #E8D9C6 60%, #DFCCB1 100%)",
              padding: "22px 22px 20px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 1px 2px rgba(31,27,23,0.06), 0 8px 24px -12px rgba(31,27,23,0.18)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(198,90,62,0.22), transparent 70%)",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: TERRA }} />
              <Eyebrow color={INK}>Pattern from your last launch</Eyebrow>
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 22,
                lineHeight: 1.25,
                letterSpacing: "-0.015em",
                color: INK,
                marginTop: 14,
                position: "relative",
              }}
            >
              <span style={{ color: TERRA, fontSize: 32, lineHeight: 0, verticalAlign: "-0.16em", marginRight: 2 }}>“</span>
              {featured.headline} {featured.body}
            </div>
            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid rgba(31,27,23,0.12)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                position: "relative",
              }}
            >
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11.5, color: "rgba(31,27,23,0.65)" }}>
                {featured.meta}
              </span>
              <button
                style={{
                  background: INK,
                  color: PAPER,
                  border: 0,
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries header */}
      <div style={{ padding: "24px 22px 6px" }}>
        <Eyebrow>
          Chapter {PHASES_ORDERED[Math.max(0, activeIdx)].num} · {phaseLabel}
        </Eyebrow>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: 22,
            letterSpacing: "-0.015em",
            color: INK,
            marginTop: 4,
            lineHeight: 1.2,
          }}
        >
          What helps when you're in {phaseLabel.toLowerCase()}.
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: FG_MUTED, marginTop: 6 }}>
          {numbered.length} entries · scroll for more
        </div>
      </div>

      {/* Entries card */}
      <div
        style={{
          background: "#fff",
          margin: "12px 16px 0",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 1px 2px rgba(31,27,23,0.04)",
        }}
      >
        {numbered.map((it, i) => (
          <div
            key={it.n}
            style={{
              padding: "20px 22px",
              borderBottom: i === numbered.length - 1 ? 0 : `0.5px solid ${HAIR}`,
              display: "grid",
              gridTemplateColumns: "40px 1fr",
              gap: 14,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 26,
                color: TERRA,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {it.n}
            </div>
            <div style={{ minWidth: 0 }}>
              <Eyebrow color={FG_MUTED}>{it.tag}</Eyebrow>
              <h3
                style={{
                  margin: "5px 0 6px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: 19,
                  lineHeight: 1.25,
                  letterSpacing: "-0.015em",
                  color: INK,
                }}
              >
                {it.headline}
              </h3>
              {it.body && (
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-body)",
                    fontSize: 14.5,
                    lineHeight: 1.5,
                    color: FG_SECONDARY,
                  }}
                >
                  {it.body}
                </p>
              )}
              <div
                style={{
                  marginTop: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "var(--font-body)",
                  fontSize: 12,
                  color: FG_MUTED,
                }}
              >
                <span style={{ width: 4, height: 4, borderRadius: 999, background: TERRA }} />
                {it.meta}
                <span style={{ marginLeft: 4 }}>·</span>
                <Bookmark className="w-3 h-3" />
                <span>Save</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pattern (dark) */}
      <div style={{ margin: "24px 16px 0" }}>
        <div
          style={{
            background: INK,
            color: PAPER,
            borderRadius: 22,
            padding: "20px 22px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(198,90,62,0.32), transparent 70%)",
            }}
          />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, position: "relative" }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: TERRA }} />
            <Eyebrow>Your pattern</Eyebrow>
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 18,
              lineHeight: 1.35,
              marginTop: 12,
              letterSpacing: "-0.01em",
              position: "relative",
              color: PAPER,
            }}
          >
            "{pattern.quote}"
          </div>
          <div style={{ marginTop: 12, fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(251,247,241,0.6)" }}>
            {pattern.meta}
          </div>
        </div>
      </div>

      {/* Up next */}
      {upNext && (
        <div style={{ margin: "20px 16px 0" }}>
          <div
            style={{
              background: "#F7F1E8",
              border: `1px solid ${HAIR}`,
              borderRadius: 18,
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                flexShrink: 0,
                background: "rgba(31,27,23,0.06)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Book className="w-5 h-5" style={{ color: INK }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Eyebrow color={FG_MUTED}>Up next</Eyebrow>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: 17,
                  letterSpacing: "-0.015em",
                  color: INK,
                  marginTop: 2,
                }}
              >
                Chapter {upNext.num} · {upNext.title}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: FG_MUTED, marginTop: 2 }}>
                Unlocks when {phaseLabel} is done · {upNext.count} entries
              </div>
            </div>
            <ArrowRight className="w-4 h-4" style={{ color: FG_MUTED, flexShrink: 0 }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "32px 24px 24px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 14, color: FG_MUTED, lineHeight: 1.4 }}>
          The playbook grows quietly as you ship.{" "}
          <span style={{ color: TERRA, borderBottom: `1px solid ${TERRA}`, paddingBottom: 1 }}>
            See all entries →
          </span>
        </div>
      </div>
    </div>
  );
}

// ————— States —————

function PlaybookSkeleton() {
  return (
    <ProjectLayout>
      <div className="max-w-7xl mx-auto px-2.5 md:px-6 py-8">
        <Eyebrow>Playbook · Field guide</Eyebrow>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 40,
            letterSpacing: "-0.02em",
            color: INK,
            margin: "6px 0 24px",
            lineHeight: 1.05,
          }}
        >
          Your launch <em style={{ color: TERRA, fontWeight: 400 }}>playbook</em>.
        </h1>
        <PageLoader />
      </div>
    </ProjectLayout>
  );
}

// ————— Main —————

export default function Playbook() {
  const { data, isLoading } = usePlaybookData();
  const { user } = useAuth();

  const { data: activePhaseData } = useQuery({
    queryKey: ["playbook-active-phase", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("projects")
        .select("active_phase")
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data?.active_phase as string | null) || null;
    },
    enabled: !!user?.id,
  });

  const currentPhase = activePhaseData || "messaging";
  const phaseLabel = useMemo(() => {
    const p = PHASES_ORDERED.find((x) => x.id === currentPhase);
    return p?.title || "Messaging";
  }, [currentPhase]);

  const upNext = useMemo(() => {
    const idx = PHASES_ORDERED.findIndex((p) => p.id === currentPhase);
    if (idx < 0 || idx >= PHASES_ORDERED.length - 1) return null;
    const next = PHASES_ORDERED[idx + 1];
    return { num: next.num, title: next.title, count: PHASE_WISDOM[next.id]?.length ?? 0 };
  }, [currentPhase]);

  const helpsNow = useMemo(() => {
    const tips = PHASE_WISDOM[currentPhase] ?? [];
    return tips.map((t) => ({ tip: t.tip, source: t.source }));
  }, [currentPhase]);

  // Map insights → editorial entries (use real data, fallback to phase wisdom)
  const entries = useMemo(() => {
    const fromInsights = (data?.insights ?? []).map((it, i) => {
      const { headline, body } = splitInsight(it.text);
      return {
        n: String(i + 1).padStart(2, "0"),
        tag: CATEGORY_TAGS[it.category],
        headline,
        body,
        meta: CATEGORY_META[it.category],
      };
    });

    if (fromInsights.length >= 2) return fromInsights;

    // Fallback: synthesize from phase wisdom so the page still feels alive
    const wisdom = PHASE_WISDOM[currentPhase] ?? [];
    const synthesized = wisdom.map((w, i) => {
      const { headline, body } = splitInsight(w.tip);
      return {
        n: String(i + 1).padStart(2, "0"),
        tag: w.source,
        headline,
        body,
        meta: "Field note",
      };
    });
    return [...fromInsights, ...synthesized.slice(fromInsights.length)];
  }, [data, currentPhase]);

  const pattern = useMemo(() => {
    const general = data?.insights.find((i) => i.category === "general");
    if (general) {
      return {
        quote: general.text,
        meta: `Pulled from ${data?.completedProjectCount ?? 0} completed project${
          (data?.completedProjectCount ?? 0) === 1 ? "" : "s"
        }.`,
      };
    }
    return {
      quote: "Your strongest work happens when you write to one person, not a crowd.",
      meta: "A field-guide observation while your patterns build.",
    };
  }, [data]);

  if (isLoading) return <PlaybookSkeleton />;

  // Empty state — still render the editorial shell, just with synthesized entries
  return (
    <ProjectLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <DesktopPlaybook
          insights={entries}
          currentPhase={currentPhase}
          phaseLabel={phaseLabel}
          pattern={pattern}
          helpsNow={helpsNow}
          upNext={upNext}
        />
        <MobilePlaybook
          insights={entries}
          currentPhase={currentPhase}
          phaseLabel={phaseLabel}
          pattern={pattern}
          upNext={upNext}
        />
      </motion.div>
      {!data?.hasEnoughData && (
        <div className="max-w-7xl mx-auto px-2.5 md:px-6 pb-12 -mt-2">
          <div
            style={{
              background: "hsl(var(--paper-200))",
              border: `1px solid ${HAIR}`,
              borderRadius: 12,
              padding: "12px 16px",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              color: FG_SECONDARY,
              textAlign: "center",
            }}
          >
            <BookMarked className="w-3.5 h-3.5 inline-block mr-2" style={{ verticalAlign: "-2px" }} />
            Your personal patterns will appear here as you complete projects. For now, this is what helps in {phaseLabel}.
          </div>
        </div>
      )}
    </ProjectLayout>
  );
}

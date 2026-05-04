import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  Compass,
  Sparkles,
  ArrowRight,
  Calendar,
  List,
  Sparkles as SparkIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAssessmentData, ASSESSMENT_KEYS } from "@/lib/assessmentStorage";
import { AssessmentShell, useAssessmentLayout } from "@/components/assessments/AssessmentShell";
import {
  PageHeader,
  LargeMobileTitle,
  StatusChip,
} from "@/components/assessments/primitives";
import {
  A_HAIR,
  A_INK,
  A_INK_60,
  A_PAPER,
  A_PAPER2,
  A_TERRA,
  FONT_DISPLAY,
  accentFor,
  AccentName,
} from "@/components/assessments/tokens";

interface AssessmentDef {
  id: string;
  title: string;
  blurb: string;
  minutes: string;
  parts: string;
  href: string;
  storageKey: string;
  accent: AccentName;
  Icon: typeof ClipboardCheck;
}

const ASSESSMENTS: AssessmentDef[] = [
  {
    id: "launch",
    title: "What's your current launch approach?",
    blurb:
      "Discover your current launch strategy and get tailored notes on what to refine before your next prelaunch.",
    minutes: "~10 min",
    parts: "15 questions",
    href: "/assessments/launch",
    storageKey: ASSESSMENT_KEYS.LAUNCH,
    accent: "terracotta",
    Icon: ClipboardCheck,
  },
  {
    id: "coach",
    title: "Which coach are you?",
    blurb:
      "Understand the coaching archetype you lead with and see where your long-term business is naturally pulling.",
    minutes: "~15 min",
    parts: "4 parts",
    href: "/assessments/coach",
    storageKey: ASSESSMENT_KEYS.COACH,
    accent: "plum",
    Icon: Compass,
  },
  {
    id: "why",
    title: 'Personal "why" statement',
    blurb:
      "Find the through-line — the quiet belief that pulls your launch, your offer, and your audience together.",
    minutes: "~20 min",
    parts: "8 parts",
    href: "/assessments/why-statement",
    storageKey: ASSESSMENT_KEYS.WHY_STATEMENT,
    accent: "moss",
    Icon: Sparkles,
  },
];

type Status = "ready" | "in-progress" | "completed";
interface SavedSummary {
  status: Status;
  progress?: number;
  score?: string;
  label?: string;
}

const summarize = (def: AssessmentDef, raw: any): SavedSummary => {
  if (!raw) return { status: "ready" };
  if (raw.completedAt) {
    if (def.id === "launch" && typeof raw.score === "number") {
      const label =
        raw.score <= 15 ? "The Announcer" : raw.score <= 30 ? "The Partial Prelauncher" : "The Strategic Prelauncher";
      return { status: "completed", score: `${raw.score}/45`, label };
    }
    if (def.id === "coach" && raw.primaryApproach) {
      const map: Record<string, string> = {
        maya: "The Community Builder",
        derek: "The Direct Seller",
        lauren: "The Product-Centric Coach",
      };
      return { status: "completed", label: map[raw.primaryApproach] };
    }
    return { status: "completed", label: "Completed" };
  }
  // Heuristic progress
  let prog = 0;
  if (raw.answers) prog = Object.keys(raw.answers).length / 15;
  else if (raw.currentStep !== undefined) prog = Math.min(1, raw.currentStep / 8);
  if (prog > 0) return { status: "in-progress", progress: prog };
  return { status: "ready" };
};

const Assessments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useAssessmentLayout();
  const [summaries, setSummaries] = useState<Record<string, SavedSummary>>({});

  useEffect(() => {
    if (!user?.id) return;
    const next: Record<string, SavedSummary> = {};
    ASSESSMENTS.forEach((a) => {
      next[a.id] = summarize(a, getAssessmentData(a.storageKey, user.id));
    });
    setSummaries(next);
  }, [user?.id]);

  const renderCard = (a: AssessmentDef) => {
    const sum = summaries[a.id] ?? { status: "ready" as Status };
    const accent = accentFor(a.accent);
    const isDone = sum.status === "completed";
    const isProg = sum.status === "in-progress";
    const cta = isDone ? "View results" : isProg ? "Resume" : isMobile ? "Start assessment" : "Start";

    if (isMobile) {
      return (
        <div
          key={a.id}
          style={{
            background: "#fff",
            borderRadius: 22,
            padding: "16px 18px",
            boxShadow:
              "0 1px 2px rgba(31,27,23,0.04), 0 4px 16px -8px rgba(31,27,23,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: accent.tint,
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <a.Icon size={20} color={accent.strong} strokeWidth={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 500,
                  fontSize: 17,
                  lineHeight: 1.2,
                  letterSpacing: -0.3,
                  color: A_INK,
                }}
              >
                {a.title}
              </div>
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  color: A_INK_60,
                  letterSpacing: -0.1,
                }}
              >
                <span>{a.minutes}</span>
                <span style={{ width: 3, height: 3, borderRadius: 999, background: "currentColor", opacity: 0.5 }} />
                <span>{a.parts}</span>
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.45,
              color: A_INK_60,
              margin: "10px 0 0",
              letterSpacing: -0.15,
            }}
          >
            {a.blurb}
          </p>
          {isProg && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 999,
                  background: "rgba(31,27,23,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(sum.progress ?? 0) * 100}%`,
                    height: "100%",
                    background: A_TERRA,
                  }}
                />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: A_INK_60 }}>
                {Math.round((sum.progress ?? 0) * 100)}%
              </span>
            </div>
          )}
          {isDone && (
            <div
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderRadius: 10,
                background: A_PAPER2,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: "#4F6B52",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                ✓
              </span>
              {sum.score && <span style={{ fontSize: 12.5, fontWeight: 600 }}>{sum.score}</span>}
              <span style={{ fontSize: 12.5, color: A_INK_60 }}>
                {sum.score ? "· " : ""}{sum.label}
              </span>
            </div>
          )}
          <button
            onClick={() => navigate(a.href)}
            style={{
              marginTop: 12,
              width: "100%",
              background: isDone ? A_PAPER2 : A_INK,
              color: isDone ? A_INK : A_PAPER,
              border: 0,
              borderRadius: 14,
              padding: "12px 14px",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: -0.2,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            {cta}
            <ArrowRight size={15} strokeWidth={2.2} />
          </button>
        </div>
      );
    }

    // Desktop card
    return (
      <article
        key={a.id}
        style={{
          background: "#fff",
          border: `1px solid ${A_HAIR}`,
          borderRadius: 14,
          padding: "22px 26px",
          display: "grid",
          gridTemplateColumns: "56px 1fr auto",
          gap: 22,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: accent.tint,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <a.Icon size={24} color={accent.strong} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h3
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 500,
                fontSize: 20,
                letterSpacing: "-0.01em",
                color: A_INK,
                margin: 0,
              }}
            >
              {a.title}
            </h3>
            <StatusChip status={sum.status} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <MetaPill icon={<Calendar size={12} />}>{a.minutes}</MetaPill>
            <MetaPill icon={<List size={12} />}>{a.parts}</MetaPill>
            {isDone && sum.label && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: A_INK,
                  color: A_PAPER,
                  fontSize: 11.5,
                  fontWeight: 500,
                }}
              >
                {sum.score ? `${sum.score} · ` : ""}{sum.label}
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.55,
              color: A_INK_60,
              margin: "10px 0 0",
              maxWidth: 620,
            }}
          >
            {a.blurb}
          </p>
          {isProg && (
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
                maxWidth: 320,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 999,
                  background: A_PAPER2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(sum.progress ?? 0) * 100}%`,
                    height: "100%",
                    background: A_TERRA,
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: A_INK_60 }}>
                {Math.round((sum.progress ?? 0) * 100)}%
              </span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <Link
            to={a.href}
            style={{
              background: isDone ? "transparent" : A_INK,
              color: isDone ? A_INK : A_PAPER,
              border: isDone ? `1px solid ${A_HAIR}` : 0,
              borderRadius: 999,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            {cta}
            <ArrowRight size={13} />
          </Link>
        </div>
      </article>
    );
  };

  return (
    <AssessmentShell mobile={{ bareTop: true }} desktopMaxWidth={1080}>
      {isMobile ? (
        <>
          <LargeMobileTitle
            eyebrow="Assessments"
            title="Know where you actually stand."
            italicWord="actually"
            lede="Honest reflections, not personality quizzes. A few quiet minutes each."
          />

          {/* Why card */}
          <div style={{ padding: "0 16px 14px" }}>
            <div
              style={{
                background: "rgba(31,27,23,0.04)",
                borderRadius: 18,
                padding: "16px 18px",
                display: "flex",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "rgba(31,27,23,0.08)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <SparkIcon size={16} color={A_INK} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 500,
                    fontSize: 16,
                    color: A_INK,
                  }}
                >
                  Why bother taking these?
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: A_INK_60, margin: "4px 0 0" }}>
                  Each assessment gives you an honest read on one dimension of your launch and saves the result so you can watch it move.
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: "0 16px", display: "grid", gap: 12 }}>
            {ASSESSMENTS.map(renderCard)}
          </div>
        </>
      ) : (
        <>
          <PageHeader
            eyebrow="Assessments"
            title="Know where you actually stand."
            italicWord="actually"
            lede="Honest reflections — not personality quizzes. Each one takes a few quiet minutes and gives you back a map of what to refine before your next launch."
          />

          {/* Why card */}
          <section
            style={{
              background: "hsl(var(--clay-200))",
              borderRadius: 14,
              padding: "22px 26px",
              display: "flex",
              gap: 18,
              alignItems: "flex-start",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(31,27,23,0.08)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SparkIcon size={18} color={A_INK} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 500,
                  fontSize: 18,
                  letterSpacing: "-0.01em",
                  color: A_INK,
                }}
              >
                Why bother taking these?
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.55,
                  color: A_INK,
                  margin: "4px 0 0",
                  maxWidth: 720,
                  opacity: 0.78,
                }}
              >
                You can't refine what you can't see. Each assessment gives you an honest read on one specific dimension of your launch — content, audience, mindset — and saves the result so you can watch it move over time.
              </p>
            </div>
          </section>

          <div style={{ display: "grid", gap: 14 }}>{ASSESSMENTS.map(renderCard)}</div>
        </>
      )}
    </AssessmentShell>
  );
};

const MetaPill = ({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 999,
      background: A_PAPER2,
      border: `1px solid ${A_HAIR}`,
      fontSize: 12,
      color: A_INK_60,
      whiteSpace: "nowrap",
    }}
  >
    {icon}
    {children}
  </span>
);

export default Assessments;

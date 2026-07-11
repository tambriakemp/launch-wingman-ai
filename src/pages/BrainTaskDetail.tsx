import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHaptics } from "@/hooks/useHaptics";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Sparkles,
  Home as HomeIcon,
  BookOpen,
  Layers as LayersIcon,
  CheckSquare,
  Moon,
  LogOut,
  ArrowUpRight,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════
   Cre8 Brain — Task Detail
   Imported 1:1 from `ui_kits/Cre8 Brain App/BrainTaskDetail.jsx`.
   One component, two layouts (desktop web + mobile/native shell),
   four state variants reachable via `?state=notstarted|inprogress|
   generating|complete` for design review.
   ════════════════════════════════════════════════════════════ */

const C = {
  ink: "#1B1915",
  warm: "#F9F6F1",
  bronze: "#B5985A",
  bronzeD: "#9F8348",
  goldT: "#8C6E33",
  goldD: "#C8A86A",
  taupe: "#A39E97",
  cream: "#F4EFE9",
  mist: "#E4DFD9",
  white: "#FFFFFF",
  sub: "#6E6456",
  faint: "#A89E8C",
  line: "#E7DFD2",
  char: "#2B2926",
  dline: "#3A3733",
  bronzeTint: "rgba(181,152,90,0.06)",
};

const SERIF = `Georgia, "Times New Roman", serif`;
const SANS = `Arial, Helvetica, sans-serif`;
const MONO = `"DM Mono", ui-monospace, "SF Mono", Menlo, monospace`;

/* ── Layers (matches Tasks.tsx for back-nav + title lookup) ──── */

interface Layer {
  n: string;
  name: string;
  tasks: string[];
  locked?: boolean;
}

const LAYERS: Layer[] = [
  {
    n: "01",
    name: "Foundation",
    tasks: [
      "Set your business name and tagline",
      "Confirm your business structure",
      "Set up your professional contact info",
      "Claim your domain name",
      "Know where your website stands",
      "Audit your social media presence",
      "Set up your Google Business Profile",
      "Lock in your brand basics",
      "Set up your AI business brain",
      "Connect Google Drive to your business brain",
    ],
  },
  {
    n: "02",
    name: "Customer Intelligence",
    tasks: [
      "Identify their #1 problem",
      "Map their dream outcome",
      "Capture voice of customer",
      "Define their awareness level",
      "Profile your dream client",
      "List their objections",
      "Find where they gather",
    ],
  },
  {
    n: "03",
    name: "Offer Architecture",
    tasks: [
      "Name your core offer",
      "Write your one-sentence promise",
      "List what they actually get",
      "Set your pricing",
      "Pre-empt the top objections",
      "Gather your proof",
      "Define your guarantee",
      "Build your offer brief",
    ],
  },
  {
    n: "04",
    name: "Brand Voice & Messaging",
    tasks: [
      "Define your voice DNA",
      "Build your vocabulary guide",
      "Write your core message",
      "Draft your talking points",
      "Set your content pillars",
      "Find your signature stories",
      "Write your bio",
      "Lock your tone rules",
    ],
  },
  {
    n: "05",
    name: "Operations & SOPs",
    tasks: [
      "Map your client onboarding",
      "Document your content process",
      "Build your lead follow-up",
      "Define your delivery process",
      "Write your FAQ",
      "Set your weekly rhythm",
    ],
    locked: true,
  },
];

/* ── Canonical task content (from the design) ─────────────────
   The design ships rich copy for ONE specific task: layer 02 / task 01
   ("Identify their #1 problem"). When the URL points to that task we
   render the design's full content. For every other task we fall back
   to the same scaffold with the title from LAYERS — Bree adds rich
   copy per-task in follow-ups. */

interface TaskContent {
  phase: string;
  title: string;
  meta: [string, string];
  why: string;
  how: string[];
  criteria: string[];
  phaseSummary: string;
  phaseProgress: string;
  example: string;
  brainUpdate?: string;
}

const CANONICAL_TASK: TaskContent = {
  phase: "Customer Intelligence · 02",
  title: "Identify their #1 problem",
  meta: ["10–20 min", "AI will help"],
  why: "You can't sell a solution until you can name the problem better than your customer can. The sharper you get here, the more every hook, caption, and offer in your Brain will land — because it speaks to what actually keeps them up at night.",
  how: [
    "Think of one real customer you served recently. Picture them specifically.",
    "Write the single biggest problem they came to you with — not five, one.",
    "Capture the exact words they used. Don't translate it into marketing speak.",
  ],
  criteria: [
    "You've named their single biggest problem",
    "You've captured it in their own words",
    "You've noted how aware they are of it",
  ],
  phaseSummary: "Get inside your customer's head — what they want, fear, and already believe.",
  phaseProgress: "2 of 5 tasks complete in this phase",
  example:
    '"I keep posting but nothing happens. I don\'t even know if anyone\'s seeing it, and I\'m starting to think I\'m just bad at this." — a real customer, in their own words.',
  brainUpdate:
    'CUSTOMER PROBLEM (Cre8 Visions)\nPrimary problem: Inconsistent lead flow, no repeatable system.\nIn their words: "I keep posting but nothing happens."\nAwareness: Problem-aware, solution-skeptical.',
};

const taskContentFor = (layerIndex: number, taskIndex: number): TaskContent => {
  // Layer 2 (index 1), task 1 (index 0) is the canonical Customer
  // Intelligence "Identify their #1 problem" task from the design.
  if (layerIndex === 1 && taskIndex === 0) return CANONICAL_TASK;

  const layer = LAYERS[layerIndex];
  const title = layer?.tasks[taskIndex] ?? "Task";
  // Fallback scaffold for tasks without rich design content. Maintains
  // the layout 1:1 while we wait on per-task copy from Bree.
  return {
    phase: `${layer?.name ?? ""} · ${layer?.n ?? "—"}`,
    title,
    meta: ["12–15 min", "AI will help"],
    why: "Every task you complete adds to your Brain. The clearer this gets, the sharper every brief, post, and offer downstream becomes.",
    how: [
      "Read the prompt carefully.",
      "Answer in your own words — keep it specific.",
      "Save when the criteria below are checked.",
    ],
    criteria: [
      "You've answered the prompt in your own words",
      "You've reviewed your response",
      "You're ready to save it to your Brain",
    ],
    phaseSummary:
      "Each phase stacks on the last. Finishing this one moves your Brain forward by one layer.",
    phaseProgress: "",
    example: "Rich content for this task hasn't been written yet. Treat this as the layout.",
  };
};

/* ── State variants ──────────────────────────────────────── */

interface DetailState {
  f1: string;
  f2: string;
  sel: "problem" | "solution" | "unaware" | null;
  checks: [boolean, boolean, boolean];
  ai: "none" | "loading" | "done";
  autosave: boolean;
  done: boolean;
}

const F1_CANON = "They can't get consistent leads. Referrals dried up and they have no system to replace them.";
const F2_CANON = '"I keep posting but nothing happens — I don\'t even know if anyone\'s seeing it."';
const AI_CANON =
  'Their #1 problem is inconsistent lead flow with no repeatable system. They\'re problem-aware but solution-skeptical — they\'ve "tried posting" and seen no return, so lead with proof and a clear mechanism, not more tactics.';

const STATES: Record<string, DetailState> = {
  notstarted: { f1: "", f2: "", sel: null, checks: [false, false, false], ai: "none", autosave: false, done: false },
  inprogress: { f1: F1_CANON, f2: "", sel: null, checks: [true, false, false], ai: "none", autosave: true, done: false },
  generating: { f1: F1_CANON, f2: F2_CANON, sel: null, checks: [true, true, false], ai: "loading", autosave: true, done: false },
  complete: { f1: F1_CANON, f2: F2_CANON, sel: "problem", checks: [true, true, true], ai: "done", autosave: true, done: true },
};

const AWARENESS = [
  { id: "problem" as const, label: "Problem-aware", desc: "They know they have the problem but not the solution." },
  { id: "solution" as const, label: "Solution-aware", desc: "They know solutions exist but not which to trust." },
  { id: "unaware" as const, label: "Unaware", desc: "They don't yet realize this is costing them." },
];

/* ── Atoms ──────────────────────────────────────────────── */

const BrainMark = ({ size = 22, color = C.bronze }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", flexShrink: 0 }}>
    <circle cx="7" cy="8" r="2.4" stroke={color} strokeWidth="1.5" />
    <circle cx="16.5" cy="6.5" r="2.1" stroke={color} strokeWidth="1.5" />
    <circle cx="15" cy="16" r="2.4" stroke={color} strokeWidth="1.5" />
    <circle cx="6" cy="16.5" r="1.7" stroke={color} strokeWidth="1.5" />
    <path d="M9.2 8.8 14.4 6.9M9 9.6 13 14.6M8.6 14.9 12.7 16M6.2 14.8 6.8 10.3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const Eyebrow = ({ children, rule }: { children: React.ReactNode; rule?: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    {rule && <span style={{ width: 26, height: 1, background: C.bronze, flexShrink: 0 }} />}
    <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: C.taupe }}>
      {children}
    </span>
  </div>
);

const Check = ({ on, size = 18, round }: { on: boolean; size?: number; round?: boolean }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: round ? 999 : 5,
      flexShrink: 0,
      border: on ? "none" : "1.5px solid " + C.mist,
      background: on ? C.bronze : "transparent",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {on && (
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <path d="M20 6 9 17l-5-5" stroke={C.ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </span>
);

const InkButton = ({
  children,
  full,
  onClick,
  h = 46,
  fs = 14,
}: {
  children: React.ReactNode;
  full?: boolean;
  onClick?: () => void;
  h?: number;
  fs?: number;
}) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: full ? "100%" : "auto",
        height: h,
        borderRadius: 999,
        border: 0,
        background: hov ? "#322C24" : C.ink,
        color: C.warm,
        fontFamily: SANS,
        fontSize: fs,
        fontWeight: 600,
        padding: full ? 0 : "0 24px",
        cursor: "pointer",
        transition: "background 150ms ease",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
};

const Autosave = () => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 10, color: C.taupe }}>
    <Check on size={13} /> Auto-saved
  </span>
);

const Section = ({
  label,
  right,
  children,
  mt = 32,
}: {
  label: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  mt?: number;
}) => (
  <div style={{ marginTop: mt }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Eyebrow rule>{label}</Eyebrow>
      {right}
    </div>
    <div style={{ marginTop: 14 }}>{children}</div>
  </div>
);

const Field = ({
  label,
  helper,
  placeholder,
  value,
  area,
  h = 110,
  focus,
  italic,
  native,
}: {
  label: string;
  helper?: string;
  placeholder: string;
  value: string;
  area?: boolean;
  h?: number;
  focus?: boolean;
  italic?: boolean;
  native?: boolean;
}) => (
  <div>
    <div
      style={{
        fontFamily: SANS,
        fontSize: native ? 13 : 12,
        fontWeight: native ? 500 : 600,
        color: native ? C.sub : C.ink,
        marginBottom: helper ? 4 : 8,
      }}
    >
      {label}
    </div>
    {helper && <div style={{ fontFamily: SANS, fontSize: 11, color: C.taupe, marginBottom: 8 }}>{helper}</div>}
    <div
      style={{
        display: "flex",
        alignItems: area ? "flex-start" : "center",
        background: native ? C.white : C.cream,
        border: native
          ? focus
            ? "1.5px solid " + C.bronze
            : "1px solid rgba(27,25,21,0.07)"
          : focus
          ? "1.5px solid " + C.bronze
          : "1px solid " + C.mist,
        borderRadius: native ? 13 : 9,
        padding: area ? 16 : "0 16px",
        height: area ? "auto" : native ? 54 : 52,
        minHeight: area ? h : undefined,
        boxShadow: native ? "0 1px 2px rgba(27,25,21,0.035)" : "none",
      }}
    >
      <span
        style={{
          fontFamily: SANS,
          fontStyle: italic && !value ? "italic" : "normal",
          fontSize: native ? 16 : 15,
          color: value ? C.ink : C.taupe,
          lineHeight: 1.6,
          whiteSpace: "pre-line",
        }}
      >
        {value || placeholder}
      </span>
    </div>
  </div>
);

const FormBlock = ({ st, native }: { st: DetailState; native?: boolean }) => (
  <div style={{ display: "grid", gap: native ? 16 : 20 }}>
    <Field
      native={native}
      label="What's the #1 problem your customer is trying to solve?"
      helper="One problem, stated plainly."
      placeholder="e.g. They can't get a steady flow of qualified leads…"
      value={st.f1}
      area
      h={110}
      focus={!st.f1 && st.autosave}
    />
    <Field
      native={native}
      label="How do they describe it in their own words?"
      helper="Quote them. Don't clean it up."
      placeholder='e.g. "I keep posting but nothing happens…"'
      value={st.f2}
      area
      h={100}
      italic
    />
    <div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: native ? 13 : 12,
          fontWeight: native ? 500 : 600,
          color: native ? C.sub : C.ink,
          marginBottom: 8,
        }}
      >
        How aware are they of the problem?
      </div>
      <div
        style={{
          display: "grid",
          gap: native ? 0 : 10,
          background: native ? C.white : "transparent",
          borderRadius: native ? 13 : 0,
          border: native ? "1px solid rgba(27,25,21,0.07)" : "none",
          boxShadow: native ? "0 1px 2px rgba(27,25,21,0.035)" : "none",
          overflow: native ? "hidden" : "visible",
        }}
      >
        {AWARENESS.map((o, i) => {
          const on = st.sel === o.id;
          if (native) {
            return (
              <div
                key={o.id}
                style={{
                  background: on ? C.bronzeTint : "transparent",
                  padding: "14px 16px",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  borderTop: i === 0 ? "none" : "1px solid rgba(27,25,21,0.06)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 500, color: C.ink }}>{o.label}</div>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: C.taupe, marginTop: 3 }}>{o.desc}</div>
                </div>
                {on ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6 9 17l-5-5" stroke={C.bronze} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span style={{ width: 18, height: 18 }} />
                )}
              </div>
            );
          }
          return (
            <div
              key={o.id}
              style={{
                background: on ? C.bronzeTint : C.cream,
                border: on ? "1.5px solid " + C.bronze : "1px solid " + C.mist,
                borderRadius: 12,
                padding: 16,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <Check on={on} round size={18} />
              <div>
                <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.ink }}>{o.label}</div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: C.taupe, marginTop: 4 }}>{o.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const Dots = () => (
  <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
    <style>{`@keyframes skel { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }`}</style>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: C.bronze,
          animation: "skel 1.1s ease-in-out infinite",
          animationDelay: i * 0.18 + "s",
        }}
      />
    ))}
  </div>
);

const AssistBlock = ({ st, native }: { st: DetailState; native?: boolean }) => (
  <div>
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: native ? "nowrap" : "wrap",
        overflowX: native ? "auto" : "visible",
        paddingBottom: native ? 4 : 0,
      }}
    >
      {["Help me choose", "Show examples", "Simplify this"].map((b) => (
        <span
          key={b}
          style={{
            flexShrink: 0,
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 600,
            color: C.ink,
            background: C.cream,
            border: "1px solid " + C.mist,
            borderRadius: 999,
            padding: "9px 16px",
          }}
        >
          {b}
        </span>
      ))}
    </div>
    {st.ai !== "none" && (
      <div
        style={{
          marginTop: 14,
          background: C.cream,
          borderLeft: "2px solid " + C.bronze,
          borderRadius: "0 10px 10px 0",
          padding: 16,
          display: "flex",
          gap: 12,
        }}
      >
        <span style={{ color: C.bronze, flexShrink: 0 }}>
          <Sparkles size={16} />
        </span>
        {st.ai === "loading" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: SANS, fontSize: 13, color: C.taupe }}>Thinking through your answers…</span>
            <Dots />
          </div>
        ) : (
          <span style={{ fontFamily: SANS, fontSize: 14, color: C.ink, lineHeight: 1.6 }}>{AI_CANON}</span>
        )}
      </div>
    )}
  </div>
);

const CriteriaBlock = ({ st, content }: { st: DetailState; content: TaskContent }) => {
  const allDone = st.checks.every(Boolean);
  return (
    <div
      style={{
        background: allDone ? C.bronzeTint : "transparent",
        borderRadius: 12,
        padding: allDone ? 16 : 0,
        margin: allDone ? "-16px" : 0,
      }}
    >
      <div style={{ display: "grid", gap: 12 }}>
        {content.criteria.map((c, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Check on={st.checks[i]} round size={18} />
            <span style={{ fontFamily: SANS, fontSize: 14, color: st.checks[i] ? C.ink : C.taupe }}>{c}</span>
          </div>
        ))}
      </div>
      {allDone && (
        <div style={{ fontFamily: SANS, fontSize: 13, color: C.bronzeD, marginTop: 12 }}>Looks complete. Ready to save.</div>
      )}
    </div>
  );
};

const PromptBox = ({ children, bg, onCopy }: { children: React.ReactNode; bg?: string; onCopy: () => void }) => (
  <div
    style={{
      position: "relative",
      background: bg || C.cream,
      border: "1px solid " + C.mist,
      borderRadius: 10,
      padding: 18,
    }}
  >
    <button
      onClick={onCopy}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        fontFamily: SANS,
        fontSize: 11,
        fontWeight: 600,
        color: C.warm,
        background: C.ink,
        border: 0,
        borderRadius: 999,
        padding: "4px 12px",
        cursor: "pointer",
      }}
    >
      Copy
    </button>
    <div style={{ fontFamily: SANS, fontSize: 13, color: C.ink, lineHeight: 1.6, whiteSpace: "pre-line", paddingRight: 44 }}>
      {children}
    </div>
  </div>
);

const BrainUpdateBlock = ({ content, onCopy }: { content: TaskContent; onCopy: () => void }) => {
  if (!content.brainUpdate) return null;
  return (
    <div
      style={{
        marginTop: 32,
        background: C.cream,
        borderLeft: "3px solid " + C.bronze,
        borderRadius: "0 14px 14px 0",
        padding: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: C.bronze }}>✦</span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.14em",
            color: C.bronzeD,
            textTransform: "uppercase",
          }}
        >
          Update your brain
        </span>
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: C.taupe, margin: "8px 0 12px" }}>
        Paste this into your Claude Project to keep your AI context current:
      </div>
      <PromptBox bg={C.white} onCopy={onCopy}>
        {content.brainUpdate}
      </PromptBox>
    </div>
  );
};

/* ── Web top nav (same shape as Tasks page) ──────────────────────── */

const NAV_LINKS: Array<{ label: string; path: string }> = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Daily Brief", path: "/daily" },
  { label: "My Brain", path: "/brain" },
  { label: "Inner Brain", path: "/inner" },
  { label: "Tasks", path: "/tasks" },
  { label: "Marketing Tools", path: "/marketing" },
  { label: "Settings", path: "/settings" },
];

const AvatarMenu = ({ initial }: { initial: string }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          background: "rgba(237,229,214,0.08)",
          border: "1px solid rgba(200,168,106,0.4)",
          color: "#EDE5D6",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: SERIF,
          fontSize: 14,
          cursor: "pointer",
          padding: 0,
        }}
      >
        {initial}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: C.warm,
            border: "1px solid " + C.mist,
            boxShadow: "0 18px 40px -24px rgba(28,26,23,0.4)",
            minWidth: 160,
            padding: "8px 0",
            zIndex: 50,
          }}
        >
          <button
            onClick={handleSignOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "10px 18px",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: 14,
              color: C.ink,
              textAlign: "left",
            }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

const TopNav = ({ userInitial }: { userInitial: string }) => {
  const navigate = useNavigate();
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 40,
        padding: "22px 48px",
        borderBottom: "1px solid rgba(200,168,106,0.18)",
        position: "sticky",
        top: 0,
        background: "rgba(28,26,23,0.97)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
        <BrainMark size={20} color={C.bronze} />
        <span
          style={{
            fontFamily: SERIF,
            fontSize: 19,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#EDE5D6",
          }}
        >
          Cre8 Brain
        </span>
      </div>
      <nav style={{ display: "flex", alignItems: "center", gap: 30, flex: 1, justifyContent: "flex-end" }}>
        {NAV_LINKS.map((l) => {
          const on = l.label === "Tasks";
          return (
            <button
              key={l.label}
              onClick={() => navigate(l.path)}
              style={{
                background: "transparent",
                border: 0,
                cursor: "pointer",
                fontFamily: SANS,
                fontSize: 14,
                fontWeight: on ? 600 : 400,
                color: on ? "#EDE5D6" : "rgba(237,229,214,0.55)",
                padding: "4px 0",
                borderBottom: "1.5px solid " + (on ? C.bronze : "transparent"),
                whiteSpace: "nowrap",
              }}
            >
              {l.label}
            </button>
          );
        })}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            border: "1px solid rgba(200,168,106,0.4)",
            borderRadius: 999,
            padding: "6px 13px",
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 500,
            color: "#EDE5D6",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 999, background: C.bronze }} />
          24 credits
        </span>
        <AvatarMenu initial={userInitial} />
      </div>
    </header>
  );
};

/* ── Native bottom tab bar (same as Tasks) ──────────────────────── */

const TABS = [
  { label: "Home", icon: HomeIcon, path: "/dashboard" },
  { label: "Brief", icon: BookOpen, path: "/daily" },
  { label: "Brain", icon: LayersIcon, path: "/brain" },
  { label: "Tasks", icon: CheckSquare, path: "/tasks" },
  { label: "Inner", icon: Moon, path: "/inner" },
];

const NativeTabs = () => {
  const navigate = useNavigate();
  const { trigger } = useHaptics();
  return (
    <div
      style={{
        flexShrink: 0,
        background: "rgba(27,25,21,0.97)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderTop: "1px solid rgba(181,152,90,0.18)",
        padding: "9px 0 calc(26px + env(safe-area-inset-bottom))",
        display: "flex",
        justifyContent: "space-around",
        zIndex: 20,
      }}
    >
      {TABS.map((t) => {
        const on = t.label === "Tasks";
        const Icon = t.icon;
        return (
          <button
            key={t.label}
            onClick={() => {
              trigger("selection");
              navigate(t.path);
            }}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              color: on ? C.warm : "rgba(163,158,151,0.7)",
              padding: 0,
            }}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: on ? 600 : 400 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/* ── Web layout ───────────────────────────────────────── */

const TaskDetailWeb = ({
  st,
  content,
  userInitial,
  onBack,
  onSave,
  onCopyBrainUpdate,
}: {
  st: DetailState;
  content: TaskContent;
  userInitial: string;
  onBack: () => void;
  onSave: () => void;
  onCopyBrainUpdate: () => void;
}) => (
  <div style={{ minHeight: "100vh", background: C.warm }}>
    <TopNav userInitial={userInitial} />
    <div style={{ padding: "40px 48px 64px" }}>
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontFamily: SANS,
          fontSize: 13,
          color: C.taupe,
          background: "transparent",
          border: 0,
          padding: 0,
          cursor: "pointer",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke={C.taupe} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Tasks
      </button>
      <div style={{ display: "flex", gap: 40, marginTop: 24, alignItems: "flex-start" }}>
        {/* Main column */}
        <div style={{ flex: "none", width: 700 }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: C.faint,
            }}
          >
            {content.phase}
          </div>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: 46,
              color: "#211B14",
              margin: "16px 0 0",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            {content.title}
          </h1>
          <div style={{ display: "flex", gap: 16, marginTop: 14, fontFamily: SANS, fontSize: 12, color: C.taupe }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <CalendarIcon size={14} /> {content.meta[0]}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} /> {content.meta[1]}
            </span>
          </div>

          <Section label="Why this matters">
            <div style={{ fontFamily: SANS, fontSize: 15, color: C.ink, lineHeight: 1.65 }}>{content.why}</div>
          </Section>

          <Section label="How to do this">
            <div style={{ display: "grid", gap: 10 }}>
              {content.how.map((h, i) => (
                <div key={i} style={{ display: "flex", gap: 14 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: C.bronzeD, paddingTop: 1 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontFamily: SANS, fontSize: 14, color: C.ink, lineHeight: 1.55 }}>{h}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section label="Your response" right={st.autosave ? <Autosave /> : null}>
            <FormBlock st={st} />
          </Section>

          <Section label="AI assist">
            <AssistBlock st={st} />
          </Section>

          <Section label="Tools for this step">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["Customer interview script", "Voice of customer template"].map((t) => (
                <span
                  key={t}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: SANS,
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.ink,
                    background: C.cream,
                    border: "1px solid " + C.mist,
                    borderRadius: 999,
                    padding: "8px 14px",
                  }}
                >
                  {t} <ArrowUpRight size={12} color={C.taupe} />
                </span>
              ))}
            </div>
          </Section>

          <Section label="Done when">
            <CriteriaBlock st={st} content={content} />
          </Section>

          {st.done && <BrainUpdateBlock content={content} onCopy={onCopyBrainUpdate} />}

          <div
            style={{
              marginTop: 36,
              display: "flex",
              justifyContent: st.done ? "stretch" : "flex-end",
            }}
          >
            {st.done ? (
              <InkButton full onClick={onSave} h={52} fs={15}>
                Mark as complete <span style={{ color: C.bronze }}>✦</span>
              </InkButton>
            ) : (
              <InkButton onClick={onSave} h={46} fs={14}>
                Save progress
              </InkButton>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: "none", width: 260, position: "sticky", top: 28 }}>
          <Eyebrow>Task Progress</Eyebrow>
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.ink, marginTop: 10 }}>
            {content.title}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: C.taupe, marginTop: 2 }}>{content.phase.split(" · ")[0]}</div>
          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            {content.criteria.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "center" }}>
                <Check on={st.checks[i]} round size={15} />
                <span style={{ fontFamily: SANS, fontSize: 12, color: st.checks[i] ? C.ink : C.taupe }}>{c}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: C.line, margin: "24px 0" }} />
          <Eyebrow>About This Phase</Eyebrow>
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.ink, marginTop: 10 }}>
            {content.phase.split(" · ")[0]}
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: C.sub, marginTop: 4, lineHeight: 1.5 }}>
            {content.phaseSummary}
          </div>
          {content.phaseProgress && (
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.taupe, marginTop: 10 }}>
              {content.phaseProgress}
            </div>
          )}
          <div style={{ height: 1, background: C.line, margin: "24px 0" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Eyebrow>See an Example</Eyebrow>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="m6 9 6 6 6-6" stroke={C.taupe} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div
            style={{
              marginTop: 12,
              background: C.cream,
              border: "1px solid " + C.mist,
              borderRadius: 12,
              padding: 16,
              fontFamily: SANS,
              fontSize: 13,
              color: C.taupe,
              lineHeight: 1.55,
            }}
          >
            {content.example}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ── Native layout ───────────────────────────────────── */

const TaskDetailNative = ({
  st,
  content,
  onBack,
  onSave,
  onCopyBrainUpdate,
}: {
  st: DetailState;
  content: TaskContent;
  onBack: () => void;
  onSave: () => void;
  onCopyBrainUpdate: () => void;
}) => (
  <div
    style={{
      height: "100vh",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: C.cream,
      overflow: "hidden",
      position: "relative",
    }}
  >
    {/* Dark header band */}
    <div style={{ background: C.ink, padding: "calc(20px + env(safe-area-inset-top)) 20px 22px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: SANS,
            fontSize: 13,
            color: "rgba(237,229,214,0.62)",
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="rgba(237,229,214,0.62)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Tasks
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid rgba(200,168,106,0.45)",
              borderRadius: 999,
              padding: "5px 11px",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: 999, background: C.goldD }} />
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: "#EDE5D6" }}>24</span>
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: "rgba(237,229,214,0.07)",
              border: "1px solid rgba(200,168,106,0.4)",
              color: "#EDE5D6",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: SERIF,
              fontSize: 14,
            }}
          >
            T
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 22 }}>
        <span style={{ width: 26, height: 1, background: C.goldD }} />
        <span
          style={{
            fontFamily: SANS,
            fontSize: 10.5,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: C.goldD,
          }}
        >
          {content.phase}
        </span>
      </div>
      <h1
        style={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: 31,
          color: "#EDE5D6",
          margin: "12px 0 0",
          lineHeight: 1.08,
          letterSpacing: "-0.01em",
        }}
      >
        {content.title}
      </h1>
    </div>

    {/* Scrollable body */}
    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", position: "relative" }}>
      <div style={{ padding: "22px 20px 28px" }}>
        <div style={{ display: "flex", gap: 14, fontFamily: SANS, fontSize: 12, color: C.taupe }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <CalendarIcon size={13} /> {content.meta[0]}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Sparkles size={13} /> {content.meta[1]}
          </span>
        </div>

        <Section label="Why this matters" mt={28}>
          <div style={{ fontFamily: SANS, fontSize: 14, color: C.ink, lineHeight: 1.6 }}>{content.why}</div>
        </Section>

        <Section label="How to do this" mt={28}>
          <div style={{ display: "grid", gap: 10 }}>
            {content.how.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: C.bronzeD }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontFamily: SANS, fontSize: 13, color: C.ink, lineHeight: 1.5 }}>{h}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section label="Your response" mt={28} right={st.autosave ? <Autosave /> : null}>
          <FormBlock st={st} native />
        </Section>

        <Section label="AI assist" mt={28}>
          <AssistBlock st={st} native />
        </Section>

        <Section label="Done when" mt={28}>
          <CriteriaBlock st={st} content={content} />
        </Section>

        {st.done && <BrainUpdateBlock content={content} onCopy={onCopyBrainUpdate} />}

        <div style={{ marginTop: 28 }}>
          <InkButton full onClick={onSave} h={50}>
            {st.done ? (
              <>
                Mark as complete <span style={{ color: C.bronze }}>✦</span>
              </>
            ) : (
              "Save progress"
            )}
          </InkButton>
        </div>
      </div>
    </div>

    <NativeTabs />
  </div>
);

/* ── Page wrapper ───────────────────────────────────── */

const useIsNativeShell = () => {
  const isMobile = useIsMobile();
  const [forceNative, setForceNative] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("native") === "1") setForceNative(true);
  }, []);
  const isCapacitor =
    typeof window !== "undefined" &&
    (((window as any).Capacitor?.isNativePlatform?.() ?? false) ||
      /(Median|MedianJS|gonative|capacitor)/i.test(window.navigator.userAgent));
  return forceNative || isMobile || isCapacitor;
};

const BrainTaskDetail = () => {
  const navigate = useNavigate();
  const params = useParams<{ layer: string; task: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { trigger } = useHaptics();

  const stateKey = (searchParams.get("state") as keyof typeof STATES | null) ?? "notstarted";
  const st = STATES[stateKey] ?? STATES.notstarted;

  const layerIndex = Math.max(0, Math.min(LAYERS.length - 1, parseInt(params.layer ?? "1", 10) || 0));
  const taskIndex = Math.max(
    0,
    Math.min((LAYERS[layerIndex]?.tasks.length ?? 1) - 1, parseInt(params.task ?? "0", 10) || 0),
  );
  const content = taskContentFor(layerIndex, taskIndex);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <div style={{ minHeight: "100vh", background: C.warm }} />;
  }

  const userInitial =
    (user.user_metadata as any)?.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "Y";

  const onBack = () => {
    trigger("selection");
    navigate("/tasks");
  };

  const onSave = () => {
    trigger(st.done ? "success" : "medium");
    toast(st.done ? "Task complete." : "Progress saved.", {
      description: st.done
        ? "Your Brain just leveled up."
        : "We'll keep this here until you finish.",
    });
  };

  const onCopyBrainUpdate = async () => {
    if (!content.brainUpdate) return;
    trigger("light");
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content.brainUpdate);
        toast("Copied to clipboard.");
      } else {
        toast("Copy not available on this surface.");
      }
    } catch {
      toast("Couldn't copy — try selecting the text manually.");
    }
  };

  const isNativeShell = useIsNativeShell();

  return isNativeShell ? (
    <TaskDetailNative st={st} content={content} onBack={onBack} onSave={onSave} onCopyBrainUpdate={onCopyBrainUpdate} />
  ) : (
    <TaskDetailWeb
      st={st}
      content={content}
      userInitial={userInitial}
      onBack={onBack}
      onSave={onSave}
      onCopyBrainUpdate={onCopyBrainUpdate}
    />
  );
};

export default BrainTaskDetail;

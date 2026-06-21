import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHaptics } from "@/hooks/useHaptics";
import {
  Home as HomeIcon,
  BookOpen,
  Layers as LayersIcon,
  CheckSquare,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/* ════════════════════════════════════════════════════════════
   Cre8 Brain — Tasks Page
   Imported 1:1 from Claude Design `ui_kits/Cre8 Brain App/BrainTasksPage.jsx`
   plus shared primitives from `BrainAppKit.jsx`. One component renders
   the desktop web layout and the mobile/native shell.
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
  surf: "#F5F2F0",
  char: "#2B2926",
  dline: "#3A3733",
};

const SERIF = `Georgia, "Times New Roman", serif`;
const SANS = `Arial, Helvetica, sans-serif`;
const MONO = `"DM Mono", ui-monospace, "SF Mono", Menlo, monospace`;

/* ── Task data (from BrainTasksPage.jsx) ──────────────────────── */

const L1 = [
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
];
const L2 = [
  "Identify their #1 problem",
  "Map their dream outcome",
  "Capture voice of customer",
  "Define their awareness level",
  "Profile your dream client",
  "List their objections",
  "Find where they gather",
];
const L3 = [
  "Name your core offer",
  "Write your one-sentence promise",
  "List what they actually get",
  "Set your pricing",
  "Pre-empt the top objections",
  "Gather your proof",
  "Define your guarantee",
  "Build your offer brief",
];
const L4 = [
  "Define your voice DNA",
  "Build your vocabulary guide",
  "Write your core message",
  "Draft your talking points",
  "Set your content pillars",
  "Find your signature stories",
  "Write your bio",
  "Lock your tone rules",
];
const L5 = [
  "Map your client onboarding",
  "Document your content process",
  "Build your lead follow-up",
  "Define your delivery process",
  "Write your FAQ",
  "Set your weekly rhythm",
];

interface Layer {
  n: string;
  name: string;
  tasks: string[];
  locked?: boolean;
  unlock?: string;
}

const LAYERS: Layer[] = [
  { n: "01", name: "Foundation", tasks: L1 },
  { n: "02", name: "Customer Intelligence", tasks: L2 },
  { n: "03", name: "Offer Architecture", tasks: L3 },
  { n: "04", name: "Brand Voice & Messaging", tasks: L4 },
  { n: "05", name: "Operations & SOPs", tasks: L5, locked: true, unlock: "Brand Voice & Messaging" },
];

const TASK_META: Record<string, [string, string]> = {
  "Set your AI business brain": ["12–15 min", "AI will help"],
  "Set your business name and tagline": ["12–15 min", "AI will help"],
  "Identify their #1 problem": ["10–20 min", "AI will help"],
};

const TASK_WHY: Record<string, string> = {
  "Set your AI business brain":
    "This is the engine — once it knows your business, every brief and document gets sharper.",
  "Set your business name and tagline":
    "Every tool in your Brain gets sharper once it knows exactly who you are.",
  "Identify their #1 problem":
    "You can't sell a solution until you can name the problem better than your customer can.",
};

interface DemoState {
  done: Record<number, number>;
  openLayer: number;
  active: { layer: number; task: number };
  status: string;
  pct: number;
  count: string;
}

const STATES: Record<"A" | "B" | "C", DemoState> = {
  A: {
    done: { 0: 8 },
    openLayer: 0,
    active: { layer: 0, task: 8 },
    status: "7 tasks complete. Keep going — your briefs get sharper with every layer.",
    pct: 14,
    count: "7 of 50 tasks complete",
  },
  B: {
    done: {},
    openLayer: 0,
    active: { layer: 0, task: 0 },
    status: "Start here. Every task builds something real.",
    pct: 0,
    count: "0 of 50 tasks complete",
  },
  C: {
    done: { 0: 10 },
    openLayer: 1,
    active: { layer: 1, task: 0 },
    status: "Foundation complete. Your brain is starting to take shape.",
    pct: 20,
    count: "10 of 50 tasks complete",
  },
};

const taskKindFor = (s: DemoState, li: number, ti: number): "complete" | "inprogress" | "notstarted" => {
  const done = s.done[li] || 0;
  if (ti < done) return "complete";
  if (s.active.layer === li && s.active.task === ti) return "inprogress";
  return "notstarted";
};

/* ── Shared atoms (from BrainAppKit) ──────────────────────────── */

const BrainMark = ({ size = 22, color = C.bronze }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", flexShrink: 0 }}>
    <circle cx="7" cy="8" r="2.4" stroke={color} strokeWidth="1.5" />
    <circle cx="16.5" cy="6.5" r="2.1" stroke={color} strokeWidth="1.5" />
    <circle cx="15" cy="16" r="2.4" stroke={color} strokeWidth="1.5" />
    <circle cx="6" cy="16.5" r="1.7" stroke={color} strokeWidth="1.5" />
    <path d="M9.2 8.8 14.4 6.9M9 9.6 13 14.6M8.6 14.9 12.7 16M6.2 14.8 6.8 10.3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const ArrowIcon = ({ size = 14, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Bar = ({ pct, h = 6, track = C.mist, fill = C.bronze, style }: { pct: number; h?: number; track?: string; fill?: string; style?: React.CSSProperties }) => (
  <div style={{ width: "100%", height: h, background: track, borderRadius: 999, overflow: "hidden", ...style }}>
    <div style={{ width: pct + "%", height: "100%", background: fill, borderRadius: 999, transition: "width 320ms ease" }} />
  </div>
);

const StatusIcon = ({ kind, size = 16 }: { kind: "complete" | "inprogress" | "notstarted"; size?: number }) => {
  if (kind === "complete") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill={C.bronze} />
        <path d="M17 9l-6 6-3-3" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "inprogress") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10.5" stroke={C.bronze} strokeWidth="1.5" />
        <path d="M12 2a10 10 0 0 1 0 20z" fill={C.bronze} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10.5" stroke={C.mist} strokeWidth="1.5" />
    </svg>
  );
};

const Chevron = ({ open, color = C.taupe, size = 16 }: { open: boolean; color?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 200ms ease" }}
  >
    <path d="m6 9 6 6 6-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon = ({ size = 15, color = C.taupe }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="5" y="11" width="14" height="9" rx="2" stroke={color} strokeWidth="1.6" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth="1.6" />
  </svg>
);

/* ── Web top nav (dark) ─────────────────────────────────────── */

const NAV_LINKS: Array<{ label: string; path: string }> = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Daily Brief", path: "/daily" },
  { label: "My Brain", path: "/brain" },
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
            borderRadius: 0,
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

const TopNav = ({ active, userInitial }: { active: string; userInitial: string }) => {
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
          const on = l.label === active;
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

/* ── Native bottom tab bar ─────────────────────────────────── */

const TABS = [
  { label: "Home", icon: HomeIcon, path: "/dashboard" },
  { label: "Brief", icon: BookOpen, path: "/daily" },
  { label: "Brain", icon: LayersIcon, path: "/brain" },
  { label: "Tasks", icon: CheckSquare, path: "/tasks" },
  { label: "Tools", icon: Sparkles, path: "/marketing" },
];

const NativeTabs = ({ active }: { active: string }) => {
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
        const on = t.label === active;
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
            <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: on ? 600 : 400 }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* ── Task row + layer section (shared between web + native) ── */

const TaskRow = ({
  title,
  kind,
  native,
  onOpen,
}: {
  title: string;
  kind: "complete" | "inprogress" | "notstarted";
  native?: boolean;
  onOpen: () => void;
}) => {
  const complete = kind === "complete";
  const meta = TASK_META[title] || ["12–15 min", "AI will help"];
  const borderColor = kind === "inprogress" ? C.bronze : C.mist;
  return (
    <div
      onClick={complete ? undefined : onOpen}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        minHeight: native ? 56 : 52,
        padding: native ? "10px 20px 10px 18px" : "8px 24px 8px 20px",
        borderLeft: "3px solid " + (complete ? C.mist : borderColor),
        borderBottom: "1px solid " + C.line,
        cursor: complete ? "default" : "pointer",
        background: "transparent",
      }}
    >
      <StatusIcon kind={kind} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 500,
            color: complete ? C.taupe : C.ink,
            whiteSpace: native ? "normal" : "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10.5,
            color: C.taupe,
            marginTop: native ? 3 : 2,
          }}
        >
          {complete ? "Complete" : meta.join("  ·  ")}
        </div>
      </div>
      {complete ? (
        <StatusIcon kind="complete" size={16} />
      ) : (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 600,
            color: C.goldT,
            flexShrink: 0,
          }}
        >
          {kind === "inprogress" ? "Continue" : "Start"} <ArrowIcon size={13} color={C.goldT} />
        </span>
      )}
    </div>
  );
};

const LayerSection = ({
  layer,
  li,
  s,
  open,
  onToggle,
  onOpenTask,
  native,
}: {
  layer: Layer;
  li: number;
  s: DemoState;
  open: boolean;
  onToggle: () => void;
  onOpenTask: (title: string, layerIndex: number, taskIndex: number) => void;
  native?: boolean;
}) => {
  const done = s.done[li] || 0;
  const total = layer.tasks.length;
  const pct = Math.round((done / total) * 100);
  const complete = pct >= 100;

  if (layer.locked) {
    return (
      <div style={{ borderTop: "1px solid " + C.mist }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 52, padding: native ? "0 20px" : "0 4px" }}>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: C.taupe }}>
            {layer.n}
          </span>
          <span style={{ width: 1, height: 14, background: C.mist }} />
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: 600,
              color: C.taupe,
            }}
          >
            <LockIcon /> {layer.name}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: SANS, fontSize: 13, color: C.taupe }}>
            {native ? "Coming soon" : "Unlocks after " + layer.unlock}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div onClick={onToggle} style={{ cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 52, padding: native ? "0 20px" : "0 4px" }}>
          <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", color: C.taupe }}>
            {layer.n}
          </span>
          <span style={{ width: 1, height: 14, background: C.mist }} />
          <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: C.ink }}>
            {layer.name}
          </span>
          {!native && (
            <span style={{ fontFamily: SANS, fontSize: 13, color: C.taupe, marginLeft: 8 }}>
              {complete ? "Complete" : `${done} of ${total} tasks complete`}
            </span>
          )}
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: MONO, fontSize: 13, color: complete || done > 0 ? C.bronzeD : C.taupe }}>
            {complete ? "" : pct + "%"}
          </span>
          {complete ? <StatusIcon kind="complete" size={17} /> : <Chevron open={open} />}
        </div>
        <Bar pct={pct} h={3} track={C.mist} style={{ borderRadius: 0 }} />
      </div>
      {open && !complete && (
        <div>
          {layer.tasks.map((t, ti) => (
            <TaskRow
              key={ti}
              title={t}
              kind={taskKindFor(s, li, ti)}
              native={native}
              onOpen={() => onOpenTask(t, li, ti)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Sticky bottom CTA ─────────────────────────────────────── */

const StickyBar = ({ title, native, onClick }: { title: string; native?: boolean; onClick: () => void }) => (
  <div
    onClick={onClick}
    style={
      native
        ? {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: "calc(71px + env(safe-area-inset-bottom))",
            height: 56,
            background: "#2A2620",
            borderTop: "1px solid rgba(181,152,90,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            zIndex: 18,
            cursor: "pointer",
          }
        : {
            position: "sticky",
            bottom: 0,
            height: 56,
            background: C.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            zIndex: 25,
            cursor: "pointer",
            marginTop: 40,
          }
    }
  >
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
      <span style={{ fontFamily: SANS, fontSize: native ? 12 : 13, color: C.taupe }}>
        {native ? "Next:" : "Your next task:"}
      </span>
      <span
        style={{
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 500,
          color: C.warm,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
    </div>
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: SANS,
        fontSize: 13,
        fontWeight: 600,
        color: C.bronze,
        flexShrink: 0,
      }}
    >
      Continue <ArrowIcon size={13} color={C.bronze} />
    </span>
  </div>
);

/* ── Web layout ────────────────────────────────────────────── */

const TasksWeb = ({
  s,
  openMap,
  toggle,
  onOpenTask,
  userInitial,
}: {
  s: DemoState;
  openMap: Record<number, boolean>;
  toggle: (li: number) => void;
  onOpenTask: (title: string, layerIndex: number, taskIndex: number) => void;
  userInitial: string;
}) => {
  const activeTitle = LAYERS[s.active.layer].tasks[s.active.task];
  return (
    <div style={{ minHeight: "100vh", background: C.warm, position: "relative" }}>
      <TopNav active="Tasks" userInitial={userInitial} />
      <div style={{ padding: "48px 0 90px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 40px" }}>
          <div>
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
              Build Your Brain
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
              Your path to a complete brain.
            </h1>
          </div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 20, color: C.sub, marginTop: 10 }}>
            {s.status}
          </div>
          <Bar pct={s.pct} h={6} style={{ marginTop: 26 }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.taupe }}>{s.count}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.bronzeD }}>{s.pct}%</span>
          </div>
          <div style={{ marginTop: 44, display: "grid", gap: 32 }}>
            {LAYERS.map((l, li) => (
              <LayerSection
                key={l.n}
                layer={l}
                li={li}
                s={s}
                open={!!openMap[li]}
                onToggle={() => toggle(li)}
                onOpenTask={onOpenTask}
              />
            ))}
          </div>
        </div>
      </div>
      <StickyBar title={activeTitle} onClick={() => onOpenTask(activeTitle, s.active.layer, s.active.task)} />
    </div>
  );
};

/* ── Native / mobile-web layout ────────────────────────────── */

const TasksNative = ({
  s,
  openMap,
  toggle,
  onOpenTask,
}: {
  s: DemoState;
  openMap: Record<number, boolean>;
  toggle: (li: number) => void;
  onOpenTask: (title: string, layerIndex: number, taskIndex: number) => void;
}) => {
  const activeTitle = LAYERS[s.active.layer].tasks[s.active.task];
  return (
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BrainMark size={17} color={C.goldD} />
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 15,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#EDE5D6",
              }}
            >
              Cre8 Brain
            </span>
          </div>
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
            Build Your Brain
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
          Your path to a complete brain.
        </h1>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, color: "rgba(237,229,214,0.6)", marginTop: 8 }}>
          {s.status}
        </div>
        <Bar pct={s.pct} h={4} track="rgba(237,229,214,0.14)" style={{ marginTop: 18 }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(237,229,214,0.55)" }}>
            {s.count.replace(" tasks complete", " complete")}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.goldD }}>{s.pct}%</span>
        </div>
      </div>

      {/* Scrollable layer list */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", position: "relative" }}>
        <div style={{ padding: "8px 0 28px" }}>
          {LAYERS.map((l, li) => (
            <div key={l.n} style={{ borderBottom: "1px solid " + C.mist }}>
              <LayerSection
                layer={l}
                li={li}
                s={s}
                open={!!openMap[li]}
                onToggle={() => toggle(li)}
                onOpenTask={onOpenTask}
                native
              />
            </div>
          ))}
        </div>
      </div>

      <StickyBar
        title={activeTitle}
        native
        onClick={() => onOpenTask(activeTitle, s.active.layer, s.active.task)}
      />

      <NativeTabs active="Tasks" />
    </div>
  );
};

/* ── Page ─────────────────────────────────────────────────── */

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

const Tasks = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const { trigger } = useHaptics();

  // Demo state from ?state=A|B|C — defaults to A (early progress) so the
  // page reads as in-use out of the box. Wiring to real Supabase state
  // is a follow-up; the design ships matching one of these three.
  const stateParam = (searchParams.get("state") as "A" | "B" | "C" | null) ?? "A";
  const s: DemoState = STATES[stateParam] ?? STATES.A;

  const [openMap, setOpenMap] = useState<Record<number, boolean>>({ [s.openLayer]: true });
  useEffect(() => {
    setOpenMap({ [s.openLayer]: true });
  }, [stateParam, s.openLayer]);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <div style={{ minHeight: "100vh", background: C.warm }} />;
  }

  const userInitial =
    (user.user_metadata as any)?.first_name?.[0]?.toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "Y";

  const toggle = (li: number) => {
    trigger("selection");
    setOpenMap((m) => ({ ...m, [li]: !m[li] }));
  };

  const onOpenTask = (_title: string, layerIndex: number, taskIndex: number) => {
    trigger("medium");
    navigate(`/tasks/${layerIndex}/${taskIndex}`);
  };

  const isNativeShell = useIsNativeShell();

  return isNativeShell ? (
    <TasksNative s={s} openMap={openMap} toggle={toggle} onOpenTask={onOpenTask} />
  ) : (
    <TasksWeb
      s={s}
      openMap={openMap}
      toggle={toggle}
      onOpenTask={onOpenTask}
      userInitial={userInitial}
    />
  );
};

export default Tasks;

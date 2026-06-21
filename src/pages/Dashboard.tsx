import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Image as ImageIcon, Sparkles, Calendar, Copy, Check, Link as LinkIcon,
  Home as HomeIcon, BookOpen, Layers, CheckSquare, Wand2, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/* ============================================================
   Cre8 Brain — Dashboard (web + native), editorial redesign
   Ported 1:1 from the supplied design system.
   ============================================================ */

const TC    = "#B5985A";  // antique gold
const GOLDT = "#8C6E33";  // readable gold text on light
const GOLDD = "#C8A86A";  // bright gold on espresso
const ESP   = "#1C1A17";  // dark UI
const CREAM = "#EDE5D6";  // cream text on dark
const CLAY  = "#E6D9C4";
const INK   = "#211B14";
const SUB   = "#6E6456";
const FAINT = "#A89E8C";
const LINE  = "#E7DFD2";
const PAPER = "#F9F8F6";
const SURF  = "#F5F2F0";
const R     = 18;
const SHADOW = "0 1px 2px rgba(30,24,19,0.04), 0 18px 44px -30px rgba(30,24,19,0.20)";
const SOFT   = "0 1px 2px rgba(30,24,19,0.04), 0 14px 30px -22px rgba(30,24,19,0.22)";

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS  = "Arial, Helvetica, sans-serif";

const BRAIN = {
  completeness: 34,
  credits: 24,
  streak: 6,
  docsThisWeek: 2,
  layers: [
    { id: "foundation", name: "Foundation", pct: 80 },
    { id: "customer",   name: "Customer",   pct: 40 },
    { id: "offer",      name: "Offer",      pct: 0  },
    { id: "voice",      name: "Voice",      pct: 0  },
    { id: "operations", name: "Operations", pct: 0  },
  ],
};

const BRIEFS = [
  {
    pillar: "Behind the Build",
    imagePrompt: "A warm, sunlit creative studio — an open notebook with handwritten brand notes beside a laptop showing a moodboard. Soft film grain, editorial cream and bronze tones.",
    hook: "Most people think they need a bigger audience. They need a clearer message.",
    caption: "Most people think they need a bigger audience.\n\nThey need a clearer message.\n\nBefore I write a single post for a client, we get the foundation down on paper — who it's for, what it promises, and the exact words they already use. The content gets easier after that. Not harder.\n\nIf your posting feels like guessing, the problem usually isn't effort. It's the missing brief.",
    hashtags: "#smallbusinessmarketing  #brandvoice  #contentstrategy  #solopreneur  #marketingtips",
  },
  {
    pillar: "Client Story",
    imagePrompt: "Two coffee cups on a worn wooden table, a printed one-page brand brief between them with a pen resting on top. Natural window light, warm neutral palette.",
    hook: "She had been in business six years and had never written down what she actually sells.",
    caption: "She had been in business six years and had never written down what she actually sells.\n\nNot because she didn't know it — she knew it cold. It just lived in her head, so every caption started from zero.\n\nWe spent one afternoon getting it out of her head and onto the page. Customer, offer, voice. The next morning her posts wrote themselves.\n\nYou don't need more ideas. You need your business documented.",
    hashtags: "#businessowner #marketingstrategy #brandclarity #womeninbusiness #contentcreation",
  },
  {
    pillar: "Value / How-To",
    imagePrompt: "Flat lay of a simple five-step checklist on cream paper, a bronze pen, and a small potted plant.",
    hook: "The fastest way to sound like yourself online: stop writing like everyone else.",
    caption: "The fastest way to sound like yourself online: stop writing like everyone else.\n\nHere's the shortcut I give every client —\n\n1. Write the way you'd explain it to one customer\n2. Read it out loud\n3. Cut anything you'd never actually say\n\nThat's it. Your voice was never the problem. The corporate filter was.",
    hashtags: "#copywritingtips #brandvoice #marketingforsmallbusiness #authenticmarketing #solopreneurlife",
  },
];

const NEXT_TASK = {
  layer: "Customer Intelligence",
  title: "Build your Customer Avatar",
  why: "Every tool in your Brain gets sharper once it knows exactly who you're talking to.",
  time: "12–18 min",
};

const RECENT_DOCS = [
  { title: "Brand Voice Guide",       layer: "Voice",    when: "2d", status: "saved" },
  { title: "Offer Brief — draft",     layer: "Offer",    when: "3d", status: "draft" },
  { title: "Voice of Customer Bank",  layer: "Customer", when: "4d", status: "saved" },
];

const TOOLS = [
  { id: "hook",    label: "Hook Generator", icon: Sparkles },
  { id: "caption", label: "Caption Writer", icon: BookOpen },
  { id: "subject", label: "Subject Lines",  icon: BookOpen },
  { id: "bio",     label: "Bio Writer",     icon: Wand2 },
  { id: "ad",      label: "Ad Copy",        icon: Sparkles },
  { id: "object",  label: "Objections",     icon: CheckSquare },
];

/* ── Avatar with dropdown ── */
const AvatarDropdown = ({ user, mobile }: { user: string; mobile?: boolean }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const size = mobile ? 32 : 32;
  const bg = mobile ? "rgba(237,229,214,0.07)" : "rgba(237,229,214,0.08)";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: size, height: size, borderRadius: 999, background: bg,
          border: "1px solid rgba(200,168,106,0.4)", color: CREAM,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontFamily: SERIF, fontSize: 14, cursor: "pointer", padding: 0,
        }}
      >
        {user.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: mobile ? ESP : PAPER, border: `1px solid ${mobile ? "rgba(200,168,106,0.35)" : LINE}`,
          borderRadius: 14, boxShadow: SOFT, minWidth: 160, padding: "8px 0", zIndex: 50,
        }}>
          <button
            onClick={handleSignOut}
            style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 18px", background: "transparent", border: 0, cursor: "pointer",
              fontFamily: SANS, fontSize: 14, color: mobile ? CREAM : INK, textAlign: "left",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = mobile ? "rgba(237,229,214,0.08)" : SURF; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Brand mark ── */
const BrainMark = ({ size = 22, color = TC }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "inline-block", flexShrink: 0 }}>
    <circle cx="7" cy="8" r="2.4" stroke={color} strokeWidth="1.5" />
    <circle cx="16.5" cy="6.5" r="2.1" stroke={color} strokeWidth="1.5" />
    <circle cx="15" cy="16" r="2.4" stroke={color} strokeWidth="1.5" />
    <circle cx="6" cy="16.5" r="1.7" stroke={color} strokeWidth="1.5" />
    <path d="M9.2 8.8 14.4 6.9M9 9.6 13 14.6M8.6 14.9 12.7 16M6.2 14.8 6.8 10.3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

/* ── Magazine header (desktop) ── */
const TopNav = ({ user }: { user: string }) => {
  const [active, setActive] = useState("dashboard");
  const links = [
    { id: "dashboard", label: "Dashboard" },
    { id: "brief",     label: "Daily Brief" },
    { id: "brain",     label: "My Brain" },
    { id: "tasks",     label: "Tasks" },
    { id: "tools",     label: "Marketing Tools" },
    { id: "settings",  label: "Settings" },
  ];
  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40,
      padding: "22px 48px", borderBottom: "1px solid rgba(200,168,106,0.18)",
      position: "sticky", top: 0, background: "rgba(28,26,23,0.97)",
      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
        <BrainMark size={20} color={TC} />
        <span style={{ fontFamily: SERIF, fontSize: 19, letterSpacing: "0.16em", textTransform: "uppercase", color: CREAM }}>
          Cre8 Brain
        </span>
      </div>
      <nav style={{ display: "flex", alignItems: "center", gap: 30, flex: 1, justifyContent: "flex-end" }}>
        {links.map((l) => {
          const on = active === l.id;
          return (
            <button key={l.id} onClick={() => setActive(l.id)} style={{
              background: "transparent", border: 0, cursor: "pointer", fontFamily: SANS, fontSize: 14,
              fontWeight: on ? 600 : 400, color: on ? CREAM : "rgba(237,229,214,0.55)",
              padding: "4px 0", borderBottom: "1.5px solid " + (on ? TC : "transparent"),
              whiteSpace: "nowrap",
            }}>{l.label}</button>
          );
        })}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7, background: "transparent",
          border: "1px solid rgba(200,168,106,0.4)", borderRadius: 999, padding: "6px 13px",
          fontFamily: SANS, fontSize: 13, fontWeight: 500, color: CREAM,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: TC }} />
          {BRAIN.credits} credits
        </div>
        <AvatarDropdown user={user} />
      </div>
    </header>
  );
};

const Eyebrow = ({ children, color, style }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) => (
  <div style={{ fontFamily: SANS, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, color: color || FAINT, ...style }}>
    {children}
  </div>
);

/* ── Pill button (desktop) ── */
const Pill = ({ children, primary, onClick, icon: Icon }: {
  children: React.ReactNode; primary?: boolean; onClick?: () => void; icon?: any;
}) => {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, cursor: "pointer",
        fontFamily: SANS, fontSize: 14, fontWeight: 500, padding: "11px 22px",
        transition: "all 180ms ease", whiteSpace: "nowrap",
        background: primary ? (h ? "#322D26" : ESP) : (h ? "#F1EBE2" : "transparent"),
        color: primary ? CREAM : INK,
        border: primary ? `1px solid ${h ? "#322D26" : ESP}` : "1px solid #D8D0C5",
      }}>
      {children}{Icon && <Icon size={15} />}
    </button>
  );
};

const TextLink = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", border: 0,
      padding: 0, cursor: "pointer", fontFamily: SANS, fontSize: 14, fontWeight: 600, color: GOLDT,
    }}>
      {children}
      <ArrowRight size={15} style={{ transform: h ? "translateX(3px)" : "none", transition: "transform 180ms ease" }} />
    </button>
  );
};

/* ── Desktop Brief card ── */
const BriefCard = ({ brief, onRegen, onCopy, onPublish, copied }: any) => (
  <article style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: R, boxShadow: SHADOW, padding: 44 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 30 }}>
      <div>
        <Eyebrow color={GOLDT}>Today's Creative Brief</Eyebrow>
        <h2 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 30, color: INK, margin: "12px 0 0", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
          One post, ready to ship.
        </h2>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0, paddingTop: 4 }}>
        <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: GOLDT }}>{brief.pillar}</span>
        <button onClick={onRegen} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: 0, padding: 0, cursor: "pointer", fontFamily: SANS, fontSize: 13, color: SUB }}>
          <Sparkles size={13} /> Regenerate
        </button>
      </div>
    </div>

    <div className="cre8-brief-grid" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 40, alignItems: "start" }}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 5", background: CLAY, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ImageIcon size={34} style={{ color: "rgba(27,25,21,0.32)" }} strokeWidth={1.4} />
        </div>
        <Pill primary icon={Sparkles}>Generate image</Pill>
      </div>

      <div>
        <p style={{ margin: 0, fontFamily: SERIF, fontStyle: "italic", fontSize: 27, lineHeight: 1.32, color: INK, letterSpacing: "-0.005em" }}>{brief.hook}</p>
        <p style={{ margin: "22px 0 0", fontFamily: SANS, fontSize: 15, lineHeight: 1.72, color: "#3A352E", whiteSpace: "pre-line" }}>{brief.caption}</p>
        <p style={{ margin: "20px 0 0", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.6, color: GOLDT }}>{brief.hashtags}</p>
      </div>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 36, paddingTop: 28, borderTop: `1px solid ${LINE}`, flexWrap: "wrap" }}>
      <Pill onClick={onCopy} icon={copied ? Check : Copy}>{copied ? "Copied" : "Copy caption"}</Pill>
      <Pill primary onClick={onPublish} icon={LinkIcon}>Publish to Copost</Pill>
      <span style={{ flex: 1 }} />
      <span style={{ fontFamily: SANS, fontSize: 13, color: FAINT }}>Tuned to your brand voice &amp; today's pillar</span>
    </div>
  </article>
);

/* ── Desktop next-task card ── */
const NextTaskCard = () => (
  <article style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: R, boxShadow: SHADOW, padding: 40, display: "flex", alignItems: "center", gap: 36, flexWrap: "wrap" }}>
    <div style={{ flex: "1 1 360px", minWidth: 0 }}>
      <Eyebrow>Your next step · {NEXT_TASK.layer}</Eyebrow>
      <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 32, color: INK, margin: "14px 0 0", lineHeight: 1.12, letterSpacing: "-0.01em" }}>{NEXT_TASK.title}</h3>
      <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.65, color: SUB, margin: "12px 0 0", maxWidth: 480 }}>{NEXT_TASK.why}</p>
      <div style={{ marginTop: 22 }}><TextLink>Start this task</TextLink></div>
    </div>
    <div style={{ fontFamily: SANS, fontSize: 13, color: FAINT, display: "grid", gap: 8, alignContent: "start" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Calendar size={14} /> {NEXT_TASK.time}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Sparkles size={14} /> AI will help</span>
    </div>
  </article>
);

/* ── Desktop right rail ── */
const RightRail = () => (
  <aside style={{ display: "grid", gap: 40, alignContent: "start" }}>
    <section>
      <Eyebrow>Brain</Eyebrow>
      <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 40, color: INK, margin: "14px 0 4px", lineHeight: 1, letterSpacing: "-0.02em" }}>
        {BRAIN.completeness}<span style={{ fontSize: 22, color: SUB }}>%</span>{" "}
        <span style={{ fontSize: 17, color: SUB, fontStyle: "italic" }}>complete</span>
      </div>
      <div style={{ height: 10, background: "#EBE4DA", marginTop: 16, overflow: "hidden" }}>
        <div style={{ width: `${BRAIN.completeness}%`, height: "100%", background: TC }} />
      </div>
      <div style={{ display: "grid", gap: 0, marginTop: 26 }}>
        {BRAIN.layers.map((l, i) => (
          <div key={l.id} style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 16, alignItems: "center", padding: "13px 0", borderTop: i === 0 ? 0 : `1px solid ${LINE}` }}>
            <span style={{ fontFamily: SANS, fontSize: 14, color: l.pct > 0 ? INK : FAINT }}>{l.name}</span>
            <div style={{ height: 2, background: "#E5DED4", position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, width: `${Math.max(l.pct, 0)}%`, height: 2, background: l.pct >= 100 ? "#7A8466" : TC }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22 }}><TextLink>Continue building</TextLink></div>
    </section>

    <section style={{ borderTop: `1px solid ${LINE}`, paddingTop: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <Eyebrow>Recent documents</Eyebrow>
        <button style={{ background: "transparent", border: 0, cursor: "pointer", fontFamily: SANS, fontSize: 13, color: GOLDT, fontWeight: 500 }}>View all</button>
      </div>
      <div>
        {RECENT_DOCS.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 0", borderBottom: `1px solid ${LINE}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: SERIF, fontSize: 16, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
              <div style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, marginTop: 3 }}>{d.layer} · {d.when} ago</div>
            </div>
            {d.status === "draft" && <span style={{ fontFamily: SANS, fontSize: 11, fontStyle: "italic", color: SUB, flexShrink: 0 }}>Draft</span>}
          </div>
        ))}
      </div>
    </section>
  </aside>
);

/* ============================================================
   NATIVE / MOBILE
   ============================================================ */

const MobileHeader = ({ user }: { user: string }) => (
  <div style={{ background: ESP, padding: "54px 20px 20px" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <BrainMark size={17} color={GOLDD} />
        <span style={{ fontFamily: SERIF, fontSize: 15, letterSpacing: "0.16em", textTransform: "uppercase", color: CREAM }}>Cre8 Brain</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid rgba(200,168,106,0.45)", borderRadius: 999, padding: "5px 11px" }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: GOLDD }} />
          <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: CREAM }}>{BRAIN.credits}</span>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(237,229,214,0.07)", border: "1px solid rgba(200,168,106,0.4)", color: CREAM, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 14 }}>{user.charAt(0).toUpperCase()}</div>
      </div>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 22 }}>
      <span style={{ width: 26, height: 1, background: GOLDD }} />
      <span style={{ fontFamily: SANS, fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", fontWeight: 600, color: GOLDD }}>
        {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </span>
    </div>

    <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 31, color: CREAM, margin: "12px 0 0", lineHeight: 1.08, letterSpacing: "-0.01em" }}>
      Good morning,<br />
      <em style={{ color: GOLDD }}>{user}.</em>
    </h1>

    <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 16, flexWrap: "wrap" }}>
      {[`Brain ${BRAIN.completeness}%`, `${BRAIN.streak}-day streak`, `${BRAIN.docsThisWeek} docs this week`].map((m, i) => (
        <span key={m} style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
          {i > 0 && <span style={{ width: 3, height: 3, borderRadius: 999, background: GOLDD, opacity: 0.85 }} />}
          <span style={{ fontFamily: SANS, fontSize: 12, color: "rgba(237,229,214,0.62)" }}>{m}</span>
        </span>
      ))}
    </div>
  </div>
);

const PillBtn = ({ children, primary, onClick, icon: Icon, flex }: any) => (
  <button onClick={onClick} style={{
    flex, height: 46, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8, fontFamily: SANS, fontSize: 13.5, fontWeight: 500, cursor: "pointer",
    background: primary ? ESP : "transparent", color: primary ? CREAM : INK,
    border: primary ? `1px solid ${ESP}` : "1px solid #D8D0C5",
  }}>
    {children}{Icon && <Icon size={15} />}
  </button>
);

const MobileBrief = ({ brief, onPublish, onCopy, copied }: any) => {
  const [panel, setPanel] = useState(0);
  const startX = useRef<number | null>(null);
  const labels = ["Image", "Caption", "Hook"];
  const onStart = (e: any) => { startX.current = e.touches ? e.touches[0].clientX : e.clientX; };
  const onEnd = (e: any) => {
    if (startX.current == null) return;
    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const dx = x - startX.current;
    if (Math.abs(dx) > 44) setPanel((p) => Math.max(0, Math.min(2, p + (dx < 0 ? 1 : -1))));
    startX.current = null;
  };

  return (
    <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 22, boxShadow: SOFT, overflow: "hidden" }}>
      <div style={{ padding: "18px 18px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <Eyebrow color={GOLDT}>Today's Brief</Eyebrow>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: INK, marginTop: 5, lineHeight: 1.1 }}>One post, ready.</div>
        </div>
        <span style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 500, color: GOLDT, whiteSpace: "nowrap", paddingTop: 3 }}>{brief.pillar}</span>
      </div>

      <div style={{ margin: "0 18px", display: "flex", background: "#F0EAE1", borderRadius: 999, padding: 4, gap: 4 }}>
        {labels.map((l, i) => (
          <button key={l} onClick={() => setPanel(i)} style={{
            flex: 1, padding: "8px 0", borderRadius: 999, textAlign: "center", cursor: "pointer", border: 0,
            background: panel === i ? SURF : "transparent",
            boxShadow: panel === i ? "0 1px 3px rgba(27,25,21,0.12)" : "none",
            color: panel === i ? INK : SUB, fontFamily: SANS, fontSize: 12, fontWeight: 600,
          }}>{l}</button>
        ))}
      </div>

      <div onTouchStart={onStart} onTouchEnd={onEnd} onMouseDown={onStart} onMouseUp={onEnd}
        style={{ padding: 18, minHeight: 250, userSelect: "none" }}>
        {panel === 0 && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ width: "100%", aspectRatio: "5 / 4", background: CLAY, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ImageIcon size={30} style={{ color: "rgba(27,25,21,0.30)" }} strokeWidth={1.4} />
            </div>
            <p style={{ margin: 0, fontFamily: SANS, fontSize: 13, lineHeight: 1.6, color: SUB }}>{brief.imagePrompt}</p>
          </div>
        )}
        {panel === 1 && (
          <div>
            <p style={{ margin: 0, fontFamily: SANS, fontSize: 14.5, lineHeight: 1.66, color: "#3A352E", whiteSpace: "pre-line" }}>{brief.caption}</p>
            <p style={{ margin: "14px 0 0", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.55, color: GOLDT }}>{brief.hashtags}</p>
          </div>
        )}
        {panel === 2 && (
          <div style={{ minHeight: 214, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ margin: 0, fontFamily: SERIF, fontStyle: "italic", fontSize: 26, lineHeight: 1.32, color: INK }}>{brief.hook}</p>
            <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 12.5, color: FAINT }}>First line — test this on its own.</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, paddingBottom: 14 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: panel === i ? 18 : 6, height: 6, borderRadius: 999, background: panel === i ? TC : "#D8D0C5", transition: "width 220ms ease" }} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, padding: "0 18px 18px" }}>
        <PillBtn onClick={onCopy} icon={copied ? Check : Copy} flex={1}>{copied ? "Copied" : "Copy"}</PillBtn>
        <PillBtn primary onClick={onPublish} icon={LinkIcon} flex={1.4}>Publish</PillBtn>
      </div>
    </div>
  );
};

const MobileBrain = () => (
  <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 22, boxShadow: SOFT, padding: 20 }}>
    <Eyebrow>Brain</Eyebrow>
    <div style={{ fontFamily: SERIF, fontSize: 30, color: INK, margin: "10px 0 0", lineHeight: 1 }}>
      {BRAIN.completeness}<span style={{ fontSize: 18, color: SUB }}>%</span>{" "}
      <span style={{ fontSize: 15, color: SUB, fontStyle: "italic" }}>complete</span>
    </div>
    <div style={{ height: 9, background: "#EFE8DE", borderRadius: 999, marginTop: 13, overflow: "hidden" }}>
      <div style={{ width: `${BRAIN.completeness}%`, height: "100%", background: TC, borderRadius: 999 }} />
    </div>
    <div style={{ marginTop: 18 }}>
      {BRAIN.layers.map((l, i) => (
        <div key={l.id} style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 14, alignItems: "center", padding: "11px 0", borderTop: i === 0 ? 0 : `1px solid ${LINE}` }}>
          <span style={{ fontFamily: SANS, fontSize: 13, color: l.pct > 0 ? INK : FAINT }}>{l.name}</span>
          <div style={{ height: 2, background: "#E5DED4", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, width: `${l.pct}%`, height: 2, background: l.pct >= 100 ? "#7A8466" : TC }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MobileTask = () => (
  <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 22, boxShadow: SOFT, padding: 20 }}>
    <Eyebrow>Next step · {NEXT_TASK.time}</Eyebrow>
    <div style={{ fontFamily: SERIF, fontSize: 21, color: INK, margin: "10px 0 0", lineHeight: 1.15 }}>{NEXT_TASK.title}</div>
    <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.55, color: SUB, margin: "8px 0 0" }}>{NEXT_TASK.why}</p>
    <button style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: GOLDT, background: "transparent", border: 0, padding: 0, cursor: "pointer" }}>
      Start this task <ArrowRight size={15} />
    </button>
  </div>
);

const MobileTools = () => (
  <div>
    <div style={{ marginBottom: 11 }}><Eyebrow>Quick Tools</Eyebrow></div>
    <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
      {TOOLS.map((t) => (
        <button key={t.id} style={{
          flexShrink: 0, display: "flex", flexDirection: "column", gap: 9, width: 100,
          padding: "14px 13px", background: SURF, border: `1px solid ${LINE}`, borderRadius: 16,
          boxShadow: SOFT, textAlign: "left", cursor: "pointer",
        }}>
          <t.icon size={17} style={{ color: TC }} />
          <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: INK, lineHeight: 1.25 }}>{t.label}</span>
        </button>
      ))}
    </div>
  </div>
);

const MobileDocs = () => (
  <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 22, boxShadow: SOFT, padding: "6px 18px 8px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 8px" }}>
      <Eyebrow>Recent Documents</Eyebrow>
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: GOLDT, fontWeight: 500 }}>View Brain</span>
    </div>
    {RECENT_DOCS.map((d, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderTop: `1px solid ${LINE}` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SERIF, fontSize: 15.5, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.title}</div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: FAINT, marginTop: 2 }}>{d.layer} · {d.when} ago</div>
        </div>
        {d.status === "draft" && <span style={{ fontFamily: SANS, fontSize: 11, fontStyle: "italic", color: SUB, flexShrink: 0 }}>Draft</span>}
      </div>
    ))}
  </div>
);

const TabBar = () => {
  const [active, setActive] = useState("home");
  const tabs = [
    { id: "home", label: "Home", icon: HomeIcon },
    { id: "brief", label: "Brief", icon: BookOpen },
    { id: "brain", label: "Brain", icon: Layers },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "tools", label: "Tools", icon: Sparkles },
  ];
  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0, display: "flex",
      background: "rgba(28,26,23,0.97)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      borderTop: "1px solid rgba(200,168,106,0.18)", padding: "9px 8px 26px", zIndex: 30,
    }}>
      {tabs.map((t) => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => setActive(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "6px 0", background: "transparent", border: 0, cursor: "pointer",
          }}>
            <t.icon size={21} color={on ? GOLDD : "rgba(237,229,214,0.5)"} strokeWidth={on ? 2 : 1.5} />
            <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: on ? 700 : 500, color: on ? CREAM : "rgba(237,229,214,0.5)" }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/* ============================================================
   PAGE
   ============================================================ */

const useIsMobile = () => {
  const get = () => (typeof window !== "undefined" ? window.innerWidth < 900 : false);
  const [m, setM] = useState<boolean>(get);
  useEffect(() => {
    const on = () => setM(window.innerWidth < 900);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return m;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [name, setName] = useState("there");
  const [briefIdx, setBriefIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const brief = BRIEFS[briefIdx];
  const isMobile = useIsMobile();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    supabase.from("profiles").select("first_name, onboarding_completed_at").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data?.onboarding_completed_at) { navigate("/onboarding", { replace: true }); return; }
        if (data?.first_name) setName(data.first_name);
        setReady(true);
      });
  }, [user, loading, navigate]);

  const copy = () => {
    navigator.clipboard?.writeText(brief.caption).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (loading || !ready) {
    return <div style={{ minHeight: "100vh", background: PAPER }} />;
  }

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: PAPER, display: "flex", flexDirection: "column" }}>
        <MobileHeader user={name} />
        <div style={{ flex: 1, padding: "16px 18px 110px", display: "flex", flexDirection: "column", gap: 16 }}>
          <MobileBrief brief={brief} copied={copied} onCopy={copy} onPublish={() => {}} />
          <MobileBrain />
          <MobileTask />
          <MobileTools />
          <MobileDocs />
          <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: FAINT }}>
              Feeling stuck? <span style={{ color: GOLDT }}>Book a session →</span>
            </span>
          </div>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: PAPER }}>
      <TopNav user={name} />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 48px 100px" }}>
        <div className="cre8-cols" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 64, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 44, minWidth: 0 }}>
            <div>
              <Eyebrow>{today}</Eyebrow>
              <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 60, color: INK, margin: "16px 0 0", lineHeight: 1.02, letterSpacing: "-0.02em" }}>
                Good morning, <em style={{ color: TC }}>{name}</em>.
              </h1>
              <p style={{ fontFamily: SANS, fontSize: 15, color: SUB, margin: "18px 0 0" }}>
                {BRAIN.streak}-day streak · {BRAIN.docsThisWeek} documents this week · your Brain is {BRAIN.completeness}% complete
              </p>
            </div>

            <BriefCard brief={brief} copied={copied}
              onRegen={() => setBriefIdx((i) => (i + 1) % BRIEFS.length)}
              onCopy={copy} onPublish={() => {}} />

            <NextTaskCard />
          </div>

          <RightRail />
        </div>
      </main>
      <style>{`
        @media (max-width: 1024px) {
          .cre8-cols { grid-template-columns: 1fr !important; }
          .cre8-brief-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

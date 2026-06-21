import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Image as ImageIcon, Sparkles, Home, BookOpen, Layers, CheckSquare, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/* ---------------- Cre8 Brain palette ---------------- */
const C = {
  cream: "#FAF9F5",
  paper: "#F5F2EA",
  ink: "#1C1A17",
  gold: "#B5985A",
  goldSoft: "#E6D9B3",
  hairline: "rgba(28,26,23,0.10)",
  mute: "rgba(28,26,23,0.62)",
  subtle: "rgba(28,26,23,0.42)",
};
const fontMono = `"JetBrains Mono", ui-monospace, monospace`;
const fontSerifIt = `"Fraunces", Georgia, serif`;

const BrainMark = ({ size = 22, color = C.gold }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <circle cx="7" cy="8" r="2.4" stroke={color} strokeWidth="1.2" />
    <circle cx="16.5" cy="6.5" r="2.1" stroke={color} strokeWidth="1.2" />
    <circle cx="15" cy="16" r="2.4" stroke={color} strokeWidth="1.2" />
    <circle cx="6" cy="16.5" r="1.7" stroke={color} strokeWidth="1.2" />
    <path d="M9.2 8.8 14.4 6.9M9 9.6 13 14.6M8.6 14.9 12.7 16M6.2 14.8 6.8 10.3" stroke={color} strokeWidth="1" />
  </svg>
);

const NAV = ["Dashboard", "Daily Brief", "My Brain", "Tasks", "Marketing Tools", "Settings"];

const BRAIN_LAYERS = [
  { label: "Foundation", pct: 80 },
  { label: "Customer", pct: 45 },
  { label: "Offer", pct: 0 },
  { label: "Voice", pct: 0 },
  { label: "Operations", pct: 0 },
];

const RECENT_DOCS = [
  { title: "Brand Voice Guide", meta: "Voice · 2d ago", badge: null },
  { title: "Offer Brief — draft", meta: "Offer · 3d ago", badge: "draft" },
  { title: "Voice of Customer Bank", meta: "Customer · 4d ago", badge: null },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [name, setName] = useState("there");
  const [bizName, setBizName] = useState("Cre8 Visions");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    const biz = localStorage.getItem("cre8_business_name") || "";
    if (biz) setBizName(biz);
    supabase.from("profiles").select("first_name, onboarding_completed_at").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data?.onboarding_completed_at) {
          navigate("/onboarding", { replace: true });
          return;
        }
        if (data?.first_name) setName(data.first_name);
        else if (biz) setName(biz);
      });
  }, [user, loading, navigate]);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const overallPct = Math.round(BRAIN_LAYERS.reduce((s, l) => s + l.pct, 0) / BRAIN_LAYERS.length);

  return (
    <div style={{ background: C.cream, color: C.ink, minHeight: "100vh", fontFamily: fontMono, paddingBottom: 96 }}>
      {/* ---------- Top nav (web) / brand bar (native) ---------- */}
      <header style={{
        background: C.ink, color: C.cream, padding: "18px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <BrainMark color={C.gold} />
          <span style={{ fontFamily: fontMono, letterSpacing: 3, fontSize: 13, fontWeight: 500 }}>CRE8 BRAIN</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex" style={{ gap: 32 }}>
          {NAV.map((n, i) => (
            <button key={n} style={{
              background: "none", border: "none", color: i === 0 ? C.cream : "rgba(250,249,245,0.6)",
              fontFamily: fontMono, fontSize: 13, cursor: "pointer", paddingBottom: 4,
              borderBottom: i === 0 ? `1.5px solid ${C.gold}` : "1.5px solid transparent",
            }}>{n}</button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            border: `1px solid rgba(250,249,245,0.25)`, padding: "6px 12px", borderRadius: 999,
            fontFamily: fontMono, fontSize: 12, display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: C.gold }} />
            24 credits
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: 99, border: `1px solid rgba(250,249,245,0.25)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontMono, fontSize: 13,
          }}>{name.charAt(0).toUpperCase()}</div>
        </div>
      </header>

      {/* ---------- Main grid ---------- */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px" }}>
        {/* Native: stack. Desktop: side-by-side */}
        <div className="cre8-grid" style={{ display: "grid", gap: 40, gridTemplateColumns: "1fr" }}>
          {/* LEFT — greeting + brief */}
          <section>
            <div style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: 3, color: C.subtle, textTransform: "uppercase", marginBottom: 16 }}>
              {today}
            </div>
            <h1 style={{ fontFamily: fontMono, fontWeight: 500, fontSize: "clamp(40px,6vw,72px)", lineHeight: 1.05, letterSpacing: "-0.025em" }}>
              Good morning,<br />
              <em style={{ fontFamily: fontSerifIt, fontStyle: "italic", color: C.gold, fontWeight: 400 }}>{bizName}</em>.
            </h1>
            <p style={{ marginTop: 16, color: C.mute, fontSize: 14 }}>
              6-day streak · 2 documents this week · your Brain is {overallPct}% complete
            </p>

            {/* Brief card */}
            <article style={{
              marginTop: 36, background: C.paper, border: `1px solid ${C.hairline}`, borderRadius: 18, padding: 28,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: 2, color: C.subtle, textTransform: "uppercase" }}>
                  Today's creative brief
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.gold }}>
                  <button style={btnGhost}>Behind the Build</button>
                  <button style={btnGhost}><Sparkles size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Regenerate</button>
                </div>
              </div>

              <h2 style={{ fontFamily: fontMono, fontWeight: 500, fontSize: "clamp(22px,3vw,28px)", marginBottom: 22 }}>
                One post, ready to ship.
              </h2>

              <div className="cre8-brief-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
                <div style={{ aspectRatio: "4 / 5", background: C.goldSoft, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: C.mute }}>
                  <ImageIcon size={32} opacity={0.5} />
                </div>
                <div>
                  <blockquote style={{ fontFamily: fontSerifIt, fontStyle: "italic", fontSize: 20, lineHeight: 1.4 }}>
                    Most people think they need a bigger audience. They need a clearer message.
                  </blockquote>
                  <p style={{ marginTop: 16, color: C.mute, fontSize: 14, lineHeight: 1.6 }}>
                    Before I write a single post for a client, we get the foundation down on paper — who it's for, what it promises, and the exact words that will make them stop scrolling.
                  </p>
                  <button style={{
                    marginTop: 18, background: C.ink, color: C.cream, border: "none", padding: "10px 18px",
                    borderRadius: 999, fontFamily: fontMono, fontSize: 12, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 6,
                  }}>
                    <Sparkles size={12} /> Generate image
                  </button>
                </div>
              </div>
            </article>
          </section>

          {/* RIGHT — brain progress + docs */}
          <aside>
            <div style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: 3, color: C.subtle, textTransform: "uppercase", marginBottom: 16 }}>
              Brain
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <div style={{ fontFamily: fontMono, fontWeight: 500, fontSize: 56, lineHeight: 1 }}>{overallPct}<span style={{ fontSize: 22, color: C.mute }}>%</span></div>
              <div style={{ fontFamily: fontSerifIt, fontStyle: "italic", color: C.mute, fontSize: 18 }}>complete</div>
            </div>
            <div style={{ marginTop: 14, height: 6, borderRadius: 99, background: C.hairline, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${overallPct}%`, background: C.gold }} />
            </div>

            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              {BRAIN_LAYERS.map((l) => (
                <div key={l.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: fontMono, fontSize: 13, fontWeight: 500, color: l.pct === 0 ? C.subtle : C.ink }}>{l.label}</span>
                  </div>
                  <div style={{ height: 1, background: C.hairline, position: "relative" }}>
                    <div style={{ position: "absolute", top: -0.5, left: 0, height: 2, width: `${l.pct}%`, background: C.gold }} />
                  </div>
                </div>
              ))}
            </div>

            <button style={{
              marginTop: 24, background: "none", border: "none", color: C.gold, fontFamily: fontMono, fontSize: 13,
              display: "inline-flex", alignItems: "center", gap: 8, padding: 0, cursor: "pointer",
            }}>
              Continue building <ArrowRight size={14} />
            </button>

            <div style={{ marginTop: 36, paddingTop: 24, borderTop: `1px solid ${C.hairline}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <span style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: 2, color: C.subtle, textTransform: "uppercase" }}>Recent documents</span>
                <a style={{ color: C.gold, fontSize: 12, cursor: "pointer" }}>View all</a>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {RECENT_DOCS.map((d) => (
                  <div key={d.title} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontFamily: fontMono, fontSize: 14, fontWeight: 500 }}>{d.title}</div>
                      <div style={{ fontFamily: fontMono, fontSize: 11, color: C.subtle, marginTop: 2 }}>{d.meta}</div>
                    </div>
                    {d.badge && (
                      <span style={{
                        fontFamily: fontSerifIt, fontStyle: "italic", fontSize: 12, color: C.gold,
                      }}>{d.badge}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ---------- Mobile bottom tab bar ---------- */}
      <nav className="cre8-mobile-tabs" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: C.ink, color: C.cream,
        display: "none", justifyContent: "space-around", padding: "12px 16px 28px",
        borderTop: `1px solid rgba(250,249,245,0.1)`, zIndex: 30,
      }}>
        {[
          { icon: Home, label: "Home", active: true },
          { icon: BookOpen, label: "Brief" },
          { icon: Layers, label: "Brain" },
          { icon: CheckSquare, label: "Tasks" },
          { icon: SettingsIcon, label: "Settings" },
        ].map((t, i) => (
          <button key={i} style={{
            background: "none", border: "none", color: t.active ? C.gold : "rgba(250,249,245,0.55)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer",
            fontFamily: fontMono, fontSize: 10,
          }}>
            <t.icon size={20} />
            {t.label}
          </button>
        ))}
      </nav>

      <style>{`
        @media (min-width: 900px) {
          .cre8-grid { grid-template-columns: 2fr 1fr !important; gap: 64px !important; }
          .cre8-brief-grid { grid-template-columns: 1fr 1.4fr !important; gap: 28px !important; }
        }
        @media (max-width: 768px) {
          .cre8-mobile-tabs { display: flex !important; }
        }
      `}</style>
    </div>
  );
};

const btnGhost: React.CSSProperties = {
  background: "none", border: "none", color: C.gold, fontFamily: fontMono, fontSize: 12, cursor: "pointer", padding: 0,
};

export default Dashboard;

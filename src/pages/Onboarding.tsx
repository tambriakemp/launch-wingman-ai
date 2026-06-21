import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* ---------------- Cre8 Brain palette ---------------- */
const C = {
  cream: "#FAF9F5",
  ink: "#1C1A17",
  gold: "#B5985A",
  goldSoft: "#D9C690",
  hairline: "rgba(28,26,23,0.10)",
  mute: "rgba(28,26,23,0.62)",
};

const fontMono = `"JetBrains Mono", ui-monospace, monospace`;
const fontSerifIt = `"Fraunces", Georgia, serif`;

/* ---------------- Cre8 brain mark ---------------- */
const BrainMark = ({ size = 48, color = C.gold }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
    <circle cx="7" cy="8" r="2.4" stroke={color} strokeWidth="1.2" />
    <circle cx="16.5" cy="6.5" r="2.1" stroke={color} strokeWidth="1.2" />
    <circle cx="15" cy="16" r="2.4" stroke={color} strokeWidth="1.2" />
    <circle cx="6" cy="16.5" r="1.7" stroke={color} strokeWidth="1.2" />
    <path d="M9.2 8.8 14.4 6.9M9 9.6 13 14.6M8.6 14.9 12.7 16M6.2 14.8 6.8 10.3" stroke={color} strokeWidth="1" />
  </svg>
);

/* Larger constellation for walkthrough hero */
const Constellation = ({ size = 220 }: { size?: number }) => (
  <svg viewBox="0 0 200 200" width={size} height={size} fill="none">
    {[
      [60, 40], [110, 30], [150, 60], [170, 110], [140, 150], [85, 165], [40, 130], [50, 80], [100, 90], [125, 115],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="4" fill={C.ink} stroke={C.gold} strokeWidth="1.2" />
    ))}
    {[
      [60, 40, 110, 30], [110, 30, 150, 60], [150, 60, 170, 110], [170, 110, 140, 150],
      [140, 150, 85, 165], [85, 165, 40, 130], [40, 130, 50, 80], [50, 80, 60, 40],
      [100, 90, 50, 80], [100, 90, 110, 30], [100, 90, 150, 60], [100, 90, 125, 115],
      [125, 115, 140, 150], [125, 115, 170, 110],
    ].map(([x1, y1, x2, y2], i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.gold} strokeWidth="0.8" opacity="0.7" />
    ))}
  </svg>
);

/* ---------------- Walkthrough slides ---------------- */
const SLIDES = [
  {
    visual: <Constellation size={180} />,
    title: (
      <>Your business, finally <em style={{ fontFamily: fontSerifIt, fontStyle: "italic", color: C.goldSoft }}>documented</em>.</>
    ),
    body: "Answer a guided set of questions and the app builds your business brain — a living set of documents that captures your customers, your offer, your voice, and how you run everything.",
  },
  {
    visual: (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{
          background: C.cream, color: C.ink, padding: 18, borderRadius: 14,
          width: 220, transform: "rotate(-3deg)", boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
          fontFamily: fontMono, fontSize: 12, lineHeight: 1.5,
        }}>
          <div style={{ background: C.goldSoft, height: 70, borderRadius: 8, marginBottom: 12 }} />
          <div style={{ fontFamily: fontSerifIt, fontStyle: "italic" }}>
            "Most people think they need a bigger audience."
          </div>
          <div style={{ marginTop: 8, color: C.mute, fontSize: 10 }}>
            They need a clearer message.
          </div>
          <div style={{ marginTop: 8, color: C.gold, fontSize: 10 }}>#brandvoice #contentstrategy</div>
          <div style={{ marginTop: 10, background: C.ink, color: C.cream, padding: "4px 10px", borderRadius: 999, fontSize: 10, display: "inline-block" }}>Publish</div>
        </div>
      </div>
    ),
    title: (
      <>One post, ready <em style={{ fontFamily: fontSerifIt, fontStyle: "italic", color: C.goldSoft }}>every morning</em>.</>
    ),
    body: "Every day the app generates a personalized brief — image prompt, caption, hook, and hashtags — written in your voice for your audience. Publish directly from the app in one tap.",
  },
  {
    visual: (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32 }}>
        <div style={{ textAlign: "center" }}>
          <Constellation size={80} />
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.mute, letterSpacing: 2, marginTop: 6 }}>DAY 1</div>
        </div>
        <ArrowRight size={20} color={C.gold} />
        <div style={{ textAlign: "center" }}>
          <Constellation size={140} />
          <div style={{ fontFamily: fontMono, fontSize: 10, color: C.mute, letterSpacing: 2, marginTop: 6 }}>DAY 30</div>
        </div>
      </div>
    ),
    title: (
      <>The more you build, the <em style={{ fontFamily: fontSerifIt, fontStyle: "italic", color: C.goldSoft }}>smarter it gets</em>.</>
    ),
    body: "Every task you complete adds to your brain. Every document you generate makes your briefs more accurate. Every tool in the app learns what works for your specific business.",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Stages: 'walk' (0-2), 'setup-name', 'setup-what', then complete
  const [stage, setStage] = useState<"walk" | "name" | "what">("walk");
  const [slide, setSlide] = useState(0);
  const [bizName, setBizName] = useState("");
  const [whatYouDo, setWhatYouDo] = useState("");
  const [saving, setSaving] = useState(false);

  const completeOnboarding = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      localStorage.setItem("cre8_business_name", bizName.trim());
      localStorage.setItem("cre8_business_what", whatYouDo.trim());
      await supabase.from("profiles").update({
        onboarding_completed_at: new Date().toISOString(),
        first_name: bizName.trim() || undefined,
      }).eq("user_id", user.id);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      navigate("/dashboard", { replace: true });
    }
  };

  /* --------- Walkthrough Screen --------- */
  const WalkScreen = () => {
    const s = SLIDES[slide];
    return (
      <div style={{
        background: C.ink, color: C.cream, minHeight: "100vh", display: "flex",
        flexDirection: "column", padding: "32px 24px",
      }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setStage("name")} style={{
            background: "none", border: "none", color: C.cream, opacity: 0.65,
            fontFamily: fontMono, fontSize: 13, cursor: "pointer",
          }}>Skip</button>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}
            >
              <div>{s.visual}</div>
              <h1 style={{
                fontFamily: fontSerifIt, fontStyle: "italic", fontWeight: 400,
                fontSize: "clamp(28px, 4.5vw, 44px)", lineHeight: 1.15, letterSpacing: "-0.01em",
              }}>{s.title}</h1>
              <p style={{
                color: "rgba(250,249,245,0.7)", fontSize: 15, lineHeight: 1.6, maxWidth: 460,
                fontFamily: fontMono,
              }}>{s.body}</p>
            </motion.div>
          </AnimatePresence>

          {/* dots */}
          <div style={{ display: "flex", gap: 8, marginTop: 36 }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} style={{
                width: 6, height: 6, borderRadius: 99, border: "none", padding: 0, cursor: "pointer",
                background: i === slide ? C.gold : "rgba(250,249,245,0.25)",
              }} />
            ))}
          </div>
        </div>

        {slide < SLIDES.length - 1 ? (
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 24 }}>
            <button onClick={() => setSlide(slide + 1)} style={{
              width: 56, height: 56, borderRadius: 99, border: `1px solid rgba(250,249,245,0.25)`,
              background: "transparent", color: C.cream, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 24 }}>
            <button onClick={() => setStage("name")} style={{
              background: C.gold, color: C.ink, border: "none", padding: "16px 32px",
              borderRadius: 999, fontFamily: fontMono, fontSize: 15, fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", minWidth: 280,
              justifyContent: "center",
            }}>
              Build my brain <ArrowRight size={16} />
            </button>
            <p style={{ fontFamily: fontMono, fontSize: 12, color: "rgba(250,249,245,0.55)" }}>
              Already have an account? <a href="/auth" style={{ color: C.goldSoft, textDecoration: "none" }}>Sign in</a>
            </p>
          </div>
        )}
      </div>
    );
  };

  /* --------- Setup Screen --------- */
  const SetupScreen = ({
    label, stepNum, title, hint, value, onChange, onNext, isLast, placeholder, multiline, maxLen,
  }: any) => (
    <div style={{ background: C.cream, color: C.ink, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${C.hairline}` }}>
        {stepNum > 1 ? (
          <button onClick={() => setStage("name")} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink }}>
            <ArrowLeft size={20} />
          </button>
        ) : <div style={{ width: 20 }} />}
        <div style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: 2, color: C.mute, textTransform: "uppercase" }}>
          Step {stepNum} of 2
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px", maxWidth: 640, margin: "0 auto", width: "100%" }}>
        <div style={{ width: 40, height: 1, background: C.ink, marginBottom: 20 }} />
        <div style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: 2, color: C.mute, textTransform: "uppercase", marginBottom: 16 }}>{label}</div>
        <h1 style={{ fontFamily: fontMono, fontWeight: 500, fontSize: "clamp(34px,5vw,52px)", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 16 }}>{title}</h1>
        <p style={{ color: C.mute, fontSize: 15, lineHeight: 1.6, marginBottom: 32, fontFamily: fontMono }}>{hint}</p>

        {multiline ? (
          <textarea
            autoFocus
            value={value}
            maxLength={maxLen}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={5}
            style={{
              width: "100%", background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 14,
              padding: "18px 20px", fontFamily: fontMono, fontSize: 16, color: C.ink, resize: "vertical",
              outline: "none",
            }}
          />
        ) : (
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              width: "100%", background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 14,
              padding: "18px 20px", fontFamily: fontMono, fontSize: 16, color: C.ink, outline: "none",
            }}
          />
        )}
        {maxLen && (
          <div style={{ textAlign: "right", color: C.mute, fontFamily: fontMono, fontSize: 12, marginTop: 8 }}>
            {value.length} / {maxLen}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 28 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: 99, background: i === stepNum ? C.gold : C.hairline }} />
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={!value.trim() || saving}
          style={{
            marginTop: 24, width: "100%", background: isLast ? C.gold : C.ink,
            color: isLast ? C.ink : C.cream, border: "none", padding: "18px 24px",
            borderRadius: 999, fontFamily: fontMono, fontSize: 15, fontWeight: 600,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
            cursor: value.trim() ? "pointer" : "not-allowed", opacity: value.trim() ? 1 : 0.4,
          }}
        >
          {isLast ? <><Sparkles size={16} /> Build my brain</> : <>Next <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  );

  if (stage === "walk") return <WalkScreen />;
  if (stage === "name")
    return (
      <SetupScreen
        label="Let's start"
        stepNum={1}
        title="What's your business name?"
        hint="This appears on your brain, your briefs, and every document the app builds for you."
        value={bizName}
        onChange={setBizName}
        placeholder="e.g., Cre8 Visions"
        onNext={() => setStage("what")}
      />
    );
  return (
    <SetupScreen
      label="Almost there"
      stepNum={2}
      title="What do you do?"
      hint="Write it like you'd say it at a dinner party — not a LinkedIn bio. The more specific, the smarter your briefs become from day one."
      value={whatYouDo}
      onChange={setWhatYouDo}
      placeholder="I help local service businesses get found on Google…"
      multiline
      maxLen={400}
      isLast
      onNext={completeOnboarding}
    />
  );
};

export default Onboarding;

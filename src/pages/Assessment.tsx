import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, RotateCcw, Save, Check, Trophy, Target, Rocket, List, Calendar, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackAssessmentCompletion } from "@/lib/analytics";
import { trackAssessmentComplete } from "@/lib/activityTracking";
import { useAuth } from "@/contexts/AuthContext";
import { getAssessmentData, setAssessmentData, ASSESSMENT_KEYS } from "@/lib/assessmentStorage";
import { AssessmentShell, useAssessmentLayout } from "@/components/assessments/AssessmentShell";
import {
  PageHeader,
  ClayHero,
  InsetSectionsList,
  ProgressStrip,
  OptionButton,
  PrimaryButton,
  Eyebrow,
} from "@/components/assessments/primitives";
import {
  A_HAIR,
  A_INK,
  A_INK_40,
  A_INK_60,
  A_MOSS,
  A_PAPER,
  A_PAPER2,
  A_TERRA,
  FONT_DISPLAY,
  FONT_MONO,
} from "@/components/assessments/tokens";
import { useHaptics } from "@/hooks/useHaptics";

interface Question {
  id: number;
  section: string;
  question: string;
  options: { label: string; text: string; points: number }[];
}

interface SavedAssessment {
  answers: Record<number, number>;
  reflections: Record<string, string>;
  score: number;
  completedAt: string;
}

const questions: Question[] = [
  { id: 1, section: "Pre-Launch Content Strategy", question: "Before opening enrollment, how long do you typically create focused content about your program topic?", options: [{ label: "A", text: "I don't really do focused content beforehand - I just announce when ready", points: 0 }, { label: "B", text: "About 1-2 weeks of occasional posts", points: 1 }, { label: "C", text: "About 3-4 weeks of consistent, focused content", points: 2 }, { label: "D", text: "6-8+ weeks of strategic, targeted content", points: 3 }] },
  { id: 2, section: "Pre-Launch Content Strategy", question: "During the weeks before launch, your content is:", options: [{ label: "A", text: "Random topics - whatever I feel like posting", points: 0 }, { label: "B", text: "Mix of general business tips and some mentions of my topic", points: 1 }, { label: "C", text: "Mostly focused on my transformation but some off-topic posts", points: 2 }, { label: "D", text: "Everything connects directly to the specific transformation I help with", points: 3 }] },
  { id: 3, section: "Pre-Launch Content Strategy", question: "The content you create before launch is designed to:", options: [{ label: "A", text: "Keep me visible - just posting to stay active", points: 0 }, { label: "B", text: "Build my authority as an expert", points: 1 }, { label: "C", text: "Educate my audience about the problem and solution", points: 2 }, { label: "D", text: "Build trust, create desire, and establish momentum toward my offer", points: 3 }] },
  { id: 4, section: "Engagement & Relationship Building", question: "In the weeks before launch, how often do you create opportunities for audience engagement?", options: [{ label: "A", text: "Rarely - I mostly just post content", points: 0 }, { label: "B", text: "Sometimes - occasionally ask questions or go live", points: 1 }, { label: "C", text: "Regularly - weekly lives, questions, or engagement posts", points: 2 }, { label: "D", text: "Consistently - multiple engagement opportunities per week", points: 3 }] },
  { id: 5, section: "Engagement & Relationship Building", question: "How do you interact with people who comment or engage with your content?", options: [{ label: "A", text: "I don't usually respond or respond very briefly", points: 0 }, { label: "B", text: "I like comments or give short replies", points: 1 }, { label: "C", text: "I respond thoughtfully to most comments", points: 2 }, { label: "D", text: "I respond thoughtfully and sometimes move conversations to DMs for deeper connection", points: 3 }] },
  { id: 6, section: "Engagement & Relationship Building", question: "Before launching, you:", options: [{ label: "A", text: "Don't really talk to individual people - just post publicly", points: 0 }, { label: "B", text: "Occasionally respond to DMs but don't initiate conversations", points: 1 }, { label: "C", text: "Regularly engage with active community members", points: 2 }, { label: "D", text: "Intentionally build relationships with core community (20-30 people minimum)", points: 3 }] },
  { id: 7, section: "Trust Building & Social Proof", question: "In your pre-launch content, you share:", options: [{ label: "A", text: "Mostly what I'm launching and why people should buy", points: 0 }, { label: "B", text: "Some valuable tips but mostly about my upcoming program", points: 1 }, { label: "C", text: "Good mix of valuable teaching and program mentions", points: 2 }, { label: "D", text: "Primarily valuable content that helps people, with program naturally mentioned", points: 3 }] },
  { id: 8, section: "Trust Building & Social Proof", question: "How do you demonstrate you can help people achieve the transformation?", options: [{ label: "A", text: "I tell them about my credentials or experience", points: 0 }, { label: "B", text: "I share my own transformation story", points: 1 }, { label: "C", text: "I share my story plus some client results", points: 2 }, { label: "D", text: "I consistently share my journey AND multiple client transformations with specific details", points: 3 }] },
  { id: 9, section: "Trust Building & Social Proof", question: "The testimonials and social proof you use are:", options: [{ label: "A", text: "I don't have testimonials yet or don't share them", points: 0 }, { label: "B", text: "Generic praise like \"This was great!\"", points: 1 }, { label: "C", text: "Some specific results but not very detailed", points: 2 }, { label: "D", text: "Highly specific transformations with before/after details", points: 3 }] },
  { id: 10, section: "Data Gathering & Strategy", question: "During your pre-launch period, you track:", options: [{ label: "A", text: "Nothing specific - I just see what happens", points: 0 }, { label: "B", text: "Basic metrics like follower count", points: 1 }, { label: "C", text: "Engagement rates and which posts do well", points: 2 }, { label: "D", text: "Detailed metrics: engagement, DMs, questions asked, objections, most engaged people", points: 3 }] },
  { id: 11, section: "Data Gathering & Strategy", question: "When people ask questions during pre-launch, you:", options: [{ label: "A", text: "Answer them and move on", points: 0 }, { label: "B", text: "Answer them and remember some patterns", points: 1 }, { label: "C", text: "Answer them and keep a mental note of common questions", points: 2 }, { label: "D", text: "Answer them and document all questions to identify patterns and refine messaging", points: 3 }] },
  { id: 12, section: "Data Gathering & Strategy", question: "Your launch strategy is based on:", options: [{ label: "A", text: "What I think will work or what I've seen others do", points: 0 }, { label: "B", text: "General best practices I've learned", points: 1 }, { label: "C", text: "Some data from past launches plus best practices", points: 2 }, { label: "D", text: "Detailed data from my specific audience's behavior and preferences", points: 3 }] },
  { id: 13, section: "Launch Mindset & Approach", question: "When you announce your program, you feel:", options: [{ label: "A", text: "Nervous, pushy, like I'm bothering people", points: 0 }, { label: "B", text: "Uncertain but hopeful", points: 1 }, { label: "C", text: "Fairly confident - I've prepared well", points: 2 }, { label: "D", text: "Excited and confident - people have been asking for this", points: 3 }] },
  { id: 14, section: "Launch Mindset & Approach", question: "During launch week, you spend most time:", options: [{ label: "A", text: "Convincing and persuading people to buy", points: 0 }, { label: "B", text: "Explaining the program and answering objections", points: 1 }, { label: "C", text: "Answering questions and sharing more value", points: 2 }, { label: "D", text: "Having conversations with prepared, interested people who are ready to decide", points: 3 }] },
  { id: 15, section: "Launch Mindset & Approach", question: "After cart closes, your typical conversion rate is:", options: [{ label: "A", text: "Under 1% of my audience", points: 0 }, { label: "B", text: "1-3% of my audience", points: 1 }, { label: "C", text: "3-5% of my audience", points: 2 }, { label: "D", text: "5%+ of my audience OR 10%+ of my engaged audience", points: 3 }] },
];

const SECTIONS = [
  "Pre-Launch Content Strategy",
  "Engagement & Relationship Building",
  "Trust Building & Social Proof",
  "Data Gathering & Strategy",
  "Launch Mindset & Approach",
];

const reflectionQuestions = [
  { id: "surprise", question: "Which area surprised you most — where you scored higher or lower than expected?" },
  { id: "pillar", question: "Looking at your answers, which of the four pillars do you need to focus on most?" },
  { id: "commitment", question: "What's one specific thing you can commit to improving in your next launch?" },
  { id: "aha", question: "Based on this assessment, what's your biggest \"aha\" moment about prelaunch?" },
];

const getResultCategory = (score: number) => {
  if (score <= 15) return { title: "The Announcer", range: "0–15 points", icon: Target, meaning: "You're currently using an announcement-based approach. You create a program and announce it, hoping people will buy. This typically leads to low conversions and high stress.", significance: "You need to learn the complete prelaunch strategy from scratch. The good news: You have the most room for dramatic improvement.", focus: "Work through this entire course systematically. Pay special attention to Modules 3–5 (Content Foundation, Valuable Content Mastery, and Real Relationships)." };
  if (score <= 30) return { title: "The Partial Prelauncher", range: "16–30 points", icon: Rocket, meaning: "You're doing some prelaunch activities, but not systematically or strategically. You have pieces of the puzzle but not the complete system.", significance: "You understand prelaunch is important, but you're missing key components or not executing them fully.", focus: "Identify which of the four pillars you're weakest in (Targeted Content, Engagement, Trust Building, or Data Gathering) and strengthen those areas." };
  return { title: "The Strategic Prelauncher", range: "31–45 points", icon: Trophy, meaning: "You're already implementing a solid prelaunch strategy. You understand the importance of preparation, relationship-building, and strategic content.", significance: "You're on the right track. This course will help you refine your system, fill any gaps, and learn advanced strategies.", focus: "Look for areas to optimize and scale. Pay special attention to Module 7 (Community Building) and the Bonus Modules on measurement and continuous improvement." };
};

const Assessment = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useAssessmentLayout();
  const haptics = useHaptics();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState<SavedAssessment | null>(null);
  const [showAllReflections, setShowAllReflections] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const saved = getAssessmentData<SavedAssessment & { currentQuestion?: number }>(ASSESSMENT_KEYS.LAUNCH, user.id);
    if (saved) {
      if (saved.completedAt && Object.keys(saved.answers || {}).length === questions.length) {
        setSavedAssessment(saved);
        setAnswers(saved.answers);
        setReflections(saved.reflections || {});
        setShowResults(true);
        setHasStarted(true);
      } else if (saved.answers && Object.keys(saved.answers).length > 0) {
        setAnswers(saved.answers);
        setReflections(saved.reflections || {});
        if (saved.currentQuestion !== undefined) setCurrentQuestion(saved.currentQuestion);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || Object.keys(answers).length === 0) return;
    setAssessmentData(ASSESSMENT_KEYS.LAUNCH, user.id, { answers, reflections, currentQuestion, savedAt: new Date().toISOString() });
  }, [answers, reflections, currentQuestion, user?.id]);

  const totalScore = Object.values(answers).reduce((s, p) => s + p, 0);
  const q = questions[currentQuestion];

  const handleAnswer = (id: number, points: number) => {
    haptics.trigger("selection");
    setAnswers((prev) => ({ ...prev, [id]: points }));
  };
  const handleNext = () => {
    haptics.trigger("light");
    if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
    else setShowResults(true);
  };
  const handlePrev = () => { haptics.trigger("light"); if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1); };
  const handleSaveExit = () => {
    if (user?.id) setAssessmentData(ASSESSMENT_KEYS.LAUNCH, user.id, { answers, reflections, currentQuestion, savedAt: new Date().toISOString() });
    toast({ title: "Saved", description: "You can resume anytime." });
    navigate("/assessments");
  };
  const handleSave = () => {
    if (!user?.id) return;
    const a: SavedAssessment = { answers, reflections, score: totalScore, completedAt: new Date().toISOString() };
    setAssessmentData(ASSESSMENT_KEYS.LAUNCH, user.id, a);
    setSavedAssessment(a);
    trackAssessmentCompletion("Launch Assessment");
    trackAssessmentComplete("launch_assessment", "Launch Assessment", totalScore);
    haptics.trigger("success");
    toast({ title: "Assessment saved" });
    navigate("/assessments");
  };
  const handleRetake = () => {
    setAnswers({}); setReflections({}); setCurrentQuestion(0); setShowResults(false); setHasStarted(true);
  };

  const result = getResultCategory(totalScore);
  const ResultIcon = result.icon;

  // ─── INTRO ──────────────────────────────────
  if (!hasStarted) {
    const sectionItems = SECTIONS.map((title, i) => ({ n: i + 1, title }));
    return (
      <AssessmentShell
        mobile={{
          title: "Assessment",
          onBack: () => navigate("/assessments"),
          bottomSlot: (
            <PrimaryButton fullWidth size="lg" onClick={() => setHasStarted(true)}>
              Begin assessment <ArrowRight size={16} strokeWidth={2.2} />
            </PrimaryButton>
          ),
        }}
      >
        {!isMobile && (
          <PageHeader eyebrow="Launch assessment" title="What's your current launch approach?" lede="Fifteen honest questions across five dimensions. By the end you'll have a clear picture of what's working and which one thing to refine next." />
        )}
        <div style={{ padding: isMobile ? "0 16px" : 0 }}>
          <ClayHero
            eyebrow="Launch assessment"
            title="What's your current launch approach?"
            lede="Fifteen honest questions across five dimensions of your prelaunch."
            pills={[
              { icon: <List size={12} />, text: "15 questions" },
              { icon: <Calendar size={12} />, text: "~10 min" },
              { icon: <Save size={12} />, text: "Save & resume" },
            ]}
          />

          <div style={{ background: "#fff", borderRadius: 18, padding: "16px 18px", boxShadow: "0 1px 2px rgba(31,27,23,0.04)", marginBottom: 14, border: isMobile ? 0 : `1px solid ${A_HAIR}` }}>
            <Eyebrow>Before you begin</Eyebrow>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: A_INK, margin: "6px 0 0", letterSpacing: -0.15 }}>
              Answer based on your most recent launch — or how you'd plan one if you haven't yet. There are no wrong answers.
            </p>
          </div>

          <div style={{ padding: isMobile ? "8px 6px 6px" : "8px 0 12px" }}>
            <Eyebrow color={A_TERRA}>What you'll cover</Eyebrow>
          </div>
          <InsetSectionsList items={sectionItems} trailing={() => <span style={{ fontSize: 12, color: A_INK_40 }}>3 q</span>} />

          {!isMobile && (
            <div style={{ marginTop: 36, display: "flex", gap: 12, alignItems: "center" }}>
              <PrimaryButton onClick={() => setHasStarted(true)} size="lg">
                Begin assessment <ArrowRight size={14} />
              </PrimaryButton>
              <button onClick={() => navigate("/assessments")} style={{ background: "none", border: 0, fontSize: 13, color: A_INK_60, textDecoration: "underline", cursor: "pointer" }}>
                Save for later
              </button>
            </div>
          )}
        </div>
      </AssessmentShell>
    );
  }

  // ─── RESULTS ────────────────────────────────
  if (showResults) {
    const breakdown = SECTIONS.map((name) => {
      const sQs = questions.filter((qq) => qq.section === name);
      const score = sQs.reduce((s, qq) => s + (answers[qq.id] || 0), 0);
      return { name, score, total: sQs.length * 3 };
    });
    return (
      <AssessmentShell
        mobile={{
          title: "Your results",
          onBack: () => navigate("/assessments"),
          bottomSlot: (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleRetake} style={{ background: "rgba(31,27,23,0.06)", color: A_INK, border: 0, borderRadius: 16, padding: "15px 14px", fontSize: 14.5, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <RotateCcw size={15} /> Retake
              </button>
              <PrimaryButton fullWidth size="lg" onClick={handleSave}>
                Save assessment <Check size={16} strokeWidth={2.4} />
              </PrimaryButton>
            </div>
          ),
        }}
      >
        <div style={{ padding: isMobile ? "0 16px" : 0 }}>
          {/* Hero score card */}
          <section style={{
            background: "linear-gradient(155deg, #DCE5DC 0%, #E8E9DD 55%, #EFE4D3 100%)",
            borderRadius: isMobile ? 24 : 18,
            padding: isMobile ? "24px 22px" : "40px 40px 36px",
            position: "relative",
            overflow: "hidden",
            textAlign: "center",
            marginBottom: 18,
          }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,107,82,0.22), transparent 70%)" }} />
            <div style={{ width: isMobile ? 64 : 72, height: isMobile ? 64 : 72, borderRadius: "50%", margin: "0 auto", background: "#fff", border: `1.5px solid ${A_MOSS}`, display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <ResultIcon size={isMobile ? 28 : 32} color={A_MOSS} />
            </div>
            <div style={{ marginTop: 12, display: "inline-block", padding: "4px 12px", borderRadius: 999, background: A_INK, color: A_PAPER, fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 0.6, position: "relative" }}>{result.range}</div>
            <h2 style={{ margin: "12px 0 4px", fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: isMobile ? 24 : 36, lineHeight: 1.1, letterSpacing: -0.5, color: A_INK, position: "relative" }}>{result.title}</h2>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: isMobile ? 56 : 64, letterSpacing: -2.2, color: A_INK, marginTop: 4, lineHeight: 1, position: "relative" }}>
              {totalScore}<span style={{ color: A_INK_40, fontSize: isMobile ? 28 : 32 }}>/45</span>
            </div>
          </section>

          {/* Meaning + focus cards */}
          <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
            <div style={{ background: "#fff", borderRadius: 18, padding: "16px 18px", boxShadow: "0 1px 2px rgba(31,27,23,0.04)", border: isMobile ? 0 : `1px solid ${A_HAIR}` }}>
              <Eyebrow>What this means</Eyebrow>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: A_INK, margin: "6px 0 0" }}>{result.meaning}</p>
            </div>
            <div style={{ background: "#fff", borderRadius: 18, padding: "16px 18px", boxShadow: "0 1px 2px rgba(31,27,23,0.04)", border: isMobile ? 0 : `1px solid ${A_HAIR}` }}>
              <Eyebrow>The significance</Eyebrow>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: A_INK, margin: "6px 0 0" }}>{result.significance}</p>
            </div>
            <div style={{ background: A_INK, color: A_PAPER, borderRadius: 18, padding: "16px 18px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <Target size={14} color={A_TERRA} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: A_TERRA }}>Your focus</span>
              </div>
              <p style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontWeight: 400, fontSize: 16, lineHeight: 1.4, color: A_PAPER, margin: "8px 0 0" }}>{result.focus}</p>
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ padding: "4px 6px 6px" }}>
            <Eyebrow>Section breakdown</Eyebrow>
          </div>
          <div style={{ background: "#fff", borderRadius: 18, padding: "4px 16px", boxShadow: "0 1px 2px rgba(31,27,23,0.04)", border: isMobile ? 0 : `1px solid ${A_HAIR}`, marginBottom: 18 }}>
            {breakdown.map((b, i) => {
              const pct = (b.score / b.total) * 100;
              const full = pct === 100;
              return (
                <div key={b.name} style={{ padding: "14px 0", borderTop: i === 0 ? 0 : `0.5px solid ${A_HAIR}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, gap: 12 }}>
                    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 14.5, letterSpacing: -0.2, color: A_INK, flex: 1 }}>{b.name}</span>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600, color: full ? A_MOSS : A_INK_60 }}>{b.score}/{b.total}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 999, background: "rgba(31,27,23,0.07)", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: full ? A_MOSS : A_TERRA }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reflections */}
          <div style={{ padding: "4px 6px 6px" }}>
            <Eyebrow>Reflection</Eyebrow>
          </div>
          <div style={{ background: "#fff", borderRadius: 18, padding: "16px 18px", boxShadow: "0 1px 2px rgba(31,27,23,0.04)", border: isMobile ? 0 : `1px solid ${A_HAIR}`, marginBottom: 18 }}>
            {(showAllReflections ? reflectionQuestions : reflectionQuestions.slice(0, 1)).map((rq) => (
              <div key={rq.id} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 16, letterSpacing: -0.3, color: A_INK, lineHeight: 1.3 }}>{rq.question}</div>
                <textarea
                  value={reflections[rq.id] || ""}
                  onChange={(e) => setReflections((p) => ({ ...p, [rq.id]: e.target.value }))}
                  placeholder="Write a quick note…"
                  style={{ marginTop: 10, width: "100%", minHeight: 64, resize: "vertical", boxSizing: "border-box", background: A_PAPER2, border: "none", borderRadius: 12, padding: "10px 12px", fontSize: 14, lineHeight: 1.5, color: A_INK, outline: "none", fontFamily: "inherit" }}
                />
              </div>
            ))}
            {!showAllReflections && (
              <button onClick={() => setShowAllReflections(true)} style={{ background: "transparent", border: 0, padding: 0, color: A_TERRA, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                Show {reflectionQuestions.length - 1} more questions ▸
              </button>
            )}
          </div>

          {!isMobile && (
            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", flexWrap: "wrap" }}>
              <PrimaryButton onClick={handleSave}>
                <Check size={13} /> Save assessment
              </PrimaryButton>
              <div style={{ display: "flex", gap: 10 }}>
                <PrimaryButton variant="ghost" onClick={handleRetake}>Retake assessment</PrimaryButton>
                <PrimaryButton variant="terra" onClick={() => navigate("/dashboard")}>
                  Apply to your launch <ArrowRight size={13} />
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </AssessmentShell>
    );
  }

  // ─── QUESTION ───────────────────────────────
  return (
    <AssessmentShell
      mobile={{
        title: `${currentQuestion + 1} of ${questions.length}`,
        onBack: handleSaveExit,
        rightSlot: (
          <button onClick={handleSaveExit} style={{ background: "transparent", border: 0, color: A_TERRA, fontSize: 14.5, fontWeight: 500 }}>Save</button>
        ),
        bottomSlot: (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handlePrev} disabled={currentQuestion === 0} style={{ background: "rgba(31,27,23,0.06)", color: A_INK, border: 0, borderRadius: 16, padding: "15px 18px", fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: currentQuestion === 0 ? 0.4 : 1 }}>
              <ArrowLeft size={15} /> Prev
            </button>
            <PrimaryButton fullWidth size="lg" onClick={handleNext} disabled={answers[q.id] === undefined}>
              {currentQuestion === questions.length - 1 ? "See results" : "Next"} <ArrowRight size={16} strokeWidth={2.2} />
            </PrimaryButton>
          </div>
        ),
      }}
      desktopMaxWidth={760}
    >
      {isMobile ? (
        <>
          <div style={{ padding: "8px 16px 12px" }}>
            <div style={{ height: 4, borderRadius: 999, background: "rgba(31,27,23,0.07)", overflow: "hidden" }}>
              <div style={{ width: `${Math.round(((currentQuestion + 1) / questions.length) * 100)}%`, height: "100%", background: A_TERRA, transition: "width 240ms cubic-bezier(0.22,1,0.36,1)" }} />
            </div>
          </div>
          <div style={{ padding: "8px 22px 4px" }}>
            <Eyebrow color={A_TERRA}>{q.section}</Eyebrow>
          </div>
          <div style={{ padding: "8px 22px 20px" }}>
            <h2 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 24, lineHeight: 1.2, letterSpacing: -0.5, color: A_INK }}>
              {q.question}
            </h2>
          </div>
          <div style={{ padding: "0 16px", display: "grid", gap: 10 }}>
            {q.options.map((o) => (
              <OptionButton key={o.label} letter={o.label} text={o.text} selected={answers[q.id] === o.points} onClick={() => handleAnswer(q.id, o.points)} variant="mobile" />
            ))}
          </div>
        </>
      ) : (
        <>
          <ProgressStrip step={currentQuestion} total={questions.length} section={q.section} />
          <section style={{ background: "#fff", border: `1px solid ${A_HAIR}`, borderRadius: 16, padding: "32px 36px" }}>
            <Eyebrow color={A_TERRA}>Question {currentQuestion + 1}</Eyebrow>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 500, fontSize: 26, letterSpacing: "-0.01em", color: A_INK, margin: "8px 0 24px", lineHeight: 1.25 }}>
              {q.question}
            </h2>
            <div style={{ display: "grid", gap: 10 }}>
              {q.options.map((o) => (
                <OptionButton key={o.label} letter={o.label} text={o.text} selected={answers[q.id] === o.points} onClick={() => handleAnswer(q.id, o.points)} />
              ))}
            </div>
          </section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, gap: 12, flexWrap: "wrap" }}>
            <PrimaryButton variant="ghost" onClick={handlePrev} disabled={currentQuestion === 0}>
              <ArrowLeft size={13} /> Previous
            </PrimaryButton>
            <div style={{ display: "flex", gap: 10 }}>
              <PrimaryButton variant="ghost" onClick={handleSaveExit}>
                <Save size={13} /> Save & exit
              </PrimaryButton>
              <PrimaryButton onClick={handleNext} disabled={answers[q.id] === undefined}>
                {currentQuestion === questions.length - 1 ? "See results" : "Next"} <ArrowRight size={13} />
              </PrimaryButton>
            </div>
          </div>
        </>
      )}
    </AssessmentShell>
  );
};

export default Assessment;

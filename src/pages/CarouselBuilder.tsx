import { useState, useEffect } from "react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Layers,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RefreshCw,
  Trash2,
  Plus,
  Zap,
  Download,
} from "lucide-react";

// ── Types ──

interface Slide {
  slideNumber: number;
  headline: string;
  body: string;
  imagePrompt: string;
  slideType: string;
}

interface ExistingOffer {
  id: string;
  title: string | null;
  target_audience: string | null;
  primary_pain_point: string | null;
  transformation_statement: string | null;
  price: number | null;
  price_type: string | null;
  offer_type: string;
}

// ── Constants ──

const FRAMEWORKS = [
  { name: "Pattern Interrupt", desc: "Stop the scroll with a disruptive opening", sample: "Stop. You've been lied to about this." },
  { name: "Belief Shifting", desc: "Challenge existing beliefs and reframe thinking", sample: "What if everything you knew about X was wrong?" },
  { name: "Beginner Awareness", desc: "Educate newcomers about the problem space", sample: "If you're new to X, this changes everything." },
  { name: "Problem Awareness", desc: "Amplify the pain point they're experiencing", sample: "Here's why you're still stuck at X." },
  { name: "Solution Awareness", desc: "Show them what's possible with a solution", sample: "There's a better way to do X. Here's proof." },
  { name: "Product Awareness", desc: "Position your product as the answer", sample: "This is exactly what I used to go from X to Y." },
  { name: "Authority Builder", desc: "Establish expertise and credibility", sample: "After helping 500+ clients, here's what I know." },
  { name: "Case Study / Proof", desc: "Real results and social proof", sample: "She went from $0 to $5k in 30 days. Here's how." },
  { name: "Myth Busting", desc: "Debunk common misconceptions", sample: "You don't need a big following to make money online." },
  { name: "Comparison / Objection Handling", desc: "Address objections head-on", sample: "Why my students outperform those in $2k courses." },
  { name: "Soft Story Sell", desc: "Narrative-driven persuasion", sample: "I almost quit. Then this happened." },
  { name: "Direct Hard Sell", desc: "Straight to the offer", sample: "This is the only tool you need to launch your offer." },
  { name: "Launch Countdown", desc: "Urgency-driven launch content", sample: "48 hours left. Here's everything inside." },
];

const THEMES: Record<string, { bg: string; text: string; accent: string; label: string; isDark: boolean }> = {
  luxury_beige: { bg: "#1a1410", text: "#f5e6c8", accent: "#c9a96e", label: "Luxury Beige", isDark: true },
  soft_feminine: { bg: "#1f1520", text: "#f7d6e0", accent: "#d4a5c0", label: "Soft Feminine", isDark: true },
  bold_contrast: { bg: "#000000", text: "#ffffff", accent: "#f5c842", label: "Bold Contrast", isDark: true },
  minimal_bw: { bg: "#111111", text: "#eeeeee", accent: "#888888", label: "Minimal B&W", isDark: true },
  digital_neon: { bg: "#0a0a1a", text: "#e0f0ff", accent: "#00d4ff", label: "Digital Neon", isDark: true },
  midnight_purple: { bg: "#0d0a1a", text: "#e8e0ff", accent: "#9b6dff", label: "Midnight Purple", isDark: true },
  deep_ocean: { bg: "#061220", text: "#c0e8ff", accent: "#0088cc", label: "Deep Ocean", isDark: true },
  warm_neutral: { bg: "#faf7f2", text: "#2c2016", accent: "#c9a96e", label: "Warm Neutral", isDark: false },
  cool_gray: { bg: "#f5f5f7", text: "#1a1a2e", accent: "#6b7280", label: "Cool Gray", isDark: false },
  sage_green: { bg: "#f4f7f4", text: "#1a2e1a", accent: "#5a8a5a", label: "Sage Green", isDark: false },
  warm_coral: { bg: "#fff8f5", text: "#2e1a14", accent: "#e06040", label: "Warm Coral", isDark: false },
  soft_lavender: { bg: "#f8f5ff", text: "#1a1428", accent: "#7c5cbf", label: "Soft Lavender", isDark: false },
  clean_white: { bg: "#ffffff", text: "#18181b", accent: "#f5c842", label: "Clean White", isDark: false },
  sky_blue: { bg: "#f0f8ff", text: "#0a1628", accent: "#2970cc", label: "Sky Blue", isDark: false },
};

const FONT_PAIRS = [
  "Playfair+Inter",
  "Montserrat+OpenSans",
  "Poppins+Lato",
  "DMSerif+DMSans",
  "Raleway+Roboto",
  "Lora+SourceSans",
  "BebasNeue+Barlow",
  "SpaceGrotesk",
];

const LAYOUTS = ["Centered", "Split", "Quote", "List", "Gradient", "Card", "Magazine"];

const TONES = [
  { emoji: "🔥", label: "Bold" },
  { emoji: "🎯", label: "Mentor" },
  { emoji: "💅", label: "Sassy" },
  { emoji: "👑", label: "Luxury CEO" },
  { emoji: "🌸", label: "Soft" },
  { emoji: "📊", label: "Data-Driven" },
];

const VOICE_MODIFIERS = ["Hormozi-Style", "Authority", "Soft", "Conversational", "Storyteller"];

const FUNNEL_STAGES = [
  { value: "Top of Funnel", sub: "Awareness" },
  { value: "Middle of Funnel", sub: "Consideration" },
  { value: "Bottom of Funnel", sub: "Decision" },
];

const BUYER_TEMPS = ["❄️ Cold", "☀️ Warm", "🔥 Hot", "🚀 Launch Mode", "🌿 Evergreen"];

const LOADING_MESSAGES = [
  "Selecting the perfect framework...",
  "Writing your hook slide...",
  "Building the narrative arc...",
  "Crafting slide copy...",
  "Adding conversion psychology...",
  "Polishing final slides...",
];

// ── Component ──

const CarouselBuilder = () => {
  const { user } = useAuth();

  // Phase
  const [phase, setPhase] = useState<"brief" | "tone" | "studio">("brief");

  // Offer source
  const [offerSource, setOfferSource] = useState<"existing" | "manual">("manual");
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [existingOffers, setExistingOffers] = useState<ExistingOffer[]>([]);

  // Brief
  const [offer, setOffer] = useState("");
  const [audience, setAudience] = useState("");
  const [painPoint, setPainPoint] = useState("");
  const [cta, setCta] = useState("");
  const [slideCount, setSlideCount] = useState(7);
  const [funnelStage, setFunnelStage] = useState("Top of Funnel");
  const [buyerTemp, setBuyerTemp] = useState("☀️ Warm");
  const [framework, setFramework] = useState("");
  const [showInspiration, setShowInspiration] = useState(false);
  const [inspirationText, setInspirationText] = useState("");

  // Tone
  const [tone, setTone] = useState("Mentor");
  const [voiceModifier, setVoiceModifier] = useState("");
  const [conversionBoost, setConversionBoost] = useState(false);

  // Studio
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [editHeadline, setEditHeadline] = useState("");
  const [editBody, setEditBody] = useState("");
  const [theme, setTheme] = useState("luxury_beige");
  const [fontPair, setFontPair] = useState("Playfair+Inter");
  const [layout, setLayout] = useState("Centered");
  const [copiedSlide, setCopiedSlide] = useState<number | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);

  // Fetch offers
  useEffect(() => {
    if (!user) return;
    supabase
      .from("offers")
      .select("id, title, target_audience, primary_pain_point, transformation_statement, price, price_type, offer_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setExistingOffers(data as ExistingOffer[]);
      });
  }, [user]);

  // Loading message cycling
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => setLoadingMsg((p) => (p + 1) % LOADING_MESSAGES.length), 1500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSelectOffer = (offerId: string) => {
    const o = existingOffers.find((x) => x.id === offerId);
    if (!o) return;
    setSelectedOfferId(offerId);
    setOffer(o.title || "");
    setAudience(o.target_audience || "");
    setPainPoint(o.primary_pain_point || "");
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLoadingMsg(0);
    try {
      const { data, error } = await supabase.functions.invoke("generate-carousel", {
        body: {
          offer,
          audience,
          painPoint,
          cta,
          slideCount,
          funnelStage,
          buyerTemp,
          framework,
          tone,
          voiceModifier,
          conversionBoost,
          inspirationText,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSlides(data.slides);
      setSelectedSlide(0);
      setPhase("studio");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate carousel");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenSingle = async (index: number) => {
    toast.info("Regenerating slide...");
    handleGenerate();
  };

  const handleDeleteSlide = (index: number) => {
    const updated = slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, slideNumber: i + 1 }));
    setSlides(updated);
    if (selectedSlide >= updated.length) setSelectedSlide(Math.max(0, updated.length - 1));
  };

  const handleAddSlide = () => {
    setSlides([...slides, { slideNumber: slides.length + 1, headline: "New Slide", body: "Add your copy here.", imagePrompt: "", slideType: "value" }]);
  };

  const handleSaveEdit = (index: number) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], headline: editHeadline, body: editBody };
    setSlides(updated);
    setEditingSlide(null);
  };

  const copyToClipboard = (text: string, idx?: number) => {
    navigator.clipboard.writeText(text);
    if (idx !== undefined) {
      setCopiedSlide(idx);
      setTimeout(() => setCopiedSlide(null), 1500);
    }
    toast.success("Copied!");
  };

  const copyAllText = () => {
    const text = slides.map((s) => `--- SLIDE ${s.slideNumber} (${s.slideType}) ---\n${s.headline}\n\n${s.body}`).join("\n\n");
    copyToClipboard(text);
  };

  const exportForCanva = () => {
    const text = slides.map((s) => `--- SLIDE ${s.slideNumber} ---\nHEADLINE: ${s.headline}\nBODY: ${s.body}\nIMAGE NOTE: ${s.imagePrompt}`).join("\n\n");
    copyToClipboard(text);
    toast.success("Exported text copied — paste into Canva");
  };

  const currentTheme = THEMES[theme] || THEMES.luxury_beige;
  const headingFont = fontPair.split("+")[0] || "serif";
  const bodyFont = fontPair.split("+")[1] || headingFont;

  const canGenerate = offer.trim() && audience.trim() && painPoint.trim() && framework;

  // ── Render ──

  // PHASE: GENERATING
  if (isGenerating) {
    return (
      <ProjectLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Layers className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-medium text-foreground">{LOADING_MESSAGES[loadingMsg]}</p>
            <p className="text-xs text-muted-foreground">This usually takes 10–15 seconds</p>
          </div>
        </div>
      </ProjectLayout>
    );
  }

  // PHASE: STUDIO
  if (phase === "studio" && slides.length > 0) {
    const current = slides[selectedSlide] || slides[0];

    return (
      <ProjectLayout>
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
          {/* LEFT — Slide list */}
          <div className="w-80 shrink-0 border-r border-border overflow-y-auto bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <button onClick={() => { setPhase("brief"); setSlides([]); }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> New Carousel
              </button>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{slides.length} slides</span>
            </div>

            {slides.map((slide, i) => (
              <div
                key={i}
                onClick={() => { setSelectedSlide(i); setEditingSlide(null); }}
                className={`py-3 px-4 cursor-pointer border-b border-border hover:bg-accent/30 transition-colors group ${selectedSlide === i ? "bg-accent/50 border-l-2 border-l-primary" : ""}`}
              >
                {editingSlide === i ? (
                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <Input value={editHeadline} onChange={(e) => setEditHeadline(e.target.value)} className="text-xs h-8" />
                    <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} className="text-xs" rows={2} />
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleSaveEdit(i)}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingSlide(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Slide {slide.slideNumber}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{slide.slideType}</span>
                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setEditingSlide(i); setEditHeadline(slide.headline); setEditBody(slide.body); }} className="p-1 hover:bg-muted rounded"><Pencil className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleRegenSingle(i); }} className="p-1 hover:bg-muted rounded"><RefreshCw className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSlide(i); }} className="p-1 hover:bg-muted rounded text-destructive"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    <p className="text-sm font-medium line-clamp-2 mt-0.5">{slide.headline}</p>
                  </>
                )}
              </div>
            ))}

            <button onClick={handleAddSlide} className="w-full py-3 px-4 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Slide
            </button>
          </div>

          {/* RIGHT — Preview + controls */}
          <div className="flex-1 overflow-y-auto">
            {/* Controls bar */}
            <div className="border-b border-border px-4 py-3 space-y-3">
              {/* Themes */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mr-1">Theme</span>
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${theme === key ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: t.bg }}
                    title={t.label}
                  />
                ))}
              </div>

              {/* Font pairs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mr-1">Font</span>
                {FONT_PAIRS.map((fp) => (
                  <button
                    key={fp}
                    onClick={() => setFontPair(fp)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors ${fontPair === fp ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    {fp.replace("+", " + ")}
                  </button>
                ))}
              </div>

              {/* Layouts */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mr-1">Layout</span>
                {LAYOUTS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLayout(l)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors ${layout === l ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={copyAllText}><Copy className="w-3 h-3" /> Copy All Text</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={exportForCanva}><Download className="w-3 h-3" /> Export for Canva</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleGenerate}><RefreshCw className="w-3 h-3" /> Remix Carousel</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => toast.info("Coming soon — download will be available soon")}><Download className="w-3 h-3" /> Download Slides</Button>
              </div>
            </div>

            {/* Slide Preview */}
            <div className="p-6 flex flex-col items-center">
              <div
                className="aspect-square max-w-sm w-full rounded-2xl overflow-hidden relative flex items-center justify-center p-8"
                style={{ backgroundColor: currentTheme.bg, color: currentTheme.text, fontFamily: bodyFont }}
              >
                {layout === "Centered" && (
                  <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold leading-tight" style={{ fontFamily: headingFont }}>{current.headline}</h2>
                    <p className="text-sm opacity-80 leading-relaxed">{current.body}</p>
                  </div>
                )}
                {layout === "Split" && (
                  <div className="flex w-full h-full">
                    <div className="w-1/2 flex items-center justify-center" style={{ backgroundColor: currentTheme.accent + "33" }} />
                    <div className="w-1/2 flex flex-col justify-center px-4 space-y-3">
                      <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: headingFont }}>{current.headline}</h2>
                      <p className="text-xs opacity-80 leading-relaxed">{current.body}</p>
                    </div>
                  </div>
                )}
                {layout === "Quote" && (
                  <div className="text-center space-y-3 px-4">
                    <span className="text-5xl opacity-30" style={{ color: currentTheme.accent }}>"</span>
                    <h2 className="text-xl font-bold leading-tight italic" style={{ fontFamily: headingFont }}>{current.headline}</h2>
                    <p className="text-xs opacity-70 leading-relaxed">{current.body}</p>
                  </div>
                )}
                {layout === "List" && (
                  <div className="space-y-3 px-2 w-full">
                    <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: headingFont }}>{current.headline}</h2>
                    {current.body.split(". ").map((item, i) => (
                      <p key={i} className="text-xs opacity-80 flex items-start gap-2">
                        <span style={{ color: currentTheme.accent }}>•</span> {item.trim()}
                      </p>
                    ))}
                  </div>
                )}
                {layout === "Gradient" && (
                  <div className="text-center space-y-4 relative z-10">
                    <div className="absolute inset-0 -z-10 rounded-2xl" style={{ background: `linear-gradient(135deg, ${currentTheme.accent}44, ${currentTheme.bg})` }} />
                    <h2 className="text-2xl font-bold leading-tight" style={{ fontFamily: headingFont }}>{current.headline}</h2>
                    <p className="text-sm opacity-80 leading-relaxed">{current.body}</p>
                  </div>
                )}
                {layout === "Card" && (
                  <div className="rounded-xl p-6 shadow-lg space-y-3" style={{ backgroundColor: currentTheme.isDark ? "#ffffff11" : "#00000008" }}>
                    <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: headingFont }}>{current.headline}</h2>
                    <p className="text-xs opacity-80 leading-relaxed">{current.body}</p>
                  </div>
                )}
                {layout === "Magazine" && (
                  <div className="w-full h-full flex flex-col justify-between relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: currentTheme.accent }} />
                    <h2 className="text-2xl font-bold leading-tight pl-4 pt-2" style={{ fontFamily: headingFont }}>{current.headline}</h2>
                    <p className="text-xs opacity-80 leading-relaxed pl-4 pb-2">{current.body}</p>
                  </div>
                )}

                {/* Slide number badge */}
                <div className="absolute top-3 left-3 text-[9px] font-bold uppercase px-2 py-1 rounded-full" style={{ backgroundColor: currentTheme.accent + "33", color: currentTheme.accent }}>
                  {current.slideType}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-4 mt-4">
                <Button size="sm" variant="ghost" disabled={selectedSlide === 0} onClick={() => setSelectedSlide((p) => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">{selectedSlide + 1} / {slides.length}</span>
                <Button size="sm" variant="ghost" disabled={selectedSlide === slides.length - 1} onClick={() => setSelectedSlide((p) => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5 text-xs"
                onClick={() => copyToClipboard(`${current.headline}\n\n${current.body}`, selectedSlide)}
              >
                {copiedSlide === selectedSlide ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                Copy This Slide
              </Button>
            </div>
          </div>
        </div>
      </ProjectLayout>
    );
  }

  // PHASE: TONE
  if (phase === "tone") {
    return (
      <ProjectLayout>
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Summary card */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-1">
            <p className="text-sm font-semibold text-foreground">{offer}</p>
            <p className="text-xs text-muted-foreground">Framework: <span className="font-medium text-foreground">{framework}</span></p>
            <p className="text-xs text-primary font-medium">Ready to generate</p>
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">How should this carousel feel?</Label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setTone(t.label)}
                  className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${tone === t.label ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Modifier */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Voice Modifier (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {VOICE_MODIFIERS.map((v) => (
                <button
                  key={v}
                  onClick={() => setVoiceModifier(voiceModifier === v ? "" : v)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${voiceModifier === v ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Conversion Boost */}
          <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Conversion Boost</p>
                <p className="text-xs text-muted-foreground">Strengthen hook, tighten CTA, add tension</p>
              </div>
            </div>
            <Switch checked={conversionBoost} onCheckedChange={setConversionBoost} />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPhase("brief")} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back to Brief
            </Button>
            <Button className="flex-1 gap-2" onClick={handleGenerate} disabled={!canGenerate}>
              <Sparkles className="w-4 h-4" /> Generate Carousel
            </Button>
          </div>
        </div>
      </ProjectLayout>
    );
  }

  // PHASE: BRIEF (default)
  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Carousel Builder</h1>
          </div>
          <p className="text-sm text-muted-foreground">Create high-converting Instagram carousels using proven psychological frameworks.</p>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* LEFT — Brief */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">The Brief</h2>
            </div>

            {/* Offer source toggle */}
            <div className="flex gap-2">
              {(["existing", "manual"] as const).map((src) => (
                <button
                  key={src}
                  onClick={() => setOfferSource(src)}
                  className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${offerSource === src ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {src === "existing" ? "Use Existing Offer" : "Enter Manually"}
                </button>
              ))}
            </div>

            {offerSource === "existing" ? (
              <div className="space-y-3">
                <Select onValueChange={handleSelectOffer} value={selectedOfferId || undefined}>
                  <SelectTrigger><SelectValue placeholder="Select an offer" /></SelectTrigger>
                  <SelectContent>
                    {existingOffers.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.title || "Untitled"} — {o.offer_type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedOfferId && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-full">
                    <Check className="w-3 h-3" /> Loaded from your offers
                  </span>
                )}
              </div>
            ) : (
              <div>
                <Label>Offer description *</Label>
                <Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Describe your offer in one sentence" />
              </div>
            )}

            <div>
              <Label>Audience</Label>
              <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Who is this for? e.g. side hustlers who want passive income" />
            </div>

            <div>
              <Label>Pain Point</Label>
              <Textarea value={painPoint} onChange={(e) => setPainPoint(e.target.value)} placeholder="What keeps them up at night?" rows={2} />
            </div>

            <div>
              <Label>CTA (optional)</Label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="e.g. DM 'READY' to grab yours" />
            </div>

            {/* Slide count */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Number of slides</Label>
                <span className="text-sm font-semibold text-primary">{slideCount}</span>
              </div>
              <input
                type="range"
                min={5}
                max={15}
                step={1}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {/* Funnel stage */}
            <div>
              <Label className="mb-2 block">Funnel Stage</Label>
              <div className="flex gap-2 flex-wrap">
                {FUNNEL_STAGES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setFunnelStage(s.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${funnelStage === s.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    {s.value} <span className="text-muted-foreground">({s.sub})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Buyer temp */}
            <div>
              <Label className="mb-2 block">Buyer Temperature</Label>
              <div className="flex gap-2 flex-wrap">
                {BUYER_TEMPS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBuyerTemp(b)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${buyerTemp === b ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Inspiration */}
            <div>
              <button onClick={() => setShowInspiration(!showInspiration)} className="text-xs text-primary font-medium hover:underline">
                Inspired by a viral post? {showInspiration ? "−" : "+"}
              </button>
              {showInspiration && (
                <Textarea
                  value={inspirationText}
                  onChange={(e) => setInspirationText(e.target.value)}
                  placeholder="Paste the viral carousel text or describe the format you want to remix"
                  rows={3}
                  className="mt-2"
                />
              )}
            </div>

            {/* CTA button */}
            <Button
              className="w-full"
              disabled={!framework}
              onClick={() => { if (framework) setPhase("tone"); }}
            >
              {framework ? "Set the Tone →" : "Choose a Framework First →"}
            </Button>
          </div>

          {/* RIGHT — Frameworks */}
          <div className="mt-8 lg:mt-0 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Pick Your Framework</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Each framework uses a unique psychological structure to guide your audience.</p>

            <div className="grid grid-cols-2 gap-3">
              {FRAMEWORKS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setFramework(f.name)}
                  className={`rounded-xl border-2 p-4 cursor-pointer transition-all text-left ${framework === f.name ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                >
                  <p className="text-sm font-bold">{f.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                  <p className="text-xs italic text-muted-foreground/70 mt-2">"{f.sample}"</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProjectLayout>
  );
};

export default CarouselBuilder;

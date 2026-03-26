import { useState, useEffect, useRef, useCallback } from "react";
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
import JSZip from "jszip";
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
  Globe,
  Package,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

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

const THEME_PRESETS: { label: string; bg: string; text: string; accent: string }[] = [
  { label: "Luxury Beige", bg: "#1a1410", text: "#f5e6c8", accent: "#c9a96e" },
  { label: "Soft Feminine", bg: "#1f1520", text: "#f7d6e0", accent: "#d4a5c0" },
  { label: "Bold Contrast", bg: "#000000", text: "#ffffff", accent: "#f5c842" },
  { label: "Minimal B&W", bg: "#111111", text: "#eeeeee", accent: "#888888" },
  { label: "Digital Neon", bg: "#0a0a1a", text: "#e0f0ff", accent: "#00d4ff" },
  { label: "Midnight Purple", bg: "#0d0a1a", text: "#e8e0ff", accent: "#9b6dff" },
  { label: "Deep Ocean", bg: "#061220", text: "#c0e8ff", accent: "#0088cc" },
  { label: "Warm Neutral", bg: "#faf7f2", text: "#2c2016", accent: "#c9a96e" },
  { label: "Cool Gray", bg: "#f5f5f7", text: "#1a1a2e", accent: "#6b7280" },
  { label: "Sage Green", bg: "#f4f7f4", text: "#1a2e1a", accent: "#5a8a5a" },
  { label: "Warm Coral", bg: "#fff8f5", text: "#2e1a14", accent: "#e06040" },
  { label: "Soft Lavender", bg: "#f8f5ff", text: "#1a1428", accent: "#7c5cbf" },
  { label: "Clean White", bg: "#ffffff", text: "#18181b", accent: "#f5c842" },
  { label: "Sky Blue", bg: "#f0f8ff", text: "#0a1628", accent: "#2970cc" },
];

const GOOGLE_FONTS = [
  "Playfair Display", "Inter", "Montserrat", "Open Sans", "Poppins", "Lato",
  "DM Serif Display", "DM Sans", "Raleway", "Roboto", "Lora", "Source Sans 3",
  "Bebas Neue", "Barlow", "Space Grotesk", "Merriweather", "Oswald", "Nunito",
  "PT Serif", "Libre Baskerville", "Cormorant Garamond", "Crimson Text",
  "Work Sans", "Bitter", "Archivo", "Manrope", "Plus Jakarta Sans",
  "Outfit", "Sora", "Lexend", "Urbanist", "Bricolage Grotesque",
  "Fraunces", "Instrument Serif", "Noto Serif", "Spectral",
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

// ── Slide Preview Component ──

const SlidePreview = ({
  slide,
  themeBg,
  themeText,
  themeAccent,
  headingFont,
  bodyFont,
  layout,
  isDarkBg,
  socialHandle,
  handlePosition,
  containerRef,
}: {
  slide: Slide;
  themeBg: string;
  themeText: string;
  themeAccent: string;
  headingFont: string;
  bodyFont: string;
  layout: string;
  isDarkBg: boolean;
  socialHandle: string;
  handlePosition: "top" | "bottom";
  containerRef?: React.Ref<HTMLDivElement>;
}) => {
  const handleBar = socialHandle ? (
    <div
      className="text-center py-2 text-[10px] font-medium tracking-wide opacity-70"
      style={{ color: themeText, fontFamily: bodyFont }}
    >
      {socialHandle}
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className="aspect-square max-w-sm w-full rounded-2xl overflow-hidden relative flex flex-col"
      style={{ backgroundColor: themeBg, color: themeText, fontFamily: bodyFont }}
    >
      {/* Social handle — top */}
      {handlePosition === "top" && handleBar}

      {/* Main content area */}
      <div className="flex-1 relative flex items-center justify-center p-8">
        {layout === "Centered" && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold leading-tight" style={{ fontFamily: headingFont }}>{slide.headline}</h2>
            <p className="text-sm opacity-80 leading-relaxed">{slide.body}</p>
          </div>
        )}
        {layout === "Split" && (
          <div className="flex w-full h-full absolute inset-0">
            <div className="w-1/2 flex items-center justify-center" style={{ backgroundColor: themeAccent + "33" }} />
            <div className="w-1/2 flex flex-col justify-center px-4 space-y-3">
              <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: headingFont }}>{slide.headline}</h2>
              <p className="text-xs opacity-80 leading-relaxed">{slide.body}</p>
            </div>
          </div>
        )}
        {layout === "Quote" && (
          <div className="text-center space-y-3 px-4">
            <span className="text-5xl opacity-30" style={{ color: themeAccent }}>"</span>
            <h2 className="text-xl font-bold leading-tight italic" style={{ fontFamily: headingFont }}>{slide.headline}</h2>
            <p className="text-xs opacity-70 leading-relaxed">{slide.body}</p>
          </div>
        )}
        {layout === "List" && (
          <div className="space-y-3 px-2 w-full">
            <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: headingFont }}>{slide.headline}</h2>
            {slide.body.split(". ").filter(Boolean).map((item, i) => (
              <p key={i} className="text-xs opacity-80 flex items-start gap-2">
                <span style={{ color: themeAccent }}>•</span> {item.trim()}
              </p>
            ))}
          </div>
        )}
        {layout === "Gradient" && (
          <div className="absolute inset-0 flex items-center justify-center p-8" style={{ background: `linear-gradient(135deg, ${themeAccent}, ${themeBg})` }}>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold leading-tight" style={{ fontFamily: headingFont, color: themeText }}>{slide.headline}</h2>
              <p className="text-sm opacity-80 leading-relaxed" style={{ color: themeText }}>{slide.body}</p>
            </div>
          </div>
        )}
        {layout === "Card" && (
          <div className="rounded-xl p-6 shadow-lg space-y-3" style={{ backgroundColor: isDarkBg ? "#ffffff11" : "#00000008" }}>
            <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: headingFont }}>{slide.headline}</h2>
            <p className="text-xs opacity-80 leading-relaxed">{slide.body}</p>
          </div>
        )}
        {layout === "Magazine" && (
          <div className="absolute inset-0 flex flex-col p-8">
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: themeAccent }} />
            <div className="flex-1 flex flex-col justify-center pl-4 space-y-4">
              <h2 className="text-2xl font-bold leading-tight" style={{ fontFamily: headingFont }}>{slide.headline}</h2>
              <div className="w-12 h-0.5" style={{ backgroundColor: themeAccent }} />
              <p className="text-sm opacity-80 leading-relaxed">{slide.body}</p>
            </div>
          </div>
        )}

        {/* Slide type badge */}
        <div className="absolute top-3 left-3 text-[9px] font-bold uppercase px-2 py-1 rounded-full z-10" style={{ backgroundColor: themeAccent + "33", color: themeAccent }}>
          {slide.slideType}
        </div>
      </div>

      {/* Social handle — bottom */}
      {handlePosition === "bottom" && handleBar}
    </div>
  );
};

// ── Component ──

const CarouselBuilder = () => {
  const { user } = useAuth();

  // Phase
  const [phase, setPhase] = useState<"brief" | "tone" | "studio">("brief");

  // Offer pull state
  const [offerPullOpen, setOfferPullOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

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
  const [socialHandle, setSocialHandle] = useState("");

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
  const [themeBg, setThemeBg] = useState("#1a1410");
  const [themeText, setThemeText] = useState("#f5e6c8");
  const [themeAccent, setThemeAccent] = useState("#c9a96e");
  const [headingFont, setHeadingFont] = useState("Playfair Display");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [layout, setLayout] = useState("Centered");
  const [copiedSlide, setCopiedSlide] = useState<number | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [handlePosition, setHandlePosition] = useState<"top" | "bottom">("bottom");
  const [isDownloading, setIsDownloading] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Load projects
  const { data: projects } = useQuery({
    queryKey: ["user-projects-carousel"],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Set default project
  useEffect(() => {
    if (projects?.length && !selectedProjectId) {
      const stored = localStorage.getItem("lastProjectInfo");
      if (stored) {
        try {
          const { id } = JSON.parse(stored);
          if (projects.some((p) => p.id === id)) {
            setSelectedProjectId(id);
            return;
          }
        } catch {}
      }
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Load offers for selected project
  const { data: offers } = useQuery({
    queryKey: ["offers-carousel", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data, error } = await supabase
        .from("offers")
        .select(
          "id, title, slot_type, price, price_type, offer_type, target_audience, transformation_statement, primary_pain_point, main_deliverables"
        )
        .eq("project_id", selectedProjectId)
        .order("slot_position");
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProjectId,
  });

  // Loading message cycling
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => setLoadingMsg((p) => (p + 1) % LOADING_MESSAGES.length), 1500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSelectOffer = (offer: any) => {
    setSelectedOfferId(offer.id);
    setOffer(offer.title || "");
    setAudience(offer.target_audience || "");
    setPainPoint(offer.primary_pain_point || "");
  };

  const clearOffer = () => {
    setSelectedOfferId(null);
    setOffer("");
    setAudience("");
    setPainPoint("");
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setLoadingMsg(0);
    try {
      const { data, error } = await supabase.functions.invoke("generate-carousel", {
        body: {
          offer, audience, painPoint, cta, slideCount, funnelStage, buyerTemp, framework,
          tone, voiceModifier, conversionBoost, inspirationText,
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

  // Download all slides as PNG in a zip
  const handleDownloadSlides = useCallback(async () => {
    setIsDownloading(true);
    toast.info("Rendering slides...");

    try {
      const { toBlob } = await import("html-to-image");
      const zip = new JSZip();

      // Create an offscreen container
      const offscreen = document.createElement("div");
      offscreen.style.position = "fixed";
      offscreen.style.left = "-9999px";
      offscreen.style.top = "0";
      offscreen.style.width = "1080px";
      offscreen.style.height = "1080px";
      document.body.appendChild(offscreen);

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];

        // Create a temporary render container
        const wrapper = document.createElement("div");
        wrapper.style.width = "1080px";
        wrapper.style.height = "1080px";
        wrapper.style.position = "relative";
        offscreen.innerHTML = "";
        offscreen.appendChild(wrapper);

        // Render slide content into wrapper using innerHTML for capture
        const handleHtml = socialHandle
          ? `<div style="text-align:center;padding:16px 0;font-size:14px;font-weight:500;opacity:0.7;color:${themeText};font-family:${bodyFont},sans-serif;letter-spacing:0.05em">${socialHandle}</div>`
          : "";

        const slideTypeBadge = `<div style="position:absolute;top:20px;left:20px;font-size:12px;font-weight:700;text-transform:uppercase;padding:6px 14px;border-radius:999px;background:${themeAccent}33;color:${themeAccent};z-index:10">${slide.slideType}</div>`;

        let contentHtml = "";

        if (layout === "Centered") {
          contentHtml = `<div style="text-align:center;display:flex;flex-direction:column;gap:24px;align-items:center;justify-content:center;height:100%;padding:48px">
            <h2 style="font-size:48px;font-weight:700;line-height:1.15;font-family:${headingFont},sans-serif">${slide.headline}</h2>
            <p style="font-size:20px;opacity:0.8;line-height:1.6">${slide.body}</p>
          </div>`;
        } else if (layout === "Split") {
          contentHtml = `<div style="display:flex;width:100%;height:100%">
            <div style="width:50%;background:${themeAccent}33"></div>
            <div style="width:50%;display:flex;flex-direction:column;justify-content:center;padding:32px;gap:16px">
              <h2 style="font-size:40px;font-weight:700;line-height:1.15;font-family:${headingFont},sans-serif">${slide.headline}</h2>
              <p style="font-size:18px;opacity:0.8;line-height:1.6">${slide.body}</p>
            </div>
          </div>`;
        } else if (layout === "Quote") {
          contentHtml = `<div style="text-align:center;display:flex;flex-direction:column;gap:16px;align-items:center;justify-content:center;height:100%;padding:48px">
            <span style="font-size:80px;opacity:0.3;color:${themeAccent}">"</span>
            <h2 style="font-size:40px;font-weight:700;line-height:1.2;font-style:italic;font-family:${headingFont},sans-serif">${slide.headline}</h2>
            <p style="font-size:18px;opacity:0.7;line-height:1.6">${slide.body}</p>
          </div>`;
        } else if (layout === "List") {
          const items = slide.body.split(". ").filter(Boolean).map(item =>
            `<p style="font-size:18px;opacity:0.8;display:flex;align-items:flex-start;gap:12px"><span style="color:${themeAccent}">•</span>${item.trim()}</p>`
          ).join("");
          contentHtml = `<div style="display:flex;flex-direction:column;gap:16px;padding:48px;justify-content:center;height:100%">
            <h2 style="font-size:40px;font-weight:700;line-height:1.15;font-family:${headingFont},sans-serif">${slide.headline}</h2>
            ${items}
          </div>`;
        } else if (layout === "Gradient") {
          contentHtml = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:48px;background:linear-gradient(135deg,${themeAccent},${themeBg})">
            <div style="text-align:center;display:flex;flex-direction:column;gap:24px">
              <h2 style="font-size:48px;font-weight:700;line-height:1.15;font-family:${headingFont},sans-serif;color:${themeText}">${slide.headline}</h2>
              <p style="font-size:20px;opacity:0.8;line-height:1.6;color:${themeText}">${slide.body}</p>
            </div>
          </div>`;
        } else if (layout === "Card") {
          const cardBg = isDarkBg ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.03)";
          contentHtml = `<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:48px">
            <div style="background:${cardBg};border-radius:16px;padding:40px;box-shadow:0 4px 20px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:16px">
              <h2 style="font-size:40px;font-weight:700;line-height:1.15;font-family:${headingFont},sans-serif">${slide.headline}</h2>
              <p style="font-size:18px;opacity:0.8;line-height:1.6">${slide.body}</p>
            </div>
          </div>`;
        } else if (layout === "Magazine") {
          contentHtml = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:48px">
            <div style="position:absolute;left:0;top:0;bottom:0;width:6px;background:${themeAccent}"></div>
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding-left:24px;gap:24px">
              <h2 style="font-size:48px;font-weight:700;line-height:1.15;font-family:${headingFont},sans-serif">${slide.headline}</h2>
              <div style="width:60px;height:3px;background:${themeAccent}"></div>
              <p style="font-size:20px;opacity:0.8;line-height:1.6">${slide.body}</p>
            </div>
          </div>`;
        }

        wrapper.innerHTML = `
          <div style="width:1080px;height:1080px;background:${layout === "Gradient" ? "transparent" : themeBg};color:${themeText};font-family:${bodyFont},sans-serif;position:relative;display:flex;flex-direction:column;overflow:hidden;border-radius:0">
            ${handlePosition === "top" ? handleHtml : ""}
            <div style="flex:1;position:relative;display:flex;align-items:center;justify-content:center">
              ${slideTypeBadge}
              ${contentHtml}
            </div>
            ${handlePosition === "bottom" ? handleHtml : ""}
          </div>
        `;

        // Wait for fonts to render
        await new Promise(r => setTimeout(r, 200));

        const blob = await toBlob(wrapper, {
          width: 1080,
          height: 1080,
          pixelRatio: 1,
          cacheBust: true,
          style: { margin: "0", padding: "0" },
        });

        if (blob) {
          zip.file(`slide-${String(i + 1).padStart(2, "0")}.png`, blob);
        }
      }

      document.body.removeChild(offscreen);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "carousel-slides.zip";
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${slides.length} slides as ZIP`);
    } catch (err: any) {
      console.error("Download error:", err);
      toast.error("Failed to download slides: " + (err.message || "Unknown error"));
    } finally {
      setIsDownloading(false);
    }
  }, [slides, themeBg, themeText, themeAccent, headingFont, bodyFont, layout, socialHandle, handlePosition]);

  // Load Google Fonts dynamically
  useEffect(() => {
    const families = [...new Set([headingFont, bodyFont])].map(f => f.replace(/ /g, '+')).join('&family=');
    const link = document.getElementById('carousel-google-fonts') as HTMLLinkElement | null;
    const href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
    if (link) {
      link.href = href;
    } else {
      const el = document.createElement('link');
      el.id = 'carousel-google-fonts';
      el.rel = 'stylesheet';
      el.href = href;
      document.head.appendChild(el);
    }
  }, [headingFont, bodyFont]);

  const isDarkBg = (() => {
    const hex = themeBg.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();

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
              {/* Theme: Presets + Custom colors */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Theme Presets</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {THEME_PRESETS.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => { setThemeBg(t.bg); setThemeText(t.text); setThemeAccent(t.accent); }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${themeBg === t.bg && themeText === t.text ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: t.bg }}
                      title={t.label}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Background
                    <input type="color" value={themeBg} onChange={(e) => setThemeBg(e.target.value)} className="w-7 h-7 rounded border border-border cursor-pointer" />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Font Color
                    <input type="color" value={themeText} onChange={(e) => setThemeText(e.target.value)} className="w-7 h-7 rounded border border-border cursor-pointer" />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Accent
                    <input type="color" value={themeAccent} onChange={(e) => setThemeAccent(e.target.value)} className="w-7 h-7 rounded border border-border cursor-pointer" />
                  </label>
                </div>
              </div>

              {/* Fonts */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Header</span>
                  <Select value={headingFont} onValueChange={setHeadingFont}>
                    <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {GOOGLE_FONTS.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Body</span>
                  <Select value={bodyFont} onValueChange={setBodyFont}>
                    <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {GOOGLE_FONTS.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Layout + Handle position */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Layout</span>
                  <Select value={layout} onValueChange={setLayout}>
                    <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LAYOUTS.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {socialHandle && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Handle Position</span>
                    <Select value={handlePosition} onValueChange={(v) => setHandlePosition(v as "top" | "bottom")}>
                      <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top Center</SelectItem>
                        <SelectItem value="bottom">Bottom Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={copyAllText}><Copy className="w-3 h-3" /> Copy All Text</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={exportForCanva}><Download className="w-3 h-3" /> Export for Canva</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleGenerate}><RefreshCw className="w-3 h-3" /> Remix Carousel</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleDownloadSlides} disabled={isDownloading}>
                  <Download className="w-3 h-3" /> {isDownloading ? "Downloading..." : "Download Slides"}
                </Button>
              </div>
            </div>

            {/* Slide Preview */}
            <div className="p-6 flex flex-col items-center">
              <SlidePreview
                slide={current}
                themeBg={themeBg}
                themeText={themeText}
                themeAccent={themeAccent}
                headingFont={headingFont}
                bodyFont={bodyFont}
                layout={layout}
                isDarkBg={isDarkBg}
                socialHandle={socialHandle}
                handlePosition={handlePosition}
                containerRef={previewRef}
              />

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

            {/* Pull from my offers */}
            <div>
              <button
                onClick={() => setOfferPullOpen(!offerPullOpen)}
                className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
              >
                <Package className="w-4 h-4" />
                Pull from my offers {offerPullOpen ? "↑" : "↓"}
              </button>

              {offerPullOpen && (
                <div className="mt-3 space-y-3">
                  {projects && projects.length > 0 ? (
                    <>
                      <Select
                        value={selectedProjectId || ""}
                        onValueChange={setSelectedProjectId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {offers && offers.length > 0 ? (
                        <div className="space-y-2">
                          {offers.map((offer) => (
                            <button
                              key={offer.id}
                              onClick={() => handleSelectOffer(offer)}
                              className={cn(
                                "w-full text-left px-3 py-2.5 rounded-xl border transition-colors text-sm",
                                selectedOfferId === offer.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground flex-1 truncate">
                                  {offer.title || "Untitled offer"}
                                </span>
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {offer.slot_type}
                                </span>
                                {offer.price && (
                                  <span className="text-xs text-muted-foreground">
                                    ${offer.price}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                          {selectedOfferId && (
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-green-600 font-medium">
                                ✓ Offer context loaded
                              </span>
                              <button
                                onClick={clearOffer}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </div>
                      ) : selectedProjectId ? (
                        <p className="text-sm text-muted-foreground">
                          No offers found for this project.
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No projects found. Fill in the details manually below.
                    </p>
                  )}
                </div>
              )}
            </div>

            {offerPullOpen && (
              <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  or fill in manually
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            <div>
              <Label>Offer description *</Label>
              <Input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Describe your offer in one sentence" />
            </div>

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

            {/* Social Handle / Website */}
            <div>
              <Label className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Website or Social Handle (optional)
              </Label>
              <Input
                value={socialHandle}
                onChange={(e) => setSocialHandle(e.target.value)}
                placeholder="e.g. @yourbrand or yourbrand.com"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Displayed on each slide if provided</p>
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ProjectLayout from "@/components/layout/ProjectLayout";

const SECTION_ORDER = [
  "opening-headline",
  "paint-the-problem",
  "look-into-future",
  "introduce-offer",
  "offer-differentiator",
  "the-results",
  "the-features",
  "the-investment",
  "the-guarantee",
  "introduce-yourself",
  "is-this-for-you",
  "why-now",
  "frequent-objections",
  "final-cta",
] as const;

const SECTION_LABELS: Record<string, string> = {
  "opening-headline": "Opening Headline",
  "paint-the-problem": "Paint the Problem",
  "look-into-future": "Look Into the Future",
  "introduce-offer": "Introduce Your Offer",
  "offer-differentiator": "Offer Differentiator",
  "the-results": "The Results",
  "the-features": "The Features",
  "the-investment": "The Investment",
  "the-guarantee": "The Guarantee",
  "introduce-yourself": "Introduce Yourself",
  "is-this-for-you": "Is This For You?",
  "why-now": "Why Now",
  "frequent-objections": "FAQ / Objections",
  "final-cta": "Final Call-to-Action",
};

const LOADING_MESSAGES = [
  "Crafting your opening headline...",
  "Writing the problem section...",
  "Building your offer reveal...",
  "Creating your results section...",
  "Writing objection handling...",
  "Polishing your call-to-action...",
  "Almost done...",
];

export default function SalesPageWriter() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form state
  const [offerName, setOfferName] = useState("");
  const [offerType, setOfferType] = useState("Online Course");
  const [price, setPrice] = useState("");
  const [bigResult, setBigResult] = useState("");
  const [whoItsFor, setWhoItsFor] = useState("");
  const [painPoint, setPainPoint] = useState("");
  const [stoppedBefore, setStoppedBefore] = useState("");
  const [bonuses, setBonuses] = useState("");
  const [guarantee, setGuarantee] = useState("");
  const [tone, setTone] = useState("Warm and Conversational");

  // Output state
  const [sections, setSections] = useState<Record<string, string>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [step]);

  const canGenerate = offerName.trim() && bigResult.trim() && whoItsFor.trim() && painPoint.trim();

  const handleGenerate = async () => {
    setStep(2);
    setLoadingMsgIndex(0);

    try {
      const { data, error } = await supabase.functions.invoke("generate-sales-page", {
        body: {
          offerName,
          offerType,
          price,
          bigResult,
          whoItsFor,
          painPoint,
          stoppedBefore,
          bonuses,
          guarantee,
          tone,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSections(data.sections);
      setStep(3);
    } catch (err) {
      console.error("Sales page generation error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to generate sales page");
      setStep(1);
    }
  };

  const copySection = (index: number) => {
    const key = SECTION_ORDER[index];
    navigator.clipboard.writeText(sections[key] || "");
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAll = () => {
    const text = SECTION_ORDER.map((key) => {
      const label = SECTION_LABELS[key];
      return `=== ${label} ===\n${sections[key] || ""}`;
    }).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success("Full draft copied to clipboard");
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const startOver = () => {
    setStep(1);
    setSections({});
  };

  const stepLabels = ["Your Offer", "Your Audience", "Generate"];

  return (
    <ProjectLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {step === 1 && (
            <>
              {/* Header */}
              <div className="mb-8">
                <button
                  onClick={() => navigate("/ideas")}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Marketing
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-7 h-7 text-blue-500" />
                  <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                    Sales Page Writer
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm">
                  Generate a full sales page draft in seconds — powered by AI.
                </p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {stepLabels.map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                    {i < stepLabels.length - 1 && (
                      <div className="w-12 h-px bg-border mb-4" />
                    )}
                  </div>
                ))}
              </div>

              {/* Form */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                {/* About Your Offer */}
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  About Your Offer
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Offer name *</Label>
                    <Input value={offerName} onChange={(e) => setOfferName(e.target.value)} placeholder="e.g. The CEO Accelerator" />
                  </div>
                  <div>
                    <Label>Offer type</Label>
                    <Select value={offerType} onValueChange={setOfferType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Online Course", "Coaching Program", "Membership", "Digital Product", "Workshop / Bootcamp", "Template or Toolkit"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price</Label>
                    <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$997 or $297/month" />
                  </div>
                  <div>
                    <Label>The big result your offer delivers *</Label>
                    <Textarea
                      rows={2}
                      value={bigResult}
                      onChange={(e) => setBigResult(e.target.value)}
                      placeholder="e.g. Go from overwhelmed solopreneur to confident CEO in 90 days"
                    />
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* About Your Audience */}
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  About Your Audience
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Who it's for *</Label>
                    <Input value={whoItsFor} onChange={(e) => setWhoItsFor(e.target.value)} placeholder="e.g. Female entrepreneurs who want to leave corporate" />
                  </div>
                  <div>
                    <Label>Their biggest pain point *</Label>
                    <Textarea
                      rows={2}
                      value={painPoint}
                      onChange={(e) => setPainPoint(e.target.value)}
                      placeholder="e.g. They're working 60-hour weeks and still not making consistent revenue"
                    />
                  </div>
                  <div>
                    <Label>What's stopped them before</Label>
                    <Textarea
                      rows={2}
                      value={stoppedBefore}
                      onChange={(e) => setStoppedBefore(e.target.value)}
                      placeholder="e.g. They've bought courses before but never implemented"
                    />
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Extras */}
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Extras (optional)
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Key bonuses</Label>
                    <Textarea
                      rows={2}
                      value={bonuses}
                      onChange={(e) => setBonuses(e.target.value)}
                      placeholder="List your bonuses, one per line"
                    />
                  </div>
                  <div>
                    <Label>Your guarantee</Label>
                    <Input value={guarantee} onChange={(e) => setGuarantee(e.target.value)} placeholder="e.g. 30-day money back guarantee" />
                  </div>
                  <div>
                    <Label>Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Warm and Conversational", "Bold and Direct", "Inspirational", "Professional", "Energetic"].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full gap-2">
                  <FileText className="w-4 h-4" />
                  Generate My Sales Page →
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground animate-pulse">
                {LOADING_MESSAGES[loadingMsgIndex]}
              </p>
              <p className="text-xs text-muted-foreground">This usually takes 15–30 seconds</p>
            </div>
          )}

          {step === 3 && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                  Your Sales Page Draft
                </h1>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={startOver}>
                    Start Over
                  </Button>
                  <Button size="sm" className="gap-1.5" onClick={copyAll}>
                    {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedAll ? "Copied!" : "Copy Full Draft"}
                  </Button>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 text-xs font-medium mb-6">
                14 sections generated
              </div>

              <div className="space-y-4">
                {SECTION_ORDER.map((key, index) => (
                  <div key={key} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="bg-muted/50 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="bg-primary/10 text-primary text-[10px] font-bold rounded-full px-2 py-0.5">
                          Block {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {SECTION_LABELS[key]}
                        </span>
                      </div>
                      <button
                        onClick={() => copySection(index)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <div className="px-5 py-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {sections[key] || ""}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </ProjectLayout>
  );
}

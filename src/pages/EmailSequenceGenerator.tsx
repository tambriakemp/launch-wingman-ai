import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  Package,
  X,
} from "lucide-react";
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
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface EmailItem {
  subject: string;
  preview_text: string;
  body: string;
  send_day: string;
  purpose: string;
}

const SEQUENCE_TYPES = [
  { value: "welcome", label: "Welcome / Nurture" },
  { value: "launch", label: "Launch Sequence" },
  { value: "nurture", label: "Long-term Nurture" },
  { value: "onboarding", label: "Onboarding" },
];

const LOADING_MESSAGES = [
  "Planning your sequence arc...",
  "Writing email #1...",
  "Crafting subject lines...",
  "Writing email copy...",
  "Reviewing for consistency...",
  "Polishing final touches...",
];

export default function EmailSequenceGenerator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form state
  const [sequenceType, setSequenceType] = useState("welcome");
  const [offerName, setOfferName] = useState("");
  const [offerType, setOfferType] = useState("Online Course");
  const [price, setPrice] = useState("");
  const [audience, setAudience] = useState("");
  const [transformation, setTransformation] = useState("");
  const [painPoint, setPainPoint] = useState("");
  const [tone, setTone] = useState("Warm and Conversational");
  const [emailCount, setEmailCount] = useState(5);
  const [launchWindow, setLaunchWindow] = useState("5 days");

  // Offer pull state
  const [offerPullOpen, setOfferPullOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  // Output state
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [expandedEmail, setExpandedEmail] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Load projects
  const { data: projects } = useQuery({
    queryKey: ["user-projects-email"],
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
    queryKey: ["offers-email", selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return [];
      const { data, error } = await supabase
        .from("offers")
        .select(
          "id, title, slot_type, price, price_type, offer_type, target_audience, transformation_statement, primary_pain_point, niche, main_deliverables"
        )
        .eq("project_id", selectedProjectId)
        .order("slot_position");
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProjectId,
  });

  // Loading messages cycling
  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [step]);

  const useOffer = (offer: any) => {
    setSelectedOfferId(offer.id);
    setOfferName(offer.title || "");
    setAudience(offer.target_audience || "");
    setTransformation(offer.transformation_statement || "");
    setPainPoint(offer.primary_pain_point || "");
    if (offer.price) {
      setPrice(
        offer.price_type === "recurring"
          ? `$${offer.price}/mo`
          : `$${offer.price}`
      );
    }
    if (offer.offer_type) setOfferType(offer.offer_type);
  };

  const clearOffer = () => {
    setSelectedOfferId(null);
    setOfferName("");
    setAudience("");
    setTransformation("");
    setPainPoint("");
    setPrice("");
    setOfferType("Online Course");
  };

  const canGenerate =
    offerName.trim() &&
    audience.trim() &&
    transformation.trim() &&
    painPoint.trim();

  const handleGenerate = async () => {
    setStep(2);
    setLoadingMsgIndex(0);

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-email-sequence",
        {
          body: {
            sequenceType,
            offerName,
            offerType,
            price,
            audience,
            transformation,
            painPoint,
            tone,
            emailCount,
            launchWindow,
          },
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setEmails(data.emails);
      setExpandedEmail(0);
      setStep(3);
    } catch (err) {
      console.error("Email sequence generation error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to generate email sequence"
      );
      setStep(1);
    }
  };

  const copyEmail = (index: number) => {
    const e = emails[index];
    const text = `SUBJECT: ${e.subject}\nPREVIEW: ${e.preview_text}\n\n${e.body}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyField = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const exportAll = () => {
    const text = emails
      .map(
        (e, i) =>
          `--- Email ${i + 1} — ${e.send_day} ---\nSUBJECT: ${e.subject}\nPREVIEW: ${e.preview_text}\n\n${e.body}`
      )
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success("Full sequence copied to clipboard");
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const startOver = () => {
    setStep(1);
    setEmails([]);
    setExpandedEmail(0);
  };

  const sequenceLabel =
    SEQUENCE_TYPES.find((s) => s.value === sequenceType)?.label || sequenceType;

  return (
    <ProjectLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* ─── STEP 1: Form ─── */}
          {step === 1 && (
            <>
              {/* Header */}
              <div className="mb-8">
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-7 h-7 text-teal-500" />
                  <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                    Email Sequence Generator
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm">
                  Generate a complete email sequence for your offer.
                </p>
              </div>

              {/* Sequence type pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {SEQUENCE_TYPES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSequenceType(s.value)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      sequenceType === s.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Form card */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                {/* Offer pull (collapsible) */}
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
                                  onClick={() => useOffer(offer)}
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

                {/* About Your Offer */}
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  About Your Offer
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Offer name *</Label>
                    <Input
                      value={offerName}
                      onChange={(e) => setOfferName(e.target.value)}
                      placeholder="e.g. The CEO Accelerator"
                    />
                  </div>
                  <div>
                    <Label>Offer type</Label>
                    <Select value={offerType} onValueChange={setOfferType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Online Course",
                          "Coaching Program",
                          "Membership",
                          "Digital Product",
                          "Workshop",
                          "Template / Toolkit",
                        ].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price</Label>
                    <Input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. $997 or $297/month"
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
                    <Input
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="e.g. Female entrepreneurs ready to scale past 6 figures"
                    />
                  </div>
                  <div>
                    <Label>The transformation they get *</Label>
                    <Textarea
                      rows={2}
                      value={transformation}
                      onChange={(e) => setTransformation(e.target.value)}
                      placeholder="e.g. Go from chaotic freelancer to streamlined CEO in 90 days"
                    />
                  </div>
                  <div>
                    <Label>Their biggest pain point *</Label>
                    <Textarea
                      rows={2}
                      value={painPoint}
                      onChange={(e) => setPainPoint(e.target.value)}
                      placeholder="e.g. Overwhelmed, inconsistent income, no systems"
                    />
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Sequence Settings */}
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Sequence Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Number of emails</Label>
                    <Select
                      value={String(emailCount)}
                      onValueChange={(v) => setEmailCount(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 5, 7, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} emails
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {sequenceType === "launch" && (
                    <div>
                      <Label>Launch window</Label>
                      <Select
                        value={launchWindow}
                        onValueChange={setLaunchWindow}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["3 days", "5 days", "7 days", "10 days"].map(
                            (w) => (
                              <SelectItem key={w} value={w}>
                                {w}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label>Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Warm and Conversational",
                          "Bold and Direct",
                          "Inspirational",
                          "Professional",
                          "Story-driven",
                        ].map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Generate Sequence →
                </Button>
              </div>
            </>
          )}

          {/* ─── STEP 2: Generating ─── */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground animate-pulse">
                {LOADING_MESSAGES[loadingMsgIndex]}
              </p>
              <p className="text-xs text-muted-foreground">
                This usually takes 15–30 seconds
              </p>
            </div>
          )}

          {/* ─── STEP 3: Output ─── */}
          {step === 3 && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                    Your Email Sequence
                  </h1>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 text-[11px] font-medium">
                    {sequenceLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={startOver}>
                    Start Over
                  </Button>
                  <Button size="sm" className="gap-1.5" onClick={exportAll}>
                    {copiedAll ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedAll ? "Copied!" : "Export All"}
                  </Button>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 text-xs font-medium mb-6">
                {emails.length} emails ready
              </div>

              <div className="space-y-3">
                {emails.map((email, index) => {
                  const isExpanded = expandedEmail === index;
                  return (
                    <div
                      key={index}
                      className="bg-card border border-border rounded-2xl overflow-hidden"
                    >
                      {/* Header — always visible */}
                      <button
                        onClick={() =>
                          setExpandedEmail(isExpanded ? null : index)
                        }
                        className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer"
                      >
                        <span className="text-[11px] font-bold uppercase tracking-wide bg-primary/10 text-primary rounded-full px-2.5 py-1 shrink-0">
                          {email.send_day}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-semibold text-foreground flex-1",
                            !isExpanded && "truncate"
                          )}
                        >
                          {email.subject}
                        </span>
                        {!isExpanded && (
                          <span className="text-[11px] text-muted-foreground hidden sm:block max-w-[200px] truncate">
                            {email.purpose}
                          </span>
                        )}
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>

                      {/* Body — expanded */}
                      {isExpanded && (
                        <div className="px-5 pb-5 space-y-4">
                          <p className="text-xs text-muted-foreground italic">
                            Purpose: {email.purpose}
                          </p>

                          {/* Subject */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                Subject Line
                              </span>
                              <button
                                onClick={() => copyField(email.subject)}
                                className="p-1 rounded hover:bg-muted transition-colors"
                              >
                                <Copy className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {email.subject}
                            </p>
                          </div>

                          {/* Preview text */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                Preview Text
                              </span>
                              <button
                                onClick={() => copyField(email.preview_text)}
                                className="p-1 rounded hover:bg-muted transition-colors"
                              >
                                <Copy className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </div>
                            <p className="text-sm text-foreground">
                              {email.preview_text}
                            </p>
                          </div>

                          {/* Body */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                Email Body
                              </span>
                              <button
                                onClick={() => copyField(email.body)}
                                className="p-1 rounded hover:bg-muted transition-colors"
                              >
                                <Copy className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </div>
                            <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 rounded-xl p-4 text-foreground">
                              {email.body}
                            </div>
                          </div>

                          {/* Copy full email */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => copyEmail(index)}
                          >
                            {copiedIndex === index ? (
                              <Check className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {copiedIndex === index
                              ? "Copied!"
                              : "Copy Full Email"}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </ProjectLayout>
  );
}

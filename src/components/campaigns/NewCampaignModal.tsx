import { useState } from "react";
import { slugify, buildFinalUrl, generateShortCode, CHANNEL_UTM_DEFAULTS } from "./links/utmHelpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FUNNEL_TYPE_TO_CONFIG } from "@/lib/funnelUtils";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const steps = ["Basics", "Attribution", "Funnel", "Confirm"];
const platforms = [
  { name: "Instagram", icon: "📸" },
  { name: "Facebook", icon: "📘" },
  { name: "Email", icon: "✉️" },
  { name: "YouTube", icon: "▶️" },
  { name: "TikTok", icon: "🎵" },
  { name: "LinkedIn", icon: "💼" },
  { name: "X / Twitter", icon: "𝕏" },
  { name: "Pinterest", icon: "📌" },
  { name: "Skool", icon: "🎓" },
  { name: "Podcast", icon: "🎙️" },
  { name: "Blog / SEO", icon: "✍️" },
  { name: "App", icon: "📱" },
];

const goalLabels: Record<string, string> = {
  revenue: "Revenue",
  leads: "Leads / Email Signups",
  webinar_signups: "Webinar Signups",
  course_enrollments: "Course Enrollments",
  challenge_signups: "Challenge Signups",
  followers: "Followers",
  app_installs: "App Installs",
  traffic: "Traffic",
};

export default function NewCampaignModal({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [autoUtm, setAutoUtm] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
  const [baseDestinationUrl, setBaseDestinationUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: funnels, isLoading: funnelsLoading } = useQuery({
    queryKey: ["campaign-funnels", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("funnels")
        .select("id, funnel_type, niche, target_audience, project_id, projects(name)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id && open,
  });

  const selectedFunnel = funnels?.find((f) => f.id === selectedFunnelId);

  const getFunnelLabel = (funnelType: string) => {
    const configKey = FUNNEL_TYPE_TO_CONFIG[funnelType];
    if (configKey && FUNNEL_CONFIGS[configKey]) return FUNNEL_CONFIGS[configKey].name;
    return funnelType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const reset = () => {
    setStep(0); setName(""); setGoal(""); setStartDate(""); setEndDate("");
    setBudget(""); setGoalTarget(""); setAutoUtm(true); setSelectedPlatforms([]); setSelectedFunnelId(null); setBaseDestinationUrl(""); setSaving(false);
  };

  const handleCreate = async () => {
    if (!user?.id || !name || !goal || !startDate || !goalTarget) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const { data: inserted, error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        name,
        goal,
        status: "draft",
        start_date: startDate,
        end_date: endDate || null,
        budget: budget ? parseFloat(budget) : null,
        goal_target: parseFloat(goalTarget),
        auto_utm: autoUtm,
        platforms: selectedPlatforms,
        funnel_id: selectedFunnelId || null,
      }).select("id").single();
      if (error) throw error;

      // Auto-generate UTM links if enabled
      if (autoUtm && selectedPlatforms.length > 0 && inserted?.id) {
        const campaignSlug = slugify(name);
        const platformMap: Record<string, string> = {
          Instagram: "instagram",
          Facebook: "facebook",
          Email: "email",
          YouTube: "youtube",
          TikTok: "tiktok",
          LinkedIn: "linkedin",
          "X / Twitter": "twitter",
          Pinterest: "pinterest",
          Skool: "skool",
          Podcast: "other",
          "Blog / SEO": "other",
          App: "other",
        };
        const utmRows = selectedPlatforms.map((p) => {
          const ch = platformMap[p] ?? "other";
          const defaults = CHANNEL_UTM_DEFAULTS[ch] ?? { source: ch, medium: "other" };
          const baseUrl = baseDestinationUrl;
          return {
            user_id: user.id,
            campaign_id: inserted.id,
            label: `${p} — link`,
            base_url: baseUrl,
            full_url: buildFinalUrl(baseUrl, { source: defaults.source, medium: defaults.medium, campaign: campaignSlug }, inserted.id),
            utm_source: defaults.source,
            utm_medium: defaults.medium,
            utm_campaign: campaignSlug,
            short_code: generateShortCode(),
            channel: ch,
            status: "active",
          };
        });
        await supabase.from("utm_links").insert(utmRows);
      }

      // Create campaign tag in SureContact for lead tracking (fire and forget)
      if (inserted?.id) {
        supabase.functions.invoke("surecontact-webhook", {
          body: {
            action: "create_campaign_tag",
            campaign_name: name,
          },
        }).catch((err) => console.error("Failed to create campaign tag:", err));
      }

      toast.success("Campaign created");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      onCreated?.();
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">New Campaign</DialogTitle>
        </DialogHeader>

        {/* Modern step indicator */}
        <div className="flex items-center gap-0 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                  i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                  "bg-muted text-muted-foreground"
                )}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={cn(
                  "text-sm font-medium hidden sm:inline",
                  i <= step ? "text-foreground" : "text-muted-foreground"
                )}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("flex-1 h-px mx-3", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basics */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium">Campaign Name</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">Give your campaign a clear, descriptive name</p>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring Launch 2026" />
            </div>
            <div>
              <Label className="text-sm font-medium">Goal</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">What's the primary objective?</p>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="leads">Leads / Email Signups</SelectItem>
                  <SelectItem value="webinar_signups">Webinar Signups</SelectItem>
                  <SelectItem value="course_enrollments">Course Enrollments</SelectItem>
                  <SelectItem value="challenge_signups">Challenge Signups</SelectItem>
                  <SelectItem value="followers">Followers / Audience Growth</SelectItem>
                  <SelectItem value="app_installs">App Installs</SelectItem>
                  <SelectItem value="traffic">Website Traffic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm font-medium">End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Budget (optional)</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">Set a spending limit for this campaign</p>
              <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="$0" />
            </div>
            {goal && (
              <div>
                <Label className="text-sm font-medium">Goal Target *</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
                  {goal === "revenue" ? "Target revenue ($)" :
                    goal === "traffic" ? "Target number of visits" :
                    goal === "followers" ? "Target follower count gain" :
                    `Target number of ${goalLabels[goal]?.toLowerCase() || "conversions"}`}
                </p>
                <Input
                  type="number"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  placeholder={goal === "revenue" ? "$0" : "0"}
                  min="1"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Attribution */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                UTM links help you track where your traffic and conversions are coming from across platforms.
              </p>
              <div className="flex items-center gap-2">
                <Checkbox checked={autoUtm} onCheckedChange={(v) => setAutoUtm(!!v)} id="auto-utm" />
                <Label htmlFor="auto-utm" className="text-sm font-medium">Auto-generate UTM links</Label>
              </div>
            </div>
            {autoUtm && (
              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium">Base Destination URL</Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">The page visitors will land on when they click your links</p>
                  <Input
                    value={baseDestinationUrl}
                    onChange={(e) => setBaseDestinationUrl(e.target.value)}
                    placeholder="https://yourdomain.com/offer"
                    type="url"
                  />
                </div>
                <div>
                <Label className="text-sm font-medium mb-3 block">Select platforms to track</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {platforms.map((p) => (
                    <button key={p.name} onClick={() => togglePlatform(p.name)}
                      className={cn(
                        "border rounded-lg p-3 text-sm transition-all flex items-center gap-2 font-medium",
                        selectedPlatforms.includes(p.name)
                          ? "border-primary bg-primary/10 text-foreground shadow-sm"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                      )}>
                      <span className="text-base">{p.icon}</span>
                      {p.name}
                    </button>
                  ))}
                </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Funnel Selector */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Link this campaign to one of your existing funnels, or skip if this campaign doesn't use one.
              </p>
            </div>
            {funnelsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : !funnels?.length ? (
              <div className="text-center py-10 border border-dashed rounded-lg">
                <p className="text-muted-foreground text-sm">No funnels found.</p>
                <p className="text-xs text-muted-foreground mt-1">Create a project with a funnel first.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {funnels.map((f) => {
                  const projectName = (f as any).projects?.name ?? "Unknown Project";
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFunnelId(selectedFunnelId === f.id ? null : f.id)}
                      className={cn(
                        "w-full text-left border rounded-lg p-3.5 transition-all",
                        selectedFunnelId === f.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{getFunnelLabel(f.funnel_type)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{projectName}</p>
                          {f.target_audience && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{f.target_audience}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {f.niche && <Badge variant="outline" className="text-[10px]">{f.niche}</Badge>}
                          {selectedFunnelId === f.id && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => setSelectedFunnelId(null)}
              className={cn(
                "w-full text-center border border-dashed rounded-lg p-3 text-sm transition-all",
                selectedFunnelId === null && !funnelsLoading
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              Skip — no funnel for this campaign
            </button>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            {/* Campaign Details */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campaign Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Goal</span><span className="font-medium capitalize">{goal ? goalLabels[goal] || goal : "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dates</span><span className="font-medium">{startDate || "—"} → {endDate || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span className="font-medium">{budget ? `$${budget}` : "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Goal Target</span><span className="font-medium">{goalTarget ? (goal === "revenue" ? `$${Number(goalTarget).toLocaleString()}` : Number(goalTarget).toLocaleString()) : "—"}</span></div>
              </div>
            </div>

            {/* Attribution */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attribution</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">UTM Links</span><span className="font-medium">{autoUtm ? "Auto-generated" : "Manual"}</span></div>
                {autoUtm && selectedPlatforms.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Platforms</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {selectedPlatforms.map((p) => (
                        <Badge key={p} variant="secondary" className="text-[11px]">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Funnel */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funnel</h4>
              <div className="text-sm">
                {selectedFunnel ? (
                  <div>
                    <p className="font-medium">{getFunnelLabel(selectedFunnel.funnel_type)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{(selectedFunnel as any).projects?.name}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">None</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={() => step > 0 ? setStep(step - 1) : onOpenChange(false)} disabled={saving}>
            {step > 0 ? "Back" : "Cancel"}
          </Button>
          <Button onClick={() => {
            if (step === 0 && (!name || !goal || !startDate || !goalTarget)) {
              toast.error("Please fill in all required fields including goal target");
              return;
            }
            if (step === 1 && autoUtm && !baseDestinationUrl.trim()) {
              toast.error("Please enter a base destination URL for your UTM links");
              return;
            }
            step < 3 ? setStep(step + 1) : handleCreate();
          }} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</> : step < 3 ? "Next" : "Create Campaign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

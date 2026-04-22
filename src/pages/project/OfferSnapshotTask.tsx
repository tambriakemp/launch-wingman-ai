import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Info,
  Loader2,
  Check,
  Sparkles,
  Eye,
  ArrowRight,
  ShoppingBag,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskEngine } from "@/hooks/useTaskEngine";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { toast } from "sonner";
import { getFunnelConfigKey } from "@/lib/funnelUtils";
import { VoiceSnippetButton } from "@/components/ui/voice-snippet-button";
import { getOfferStackVoiceScript } from "@/data/offerSlotEducation";
import { FunnelDiagram } from "@/components/funnel/FunnelDiagram";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditorialTaskShell } from "@/components/task/EditorialTaskShell";
import { OFFER_TYPES, normalizeOfferType } from "@/components/offers/offerTypes";

const FUNNEL_DESCRIPTIONS: Record<string, string> = {
  content_to_offer: "Content → Offer: Direct content that leads to your offer",
  freebie_email_offer: "Freebie → Email → Offer: Build your list with a lead magnet",
  live_training_offer: "Live Training → Offer: Teach something valuable, then invite to join",
  application_call: "Application → Call: Qualify leads through applications",
  membership: "Membership: Ongoing subscription with continuous value",
  challenge: "Challenge: Short, time-bound experience with focused action",
  launch: "Launch: Time-bound cart open/close with urgency",
};

interface DbOffer {
  id: string;
  slot_type: string | null;
  title: string | null;
  offer_type: string | null;
  price: number | null;
  price_type: string | null;
}

const formatPrice = (price: number | null, priceType: string | null) => {
  if (!price || price === 0) return "Free";
  const suffix =
    priceType === "monthly" || priceType === "/month"
      ? "/mo"
      : priceType === "yearly" || priceType === "/year"
        ? "/yr"
        : "";
  return `$${price}${suffix}`;
};

const humanizeFormat = (value: string | null | undefined) => {
  if (!value) return "";
  return value
    .split(/[-_]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
};

export default function OfferSnapshotTask() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const taskId = "planning_offer_stack";

  const [completedCriteria, setCompletedCriteria] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    isLoading: engineLoading,
    getTaskTemplate,
    completeTask,
    projectTasks,
  } = useTaskEngine({ projectId: projectId || "" });

  const taskTemplate = useMemo(
    () => getTaskTemplate(taskId),
    [getTaskTemplate],
  );
  const projectTask = useMemo(
    () => projectTasks.find((pt) => pt.taskId === taskId),
    [projectTasks],
  );

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const selectedFunnelType = project?.selected_funnel_type;
  const funnelConfigKey = getFunnelConfigKey(selectedFunnelType);
  const funnelConfig = funnelConfigKey ? FUNNEL_CONFIGS[funnelConfigKey] : null;

  // Read-only fetch of offers, scoped to this project + funnel
  const { data: existingOffers = [], isLoading: offersLoading } = useQuery<
    DbOffer[]
  >({
    queryKey: ["offers", projectId, selectedFunnelType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("id, slot_type, title, offer_type, price, price_type")
        .eq("project_id", projectId)
        .eq("funnel_type", selectedFunnelType)
        .order("slot_position", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && !!selectedFunnelType,
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Initialize criteria state from saved input_data
  useEffect(() => {
    if (projectTask && !isInitialized) {
      const inputData = projectTask.inputData as
        | { completedCriteria?: string[] }
        | null;
      if (inputData?.completedCriteria) {
        setCompletedCriteria(inputData.completedCriteria);
      }
      setIsInitialized(true);
    }
  }, [projectTask, isInitialized]);

  const hasOffers = existingOffers.length > 0;
  const firstCriteria = taskTemplate?.completionCriteria?.[0];

  // Auto-check the first criteria when at least one offer exists
  useEffect(() => {
    if (!firstCriteria || !hasOffers) return;
    setCompletedCriteria((prev) =>
      prev.includes(firstCriteria) ? prev : [...prev, firstCriteria],
    );
  }, [hasOffers, firstCriteria]);

  const saveCriteriaToTask = useCallback(
    async (criteria: string[]) => {
      if (!projectId || !userId) return;
      try {
        await supabase
          .from("project_tasks")
          .update({
            input_data: {
              completedCriteria: criteria,
              offerCount: existingOffers.length,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("project_id", projectId)
          .eq("task_id", taskId);
      } catch (error) {
        console.error("Failed to auto-save criteria:", error);
      }
    },
    [projectId, userId, existingOffers.length],
  );

  const handleCriteriaToggle = (criteriaText: string) => {
    setCompletedCriteria((prev) => {
      const next = prev.includes(criteriaText)
        ? prev.filter((c) => c !== criteriaText)
        : [...prev, criteriaText];
      saveCriteriaToTask(next);
      return next;
    });
  };

  const totalCriteria = taskTemplate?.completionCriteria?.length || 0;
  const allCriteriaComplete =
    totalCriteria > 0 && completedCriteria.length === totalCriteria;

  const handleComplete = async () => {
    if (!hasOffers) {
      toast.error("Add at least one offer in the Offer Library first.");
      return;
    }
    if (!allCriteriaComplete) {
      toast.error("Please check off every item before completing.");
      return;
    }

    setIsSaving(true);
    try {
      await completeTask(taskId, {
        completedCriteria,
        offerCount: existingOffers.length,
      });
      toast.success("Offer stack mapped! Onward to the next step.");
      navigate(`/projects/${projectId}/dashboard`);
    } catch (error) {
      console.error("Complete error:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveForLater = async () => {
    setIsSaving(true);
    try {
      await saveCriteriaToTask(completedCriteria);
      toast.success("Progress saved!");
      navigate(`/projects/${projectId}/dashboard`);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (engineLoading || projectLoading || !project || !taskTemplate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!selectedFunnelType) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link
            to={`/projects/${projectId}/dashboard`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="p-6 rounded-xl bg-muted/50 border border-border text-center">
            <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-medium mb-2">No Launch Path Selected</h2>
            <p className="text-muted-foreground mb-4">
              Please complete the "Choose how you'll sell your offer" task first.
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}/dashboard`)}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const timeRange = `${taskTemplate.estimatedMinutesMin}–${taskTemplate.estimatedMinutesMax} minutes`;
  const expectedSlotCount = funnelConfig?.offerSlots?.length ?? existingOffers.length;
  const configuredCount = existingOffers.length;
  const goToLibrary = () => navigate(`/projects/${projectId}/offer`);

  return (
    <EditorialTaskShell
      projectId={projectId!}
      taskId={taskId}
      phase={taskTemplate.phase}
      title={taskTemplate.title}
      whyItMatters={taskTemplate.whyItMatters}
      instructions={taskTemplate.instructions}
      estimatedTimeRange={timeRange}
      voiceButton={
        <VoiceSnippetButton
          taskId={`offer_stack_${selectedFunnelType}`}
          script={getOfferStackVoiceScript(selectedFunnelType)}
        />
      }
      footer={
        <>
          <h2 className="editorial-eyebrow mb-4">This step is complete when:</h2>
          <div className="space-y-3 mb-5">
            {taskTemplate.completionCriteria.map((criteria, index) => {
              const checked = completedCriteria.includes(criteria);
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border border-hairline bg-white"
                >
                  <Checkbox
                    id={`criteria-${index}`}
                    checked={checked}
                    onCheckedChange={() => handleCriteriaToggle(criteria)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`criteria-${index}`}
                    className="text-sm text-ink-800 cursor-pointer leading-relaxed"
                  >
                    {criteria}
                  </Label>
                </div>
              );
            })}
          </div>

          {allCriteriaComplete ? (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-800">
              <Check className="w-4 h-4" />
              You're ready to save and continue!
            </div>
          ) : (
            <p className="mb-5 text-xs text-fg-muted">
              Check off all items above before saving and marking complete.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleComplete}
              className="flex-1"
              disabled={!allCriteriaComplete || !hasOffers || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & mark complete →"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSaveForLater}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save for Later"}
            </Button>
          </div>

          <p className="text-xs text-fg-muted mt-4 text-center">
            You can always come back and adjust your offers later.
          </p>
        </>
      }
    >
      {/* Funnel Context Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20"
      >
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-1">
              Your selected path:{" "}
              {FUNNEL_DESCRIPTIONS[selectedFunnelType] || selectedFunnelType}
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              We've suggested offer slots based on this path. These are patterns,
              not requirements — customize them to fit your strategy.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {funnelConfig && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="w-4 h-4" />
                      View funnel diagram
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <span className={funnelConfig.color}>
                          {funnelConfig.name}
                        </span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-sm text-muted-foreground mb-4">
                        {funnelConfig.description}
                      </p>
                      <FunnelDiagram
                        steps={funnelConfig.steps}
                        color={funnelConfig.color}
                        bgColor={funnelConfig.bgColor}
                      />
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center">
                          Your offer slots map to key stages in this funnel
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Primary CTA — open the standalone Offer Library */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-10 rounded-2xl border border-hairline bg-white p-6 sm:p-7"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(198,90,62,0.12)" }}
          >
            <ShoppingBag className="w-5 h-5 text-terracotta" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-[20px] sm:text-[22px] leading-snug text-ink-900 tracking-[-0.01em] mb-1">
              Build your offers in the Offer Library
            </h3>
            <p className="text-[14px] leading-relaxed text-ink-800/80 m-0">
              Your offers live in one place across this project. Open the library
              to add, edit, or reorder them — they'll appear here automatically.
            </p>
          </div>
          <Button onClick={goToLibrary} className="shrink-0 gap-2">
            Open Offer Library
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Offers in your stack */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="editorial-eyebrow">Offers in your stack</h2>
          <span className="font-mono text-[12px] text-fg-muted">
            {configuredCount} / {Math.max(expectedSlotCount, configuredCount)}{" "}
            configured
          </span>
        </div>

        {offersLoading ? (
          <div className="rounded-xl border border-hairline bg-white p-8 flex items-center justify-center text-fg-muted text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading your offers…
          </div>
        ) : existingOffers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline bg-paper-50 p-8 text-center">
            <ShoppingBag className="w-7 h-7 text-fg-muted mx-auto mb-3" />
            <p className="text-[15px] text-ink-900 font-medium mb-1">
              No offers yet.
            </p>
            <p className="text-[13.5px] text-fg-muted mb-5">
              Open the library to add your first one.
            </p>
            <Button onClick={goToLibrary} variant="outline" className="gap-2">
              Open Offer Library
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {existingOffers.map((offer) => {
              const typeKey = normalizeOfferType(offer.slot_type);
              const meta = OFFER_TYPES[typeKey];
              const isConfigured = !!(offer.title?.trim() || offer.offer_type);
              const subtitle = [
                humanizeFormat(offer.offer_type),
                formatPrice(offer.price, offer.price_type),
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <li key={offer.id}>
                  <button
                    type="button"
                    onClick={goToLibrary}
                    className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl border border-hairline bg-white hover:border-ink-300 hover:bg-paper-50 transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-ink-300 shrink-0" />
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-[0.04em] uppercase shrink-0"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14.5px] text-ink-900 font-medium truncate">
                        {offer.title?.trim() || "Untitled offer"}
                      </div>
                      {subtitle && (
                        <div className="text-[12.5px] text-fg-muted truncate mt-0.5">
                          {subtitle}
                        </div>
                      )}
                    </div>
                    {isConfigured && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-fg-muted shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </EditorialTaskShell>
  );
}

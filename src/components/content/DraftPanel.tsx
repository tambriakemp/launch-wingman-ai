import { useState, useEffect } from "react";
import { Loader2, Wand2, Copy, Check, Trash2, CalendarPlus, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type { SavedItem } from "./SavedIdeasSection";

interface TalkingPoint {
  id: string;
  title: string;
  description: string;
  contentType: string;
}

interface AudienceData {
  target_audience?: string | null;
  desired_outcome?: string | null;
  primary_pain_point?: string | null;
  niche?: string | null;
}

interface SlotInfo {
  phase: string;
  dayNumber: number;
}

interface DraftPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  talkingPoint: TalkingPoint | null;
  savedItem?: SavedItem | null;
  currentPhase: string;
  funnelType: string | null;
  audienceData: AudienceData | null;
  slotInfo?: SlotInfo | null;
  onSlotAssign?: (slotInfo: SlotInfo) => void;
}

type ToneAdjustment = "simplify" | "shorter" | "calmer" | "direct";

const PHASES = [
  { value: "pre-launch-week-1", label: "Pre-Launch: Week 1" },
  { value: "pre-launch-week-2", label: "Pre-Launch: Week 2" },
  { value: "pre-launch-week-3", label: "Pre-Launch: Week 3" },
  { value: "pre-launch-week-4", label: "Pre-Launch: Week 4" },
  { value: "launch", label: "Launch Week" },
];

const DAYS = [
  { value: 1, label: "Day 1" },
  { value: 2, label: "Day 2" },
  { value: 3, label: "Day 3" },
  { value: 4, label: "Day 4" },
  { value: 5, label: "Day 5" },
  { value: 6, label: "Day 6" },
  { value: 7, label: "Day 7" },
];

// Category-specific guidance text shown in the draft panel
const CATEGORY_GUIDANCE: Record<string, string> = {
  general: "Share a perspective or realization that helps your audience feel understood.",
  stories: "Start with a moment, question, or thought — not an explanation.",
  offer: "Explain this as if you're talking to someone who's curious, not convinced.",
  "behind-the-scenes": "Write this like you're thinking out loud.",
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  stories: "Story",
  offer: "Offer",
  "behind-the-scenes": "Behind the Scenes",
};

export const DraftPanel = ({
  open,
  onOpenChange,
  projectId,
  talkingPoint,
  savedItem,
  currentPhase,
  funnelType,
  audienceData,
  slotInfo,
  onSlotAssign,
}: DraftPanelProps) => {
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [adjusting, setAdjusting] = useState<ToneAdjustment | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingToTimeline, setAddingToTimeline] = useState(false);
  
  // Timeline assignment state
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string>("pre-launch-week-1");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isAssigned, setIsAssigned] = useState(false);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Determine the content type from either source
  const contentType = savedItem?.contentType || talkingPoint?.contentType || "general";
  const isEditingExisting = !!savedItem;

  // Load content when panel opens
  useEffect(() => {
    if (open) {
      if (savedItem) {
        // Opening a saved item for viewing/editing
        setTitle(savedItem.title);
        setDraft(savedItem.content);
        setIsAssigned(false);
        setTimelineOpen(false);
      } else if (talkingPoint) {
        // Creating new draft from talking point
        setTitle(talkingPoint.title);
        generateDraft();
        setIsAssigned(false);
        setTimelineOpen(false);
      }
      
      // If slotInfo is provided, pre-fill the assignment
      if (slotInfo) {
        setSelectedPhase(slotInfo.phase);
        setSelectedDay(slotInfo.dayNumber);
        setIsAssigned(true);
      }
    }
  }, [open, talkingPoint, savedItem, slotInfo]);

  const generateDraft = async () => {
    if (!talkingPoint) return;
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content-draft", {
        body: {
          projectId,
          talkingPoint,
          currentPhase,
          funnelType,
          audienceData,
          contentType: talkingPoint.contentType || "general",
        },
      });

      if (error) throw error;

      if (data?.draft) {
        setDraft(data.draft);
      }
    } catch (error) {
      console.error("Error generating draft:", error);
      setDraft(`${talkingPoint.description}\n\nShare your thoughts on this...`);
    } finally {
      setGenerating(false);
    }
  };

  const adjustTone = async (adjustment: ToneAdjustment) => {
    if (!draft) return;
    
    setAdjusting(adjustment);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content-draft", {
        body: {
          projectId,
          existingDraft: draft,
          adjustment,
          audienceData,
          contentType,
        },
      });

      if (error) throw error;

      if (data?.draft) {
        setDraft(data.draft);
      }
    } catch (error) {
      console.error("Error adjusting draft:", error);
      toast.error("Failed to adjust draft");
    } finally {
      setAdjusting(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToTimeline = async () => {
    if (!user || !title.trim()) return;
    
    setAddingToTimeline(true);
    try {
      const { error } = await supabase.from("content_planner").insert({
        project_id: projectId,
        user_id: user.id,
        phase: selectedPhase,
        day_number: selectedDay,
        time_of_day: "morning",
        title: title || "Untitled post",
        description: talkingPoint?.description || "",
        content_type: contentType,
        content: draft || null,
        status: draft ? "draft" : "planned",
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      setIsAssigned(true);
      setTimelineOpen(false);
      
      const phaseLabel = PHASES.find(p => p.value === selectedPhase)?.label || selectedPhase;
      toast.success(`Added to ${phaseLabel}, Day ${selectedDay}`);
      
      if (onSlotAssign) {
        onSlotAssign({ phase: selectedPhase, dayNumber: selectedDay });
      }
    } catch (error) {
      console.error("Error adding to timeline:", error);
      toast.error("Failed to add to timeline");
    } finally {
      setAddingToTimeline(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user || !draft.trim()) return;
    
    setSaving(true);
    try {
      if (savedItem && savedItem.type === "draft") {
        // Update existing draft
        const { error } = await supabase
          .from("content_drafts")
          .update({
            title: title || "Untitled draft",
            content: draft,
          })
          .eq("id", savedItem.id);

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["content-drafts", projectId] });
        toast.success("Draft updated");
      } else {
        // Create new draft
        const { error } = await supabase.from("content_drafts").insert({
          project_id: projectId,
          user_id: user.id,
          title: title || "Untitled draft",
          content: draft,
          content_type: contentType,
          phase: currentPhase,
          funnel_type: funnelType,
        });

        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ["content-drafts", projectId] });
        toast.success("Draft saved");
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!savedItem) return;
    
    setDeleting(true);
    try {
      const table = savedItem.type === "draft" ? "content_drafts" : "content_ideas";
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", savedItem.id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: [savedItem.type === "draft" ? "content-drafts" : "content-ideas", projectId] });
      toast.success("Removed");
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to remove");
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setDraft("");
    setTitle("");
    setIsAssigned(false);
    setTimelineOpen(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Draft title..."
              className="w-full bg-transparent border-none outline-none text-lg font-semibold text-foreground placeholder:text-muted-foreground"
            />
          </SheetTitle>
          {/* Show category and context subtly */}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {CATEGORY_LABELS[contentType] || "General"}
            </Badge>
            {savedItem?.phase && (
              <span className="text-xs text-muted-foreground">
                Saved during {savedItem.phase} phase
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {generating ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Creating your draft...
              </span>
            </div>
          ) : (
            <>
              {/* Category-specific guidance */}
              <p className="text-sm text-muted-foreground italic">
                {CATEGORY_GUIDANCE[contentType] || CATEGORY_GUIDANCE.general}
              </p>

              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Your draft will appear here..."
                className="min-h-[200px] resize-none"
              />

              {/* Timeline Assignment Section */}
              <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between",
                      isAssigned && "border-primary/50 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <CalendarPlus className="w-4 h-4" />
                      {isAssigned ? (
                        <span>
                          Assigned to {PHASES.find(p => p.value === selectedPhase)?.label}, Day {selectedDay}
                        </span>
                      ) : (
                        <span>Add to Launch Timeline</span>
                      )}
                    </div>
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform",
                      timelineOpen && "rotate-180"
                    )} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phase">Week</Label>
                      <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                        <SelectTrigger id="phase">
                          <SelectValue placeholder="Select week" />
                        </SelectTrigger>
                        <SelectContent>
                          {PHASES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="day">Day</Label>
                      <Select 
                        value={selectedDay.toString()} 
                        onValueChange={(v) => setSelectedDay(parseInt(v))}
                      >
                        <SelectTrigger id="day">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((d) => (
                            <SelectItem key={d.value} value={d.value.toString()}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={handleAddToTimeline}
                    disabled={addingToTimeline || !title.trim()}
                    className="w-full"
                  >
                    {addingToTimeline && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isAssigned ? "Update Assignment" : "Add to Timeline"}
                  </Button>
                </CollapsibleContent>
              </Collapsible>

              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Adjust tone
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustTone("simplify")}
                    disabled={!!adjusting || !draft}
                  >
                    {adjusting === "simplify" ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Simplify
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustTone("shorter")}
                    disabled={!!adjusting || !draft}
                  >
                    {adjusting === "shorter" ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : null}
                    Make it shorter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustTone("calmer")}
                    disabled={!!adjusting || !draft}
                  >
                    {adjusting === "calmer" ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : null}
                    Calmer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustTone("direct")}
                    disabled={!!adjusting || !draft}
                  >
                    {adjusting === "direct" ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : null}
                    More direct
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  disabled={!draft}
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  onClick={handleSaveDraft}
                  disabled={!draft.trim() || saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isEditingExisting && savedItem?.type === "draft" ? "Update" : "Save draft"}
                </Button>
                {isEditingExisting && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-muted-foreground hover:text-destructive ml-auto"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Here when you're ready. No pressure.
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

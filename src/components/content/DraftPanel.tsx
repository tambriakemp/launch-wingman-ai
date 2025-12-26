import { useState, useEffect } from "react";
import { Loader2, Wand2, Copy, Check, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
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
}

type ToneAdjustment = "simplify" | "shorter" | "calmer" | "direct";

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
}: DraftPanelProps) => {
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [adjusting, setAdjusting] = useState<ToneAdjustment | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      } else if (talkingPoint) {
        // Creating new draft from talking point
        setTitle(talkingPoint.title);
        generateDraft();
      }
    }
  }, [open, talkingPoint, savedItem]);

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

import { useState, useEffect } from "react";
import { Loader2, Wand2, Copy, Check } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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

interface DraftPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  talkingPoint: TalkingPoint | null;
  currentPhase: string;
  funnelType: string | null;
  audienceData: AudienceData | null;
}

type ToneAdjustment = "simplify" | "shorter" | "calmer" | "direct";

// Category-specific guidance text shown in the draft panel
const CATEGORY_GUIDANCE: Record<string, string> = {
  general: "Share a perspective or realization that helps your audience feel understood.",
  stories: "Start with a moment, question, or thought — not an explanation.",
  offer: "Explain this as if you're talking to someone who's curious, not convinced.",
  "behind-the-scenes": "Write this like you're thinking out loud.",
};

export const DraftPanel = ({
  open,
  onOpenChange,
  projectId,
  talkingPoint,
  currentPhase,
  funnelType,
  audienceData,
}: DraftPanelProps) => {
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [adjusting, setAdjusting] = useState<ToneAdjustment | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Generate draft when panel opens with a talking point
  useEffect(() => {
    if (open && talkingPoint) {
      setTitle(talkingPoint.title);
      generateDraft();
    }
  }, [open, talkingPoint]);

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
      // Fallback to a simple draft
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
          contentType: talkingPoint?.contentType || "general",
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
      const { error } = await supabase.from("content_drafts").insert({
        project_id: projectId,
        user_id: user.id,
        title: title || "Untitled draft",
        content: draft,
        content_type: "general",
        phase: currentPhase,
        funnel_type: funnelType,
      });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["content-drafts", projectId] });
      toast.success("Draft saved");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
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
        <SheetHeader className="mb-6">
          <SheetTitle>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Draft title..."
              className="w-full bg-transparent border-none outline-none text-lg font-semibold text-foreground placeholder:text-muted-foreground"
            />
          </SheetTitle>
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
                {CATEGORY_GUIDANCE[talkingPoint?.contentType || "general"] || CATEGORY_GUIDANCE.general}
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
                  Save draft
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Drafts are saved for later. No pressure to post.
              </p>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

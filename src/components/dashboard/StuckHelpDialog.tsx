import { useState } from "react";
import { Loader2, Sparkles, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface StuckHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTask: {
    title: string;
    whyItMatters: string;
  };
  projectContext?: string;
}

interface AIHelpResponse {
  reassurance: string;
  steps: string[];
  doThisNow: string;
}

export const StuckHelpDialog = ({
  open,
  onOpenChange,
  currentTask,
  projectContext,
}: StuckHelpDialogProps) => {
  const isMobile = useIsMobile();
  const [blockingIssue, setBlockingIssue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIHelpResponse | null>(null);

  const handleGetHelp = async () => {
    if (!blockingIssue.trim()) {
      toast.error("Please describe what's blocking you");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-stuck-help", {
        body: {
          blockingIssue,
          currentTask: currentTask.title,
          taskContext: currentTask.whyItMatters,
          projectContext,
        },
      });

      if (error) throw error;
      setResponse(data);
    } catch (error) {
      console.error("Error getting help:", error);
      toast.error("Couldn't get help right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setBlockingIssue("");
    setResponse(null);
    onOpenChange(false);
  };

  // One body shared between mobile drawer and desktop dialog so padding,
  // typography, and behavior stay identical across surfaces.
  const body = (
    <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="space-y-2">
        <p className="eyebrow">Stuck Help</p>
        <h2 className="font-serif text-2xl font-medium text-foreground tracking-tight flex items-baseline gap-2">
          <Sparkles className="w-5 h-5 self-center text-[hsl(var(--terracotta-500))]" />
          <span>
            What's <em className="italic text-[hsl(var(--terracotta-500))]">blocking</em> you right now?
          </span>
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {response
            ? "Here's a way through. Take what helps; leave the rest."
            : "Describe what you're struggling with, and I'll help break it down into manageable steps."}
        </p>
      </div>

      {!response ? (
        <>
          <div className="rounded-[14px] border border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-200))] px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--fg-muted))] mb-1">
              Current task
            </div>
            <div className="font-serif text-[16px] leading-snug text-[hsl(var(--ink-900))]">
              {currentTask.title}
            </div>
          </div>

          <Textarea
            placeholder="e.g., I'm not sure how to describe my ideal client, I keep getting stuck on who to target..."
            value={blockingIssue}
            onChange={(e) => setBlockingIssue(e.target.value)}
            rows={5}
            className="resize-none rounded-[14px] bg-[hsl(var(--paper-50))] text-[16px] border-[hsl(var(--border-hairline))] focus-visible:border-[hsl(var(--terracotta-500))] focus-visible:ring-0"
          />

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleGetHelp}
              disabled={isLoading}
              size="lg"
              className="rounded-full bg-[hsl(var(--ink-900))] text-[hsl(var(--paper-100))] hover:bg-[hsl(var(--ink-900)/0.9)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Thinking...
                </>
              ) : (
                "Get help"
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-[14px] border border-[hsl(var(--terracotta-500)/0.25)] bg-[hsl(var(--terracotta-500)/0.06)] p-4">
            <p className="font-serif italic text-[15px] leading-[1.55] text-[hsl(var(--ink-900))]">
              {response.reassurance}
            </p>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--fg-muted))] mb-3">
              Break it down
            </div>
            <div className="space-y-3">
              {response.steps.map((step, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-[hsl(var(--paper-200))] flex items-center justify-center shrink-0 font-mono text-[12px] font-semibold text-[hsl(var(--ink-900))]">
                    {index + 1}
                  </div>
                  <p className="text-[14.5px] leading-[1.5] text-[hsl(var(--fg-secondary))] pt-1">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[14px] border border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-200))] p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle className="w-4 h-4 text-[hsl(var(--terracotta-500))]" />
              <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--ink-900))]">
                Do this now
              </h4>
            </div>
            <p className="text-[14.5px] leading-[1.5] text-[hsl(var(--ink-900))]">
              {response.doThisNow}
            </p>
          </div>

          <Button
            onClick={handleClose}
            size="lg"
            className="w-full rounded-full bg-[hsl(var(--ink-900))] text-[hsl(var(--paper-100))] hover:bg-[hsl(var(--ink-900)/0.9)]"
          >
            Got it, let's go
          </Button>
        </>
      )}
    </div>
  );

  // Mobile: vaul Drawer — slides up from bottom, drag-to-dismiss, doesn't
  // auto-focus the textarea (so the keyboard only opens when the user taps
  // the field, matching the check-in flow).
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}>
        <DrawerContent className="pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto w-full">{body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">{body}</DialogContent>
    </Dialog>
  );
};

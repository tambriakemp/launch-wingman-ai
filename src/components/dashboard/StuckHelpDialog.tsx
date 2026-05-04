import { useState } from "react";
import { Loader2, Sparkles, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader eyebrow="Stuck Help">
          <DialogTitle className="flex items-baseline gap-2">
            <Sparkles className="w-5 h-5 self-center text-[hsl(var(--terracotta-500))]" />
            <span>
              What's <em className="italic text-[hsl(var(--terracotta-500))]">blocking</em> you right now?
            </span>
          </DialogTitle>
          <DialogDescription>
            Describe what you're struggling with, and I'll help break it down into manageable steps.
          </DialogDescription>
        </DialogHeader>

        {!response ? (
          <>
            <DialogBody className="space-y-4">
              <div className="rounded-[14px] border border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-200))] px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--fg-muted))] mb-1">
                  Current task
                </div>
                <div className="font-display text-[16px] leading-snug text-[hsl(var(--ink-900))]">
                  {currentTask.title}
                </div>
              </div>
              <Textarea
                placeholder="e.g., I'm not sure how to describe my ideal client, I keep getting stuck on who to target..."
                value={blockingIssue}
                onChange={(e) => setBlockingIssue(e.target.value)}
                rows={5}
                className="resize-none rounded-[14px] bg-white border-[hsl(var(--border-hairline))] focus-visible:ring-[hsl(var(--terracotta-500)/0.3)]"
              />
            </DialogBody>
            <DialogFooter>
              <Button variant="ghost" className="rounded-full" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGetHelp}
                disabled={isLoading}
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
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogBody className="space-y-5">
              <div className="rounded-[14px] border border-[hsl(var(--terracotta-500)/0.25)] bg-[hsl(var(--terracotta-500)/0.06)] p-4">
                <p className="font-display italic text-[15px] leading-[1.55] text-[hsl(var(--ink-900))]">
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
                      <p className="text-[14.5px] leading-[1.5] text-[hsl(var(--fg-secondary))] pt-1">{step}</p>
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
                <p className="text-[14.5px] leading-[1.5] text-[hsl(var(--ink-900))]">{response.doThisNow}</p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                onClick={handleClose}
                className="rounded-full bg-[hsl(var(--ink-900))] text-[hsl(var(--paper-100))] hover:bg-[hsl(var(--ink-900)/0.9)]"
              >
                Got it, let's go
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

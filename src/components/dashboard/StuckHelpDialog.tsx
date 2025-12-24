import { useState } from "react";
import { Loader2, Sparkles, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            What's blocking you right now?
          </DialogTitle>
          <DialogDescription>
            Describe what you're struggling with, and I'll help break it down into manageable steps.
          </DialogDescription>
        </DialogHeader>

        {!response ? (
          <div className="space-y-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Current task: <span className="text-foreground font-medium">{currentTask.title}</span>
              </p>
              <Textarea
                placeholder="e.g., I'm not sure how to describe my ideal client, I keep getting stuck on who to target..."
                value={blockingIssue}
                onChange={(e) => setBlockingIssue(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGetHelp} disabled={isLoading}>
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
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Reassurance */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm text-foreground leading-relaxed">
                {response.reassurance}
              </p>
            </div>

            {/* Steps */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">
                Here's how to break it down:
              </h4>
              <div className="space-y-2">
                {response.steps.map((step, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm text-muted-foreground pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Do This Now */}
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-medium text-foreground">Do this now:</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {response.doThisNow}
              </p>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Got it, let's go
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

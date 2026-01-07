import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PhaseGateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  planningComplete: boolean;
  messagingComplete: boolean;
}

export const PhaseGateDialog = ({
  open,
  onOpenChange,
  projectId,
  planningComplete,
  messagingComplete,
}: PhaseGateDialogProps) => {
  const navigate = useNavigate();

  const handleGoToPhase = (phase: string) => {
    onOpenChange(false);
    navigate(`/projects/${projectId}/plan?phase=${phase}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Complete Earlier Phases First
          </DialogTitle>
          <DialogDescription>
            The Launch Timeline uses your planning and messaging work to generate personalized content suggestions. Complete these phases first for the best results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div
            className={`flex items-center justify-between p-3 rounded-lg border ${
              planningComplete
                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                : "bg-muted/50 border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              {planningComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
              )}
              <div>
                <p className="font-medium text-sm">Planning Phase</p>
                <p className="text-xs text-muted-foreground">
                  Define your offer and audience
                </p>
              </div>
            </div>
            {!planningComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGoToPhase("planning")}
              >
                Go to Planning
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          <div
            className={`flex items-center justify-between p-3 rounded-lg border ${
              messagingComplete
                ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                : "bg-muted/50 border-border"
            }`}
          >
            <div className="flex items-center gap-3">
              {messagingComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
              )}
              <div>
                <p className="font-medium text-sm">Messaging Phase</p>
                <p className="text-xs text-muted-foreground">
                  Craft your transformation message
                </p>
              </div>
            </div>
            {!messagingComplete && planningComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGoToPhase("messaging")}
              >
                Go to Messaging
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            I'll do this later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

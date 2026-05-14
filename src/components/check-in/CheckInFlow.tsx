import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckInWelcome } from "./CheckInWelcome";
import { CheckInReflection } from "./CheckInReflection";
import { CheckInOrientation } from "./CheckInOrientation";
import { CheckInComplete } from "./CheckInComplete";
import { PastProjectPicker } from "./PastProjectPicker";
import { useCheckIn, OrientationChoice } from "@/hooks/useCheckIn";
import { useToneLearning } from "@/hooks/useToneLearning";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface CheckInFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "welcome" | "reflection" | "orientation" | "picker-revisit" | "picker-relaunch" | "complete";

export function CheckInFlow({ open, onOpenChange }: CheckInFlowProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentPrompt, submitCheckIn, isSubmitting, snoozeCheckIn, hasPastProjects, preferences } =
    useCheckIn();
  const { recordCheckInUncertainty } = useToneLearning();

  const [step, setStep] = useState<Step>("welcome");
  const [reflectionResponse, setReflectionResponse] = useState("");
  const [orientationChoice, setOrientationChoice] = useState<OrientationChoice | null>(null);

  // First-time check-in: show the Welcome step. Repeat users go straight to
  // Reflection — the framing copy is for newcomers; seasoned users want to
  // get on with it.
  useEffect(() => {
    if (!open) return;
    setStep(preferences?.last_check_in_at ? "reflection" : "welcome");
  }, [open, preferences?.last_check_in_at]);

  const handleStart = () => {
    setStep("reflection");
  };

  const handleSkip = async () => {
    await snoozeCheckIn(30);
    onOpenChange(false);
    resetFlow();
  };

  const handleReflectionNext = () => {
    setStep("orientation");
  };

  const handleOrientationSelect = async (choice: OrientationChoice) => {
    setOrientationChoice(choice);

    // Record uncertainty signal for tone learning (highly restricted)
    if (reflectionResponse) {
      recordCheckInUncertainty(reflectionResponse);
    }

    // Submit the check-in so the data lands regardless of what step comes next.
    await submitCheckIn({
      reflectionPrompt: currentPrompt,
      reflectionResponse,
      orientationChoice: choice,
    });

    handleOrientationFollowup(choice);
  };

  // What the user sees after picking an orientation. Each branch tries to
  // deliver a concrete next move — not just close the modal.
  const handleOrientationFollowup = (choice: OrientationChoice) => {
    switch (choice) {
      case "continue_current":
        // Stay on the dashboard. Briefly affirm the choice.
        toast.success("Stay with it.", {
          description: "Back to where you were.",
        });
        closeAndReset();
        return;
      case "revisit_past":
        setStep("picker-revisit");
        return;
      case "plan_relaunch":
        setStep("picker-relaunch");
        return;
      case "start_new":
        closeAndReset();
        // AppRedirect reads `?new=1` (not `?action=new`) to surface the
        // create-project UI.
        navigate("/app?new=1");
        return;
      case "not_sure":
        setStep("complete");
        return;
    }
  };

  const handlePickerSelect = (projectId: string) => {
    const dest =
      step === "picker-relaunch"
        ? `/projects/${projectId}/relaunch`
        : `/projects/${projectId}/dashboard`;
    closeAndReset();
    navigate(dest);
  };

  const closeAndReset = () => {
    onOpenChange(false);
    resetFlow();
  };

  const resetFlow = () => {
    setStep("welcome");
    setReflectionResponse("");
    setOrientationChoice(null);
  };

  const handleClose = () => {
    closeAndReset();
  };

  const flowContent = (
    <AnimatePresence mode="wait">
      {step === "welcome" && (
        <motion.div
          key="welcome"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <CheckInWelcome onStart={handleStart} onSkip={handleSkip} />
        </motion.div>
      )}

      {step === "reflection" && (
        <motion.div
          key="reflection"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <CheckInReflection
            prompt={currentPrompt}
            response={reflectionResponse}
            onResponseChange={setReflectionResponse}
            onNext={handleReflectionNext}
            onSkip={handleReflectionNext}
          />
        </motion.div>
      )}

      {step === "orientation" && (
        <motion.div
          key="orientation"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <CheckInOrientation
            onSelect={handleOrientationSelect}
            isSubmitting={isSubmitting}
            hasPastProjects={hasPastProjects}
          />
        </motion.div>
      )}

      {(step === "picker-revisit" || step === "picker-relaunch") && (
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <PastProjectPicker
            mode={step === "picker-relaunch" ? "relaunch" : "revisit"}
            onSelect={handlePickerSelect}
            onBack={() => setStep("orientation")}
            onClose={handleClose}
          />
        </motion.div>
      )}

      {step === "complete" && (
        <motion.div
          key="complete"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <CheckInComplete onClose={handleClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );

  // On mobile, render as a bottom sheet (vaul Drawer) — native iOS pattern,
  // drag-to-dismiss. On desktop, keep the centered dialog.
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}>
        <DrawerContent className="pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto w-full">{flowContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {flowContent}
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckInWelcome } from "./CheckInWelcome";
import { CheckInReflection } from "./CheckInReflection";
import { CheckInOrientation } from "./CheckInOrientation";
import { CheckInComplete } from "./CheckInComplete";
import { useCheckIn, OrientationChoice } from "@/hooks/useCheckIn";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CheckInFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "welcome" | "reflection" | "orientation" | "complete";

export function CheckInFlow({ open, onOpenChange }: CheckInFlowProps) {
  const navigate = useNavigate();
  const { currentPrompt, submitCheckIn, isSubmitting, snoozeCheckIn } = useCheckIn();
  
  const [step, setStep] = useState<Step>("welcome");
  const [reflectionResponse, setReflectionResponse] = useState("");
  const [orientationChoice, setOrientationChoice] = useState<OrientationChoice | null>(null);

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
    
    // Submit the check-in
    await submitCheckIn({
      reflectionPrompt: currentPrompt,
      reflectionResponse,
      orientationChoice: choice,
    });

    // Navigate based on choice
    handleRedirect(choice);
  };

  const handleRedirect = (choice: OrientationChoice) => {
    onOpenChange(false);
    resetFlow();

    switch (choice) {
      case "continue_current":
        // Stay on dashboard (do nothing special)
        break;
      case "revisit_past":
        // Navigate to projects list filtered by completed
        navigate("/app?filter=completed");
        break;
      case "plan_relaunch":
        // Navigate to projects to select one for relaunch
        navigate("/app?action=relaunch");
        break;
      case "start_new":
        // Navigate to create new project
        navigate("/app?action=new");
        break;
      case "not_sure":
        // Just close, show gentle message handled by complete step
        setStep("complete");
        return;
    }
  };

  const resetFlow = () => {
    setStep("welcome");
    setReflectionResponse("");
    setOrientationChoice(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetFlow();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
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
      </DialogContent>
    </Dialog>
  );
}

 import { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
 import { motion, AnimatePresence } from "framer-motion";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { Button } from "@/components/ui/button";
 import { ChevronLeft, Rocket } from "lucide-react";
 import WelcomeStep from "@/components/onboarding/WelcomeStep";
 import PhasesStep from "@/components/onboarding/PhasesStep";
 import TasksStep from "@/components/onboarding/TasksStep";
 import AIStep from "@/components/onboarding/AIStep";
 import ResourcesStep from "@/components/onboarding/ResourcesStep";
 import CommunityStep from "@/components/onboarding/CommunityStep";
 import ReadyStep from "@/components/onboarding/ReadyStep";
 
 const TOTAL_STEPS = 7;
 
 const Onboarding = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const [currentStep, setCurrentStep] = useState(1);
   const [isCompleting, setIsCompleting] = useState(false);
 
   const handleNext = () => {
     if (currentStep < TOTAL_STEPS) {
       setCurrentStep(currentStep + 1);
     }
   };
 
   const handleBack = () => {
     if (currentStep > 1) {
       setCurrentStep(currentStep - 1);
     }
   };
 
   const handleSkip = async () => {
     await completeOnboarding();
   };
 
   const completeOnboarding = async () => {
     if (!user || isCompleting) return;
     
     setIsCompleting(true);
     try {
       const { error } = await supabase
         .from("profiles")
         .update({ onboarding_completed_at: new Date().toISOString() })
         .eq("user_id", user.id);
 
       if (error) throw error;
       navigate("/app", { replace: true });
     } catch (error) {
       console.error("Error completing onboarding:", error);
       // Navigate anyway - don't block user
       navigate("/app", { replace: true });
     }
   };
 
   const renderStep = () => {
     switch (currentStep) {
       case 1:
         return <WelcomeStep onNext={handleNext} />;
       case 2:
         return <PhasesStep />;
       case 3:
         return <TasksStep />;
       case 4:
         return <AIStep />;
       case 5:
         return <ResourcesStep />;
       case 6:
         return <CommunityStep />;
       case 7:
         return <ReadyStep onComplete={completeOnboarding} isLoading={isCompleting} />;
       default:
         return null;
     }
   };
 
   return (
     <div className="min-h-screen bg-background flex flex-col">
       {/* Header */}
       <header className="w-full py-6 px-4 flex items-center justify-center">
         <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
             <Rocket className="w-4 h-4 text-primary-foreground" />
           </div>
           <span className="text-xl font-bold">Launchely</span>
         </div>
       </header>
 
       {/* Main Content */}
       <main className="flex-1 flex items-center justify-center px-4 py-8">
         <div className="w-full max-w-2xl">
           <AnimatePresence mode="wait">
             <motion.div
               key={currentStep}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3, ease: "easeInOut" }}
             >
               {renderStep()}
             </motion.div>
           </AnimatePresence>
         </div>
       </main>
 
       {/* Footer Navigation */}
       <footer className="w-full py-6 px-4">
         <div className="max-w-2xl mx-auto flex items-center justify-between">
           {/* Back Button */}
           <div className="w-24">
             {currentStep > 1 && currentStep < 7 && (
               <Button
                 variant="ghost"
                 onClick={handleBack}
                 className="text-muted-foreground"
               >
                 <ChevronLeft className="w-4 h-4 mr-1" />
                 Back
               </Button>
             )}
           </div>
 
           {/* Step Indicators */}
           <div className="flex items-center gap-2">
             {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
               <div
                 key={index}
                 className={`w-2 h-2 rounded-full transition-colors ${
                   index + 1 === currentStep
                     ? "bg-primary"
                     : index + 1 < currentStep
                     ? "bg-primary/40"
                     : "bg-muted"
                 }`}
               />
             ))}
           </div>
 
           {/* Next/Skip Button */}
           <div className="w-24 flex justify-end">
             {currentStep > 1 && currentStep < 7 && (
               <Button onClick={handleNext}>
                 Next
               </Button>
             )}
             {currentStep === 1 && (
               <Button
                 variant="ghost"
                 onClick={handleSkip}
                 className="text-muted-foreground text-sm"
               >
                 Skip
               </Button>
             )}
           </div>
         </div>
       </footer>
     </div>
   );
 };
 
 export default Onboarding;
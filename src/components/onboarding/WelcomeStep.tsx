 import { Button } from "@/components/ui/button";
 import { CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
 
 interface WelcomeStepProps {
   onNext: () => void;
 }
 
 const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
   return (
     <div className="text-center space-y-8">
       {/* Illustration */}
       <div className="flex justify-center">
         <div className="relative">
           <div className="w-32 h-32 bg-accent/50 rounded-full flex items-center justify-center">
             <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center">
               <div className="space-y-2">
                 <div className="flex items-center gap-2">
                   <CheckCircle2 className="w-5 h-5 text-primary" />
                   <div className="h-2 w-16 bg-primary/20 rounded" />
                 </div>
                 <div className="flex items-center gap-2">
                   <CheckCircle2 className="w-5 h-5 text-primary" />
                   <div className="h-2 w-12 bg-primary/20 rounded" />
                 </div>
                 <div className="flex items-center gap-2">
                   <CheckCircle2 className="w-5 h-5 text-primary" />
                   <div className="h-2 w-14 bg-primary/20 rounded" />
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>
 
       {/* Content */}
       <div className="space-y-4">
         <h1 className="text-3xl md:text-4xl font-bold text-foreground">
           Stop buying courses. Start launching.
         </h1>
         <p className="text-lg text-muted-foreground max-w-md mx-auto">
           Launchely helps you plan, build, and launch a real offer using guided steps and AI support — without overwhelm.
         </p>
       </div>
 
       {/* Actions */}
       <div className="flex flex-col items-center gap-3">
         <Button size="lg" onClick={onNext} className="min-w-48">
           Get started
           <ArrowRight className="w-4 h-4 ml-2" />
         </Button>
         <a
           href="/how-it-works"
           target="_blank"
           rel="noopener noreferrer"
           className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
         >
           See how it works
           <ExternalLink className="w-3 h-3" />
         </a>
       </div>
     </div>
   );
 };
 
 export default WelcomeStep;
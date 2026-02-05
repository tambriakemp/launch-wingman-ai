 import { Button } from "@/components/ui/button";
 import { Rocket, Loader2 } from "lucide-react";
 
 interface ReadyStepProps {
   onComplete: () => void;
   isLoading: boolean;
 }
 
 const ReadyStep = ({ onComplete, isLoading }: ReadyStepProps) => {
   return (
     <div className="text-center space-y-8">
       {/* Illustration */}
       <div className="flex justify-center">
         <div className="relative">
           <div className="w-32 h-32 bg-accent/50 rounded-full flex items-center justify-center">
             <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center">
               <Rocket className="w-12 h-12 text-accent-foreground" />
             </div>
           </div>
           {/* Sparkle effects */}
           <div className="absolute -right-2 top-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
           <div className="absolute -left-1 bottom-4 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-75" />
           <div className="absolute right-4 -bottom-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150" />
         </div>
       </div>
 
       {/* Content */}
       <div className="space-y-4">
         <h1 className="text-3xl md:text-4xl font-bold text-foreground">
           Ready to launch something real?
         </h1>
         <p className="text-lg text-muted-foreground max-w-md mx-auto">
           Create your first project and start with the Planning phase. One step at a time.
         </p>
       </div>
 
       {/* CTA */}
       <div>
         <Button
           size="lg"
           onClick={onComplete}
           disabled={isLoading}
           className="min-w-56"
         >
           {isLoading ? (
             <>
               <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               Creating...
             </>
           ) : (
             <>
               Create my first project
               <Rocket className="w-4 h-4 ml-2" />
             </>
           )}
         </Button>
       </div>
     </div>
   );
 };
 
 export default ReadyStep;
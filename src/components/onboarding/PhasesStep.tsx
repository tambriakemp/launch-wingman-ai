 import { ClipboardList, MessageSquare, Hammer, FileText, Rocket } from "lucide-react";
 
 const phases = [
   { icon: ClipboardList, label: "Planning", color: "bg-blue-100 text-blue-600" },
   { icon: MessageSquare, label: "Messaging", color: "bg-purple-100 text-purple-600" },
   { icon: Hammer, label: "Build", color: "bg-amber-100 text-amber-600" },
   { icon: FileText, label: "Content", color: "bg-green-100 text-green-600" },
   { icon: Rocket, label: "Launch", color: "bg-rose-100 text-rose-600" },
 ];
 
 const PhasesStep = () => {
   return (
     <div className="text-center space-y-8">
       {/* Content */}
       <div className="space-y-4">
         <h1 className="text-3xl md:text-4xl font-bold text-foreground">
           Everything is organized into phases
         </h1>
         <p className="text-lg text-muted-foreground max-w-md mx-auto">
           Each project walks you through Planning, Messaging, Build, and Launch — so you always know what to do next.
         </p>
       </div>
 
       {/* Phase Timeline - Desktop */}
       <div className="hidden md:flex items-center justify-center gap-2 py-8">
         {phases.map((phase, index) => (
           <div key={phase.label} className="flex items-center">
             <div className="flex flex-col items-center gap-2">
               <div className={`w-14 h-14 rounded-xl ${phase.color} flex items-center justify-center`}>
                 <phase.icon className="w-6 h-6" />
               </div>
               <span className="text-sm font-medium text-foreground">{phase.label}</span>
             </div>
             {index < phases.length - 1 && (
               <div className="w-8 h-0.5 bg-border mx-2 mt-[-24px]" />
             )}
           </div>
         ))}
       </div>
 
       {/* Phase Timeline - Mobile */}
       <div className="md:hidden space-y-3 py-4">
         {phases.map((phase, index) => (
           <div key={phase.label} className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-xl ${phase.color} flex items-center justify-center flex-shrink-0`}>
               <phase.icon className="w-5 h-5" />
             </div>
             <div className="flex-1 text-left">
               <span className="font-medium text-foreground">{phase.label}</span>
               <div className="h-0.5 bg-border mt-2" style={{ width: index === phases.length - 1 ? '0' : '100%' }} />
             </div>
           </div>
         ))}
       </div>
     </div>
   );
 };
 
 export default PhasesStep;
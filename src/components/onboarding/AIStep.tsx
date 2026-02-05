 import { Headphones, Lightbulb, Minimize2 } from "lucide-react";
 
 const features = [
   {
     icon: Headphones,
     title: "Listen to explanation",
     description: "Hear concepts explained in simple terms",
   },
   {
     icon: Lightbulb,
     title: "Generate examples",
     description: "Get personalized examples for your niche",
   },
   {
     icon: Minimize2,
     title: "Simplify responses",
     description: "Make complex ideas easier to understand",
   },
 ];
 
 const AIStep = () => {
   return (
     <div className="text-center space-y-8">
       {/* Content */}
       <div className="space-y-4">
         <h1 className="text-3xl md:text-4xl font-bold text-foreground">
           AI support, when you need it
         </h1>
         <p className="text-lg text-muted-foreground max-w-md mx-auto">
           Use AI to clarify, simplify, or get unstuck — without replacing your voice or decisions.
         </p>
       </div>
 
       {/* Feature Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg md:max-w-none mx-auto">
         {features.map((feature, index) => (
           <div
             key={index}
             className="bg-card rounded-xl border p-6 text-left hover:shadow-md transition-shadow"
           >
             <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mb-4">
               <feature.icon className="w-5 h-5 text-accent-foreground" />
             </div>
             <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
             <p className="text-sm text-muted-foreground">{feature.description}</p>
           </div>
         ))}
       </div>
     </div>
   );
 };
 
 export default AIStep;
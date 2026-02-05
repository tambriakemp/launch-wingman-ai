 import { FileText, Layout, Palette, BookOpen } from "lucide-react";
 
 const resources = [
   { icon: FileText, label: "Templates" },
   { icon: Layout, label: "Planners" },
   { icon: Palette, label: "Canva Assets" },
   { icon: BookOpen, label: "Workbooks" },
 ];
 
 const ResourcesStep = () => {
   return (
     <div className="text-center space-y-8">
       {/* Content */}
       <div className="space-y-4">
         <h1 className="text-3xl md:text-4xl font-bold text-foreground">
           Launch faster with built-in resources
         </h1>
         <p className="text-lg text-muted-foreground max-w-md mx-auto">
           Pro users get access to templates, planners, Canva assets, and workbooks — so you don't start from scratch.
         </p>
       </div>
 
       {/* Resource Grid */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-md md:max-w-lg mx-auto">
         {resources.map((resource, index) => (
           <div
             key={index}
             className="bg-card rounded-xl border p-6 flex flex-col items-center gap-3 hover:shadow-md transition-shadow"
           >
             <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
               <resource.icon className="w-6 h-6 text-accent-foreground" />
             </div>
             <span className="text-sm font-medium text-foreground">{resource.label}</span>
           </div>
         ))}
       </div>
 
       {/* Note for free users */}
       <p className="text-sm text-muted-foreground italic">
         Free users can still launch with their own content.
       </p>
     </div>
   );
 };
 
 export default ResourcesStep;
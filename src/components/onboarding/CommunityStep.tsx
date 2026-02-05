 import { Button } from "@/components/ui/button";
 import { Users, ExternalLink } from "lucide-react";
 
 const CommunityStep = () => {
   return (
     <div className="text-center space-y-8">
       {/* Illustration */}
       <div className="flex justify-center">
         <div className="relative">
           <div className="w-32 h-32 bg-accent/50 rounded-full flex items-center justify-center">
             <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center">
               <Users className="w-12 h-12 text-accent-foreground" />
             </div>
           </div>
           {/* Floating avatars */}
           <div className="absolute -left-4 top-4 w-10 h-10 bg-blue-100 rounded-full border-2 border-background flex items-center justify-center">
             <span className="text-sm font-medium text-blue-600">JD</span>
           </div>
           <div className="absolute -right-2 top-8 w-8 h-8 bg-green-100 rounded-full border-2 border-background flex items-center justify-center">
             <span className="text-xs font-medium text-green-600">KL</span>
           </div>
           <div className="absolute left-8 -bottom-2 w-9 h-9 bg-purple-100 rounded-full border-2 border-background flex items-center justify-center">
             <span className="text-xs font-medium text-purple-600">MR</span>
           </div>
         </div>
       </div>
 
       {/* Content */}
       <div className="space-y-4">
         <h1 className="text-3xl md:text-4xl font-bold text-foreground">
           Support when you get stuck
         </h1>
         <p className="text-lg text-muted-foreground max-w-md mx-auto">
           Join the Skool community to ask questions, get feedback, and launch alongside others using Launchely.
         </p>
       </div>
 
       {/* CTA */}
       <div>
         <Button
           variant="outline"
           size="lg"
           asChild
           className="min-w-48"
         >
           <a
             href="https://www.skool.com/launchely"
             target="_blank"
             rel="noopener noreferrer"
           >
             Join the community
             <ExternalLink className="w-4 h-4 ml-2" />
           </a>
         </Button>
       </div>
     </div>
   );
 };
 
 export default CommunityStep;
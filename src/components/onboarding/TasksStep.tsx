 import { CheckCircle2, Clock, Sparkles } from "lucide-react";
 
 const tasks = [
   { title: "Define your ideal customer", time: "~15 min", completed: true },
   { title: "Craft your transformation statement", time: "~20 min", completed: true },
   { title: "Write your social bio", time: "~10 min", completed: false },
   { title: "Create your offer structure", time: "~25 min", completed: false },
 ];
 
 const TasksStep = () => {
   return (
     <div className="text-center space-y-8">
       {/* Content */}
       <div className="space-y-4">
         <h1 className="text-3xl md:text-4xl font-bold text-foreground">
           No guessing. Just next steps.
         </h1>
         <p className="text-lg text-muted-foreground max-w-md mx-auto">
           Each phase is broken into small, focused tasks with time estimates, guidance, and optional AI help.
         </p>
       </div>
 
       {/* Task List */}
       <div className="max-w-sm mx-auto bg-card rounded-xl border shadow-sm overflow-hidden">
         <div className="p-4 border-b bg-muted/30">
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <Sparkles className="w-4 h-4" />
             <span>Example tasks from Planning phase</span>
           </div>
         </div>
         <div className="divide-y">
           {tasks.map((task, index) => (
             <div key={index} className="flex items-center gap-3 p-4">
               <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                 task.completed 
                   ? "bg-primary border-primary" 
                   : "border-muted-foreground/30"
               }`}>
                 {task.completed && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
               </div>
               <div className="flex-1 text-left">
                 <p className={`text-sm font-medium ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                   {task.title}
                 </p>
               </div>
               <div className="flex items-center gap-1 text-xs text-muted-foreground">
                 <Clock className="w-3 h-3" />
                 {task.time}
               </div>
             </div>
           ))}
         </div>
       </div>
     </div>
   );
 };
 
 export default TasksStep;
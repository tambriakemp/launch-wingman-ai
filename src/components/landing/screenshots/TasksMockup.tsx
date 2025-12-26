import { CheckSquare, Clock, AlertCircle, MoreHorizontal } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

export const TasksMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-6 min-h-[380px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Tasks</h3>
            <p className="text-sm text-muted-foreground">Track all your launch assets</p>
          </div>
          <div className="flex gap-2">
            <span className="text-xs bg-muted px-3 py-1.5 rounded-lg text-muted-foreground">All Tasks</span>
            <span className="text-xs bg-accent/20 px-3 py-1.5 rounded-lg text-accent">Pages</span>
          </div>
        </div>

        {/* Task Categories */}
        <div className="space-y-4">
          {/* Pages Category */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-medium text-foreground text-sm">Pages</span>
                <span className="text-xs text-muted-foreground">(4 items)</span>
              </div>
              <span className="text-xs text-muted-foreground">75% done</span>
            </div>
            <div className="divide-y divide-border">
              {[
                { name: "Create opt-in page", done: true, due: "Completed" },
                { name: "Write sales page headline", done: true, due: "Completed" },
                { name: "Design thank you page", done: true, due: "Completed" },
                { name: "Build upsell page", done: false, due: "Due tomorrow", urgent: true },
              ].map((task, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      task.done 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-muted-foreground'
                    }`}>
                      {task.done && <CheckSquare className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${task.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {task.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.urgent && <AlertCircle className="w-4 h-4 text-amber-500" />}
                    <span className={`text-xs ${task.urgent ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {task.due}
                    </span>
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emails Category */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="font-medium text-foreground text-sm">Emails</span>
                <span className="text-xs text-muted-foreground">(6 items)</span>
              </div>
              <span className="text-xs text-muted-foreground">33% done</span>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};

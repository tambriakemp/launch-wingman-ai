import { Users, Target, Flame, Shield, Clock, Sparkles } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

export const AudienceBuilderMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-6 min-h-[380px]">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-1">Value Equation Builder</h3>
          <p className="text-sm text-muted-foreground">Define your ideal customer using proven frameworks</p>
        </div>

        {/* Value Equation Sections */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { 
              icon: Users, 
              title: "WHO", 
              content: "Busy coaches who want to scale",
              color: "bg-blue-500/10 text-blue-500",
              complete: true
            },
            { 
              icon: Target, 
              title: "DREAM OUTCOME", 
              content: "Launch consistently without burnout",
              color: "bg-green-500/10 text-green-500",
              complete: true
            },
            { 
              icon: Flame, 
              title: "PAIN POINTS", 
              content: "Overwhelmed by launch complexity",
              color: "bg-red-500/10 text-red-500",
              complete: true
            },
            { 
              icon: Shield, 
              title: "LIKELIHOOD", 
              content: "5 proof elements added",
              color: "bg-purple-500/10 text-purple-500",
              complete: false
            },
            { 
              icon: Clock, 
              title: "TIME & EFFORT", 
              content: "3 quick wins defined",
              color: "bg-amber-500/10 text-amber-500",
              complete: false
            },
          ].map((section, i) => (
            <div 
              key={i} 
              className={`p-4 rounded-xl border ${
                section.complete ? 'border-accent/50 bg-accent/5' : 'border-border bg-card'
              } ${i === 4 ? 'col-span-2' : ''}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg ${section.color} flex items-center justify-center`}>
                  <section.icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-foreground text-sm">{section.title}</span>
                {section.complete && (
                  <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                    Complete
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground pl-11">{section.content}</p>
            </div>
          ))}
        </div>

        {/* AI Button */}
        <div className="mt-4 flex justify-end">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Generate with AI
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};

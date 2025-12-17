import { ClipboardCheck, ChevronRight, Star, Trophy } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

export const AssessmentMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-6 min-h-[380px]">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-1">Launch Readiness Assessment</h3>
          <p className="text-sm text-muted-foreground">Discover your current launch approach</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Question 8 of 15</span>
            <span className="text-sm font-medium text-accent">53%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: '53%' }} />
          </div>
        </div>

        {/* Question */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-4 h-4 text-accent" />
            </div>
            <p className="text-foreground font-medium">
              How do you typically build anticipation before launching a new offer?
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2 ml-11">
            {[
              { text: "I announce it the day I launch", selected: false },
              { text: "I tease it a few days before", selected: false },
              { text: "I build a 2-4 week prelaunch sequence", selected: true },
              { text: "I don't really build anticipation", selected: false },
            ].map((option, i) => (
              <div 
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  option.selected 
                    ? 'border-accent bg-accent/5' 
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  option.selected ? 'border-accent bg-accent' : 'border-muted-foreground'
                }`}>
                  {option.selected && <div className="w-2 h-2 rounded-full bg-accent-foreground" />}
                </div>
                <span className={`text-sm ${option.selected ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {option.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Previous
          </button>
          <button className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium">
            Next Question
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </BrowserFrame>
  );
};

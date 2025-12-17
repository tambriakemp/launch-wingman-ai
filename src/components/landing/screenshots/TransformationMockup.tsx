import { Sparkles, Zap, Heart, Award, Copy, Check } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

export const TransformationMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-6 min-h-[380px]">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-1">Transformation Statement</h3>
          <p className="text-sm text-muted-foreground">Your core message that connects with your audience</p>
        </div>

        {/* Style Options */}
        <div className="flex gap-2 mb-4">
          {[
            { icon: Zap, label: "Punchy", active: true },
            { icon: Heart, label: "Emotional", active: false },
            { icon: Award, label: "Authority", active: false },
          ].map((style, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${
                style.active 
                  ? 'bg-accent text-accent-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <style.icon className="w-4 h-4" />
              {style.label}
            </div>
          ))}
        </div>

        {/* Generated Statements */}
        <div className="space-y-3">
          <div className="bg-accent/10 border-2 border-accent rounded-xl p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-foreground font-medium">
                "I help overwhelmed coaches go from chaotic launches to consistent 5-figure months—without 
                burning out or spending thousands on courses."
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center cursor-pointer">
                  <Copy className="w-4 h-4 text-accent" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                  <Check className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">One-liner</span>
              <span className="text-xs text-muted-foreground">15 words</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 opacity-70">
            <p className="text-foreground text-sm">
              "Transform your launch strategy from overwhelming to effortless. I guide coaches through 
              a proven system that builds sustainable businesses..."
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">Standard</span>
              <span className="text-xs text-muted-foreground">28 words</span>
            </div>
          </div>
        </div>

        {/* Regenerate Button */}
        <div className="mt-4 flex justify-center">
          <div className="inline-flex items-center gap-2 text-accent text-sm cursor-pointer hover:underline">
            <Sparkles className="w-4 h-4" />
            Regenerate Variations
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};

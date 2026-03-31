import { Play, Film, Mic, Wand2, Clock, CheckCircle2 } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

export const AIStudioMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-5 min-h-[400px] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">AI Studio</h3>
            <p className="text-xs text-muted-foreground">Create talking-head videos from a script</p>
          </div>
          <div className="bg-accent text-accent-foreground px-2.5 py-1 rounded-md text-xs font-medium">
            + New Video
          </div>
        </div>

        {/* Video project card */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Launch Week Vlog</div>
              <div className="text-xs text-muted-foreground">4 scenes · 2:30 total</div>
            </div>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Ready</span>
          </div>
        </div>

        {/* Storyboard */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground">Storyboard</div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Intro Hook", status: "done" },
              { label: "Problem", status: "done" },
              { label: "Solution", status: "done" },
              { label: "CTA", status: "generating" },
            ].map((scene, i) => (
              <div key={i} className="bg-muted/50 border border-border rounded-lg p-2 text-center space-y-1.5">
                <div className="w-full aspect-video rounded bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
                  {scene.status === "done" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <div className="text-[10px] text-foreground font-medium truncate">{scene.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline steps */}
        <div className="bg-card border border-border rounded-xl p-3.5 space-y-2.5">
          <div className="text-xs font-semibold text-foreground">Generation Pipeline</div>
          {[
            { icon: Wand2, label: "Script generated from topic", done: true },
            { icon: Film, label: "Storyboard scenes created", done: true },
            { icon: Mic, label: "Voiceover synthesized", done: true },
            { icon: Play, label: "Talking-head video rendering", done: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-accent shrink-0 animate-pulse" />
              )}
              <step.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className={`text-xs ${step.done ? "text-muted-foreground" : "text-foreground font-medium"}`}>{step.label}</span>
            </div>
          ))}
        </div>

        {/* Character preview hint */}
        <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-lg p-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
            <Mic className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <div className="text-xs font-medium text-foreground">Your AI Avatar</div>
            <div className="text-[10px] text-muted-foreground">Upload a photo · Pick a voice · Generate videos</div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};

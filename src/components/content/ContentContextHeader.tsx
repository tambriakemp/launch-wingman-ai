import { cn } from "@/lib/utils";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";

interface ContentContextHeaderProps {
  currentPhase: string;
  funnelType: string | null;
}

const PHASE_DISPLAY_NAMES: Record<string, string> = {
  planning: "Planning",
  content: "Content Creation",
  messaging: "Messaging",
  build: "Build",
  launch: "Launch",
  "post-launch": "Post-Launch",
};

const PHASE_DESCRIPTIONS: Record<string, string> = {
  planning: "Content here focuses on clarity and building your foundation.",
  content: "Content here focuses on building anticipation and trust.",
  messaging: "Content here focuses on refining your message and voice.",
  build: "Content here focuses on behind-the-scenes progress and excitement.",
  launch: "Content here helps people decide calmly.",
  "post-launch": "Content here supports reflection and continuity.",
};

export const ContentContextHeader = ({
  currentPhase,
  funnelType,
}: ContentContextHeaderProps) => {
  const phaseName = PHASE_DISPLAY_NAMES[currentPhase] || currentPhase;
  const phaseDescription = PHASE_DESCRIPTIONS[currentPhase] || "";
  const funnelConfig = funnelType ? FUNNEL_CONFIGS[funnelType] : null;
  const funnelName = funnelConfig?.name || "No funnel selected";

  return (
    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
        Right now, you're in:
      </p>
      <p className="text-base font-medium text-foreground">
        {phaseName}
        {funnelType && (
          <>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className={cn(funnelConfig?.color)}>{funnelName}</span>
          </>
        )}
      </p>
      {phaseDescription && (
        <p className="text-sm text-muted-foreground mt-1.5">
          {phaseDescription}
        </p>
      )}
    </div>
  );
};

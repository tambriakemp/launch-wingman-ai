import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";

interface ContentContextHeaderProps {
  currentPhase: string;
  funnelType: string | null;
}

const PHASE_DISPLAY_NAMES: Record<string, string> = {
  planning: "Planning Phase",
  content: "Content Creation",
  messaging: "Messaging",
  build: "Build Phase",
  launch: "Launch Phase",
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

  return (
    <div className="py-3 px-4 rounded-lg bg-muted/30">
      <p className="text-xs text-muted-foreground mb-0.5">
        Right now, you're in:
      </p>
      <p className="text-sm font-medium text-foreground">
        {phaseName}
        {funnelConfig && (
          <span className="font-normal text-muted-foreground"> · {funnelConfig.name}</span>
        )}
      </p>
      {phaseDescription && (
        <p className="text-xs text-muted-foreground mt-1">
          {phaseDescription}
        </p>
      )}
    </div>
  );
};

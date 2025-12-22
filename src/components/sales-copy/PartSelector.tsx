import { cn } from "@/lib/utils";
import { Check, Sparkles, PenLine } from "lucide-react";

interface Part {
  id: string;
  label: string;
  hasContent: boolean;
}

interface PartSelectorProps {
  parts: Part[];
  selectedPart: string;
  onSelectPart: (partId: string) => void;
}

export const PartSelector = ({ parts, selectedPart, onSelectPart }: PartSelectorProps) => {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Select Part to Edit
      </p>
      {parts.map((part) => (
        <button
          key={part.id}
          onClick={() => onSelectPart(part.id)}
          className={cn(
            "w-full flex items-center justify-between p-2.5 rounded-lg text-left text-sm transition-all",
            selectedPart === part.id
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-accent text-foreground"
          )}
        >
          <span>{part.label}</span>
          {part.hasContent && (
            <Check className="w-3.5 h-3.5 text-green-500" />
          )}
        </button>
      ))}
    </div>
  );
};

interface ModeTabsProps {
  mode: "ai" | "manual";
  onModeChange: (mode: "ai" | "manual") => void;
  aiDescription?: string;
}

export const ModeTabs = ({ mode, onModeChange, aiDescription }: ModeTabsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onModeChange("ai")}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            mode === "ai"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Sparkles className="w-4 h-4" />
          AI Generate
        </button>
        <button
          type="button"
          onClick={() => onModeChange("manual")}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            mode === "manual"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <PenLine className="w-4 h-4" />
          Write My Own
        </button>
      </div>
      
      {mode === "ai" && aiDescription && (
        <div className="flex gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">What AI will create</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{aiDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Keep ModeCard for backward compatibility
interface ModeCardProps {
  mode: "ai" | "manual";
  selected: boolean;
  onClick: () => void;
}

export const ModeCard = ({ mode, selected, onClick }: ModeCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 p-4 rounded-lg border-2 text-left transition-all",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      {mode === "ai" ? (
        <>
          <Sparkles className="w-5 h-5 mb-2 text-primary" />
          <div className="font-medium text-sm">AI Generate</div>
          <p className="text-xs text-muted-foreground mt-1">Let AI create compelling copy</p>
        </>
      ) : (
        <>
          <PenLine className="w-5 h-5 mb-2 text-primary" />
          <div className="font-medium text-sm">Write My Own</div>
          <p className="text-xs text-muted-foreground mt-1">Write from scratch</p>
        </>
      )}
    </button>
  );
};

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AINudgeCardProps {
  message?: string;
  onShowExample?: () => void;
  onDismiss?: () => void;
}

export const AINudgeCard = ({
  message = "Your last titles leaned into curiosity. Try one that names the outcome directly — it tends to land better with this audience.",
  onShowExample,
  onDismiss,
}: AINudgeCardProps) => {
  return (
    <div
      className="rounded-2xl p-[22px]"
      style={{
        background: "hsl(var(--ink-900))",
        color: "hsl(var(--paper-100))",
      }}
    >
      <div className="inline-flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(var(--terracotta-500))" }} />
        <span
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: 11,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "hsl(var(--terracotta-500))",
            fontWeight: 600,
          }}
        >
          From your AI team
        </span>
      </div>
      <p
        className="mt-3 italic"
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 500,
          fontSize: 18,
          lineHeight: 1.4,
          color: "hsl(var(--paper-100))",
        }}
      >
        "{message}"
      </p>
      <div className="mt-4 flex items-center gap-3">
        {onShowExample && (
          <Button
            variant="outline"
            size="sm"
            onClick={onShowExample}
            className="rounded-full bg-transparent border-white/30 text-[hsl(var(--paper-100))] hover:bg-white/10 hover:text-white text-xs h-8"
          >
            Show me an example
          </Button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-white/60 hover:text-white/90 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};

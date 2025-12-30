import * as React from "react";
import { Headphones, Loader2, Pause } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useVoiceSnippet } from "@/hooks/useVoiceSnippet";

interface VoiceSnippetButtonProps {
  taskId: string;
  script: string;
  className?: string;
}

export function VoiceSnippetButton({ taskId, script, className }: VoiceSnippetButtonProps) {
  const { isLoading, isPlaying, play, error } = useVoiceSnippet({ taskId, script });

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={play}
      disabled={isLoading}
      className={cn(
        "gap-2 text-muted-foreground hover:text-foreground transition-colors",
        isPlaying && "text-primary",
        error && "text-destructive",
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating...</span>
        </>
      ) : isPlaying ? (
        <>
          <Pause className="h-4 w-4" />
          <span>Pause</span>
        </>
      ) : (
        <>
          <Headphones className="h-4 w-4" />
          <span>Listen to explanation</span>
        </>
      )}
    </Button>
  );
}

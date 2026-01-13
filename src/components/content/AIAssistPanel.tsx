import { useState } from "react";
import { X, Sparkles, Loader2, Copy, Check, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ToneAdjustment = "simplify" | "shorter" | "calmer" | "direct";

interface Suggestion {
  id: string;
  title?: string;
  content: string;
}

interface AIAssistPanelProps {
  open: boolean;
  onClose: () => void;
  contentType: string;
  onContentTypeChange: (type: string) => void;
  onGenerate: () => Promise<void>;
  onToneAdjust: (tone: ToneAdjustment) => Promise<void>;
  suggestions: Suggestion[];
  isGenerating: boolean;
  isAdjusting: ToneAdjustment | null;
  currentContent: string;
  onCopySuggestion: (content: string, title?: string) => void;
}

const CONTENT_TYPES = [
  { value: "general", label: "General" },
  { value: "stories", label: "Story" },
  { value: "offer", label: "Offer" },
  { value: "behind-the-scenes", label: "Behind-the-scenes" },
];

const TONE_ADJUSTMENTS: { value: ToneAdjustment; label: string }[] = [
  { value: "simplify", label: "Simplify" },
  { value: "shorter", label: "Shorter" },
  { value: "calmer", label: "Calmer" },
  { value: "direct", label: "More direct" },
];

export function AIAssistPanel({
  open,
  onClose,
  contentType,
  onContentTypeChange,
  onGenerate,
  onToneAdjust,
  suggestions,
  isGenerating,
  isAdjusting,
  currentContent,
  onCopySuggestion,
}: AIAssistPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (suggestion: Suggestion) => {
    onCopySuggestion(suggestion.content, suggestion.title);
    setCopiedId(suggestion.id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!open) return null;

  return (
    <div className="w-[320px] border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">AI Assist</span>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Tone Adjustment */}
          {currentContent && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Adjust Tone</Label>
              <div className="flex flex-wrap gap-2">
                {TONE_ADJUSTMENTS.map((tone) => (
                  <button
                    key={tone.value}
                    type="button"
                    onClick={() => onToneAdjust(tone.value)}
                    disabled={isAdjusting !== null}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      "bg-muted hover:bg-muted/80 text-muted-foreground",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isAdjusting === tone.value ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {tone.label}
                      </span>
                    ) : (
                      tone.label
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground">Suggestions</Label>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion.id}
                    className="relative p-3 rounded-lg border-l-4 border-l-primary/60 bg-muted/30 border border-border"
                  >
                    {/* Copy button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 p-0"
                      onClick={() => handleCopy(suggestion)}
                    >
                      {copiedId === suggestion.id ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>

                    {/* Suggestion content */}
                    <div className="pr-8">
                      <p className="text-xs text-muted-foreground mb-1.5">
                        💡 Suggestion {String.fromCharCode(65 + index)}
                      </p>
                      {suggestion.title && (
                        <p className="text-sm font-medium mb-1">{suggestion.title}</p>
                      )}
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                        {suggestion.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {suggestions.length === 0 && !isGenerating && (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Click "Generate Ideas" to get AI suggestions
              </p>
            </div>
          )}

          {/* Loading state */}
          {isGenerating && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Generating suggestions...
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom section - Content Type dropdown + Generate button */}
      <div className="p-4 border-t shrink-0 space-y-3">
        {/* Content Type Dropdown */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Content Type</Label>
          <Select value={contentType} onValueChange={onContentTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full"
          size="sm"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : suggestions.length > 0 ? (
            <RefreshCw className="w-4 h-4 mr-2" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {suggestions.length > 0 ? "Regenerate" : "Generate Ideas"}
        </Button>
      </div>
    </div>
  );
}

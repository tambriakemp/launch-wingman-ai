import { X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AiSuggestionsProps {
  suggestions: string[];
  isLoading: boolean;
  onUseSuggestion: (suggestion: string) => void;
  onClose: () => void;
}

export const AiSuggestions = ({
  suggestions,
  isLoading,
  onUseSuggestion,
  onClose,
}: AiSuggestionsProps) => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">AI Suggestions</CardTitle>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Pick one to add to your draft, or close to keep writing on your own.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Generating ideas...</span>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No suggestions available. Try writing something first.
          </p>
        ) : (
          suggestions.slice(0, 3).map((suggestion, index) => (
            <div
              key={index}
              className="p-3 bg-background rounded-md border border-border/50 hover:border-primary/50 transition-colors group cursor-pointer"
              onClick={() => onUseSuggestion(suggestion)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm flex-1">{suggestion}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

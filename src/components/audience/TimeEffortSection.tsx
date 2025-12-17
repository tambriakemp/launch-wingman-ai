import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Plus, Sparkles, Loader2, Zap, ArrowDownCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export interface TimeEffortElement {
  type: 'quick_win' | 'friction_reducer';
  text: string;
}

interface TimeEffortSectionProps {
  timeEffortElements: TimeEffortElement[];
  niche: string;
  targetAudience: string;
  primaryPainPoint: string;
  desiredOutcome: string;
  onElementsChange: (elements: TimeEffortElement[]) => void;
}

const MAX_ELEMENTS = 8;

const TYPE_CONFIG = {
  quick_win: {
    label: 'Quick Win',
    icon: Zap,
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  },
  friction_reducer: {
    label: 'Friction Reducer',
    icon: ArrowDownCircle,
    color: 'bg-teal-500/10 text-teal-600 border-teal-500/30',
  },
};

export const TimeEffortSectionContent = ({
  timeEffortElements,
  niche,
  targetAudience,
  primaryPainPoint,
  desiredOutcome,
  onElementsChange,
}: TimeEffortSectionProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<TimeEffortElement[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [manualType, setManualType] = useState<TimeEffortElement['type']>('quick_win');

  const canAddMore = timeEffortElements.length < MAX_ELEMENTS;

  const handleGenerate = async () => {
    if (!niche || !targetAudience) return;

    setIsGenerating(true);
    setSuggestions([]);
    setSelectedSuggestions(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('generate-time-effort', {
        body: {
          niche,
          targetAudience,
          primaryPainPoint,
          desiredOutcome,
        },
      });

      if (error) throw error;

      if (data?.elements && Array.isArray(data.elements)) {
        setSuggestions(data.elements);
      }
    } catch (error) {
      console.error('Error generating time/effort elements:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    const remaining = MAX_ELEMENTS - timeEffortElements.length;
    const newSelected = new Set(selectedSuggestions);

    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else if (newSelected.size < remaining) {
      newSelected.add(index);
    }

    setSelectedSuggestions(newSelected);
  };

  const addSelectedSuggestions = () => {
    const newElements = Array.from(selectedSuggestions).map((i) => suggestions[i]);
    onElementsChange([...timeEffortElements, ...newElements]);
    setSuggestions([]);
    setSelectedSuggestions(new Set());
  };

  const removeElement = (index: number) => {
    const updated = timeEffortElements.filter((_, i) => i !== index);
    onElementsChange(updated);
  };

  const handleAddManual = () => {
    if (!manualText.trim() || !canAddMore) return;

    onElementsChange([
      ...timeEffortElements,
      { type: manualType, text: manualText.trim() },
    ]);
    setManualText('');
    setShowManualInput(false);
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-sm text-muted-foreground space-y-2 pb-4 mb-4 border-b border-border">
        <p>Show your audience the path is easier than they think.</p>
        <p>People overestimate how hard change will be. Quick wins build momentum, friction reducers remove obstacles. Think about:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>What early results can they see quickly?</li>
          <li>What common obstacles can you help them avoid?</li>
          <li>How can you make the process feel less overwhelming?</li>
        </ul>
      </div>

      {/* Saved Elements Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Quick Wins & Friction Reducers</label>
          <Badge variant="outline" className="text-xs">
            {timeEffortElements.length}/{MAX_ELEMENTS}
          </Badge>
        </div>

        {/* Saved Elements */}
        {timeEffortElements.length > 0 && (
          <div className="space-y-2">
            {timeEffortElements.map((element, index) => {
              const config = TYPE_CONFIG[element.type];
              const IconComponent = config.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-card"
                >
                  <Badge variant="outline" className={`shrink-0 ${config.color}`}>
                    <IconComponent className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                  <p className="text-sm flex-1">{element.text}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeElement(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Manual Add Section */}
        {showManualInput ? (
          <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <Select
                value={manualType}
                onValueChange={(v) => setManualType(v as TimeEffortElement['type'])}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quick_win">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3" />
                      Quick Win
                    </div>
                  </SelectItem>
                  <SelectItem value="friction_reducer">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="w-3 h-3" />
                      Friction Reducer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Enter a quick win or friction reducer..."
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualText.trim()) {
                  handleAddManual();
                }
              }}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAddManual} disabled={!manualText.trim()}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowManualInput(false);
                  setManualText('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          canAddMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManualInput(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Element
            </Button>
          )
        )}
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">AI Suggestions</p>
            <p className="text-xs text-muted-foreground">
              Select up to {MAX_ELEMENTS - timeEffortElements.length} elements
            </p>
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => {
              const isSelected = selectedSuggestions.has(index);
              const config = TYPE_CONFIG[suggestion.type];
              const IconComponent = config.icon;
              const canSelect = isSelected || selectedSuggestions.size < (MAX_ELEMENTS - timeEffortElements.length);

              return (
                <div
                  key={index}
                  onClick={() => canSelect && toggleSuggestion(index)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : canSelect
                      ? 'hover:border-muted-foreground/50'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <Badge variant="outline" className={`${config.color}`}>
                        <IconComponent className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                      <p className="text-sm">{suggestion.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {selectedSuggestions.size > 0 && (
            <Button onClick={addSelectedSuggestions} className="w-full">
              Add {selectedSuggestions.size} Selected Element{selectedSuggestions.size > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleGenerate}
          disabled={!niche || !targetAudience || isGenerating || !canAddMore}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {timeEffortElements.length > 0 ? "Regenerate with AI" : "Generate with AI"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Keep backward compatibility alias
export const TimeEffortSection = TimeEffortSectionContent;

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Check, X, Plus, Sparkles, Loader2, Shield, BarChart3, GraduationCap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export interface LikelihoodElement {
  type: 'objection_counter' | 'proof' | 'credibility';
  text: string;
}

interface LikelihoodSectionProps {
  mainObjections: string;
  likelihoodElements: LikelihoodElement[];
  niche: string;
  targetAudience: string;
  primaryPainPoint: string;
  desiredOutcome: string;
  onObjectionsChange: (value: string) => void;
  onElementsChange: (elements: LikelihoodElement[]) => void;
}

const MAX_ELEMENTS = 8;

const TYPE_CONFIG = {
  objection_counter: {
    label: 'Objection Counter',
    icon: Shield,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  },
  proof: {
    label: 'Proof',
    icon: BarChart3,
    color: 'bg-green-500/10 text-green-600 border-green-500/30',
  },
  credibility: {
    label: 'Credibility',
    icon: GraduationCap,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  },
};

export const LikelihoodSectionContent = ({
  mainObjections,
  likelihoodElements,
  niche,
  targetAudience,
  primaryPainPoint,
  desiredOutcome,
  onObjectionsChange,
  onElementsChange,
}: LikelihoodSectionProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<LikelihoodElement[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [manualType, setManualType] = useState<LikelihoodElement['type']>('objection_counter');

  const canAddMore = likelihoodElements.length < MAX_ELEMENTS;

  const handleGenerate = async () => {
    if (!mainObjections.trim()) return;

    setIsGenerating(true);
    setSuggestions([]);
    setSelectedSuggestions(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('generate-likelihood-elements', {
        body: {
          niche,
          targetAudience,
          primaryPainPoint,
          desiredOutcome,
          mainObjections,
        },
      });

      if (error) throw error;

      if (data?.elements && Array.isArray(data.elements)) {
        setSuggestions(data.elements);
      }
    } catch (error) {
      console.error('Error generating likelihood elements:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    const remaining = MAX_ELEMENTS - likelihoodElements.length;
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
    onElementsChange([...likelihoodElements, ...newElements]);
    setSuggestions([]);
    setSelectedSuggestions(new Set());
  };

  const removeElement = (index: number) => {
    const updated = likelihoodElements.filter((_, i) => i !== index);
    onElementsChange(updated);
  };

  const handleAddManual = () => {
    if (!manualText.trim() || !canAddMore) return;

    onElementsChange([
      ...likelihoodElements,
      { type: manualType, text: manualText.trim() },
    ]);
    setManualText('');
    setShowManualInput(false);
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="text-sm text-muted-foreground space-y-2 pb-4 mb-4 border-b border-border">
        <p>Address why your audience believes (or doubts) they can achieve the outcome.</p>
        <p>Even if your solution works, your audience may doubt it will work for them. This section helps you build trust by countering objections and showing proof. Consider:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>What objections or doubts do they have?</li>
          <li>What evidence or results can you show?</li>
          <li>What credentials, testimonials, or experience build your credibility?</li>
        </ul>
      </div>

      {/* Main Objections Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Main Objections & Doubts <span className="text-destructive">*</span>
        </label>
        <p className="text-xs text-muted-foreground">
          What objections or doubts does your audience have about achieving their desired outcome?
        </p>
        <Textarea
          placeholder="e.g., 'They don't have time, they've tried before and failed, they think it's too expensive, they're not sure if it will work for their specific situation...'"
          value={mainObjections}
          onChange={(e) => onObjectionsChange(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      {/* Saved Elements Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Proof & Credibility Elements</label>
          <Badge variant="outline" className="text-xs">
            {likelihoodElements.length}/{MAX_ELEMENTS}
          </Badge>
        </div>

        {/* Saved Elements */}
        {likelihoodElements.length > 0 && (
          <div className="space-y-2">
            {likelihoodElements.map((element, index) => {
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
                onValueChange={(v) => setManualType(v as LikelihoodElement['type'])}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="objection_counter">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      Objection Counter
                    </div>
                  </SelectItem>
                  <SelectItem value="proof">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" />
                      Proof
                    </div>
                  </SelectItem>
                  <SelectItem value="credibility">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3 h-3" />
                      Credibility
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Enter your proof or credibility element..."
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
              Select up to {MAX_ELEMENTS - likelihoodElements.length} elements
            </p>
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => {
              const isSelected = selectedSuggestions.has(index);
              const config = TYPE_CONFIG[suggestion.type];
              const IconComponent = config.icon;
              const canSelect = isSelected || selectedSuggestions.size < (MAX_ELEMENTS - likelihoodElements.length);

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
          disabled={!mainObjections.trim() || isGenerating || !canAddMore}
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
              {likelihoodElements.length > 0 ? "Regenerate with AI" : "Generate with AI"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Keep backward compatibility alias
export const LikelihoodSection = LikelihoodSectionContent;

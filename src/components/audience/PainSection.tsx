import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Sparkles, Loader2, Plus, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PainSectionProps {
  primaryPainPoint: string;
  painSymptoms: string[];
  niche: string;
  targetAudience: string;
  onPainPointChange: (value: string) => void;
  onSymptomsChange: (symptoms: string[]) => void;
}

const MAX_SYMPTOMS = 5;

export const PainSectionContent = ({
  primaryPainPoint,
  painSymptoms,
  niche,
  targetAudience,
  onPainPointChange,
  onSymptomsChange,
}: PainSectionProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canAddMore = painSymptoms.length < MAX_SYMPTOMS;
  const remainingSlots = MAX_SYMPTOMS - painSymptoms.length;

  const handleGenerate = async () => {
    if (!primaryPainPoint.trim()) {
      setError("Please enter a primary pain point first");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuggestions([]);
    setSelectedSuggestions(new Set());

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-pain-symptoms', {
        body: {
          niche,
          targetAudience,
          primaryPainPoint,
        },
      });

      if (fnError) throw fnError;

      if (data?.symptoms && Array.isArray(data.symptoms)) {
        // Filter out symptoms that are already saved
        const newSuggestions = data.symptoms.filter(
          (s: string) => !painSymptoms.includes(s)
        );
        setSuggestions(newSuggestions);
      }
    } catch (err) {
      console.error('Error generating symptoms:', err);
      setError('Failed to generate symptoms. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSuggestion = (symptom: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(symptom)) {
      newSelected.delete(symptom);
    } else {
      // Check if adding would exceed limit
      if (painSymptoms.length + newSelected.size >= MAX_SYMPTOMS) {
        return; // Don't allow selecting more
      }
      newSelected.add(symptom);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleAddSelected = () => {
    if (selectedSuggestions.size === 0) return;
    
    const newSymptoms = [...painSymptoms, ...Array.from(selectedSuggestions)].slice(0, MAX_SYMPTOMS);
    onSymptomsChange(newSymptoms);
    
    // Remove added suggestions from the list
    setSuggestions(suggestions.filter(s => !selectedSuggestions.has(s)));
    setSelectedSuggestions(new Set());
  };

  const handleRemoveSymptom = (symptom: string) => {
    onSymptomsChange(painSymptoms.filter(s => s !== symptom));
  };

  const handleAddManual = () => {
    if (!manualInput.trim() || !canAddMore) return;
    
    // Check for duplicates
    if (painSymptoms.includes(manualInput.trim())) {
      setError("This symptom is already added");
      return;
    }
    
    onSymptomsChange([...painSymptoms, manualInput.trim()]);
    setManualInput("");
    setShowManualInput(false);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="text-sm text-muted-foreground space-y-2 pb-2 border-b border-border">
        <p>Identify the core struggle and specific symptoms your audience experiences.</p>
        <p>Understanding their pain helps you speak directly to what they're feeling right now. Think about:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>What keeps them up at night?</li>
          <li>What have they already tried that didn't work?</li>
          <li>What frustrations do they experience daily because of this problem?</li>
        </ul>
      </div>

      {/* Primary Pain Point */}
      <div className="space-y-2">
        <Label htmlFor="primaryPainPoint" className="flex items-center gap-1">
          Primary Pain Point <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="primaryPainPoint"
          placeholder="What's the biggest frustration, challenge, or obstacle they face?"
          value={primaryPainPoint}
          onChange={(e) => onPainPointChange(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Example: "Constantly juggling tasks, never finishing what they start, feeling like they're falling behind"
        </p>
      </div>

      {/* Saved Pain Symptoms */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Pain Point Symptoms</Label>
            <p className="text-xs text-muted-foreground">
              Specific symptoms your audience experiences
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {painSymptoms.length}/{MAX_SYMPTOMS}
          </Badge>
        </div>

        {/* Saved Symptoms List */}
        {painSymptoms.length > 0 && (
          <div className="space-y-2">
            {painSymptoms.map((symptom, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border"
              >
                <span className="flex-1 text-sm">{symptom}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveSymptom(symptom)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Manual Add Input */}
        {showManualInput && canAddMore && (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter a pain point symptom..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddManual();
                }
                if (e.key === 'Escape') {
                  setShowManualInput(false);
                  setManualInput("");
                }
              }}
              autoFocus
            />
            <Button size="sm" onClick={handleAddManual} disabled={!manualInput.trim()}>
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowManualInput(false);
                setManualInput("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Add Manual Button */}
        {!showManualInput && canAddMore && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowManualInput(true)}
          >
            <Plus className="w-4 h-4" />
            Add Pain Point
          </Button>
        )}

        {/* Limit Reached Warning */}
        {!canAddMore && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-500/10 text-yellow-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            Maximum of {MAX_SYMPTOMS} symptoms reached
          </div>
        )}
      </div>

      {/* AI Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <Label className="text-sm">AI Suggestions</Label>
            <span className="text-xs text-muted-foreground">
              {selectedSuggestions.size} selected ({remainingSlots} slots remaining)
            </span>
          </div>
          <div className="space-y-2">
            {suggestions.map((symptom, index) => {
              const isSelected = selectedSuggestions.has(symptom);
              const isDisabled = !isSelected && selectedSuggestions.size >= remainingSlots;
              
              return (
                <div
                  key={index}
                  onClick={() => !isDisabled && toggleSuggestion(symptom)}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all
                    ${isSelected 
                      ? 'bg-primary/10 border-primary' 
                      : isDisabled
                        ? 'bg-muted/30 border-border opacity-50 cursor-not-allowed'
                        : 'bg-card border-border hover:border-primary/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5
                      ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'}
                    `}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm">{symptom}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {selectedSuggestions.size > 0 && (
            <Button size="sm" onClick={handleAddSelected} className="gap-2">
              <Plus className="w-4 h-4" />
              Add {selectedSuggestions.size} Selected
            </Button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Generate Button */}
      <div className="flex justify-end pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating || !primaryPainPoint.trim() || !canAddMore}
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
              {painSymptoms.length > 0 ? "Regenerate with AI" : "Generate with AI"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Keep backward compatibility alias
export const PainSection = PainSectionContent;

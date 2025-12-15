import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, RefreshCw, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AudienceData } from "./AudienceDiscovery";

interface TransformationStepProps {
  audienceData: AudienceData;
  transformationStatement: string;
  onChange: (statement: string) => void;
}

export const TransformationStep = ({
  audienceData,
  transformationStatement,
  onChange,
}: TransformationStepProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualStatement, setManualStatement] = useState(transformationStatement);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatement, setEditedStatement] = useState(transformationStatement);

  const handleGenerate = async () => {
    if (!audienceData.targetAudience || !audienceData.primaryPainPoint || !audienceData.desiredOutcome) {
      toast.error("Please complete the audience step first");
      return;
    }

    setIsGenerating(true);
    try {
      // Generate 3 variations
      const promises = Array(3).fill(null).map(() =>
        supabase.functions.invoke("generate-transformation", {
          body: {
            audience: audienceData.targetAudience,
            problem: audienceData.primaryPainPoint,
            result: audienceData.desiredOutcome,
          },
        })
      );

      const results = await Promise.all(promises);
      const statements = results
        .filter(r => !r.error && r.data?.statement)
        .map(r => r.data.statement);

      if (statements.length > 0) {
        setGeneratedOptions(statements);
        setHasGenerated(true);
        toast.success("Generated transformation statements!");
      } else {
        throw new Error("Failed to generate statements");
      }
    } catch (error) {
      console.error("Error generating statements:", error);
      toast.error("Failed to generate transformation statements");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (index: number) => {
    setSelectedIndex(index);
    onChange(generatedOptions[index]);
    setEditedStatement(generatedOptions[index]);
  };

  const handleUseManual = () => {
    if (!manualStatement.trim()) {
      toast.error("Please enter your statement");
      return;
    }
    onChange(manualStatement);
    setIsManualMode(false);
  };

  const handleSaveEdit = () => {
    onChange(editedStatement);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Transformation Statement
        </h2>
        <p className="text-muted-foreground">
          Create a powerful statement that articulates the transformation you provide.
        </p>
        <p className="text-sm text-muted-foreground italic mt-2">
          Formula: "I help [specific audience] [overcome specific problem/achieve specific state] so they can [desired result with measurable impact]."
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={!isManualMode ? "default" : "outline"}
          size="sm"
          onClick={() => setIsManualMode(false)}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate with AI
        </Button>
        <Button
          variant={isManualMode ? "default" : "outline"}
          size="sm"
          onClick={() => setIsManualMode(true)}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Write Your Own
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {isManualMode ? (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Your Transformation Statement</Label>
              <Textarea
                value={manualStatement}
                onChange={(e) => setManualStatement(e.target.value)}
                placeholder="I help [specific audience] [overcome specific problem/achieve specific state] so they can [desired result with measurable impact]."
                rows={4}
                className="min-h-[120px]"
              />
            </div>
            <Button onClick={handleUseManual}>
              <Check className="w-4 h-4 mr-2" />
              Use This Statement
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : hasGenerated ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate with AI
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>

            {/* Generated Options */}
            {generatedOptions.length > 0 && (
              <div className="space-y-3">
                <Label>Select a statement</Label>
                {generatedOptions.map((statement, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSelectOption(index)}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 text-left transition-all",
                      selectedIndex === index
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                        selectedIndex === index
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}>
                        {selectedIndex === index && (
                          <Check className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-foreground italic">"{statement}"</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Selected Statement with Edit */}
            {transformationStatement && !isEditing && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-foreground italic flex-1">
                    "{transformationStatement}"
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(true);
                      setEditedStatement(transformationStatement);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Edit Mode */}
            {isEditing && (
              <div className="space-y-3">
                <Label>Edit Statement</Label>
                <Textarea
                  value={editedStatement}
                  onChange={(e) => setEditedStatement(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

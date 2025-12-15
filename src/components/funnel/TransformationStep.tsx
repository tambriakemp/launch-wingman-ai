import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, RefreshCw, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AudienceData } from "./AudienceDiscovery";

interface TransformationStepProps {
  audienceData: AudienceData;
  transformationStatement: string;
  onChange: (statement: string) => void;
  funnelType?: string;
}

export const TransformationStep = ({
  audienceData,
  transformationStatement,
  onChange,
  funnelType,
}: TransformationStepProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("ai");
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
      // Generate 3 variations with full context
      const promises = Array(3).fill(null).map(() =>
        supabase.functions.invoke("generate-transformation", {
          body: {
            audience: audienceData.targetAudience,
            problem: audienceData.primaryPainPoint,
            result: audienceData.desiredOutcome,
            niche: audienceData.niche,
            funnelType: funnelType,
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
    toast.success("Statement saved!");
  };

  const handleSaveEdit = () => {
    onChange(editedStatement);
    setIsEditing(false);
    toast.success("Statement updated!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Transformation Statement
        </h2>
        <p className="text-muted-foreground">
          Create a powerful statement that articulates the transformation you provide.
          This step is optional but recommended.
        </p>
      </div>

      {/* Formula Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Formula:</span>{" "}
            <span className="italic">
              "I help [specific audience] [overcome specific problem/achieve specific state] 
              so they can [desired result with measurable impact]."
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                Write Your Own
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="space-y-6 mt-0">
              {/* Generate Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : hasGenerated ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Statements
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate 3 Statements
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Options */}
              {generatedOptions.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-base font-medium">Select a statement</Label>
                  <div className="space-y-3">
                    {generatedOptions.map((statement, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleSelectOption(index)}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 text-left transition-all bg-background",
                          selectedIndex === index
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
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
                          <p className="text-sm text-foreground">"{statement}"</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Statement with Edit */}
              {transformationStatement && !isEditing && activeTab === "ai" && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-emerald-600 mb-1">Selected Statement</p>
                      <p className="text-sm text-foreground">
                        "{transformationStatement}"
                      </p>
                    </div>
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
                <Card className="border-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Edit Statement</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={editedStatement}
                      onChange={(e) => setEditedStatement(e.target.value)}
                      rows={4}
                      className="bg-background"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 mt-0">
              <div className="space-y-3">
                <Label>Your Transformation Statement</Label>
                <Textarea
                  value={manualStatement}
                  onChange={(e) => setManualStatement(e.target.value)}
                  placeholder="I help [specific audience] [overcome specific problem/achieve specific state] so they can [desired result with measurable impact]."
                  rows={5}
                  className="bg-background min-h-[140px]"
                />
                <p className="text-xs text-muted-foreground">
                  Follow the formula above to create a compelling transformation statement
                </p>
              </div>
              <Button onClick={handleUseManual} disabled={!manualStatement.trim()}>
                <Check className="w-4 h-4 mr-2" />
                Use This Statement
              </Button>

              {transformationStatement && activeTab === "manual" && (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mt-4">
                  <p className="text-xs font-medium text-emerald-600 mb-1">Current Statement</p>
                  <p className="text-sm text-foreground">
                    "{transformationStatement}"
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

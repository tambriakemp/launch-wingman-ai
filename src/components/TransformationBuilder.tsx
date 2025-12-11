import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, RefreshCw, Save, Pencil, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TransformationBuilderProps {
  projectId: string;
  currentStatement: string | null;
  onStatementSaved: (statement: string) => void;
}

interface FormData {
  audience: string;
  problem: string;
  result: string;
}

export const TransformationBuilder = ({
  projectId,
  currentStatement,
  onStatementSaved,
}: TransformationBuilderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"questions" | "preview">("questions");
  const [formData, setFormData] = useState<FormData>({
    audience: "",
    problem: "",
    result: "",
  });
  const [generatedStatement, setGeneratedStatement] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatement, setEditedStatement] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.audience || !formData.problem || !formData.result) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-transformation", {
        body: formData,
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedStatement(data.statement);
      setEditedStatement(data.statement);
      setStep("preview");
    } catch (error) {
      console.error("Error generating statement:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate statement");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setIsEditing(false);
    await handleGenerate();
  };

  const handleSave = async () => {
    const statementToSave = isEditing ? editedStatement : generatedStatement;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("projects")
        .update({ transformation_statement: statementToSave })
        .eq("id", projectId);

      if (error) throw error;

      onStatementSaved(statementToSave);
      toast.success("Transformation statement saved!");
      handleClose();
    } catch (error) {
      console.error("Error saving statement:", error);
      toast.error("Failed to save statement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep("questions");
    setFormData({ audience: "", problem: "", result: "" });
    setGeneratedStatement("");
    setEditedStatement("");
    setIsEditing(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Sparkles className="w-4 h-4" />
        {currentStatement ? "Rebuild Statement" : "Build Transformation Statement"}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Build Your Transformation Statement
            </DialogTitle>
            <DialogDescription>
              Answer these questions to generate a powerful transformation statement for your launch.
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === "questions" && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4 pt-4"
              >
                <p className="text-sm text-muted-foreground italic">
                  Formula: "I help [specific audience] [overcome specific problem/achieve specific state] so they can [desired result with measurable impact]."
                </p>

                <div className="space-y-2">
                  <Label htmlFor="audience">Who is your specific audience?</Label>
                  <Input
                    id="audience"
                    placeholder="e.g., busy moms who want to start an online business"
                    value={formData.audience}
                    onChange={(e) => handleInputChange("audience", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problem">What problem do they face or what state do they want to achieve?</Label>
                  <Input
                    id="problem"
                    placeholder="e.g., overcome imposter syndrome and launch their first digital product"
                    value={formData.problem}
                    onChange={(e) => handleInputChange("problem", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="result">What is the desired result with measurable impact?</Label>
                  <Input
                    id="result"
                    placeholder="e.g., generate their first $5k month while working part-time hours"
                    value={formData.result}
                    onChange={(e) => handleInputChange("result", e.target.value)}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Statement
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 pt-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Your Transformation Statement</Label>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </Button>
                    )}
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedStatement(generatedStatement);
                        }}
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <Textarea
                      value={editedStatement}
                      onChange={(e) => setEditedStatement(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  ) : (
                    <div className="p-4 bg-accent rounded-lg">
                      <p className="text-foreground italic">"{generatedStatement}"</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep("questions")}
                  >
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Regenerate
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Statement
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};

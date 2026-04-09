import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ImageIcon, CheckCircle2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MODELS = [
  {
    id: "gemini",
    label: "Gemini 3 Pro Image",
    badge: "Default",
    badgeVariant: "secondary" as const,
    description: "Google's multimodal image generation. No additional API key required — works out of the box for all users.",
    pros: ["No setup required", "Covered by platform credits", "Good general quality"],
    note: null,
  },
  {
    id: "flux_kontext",
    label: "Flux Kontext Pro",
    badge: "Premium",
    badgeVariant: "default" as const,
    description: "Best-in-class character consistency. Keeps the subject identical across scenes — purpose-built for AI content creators.",
    pros: ["Superior character lock", "Photorealistic quality", "Better scene evolution"],
    note: "Requires a fal.ai API key (platform FAL_KEY or user BYOK). Falls back to Gemini if no key is available.",
  },
];

export function ImageModelToggle() {
  const [currentModel, setCurrentModel] = useState("gemini");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.functions.invoke("update-platform-settings", {
        body: { action: "get", key: "image_model" },
      });
      setCurrentModel(data?.value || "gemini");
    } catch (e) {
      console.error("Failed to load image model setting:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (modelId: string) => {
    if (modelId === currentModel) return;
    setIsSaving(true);
    try {
      await supabase.functions.invoke("update-platform-settings", {
        body: { action: "set", key: "image_model", value: modelId },
      });
      setCurrentModel(modelId);
      toast.success(`Image model switched to ${MODELS.find(m => m.id === modelId)?.label}`);
    } catch (e) {
      toast.error("Failed to update image model setting");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5" />
              AI Image Model
            </CardTitle>
            <CardDescription>
              Controls which model generates storyboard scene images
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MODELS.map((model) => {
                const isSelected = currentModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => !isSaving && handleSelect(model.id)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{model.label}</span>
                          <Badge variant={model.badgeVariant} className="text-xs">
                            {model.badge}
                          </Badge>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{model.description}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {model.pros.map(pro => (
                            <span key={pro} className="text-xs text-muted-foreground">
                              ✓ {pro}
                            </span>
                          ))}
                        </div>
                        {model.note && (
                          <div className="flex items-start gap-1.5 mt-1">
                            <Info className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-600 dark:text-amber-400">{model.note}</p>
                          </div>
                        )}
                      </div>
                      {isSaving && isSelected && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Changes take effect immediately for all new image generations. If Flux Kontext is selected but no fal.ai key is configured, the system automatically falls back to Gemini.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

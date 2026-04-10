import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Video, CheckCircle2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PROVIDERS = [
  {
    id: "fal",
    label: "fal.ai (Kling via fal)",
    badge: "Default",
    badgeVariant: "secondary" as const,
    description: "Uses the platform FAL_KEY or user BYOK fal.ai keys. Includes credit system and free monthly allowance.",
    pros: ["Credit system built-in", "Free monthly generations", "No user setup needed"],
    note: null,
  },
  {
    id: "kling",
    label: "Kling Direct API",
    badge: "Cost Saver",
    badgeVariant: "default" as const,
    description: "Users connect directly to Kling's API with their own keys. ~30% cheaper than fal.ai but requires each user to set up a Kling account.",
    pros: ["~30% lower cost", "No middleman markup", "Direct Kling features"],
    note: "Each user must add their own Kling Access Key + Secret Key in Settings. Credit system is bypassed — billing goes through each user's Kling account.",
  },
];

export function VideoProviderToggle() {
  const [currentProvider, setCurrentProvider] = useState("fal");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.functions.invoke("update-platform-settings", {
        body: { action: "get", key: "video_provider" },
      });
      setCurrentProvider(data?.value || "fal");
    } catch (e) {
      console.error("Failed to load video provider setting:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (providerId: string) => {
    if (providerId === currentProvider) return;
    setIsSaving(true);
    try {
      await supabase.functions.invoke("update-platform-settings", {
        body: { action: "set", key: "video_provider", value: providerId },
      });
      setCurrentProvider(providerId);
      toast.success(`Video provider switched to ${PROVIDERS.find(p => p.id === providerId)?.label}`);
    } catch (e) {
      toast.error("Failed to update video provider setting");
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
              <Video className="h-5 w-5" />
              Video Generation Provider
            </CardTitle>
            <CardDescription>
              Controls which backend is used for video generation in AI Studio
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
              {PROVIDERS.map((provider) => {
                const isSelected = currentProvider === provider.id;
                return (
                  <div
                    key={provider.id}
                    onClick={() => !isSaving && handleSelect(provider.id)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{provider.label}</span>
                          <Badge variant={provider.badgeVariant} className="text-xs">
                            {provider.badge}
                          </Badge>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{provider.description}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          {provider.pros.map(pro => (
                            <span key={pro} className="text-xs text-muted-foreground">
                              ✓ {pro}
                            </span>
                          ))}
                        </div>
                        {provider.note && (
                          <div className="flex items-start gap-1.5 mt-1">
                            <Info className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-600 dark:text-amber-400">{provider.note}</p>
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
              Changes take effect immediately. When Kling Direct is selected, users without Kling API keys will see a warning and won't be able to generate videos until they add their keys in Settings.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

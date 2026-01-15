import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, FlaskConical, Globe } from "lucide-react";
import { usePinterestEnvironmentSetting } from "@/hooks/usePinterestEnvironmentSetting";
import { toast } from "sonner";

export function PinterestEnvironmentToggle() {
  const { environment, setEnvironment, isLoading, isSaving } = usePinterestEnvironmentSetting();

  const handleToggle = (checked: boolean) => {
    const newEnv = checked ? "sandbox" : "production";
    setEnvironment(newEnv, {
      onSuccess: () => {
        toast.success(`Pinterest API switched to ${newEnv}`);
      },
      onError: () => {
        toast.error("Failed to update Pinterest environment");
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FlaskConical className="h-5 w-5" />
          Pinterest Environment
        </CardTitle>
        <CardDescription>
          Toggle between sandbox (for Trial access apps) and production API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="pinterest-env-toggle" className="font-medium">
                Use Sandbox API
              </Label>
              <p className="text-xs text-muted-foreground">
                Enable for Trial access apps. Pins only visible to you.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={environment === "sandbox" ? "default" : "secondary"}>
              {environment === "sandbox" ? "Sandbox" : "Production"}
            </Badge>
            <Switch
              id="pinterest-env-toggle"
              checked={environment === "sandbox"}
              onCheckedChange={handleToggle}
              disabled={isSaving}
            />
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <strong>Note:</strong> OAuth always uses production. Only API calls (fetching boards, posting pins) use the sandbox endpoint when enabled. This allows you to demo the full flow for Pinterest app approval.
        </div>
      </CardContent>
    </Card>
  );
}

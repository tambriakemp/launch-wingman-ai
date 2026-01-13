import { useTikTokEnvironment } from "@/contexts/TikTokEnvironmentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Video, FlaskConical, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function TikTokEnvironmentToggle() {
  const { environment, setEnvironment } = useTikTokEnvironment();
  const isSandbox = environment === "sandbox";

  const handleToggle = (checked: boolean) => {
    const newEnv = checked ? "sandbox" : "production";
    setEnvironment(newEnv);
    toast.success(`Switched to TikTok ${newEnv} mode`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">TikTok Environment</CardTitle>
              <CardDescription className="text-sm">
                Switch between production and sandbox mode
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={isSandbox ? "secondary" : "default"}
            className="flex items-center gap-1"
          >
            {isSandbox ? (
              <>
                <FlaskConical className="w-3 h-3" />
                Sandbox
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                Production
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${!isSandbox ? "text-primary" : "text-muted-foreground"}`} />
            <Label htmlFor="tiktok-env-toggle" className="cursor-pointer">
              <span className={!isSandbox ? "font-medium" : "text-muted-foreground"}>Production</span>
            </Label>
          </div>
          
          <Switch
            id="tiktok-env-toggle"
            checked={isSandbox}
            onCheckedChange={handleToggle}
          />
          
          <div className="flex items-center gap-2">
            <Label htmlFor="tiktok-env-toggle" className="cursor-pointer">
              <span className={isSandbox ? "font-medium" : "text-muted-foreground"}>Sandbox</span>
            </Label>
            <FlaskConical className={`w-4 h-4 ${isSandbox ? "text-primary" : "text-muted-foreground"}`} />
          </div>
        </div>
        
        {/* Environment-specific messaging */}
        {isSandbox ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium">Sandbox Mode Limitations:</p>
                <ul className="mt-1 space-y-0.5 text-xs list-disc list-inside">
                  <li>All posts are private (Only Me) until app is approved</li>
                  <li>Use sandbox credentials from TikTok Developer Portal</li>
                  <li>Videos will not appear publicly on TikTok</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-sm text-emerald-700 dark:text-emerald-300">
                <p className="font-medium">Production Mode Requirements:</p>
                <ul className="mt-1 space-y-0.5 text-xs list-disc list-inside">
                  <li>Your TikTok app must be approved by TikTok</li>
                  <li>Direct Post must be enabled in Developer Console</li>
                  <li>video.publish scope must be approved</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

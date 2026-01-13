import { useTikTokEnvironment } from "@/contexts/TikTokEnvironmentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Video, FlaskConical, Zap } from "lucide-react";
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
      <CardContent>
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
        
        <p className="text-xs text-muted-foreground mt-3">
          {isSandbox 
            ? "Sandbox mode uses TikTok's testing environment. Posts won't go live."
            : "Production mode posts directly to connected TikTok accounts."}
        </p>
      </CardContent>
    </Card>
  );
}

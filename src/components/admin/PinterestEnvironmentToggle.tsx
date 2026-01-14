import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { usePinterestEnvironment } from "@/contexts/PinterestEnvironmentContext";

export function PinterestEnvironmentToggle() {
  const { environment, setEnvironment } = usePinterestEnvironment();
  const isSandbox = environment === "sandbox";

  const handleToggle = (checked: boolean) => {
    const newEnv = checked ? "sandbox" : "production";
    setEnvironment(newEnv);
    toast.success(`Pinterest environment switched to ${newEnv}`, {
      description: checked
        ? "You'll now use Pinterest's sandbox API for testing"
        : "You'll now use Pinterest's production API",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FlaskConical className="h-5 w-5" />
              Pinterest Environment
            </CardTitle>
            <CardDescription>
              Switch between production and sandbox Pinterest API
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isSandbox ? "secondary" : "default"}>
              {isSandbox ? "Sandbox" : "Production"}
            </Badge>
            <Switch
              checked={isSandbox}
              onCheckedChange={handleToggle}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isSandbox ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Sandbox Mode Active
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  You're using Pinterest's sandbox API. Pins created in sandbox mode are for testing only 
                  and won't be visible publicly. Perfect for development and testing.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p>
              <strong>Production mode</strong> - Your pins will be posted to your live Pinterest account. 
              Make sure your Pinterest app has been approved for production access.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

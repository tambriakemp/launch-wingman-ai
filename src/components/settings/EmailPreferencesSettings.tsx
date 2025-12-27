import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Loader2 } from "lucide-react";
import { useEmailPreferences } from "@/hooks/useEmailPreferences";
import { toast } from "sonner";

export function EmailPreferencesSettings() {
  const { preferences, isLoading, updatePreferences, isUpdating } = useEmailPreferences();

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    try {
      await updatePreferences({ [key]: value });
      toast.success("Email preferences updated");
    } catch {
      toast.error("Failed to update preferences");
    }
  };

  if (isLoading) {
    return (
      <Card variant="elevated">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Control which emails you receive. We respect your pace — no pressure, no spam.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="product-emails" className="text-base">Product updates</Label>
            <p className="text-sm text-muted-foreground">
              Occasional updates about new features and improvements
            </p>
          </div>
          <Switch
            id="product-emails"
            checked={preferences.product_emails_enabled}
            onCheckedChange={(checked) => handleToggle("product_emails_enabled", checked)}
            disabled={isUpdating}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="checkin-emails" className="text-base">Check-in reminders</Label>
            <p className="text-sm text-muted-foreground">
              Gentle reminders for your monthly or quarterly check-ins
            </p>
          </div>
          <Switch
            id="checkin-emails"
            checked={preferences.check_in_emails_enabled}
            onCheckedChange={(checked) => handleToggle("check_in_emails_enabled", checked)}
            disabled={isUpdating}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="relaunch-emails" className="text-base">Relaunch invitations</Label>
            <p className="text-sm text-muted-foreground">
              Optional nudges when you might be ready for another launch
            </p>
          </div>
          <Switch
            id="relaunch-emails"
            checked={preferences.relaunch_emails_enabled}
            onCheckedChange={(checked) => handleToggle("relaunch_emails_enabled", checked)}
            disabled={isUpdating}
          />
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t">
          Billing and account-related emails are always sent regardless of these settings.
        </p>
      </CardContent>
    </Card>
  );
}

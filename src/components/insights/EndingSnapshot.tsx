import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Target, Save, Check } from "lucide-react";
import { toast } from "sonner";

interface EndingSnapshotProps {
  snapshot?: {
    sales_count?: number | null;
    launch_revenue?: number | null;
    new_followers?: number | null;
    email_list_growth?: number | null;
    reflection_note?: string | null;
  } | null;
  startingSnapshot?: {
    instagram_followers?: number | null;
    facebook_followers?: number | null;
    tiktok_followers?: number | null;
    email_list_size?: number | null;
  } | null;
  onSave: (data: {
    sales_count?: number | null;
    launch_revenue?: number | null;
    new_followers?: number | null;
    email_list_growth?: number | null;
    reflection_note?: string | null;
  }) => void;
  isSaving: boolean;
}

export function EndingSnapshot({ snapshot, startingSnapshot, onSave, isSaving }: EndingSnapshotProps) {
  const [salesCount, setSalesCount] = useState<string>("");
  const [launchRevenue, setLaunchRevenue] = useState<string>("");
  const [newFollowers, setNewFollowers] = useState<string>("");
  const [emailListGrowth, setEmailListGrowth] = useState<string>("");
  const [reflectionNote, setReflectionNote] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (snapshot) {
      setSalesCount(snapshot.sales_count?.toString() || "");
      setLaunchRevenue(snapshot.launch_revenue?.toString() || "");
      setNewFollowers(snapshot.new_followers?.toString() || "");
      setEmailListGrowth(snapshot.email_list_growth?.toString() || "");
      setReflectionNote(snapshot.reflection_note || "");
    }
  }, [snapshot]);

  const handleSave = () => {
    onSave({
      sales_count: salesCount ? parseInt(salesCount) : null,
      launch_revenue: launchRevenue ? parseFloat(launchRevenue) : null,
      new_followers: newFollowers ? parseInt(newFollowers) : null,
      email_list_growth: emailListGrowth ? parseInt(emailListGrowth) : null,
      reflection_note: reflectionNote || null,
    });
    setHasChanges(false);
    toast.success("End of launch snapshot saved");
  };

  const handleChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  // Calculate total starting followers for context
  const totalStartingFollowers = 
    (startingSnapshot?.instagram_followers || 0) + 
    (startingSnapshot?.facebook_followers || 0) + 
    (startingSnapshot?.tiktok_followers || 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-lg">End of Launch</CardTitle>
            <CardDescription>
              Capture where you landed. All fields are optional.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Launch Results */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground">Launch Results</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sales" className="text-sm">Sales count</Label>
              <Input
                id="sales"
                type="number"
                placeholder="Optional"
                value={salesCount}
                onChange={handleChange(setSalesCount)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revenue" className="text-sm">Revenue from launch</Label>
              <Input
                id="revenue"
                type="number"
                placeholder="Optional"
                value={launchRevenue}
                onChange={handleChange(setLaunchRevenue)}
              />
            </div>
          </div>
        </div>

        {/* Growth */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground">Growth</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newFollowers" className="text-sm">
                New followers gained
                {totalStartingFollowers > 0 && (
                  <span className="text-muted-foreground font-normal ml-1">
                    (started with {totalStartingFollowers.toLocaleString()})
                  </span>
                )}
              </Label>
              <Input
                id="newFollowers"
                type="number"
                placeholder="Optional"
                value={newFollowers}
                onChange={handleChange(setNewFollowers)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailGrowth" className="text-sm">
                Email list growth
                {startingSnapshot?.email_list_size && (
                  <span className="text-muted-foreground font-normal ml-1">
                    (started with {startingSnapshot.email_list_size.toLocaleString()})
                  </span>
                )}
              </Label>
              <Input
                id="emailGrowth"
                type="number"
                placeholder="Optional"
                value={emailListGrowth}
                onChange={handleChange(setEmailListGrowth)}
              />
            </div>
          </div>
        </div>

        {/* Reflection */}
        <div className="space-y-2">
          <Label htmlFor="reflection" className="text-sm font-medium text-muted-foreground">
            What felt different this time?
          </Label>
          <Textarea
            id="reflection"
            placeholder="Take a moment to reflect on this launch..."
            value={reflectionNote}
            onChange={handleChange(setReflectionNote)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            size="sm"
          >
            {isSaving ? (
              <>Saving...</>
            ) : snapshot ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Update
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

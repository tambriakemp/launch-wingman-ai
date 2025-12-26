import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag, Save, Check } from "lucide-react";
import { toast } from "sonner";

interface StartingSnapshotProps {
  snapshot?: {
    instagram_followers?: number | null;
    facebook_followers?: number | null;
    tiktok_followers?: number | null;
    email_list_size?: number | null;
    monthly_revenue?: number | null;
    ytd_revenue?: number | null;
    confidence_level?: string | null;
  } | null;
  onSave: (data: {
    instagram_followers?: number | null;
    facebook_followers?: number | null;
    tiktok_followers?: number | null;
    email_list_size?: number | null;
    monthly_revenue?: number | null;
    ytd_revenue?: number | null;
    confidence_level?: string | null;
  }) => void;
  isSaving: boolean;
}

export function StartingSnapshot({ snapshot, onSave, isSaving }: StartingSnapshotProps) {
  const [instagramFollowers, setInstagramFollowers] = useState<string>("");
  const [facebookFollowers, setFacebookFollowers] = useState<string>("");
  const [tiktokFollowers, setTiktokFollowers] = useState<string>("");
  const [emailListSize, setEmailListSize] = useState<string>("");
  const [monthlyRevenue, setMonthlyRevenue] = useState<string>("");
  const [ytdRevenue, setYtdRevenue] = useState<string>("");
  const [confidenceLevel, setConfidenceLevel] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (snapshot) {
      setInstagramFollowers(snapshot.instagram_followers?.toString() || "");
      setFacebookFollowers(snapshot.facebook_followers?.toString() || "");
      setTiktokFollowers(snapshot.tiktok_followers?.toString() || "");
      setEmailListSize(snapshot.email_list_size?.toString() || "");
      setMonthlyRevenue(snapshot.monthly_revenue?.toString() || "");
      setYtdRevenue(snapshot.ytd_revenue?.toString() || "");
      setConfidenceLevel(snapshot.confidence_level || "");
    }
  }, [snapshot]);

  const handleSave = () => {
    onSave({
      instagram_followers: instagramFollowers ? parseInt(instagramFollowers) : null,
      facebook_followers: facebookFollowers ? parseInt(facebookFollowers) : null,
      tiktok_followers: tiktokFollowers ? parseInt(tiktokFollowers) : null,
      email_list_size: emailListSize ? parseInt(emailListSize) : null,
      monthly_revenue: monthlyRevenue ? parseFloat(monthlyRevenue) : null,
      ytd_revenue: ytdRevenue ? parseFloat(ytdRevenue) : null,
      confidence_level: confidenceLevel || null,
    });
    setHasChanges(false);
    toast.success("Starting snapshot saved");
  };

  const handleChange = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setHasChanges(true);
  };

  const handleConfidenceChange = (value: string) => {
    setConfidenceLevel(value);
    setHasChanges(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Flag className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Starting Point</CardTitle>
            <CardDescription>
              Where you are when this launch begins. All fields are optional.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audience Size */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground">Audience Size</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="text-sm">Instagram followers</Label>
              <Input
                id="instagram"
                type="number"
                placeholder="Optional"
                value={instagramFollowers}
                onChange={handleChange(setInstagramFollowers)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook" className="text-sm">Facebook followers</Label>
              <Input
                id="facebook"
                type="number"
                placeholder="Optional"
                value={facebookFollowers}
                onChange={handleChange(setFacebookFollowers)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok" className="text-sm">TikTok followers</Label>
              <Input
                id="tiktok"
                type="number"
                placeholder="Optional"
                value={tiktokFollowers}
                onChange={handleChange(setTiktokFollowers)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email list size</Label>
              <Input
                id="email"
                type="number"
                placeholder="Optional"
                value={emailListSize}
                onChange={handleChange(setEmailListSize)}
              />
            </div>
          </div>
        </div>

        {/* Revenue Baseline */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground">Revenue Baseline</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly" className="text-sm">Monthly revenue</Label>
              <Input
                id="monthly"
                type="number"
                placeholder="Optional"
                value={monthlyRevenue}
                onChange={handleChange(setMonthlyRevenue)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ytd" className="text-sm">Year-to-date revenue</Label>
              <Input
                id="ytd"
                type="number"
                placeholder="Optional"
                value={ytdRevenue}
                onChange={handleChange(setYtdRevenue)}
              />
            </div>
          </div>
        </div>

        {/* Confidence Check */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-muted-foreground">
            How confident did you feel going into this launch?
          </Label>
          <RadioGroup
            value={confidenceLevel}
            onValueChange={handleConfidenceChange}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unsure" id="unsure" />
              <Label htmlFor="unsure" className="text-sm cursor-pointer">Unsure</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="somewhat" id="somewhat" />
              <Label htmlFor="somewhat" className="text-sm cursor-pointer">Somewhat</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="confident" id="confident" />
              <Label htmlFor="confident" className="text-sm cursor-pointer">Confident</Label>
            </div>
          </RadioGroup>
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

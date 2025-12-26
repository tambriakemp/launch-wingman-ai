import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface MetricUpdateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    instagram_followers?: number | null;
    facebook_followers?: number | null;
    tiktok_followers?: number | null;
    email_list_size?: number | null;
    monthly_revenue?: number | null;
    ytd_revenue?: number | null;
    notes?: string | null;
  }) => void;
  isSaving: boolean;
  previousValues?: {
    instagram_followers?: number | null;
    facebook_followers?: number | null;
    tiktok_followers?: number | null;
    email_list_size?: number | null;
    monthly_revenue?: number | null;
    ytd_revenue?: number | null;
  };
}

export function MetricUpdateSheet({
  open,
  onOpenChange,
  onSave,
  isSaving,
  previousValues,
}: MetricUpdateSheetProps) {
  const [instagramFollowers, setInstagramFollowers] = useState(previousValues?.instagram_followers?.toString() || "");
  const [facebookFollowers, setFacebookFollowers] = useState(previousValues?.facebook_followers?.toString() || "");
  const [tiktokFollowers, setTiktokFollowers] = useState(previousValues?.tiktok_followers?.toString() || "");
  const [emailListSize, setEmailListSize] = useState(previousValues?.email_list_size?.toString() || "");
  const [monthlyRevenue, setMonthlyRevenue] = useState(previousValues?.monthly_revenue?.toString() || "");
  const [ytdRevenue, setYtdRevenue] = useState(previousValues?.ytd_revenue?.toString() || "");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    onSave({
      instagram_followers: instagramFollowers ? parseInt(instagramFollowers) : null,
      facebook_followers: facebookFollowers ? parseInt(facebookFollowers) : null,
      tiktok_followers: tiktokFollowers ? parseInt(tiktokFollowers) : null,
      email_list_size: emailListSize ? parseInt(emailListSize) : null,
      monthly_revenue: monthlyRevenue ? parseFloat(monthlyRevenue) : null,
      ytd_revenue: ytdRevenue ? parseFloat(ytdRevenue) : null,
      notes: notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Your Metrics</DialogTitle>
          <DialogDescription>
            Log your current numbers to track your growth over time. 
            Only fill in what you'd like to track.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Audience Size */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Audience Size</h4>
            
            <div className="space-y-2">
              <Label htmlFor="instagram" className="text-sm text-muted-foreground">
                Instagram Followers
              </Label>
              <Input
                id="instagram"
                type="number"
                placeholder="e.g., 1500"
                value={instagramFollowers}
                onChange={(e) => setInstagramFollowers(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook" className="text-sm text-muted-foreground">
                Facebook Followers
              </Label>
              <Input
                id="facebook"
                type="number"
                placeholder="e.g., 500"
                value={facebookFollowers}
                onChange={(e) => setFacebookFollowers(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok" className="text-sm text-muted-foreground">
                TikTok Followers
              </Label>
              <Input
                id="tiktok"
                type="number"
                placeholder="e.g., 2000"
                value={tiktokFollowers}
                onChange={(e) => setTiktokFollowers(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">
                Email List Size
              </Label>
              <Input
                id="email"
                type="number"
                placeholder="e.g., 800"
                value={emailListSize}
                onChange={(e) => setEmailListSize(e.target.value)}
              />
            </div>
          </div>

          {/* Revenue */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Revenue</h4>
            
            <div className="space-y-2">
              <Label htmlFor="monthly-revenue" className="text-sm text-muted-foreground">
                Monthly Revenue ($)
              </Label>
              <Input
                id="monthly-revenue"
                type="number"
                step="0.01"
                placeholder="e.g., 5000"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ytd-revenue" className="text-sm text-muted-foreground">
                Year-to-Date Revenue ($)
              </Label>
              <Input
                id="ytd-revenue"
                type="number"
                step="0.01"
                placeholder="e.g., 25000"
                value={ytdRevenue}
                onChange={(e) => setYtdRevenue(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-foreground">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any reflections or context about this month..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Update"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

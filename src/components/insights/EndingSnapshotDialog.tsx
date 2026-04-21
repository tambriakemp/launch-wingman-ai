import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Target, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EndingSnapshotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName?: string;
}

export function EndingSnapshotDialog({ 
  open, 
  onOpenChange, 
  projectId,
  projectName 
}: EndingSnapshotDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  
  const [salesCount, setSalesCount] = useState<string>("");
  const [launchRevenue, setLaunchRevenue] = useState<string>("");
  const [newFollowers, setNewFollowers] = useState<string>("");
  const [emailListGrowth, setEmailListGrowth] = useState<string>("");
  const [reflectionNote, setReflectionNote] = useState<string>("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSalesCount("");
      setLaunchRevenue("");
      setNewFollowers("");
      setEmailListGrowth("");
      setReflectionNote("");
    }
  }, [open]);

  const handleSave = async () => {
    if (!user || !projectId) return;
    
    setIsSaving(true);
    try {
      // Check if ending snapshot already exists
      const { data: existing } = await supabase
        .from('launch_snapshots')
        .select('id')
        .eq('project_id', projectId)
        .eq('snapshot_type', 'ending')
        .maybeSingle();

      const snapshotData = {
        sales_count: salesCount ? parseInt(salesCount) : null,
        launch_revenue: launchRevenue ? parseFloat(launchRevenue) : null,
        new_followers: newFollowers ? parseInt(newFollowers) : null,
        email_list_growth: emailListGrowth ? parseInt(emailListGrowth) : null,
        reflection_note: reflectionNote || null,
      };

      if (existing) {
        await supabase
          .from('launch_snapshots')
          .update({
            ...snapshotData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('launch_snapshots')
          .insert({
            ...snapshotData,
            snapshot_type: 'ending',
            project_id: projectId,
            user_id: user.id,
          });
      }

      queryClient.invalidateQueries({ queryKey: ['launch-snapshots', projectId] });
      queryClient.invalidateQueries({ queryKey: ['all-launch-snapshots'] });
      toast.success("Launch snapshot saved");
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving ending snapshot:', err);
      toast.error("Failed to save snapshot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 max-h-[calc(100vh-48px)] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <PartyPopper className="w-5 h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <DialogTitle>Congratulations on your launch!</DialogTitle>
              <DialogDescription>
                Take a moment to capture how it went. All fields are optional.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-[hsl(var(--paper-100))] px-8 py-6 space-y-5">
          {/* Launch Results */}
          <div className="space-y-3">
            <Label className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--terracotta-500))]">Launch Results</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sales">Sales count</Label>
                <Input
                  id="sales"
                  type="number"
                  placeholder="Optional"
                  value={salesCount}
                  onChange={(e) => setSalesCount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="revenue">Revenue from launch</Label>
                <Input
                  id="revenue"
                  type="number"
                  placeholder="Optional"
                  value={launchRevenue}
                  onChange={(e) => setLaunchRevenue(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Growth */}
          <div className="space-y-3">
            <Label className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--terracotta-500))]">Growth</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="newFollowers">New followers gained</Label>
                <Input
                  id="newFollowers"
                  type="number"
                  placeholder="Optional"
                  value={newFollowers}
                  onChange={(e) => setNewFollowers(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emailGrowth">Email list growth</Label>
                <Input
                  id="emailGrowth"
                  type="number"
                  placeholder="Optional"
                  value={emailListGrowth}
                  onChange={(e) => setEmailListGrowth(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Reflection */}
          <div className="space-y-1.5">
            <Label htmlFor="reflection">What felt different this time?</Label>
            <Textarea
              id="reflection"
              placeholder="Take a moment to reflect..."
              value={reflectionNote}
              onChange={(e) => setReflectionNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isSaving}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Snapshot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

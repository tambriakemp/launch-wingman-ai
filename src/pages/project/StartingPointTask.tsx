import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Loader2, Check, Sparkles, HelpCircle, Flag, Instagram, Facebook } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskEngine } from "@/hooks/useTaskEngine";
import { toast } from "sonner";
import { PHASE_LABELS } from "@/types/tasks";
import { EditorialTaskShell } from "@/components/task/EditorialTaskShell";

// Custom TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function StartingPointTask() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [showEstimateHelp, setShowEstimateHelp] = useState(false);
  
  // Form state
  const [instagramFollowers, setInstagramFollowers] = useState("");
  const [facebookFollowers, setFacebookFollowers] = useState("");
  const [tiktokFollowers, setTiktokFollowers] = useState("");
  const [emailListSize, setEmailListSize] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [ytdRevenue, setYtdRevenue] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState("");

  const {
    isLoading: engineLoading,
    getTaskTemplate,
    completeTask,
    projectTasks,
  } = useTaskEngine({ projectId: projectId || "" });

  const taskTemplate = useMemo(() => getTaskTemplate('launch_capture_starting_point'), [getTaskTemplate]);
  const projectTask = useMemo(() => 
    projectTasks.find(pt => pt.taskId === 'launch_capture_starting_point'), 
    [projectTasks]
  );

  // Check if there's already a starting snapshot
  const { data: existingSnapshot } = useQuery({
    queryKey: ['launch-snapshots', projectId, 'starting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('launch_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .eq('snapshot_type', 'starting')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Pre-fill form if snapshot exists
  useEffect(() => {
    if (existingSnapshot) {
      setInstagramFollowers(existingSnapshot.instagram_followers?.toString() || "");
      setFacebookFollowers(existingSnapshot.facebook_followers?.toString() || "");
      setTiktokFollowers(existingSnapshot.tiktok_followers?.toString() || "");
      setEmailListSize(existingSnapshot.email_list_size?.toString() || "");
      setMonthlyRevenue(existingSnapshot.monthly_revenue?.toString() || "");
      setYtdRevenue(existingSnapshot.ytd_revenue?.toString() || "");
      setConfidenceLevel(existingSnapshot.confidence_level || "");
    }
  }, [existingSnapshot]);

  const handleSaveAndComplete = async () => {
    if (!user || !projectId) return;
    
    setIsSaving(true);
    try {
      // Save to launch_snapshots table
      const snapshotData = {
        instagram_followers: instagramFollowers ? parseInt(instagramFollowers) : null,
        facebook_followers: facebookFollowers ? parseInt(facebookFollowers) : null,
        tiktok_followers: tiktokFollowers ? parseInt(tiktokFollowers) : null,
        email_list_size: emailListSize ? parseInt(emailListSize) : null,
        monthly_revenue: monthlyRevenue ? parseFloat(monthlyRevenue) : null,
        ytd_revenue: ytdRevenue ? parseFloat(ytdRevenue) : null,
        confidence_level: confidenceLevel || null,
      };

      if (existingSnapshot) {
        await supabase
          .from('launch_snapshots')
          .update({
            ...snapshotData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSnapshot.id);
      } else {
        await supabase
          .from('launch_snapshots')
          .insert({
            ...snapshotData,
            snapshot_type: 'starting',
            project_id: projectId,
            user_id: user.id,
          });
      }

      // Complete the task
      await completeTask('launch_capture_starting_point', {
        captured: true,
        hasData: Object.values(snapshotData).some(v => v !== null),
      });

      queryClient.invalidateQueries({ queryKey: ['launch-snapshots', projectId] });
      toast.success("Starting point captured!");
      navigate(`/projects/${projectId}/dashboard`);
    } catch (error) {
      console.error('Error saving starting point:', error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!projectId) return;
    
    setIsSaving(true);
    try {
      await completeTask('launch_capture_starting_point', {
        captured: false,
        skipped: true,
      });
      toast.success("Task skipped. You can always come back to this later.");
      navigate(`/projects/${projectId}/dashboard`);
    } catch (error) {
      console.error('Error skipping task:', error);
      toast.error("Failed to skip task.");
    } finally {
      setIsSaving(false);
    }
  };

  if (engineLoading || !taskTemplate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  const timeRange = `${taskTemplate.estimatedMinutesMin}–${taskTemplate.estimatedMinutesMax} minutes`;

  return (
    <EditorialTaskShell
      projectId={projectId!}
      taskId="launch_capture_starting_point"
      phase={taskTemplate.phase}
      title={taskTemplate.title}
      whyItMatters={taskTemplate.whyItMatters}
      instructions={taskTemplate.instructions}
      estimatedTimeRange={timeRange}
      footer={
        <>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isSaving}
              className="text-fg-muted"
            >
              Skip for now
            </Button>
            <Button onClick={handleSaveAndComplete} disabled={isSaving} className="flex-1">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Continue"
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-fg-muted mt-6">
            All fields are optional. This is for personal reflection only — not performance tracking.
          </p>
        </>
      }
    >
      <div className="space-y-6">
        {/* Audience Size */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-ink-900">Audience Size</h3>
          <p className="text-sm text-fg-muted -mt-2">
            Rough estimates are fine — skip any you don't track.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="text-sm text-fg-muted flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-500" />
                Instagram followers
              </Label>
              <Input id="instagram" type="number" placeholder="Optional" value={instagramFollowers} onChange={(e) => setInstagramFollowers(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook" className="text-sm text-fg-muted flex items-center gap-2">
                <Facebook className="w-4 h-4 text-blue-600" />
                Facebook followers
              </Label>
              <Input id="facebook" type="number" placeholder="Optional" value={facebookFollowers} onChange={(e) => setFacebookFollowers(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok" className="text-sm text-fg-muted flex items-center gap-2">
                <TikTokIcon className="w-4 h-4" />
                TikTok followers
              </Label>
              <Input id="tiktok" type="number" placeholder="Optional" value={tiktokFollowers} onChange={(e) => setTiktokFollowers(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-fg-muted">Email list size</Label>
              <Input id="email" type="number" placeholder="Optional" value={emailListSize} onChange={(e) => setEmailListSize(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Revenue Context */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-ink-900">Revenue Context</h3>
          <p className="text-sm text-fg-muted -mt-2">This is just for your reference — completely optional.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly" className="text-sm text-fg-muted">Monthly revenue ($)</Label>
              <Input id="monthly" type="number" step="0.01" placeholder="Optional" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearly" className="text-sm text-fg-muted">Yearly revenue ($)</Label>
              <Input id="yearly" type="number" step="0.01" placeholder="Optional" value={ytdRevenue} onChange={(e) => setYtdRevenue(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Confidence Check */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-ink-900">Confidence Check</h3>
          <p className="text-sm text-fg-muted -mt-2">How confident are you in these numbers?</p>
          <RadioGroup value={confidenceLevel} onValueChange={setConfidenceLevel}>
            <div className="space-y-2">
              <Label htmlFor="unsure" className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${confidenceLevel === "unsure" ? "border-primary bg-primary/5" : "border-hairline hover:border-fg-muted/30"}`}>
                <RadioGroupItem value="unsure" id="unsure" />
                <div>
                  <span className="font-medium">Unsure</span>
                  <p className="text-sm text-fg-muted">These are rough guesses</p>
                </div>
              </Label>
              <Label htmlFor="somewhat" className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${confidenceLevel === "somewhat" ? "border-primary bg-primary/5" : "border-hairline hover:border-fg-muted/30"}`}>
                <RadioGroupItem value="somewhat" id="somewhat" />
                <div>
                  <span className="font-medium">Somewhat confident</span>
                  <p className="text-sm text-fg-muted">Close enough for reflection</p>
                </div>
              </Label>
              <Label htmlFor="confident" className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${confidenceLevel === "confident" ? "border-primary bg-primary/5" : "border-hairline hover:border-fg-muted/30"}`}>
                <RadioGroupItem value="confident" id="confident" />
                <div>
                  <span className="font-medium">Confident</span>
                  <p className="text-sm text-fg-muted">I checked my numbers</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Help me estimate */}
        <motion.div className="p-4 rounded-xl bg-paper-200/50 border border-hairline" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => setShowEstimateHelp(!showEstimateHelp)} className="flex items-center gap-2 text-sm font-medium text-fg-muted hover:text-ink-900 transition-colors w-full">
            <Sparkles className="w-4 h-4" />
            <span>Help me estimate</span>
            <HelpCircle className="w-4 h-4 ml-auto" />
          </button>
          <AnimatePresence>
            {showEstimateHelp && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-hairline text-sm text-fg-muted space-y-3">
                <p className="font-medium text-ink-900">How to approximate your numbers:</p>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Social followers:</strong> Check your profile — the number shown is usually accurate enough.</li>
                  <li><strong>Email list:</strong> Log into your email platform and look at your subscriber count.</li>
                  <li><strong>Revenue:</strong> Check your payment processor (Stripe, PayPal) or estimate based on recent months.</li>
                  <li><strong>Don't have exact numbers?</strong> Round to the nearest hundred — that's perfectly fine for reflection.</li>
                </ul>
                <p className="text-xs">Remember: This data is for you, not for performance tracking. Estimates are acceptable.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </EditorialTaskShell>
  );
}

import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, BookOpen } from "lucide-react";
import { AnnualReviewView } from "@/components/settings/AnnualReviewView";
import { useAnnualReview } from "@/hooks/useAnnualReview";
import { 
  StartingSnapshot, 
  EndingSnapshot, 
  ComparisonView,
  InsightsDashboard,
  MetricUpdateSheet,
  InsightsReminder 
} from "@/components/insights";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";

export default function Insights() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useFeatureAccess();
  const queryClient = useQueryClient();
  const [isMetricSheetOpen, setIsMetricSheetOpen] = useState(false);
  const [showAnnualReview, setShowAnnualReview] = useState(false);
  const { data: annualReviewData } = useAnnualReview();
  
  const canAccessInsights = hasAccess('insights_history');

  // Fetch current project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch all projects for comparison
  const { data: allProjects } = useQuery({
    queryKey: ['all-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch snapshots for current project
  const { data: snapshots, isLoading: snapshotsLoading } = useQuery({
    queryKey: ['launch-snapshots', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('launch_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch metric updates for current project
  const { data: metricUpdates, isLoading: metricsLoading } = useQuery({
    queryKey: ['metric-updates', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metric_updates')
        .select('*')
        .eq('project_id', projectId)
        .order('recorded_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch all snapshots for comparison
  const { data: allSnapshots } = useQuery({
    queryKey: ['all-launch-snapshots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('launch_snapshots')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const startingSnapshot = snapshots?.find(s => s.snapshot_type === 'starting');
  const endingSnapshot = snapshots?.find(s => s.snapshot_type === 'ending');

  // Determine if project is in post-launch state
  const isPostLaunch = project?.status === 'launched' || project?.status === 'post-launch';

  // Check if starting snapshot has data
  const hasStartingData = startingSnapshot && (
    startingSnapshot.instagram_followers ||
    startingSnapshot.facebook_followers ||
    startingSnapshot.tiktok_followers ||
    startingSnapshot.email_list_size ||
    startingSnapshot.monthly_revenue ||
    startingSnapshot.ytd_revenue ||
    startingSnapshot.confidence_level
  );

  // Get last metric update date for reminder
  const lastMetricUpdateDate = metricUpdates?.[0]?.recorded_at 
    ? new Date(metricUpdates[0].recorded_at)
    : startingSnapshot?.last_metric_update 
      ? new Date(startingSnapshot.last_metric_update)
      : startingSnapshot?.created_at 
        ? new Date(startingSnapshot.created_at)
        : null;

  // Save snapshot mutation
  const saveSnapshotMutation = useMutation({
    mutationFn: async (data: {
      snapshot_type: 'starting' | 'ending';
      instagram_followers?: number | null;
      facebook_followers?: number | null;
      tiktok_followers?: number | null;
      email_list_size?: number | null;
      monthly_revenue?: number | null;
      ytd_revenue?: number | null;
      confidence_level?: string | null;
      sales_count?: number | null;
      launch_revenue?: number | null;
      new_followers?: number | null;
      email_list_growth?: number | null;
      reflection_note?: string | null;
    }) => {
      const existingSnapshot = snapshots?.find(s => s.snapshot_type === data.snapshot_type);
      
      if (existingSnapshot) {
        const { error } = await supabase
          .from('launch_snapshots')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSnapshot.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('launch_snapshots')
          .insert({
            ...data,
            project_id: projectId,
            user_id: user?.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['launch-snapshots', projectId] });
      queryClient.invalidateQueries({ queryKey: ['all-launch-snapshots'] });
    },
  });

  // Save metric update mutation
  const saveMetricUpdateMutation = useMutation({
    mutationFn: async (data: {
      instagram_followers?: number | null;
      facebook_followers?: number | null;
      tiktok_followers?: number | null;
      email_list_size?: number | null;
      monthly_revenue?: number | null;
      ytd_revenue?: number | null;
      notes?: string | null;
    }) => {
      const { error } = await supabase
        .from('metric_updates')
        .insert({
          ...data,
          project_id: projectId,
          user_id: user?.id,
          recorded_at: new Date().toISOString(),
        });
      if (error) throw error;

      // Update last_metric_update on snapshot
      if (startingSnapshot) {
        await supabase
          .from('launch_snapshots')
          .update({ last_metric_update: new Date().toISOString() })
          .eq('id', startingSnapshot.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metric-updates', projectId] });
      queryClient.invalidateQueries({ queryKey: ['launch-snapshots', projectId] });
      setIsMetricSheetOpen(false);
      toast.success("Metrics updated successfully");
    },
    onError: () => {
      toast.error("Failed to save metrics");
    },
  });

  const isLoading = projectLoading || snapshotsLoading || metricsLoading;

  // Get other projects with snapshots for comparison
  const projectsWithSnapshots = allProjects?.filter(p => {
    if (p.id === projectId) return false;
    const projectSnapshots = allSnapshots?.filter(s => s.project_id === p.id);
    return projectSnapshots && projectSnapshots.length > 0;
  }) || [];

  // Get latest metrics for pre-filling the update sheet
  const latestMetrics = metricUpdates?.[0] || startingSnapshot;

  return (
    <ProjectLayout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 bg-yellow-100/50 dark:bg-yellow-900/20 rounded-xl shrink-0">
            <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Insights</h1>
            <p className="text-muted-foreground">
              A simple record of where you started and where you landed.
            </p>
          </div>
        </div>

        {/* Show loading state while checking permissions */}
        {accessLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !canAccessInsights ? (
          <UpgradePrompt feature="insights_history" variant="banner" />
        ) : null}

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Monthly Reminder Banner */}
            {hasStartingData && (
              <InsightsReminder
                lastUpdateDate={lastMetricUpdateDate}
                onUpdateClick={() => setIsMetricSheetOpen(true)}
              />
            )}

            {/* Starting Snapshot */}
            <StartingSnapshot
              snapshot={startingSnapshot}
              onSave={(data) => saveSnapshotMutation.mutate({ ...data, snapshot_type: 'starting' })}
              isSaving={saveSnapshotMutation.isPending}
            />

            {/* Growth Dashboard - Only show if starting snapshot has data */}
            {hasStartingData && (
              <InsightsDashboard
                startingSnapshot={startingSnapshot}
                metricUpdates={metricUpdates || []}
                onUpdateMetrics={() => setIsMetricSheetOpen(true)}
              />
            )}

            {/* Ending Snapshot - Only show for post-launch projects */}
            {isPostLaunch && (
              <EndingSnapshot
                snapshot={endingSnapshot}
                startingSnapshot={startingSnapshot}
                onSave={(data) => saveSnapshotMutation.mutate({ ...data, snapshot_type: 'ending' })}
                isSaving={saveSnapshotMutation.isPending}
              />
            )}

            {/* Comparison View - Only show if there are other projects with snapshots */}
            {projectsWithSnapshots.length > 0 && (
              <ComparisonView
                currentProject={project}
                currentSnapshots={snapshots || []}
                allProjects={allProjects || []}
                allSnapshots={allSnapshots || []}
              />
            )}

            {/* Empty state for comparison when no other launches */}
            {projectsWithSnapshots.length === 0 && (
              <Card className="border-dashed bg-muted/30">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-2">
                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Comparisons will appear here
                  </CardTitle>
                  <CardDescription>
                    After your next launch, you'll see how your progress compares in plain language.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Annual Review Section */}
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/50 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle>Annual Review</CardTitle>
                    <CardDescription>Reflect on your year of launches and set intentions for next year.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showAnnualReview ? (
                  <AnnualReviewView onClose={() => setShowAnnualReview(false)} />
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">This isn't a performance review — just a moment to reflect.</p>
                    <button
                      onClick={() => setShowAnnualReview(true)}
                      disabled={!annualReviewData?.isEligible}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <BookOpen className="w-4 h-4" />
                      {annualReviewData?.isEligible ? "View Your Year in Review" : `Complete ${2 - (annualReviewData?.totalCompleted || 0)} more projects to unlock`}
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Metric Update Sheet */}
        <MetricUpdateSheet
          open={isMetricSheetOpen}
          onOpenChange={setIsMetricSheetOpen}
          onSave={(data) => saveMetricUpdateMutation.mutate(data)}
          isSaving={saveMetricUpdateMutation.isPending}
          previousValues={latestMetrics ? {
            instagram_followers: latestMetrics.instagram_followers,
            facebook_followers: latestMetrics.facebook_followers,
            tiktok_followers: latestMetrics.tiktok_followers,
            email_list_size: latestMetrics.email_list_size,
            monthly_revenue: latestMetrics.monthly_revenue,
            ytd_revenue: latestMetrics.ytd_revenue,
          } : undefined}
        />
      </div>
    </ProjectLayout>
  );
}

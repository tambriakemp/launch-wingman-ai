import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp } from "lucide-react";
import { StartingSnapshot } from "@/components/insights/StartingSnapshot";
import { EndingSnapshot } from "@/components/insights/EndingSnapshot";
import { ComparisonView } from "@/components/insights/ComparisonView";
import { Skeleton } from "@/components/ui/skeleton";

export default function Insights() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const isLoading = projectLoading || snapshotsLoading;

  // Get other projects with snapshots for comparison
  const projectsWithSnapshots = allProjects?.filter(p => {
    if (p.id === projectId) return false;
    const projectSnapshots = allSnapshots?.filter(s => s.project_id === p.id);
    return projectSnapshots && projectSnapshots.length > 0;
  }) || [];

  return (
    <ProjectLayout>
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Insights</h1>
              <p className="text-sm text-muted-foreground">
                A simple record of where you started and where you landed.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <>
            {/* Starting Snapshot */}
            <StartingSnapshot
              snapshot={startingSnapshot}
              onSave={(data) => saveSnapshotMutation.mutate({ ...data, snapshot_type: 'starting' })}
              isSaving={saveSnapshotMutation.isPending}
            />

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
          </>
        )}
      </div>
    </ProjectLayout>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, ChevronRight, Users, Mail, DollarSign, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ProjectLayout } from "@/components/layout/ProjectLayout";

interface ProjectWithSnapshots {
  id: string;
  name: string;
  status: string;
  created_at: string;
  startingSnapshot?: {
    instagram_followers?: number | null;
    facebook_followers?: number | null;
    tiktok_followers?: number | null;
    email_list_size?: number | null;
    confidence_level?: string | null;
  };
  endingSnapshot?: {
    sales_count?: number | null;
    launch_revenue?: number | null;
    new_followers?: number | null;
    email_list_growth?: number | null;
    reflection_note?: string | null;
  };
}

export default function InsightsOverview() {
  // Fetch all projects
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['all-projects-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all snapshots
  const { data: allSnapshots, isLoading: snapshotsLoading } = useQuery({
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

  const isLoading = projectsLoading || snapshotsLoading;

  // Combine projects with their snapshots
  const projectsWithSnapshots: ProjectWithSnapshots[] = projects?.map(project => {
    const projectSnapshots = allSnapshots?.filter(s => s.project_id === project.id);
    const startingSnapshot = projectSnapshots?.find(s => s.snapshot_type === 'starting');
    const endingSnapshot = projectSnapshots?.find(s => s.snapshot_type === 'ending');
    
    return {
      ...project,
      startingSnapshot,
      endingSnapshot,
    };
  }) || [];

  // Projects with at least one snapshot
  const projectsWithData = projectsWithSnapshots.filter(
    p => p.startingSnapshot || p.endingSnapshot
  );

  // Projects without any snapshot data
  const projectsWithoutData = projectsWithSnapshots.filter(
    p => !p.startingSnapshot && !p.endingSnapshot
  );

  // Calculate aggregate stats
  const totalSales = projectsWithData.reduce(
    (sum, p) => sum + (p.endingSnapshot?.sales_count || 0), 0
  );
  const totalRevenue = projectsWithData.reduce(
    (sum, p) => sum + (p.endingSnapshot?.launch_revenue || 0), 0
  );
  const launchCount = projectsWithData.filter(p => p.endingSnapshot).length;

  const getConfidenceLabel = (level?: string | null) => {
    if (!level) return null;
    const labels: Record<string, string> = {
      'very-low': 'Unsure',
      'low': 'Somewhat unsure',
      'medium': 'Neutral',
      'high': 'Confident',
      'very-high': 'Very confident',
    };
    return labels[level] || level;
  };

  const getTotalFollowers = (snapshot?: ProjectWithSnapshots['startingSnapshot']) => {
    if (!snapshot) return 0;
    return (snapshot.instagram_followers || 0) + 
           (snapshot.facebook_followers || 0) + 
           (snapshot.tiktok_followers || 0);
  };

  return (
    <ProjectLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Insights</h1>
              <p className="text-sm text-muted-foreground">
                Reflect on your journey across all launches.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            {/* Aggregate Stats - Only show if there's data */}
            {launchCount > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">{launchCount}</p>
                        <p className="text-sm text-muted-foreground">
                          {launchCount === 1 ? 'Completed launch' : 'Completed launches'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {totalSales > 0 && (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{totalSales}</p>
                          <p className="text-sm text-muted-foreground">Total sales</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {totalRevenue > 0 && (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">
                            ${totalRevenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">Total revenue</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Projects with snapshot data */}
            {projectsWithData.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-foreground">Your launches</h2>
                <div className="space-y-3">
                  {projectsWithData.map(project => (
                    <Link 
                      key={project.id} 
                      to={`/projects/${project.id}/insights`}
                      className="block"
                    >
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer group">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-foreground truncate">
                                  {project.name}
                                </h3>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {project.status.replace('-', ' ')}
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                {project.startingSnapshot?.confidence_level && (
                                  <span>
                                    Started {getConfidenceLabel(project.startingSnapshot.confidence_level)?.toLowerCase()}
                                  </span>
                                )}
                                {getTotalFollowers(project.startingSnapshot) > 0 && (
                                  <span>
                                    {getTotalFollowers(project.startingSnapshot).toLocaleString()} followers
                                  </span>
                                )}
                                {project.startingSnapshot?.email_list_size && (
                                  <span>
                                    {project.startingSnapshot.email_list_size.toLocaleString()} subscribers
                                  </span>
                                )}
                                {project.endingSnapshot?.sales_count && (
                                  <span className="text-green-600">
                                    {project.endingSnapshot.sales_count} sales
                                  </span>
                                )}
                                {project.endingSnapshot?.launch_revenue && (
                                  <span className="text-emerald-600">
                                    ${project.endingSnapshot.launch_revenue.toLocaleString()}
                                  </span>
                                )}
                              </div>

                              {project.endingSnapshot?.reflection_note && (
                                <p className="text-sm text-muted-foreground mt-2 italic line-clamp-1">
                                  "{project.endingSnapshot.reflection_note}"
                                </p>
                              )}
                            </div>
                            
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 ml-4" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Projects without snapshot data */}
            {projectsWithoutData.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-muted-foreground">
                  Projects awaiting snapshots
                </h2>
                <div className="space-y-2">
                  {projectsWithoutData.map(project => (
                    <Link 
                      key={project.id} 
                      to={`/projects/${project.id}/insights`}
                      className="block"
                    >
                      <Card className="hover:bg-muted/50 transition-colors cursor-pointer group border-dashed">
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                  {project.name}
                                </h3>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {project.status.replace('-', ' ')}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {projects?.length === 0 && (
              <Card className="border-dashed bg-muted/30">
                <CardHeader className="text-center">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    No projects yet
                  </CardTitle>
                  <CardDescription>
                    Your launch insights will appear here as you create and complete projects.
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

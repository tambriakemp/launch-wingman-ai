import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminPlatformStats } from '@/hooks/useAdminPlatformStats';
import { Layers, FileText, Users2, Gift, TrendingUp, Calendar, MessageSquare, Link2, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export function ProjectStatsCard() {
  const { data, isLoading } = useAdminPlatformStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Project Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  const stats = data?.projectStats;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-3">{stats?.total || 0}</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">By Phase:</span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-xs">
            <div className="text-center">
              <div className="font-medium">{stats?.byPhase.clarity || 0}</div>
              <div className="text-muted-foreground">Clarity</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{stats?.byPhase.strategy || 0}</div>
              <div className="text-muted-foreground">Strategy</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{stats?.byPhase.build || 0}</div>
              <div className="text-muted-foreground">Build</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{stats?.byPhase.launch || 0}</div>
              <div className="text-muted-foreground">Launch</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{stats?.byPhase.maintain || 0}</div>
              <div className="text-muted-foreground">Maintain</div>
            </div>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground">Avg Completion</span>
            <span className="font-medium">{stats?.avgCompletionPercent || 0}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ContentStatsCard() {
  const { data, isLoading } = useAdminPlatformStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Content Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  const stats = data?.contentStats;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Content Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Scheduled Posts
            </div>
            <span className="font-medium">{stats?.scheduledPosts || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              Drafts
            </div>
            <span className="font-medium">{stats?.contentDrafts || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Saved Ideas
            </div>
            <span className="font-medium">{stats?.contentIdeas || 0}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 className="h-4 w-4" />
              Social Connections
            </div>
            <span className="font-medium">{stats?.socialConnections || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EngagementStatsCard() {
  const { data, isLoading } = useAdminPlatformStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            User Engagement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  const stats = data?.engagementStats;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users2 className="h-4 w-4" />
          User Engagement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Avg Projects/User</span>
            <span className="font-medium">{stats?.avgProjectsPerUser || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Users with Projects</span>
            <span className="font-medium">{stats?.usersWithProjects || 0}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Multi-Project Users</span>
            <span className="font-medium">{stats?.usersWithMultipleProjects || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OfferStatsCard() {
  const { data, isLoading } = useAdminPlatformStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Offers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  const stats = data?.offerStats;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Gift className="h-4 w-4" />
          Offers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{stats?.totalOffers || 0}</div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Avg Price</span>
          <span className="font-medium">
            {stats?.avgOfferPrice ? `$${stats.avgOfferPrice.toLocaleString()}` : '—'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function OnboardingFunnelCard() {
  const { data, isLoading } = useAdminPlatformStats();

  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Onboarding Funnel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  const funnel = data?.onboardingFunnel;

  const funnelSteps = [
    { label: 'Profile Completed', count: funnel?.usersWithProfile || 0, rate: funnel?.profileCompletionRate || 0 },
    { label: 'First Project', count: funnel?.usersWithFirstProject || 0, rate: funnel?.projectCreationRate || 0 },
    { label: 'First Offer Created', count: funnel?.usersWithOffer || 0, rate: funnel?.offerCreationRate || 0 },
    { label: 'First Task Done', count: funnel?.usersWithFirstTask || 0, rate: funnel?.taskCompletionRate || 0 },
  ];

  return (
    <Card className="col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Onboarding Funnel
          <span className="text-muted-foreground font-normal ml-auto">
            {funnel?.totalUsers || 0} total users
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelSteps.map((step, index) => (
            <div key={step.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {index + 1}. {step.label}
                </span>
                <span className="font-medium">
                  {step.count} <span className="text-muted-foreground">({step.rate}%)</span>
                </span>
              </div>
              <Progress value={step.rate} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

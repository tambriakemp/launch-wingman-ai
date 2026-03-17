import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Crown, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MrrStatsCard } from '@/components/admin/AiUsageSection';
import { RevenueChurnChart } from '@/components/admin/RevenueChurnChart';
import { useAdminUsers } from '@/hooks/useAdminUsers';

const ProjectStatsCard = lazy(() => import('@/components/admin/PlatformStatsSection').then(m => ({ default: m.ProjectStatsCard })));
const ContentStatsCard = lazy(() => import('@/components/admin/PlatformStatsSection').then(m => ({ default: m.ContentStatsCard })));
const EngagementStatsCard = lazy(() => import('@/components/admin/PlatformStatsSection').then(m => ({ default: m.EngagementStatsCard })));
const OfferStatsCard = lazy(() => import('@/components/admin/PlatformStatsSection').then(m => ({ default: m.OfferStatsCard })));
const OnboardingFunnelCard = lazy(() => import('@/components/admin/PlatformStatsSection').then(m => ({ default: m.OnboardingFunnelCard })));
const RelaunchStatsCard = lazy(() => import('@/components/admin/RelaunchStatsCard').then(m => ({ default: m.RelaunchStatsCard })));

const CardLoadingFallback = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-full" />
    </CardContent>
  </Card>
);

const AdminOverview = () => {
  const { users } = useAdminUsers();

  const stats = {
    totalUsers: users.length,
    proUsers: users.filter(u => u.subscription_status === 'pro').length,
    vaultUsers: users.filter(u => u.subscription_status === 'content_vault').length,
    freeUsers: users.filter(u => u.subscription_status === 'free').length,
    mrrCents: users.reduce((sum, u) => sum + (u.subscription_amount_cents || 0), 0),
    payingCustomers: users.filter(u => u.payment_source === 'card').length,
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">Platform statistics at a glance</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <Users className="h-5 w-5 md:h-8 md:w-8 text-primary" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Users</p>
                <p className="text-xl md:text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <Crown className="h-5 w-5 md:h-8 md:w-8 text-amber-500" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Pro Users</p>
                <p className="text-xl md:text-2xl font-bold">{stats.proUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <Users className="h-5 w-5 md:h-8 md:w-8 text-muted-foreground" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Free Users</p>
                <p className="text-xl md:text-2xl font-bold">{stats.freeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <Wallet className="h-5 w-5 md:h-8 md:w-8 text-emerald-500" />
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Paying (Card)</p>
                <p className="text-xl md:text-2xl font-bold">{stats.payingCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <MrrStatsCard mrrCents={stats.mrrCents} />
      </div>

      <RevenueChurnChart users={users} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Suspense fallback={<CardLoadingFallback />}><ProjectStatsCard /></Suspense>
        <Suspense fallback={<CardLoadingFallback />}><ContentStatsCard /></Suspense>
        <Suspense fallback={<CardLoadingFallback />}><EngagementStatsCard /></Suspense>
        <Suspense fallback={<CardLoadingFallback />}><OfferStatsCard /></Suspense>
      </div>

      <Suspense fallback={<CardLoadingFallback />}><OnboardingFunnelCard /></Suspense>
      <Suspense fallback={<CardLoadingFallback />}><RelaunchStatsCard /></Suspense>
    </div>
  );
};

export default AdminOverview;

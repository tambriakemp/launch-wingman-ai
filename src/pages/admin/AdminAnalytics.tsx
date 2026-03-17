import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const AnalyticsTabContent = lazy(() => import('@/components/admin/AnalyticsTabContent').then(m => ({ default: m.AnalyticsTabContent })));

const AdminAnalytics = () => (
  <div className="space-y-4 md:space-y-8">
    <div>
      <h1 className="text-xl md:text-2xl font-bold">Analytics</h1>
      <p className="text-sm text-muted-foreground">Platform analytics and feature usage</p>
    </div>
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
      <AnalyticsTabContent />
    </Suspense>
  </div>
);

export default AdminAnalytics;

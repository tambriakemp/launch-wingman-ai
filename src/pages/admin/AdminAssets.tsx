import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const MarketingAssetsTab = lazy(() => import('@/components/admin/MarketingAssetsTab').then(m => ({ default: m.MarketingAssetsTab })));

const AdminAssets = () => (
  <div className="space-y-4 md:space-y-8">
    <div>
      <h1 className="text-xl md:text-2xl font-bold">Assets</h1>
      <p className="text-sm text-muted-foreground">Marketing assets and media library</p>
    </div>
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
      <MarketingAssetsTab />
    </Suspense>
  </div>
);

export default AdminAssets;

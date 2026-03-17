import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ConfigTab = lazy(() => import('@/components/admin/ConfigTab').then(m => ({ default: m.ConfigTab })));

const AdminConfig = () => (
  <div className="space-y-4 md:space-y-8">
    <div>
      <h1 className="text-xl md:text-2xl font-bold">Configuration</h1>
      <p className="text-sm text-muted-foreground">Platform settings and integrations</p>
    </div>
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
      <ConfigTab />
    </Suspense>
  </div>
);

export default AdminConfig;

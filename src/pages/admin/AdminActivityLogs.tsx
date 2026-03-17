import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ActivityLogsTab = lazy(() => import('@/components/admin/ActivityLogsTab').then(m => ({ default: m.ActivityLogsTab })));

const AdminActivityLogs = () => (
  <div className="space-y-4 md:space-y-8">
    <div>
      <h1 className="text-xl md:text-2xl font-bold">Activity Logs</h1>
      <p className="text-sm text-muted-foreground">Admin action history</p>
    </div>
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
      <ActivityLogsTab />
    </Suspense>
  </div>
);

export default AdminActivityLogs;

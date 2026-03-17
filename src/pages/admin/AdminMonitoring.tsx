import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminUsers } from '@/hooks/useAdminUsers';

const MonitoringTab = lazy(() => import('@/components/admin/MonitoringTab').then(m => ({ default: m.MonitoringTab })));

const AdminMonitoring = () => {
  const { users } = useAdminUsers();

  return (
    <div className="space-y-4 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Monitoring</h1>
        <p className="text-sm text-muted-foreground">System health and alerts</p>
      </div>
      <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
        <MonitoringTab users={users} />
      </Suspense>
    </div>
  );
};

export default AdminMonitoring;

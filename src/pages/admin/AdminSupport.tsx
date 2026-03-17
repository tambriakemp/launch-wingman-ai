import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const SupportTicketsTab = lazy(() => import('@/components/admin/SupportTicketsTab').then(m => ({ default: m.SupportTicketsTab })));

const AdminSupport = () => (
  <div className="space-y-4 md:space-y-8">
    <div>
      <h1 className="text-xl md:text-2xl font-bold">Support</h1>
      <p className="text-sm text-muted-foreground">User support tickets</p>
    </div>
    <Suspense fallback={<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-48 w-full" /></div>}>
      <SupportTicketsTab />
    </Suspense>
  </div>
);

export default AdminSupport;

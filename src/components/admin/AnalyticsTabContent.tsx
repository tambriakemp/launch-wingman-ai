import { useAdminPlatformStats } from '@/hooks/useAdminPlatformStats';
import { FeatureUsageHeatmap } from './FeatureUsageHeatmap';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsTabContent() {
  const { data: platformStats, isLoading } = useAdminPlatformStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!platformStats?.featureUsage) {
    return null;
  }

  return <FeatureUsageHeatmap featureUsage={platformStats.featureUsage} />;
}

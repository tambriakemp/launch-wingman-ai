import { useAdminSystemHealth } from '@/hooks/useAdminSystemHealth';
import { useAdminChurnRisk } from '@/hooks/useAdminChurnRisk';
import { AlertsWidget } from './AlertsWidget';
import { SystemHealthCard } from './SystemHealthCard';
import { ChurnRiskCard } from './ChurnRiskCard';
import { AiUsageTable } from './AiUsageSection';
import { toast } from 'sonner';

interface MonitoringTabProps {
  users?: Array<{
    banned_until: string | null;
    subscription_status: string;
    subscription_end: string | null;
    last_active: string | null;
  }>;
}

export function MonitoringTab({ users = [] }: MonitoringTabProps) {
  const {
    data: systemHealthData,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useAdminSystemHealth();

  const {
    data: churnRiskData,
    isLoading: churnLoading,
    refetch: refetchChurn,
  } = useAdminChurnRisk();

  const disabledUsersCount = users.filter(
    (u) => u.banned_until && new Date(u.banned_until) > new Date()
  ).length;

  const expiredSubscriptionsCount = users.filter((u) => {
    if (u.subscription_status !== 'pro' || !u.subscription_end) return false;
    const endDate = new Date(u.subscription_end);
    const now = new Date();
    if (endDate < now && u.last_active) {
      const lastActive = new Date(u.last_active);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return lastActive > sevenDaysAgo;
    }
    return false;
  }).length;

  const handleRefreshAll = () => {
    refetchHealth();
    refetchChurn();
    toast.success('Monitoring data refreshed');
  };

  const handleSendReengagement = (userId: string, email: string) => {
    toast.info(`Re-engagement email would be sent to ${email}`);
  };

  const handleViewChurnUsers = () => {
    const churnSection = document.getElementById('churn-risk-section');
    if (churnSection) {
      churnSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerts Widget */}
      <AlertsWidget
        churnRiskData={churnRiskData}
        systemHealthData={systemHealthData}
        disabledUsersCount={disabledUsersCount}
        expiredSubscriptionsCount={expiredSubscriptionsCount}
        loading={healthLoading || churnLoading}
        onViewChurnUsers={handleViewChurnUsers}
        onRefresh={handleRefreshAll}
      />

      {/* AI Usage Section */}
      <AiUsageTable />

      {/* System Health */}
      <SystemHealthCard
        data={systemHealthData}
        loading={healthLoading}
        onRefresh={() => refetchHealth()}
      />

      {/* Churn Risk */}
      <div id="churn-risk-section">
        <ChurnRiskCard
          data={churnRiskData}
          loading={churnLoading}
          onRefresh={() => refetchChurn()}
          onSendReengagement={handleSendReengagement}
        />
      </div>
    </div>
  );
}

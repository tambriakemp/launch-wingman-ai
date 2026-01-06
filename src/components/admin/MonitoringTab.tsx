import { useState } from 'react';
import { useAdminSystemHealth } from '@/hooks/useAdminSystemHealth';
import { useAdminChurnRisk } from '@/hooks/useAdminChurnRisk';
import { AlertsWidget } from './AlertsWidget';
import { SystemHealthCard } from './SystemHealthCard';
import { ChurnRiskCard } from './ChurnRiskCard';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MonitoringTabProps {
  users?: Array<{
    banned_until: string | null;
    subscription_status: string;
    subscription_end: string | null;
    last_active: string | null;
  }>;
}

export function MonitoringTab({ users = [] }: MonitoringTabProps) {
  const [syncLoading, setSyncLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    contacts_synced: number;
    success_count: number;
  } | null>(null);

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

  // Calculate disabled users count from users prop
  const disabledUsersCount = users.filter(
    (u) => u.banned_until && new Date(u.banned_until) > new Date()
  ).length;

  // Calculate expired subscriptions count
  const expiredSubscriptionsCount = users.filter((u) => {
    if (u.subscription_status !== 'pro' || !u.subscription_end) return false;
    const endDate = new Date(u.subscription_end);
    const now = new Date();
    // Subscription ended but user was active in last 7 days
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
    // TODO: Implement re-engagement email sending
    toast.info(`Re-engagement email would be sent to ${email}`);
  };

  const handleViewChurnUsers = () => {
    // Scroll to churn risk section
    const churnSection = document.getElementById('churn-risk-section');
    if (churnSection) {
      churnSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSyncToMarketing = async () => {
    setSyncLoading(true);
    setLastSyncResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('marketing-webhook', {
        body: { action: 'sync_all', event_type: 'manual_sync' },
      });

      if (error) throw error;

      const successCount = data.results?.filter((r: { success: boolean }) => r.success).length || 0;
      setLastSyncResult({
        contacts_synced: data.contacts_synced,
        success_count: successCount,
      });

      if (successCount === data.contacts_synced) {
        toast.success(`Successfully synced ${data.contacts_synced} contacts to marketing platform`);
      } else {
        toast.warning(
          `Synced ${successCount} of ${data.contacts_synced} contacts. Some failed.`
        );
      }
    } catch (error) {
      console.error('Marketing sync error:', error);
      toast.error('Failed to sync contacts to marketing platform');
    } finally {
      setSyncLoading(false);
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

      {/* Marketing Sync Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="h-5 w-5" />
            Marketing Platform Sync
          </CardTitle>
          <CardDescription>
            Send contact data (name, email, membership, dates) to your email marketing platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              onClick={handleSyncToMarketing}
              disabled={syncLoading}
              className="gap-2"
            >
              {syncLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Sync All Contacts
                </>
              )}
            </Button>
            {lastSyncResult && (
              <p className="text-sm text-muted-foreground">
                Last sync: {lastSyncResult.success_count}/{lastSyncResult.contacts_synced} contacts synced successfully
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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

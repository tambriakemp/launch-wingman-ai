import { useState, useEffect } from 'react';
import { useAdminSystemHealth } from '@/hooks/useAdminSystemHealth';
import { useAdminChurnRisk } from '@/hooks/useAdminChurnRisk';
import { useAuth } from '@/contexts/AuthContext';
import { AlertsWidget } from './AlertsWidget';
import { SystemHealthCard } from './SystemHealthCard';
import { ChurnRiskCard } from './ChurnRiskCard';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Users, FlaskConical, History, CheckCircle2, XCircle, RefreshCw, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface MonitoringTabProps {
  users?: Array<{
    banned_until: string | null;
    subscription_status: string;
    subscription_end: string | null;
    last_active: string | null;
  }>;
}

interface WebhookLog {
  id: string;
  email: string;
  event_type: string;
  membership: string;
  tags_added: string[];
  tags_removed: string[];
  success: boolean;
  error_message: string | null;
  response_status: number | null;
  created_at: string;
}

interface SureContactLog {
  id: string;
  email: string;
  event_type: string;
  subscription_status: string | null;
  success: boolean;
  error_message: string | null;
  response_status: number | null;
  created_at: string;
}

export function MonitoringTab({ users = [] }: MonitoringTabProps) {
  const { user } = useAuth();
  const [syncLoading, setSyncLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [sureContactSyncLoading, setSureContactSyncLoading] = useState(false);
  const [sureContactTestLoading, setSureContactTestLoading] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [sureContactLogs, setSureContactLogs] = useState<SureContactLog[]>([]);
  const [sureContactLogsLoading, setSureContactLogsLoading] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    contacts_synced: number;
    success_count: number;
  } | null>(null);
  const [lastTestResult, setLastTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [sureContactSyncResult, setSureContactSyncResult] = useState<{
    total: number;
    success_count: number;
  } | null>(null);
  const [sureContactTestResult, setSureContactTestResult] = useState<{
    success: boolean;
    message: string;
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

  // Fetch webhook logs
  const fetchWebhookLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketing_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setWebhookLogs(data || []);
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  // Fetch SureContact logs
  const fetchSureContactLogs = async () => {
    setSureContactLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('surecontact_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSureContactLogs(data || []);
    } catch (error) {
      console.error('Error fetching SureContact logs:', error);
    } finally {
      setSureContactLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookLogs();
    fetchSureContactLogs();
  }, []);

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
    fetchWebhookLogs();
    fetchSureContactLogs();
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

      // Refresh logs after sync
      fetchWebhookLogs();
    } catch (error) {
      console.error('Marketing sync error:', error);
      toast.error('Failed to sync contacts to marketing platform');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!user?.id) {
      toast.error('No user session found');
      return;
    }

    setTestLoading(true);
    setLastTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('marketing-webhook', {
        body: { action: 'sync_user', user_id: user.id, event_type: 'test_webhook' },
      });

      if (error) throw error;

      const result = data.results?.[0];
      if (result?.success) {
        setLastTestResult({ success: true, message: 'Test webhook sent successfully!' });
        toast.success('Test webhook sent successfully!');
      } else {
        setLastTestResult({ 
          success: false, 
          message: result?.error || `HTTP ${result?.status}: ${result?.response || 'Unknown error'}` 
        });
        toast.error('Test webhook failed - check configuration');
      }

      // Refresh logs after test
      fetchWebhookLogs();
    } catch (error) {
      console.error('Test webhook error:', error);
      setLastTestResult({ success: false, message: 'Failed to send test webhook' });
      toast.error('Failed to send test webhook');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSureContactSync = async () => {
    setSureContactSyncLoading(true);
    setSureContactSyncResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('surecontact-webhook', {
        body: { action: 'sync_all' },
      });

      if (error) throw error;

      const successCount = data.results?.filter((r: { success: boolean }) => r.success).length || 0;
      const total = data.results?.length || 0;
      
      setSureContactSyncResult({
        total,
        success_count: successCount,
      });

      if (successCount === total) {
        toast.success(`Successfully synced ${total} contacts to SureContact`);
      } else {
        toast.warning(`Synced ${successCount} of ${total} contacts to SureContact. Some failed.`);
      }
      
      // Refresh logs after sync
      fetchSureContactLogs();
    } catch (error) {
      console.error('SureContact sync error:', error);
      toast.error('Failed to sync contacts to SureContact');
    } finally {
      setSureContactSyncLoading(false);
    }
  };

  const handleSureContactTest = async () => {
    if (!user?.id) {
      toast.error('No user session found');
      return;
    }

    setSureContactTestLoading(true);
    setSureContactTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('surecontact-webhook', {
        body: { action: 'sync_user', user_id: user.id, event_type: 'test_webhook' },
      });

      if (error) throw error;

      const result = data.results?.[0];
      if (result?.success) {
        setSureContactTestResult({ success: true, message: 'Test sent successfully!' });
        toast.success('Test webhook sent to SureContact!');
      } else {
        setSureContactTestResult({ 
          success: false, 
          message: result?.error || 'Unknown error' 
        });
        toast.error('SureContact test failed - check configuration');
      }
      
      // Refresh logs after test
      fetchSureContactLogs();
    } catch (error) {
      console.error('SureContact test error:', error);
      setSureContactTestResult({ success: false, message: 'Failed to send test' });
      toast.error('Failed to send test to SureContact');
    } finally {
      setSureContactTestLoading(false);
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
        <CardContent className="space-y-4">
          {/* Test Webhook */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <Button
              variant="outline"
              onClick={handleTestWebhook}
              disabled={testLoading}
              className="gap-2"
            >
              {testLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4" />
                  Test Webhook
                </>
              )}
            </Button>
            {lastTestResult && (
              <p className={`text-sm ${lastTestResult.success ? 'text-green-600' : 'text-destructive'}`}>
                {lastTestResult.message}
              </p>
            )}
            {!lastTestResult && (
              <p className="text-sm text-muted-foreground">
                Sends your admin account as a test contact
              </p>
            )}
          </div>

          {/* Sync All */}
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

      {/* SureContact Sync Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-5 w-5" />
            SureContact Sync
          </CardTitle>
          <CardDescription>
            Send contact data (name, email, subscription status) to SureContact
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test SureContact */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <Button
              variant="outline"
              onClick={handleSureContactTest}
              disabled={sureContactTestLoading}
              className="gap-2"
            >
              {sureContactTestLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4" />
                  Test SureContact
                </>
              )}
            </Button>
            {sureContactTestResult && (
              <p className={`text-sm ${sureContactTestResult.success ? 'text-green-600' : 'text-destructive'}`}>
                {sureContactTestResult.message}
              </p>
            )}
            {!sureContactTestResult && (
              <p className="text-sm text-muted-foreground">
                Sends your admin account as a test contact
              </p>
            )}
          </div>

          {/* Sync All to SureContact */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              onClick={handleSureContactSync}
              disabled={sureContactSyncLoading}
              className="gap-2"
            >
              {sureContactSyncLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Sync All to SureContact
                </>
              )}
            </Button>
            {sureContactSyncResult && (
              <p className="text-sm text-muted-foreground">
                Last sync: {sureContactSyncResult.success_count}/{sureContactSyncResult.total} contacts synced successfully
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Activity Log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5" />
                Webhook Activity Log
              </CardTitle>
              <CardDescription>
                Recent marketing webhook events and their status
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchWebhookLogs}
              disabled={logsLoading}
            >
              <RefreshCw className={`h-4 w-4 ${logsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading && webhookLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading logs...
            </div>
          ) : webhookLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No webhook activity yet. Send a test webhook to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {webhookLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    {log.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{log.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {log.event_type}
                        </Badge>
                        <Badge 
                          variant={log.membership === 'pro' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {log.membership}
                        </Badge>
                        {log.tags_added && log.tags_added.length > 0 && (
                          <span className="text-xs text-green-600">
                            +{log.tags_added.join(', ')}
                          </span>
                        )}
                        {log.tags_removed && log.tags_removed.length > 0 && (
                          <span className="text-xs text-muted-foreground line-through">
                            {log.tags_removed.join(', ')}
                          </span>
                        )}
                      </div>
                      {log.error_message && (
                        <p className="text-xs text-destructive mt-1 truncate max-w-md">
                          {log.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0 sm:text-right">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                    {log.response_status && (
                      <span className="ml-2">
                        HTTP {log.response_status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SureContact Activity Log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="h-5 w-5" />
                SureContact Activity Log
              </CardTitle>
              <CardDescription>
                Recent SureContact sync events and their status
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSureContactLogs}
              disabled={sureContactLogsLoading}
            >
              <RefreshCw className={`h-4 w-4 ${sureContactLogsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sureContactLogsLoading && sureContactLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading logs...
            </div>
          ) : sureContactLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No SureContact activity yet. Send a test to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {sureContactLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    {log.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{log.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {log.event_type}
                        </Badge>
                        {log.subscription_status && (
                          <Badge 
                            variant={log.subscription_status === 'pro' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {log.subscription_status}
                          </Badge>
                        )}
                      </div>
                      {log.error_message && (
                        <p className="text-xs text-destructive mt-1 truncate max-w-md">
                          {log.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0 sm:text-right">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                    {log.response_status && (
                      <span className="ml-2">
                        HTTP {log.response_status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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

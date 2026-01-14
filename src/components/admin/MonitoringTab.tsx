import { useState, useEffect } from 'react';
import { useAdminSystemHealth } from '@/hooks/useAdminSystemHealth';
import { useAdminChurnRisk } from '@/hooks/useAdminChurnRisk';
import { AlertsWidget } from './AlertsWidget';
import { SystemHealthCard } from './SystemHealthCard';
import { ChurnRiskCard } from './ChurnRiskCard';
import { AiUsageTable } from './AiUsageSection';
import { TikTokAnalyticsDashboard } from './TikTokAnalyticsDashboard';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, CheckCircle2, XCircle, RefreshCw, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
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

const LOGS_PER_PAGE = 10;

export function MonitoringTab({ users = [] }: MonitoringTabProps) {
  const [logsLoading, setLogsLoading] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [sureContactLogs, setSureContactLogs] = useState<SureContactLog[]>([]);
  const [sureContactLogsLoading, setSureContactLogsLoading] = useState(false);
  
  // Pagination state
  const [webhookPage, setWebhookPage] = useState(1);
  const [sureContactPage, setSureContactPage] = useState(1);
  const [tiktokPage, setTiktokPage] = useState(1);

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

  const fetchWebhookLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketing_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setWebhookLogs(data || []);
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchSureContactLogs = async () => {
    setSureContactLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('surecontact_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

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
    fetchWebhookLogs();
    fetchSureContactLogs();
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

  // Paginated webhook logs
  const webhookTotalPages = Math.ceil(webhookLogs.length / LOGS_PER_PAGE);
  const paginatedWebhookLogs = webhookLogs.slice(
    (webhookPage - 1) * LOGS_PER_PAGE,
    webhookPage * LOGS_PER_PAGE
  );

  // Paginated SureContact logs
  const sureContactTotalPages = Math.ceil(sureContactLogs.length / LOGS_PER_PAGE);
  const paginatedSureContactLogs = sureContactLogs.slice(
    (sureContactPage - 1) * LOGS_PER_PAGE,
    sureContactPage * LOGS_PER_PAGE
  );

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

      {/* Webhook Activity Log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5" />
                Marketing Webhook Activity Log
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
            <>
              <div className="space-y-3">
                {paginatedWebhookLogs.map((log) => (
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
              {webhookTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWebhookPage(p => Math.max(1, p - 1))}
                    disabled={webhookPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {webhookPage} / {webhookTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWebhookPage(p => Math.min(webhookTotalPages, p + 1))}
                    disabled={webhookPage === webhookTotalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
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
            <>
              <div className="space-y-3">
                {paginatedSureContactLogs.map((log) => (
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
              {sureContactTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSureContactPage(p => Math.max(1, p - 1))}
                    disabled={sureContactPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {sureContactPage} / {sureContactTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSureContactPage(p => Math.min(sureContactTotalPages, p + 1))}
                    disabled={sureContactPage === sureContactTotalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* TikTok Activity Log */}
      <TikTokAnalyticsDashboard />
    </div>
  );
}

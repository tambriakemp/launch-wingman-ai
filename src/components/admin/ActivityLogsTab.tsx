import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, RefreshCw, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { AdminActionLogs } from './AdminActionLogs';
import { TikTokAnalyticsDashboard } from './TikTokAnalyticsDashboard';

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

export function ActivityLogsTab() {
  const [sureContactLogs, setSureContactLogs] = useState<SureContactLog[]>([]);
  const [sureContactLogsLoading, setSureContactLogsLoading] = useState(false);
  
  // Pagination state
  const [sureContactPage, setSureContactPage] = useState(1);

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
    fetchSureContactLogs();
  }, []);

  const handleRefreshAll = () => {
    fetchSureContactLogs();
    toast.success('Activity logs refreshed');
  };

  // Paginated SureContact logs
  const sureContactTotalPages = Math.ceil(sureContactLogs.length / LOGS_PER_PAGE);
  const paginatedSureContactLogs = sureContactLogs.slice(
    (sureContactPage - 1) * LOGS_PER_PAGE,
    sureContactPage * LOGS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Admin Action Logs */}
      <AdminActionLogs />

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

      {/* TikTok Event Log */}
      <TikTokAnalyticsDashboard />
    </div>
  );
}

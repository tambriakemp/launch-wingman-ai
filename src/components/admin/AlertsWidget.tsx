import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info, Users, Mail, ShieldAlert, Ban, CreditCard, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Alert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  count: number;
  action?: () => void;
  actionLabel?: string;
}

interface AlertsWidgetProps {
  churnRiskData?: {
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      totalAtRiskPro: number;
    };
  };
  systemHealthData?: {
    metrics: {
      errorRate24h: number;
      failedEmails24h: number;
    };
    status: string;
  };
  disabledUsersCount?: number;
  expiredSubscriptionsCount?: number;
  loading?: boolean;
  onViewChurnUsers?: () => void;
  onRefresh?: () => void;
}

export function AlertsWidget({
  churnRiskData,
  systemHealthData,
  disabledUsersCount = 0,
  expiredSubscriptionsCount = 0,
  loading,
  onViewChurnUsers,
  onRefresh,
}: AlertsWidgetProps) {
  const alerts: Alert[] = [];

  // Add churn risk alerts
  if (churnRiskData) {
    const { critical, high, totalAtRiskPro } = churnRiskData.summary;
    if (critical > 0) {
      alerts.push({
        id: 'churn-critical',
        type: 'critical',
        category: 'Churn Risk',
        message: `${critical} Pro user(s) critically at risk (14+ days inactive)`,
        count: critical,
        action: onViewChurnUsers,
        actionLabel: 'View Users',
      });
    }
    if (high > 0) {
      alerts.push({
        id: 'churn-high',
        type: 'high',
        category: 'Churn Risk',
        message: `${high} Pro user(s) at high risk (7-13 days inactive)`,
        count: high,
        action: onViewChurnUsers,
        actionLabel: 'View Users',
      });
    }
  }

  // Add system health alerts
  if (systemHealthData) {
    if (systemHealthData.metrics.errorRate24h > 5) {
      alerts.push({
        id: 'error-rate',
        type: systemHealthData.metrics.errorRate24h > 15 ? 'critical' : 'high',
        category: 'System Health',
        message: `Error rate at ${systemHealthData.metrics.errorRate24h.toFixed(1)}% in last 24h`,
        count: 1,
      });
    }
    if (systemHealthData.metrics.failedEmails24h > 0) {
      alerts.push({
        id: 'failed-emails',
        type: 'medium',
        category: 'Email Delivery',
        message: `${systemHealthData.metrics.failedEmails24h} failed email(s) in last 24h`,
        count: systemHealthData.metrics.failedEmails24h,
      });
    }
    if (systemHealthData.status === 'down') {
      alerts.push({
        id: 'system-down',
        type: 'critical',
        category: 'System Health',
        message: 'System health degraded - immediate attention required',
        count: 1,
      });
    }
  }

  // Add disabled users alert
  if (disabledUsersCount > 0) {
    alerts.push({
      id: 'disabled-users',
      type: 'low',
      category: 'User Management',
      message: `${disabledUsersCount} disabled user(s) pending review`,
      count: disabledUsersCount,
    });
  }

  // Add expired subscriptions alert
  if (expiredSubscriptionsCount > 0) {
    alerts.push({
      id: 'expired-subs',
      type: 'medium',
      category: 'Subscriptions',
      message: `${expiredSubscriptionsCount} subscription(s) expired but user still active`,
      count: expiredSubscriptionsCount,
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Churn Risk':
        return <Users className="h-4 w-4" />;
      case 'System Health':
        return <ShieldAlert className="h-4 w-4" />;
      case 'Email Delivery':
        return <Mail className="h-4 w-4" />;
      case 'User Management':
        return <Ban className="h-4 w-4" />;
      case 'Subscriptions':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-8" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alerts Needing Attention
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Issues requiring admin review</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {alerts.length}
            </Badge>
            {onRefresh && (
              <Button variant="ghost" size="icon" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No alerts at this time</p>
            <p className="text-sm">All systems are running normally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {getAlertBadge(alert.type)}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {getCategoryIcon(alert.category)}
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                </div>
                {alert.action && (
                  <Button variant="outline" size="sm" className="w-full sm:w-auto flex-shrink-0" onClick={alert.action}>
                    {alert.actionLabel}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

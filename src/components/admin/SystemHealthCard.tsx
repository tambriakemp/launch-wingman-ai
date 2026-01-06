import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, AlertTriangle, Activity, Zap, Clock, RefreshCw, Database } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface FunctionHealth {
  name: string;
  calls: number;
  errors: number;
  avgLatencyMs: number;
}

interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  metrics: {
    totalCalls24h: number;
    errorRate24h: number;
    avgLatencyMs: number;
    failedEmails24h: number;
    totalEmails24h: number;
  };
  database: {
    healthy: boolean;
    latencyMs: number;
  };
  functions: FunctionHealth[];
  lastChecked: string;
}

interface SystemHealthCardProps {
  data?: SystemHealthData;
  loading?: boolean;
  onRefresh?: () => void;
}

export function SystemHealthCard({ data, loading, onRefresh }: SystemHealthCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-48" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Unable to load system health data</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (data.status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusBadge = () => {
    switch (data.status) {
      case 'healthy':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Degraded</Badge>;
      default:
        return <Badge variant="destructive">Down</Badge>;
    }
  };

  const formatFunctionName = (name: string) => {
    return name
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="flex items-center gap-2">
                System Health
                {getStatusBadge()}
              </CardTitle>
              <CardDescription>
                Last checked {formatDistanceToNow(new Date(data.lastChecked), { addSuffix: true })}
              </CardDescription>
            </div>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-500 mb-1">
              <CheckCircle className="h-5 w-5" />
              <span className="text-2xl font-bold">{data.uptime.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-primary mb-1">
              <Activity className="h-5 w-5" />
              <span className="text-2xl font-bold">{data.metrics.totalCalls24h.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">API Calls (24h)</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-500 mb-1">
              <Zap className="h-5 w-5" />
              <span className="text-2xl font-bold">{data.metrics.avgLatencyMs}ms</span>
            </div>
            <p className="text-xs text-muted-foreground">Avg Latency</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className={`flex items-center justify-center gap-2 mb-1 ${data.metrics.errorRate24h > 5 ? 'text-destructive' : 'text-emerald-500'}`}>
              {data.metrics.errorRate24h > 5 ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
              <span className="text-2xl font-bold">{data.metrics.errorRate24h.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Error Rate (24h)</p>
          </div>
        </div>

        {/* Database Status */}
        <div className="flex items-center gap-4 p-4 rounded-lg border">
          <Database className={`h-6 w-6 ${data.database.healthy ? 'text-emerald-500' : 'text-destructive'}`} />
          <div className="flex-1">
            <p className="font-medium">Database</p>
            <p className="text-sm text-muted-foreground">
              {data.database.healthy ? 'Connected' : 'Connection issues'}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">{data.database.latencyMs}ms</p>
            <p className="text-xs text-muted-foreground">Latency</p>
          </div>
          {data.database.healthy ? (
            <Badge className="bg-emerald-500">Online</Badge>
          ) : (
            <Badge variant="destructive">Offline</Badge>
          )}
        </div>

        {/* Function Stats */}
        {data.functions.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              AI Functions (Last 24h)
            </h4>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Function</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.functions.map((fn) => {
                    const errorRate = fn.calls > 0 ? (fn.errors / fn.calls) * 100 : 0;
                    return (
                      <TableRow key={fn.name}>
                        <TableCell className="font-medium">
                          {formatFunctionName(fn.name)}
                        </TableCell>
                        <TableCell className="text-right">{fn.calls}</TableCell>
                        <TableCell className="text-right">
                          {fn.errors > 0 ? (
                            <span className="text-destructive font-medium">{fn.errors}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {errorRate > 10 ? (
                            <Badge variant="destructive" className="text-xs">
                              {errorRate.toFixed(0)}% errors
                            </Badge>
                          ) : errorRate > 0 ? (
                            <Badge className="bg-amber-500 text-xs">
                              {errorRate.toFixed(0)}% errors
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

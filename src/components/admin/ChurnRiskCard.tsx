import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingDown, Users, DollarSign, AlertTriangle, RefreshCw, Mail, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AtRiskUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  lastActive: string | null;
  daysInactive: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  subscriptionStatus: 'pro' | 'free';
  subscriptionAmount: number;
}

interface ChurnRiskData {
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    totalAtRiskPro: number;
    potentialMrrAtRisk: number;
  };
  atRiskUsers: AtRiskUser[];
}

interface ChurnRiskCardProps {
  data?: ChurnRiskData;
  loading?: boolean;
  onRefresh?: () => void;
  onSendReengagement?: (userId: string, email: string) => void;
}

export function ChurnRiskCard({ data, loading, onRefresh, onSendReengagement }: ChurnRiskCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32" />
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
          <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Unable to load churn risk data</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
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

  const proAtRiskUsers = data.atRiskUsers.filter(u => u.subscriptionStatus === 'pro');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              Churn Risk Monitor
            </CardTitle>
            <CardDescription>Identify and engage at-risk users</CardDescription>
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
        {/* Risk Distribution & MRR at Risk */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Risk Distribution */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Distribution
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-sm">Critical (14+ days)</span>
                </div>
                <span className="font-bold">{data.summary.critical}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-sm">High (7-13 days)</span>
                </div>
                <span className="font-bold">{data.summary.high}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-sm">Medium (Free, 7+)</span>
                </div>
                <span className="font-bold">{data.summary.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                  <span className="text-sm">Low (3-6 days)</span>
                </div>
                <span className="font-bold">{data.summary.low}</span>
              </div>
            </div>
          </div>

          {/* MRR at Risk */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue at Risk
            </h4>
            <div className="space-y-4">
              <div className="text-center p-4 bg-background rounded-lg border">
                <p className="text-3xl font-bold text-destructive">
                  ${data.summary.potentialMrrAtRisk.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Potential MRR at risk</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  At-risk Pro users
                </span>
                <span className="font-bold">{data.summary.totalAtRiskPro}</span>
              </div>
            </div>
          </div>
        </div>

        {/* At-Risk Pro Users List */}
        {proAtRiskUsers.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              At-Risk Pro Users ({proAtRiskUsers.length})
            </h4>
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-3 space-y-3">
                {proAtRiskUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">
                          {user.firstName || user.lastName
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : user.email}
                        </p>
                        {getRiskBadge(user.riskLevel)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last active: {user.lastActive
                          ? formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })
                          : 'Never'}
                        <span className="mx-2">•</span>
                        {user.daysInactive} days inactive
                      </p>
                    </div>
                    {onSendReengagement && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSendReengagement(user.id, user.email)}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Re-engage
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {proAtRiskUsers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No Pro users at risk</p>
            <p className="text-sm">All paying customers are actively engaged</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Search, Download, RefreshCw, Monitor, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UserActivity {
  id: string;
  user_id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UserActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  accessToken: string;
}

const ACTIVITY_PER_PAGE = 10;

const getDeviceIcon = (userAgent: string | null) => {
  if (!userAgent) return <Monitor className="h-4 w-4" />;
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return <Smartphone className="h-4 w-4" />;
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return <Tablet className="h-4 w-4" />;
  }
  return <Monitor className="h-4 w-4" />;
};

const getBrowserInfo = (userAgent: string | null): string => {
  if (!userAgent) return 'Unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'Other';
};

const getOSInfo = (userAgent: string | null): string => {
  if (!userAgent) return 'Unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac os') || ua.includes('macintosh')) return 'macOS';
  if (ua.includes('linux') && !ua.includes('android')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  return 'Other';
};

export const UserActivityDialog = ({ open, onOpenChange, user, accessToken }: UserActivityDialogProps) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchActivities = async () => {
    if (!user || !accessToken) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      console.error('Failed to fetch user activity:', error);
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      fetchActivities();
      setCurrentPage(1);
      setSearchQuery('');
      setDateFrom(undefined);
      setDateTo(undefined);
    }
  }, [open, user?.id]);

  const filteredActivities = activities.filter(activity => {
    // Text search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesIP = activity.ip_address?.toLowerCase().includes(query);
      const matchesEvent = activity.event_type.toLowerCase().includes(query);
      const matchesBrowser = getBrowserInfo(activity.user_agent).toLowerCase().includes(query);
      if (!matchesIP && !matchesEvent && !matchesBrowser) return false;
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      const activityDate = new Date(activity.created_at);
      if (dateFrom && dateTo) {
        return isWithinInterval(activityDate, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
      } else if (dateFrom) {
        return activityDate >= startOfDay(dateFrom);
      } else if (dateTo) {
        return activityDate <= endOfDay(dateTo);
      }
    }
    
    return true;
  });

  const totalPages = Math.ceil(filteredActivities.length / ACTIVITY_PER_PAGE);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * ACTIVITY_PER_PAGE,
    currentPage * ACTIVITY_PER_PAGE
  );

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const exportToCSV = () => {
    if (filteredActivities.length === 0) {
      toast.error('No activity to export');
      return;
    }

    const headers = ['Event Type', 'IP Address', 'Browser', 'OS', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...filteredActivities.map(activity => [
        activity.event_type,
        `"${activity.ip_address || 'Unknown'}"`,
        getBrowserInfo(activity.user_agent),
        getOSInfo(activity.user_agent),
        format(new Date(activity.created_at), 'yyyy-MM-dd HH:mm:ss')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `activity-${user?.email}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Activity exported successfully');
  };

  const uniqueIPs = [...new Set(activities.map(a => a.ip_address).filter(Boolean))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Activity Log: {user?.email}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {user?.first_name && user?.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : 'Full login history with IP addresses and timestamps'}
          </p>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="flex gap-4 py-2 border-b">
          <div className="text-sm">
            <span className="text-muted-foreground">Total Logins:</span>{' '}
            <span className="font-medium">{activities.length}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Unique IPs:</span>{' '}
            <span className="font-medium">{uniqueIPs.length}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 py-2">
          <div className="flex-1 min-w-[180px] max-w-xs">
            <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by IP, event, browser..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-[130px] justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d") : "Select"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(d) => { setDateFrom(d); setCurrentPage(1); }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-[130px] justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d") : "Select"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(d) => { setDateTo(d); setCurrentPage(1); }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearDateFilters}>
              Clear
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredActivities.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchActivities} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Activity Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Browser / OS</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {activity.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {activity.ip_address || <span className="text-muted-foreground">Unknown</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        {getDeviceIcon(activity.user_agent)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {getBrowserInfo(activity.user_agent)} / {getOSInfo(activity.user_agent)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedActivities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchQuery || dateFrom || dateTo ? 'No matching activity found' : 'No activity recorded'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * ACTIVITY_PER_PAGE) + 1} to {Math.min(currentPage * ACTIVITY_PER_PAGE, filteredActivities.length)} of {filteredActivities.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

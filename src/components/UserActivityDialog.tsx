import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Search, Download, RefreshCw, Monitor, Smartphone, Tablet, ListFilter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Json } from '@/integrations/supabase/types';

interface UserActivity {
  id: string;
  user_id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  metadata: Json | null;
}

type EventTypeFilter = 'all' | 'login' | 'signup' | 'task_complete' | 'assessment_complete';

const EVENT_TYPE_OPTIONS: { value: EventTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'login', label: 'Logins' },
  { value: 'signup', label: 'Signups' },
  { value: 'task_complete', label: 'Tasks' },
  { value: 'assessment_complete', label: 'Assessments' },
];

const getEventBadgeVariant = (eventType: string): 'default' | 'secondary' | 'outline' => {
  switch (eventType) {
    case 'login':
    case 'signup':
      return 'default';
    case 'task_complete':
      return 'secondary';
    case 'assessment_complete':
      return 'outline';
    default:
      return 'outline';
  }
};

const formatEventType = (eventType: string): string => {
  switch (eventType) {
    case 'login':
      return 'Login';
    case 'signup':
      return 'Signup';
    case 'task_complete':
      return 'Task Complete';
    case 'assessment_complete':
      return 'Assessment Complete';
    default:
      return eventType.charAt(0).toUpperCase() + eventType.slice(1);
  }
};

const getEventDetails = (activity: UserActivity): string | null => {
  if (!activity.metadata || typeof activity.metadata !== 'object') return null;
  const meta = activity.metadata as Record<string, unknown>;
  if (activity.event_type === 'task_complete' && meta.task_name) {
    return meta.task_name as string;
  }
  if (activity.event_type === 'assessment_complete' && meta.assessment_name) {
    const score = meta.score !== undefined ? ` (Score: ${meta.score})` : '';
    return `${meta.assessment_name}${score}`;
  }
  return null;
};

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

const ActivityContent = ({ 
  user, 
  accessToken,
  activities,
  setActivities,
  loading,
  setLoading,
  fetchActivities
}: {
  user: UserActivityDialogProps['user'];
  accessToken: string;
  activities: UserActivity[];
  setActivities: React.Dispatch<React.SetStateAction<UserActivity[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchActivities: () => Promise<void>;
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('all');
  const isMobile = useIsMobile();

  const filteredActivities = activities.filter(activity => {
    // Event type filter
    if (eventTypeFilter !== 'all' && activity.event_type !== eventTypeFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesIP = activity.ip_address?.toLowerCase().includes(query);
      const matchesEvent = activity.event_type.toLowerCase().includes(query);
      const matchesBrowser = getBrowserInfo(activity.user_agent).toLowerCase().includes(query);
      const details = getEventDetails(activity);
      const matchesDetails = details?.toLowerCase().includes(query);
      if (!matchesIP && !matchesEvent && !matchesBrowser && !matchesDetails) return false;
    }
    
    // Date filter
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

    const headers = ['Event Type', 'Details', 'IP Address', 'Browser', 'OS', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...filteredActivities.map(activity => [
        formatEventType(activity.event_type),
        `"${getEventDetails(activity) || ''}"`,
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

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setEventTypeFilter('all');
    setSearchQuery('');
  };

  const uniqueIPs = [...new Set(activities.map(a => a.ip_address).filter(Boolean))];

  return (
    <div className="flex flex-col h-full">
      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4 py-2 border-b text-sm">
        <div>
          <span className="text-muted-foreground">Total Events:</span>{' '}
          <span className="font-medium">{activities.length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Logins:</span>{' '}
          <span className="font-medium">{activities.filter(a => a.event_type === 'login').length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Tasks:</span>{' '}
          <span className="font-medium">{activities.filter(a => a.event_type === 'task_complete').length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Assessments:</span>{' '}
          <span className="font-medium">{activities.filter(a => a.event_type === 'assessment_complete').length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 py-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by IP, event, task name..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-9"
            />
          </div>
          <Select 
            value={eventTypeFilter} 
            onValueChange={(v) => { setEventTypeFilter(v as EventTypeFilter); setCurrentPage(1); }}
          >
            <SelectTrigger className="w-[140px] h-9">
              <ListFilter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isMobile && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[110px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM d") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(d) => { setDateFrom(d); setCurrentPage(1); }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[110px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM d") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(d) => { setDateTo(d); setCurrentPage(1); }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {(dateFrom || dateTo || eventTypeFilter !== 'all' || searchQuery) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredActivities.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="outline" size="sm" onClick={fetchActivities} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden space-y-2">
              {paginatedActivities.map((activity) => {
                const details = getEventDetails(activity);
                return (
                  <Card key={activity.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={getEventBadgeVariant(activity.event_type)}>
                          {formatEventType(activity.event_type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {details && (
                        <p className="text-sm text-foreground mb-2">{details}</p>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">IP:</span>{' '}
                          <span className="font-mono text-xs">{activity.ip_address || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {getDeviceIcon(activity.user_agent)}
                          <span>{getBrowserInfo(activity.user_agent)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {paginatedActivities.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  {searchQuery || dateFrom || dateTo || eventTypeFilter !== 'all' ? 'No matching activity found' : 'No activity recorded'}
                </p>
              )}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Browser / OS</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedActivities.map((activity) => {
                    const details = getEventDetails(activity);
                    return (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Badge variant={getEventBadgeVariant(activity.event_type)}>
                            {formatEventType(activity.event_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {details || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {activity.ip_address || <span className="text-muted-foreground">Unknown</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getBrowserInfo(activity.user_agent)} / {getOSInfo(activity.user_agent)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {paginatedActivities.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery || dateFrom || dateTo || eventTypeFilter !== 'all' ? 'No matching activity found' : 'No activity recorded'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t mt-auto">
          <p className="text-xs md:text-sm text-muted-foreground">
            {((currentPage - 1) * ACTIVITY_PER_PAGE) + 1}–{Math.min(currentPage * ACTIVITY_PER_PAGE, filteredActivities.length)} of {filteredActivities.length}
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
            <span className="text-xs md:text-sm text-muted-foreground">
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
    </div>
  );
};

export const UserActivityDialog = ({ open, onOpenChange, user, accessToken }: UserActivityDialogProps) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

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
    }
  }, [open, user?.id]);

  const title = `Activity Log: ${user?.email || ''}`;
  const description = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : 'Full login history with IP addresses and timestamps';

  // Use Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-base">{title}</DrawerTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </DrawerHeader>
          <div className="px-4 pb-4 flex-1 overflow-hidden">
            <ActivityContent
              user={user}
              accessToken={accessToken}
              activities={activities}
              setActivities={setActivities}
              loading={loading}
              setLoading={setLoading}
              fetchActivities={fetchActivities}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>
        <ActivityContent
          user={user}
          accessToken={accessToken}
          activities={activities}
          setActivities={setActivities}
          loading={loading}
          setLoading={setLoading}
          fetchActivities={fetchActivities}
        />
      </DialogContent>
    </Dialog>
  );
};

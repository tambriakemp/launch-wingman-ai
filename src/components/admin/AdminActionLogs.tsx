import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { RefreshCw, Search, Download, CalendarIcon, ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { Json } from '@/integrations/supabase/types';

interface ActionLog {
  id: string;
  admin_user_id: string;
  admin_email: string;
  target_user_id: string | null;
  target_email: string | null;
  action_type: string;
  action_details: Json;
  created_at: string;
}

const ACTION_TYPE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; category: string }> = {
  user_disabled: { label: 'Disabled', variant: 'destructive', category: 'user_management' },
  user_enabled: { label: 'Enabled', variant: 'default', category: 'user_management' },
  user_deleted: { label: 'Deleted', variant: 'destructive', category: 'user_management' },
  role_granted: { label: 'Role Granted', variant: 'default', category: 'user_management' },
  role_removed: { label: 'Role Removed', variant: 'secondary', category: 'user_management' },
  email_updated: { label: 'Email Updated', variant: 'outline', category: 'user_management' },
  password_reset: { label: 'Password Reset', variant: 'outline', category: 'user_management' },
  subscription_cancelled: { label: 'Sub Cancelled', variant: 'destructive', category: 'subscriptions' },
  subscription_granted: { label: 'Pro Granted', variant: 'default', category: 'subscriptions' },
  impersonation_start: { label: 'View As Started', variant: 'secondary', category: 'impersonation' },
  impersonation_end: { label: 'View As Ended', variant: 'outline', category: 'impersonation' },
};

const ACTION_CATEGORIES: Record<string, string> = {
  user_management: 'User Management',
  subscriptions: 'Subscriptions',
  impersonation: 'Impersonation',
};

const LOGS_PER_PAGE = 15;

export function AdminActionLogs() {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_action_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setLogs((data as ActionLog[]) || []);
    } catch (error: any) {
      console.error('Failed to fetch action logs:', error);
      toast.error('Failed to load action logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.admin_email.toLowerCase().includes(query) ||
          (log.target_email?.toLowerCase().includes(query))
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((log) => {
        const actionConfig = ACTION_TYPE_LABELS[log.action_type];
        return actionConfig?.category === categoryFilter;
      });
    }

    if (actionFilter !== 'all') {
      result = result.filter((log) => log.action_type === actionFilter);
    }

    if (dateFrom || dateTo) {
      result = result.filter((log) => {
        const logDate = new Date(log.created_at);
        if (dateFrom && dateTo) {
          return isWithinInterval(logDate, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
        } else if (dateFrom) {
          return logDate >= startOfDay(dateFrom);
        } else if (dateTo) {
          return logDate <= endOfDay(dateTo);
        }
        return true;
      });
    }

    return result;
  }, [logs, searchQuery, categoryFilter, actionFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + LOGS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const uniqueActionTypes = useMemo(() => {
    return [...new Set(logs.map((log) => log.action_type))];
  }, [logs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, actionFilter, dateFrom, dateTo]);

  // Reset action filter when category changes
  useEffect(() => {
    setActionFilter('all');
  }, [categoryFilter]);

  // Get action types filtered by selected category
  const filteredActionTypes = useMemo(() => {
    if (categoryFilter === 'all') {
      return uniqueActionTypes;
    }
    return uniqueActionTypes.filter((type) => {
      const actionConfig = ACTION_TYPE_LABELS[type];
      return actionConfig?.category === categoryFilter;
    });
  }, [uniqueActionTypes, categoryFilter]);

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = ['Admin', 'Target', 'Action', 'Details', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map((log) =>
        [
          `"${log.admin_email}"`,
          `"${log.target_email || '—'}"`,
          log.action_type,
          `"${JSON.stringify(log.action_details).replace(/"/g, '""')}"`,
          format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `admin-action-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logs exported successfully');
  };

  const getActionBadge = (actionType: string) => {
    const config = ACTION_TYPE_LABELS[actionType] || { label: actionType, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base md:text-lg">Admin Action Logs</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Complete audit trail of all admin actions
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredLogs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {/* Filters */}
        <div className="mb-4 space-y-3 md:space-y-0 md:flex md:flex-wrap md:items-end md:gap-4">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(ACTION_CATEGORIES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Action Type</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {filteredActionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {ACTION_TYPE_LABELS[type]?.label || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden md:block">
            <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('w-[130px] justify-start text-left font-normal h-9', !dateFrom && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'MMM d') : 'Select'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div className="hidden md:block">
            <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('w-[130px] justify-start text-left font-normal h-9', !dateTo && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'MMM d') : 'Select'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearDateFilters} className="h-9">
              Clear
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {paginatedLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      {getActionBadge(log.action_type)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Admin:</span> {log.admin_email}
                    </p>
                    {log.target_email && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Target:</span> {log.target_email}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {paginatedLogs.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  {searchQuery || categoryFilter !== 'all' || actionFilter !== 'all' || dateFrom || dateTo
                    ? 'No matching logs found'
                    : 'No admin actions logged yet'}
                </p>
              )}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell className="font-medium">{log.admin_email}</TableCell>
                      <TableCell>{log.target_email || '—'}</TableCell>
                      <TableCell>{getActionBadge(log.action_type)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {log.action_details && typeof log.action_details === 'object'
                          ? JSON.stringify(log.action_details)
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery || categoryFilter !== 'all' || actionFilter !== 'all' || dateFrom || dateTo
                          ? 'No matching logs found'
                          : 'No admin actions logged yet'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-3">
                <p className="text-xs md:text-sm text-muted-foreground">
                  {(currentPage - 1) * LOGS_PER_PAGE + 1}–{Math.min(currentPage * LOGS_PER_PAGE, filteredLogs.length)} of{' '}
                  {filteredLogs.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

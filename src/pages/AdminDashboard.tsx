import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, Users, CreditCard, Crown, X, RefreshCw, LogOut, Eye, History, Search, Download, CalendarIcon, ChevronLeft, ChevronRight, Filter, CheckSquare, Square, Activity } from 'lucide-react';
import { format, startOfDay, endOfDay, isWithinInterval, formatDistanceToNow } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { UserActivityDialog } from '@/components/UserActivityDialog';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  subscription_status: 'free' | 'pro';
  subscription_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  last_active: string | null;
}

interface ImpersonationLog {
  id: string;
  admin_email: string;
  target_email: string;
  action: string;
  created_at: string;
}

const LOGS_PER_PAGE = 10;
const USERS_PER_PAGE = 10;

const AdminDashboard = () => {
  const { session, signOut, startImpersonation, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [impersonateLoading, setImpersonateLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'cancel' | 'grant_pro';
    user: User | null;
  }>({ open: false, action: 'cancel', user: null });
  const [impersonateDialog, setImpersonateDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });
  const [impersonationLogs, setImpersonationLogs] = useState<ImpersonationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  // User filtering state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userDateFrom, setUserDateFrom] = useState<Date | undefined>(undefined);
  const [userDateTo, setUserDateTo] = useState<Date | undefined>(undefined);
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [userCurrentPage, setUserCurrentPage] = useState(1);

  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkConfirmDialog, setBulkConfirmDialog] = useState<{
    open: boolean;
    action: 'cancel' | 'grant_pro';
  }>({ open: false, action: 'grant_pro' });

  // Activity dialog state
  const [activityDialog, setActivityDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  // Filter users based on search, date range, and status
  const filteredUsers = useMemo(() => {
    let result = users;
    
    // Text search filter
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();
      result = result.filter(
        user => 
          user.email.toLowerCase().includes(query) ||
          (user.first_name?.toLowerCase().includes(query)) ||
          (user.last_name?.toLowerCase().includes(query))
      );
    }
    
    // Status filter
    if (userStatusFilter !== 'all') {
      result = result.filter(user => user.subscription_status === userStatusFilter);
    }
    
    // Date range filter (joined date)
    if (userDateFrom || userDateTo) {
      result = result.filter(user => {
        const joinedDate = new Date(user.created_at);
        if (userDateFrom && userDateTo) {
          return isWithinInterval(joinedDate, { start: startOfDay(userDateFrom), end: endOfDay(userDateTo) });
        } else if (userDateFrom) {
          return joinedDate >= startOfDay(userDateFrom);
        } else if (userDateTo) {
          return joinedDate <= endOfDay(userDateTo);
        }
        return true;
      });
    }
    
    return result;
  }, [users, userSearchQuery, userStatusFilter, userDateFrom, userDateTo]);

  // User pagination
  const userTotalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (userCurrentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, userCurrentPage]);

  // Reset user page when filters change
  useEffect(() => {
    setUserCurrentPage(1);
  }, [userSearchQuery, userDateFrom, userDateTo, userStatusFilter]);

  const clearUserDateFilters = () => {
    setUserDateFrom(undefined);
    setUserDateTo(undefined);
  };

  // Export users to CSV
  const exportUsersToCSV = () => {
    if (filteredUsers.length === 0) {
      toast.error('No users to export');
      return;
    }

    const headers = ['Name', 'Email', 'Joined', 'Status', 'Subscription End', 'Last Active'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => [
        `"${user.first_name || ''} ${user.last_name || ''}".trim() || '—'`,
        `"${user.email}"`,
        format(new Date(user.created_at), 'yyyy-MM-dd'),
        user.subscription_status === 'pro' ? 'Pro' : 'Free',
        user.subscription_end ? format(new Date(user.subscription_end), 'yyyy-MM-dd') : '—',
        user.last_active ? format(new Date(user.last_active), 'yyyy-MM-dd HH:mm') : 'Never'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Users exported successfully');
  };

  // Bulk selection functions
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  // Get selected users that can have the action applied
  const getEligibleUsers = (action: 'cancel' | 'grant_pro') => {
    return paginatedUsers.filter(user => {
      if (!selectedUsers.has(user.id)) return false;
      if (action === 'cancel') return user.subscription_status === 'pro';
      if (action === 'grant_pro') return user.subscription_status === 'free';
      return false;
    });
  };

  const executeBulkAction = async () => {
    const { action } = bulkConfirmDialog;
    if (!session?.access_token) return;

    const eligibleUsers = getEligibleUsers(action);
    if (eligibleUsers.length === 0) {
      toast.error(`No eligible users for this action`);
      setBulkConfirmDialog({ open: false, action: 'grant_pro' });
      return;
    }

    setBulkActionLoading(true);
    setBulkConfirmDialog({ open: false, action: 'grant_pro' });

    let successCount = 0;
    let failCount = 0;

    for (const user of eligibleUsers) {
      try {
        const { error } = await supabase.functions.invoke('admin-manage-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            action,
            user_email: user.email,
            stripe_subscription_id: user.stripe_subscription_id,
          },
        });

        if (error) {
          failCount++;
        } else {
          successCount++;
        }
      } catch {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully updated ${successCount} user(s)`);
    }
    if (failCount > 0) {
      toast.error(`Failed to update ${failCount} user(s)`);
    }

    clearSelection();
    await fetchUsers();
    setBulkActionLoading(false);
  };

  // Filter logs based on search query and date range
  const filteredLogs = useMemo(() => {
    let logs = impersonationLogs;
    
    // Text search filter
    if (logSearchQuery.trim()) {
      const query = logSearchQuery.toLowerCase();
      logs = logs.filter(
        log => 
          log.admin_email.toLowerCase().includes(query) ||
          log.target_email.toLowerCase().includes(query)
      );
    }
    
    // Date range filter
    if (dateFrom || dateTo) {
      logs = logs.filter(log => {
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
    
    return logs;
  }, [impersonationLogs, logSearchQuery, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + LOGS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [logSearchQuery, dateFrom, dateTo]);

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Export logs to CSV
  const exportLogsToCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const headers = ['Admin Email', 'Target User', 'Action', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        `"${log.admin_email}"`,
        `"${log.target_email}"`,
        log.action === 'start' ? 'Started' : 'Ended',
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `impersonation-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logs exported successfully');
  };

  const handleImpersonateClick = (user: User) => {
    setImpersonateDialog({ open: true, user });
  };

  const executeImpersonation = async () => {
    const user = impersonateDialog.user;
    if (!user) return;

    setImpersonateDialog({ open: false, user: null });
    setImpersonateLoading(user.id);
    try {
      await startImpersonation(user.id, user.email);
    } finally {
      setImpersonateLoading(null);
    }
  };

  const fetchUsers = async () => {
    if (!session?.access_token) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchImpersonationLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('impersonation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500); // Fetch more logs for pagination/filtering

      if (error) throw error;
      setImpersonationLogs(data || []);
    } catch (error: any) {
      console.error('Failed to fetch impersonation logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchImpersonationLogs();
  }, [session?.access_token]);

  const handleAction = async (action: 'cancel' | 'grant_pro', user: User) => {
    setConfirmDialog({ open: true, action, user });
  };

  const executeAction = async () => {
    const { action, user } = confirmDialog;
    if (!user || !session?.access_token) return;

    setActionLoading(user.id);
    setConfirmDialog({ open: false, action: 'cancel', user: null });

    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          action,
          user_email: user.email,
          stripe_subscription_id: user.stripe_subscription_id,
        },
      });

      if (error) throw error;
      
      toast.success(data.message || 'Action completed successfully');
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const stats = {
    totalUsers: users.length,
    proUsers: users.filter(u => u.subscription_status === 'pro').length,
    freeUsers: users.filter(u => u.subscription_status === 'free').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage users and subscriptions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/app">
                ← Back to App
              </Link>
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pro Subscribers</CardTitle>
              <Crown className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.proUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Free Users</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.freeUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Accounts</CardTitle>
                <CardDescription>Manage user subscriptions and access</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportUsersToCSV} disabled={filteredUsers.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* User Filters */}
            <div className="mb-4 flex flex-wrap items-end gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px] max-w-sm">
                <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                <Select value={userStatusFilter} onValueChange={(v) => setUserStatusFilter(v as 'all' | 'free' | 'pro')}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Joined From */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Joined From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !userDateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {userDateFrom ? format(userDateFrom, "MMM d, yyyy") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={userDateFrom}
                      onSelect={setUserDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Joined To */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Joined To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !userDateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {userDateTo ? format(userDateTo, "MMM d, yyyy") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={userDateTo}
                      onSelect={setUserDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Clear Date Filters */}
              {(userDateFrom || userDateTo) && (
                <Button variant="ghost" size="sm" onClick={clearUserDateFilters}>
                  Clear dates
                </Button>
              )}
            </div>

            {/* Bulk Actions Bar */}
            {selectedUsers.size > 0 && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{selectedUsers.size} user(s) selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBulkConfirmDialog({ open: true, action: 'grant_pro' })}
                    disabled={bulkActionLoading || getEligibleUsers('grant_pro').length === 0}
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Grant Pro ({getEligibleUsers('grant_pro').length})
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkConfirmDialog({ open: true, action: 'cancel' })}
                    disabled={bulkActionLoading || getEligibleUsers('cancel').length === 0}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel Sub ({getEligibleUsers('cancel').length})
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={paginatedUsers.length > 0 && selectedUsers.size === paginatedUsers.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sub End</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id} className={selectedUsers.has(user.id) ? 'bg-muted/30' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.first_name || user.last_name
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : '—'}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {user.last_active ? (
                            <span className="text-muted-foreground text-sm">
                              {formatDistanceToNow(new Date(user.last_active), { addSuffix: true })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50 text-sm">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.subscription_status === 'pro' ? 'default' : 'secondary'}
                            className={user.subscription_status === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                          >
                            {user.subscription_status === 'pro' ? 'Pro' : 'Free'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.subscription_end
                            ? format(new Date(user.subscription_end), 'MMM d')
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Activity Log button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActivityDialog({ open: true, user })}
                              title="View activity log"
                            >
                              <Activity className="h-4 w-4" />
                            </Button>
                            {/* View as User button - don't show for current user */}
                            {user.id !== currentUser?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleImpersonateClick(user)}
                                disabled={impersonateLoading === user.id}
                                title="View as this user"
                              >
                                {impersonateLoading === user.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {user.subscription_status === 'pro' ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleAction('cancel', user)}
                                disabled={actionLoading === user.id}
                              >
                                {actionLoading === user.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleAction('grant_pro', user)}
                                disabled={actionLoading === user.id}
                              >
                                {actionLoading === user.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Crown className="h-4 w-4 mr-1" />
                                    Grant Pro
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginatedUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {userSearchQuery || userDateFrom || userDateTo || userStatusFilter !== 'all' 
                            ? 'No matching users found' 
                            : 'No users found'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* User Pagination */}
                {userTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {((userCurrentPage - 1) * USERS_PER_PAGE) + 1} to {Math.min(userCurrentPage * USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} users
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserCurrentPage(p => Math.max(1, p - 1))}
                        disabled={userCurrentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {userCurrentPage} of {userTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserCurrentPage(p => Math.min(userTotalPages, p + 1))}
                        disabled={userCurrentPage === userTotalPages}
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

        {/* Impersonation Logs */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Impersonation Activity</CardTitle>
                  <CardDescription>Recent admin impersonation sessions</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportLogsToCSV} disabled={filteredLogs.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={fetchImpersonationLogs} disabled={logsLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-end gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px] max-w-sm">
                <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by admin or target email..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Date From */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM d, yyyy") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[140px] justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MMM d, yyyy") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Clear Dates */}
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={clearDateFilters}>
                  Clear dates
                </Button>
              )}
            </div>

            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Target User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.admin_email}</TableCell>
                        <TableCell>{log.target_email}</TableCell>
                        <TableCell>
                          <Badge variant={log.action === 'start' ? 'default' : 'secondary'}>
                            {log.action === 'start' ? 'Started' : 'Ended'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginatedLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {logSearchQuery || dateFrom || dateTo ? 'No matching logs found' : 'No impersonation activity'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * LOGS_PER_PAGE) + 1} to {Math.min(currentPage * LOGS_PER_PAGE, filteredLogs.length)} of {filteredLogs.length} logs
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
                        Page {currentPage} of {totalPages}
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
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'cancel' ? 'Cancel Subscription' : 'Grant Pro Access'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'cancel'
                ? `Are you sure you want to cancel the subscription for ${confirmDialog.user?.email}? This action cannot be undone.`
                : `Are you sure you want to grant free Pro access to ${confirmDialog.user?.email}? This will create a 100% discounted subscription.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction}>
              {confirmDialog.action === 'cancel' ? 'Yes, Cancel Subscription' : 'Yes, Grant Pro'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Impersonation Confirmation Dialog */}
      <AlertDialog open={impersonateDialog.open} onOpenChange={(open) => !open && setImpersonateDialog({ ...impersonateDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>View as User</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to view the app as <strong>{impersonateDialog.user?.email}</strong>. 
              This action will be logged for security purposes. You can return to your admin account at any time using the banner at the top of the screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeImpersonation}>
              Yes, View as User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={bulkConfirmDialog.open} onOpenChange={(open) => !open && setBulkConfirmDialog({ ...bulkConfirmDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkConfirmDialog.action === 'cancel' ? 'Bulk Cancel Subscriptions' : 'Bulk Grant Pro Access'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkConfirmDialog.action === 'cancel'
                ? `Are you sure you want to cancel subscriptions for ${getEligibleUsers('cancel').length} user(s)? This action cannot be undone.`
                : `Are you sure you want to grant free Pro access to ${getEligibleUsers('grant_pro').length} user(s)?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction} disabled={bulkActionLoading}>
              {bulkActionLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {bulkConfirmDialog.action === 'cancel' ? 'Yes, Cancel All' : 'Yes, Grant Pro'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Activity Dialog */}
      <UserActivityDialog
        open={activityDialog.open}
        onOpenChange={(open) => setActivityDialog({ ...activityDialog, open })}
        user={activityDialog.user}
        accessToken={session?.access_token || ''}
      />
    </div>
  );
};

export default AdminDashboard;

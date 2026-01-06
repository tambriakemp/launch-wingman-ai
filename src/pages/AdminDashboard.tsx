import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Shield, Users, CreditCard, Crown, X, RefreshCw, LogOut, Eye, Search, Download, CalendarIcon, ChevronLeft, ChevronRight, CheckSquare, Activity, Package, Pencil, BookOpen, BarChart3, FileText, Sparkles } from 'lucide-react';
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
import { EditUserDialog } from '@/components/admin/EditUserDialog';
import { AiUsageTable, MrrStatsCard } from '@/components/admin/AiUsageSection';
import { AdminRoleToggle } from '@/components/admin/AdminRoleToggle';
import { RevenueChurnChart } from '@/components/admin/RevenueChurnChart';
import { ProjectStatsCard, ContentStatsCard, EngagementStatsCard, OfferStatsCard, OnboardingFunnelCard } from '@/components/admin/PlatformStatsSection';
import { FeatureUsageHeatmap } from '@/components/admin/FeatureUsageHeatmap';
import { useAdminPlatformStats } from '@/hooks/useAdminPlatformStats';
import { UserStatusToggle } from '@/components/admin/UserStatusToggle';
import { DeleteUserDialog } from '@/components/admin/DeleteUserDialog';
import { AdminActionLogs } from '@/components/admin/AdminActionLogs';

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
  subscription_amount_cents: number;
  last_active: string | null;
  is_admin: boolean;
  is_manager: boolean;
  project_count: number;
  banned_until: string | null;
}

const USERS_PER_PAGE = 10;

// Feature Usage Heatmap Wrapper
function FeatureUsageHeatmapWrapper() {
  const { data: platformStats } = useAdminPlatformStats();
  
  if (!platformStats?.featureUsage) {
    return null;
  }
  
  return <FeatureUsageHeatmap featureUsage={platformStats.featureUsage} />;
}

// Mobile user card component
const MobileUserCard = ({ 
  user, 
  isSelected, 
  onToggleSelect, 
  onActivity,
  onEdit, 
  onImpersonate, 
  onAction, 
  actionLoading, 
  impersonateLoading, 
  currentUserId,
  accessToken,
  onRefresh,
  isAdmin
}: {
  user: User & { project_count: number };
  isSelected: boolean;
  onToggleSelect: () => void;
  onActivity: () => void;
  onEdit: () => void;
  onImpersonate: () => void;
  onAction: (action: 'cancel' | 'grant_pro') => void;
  actionLoading: string | null;
  impersonateLoading: string | null;
  currentUserId: string | undefined;
  accessToken: string;
  onRefresh: () => void;
  isAdmin: boolean;
}) => {
  const isDisabled = user.banned_until && new Date(user.banned_until) > new Date();
  
  return (
    <Card className={cn("mb-3", isSelected && "ring-2 ring-primary", isDisabled && "opacity-75")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {user.first_name || user.last_name
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : '—'}
                </p>
                {isDisabled && (
                  <Badge variant="destructive" className="text-xs">Disabled</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate max-w-[180px]">{user.email}</p>
            </div>
          </div>
          <Badge
            variant={user.is_admin || user.is_manager ? 'default' : user.subscription_status === 'pro' ? 'default' : 'secondary'}
            className={user.is_admin ? 'bg-purple-600 hover:bg-purple-700' : user.is_manager ? 'bg-blue-600 hover:bg-blue-700' : user.subscription_status === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : ''}
          >
            {user.is_admin ? 'Admin' : user.is_manager ? 'Manager' : user.subscription_status === 'pro' ? 'Pro' : 'Free'}
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
          <div>
            <span className="text-muted-foreground">Projects:</span>{' '}
            <span className="font-medium">{user.project_count}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Joined:</span>{' '}
            {format(new Date(user.created_at), 'MMM d, yyyy')}
          </div>
          <div>
            <span className="text-muted-foreground">Active:</span>{' '}
            {user.last_active ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true }) : 'Never'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onActivity}>
            <Activity className="h-4 w-4 mr-1" />
            Activity
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          {user.id !== currentUserId && (
            <>
              {isAdmin && (
                <UserStatusToggle
                  userId={user.id}
                  userEmail={user.email}
                  isDisabled={!!isDisabled}
                  accessToken={accessToken}
                  onStatusChanged={onRefresh}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onImpersonate}
                disabled={impersonateLoading === user.id}
              >
                {impersonateLoading === user.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-1" />
                )}
                View
              </Button>
            </>
          )}
          {user.subscription_status === 'pro' ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onAction('cancel')}
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
              onClick={() => onAction('grant_pro')}
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
          {user.id !== currentUserId && isAdmin && (
            <DeleteUserDialog
              userId={user.id}
              userEmail={user.email}
              accessToken={accessToken}
              onUserDeleted={onRefresh}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const { session, signOut, startImpersonation, user: currentUser } = useAuth();
  const { isAdmin } = useAdmin();
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

  // User filtering state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userDateFrom, setUserDateFrom] = useState<Date | undefined>(undefined);
  const [userDateTo, setUserDateTo] = useState<Date | undefined>(undefined);
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'free' | 'pro' | 'admin' | 'manager'>('all');
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

  // Edit user dialog state
  const [editUserDialog, setEditUserDialog] = useState<{
    open: boolean;
    user: User | null;
  }>({ open: false, user: null });

  // Filter users based on search, date range, and status
  const filteredUsers = useMemo(() => {
    let result = users;
    
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();
      result = result.filter(
        user => 
          user.email.toLowerCase().includes(query) ||
          (user.first_name?.toLowerCase().includes(query)) ||
          (user.last_name?.toLowerCase().includes(query))
      );
    }
    
    if (userStatusFilter !== 'all') {
      if (userStatusFilter === 'admin') {
        result = result.filter(user => user.is_admin);
      } else if (userStatusFilter === 'manager') {
        result = result.filter(user => user.is_manager);
      } else {
        result = result.filter(user => user.subscription_status === userStatusFilter);
      }
    }
    
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

  const userTotalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (userCurrentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, userCurrentPage]);

  useEffect(() => {
    setUserCurrentPage(1);
  }, [userSearchQuery, userDateFrom, userDateTo, userStatusFilter]);

  const clearUserDateFilters = () => {
    setUserDateFrom(undefined);
    setUserDateTo(undefined);
  };

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

  useEffect(() => {
    fetchUsers();
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
    mrrCents: users.reduce((sum, u) => sum + (u.subscription_amount_cents || 0), 0),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Manage users and subscriptions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/app">← Back to App</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="sm:hidden">
              <Link to="/app">← Back</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="hidden sm:inline-flex">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut} className="sm:hidden h-9 w-9">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        {/* Quick Actions */}
        <div className="mb-4 md:mb-6 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/content-vault">
              <Package className="h-4 w-4 mr-2" />
              Manage Content Vault
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/docs">
              <BookOpen className="h-4 w-4 mr-2" />
              Training & Docs
            </Link>
          </Button>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="ai-usage" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI Usage</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Activity Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 md:space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card>
                <CardContent className="p-3 md:pt-6 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Users className="h-5 w-5 md:h-8 md:w-8 text-primary" />
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Total Users</p>
                      <p className="text-xl md:text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:pt-6 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Crown className="h-5 w-5 md:h-8 md:w-8 text-amber-500" />
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Pro Users</p>
                      <p className="text-xl md:text-2xl font-bold">{stats.proUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 md:pt-6 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Users className="h-5 w-5 md:h-8 md:w-8 text-muted-foreground" />
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Free Users</p>
                      <p className="text-xl md:text-2xl font-bold">{stats.freeUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <MrrStatsCard mrrCents={stats.mrrCents} />
            </div>

            {/* Revenue & Churn Chart */}
            <RevenueChurnChart users={users} />

            {/* Platform Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ProjectStatsCard />
              <ContentStatsCard />
              <EngagementStatsCard />
              <OfferStatsCard />
            </div>

            {/* Onboarding Funnel */}
            <OnboardingFunnelCard />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 md:space-y-8">
            {/* User Filters */}
            <Card>
              <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                <CardTitle className="text-base md:text-lg">User Accounts</CardTitle>
                <CardDescription className="text-xs md:text-sm">Manage user subscriptions and access</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {/* Filters Row */}
                <div className="mb-4 space-y-3 md:space-y-0 md:flex md:flex-wrap md:items-end md:gap-4">
                  <div className="flex-1 min-w-[200px] max-w-sm">
                    <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                    <Select value={userStatusFilter} onValueChange={(v: any) => setUserStatusFilter(v)}>
                      <SelectTrigger className="w-[120px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="hidden md:block">
                    <Label className="text-xs text-muted-foreground mb-1 block">Joined From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-[130px] justify-start text-left font-normal h-9",
                            !userDateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {userDateFrom ? format(userDateFrom, "MMM d") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={userDateFrom}
                          onSelect={setUserDateFrom}
                          initialFocus
                          className="pointer-events-auto"
                        />
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
                          className={cn(
                            "w-[130px] justify-start text-left font-normal h-9",
                            !userDateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {userDateTo ? format(userDateTo, "MMM d") : "Select"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={userDateTo}
                          onSelect={setUserDateTo}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {(userDateFrom || userDateTo) && (
                    <Button variant="ghost" size="sm" onClick={clearUserDateFilters} className="h-9">
                      Clear
                    </Button>
                  )}

                  <div className="flex items-center gap-2 md:ml-auto">
                    <Button variant="outline" size="sm" onClick={exportUsersToCSV} disabled={filteredUsers.length === 0} className="text-xs md:text-sm">
                      <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                      <RefreshCw className={cn("h-3 w-3 md:h-4 md:w-4", loading && 'animate-spin')} />
                    </Button>
                  </div>
                </div>

                {/* Bulk Actions */}
                {selectedUsers.size > 0 && (
                  <div className="mb-4 p-3 bg-muted rounded-lg flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{selectedUsers.size} selected</span>
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
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {/* Mobile card view */}
                    <div className="md:hidden">
                      {paginatedUsers.map((user) => (
                        <MobileUserCard
                          key={user.id}
                          user={user}
                          isSelected={selectedUsers.has(user.id)}
                          onToggleSelect={() => toggleUserSelection(user.id)}
                          onActivity={() => setActivityDialog({ open: true, user })}
                          onEdit={() => setEditUserDialog({ open: true, user })}
                          onImpersonate={() => handleImpersonateClick(user)}
                          onAction={(action) => handleAction(action, user)}
                          actionLoading={actionLoading}
                          impersonateLoading={impersonateLoading}
                          currentUserId={currentUser?.id}
                          accessToken={session?.access_token || ''}
                          onRefresh={fetchUsers}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>

                    {/* Desktop table view */}
                    <div className="hidden md:block overflow-x-auto">
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
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead>Projects</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedUsers.map((user) => {
                            const isDisabled = user.banned_until && new Date(user.banned_until) > new Date();
                            return (
                              <TableRow key={user.id} className={cn(selectedUsers.has(user.id) && "bg-muted/50", isDisabled && "opacity-75")}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedUsers.has(user.id)}
                                    onCheckedChange={() => toggleUserSelection(user.id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">
                                        {user.first_name || user.last_name
                                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                          : '—'}
                                      </p>
                                      {isDisabled && (
                                        <Badge variant="destructive" className="text-xs">Disabled</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={user.is_admin || user.is_manager ? 'default' : user.subscription_status === 'pro' ? 'default' : 'secondary'}
                                      className={user.is_admin ? 'bg-purple-600 hover:bg-purple-700' : user.is_manager ? 'bg-blue-600 hover:bg-blue-700' : user.subscription_status === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                                    >
                                      {user.is_admin ? 'Admin' : user.is_manager ? 'Manager' : user.subscription_status === 'pro' ? 'Pro' : 'Free'}
                                    </Badge>
                                    {isAdmin && !user.is_admin && (
                                      <AdminRoleToggle
                                        isAdmin={isAdmin}
                                        userId={user.id}
                                        userEmail={user.email}
                                        isManager={user.is_manager}
                                        accessToken={session?.access_token || ''}
                                        onRoleChanged={fetchUsers}
                                      />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {format(new Date(user.created_at), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>
                                  {user.last_active 
                                    ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true })
                                    : 'Never'}
                                </TableCell>
                                <TableCell>
                                  {user.project_count}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setActivityDialog({ open: true, user })}
                                    >
                                      <Activity className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditUserDialog({ open: true, user })}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    {user.id !== currentUser?.id && (
                                      <>
                                        {isAdmin && (
                                          <UserStatusToggle
                                            userId={user.id}
                                            userEmail={user.email}
                                            isDisabled={!!isDisabled}
                                            accessToken={session?.access_token || ''}
                                            onStatusChanged={fetchUsers}
                                          />
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleImpersonateClick(user)}
                                          disabled={impersonateLoading === user.id}
                                        >
                                          {impersonateLoading === user.id ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Eye className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </>
                                    )}
                                    {user.subscription_status === 'pro' ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAction('cancel', user)}
                                        disabled={actionLoading === user.id}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        {actionLoading === user.id ? (
                                          <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <X className="h-4 w-4" />
                                        )}
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAction('grant_pro', user)}
                                        disabled={actionLoading === user.id}
                                        className="text-amber-500 hover:text-amber-600"
                                      >
                                        {actionLoading === user.id ? (
                                          <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Crown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                    {user.id !== currentUser?.id && isAdmin && (
                                      <DeleteUserDialog
                                        userId={user.id}
                                        userEmail={user.email}
                                        accessToken={session?.access_token || ''}
                                        onUserDeleted={fetchUsers}
                                      />
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {paginatedUsers.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                {userSearchQuery || userDateFrom || userDateTo || userStatusFilter !== 'all'
                                  ? 'No matching users found'
                                  : 'No users found'}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {userTotalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t gap-3">
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {((userCurrentPage - 1) * USERS_PER_PAGE) + 1}–{Math.min(userCurrentPage * USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
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
                          <span className="text-xs md:text-sm text-muted-foreground">
                            {userCurrentPage} / {userTotalPages}
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
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 md:space-y-8">
            <FeatureUsageHeatmapWrapper />
          </TabsContent>

          {/* AI Usage Tab */}
          <TabsContent value="ai-usage" className="space-y-4 md:space-y-8">
            <AiUsageTable />
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="activity" className="space-y-4 md:space-y-8">
            <AdminActionLogs />
          </TabsContent>
        </Tabs>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'cancel' ? 'Cancel Subscription' : 'Grant Pro Access'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'cancel'
                ? `Are you sure you want to cancel the subscription for ${confirmDialog.user?.email}?`
                : `Are you sure you want to grant free Pro access to ${confirmDialog.user?.email}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction} className="w-full sm:w-auto">
              {confirmDialog.action === 'cancel' ? 'Yes, Cancel' : 'Yes, Grant Pro'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Impersonation Confirmation Dialog */}
      <AlertDialog open={impersonateDialog.open} onOpenChange={(open) => !open && setImpersonateDialog({ ...impersonateDialog, open: false })}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>View as User</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to view the app as <strong>{impersonateDialog.user?.email}</strong>. 
              This action will be logged for security purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeImpersonation} className="w-full sm:w-auto">
              Yes, View as User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={bulkConfirmDialog.open} onOpenChange={(open) => !open && setBulkConfirmDialog({ ...bulkConfirmDialog, open: false })}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkConfirmDialog.action === 'cancel' ? 'Bulk Cancel Subscriptions' : 'Bulk Grant Pro Access'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkConfirmDialog.action === 'cancel'
                ? `Are you sure you want to cancel subscriptions for ${getEligibleUsers('cancel').length} user(s)?`
                : `Are you sure you want to grant free Pro access to ${getEligibleUsers('grant_pro').length} user(s)?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction} disabled={bulkActionLoading} className="w-full sm:w-auto">
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

      {/* Edit User Dialog */}
      <EditUserDialog
        open={editUserDialog.open}
        onOpenChange={(open) => setEditUserDialog({ ...editUserDialog, open })}
        user={editUserDialog.user}
        accessToken={session?.access_token || ''}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
};

export default AdminDashboard;
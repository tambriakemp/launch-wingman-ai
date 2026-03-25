import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Users, CreditCard, Crown, X, RefreshCw, LogOut, Eye, Search, Download, CalendarIcon, ChevronLeft, ChevronRight, CheckSquare, Activity, Package, Pencil, BookOpen, BarChart3, FileText, Bell, Headphones, Video, Tag, Palette, Settings, Image as ImageIcon, Wallet, ExternalLink } from 'lucide-react';
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
import { MrrStatsCard } from '@/components/admin/AiUsageSection';
import { AdminRoleToggle } from '@/components/admin/AdminRoleToggle';
import { RevenueChurnChart } from '@/components/admin/RevenueChurnChart';
import { UserStatusToggle } from '@/components/admin/UserStatusToggle';
import { DeleteUserDialog } from '@/components/admin/DeleteUserDialog';
import { AdminActionLogs } from '@/components/admin/AdminActionLogs';
import { UserProjectsDialog } from '@/components/admin/UserProjectsDialog';
import { ExportUserDataDialog } from '@/components/admin/ExportUserDataDialog';
import { CouponManagement } from '@/components/admin/CouponManagement';
import { SubscriptionTierToggle } from '@/components/admin/SubscriptionTierToggle';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy tab components for better initial load
const MonitoringTab = lazy(() => import('@/components/admin/MonitoringTab').then(m => ({ default: m.MonitoringTab })));
const ConfigTab = lazy(() => import('@/components/admin/ConfigTab').then(m => ({ default: m.ConfigTab })));
const SupportTicketsTab = lazy(() => import('@/components/admin/SupportTicketsTab').then(m => ({ default: m.SupportTicketsTab })));
const ActivityLogsTab = lazy(() => import('@/components/admin/ActivityLogsTab').then(m => ({ default: m.ActivityLogsTab })));
const MarketingAssetsTab = lazy(() => import('@/components/admin/MarketingAssetsTab').then(m => ({ default: m.MarketingAssetsTab })));

// Lazy load platform stats components (they call the heavy edge function)
const ProjectStatsCard = lazy(() => import('@/components/admin/PlatformStatsSection').then(m => ({ default: m.ProjectStatsCard })));
const ContentStatsCard = lazy(() => import('@/components/admin/PlatformStatsSection').then(m => ({ default: m.ContentStatsCard })));
const EngagementStatsCard = lazy(() => import('@/components/admin/PlatformStatsSection').then(m => ({ default: m.EngagementStatsCard })));
const OfferStatsCard = lazy(() => import('@/components/admin/PlatformStatsSection').then(m => ({ default: m.OfferStatsCard })));
const OnboardingFunnelCard = lazy(() => import('@/components/admin/PlatformStatsSection').then(m => ({ default: m.OnboardingFunnelCard })));
const RelaunchStatsCard = lazy(() => import('@/components/admin/RelaunchStatsCard').then(m => ({ default: m.RelaunchStatsCard })));
const FeatureUsageHeatmap = lazy(() => import('@/components/admin/FeatureUsageHeatmap').then(m => ({ default: m.FeatureUsageHeatmap })));

// Loading fallback for lazy components
const TabLoadingFallback = () => (
  <div className="space-y-4">
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);

const CardLoadingFallback = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-4 w-full" />
    </CardContent>
  </Card>
);

// Analytics tab content component that uses the hook
const AnalyticsTabContent = lazy(() => import('@/components/admin/AnalyticsTabContent').then(m => ({ default: m.AnalyticsTabContent })));

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  subscription_status: 'free' | 'content_vault' | 'pro' | 'advanced';
  subscription_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_amount_cents: number;
  payment_source: 'card' | 'coupon_full' | 'coupon_partial' | 'manual' | 'none';
  coupon_name: string | null;
  net_amount_cents: number;
  last_active: string | null;
  is_admin: boolean;
  is_manager: boolean;
  project_count: number;
  banned_until: string | null;
}

// Payment source badge component
const PaymentSourceBadge = ({ paymentSource, couponName }: { paymentSource: User['payment_source']; couponName: string | null }) => {
  if (paymentSource === 'none') return null;
  
  const config = {
    card: { label: 'Card', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
    coupon_full: { label: '100% Coupon', className: 'bg-orange-500/15 text-orange-700 border-orange-500/30' },
    coupon_partial: { label: 'Coupon', className: 'bg-orange-500/15 text-orange-700 border-orange-500/30' },
    manual: { label: 'Manual', className: 'bg-sky-500/15 text-sky-700 border-sky-500/30' },
  }[paymentSource];

  if (!config) return null;

  const badge = (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', config.className)}>
      {config.label}
    </Badge>
  );

  if (couponName) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent><p>Coupon: {couponName}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};

const USERS_PER_PAGE = 10;

// Mobile user card component
const MobileUserCard = ({ 
  user, 
  isSelected, 
  onToggleSelect, 
  onImpersonate, 
  impersonateLoading, 
  currentUserId,
}: {
  user: User & { project_count: number };
  isSelected: boolean;
  onToggleSelect: () => void;
  onImpersonate: () => void;
  impersonateLoading: string | null;
  currentUserId: string | undefined;
}) => {
  const isDisabled = user.banned_until && new Date(user.banned_until) > new Date();
  const navigate = useNavigate();
  
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
            variant={user.is_admin || user.is_manager || user.subscription_status !== 'free' ? 'default' : 'secondary'}
            className={user.is_admin ? 'bg-purple-600 hover:bg-purple-700' : user.is_manager ? 'bg-blue-600 hover:bg-blue-700' : user.subscription_status === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : user.subscription_status === 'content_vault' ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            {user.is_admin ? 'Admin' : user.is_manager ? 'Manager' : user.subscription_status === 'pro' ? 'Pro' : user.subscription_status === 'content_vault' ? 'Vault' : 'Free'}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
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
          {user.id !== currentUserId && (
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
              View As
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/users/${user.id}`)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = ({ defaultTab = "overview" }: { defaultTab?: string }) => {
  const { session, signOut, startImpersonation, user: currentUser } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [impersonateLoading, setImpersonateLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'cancel' | 'grant_pro' | 'grant_content_vault';
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
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'free' | 'content_vault' | 'pro' | 'advanced' | 'admin' | 'manager'>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'card' | 'coupon_full' | 'manual'>('all');
  const [userCurrentPage, setUserCurrentPage] = useState(1);

  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkConfirmDialog, setBulkConfirmDialog] = useState<{
    open: boolean;
    action: 'cancel' | 'grant_pro' | 'grant_content_vault';
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
      } else if (userStatusFilter === 'content_vault') {
        result = result.filter(user => user.subscription_status === 'content_vault');
      } else {
        result = result.filter(user => user.subscription_status === userStatusFilter);
      }
    }

    if (paymentTypeFilter !== 'all') {
      result = result.filter(user => user.payment_source === paymentTypeFilter);
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
  }, [users, userSearchQuery, userStatusFilter, paymentTypeFilter, userDateFrom, userDateTo]);

  const userTotalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const startIndex = (userCurrentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, userCurrentPage]);

  useEffect(() => {
    setUserCurrentPage(1);
  }, [userSearchQuery, userDateFrom, userDateTo, userStatusFilter, paymentTypeFilter]);

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

  const getEligibleUsers = (action: 'cancel' | 'grant_pro' | 'grant_content_vault') => {
    return paginatedUsers.filter(user => {
      if (!selectedUsers.has(user.id)) return false;
      if (action === 'cancel') return user.subscription_status === 'pro' || user.subscription_status === 'content_vault';
      if (action === 'grant_pro') return user.subscription_status === 'free';
      if (action === 'grant_content_vault') return user.subscription_status === 'free';
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

  const handleAction = async (action: 'cancel' | 'grant_pro' | 'grant_content_vault', user: User) => {
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
    vaultUsers: users.filter(u => u.subscription_status === 'content_vault').length,
    freeUsers: users.filter(u => u.subscription_status === 'free').length,
    mrrCents: users.reduce((sum, u) => sum + (u.subscription_amount_cents || 0), 0),
    payingCustomers: users.filter(u => u.payment_source === 'card').length,
  };

  return (
    <div>
      <main className="space-y-4 md:space-y-6">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="sr-only">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity Logs</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 md:space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
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
              <Card>
                <CardContent className="p-3 md:pt-6 md:p-6">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Wallet className="h-5 w-5 md:h-8 md:w-8 text-emerald-500" />
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Paying (Card)</p>
                      <p className="text-xl md:text-2xl font-bold">{stats.payingCustomers}</p>
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
              <Suspense fallback={<CardLoadingFallback />}>
                <ProjectStatsCard />
              </Suspense>
              <Suspense fallback={<CardLoadingFallback />}>
                <ContentStatsCard />
              </Suspense>
              <Suspense fallback={<CardLoadingFallback />}>
                <EngagementStatsCard />
              </Suspense>
              <Suspense fallback={<CardLoadingFallback />}>
                <OfferStatsCard />
              </Suspense>
            </div>

            {/* Onboarding Funnel */}
            <Suspense fallback={<CardLoadingFallback />}>
              <OnboardingFunnelCard />
            </Suspense>

            {/* Relaunch Analytics */}
            <Suspense fallback={<CardLoadingFallback />}>
              <RelaunchStatsCard />
            </Suspense>
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

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Payment</Label>
                    <Select value={paymentTypeFilter} onValueChange={(v: any) => setPaymentTypeFilter(v)}>
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="card">Card on File</SelectItem>
                        <SelectItem value="coupon_full">100% Coupon</SelectItem>
                        <SelectItem value="manual">Manual/Granted</SelectItem>
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
                      onClick={() => setBulkConfirmDialog({ open: true, action: 'grant_content_vault' })}
                      disabled={bulkActionLoading || getEligibleUsers('grant_content_vault').length === 0}
                      className="border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Grant Vault ({getEligibleUsers('grant_content_vault').length})
                    </Button>
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
                          onImpersonate={() => handleImpersonateClick(user)}
                          impersonateLoading={impersonateLoading}
                          currentUserId={currentUser?.id}
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
                                  <Badge
                                    variant={user.is_admin || user.is_manager || user.subscription_status !== 'free' ? 'default' : 'secondary'}
                                    className={user.is_admin ? 'bg-purple-600 hover:bg-purple-700' : user.is_manager ? 'bg-blue-600 hover:bg-blue-700' : user.subscription_status === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : user.subscription_status === 'content_vault' ? 'bg-green-500 hover:bg-green-600' : ''}
                                  >
                                    {user.is_admin ? 'Admin' : user.is_manager ? 'Manager' : user.subscription_status === 'pro' ? 'Pro' : user.subscription_status === 'content_vault' ? 'Vault' : 'Free'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {format(new Date(user.created_at), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>
                                  {user.last_active 
                                    ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true })
                                    : 'Never'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {user.id !== currentUser?.id && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleImpersonateClick(user)}
                                        disabled={impersonateLoading === user.id}
                                        title="View as this user"
                                      >
                                        {impersonateLoading === user.id ? (
                                          <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <>
                                            <Eye className="h-4 w-4 mr-1" />
                                            <span className="text-xs">View As</span>
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/admin/users/${user.id}`)}
                                    >
                                      <Pencil className="h-4 w-4 mr-1" />
                                      <span className="text-xs">Edit</span>
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {paginatedUsers.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
            <Suspense fallback={<TabLoadingFallback />}>
              <AnalyticsTabContent />
            </Suspense>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="activity" className="space-y-4 md:space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <ActivityLogsTab />
            </Suspense>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-4 md:space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <MonitoringTab users={users} />
            </Suspense>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-4 md:space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <ConfigTab />
            </Suspense>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-4 md:space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <SupportTicketsTab />
            </Suspense>
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4 md:space-y-8">
            <CouponManagement />
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-4 md:space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <MarketingAssetsTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'cancel' 
                ? 'Cancel Subscription' 
                : confirmDialog.action === 'grant_content_vault'
                  ? 'Grant Content Vault Access'
                  : 'Grant Pro Access'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'cancel'
                ? `Are you sure you want to cancel the subscription for ${confirmDialog.user?.email}?`
                : confirmDialog.action === 'grant_content_vault'
                  ? `Are you sure you want to grant free Content Vault access to ${confirmDialog.user?.email}?`
                  : `Are you sure you want to grant free Pro access to ${confirmDialog.user?.email}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction} className="w-full sm:w-auto">
              {confirmDialog.action === 'cancel' 
                ? 'Yes, Cancel' 
                : confirmDialog.action === 'grant_content_vault'
                  ? 'Yes, Grant Vault'
                  : 'Yes, Grant Pro'}
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
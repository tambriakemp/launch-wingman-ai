import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, Users, CreditCard, Crown, X, RefreshCw, LogOut } from 'lucide-react';
import { format } from 'date-fns';
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
}

const AdminDashboard = () => {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'cancel' | 'grant_pro';
    user: User | null;
  }>({ open: false, action: 'cancel', user: null });

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
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription End</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
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
                        <Badge
                          variant={user.subscription_status === 'pro' ? 'default' : 'secondary'}
                          className={user.subscription_status === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                        >
                          {user.subscription_status === 'pro' ? 'Pro' : 'Free'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.subscription_end
                          ? format(new Date(user.subscription_end), 'MMM d, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
    </div>
  );
};

export default AdminDashboard;

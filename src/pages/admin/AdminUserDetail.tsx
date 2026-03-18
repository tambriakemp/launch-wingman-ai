import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Mail, Key, Copy, RefreshCw, Check, Send, Eye,
  Shield, ShieldOff, UserCog, CreditCard, Crown, Package, X,
  Ban, CheckCircle, Download, FileJson, Trash2, AlertTriangle,
  FolderKanban, Calendar, Layers, Activity
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserActivityDialog } from '@/components/UserActivityDialog';

// Reuse the PaymentSourceBadge
const PaymentSourceBadge = ({ paymentSource, couponName }: { paymentSource: string; couponName: string | null }) => {
  if (paymentSource === 'none') return null;
  const config: Record<string, { label: string; className: string }> = {
    card: { label: 'Card', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
    coupon_full: { label: '100% Coupon', className: 'bg-orange-500/15 text-orange-700 border-orange-500/30' },
    coupon_partial: { label: 'Coupon', className: 'bg-orange-500/15 text-orange-700 border-orange-500/30' },
    manual: { label: 'Manual', className: 'bg-sky-500/15 text-sky-700 border-sky-500/30' },
  };
  const c = config[paymentSource];
  if (!c) return null;
  return (
    <Badge variant="outline" className={cn('text-xs px-2 py-0.5', c.className)} title={couponName ? `Coupon: ${couponName}` : undefined}>
      {c.label}{couponName ? ` — ${couponName}` : ''}
    </Badge>
  );
};

interface Project {
  id: string;
  name: string;
  status: string;
  project_type: string;
  created_at: string;
  active_phase: string | null;
  selected_funnel_type: string | null;
  offer_count: number;
  content_count: number;
}

const AdminUserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, startImpersonation, user: currentUser } = useAuth();
  const { isAdmin } = useAdmin();
  const { users, loading: usersLoading, fetchUsers } = useAdminUsers();
  const accessToken = session?.access_token || '';

  const user = users.find(u => u.id === id);

  // Email update state
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  // Password state
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendPasswordNotification, setSendPasswordNotification] = useState(false);

  // Role state
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleConfirm, setRoleConfirm] = useState<{ open: boolean; action: string | null }>({ open: false, action: null });

  // Subscription state
  const [tierLoading, setTierLoading] = useState(false);
  const [tierConfirm, setTierConfirm] = useState<{ open: boolean; action: string | null }>({ open: false, action: null });

  // Status state
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState(false);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  // Export state
  const [exportLoading, setExportLoading] = useState(false);

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');

  // Impersonation
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  const [impersonateConfirm, setImpersonateConfirm] = useState(false);

  // Activity dialog
  const [activityOpen, setActivityOpen] = useState(false);

  // Fetch projects when user is available
  useEffect(() => {
    if (user && accessToken) {
      setProjectsLoading(true);
      supabase.functions.invoke('admin-get-user-projects', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { user_id: user.id },
      }).then(({ data, error }) => {
        if (!error) setProjects(data?.projects || []);
        setProjectsLoading(false);
      });
    }
  }, [user?.id, accessToken]);

  if (usersLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">User not found</p>
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Users
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const userName = user.first_name || user.last_name
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
    : user.email;
  const isDisabled = user.banned_until && new Date(user.banned_until) > new Date();
  const isSelf = user.id === currentUser?.id;

  // --- Handlers ---

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { action: 'update_email', user_id: user.id, new_email: newEmail.trim(), old_email: user.email, send_notification: sendEmailNotification },
      });
      if (error) throw error;
      toast.success(data.email_sent ? `Email updated and notification sent` : 'Email updated');
      setNewEmail('');
      fetchUsers();
    } catch (e: any) { toast.error(e.message || 'Failed to update email'); }
    finally { setEmailLoading(false); }
  };

  const handleGeneratePassword = async () => {
    setPasswordLoading(true);
    setTempPassword(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { action: 'set_temp_password', user_id: user.id, send_notification: sendPasswordNotification },
      });
      if (error) throw error;
      setTempPassword(data.temp_password);
      toast.success(data.email_sent ? 'Password generated and sent' : 'Password generated');
    } catch (e: any) { toast.error(e.message || 'Failed to generate password'); }
    finally { setPasswordLoading(false); }
  };

  const handleCopyPassword = async () => {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    toast.success('Copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleAction = async () => {
    if (!roleConfirm.action) return;
    setRoleConfirm({ open: false, action: null });
    setRoleLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-toggle-role', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { user_id: user.id, action: roleConfirm.action },
      });
      if (error) throw error;
      toast.success('Role updated');
      fetchUsers();
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    finally { setRoleLoading(false); }
  };

  const handleTierAction = async () => {
    if (!tierConfirm.action) return;
    setTierConfirm({ open: false, action: null });
    setTierLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-manage-subscription', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { action: tierConfirm.action, user_email: user.email, stripe_subscription_id: user.stripe_subscription_id },
      });
      if (error) throw error;
      toast.success('Subscription updated');
      fetchUsers();
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    finally { setTierLoading(false); }
  };

  const handleStatusToggle = async () => {
    setStatusConfirm(false);
    setStatusLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-user-status', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { user_id: user.id, action: isDisabled ? 'enable' : 'disable' },
      });
      if (error) throw error;
      toast.success(isDisabled ? 'Account enabled' : 'Account disabled');
      fetchUsers();
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    finally { setStatusLoading(false); }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-export-user-data', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { user_id: user.id },
      });
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-${user.email.replace('@', '_at_')}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Data exported');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    finally { setExportLoading(false); }
  };

  const handleDelete = async () => {
    if (confirmEmail !== user.email) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { user_id: user.id, confirm_email: confirmEmail },
      });
      if (error) throw error;
      toast.success('User deleted');
      navigate('/admin/users');
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    finally { setDeleteLoading(false); }
  };

  const handleImpersonate = async () => {
    setImpersonateConfirm(false);
    setImpersonateLoading(true);
    try { await startImpersonation(user.id, user.email); }
    finally { setImpersonateLoading(false); }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'text-emerald-600 border-emerald-600/50',
      completed: 'text-blue-600 border-blue-600/50',
      launched: 'text-purple-600 border-purple-600/50',
      paused: 'text-amber-600 border-amber-600/50',
    };
    return <Badge variant="outline" className={styles[status] || ''}>{status}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{userName}</h1>
                <Badge
                  variant={user.is_admin || user.is_manager || user.subscription_status !== 'free' ? 'default' : 'secondary'}
                  className={user.is_admin ? 'bg-purple-600' : user.is_manager ? 'bg-blue-600' : user.subscription_status === 'pro' ? 'bg-amber-500' : user.subscription_status === 'content_vault' ? 'bg-green-500' : ''}
                >
                  {user.is_admin ? 'Admin' : user.is_manager ? 'Manager' : user.subscription_status === 'pro' ? 'Pro' : user.subscription_status === 'content_vault' ? 'Vault' : 'Free'}
                </Badge>
                <PaymentSourceBadge paymentSource={user.payment_source} couponName={user.coupon_name} />
                {isDisabled && <Badge variant="destructive">Disabled</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Joined {format(new Date(user.created_at), 'MMM d, yyyy')} · Last active {user.last_active ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true }) : 'never'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setActivityOpen(true)}>
              <Activity className="h-4 w-4 mr-2" /> Activity
            </Button>
            {!isSelf && (
              <Button variant="outline" size="sm" onClick={() => setImpersonateConfirm(true)} disabled={impersonateLoading}>
                {impersonateLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                View As
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Account Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Account</CardTitle>
              <CardDescription>Update email or generate a temporary password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Update Email</Label>
                <Input placeholder="New email address" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                <div className="flex items-center space-x-2">
                  <Checkbox id="emailNotif" checked={sendEmailNotification} onCheckedChange={c => setSendEmailNotification(c === true)} />
                  <Label htmlFor="emailNotif" className="text-xs font-normal cursor-pointer flex items-center gap-1">
                    <Send className="h-3 w-3" /> Notify new address
                  </Label>
                </div>
                <Button size="sm" onClick={handleUpdateEmail} disabled={emailLoading || !newEmail.trim()}>
                  {emailLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : null} Update Email
                </Button>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                {tempPassword ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-sm bg-muted p-2 rounded border">{tempPassword}</code>
                      <Button variant="outline" size="icon" onClick={handleCopyPassword}>
                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-amber-600">⚠️ This password won't be shown again.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="pwdNotif" checked={sendPasswordNotification} onCheckedChange={c => setSendPasswordNotification(c === true)} />
                      <Label htmlFor="pwdNotif" className="text-xs font-normal cursor-pointer flex items-center gap-1">
                        <Send className="h-3 w-3" /> Send via email
                      </Label>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleGeneratePassword} disabled={passwordLoading}>
                      {passwordLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Key className="h-4 w-4 mr-1" />} Generate Password
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Subscription</CardTitle>
              <CardDescription>Current tier and payment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Tier</span>
                <Badge className={user.subscription_status === 'pro' ? 'bg-amber-500' : user.subscription_status === 'content_vault' ? 'bg-green-500' : ''}>
                  {user.subscription_status === 'pro' ? 'Pro' : user.subscription_status === 'content_vault' ? 'Vault' : 'Free'}
                </Badge>
              </div>
              {user.subscription_end && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Expires</span>
                  <span className="text-sm">{format(new Date(user.subscription_end), 'MMM d, yyyy')}</span>
                </div>
              )}
              {user.payment_source !== 'none' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment</span>
                  <PaymentSourceBadge paymentSource={user.payment_source} couponName={user.coupon_name} />
                </div>
              )}
              {user.subscription_amount_cents > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-medium">${(user.subscription_amount_cents / 100).toFixed(2)}/mo</span>
                </div>
              )}
              <Separator />
              <div className="flex flex-wrap gap-2">
                {user.subscription_status === 'free' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setTierConfirm({ open: true, action: 'grant_content_vault' })} disabled={tierLoading} className="text-green-600 border-green-500">
                      <Package className="h-4 w-4 mr-1" /> Grant Vault
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setTierConfirm({ open: true, action: 'grant_pro' })} disabled={tierLoading} className="text-amber-600 border-amber-500">
                      <Crown className="h-4 w-4 mr-1" /> Grant Pro
                    </Button>
                  </>
                )}
                {user.subscription_status === 'content_vault' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setTierConfirm({ open: true, action: 'upgrade_to_pro' })} disabled={tierLoading} className="text-amber-600 border-amber-500">
                      <Crown className="h-4 w-4 mr-1" /> Upgrade to Pro
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setTierConfirm({ open: true, action: 'cancel' })} disabled={tierLoading} className="text-destructive border-destructive/50">
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  </>
                )}
                {user.subscription_status === 'pro' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setTierConfirm({ open: true, action: 'downgrade_to_vault' })} disabled={tierLoading} className="text-green-600 border-green-500">
                      <Package className="h-4 w-4 mr-1" /> Downgrade to Vault
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setTierConfirm({ open: true, action: 'cancel' })} disabled={tierLoading} className="text-destructive border-destructive/50">
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Roles & Access Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Roles & Access</CardTitle>
              <CardDescription>Manage admin roles and account status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Admin Role</p>
                  <p className="text-xs text-muted-foreground">Full admin dashboard access</p>
                </div>
                {isAdmin && !isSelf && (
                  <Button size="sm" variant={user.is_admin ? 'destructive' : 'outline'} onClick={() => setRoleConfirm({ open: true, action: user.is_admin ? 'remove_admin' : 'grant_admin' })} disabled={roleLoading}>
                    {user.is_admin ? <><ShieldOff className="h-4 w-4 mr-1" /> Remove</> : <><Shield className="h-4 w-4 mr-1" /> Grant</>}
                  </Button>
                )}
                {(isSelf || !isAdmin) && (
                  <Badge variant={user.is_admin ? 'default' : 'secondary'}>{user.is_admin ? 'Yes' : 'No'}</Badge>
                )}
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Manager Role</p>
                  <p className="text-xs text-muted-foreground">Limited admin access</p>
                </div>
                {isAdmin && !isSelf && (
                  <Button size="sm" variant={user.is_manager ? 'destructive' : 'outline'} onClick={() => setRoleConfirm({ open: true, action: user.is_manager ? 'remove_manager' : 'grant_manager' })} disabled={roleLoading}>
                    {user.is_manager ? <><ShieldOff className="h-4 w-4 mr-1" /> Remove</> : <><UserCog className="h-4 w-4 mr-1" /> Grant</>}
                  </Button>
                )}
                {(isSelf || !isAdmin) && (
                  <Badge variant={user.is_manager ? 'default' : 'secondary'}>{user.is_manager ? 'Yes' : 'No'}</Badge>
                )}
              </div>
              {!isSelf && isAdmin && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Account Status</p>
                      <p className="text-xs text-muted-foreground">{isDisabled ? 'Account is currently disabled' : 'Account is active'}</p>
                    </div>
                    <Button size="sm" variant={isDisabled ? 'default' : 'outline'} onClick={() => setStatusConfirm(true)} disabled={statusLoading}>
                      {statusLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : isDisabled ? <><CheckCircle className="h-4 w-4 mr-1" /> Enable</> : <><Ban className="h-4 w-4 mr-1" /> Disable</>}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Data & Danger Zone Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileJson className="h-4 w-4" /> Data & Danger Zone</CardTitle>
              <CardDescription>Export data or delete this account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Export User Data</p>
                  <p className="text-xs text-muted-foreground">GDPR-compliant JSON export</p>
                </div>
                <Button size="sm" variant="outline" onClick={handleExport} disabled={exportLoading}>
                  {exportLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />} Export
                </Button>
              </div>
              {!isSelf && isAdmin && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <p className="text-sm font-medium">Delete User</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Permanently delete this user and all their data. This cannot be undone.
                    </p>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>
                      <Trash2 className="h-4 w-4 mr-1" /> Delete User
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Projects Section - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><FolderKanban className="h-4 w-4" /> Projects ({projects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">No projects found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          {p.selected_funnel_type && <p className="text-xs text-muted-foreground capitalize">{p.selected_funnel_type.replace(/_/g, ' ')}</p>}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell className="capitalize">{p.project_type}</TableCell>
                      <TableCell className="capitalize">{p.active_phase?.replace(/_/g, ' ') || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{p.offer_count}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{p.content_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(p.created_at), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialogs */}
      {/* Role confirm */}
      <AlertDialog open={roleConfirm.open} onOpenChange={o => setRoleConfirm({ open: o, action: o ? roleConfirm.action : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{roleConfirm.action?.includes('grant') ? 'Grant' : 'Remove'} {roleConfirm.action?.includes('admin') ? 'Admin' : 'Manager'} Role?</AlertDialogTitle>
            <AlertDialogDescription>This will {roleConfirm.action?.includes('grant') ? 'grant' : 'remove'} {roleConfirm.action?.includes('admin') ? 'admin' : 'manager'} privileges for <strong>{user.email}</strong>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tier confirm */}
      <AlertDialog open={tierConfirm.open} onOpenChange={o => setTierConfirm({ open: o, action: o ? tierConfirm.action : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Subscription?</AlertDialogTitle>
            <AlertDialogDescription>This will update the subscription for <strong>{user.email}</strong>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleTierAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status confirm */}
      <AlertDialog open={statusConfirm} onOpenChange={setStatusConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isDisabled ? 'Enable' : 'Disable'} Account?</AlertDialogTitle>
            <AlertDialogDescription>
              {isDisabled
                ? <>This will restore access for <strong>{user.email}</strong>.</>
                : <>This will suspend access for <strong>{user.email}</strong>. Their data will be preserved.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusToggle} className={!isDisabled ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
              {isDisabled ? 'Enable' : 'Disable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Impersonate confirm */}
      <AlertDialog open={impersonateConfirm} onOpenChange={setImpersonateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>View as {userName}?</AlertDialogTitle>
            <AlertDialogDescription>You'll see the app as this user. You can return to your account anytime.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleImpersonate}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={o => { setDeleteOpen(o); if (!o) setConfirmEmail(''); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Permanently Delete User?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This action <strong>cannot be undone</strong>. All projects, content, and data will be permanently deleted.</p>
              <div className="pt-2">
                <Label htmlFor="confirm-del" className="text-sm font-medium">
                  Type <span className="font-mono bg-muted px-1 rounded">{user.email}</span> to confirm:
                </Label>
                <Input id="confirm-del" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} placeholder="Enter email to confirm" className="mt-2" autoComplete="off" />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={confirmEmail !== user.email || deleteLoading}>
              {deleteLoading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Deleting...</> : <><Trash2 className="h-4 w-4 mr-2" />Delete Permanently</>}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activity Dialog */}
      <UserActivityDialog
        open={activityOpen}
        onOpenChange={setActivityOpen}
        user={user}
        accessToken={accessToken}
      />
    </AdminLayout>
  );
};

export default AdminUserDetail;

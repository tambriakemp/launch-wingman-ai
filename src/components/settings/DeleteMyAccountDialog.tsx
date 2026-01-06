import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, RefreshCw, AlertTriangle, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export function DeleteMyAccountDialog() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [exporting, setExporting] = useState(false);

  const isConfirmed = confirmEmail === user?.email;

  const handleExportFirst = async () => {
    if (!user) return;
    
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in again');
        return;
      }

      const { data, error } = await supabase.functions.invoke('export-my-data', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported! You can now proceed with deletion.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!isConfirmed || !password || !user) return;

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in again');
        setLoading(false);
        return;
      }

      const { error } = await supabase.functions.invoke('delete-my-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          confirm_email: confirmEmail,
          password: password,
        },
      });

      if (error) throw error;

      toast.success('Your account has been permanently deleted');
      await signOut();
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmEmail('');
      setPassword('');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete My Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Your Account?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This action <strong>cannot be undone</strong>. This will permanently delete:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>All your projects and their content</li>
              <li>Brand assets (colors, fonts, logos)</li>
              <li>Offers, funnels, and sales copy</li>
              <li>Content drafts and scheduled posts</li>
              <li>Launch snapshots and metrics</li>
              <li>Your profile and all preferences</li>
              <li>Active subscriptions will be cancelled</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleExportFirst}
            disabled={exporting || loading}
          >
            {exporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export My Data First
              </>
            )}
          </Button>

          <div className="pt-2 border-t">
            <Label htmlFor="confirm-email" className="text-sm font-medium">
              Type <span className="font-mono bg-muted px-1 rounded">{user?.email}</span> to confirm:
            </Label>
            <Input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Enter your email to confirm"
              className="mt-2"
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium">
              Enter your password:
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your current password"
              className="mt-2"
              autoComplete="current-password"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || !password || loading}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

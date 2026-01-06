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
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

interface DeleteUserDialogProps {
  userId: string;
  userEmail: string;
  accessToken: string;
  onUserDeleted: () => void;
}

export function DeleteUserDialog({
  userId,
  userEmail,
  accessToken,
  onUserDeleted,
}: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');

  const isConfirmed = confirmEmail === userEmail;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          user_id: userId,
          confirm_email: confirmEmail,
        },
      });

      if (error) throw error;

      toast.success('User permanently deleted');
      setOpen(false);
      setConfirmEmail('');
      onUserDeleted();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmEmail('');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          title="Delete user permanently"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Permanently Delete User?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This action <strong>cannot be undone</strong>. This will permanently delete:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>All projects and their content</li>
              <li>Brand assets (colors, fonts, logos, photos)</li>
              <li>Offers, funnels, and sales copy</li>
              <li>Content drafts and scheduled posts</li>
              <li>Launch snapshots and metrics</li>
              <li>User profile and preferences</li>
              <li>Active Stripe subscriptions will be cancelled</li>
            </ul>
            <div className="pt-2">
              <Label htmlFor="confirm-email" className="text-sm font-medium">
                Type <span className="font-mono bg-muted px-1 rounded">{userEmail}</span> to confirm:
              </Label>
              <Input
                id="confirm-email"
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder="Enter user's email to confirm"
                className="mt-2"
                autoComplete="off"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
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

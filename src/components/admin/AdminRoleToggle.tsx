import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, ShieldOff, RefreshCw } from 'lucide-react';
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

interface AdminRoleToggleProps {
  userId: string;
  userEmail: string;
  isAdmin: boolean;
  accessToken: string;
  onRoleChanged: () => void;
  disabled?: boolean;
}

export function AdminRoleToggle({
  userId,
  userEmail,
  isAdmin,
  accessToken,
  onRoleChanged,
  disabled = false,
}: AdminRoleToggleProps) {
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const handleToggleRole = async () => {
    setConfirmDialog(false);
    setLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('admin-toggle-role', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          user_id: userId,
          action: isAdmin ? 'remove_admin' : 'grant_admin',
        },
      });

      if (error) throw error;

      toast.success(isAdmin ? 'Admin role removed' : 'Admin role granted');
      onRoleChanged();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={isAdmin ? 'destructive' : 'outline'}
        size="sm"
        onClick={() => setConfirmDialog(true)}
        disabled={loading || disabled}
        className="gap-1"
      >
        {loading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : isAdmin ? (
          <>
            <ShieldOff className="h-4 w-4" />
            <span className="hidden sm:inline">Remove Admin</span>
          </>
        ) : (
          <>
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Make Admin</span>
          </>
        )}
      </Button>

      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isAdmin ? 'Remove Admin Role?' : 'Grant Admin Role?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin ? (
                <>
                  This will remove admin privileges from <strong>{userEmail}</strong>. 
                  They will no longer have access to the admin dashboard or admin-only features.
                </>
              ) : (
                <>
                  This will grant admin privileges to <strong>{userEmail}</strong>. 
                  They will have full access to the admin dashboard and all features.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleRole}>
              {isAdmin ? 'Remove Admin' : 'Grant Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

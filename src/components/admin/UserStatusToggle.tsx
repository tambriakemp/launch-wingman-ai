import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Ban, CheckCircle, RefreshCw } from 'lucide-react';

interface UserStatusToggleProps {
  userId: string;
  userEmail: string;
  isDisabled: boolean;
  accessToken: string;
  onStatusChanged: () => void;
}

export function UserStatusToggle({
  userId,
  userEmail,
  isDisabled,
  accessToken,
  onStatusChanged,
}: UserStatusToggleProps) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    setConfirmOpen(false);

    try {
      const { data, error } = await supabase.functions.invoke('admin-user-status', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          user_id: userId,
          action: isDisabled ? 'enable' : 'disable',
        },
      });

      if (error) throw error;

      toast.success(isDisabled ? 'User account enabled' : 'User account disabled');
      onStatusChanged();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={isDisabled ? 'default' : 'outline'}
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        title={isDisabled ? 'Enable user account' : 'Disable user account'}
      >
        {loading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : isDisabled ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <Ban className="h-4 w-4" />
        )}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDisabled ? 'Enable User Account?' : 'Disable User Account?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isDisabled ? (
                <>
                  This will restore access for <strong>{userEmail}</strong>. 
                  They will be able to log in and use the application again.
                </>
              ) : (
                <>
                  This will suspend access for <strong>{userEmail}</strong>. 
                  They will not be able to log in until re-enabled. Their data will be preserved.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              className={isDisabled ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
            >
              {isDisabled ? 'Enable Account' : 'Disable Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

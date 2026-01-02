import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, ShieldOff, RefreshCw, UserCog } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  isManager: boolean;
  accessToken: string;
  onRoleChanged: () => void;
  disabled?: boolean;
}

type RoleAction = 'grant_admin' | 'remove_admin' | 'grant_manager' | 'remove_manager';

export function AdminRoleToggle({
  userId,
  userEmail,
  isAdmin,
  isManager,
  accessToken,
  onRoleChanged,
  disabled = false,
}: AdminRoleToggleProps) {
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: RoleAction | null;
  }>({ open: false, action: null });

  const handleToggleRole = async () => {
    if (!confirmDialog.action) return;
    
    setConfirmDialog({ open: false, action: null });
    setLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('admin-toggle-role', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          user_id: userId,
          action: confirmDialog.action,
        },
      });

      if (error) throw error;

      const messages: Record<RoleAction, string> = {
        grant_admin: 'Admin role granted',
        remove_admin: 'Admin role removed',
        grant_manager: 'Manager role granted',
        remove_manager: 'Manager role removed',
      };
      
      toast.success(messages[confirmDialog.action]);
      onRoleChanged();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const getDialogContent = () => {
    switch (confirmDialog.action) {
      case 'grant_admin':
        return {
          title: 'Grant Admin Role?',
          description: (
            <>
              This will grant admin privileges to <strong>{userEmail}</strong>. 
              They will have full access to the admin dashboard and all features.
            </>
          ),
          buttonText: 'Grant Admin',
        };
      case 'remove_admin':
        return {
          title: 'Remove Admin Role?',
          description: (
            <>
              This will remove admin privileges from <strong>{userEmail}</strong>. 
              They will no longer have access to the admin dashboard or admin-only features.
            </>
          ),
          buttonText: 'Remove Admin',
        };
      case 'grant_manager':
        return {
          title: 'Grant Manager Role?',
          description: (
            <>
              This will grant manager privileges to <strong>{userEmail}</strong>. 
              They will have access to the admin dashboard but cannot view financial data or manage admin roles.
            </>
          ),
          buttonText: 'Grant Manager',
        };
      case 'remove_manager':
        return {
          title: 'Remove Manager Role?',
          description: (
            <>
              This will remove manager privileges from <strong>{userEmail}</strong>. 
              They will no longer have access to the admin dashboard.
            </>
          ),
          buttonText: 'Remove Manager',
        };
      default:
        return { title: '', description: '', buttonText: '' };
    }
  };

  const dialogContent = getDialogContent();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || disabled}
            className="gap-1"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Roles</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAdmin ? (
            <DropdownMenuItem
              onClick={() => setConfirmDialog({ open: true, action: 'remove_admin' })}
              className="text-destructive focus:text-destructive"
            >
              <ShieldOff className="h-4 w-4 mr-2" />
              Remove Admin
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setConfirmDialog({ open: true, action: 'grant_admin' })}
            >
              <Shield className="h-4 w-4 mr-2" />
              Make Admin
            </DropdownMenuItem>
          )}
          {isManager ? (
            <DropdownMenuItem
              onClick={() => setConfirmDialog({ open: true, action: 'remove_manager' })}
              className="text-destructive focus:text-destructive"
            >
              <ShieldOff className="h-4 w-4 mr-2" />
              Remove Manager
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setConfirmDialog({ open: true, action: 'grant_manager' })}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Make Manager
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, action: open ? confirmDialog.action : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleRole}>
              {dialogContent.buttonText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

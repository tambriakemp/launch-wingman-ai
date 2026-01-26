import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, Crown, X, RefreshCw, CreditCard } from 'lucide-react';
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

interface SubscriptionTierToggleProps {
  userId: string;
  userEmail: string;
  currentTier: 'free' | 'content_vault' | 'pro';
  stripeSubscriptionId: string | null;
  accessToken: string;
  onTierChanged: () => void;
  disabled?: boolean;
}

type TierAction = 
  | 'grant_content_vault' 
  | 'grant_pro' 
  | 'upgrade_to_pro' 
  | 'downgrade_to_vault' 
  | 'cancel';

export function SubscriptionTierToggle({
  userId,
  userEmail,
  currentTier,
  stripeSubscriptionId,
  accessToken,
  onTierChanged,
  disabled = false,
}: SubscriptionTierToggleProps) {
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: TierAction | null;
  }>({ open: false, action: null });

  const handleExecuteAction = async () => {
    if (!confirmDialog.action) return;
    
    setConfirmDialog({ open: false, action: null });
    setLoading(true);
    
    try {
      const { error } = await supabase.functions.invoke('admin-manage-subscription', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          action: confirmDialog.action,
          user_email: userEmail,
          stripe_subscription_id: stripeSubscriptionId,
        },
      });

      if (error) throw error;

      const messages: Record<TierAction, string> = {
        grant_content_vault: 'Content Vault access granted',
        grant_pro: 'Pro access granted',
        upgrade_to_pro: 'Upgraded to Pro',
        downgrade_to_vault: 'Downgraded to Vault',
        cancel: 'Subscription cancelled',
      };
      
      toast.success(messages[confirmDialog.action]);
      onTierChanged();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const getDialogContent = () => {
    switch (confirmDialog.action) {
      case 'grant_content_vault':
        return {
          title: 'Grant Content Vault Access?',
          description: (
            <>
              Grant free Content Vault access to <strong>{userEmail}</strong>? 
              They will have access to the Content Vault features.
            </>
          ),
          buttonText: 'Grant Vault',
        };
      case 'grant_pro':
        return {
          title: 'Grant Pro Access?',
          description: (
            <>
              Grant free Pro access to <strong>{userEmail}</strong>? 
              They will have full access to all features.
            </>
          ),
          buttonText: 'Grant Pro',
        };
      case 'upgrade_to_pro':
        return {
          title: 'Upgrade to Pro?',
          description: (
            <>
              Upgrade <strong>{userEmail}</strong> from Content Vault to Pro? 
              This will cancel their current Vault subscription and grant Pro access.
            </>
          ),
          buttonText: 'Upgrade to Pro',
        };
      case 'downgrade_to_vault':
        return {
          title: 'Downgrade to Content Vault?',
          description: (
            <>
              Downgrade <strong>{userEmail}</strong> from Pro to Content Vault? 
              This will cancel their current Pro subscription and grant Vault access.
            </>
          ),
          buttonText: 'Downgrade to Vault',
        };
      case 'cancel':
        return {
          title: 'Cancel Subscription?',
          description: (
            <>
              Cancel the subscription for <strong>{userEmail}</strong>? 
              They will lose access to paid features and revert to Free tier.
            </>
          ),
          buttonText: 'Cancel Subscription',
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
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Tier</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover">
          {currentTier === 'free' && (
            <>
              <DropdownMenuItem
                onClick={() => setConfirmDialog({ open: true, action: 'grant_content_vault' })}
                className="text-green-600 focus:text-green-600"
              >
                <Package className="h-4 w-4 mr-2" />
                Grant Vault Access
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setConfirmDialog({ open: true, action: 'grant_pro' })}
                className="text-amber-600 focus:text-amber-600"
              >
                <Crown className="h-4 w-4 mr-2" />
                Grant Pro Access
              </DropdownMenuItem>
            </>
          )}
          {currentTier === 'content_vault' && (
            <>
              <DropdownMenuItem
                onClick={() => setConfirmDialog({ open: true, action: 'upgrade_to_pro' })}
                className="text-amber-600 focus:text-amber-600"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setConfirmDialog({ open: true, action: 'cancel' })}
                className="text-destructive focus:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Subscription
              </DropdownMenuItem>
            </>
          )}
          {currentTier === 'pro' && (
            <>
              <DropdownMenuItem
                onClick={() => setConfirmDialog({ open: true, action: 'downgrade_to_vault' })}
                className="text-green-600 focus:text-green-600"
              >
                <Package className="h-4 w-4 mr-2" />
                Downgrade to Vault
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setConfirmDialog({ open: true, action: 'cancel' })}
                className="text-destructive focus:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Subscription
              </DropdownMenuItem>
            </>
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
            <AlertDialogAction onClick={handleExecuteAction}>
              {dialogContent.buttonText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

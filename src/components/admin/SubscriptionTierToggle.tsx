import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, Crown, X, RefreshCw, CreditCard, Zap } from 'lucide-react';
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
  currentTier: 'free' | 'content_vault' | 'pro' | 'advanced';
  stripeSubscriptionId: string | null;
  accessToken: string;
  onTierChanged: () => void;
  disabled?: boolean;
}

type TierAction = 
  | 'grant_content_vault' 
  | 'grant_pro' 
  | 'grant_advanced'
  | 'upgrade_to_pro' 
  | 'upgrade_to_advanced'
  | 'downgrade_to_vault' 
  | 'downgrade_to_pro'
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
        grant_advanced: 'Advanced access granted',
        upgrade_to_pro: 'Upgraded to Pro',
        upgrade_to_advanced: 'Upgraded to Advanced',
        downgrade_to_vault: 'Downgraded to Vault',
        downgrade_to_pro: 'Downgraded to Pro',
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
          description: (<>Grant free Content Vault access to <strong>{userEmail}</strong>?</>),
          buttonText: 'Grant Vault',
        };
      case 'grant_pro':
        return {
          title: 'Grant Pro Access?',
          description: (<>Grant free Pro access to <strong>{userEmail}</strong>?</>),
          buttonText: 'Grant Pro',
        };
      case 'grant_advanced':
        return {
          title: 'Grant Advanced Access?',
          description: (<>Grant free Advanced access to <strong>{userEmail}</strong>? They will have full access to all features including Marketing tools.</>),
          buttonText: 'Grant Advanced',
        };
      case 'upgrade_to_pro':
        return {
          title: 'Upgrade to Pro?',
          description: (<>Upgrade <strong>{userEmail}</strong> to Pro? This will cancel their current subscription and grant Pro access.</>),
          buttonText: 'Upgrade to Pro',
        };
      case 'upgrade_to_advanced':
        return {
          title: 'Upgrade to Advanced?',
          description: (<>Upgrade <strong>{userEmail}</strong> to Advanced? This will cancel their current subscription and grant Advanced access.</>),
          buttonText: 'Upgrade to Advanced',
        };
      case 'downgrade_to_vault':
        return {
          title: 'Downgrade to Content Vault?',
          description: (<>Downgrade <strong>{userEmail}</strong> to Content Vault? This will cancel their current subscription.</>),
          buttonText: 'Downgrade to Vault',
        };
      case 'downgrade_to_pro':
        return {
          title: 'Downgrade to Pro?',
          description: (<>Downgrade <strong>{userEmail}</strong> from Advanced to Pro? This will cancel their current subscription and grant Pro access.</>),
          buttonText: 'Downgrade to Pro',
        };
      case 'cancel':
        return {
          title: 'Cancel Subscription?',
          description: (<>Cancel the subscription for <strong>{userEmail}</strong>? They will revert to Free tier.</>),
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
          <Button variant="outline" size="sm" disabled={loading || disabled} className="gap-1">
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
              <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'grant_content_vault' })} className="text-green-600 focus:text-green-600">
                <Package className="h-4 w-4 mr-2" />Grant Vault Access
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'grant_pro' })} className="text-amber-600 focus:text-amber-600">
                <Crown className="h-4 w-4 mr-2" />Grant Pro Access
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'grant_advanced' })} className="text-purple-600 focus:text-purple-600">
                <Zap className="h-4 w-4 mr-2" />Grant Advanced Access
              </DropdownMenuItem>
            </>
          )}
          {currentTier === 'content_vault' && (
            <>
              <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'upgrade_to_pro' })} className="text-amber-600 focus:text-amber-600">
                <Crown className="h-4 w-4 mr-2" />Upgrade to Pro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'upgrade_to_advanced' })} className="text-purple-600 focus:text-purple-600">
                <Zap className="h-4 w-4 mr-2" />Upgrade to Advanced
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'cancel' })} className="text-destructive focus:text-destructive">
                <X className="h-4 w-4 mr-2" />Cancel Subscription
              </DropdownMenuItem>
            </>
          )}
          {currentTier === 'pro' && (
            <>
              <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'upgrade_to_advanced' })} className="text-purple-600 focus:text-purple-600">
                <Zap className="h-4 w-4 mr-2" />Upgrade to Advanced
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'downgrade_to_vault' })} className="text-green-600 focus:text-green-600">
                <Package className="h-4 w-4 mr-2" />Downgrade to Vault
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'cancel' })} className="text-destructive focus:text-destructive">
                <X className="h-4 w-4 mr-2" />Cancel Subscription
              </DropdownMenuItem>
            </>
          )}
          {currentTier === 'advanced' && (
            <>
              <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'downgrade_to_pro' })} className="text-amber-600 focus:text-amber-600">
                <Crown className="h-4 w-4 mr-2" />Downgrade to Pro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'downgrade_to_vault' })} className="text-green-600 focus:text-green-600">
                <Package className="h-4 w-4 mr-2" />Downgrade to Vault
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, action: 'cancel' })} className="text-destructive focus:text-destructive">
                <X className="h-4 w-4 mr-2" />Cancel Subscription
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

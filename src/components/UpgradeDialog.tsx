import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

const proFeatures = [
  "Unlimited projects",
  "Full funnel branding tools",
  "Sales copy & messaging builders",
  "Social media posting",
  "Project board & execution tools",
  "Priority support",
];

export const UpgradeDialog = ({ open, onOpenChange, feature }: UpgradeDialogProps) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleUpgrade = async () => {
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
          <DialogDescription>
            {feature 
              ? `${feature} is a Pro feature. Upgrade to unlock it and more!`
              : "Unlock all features and take your launches to the next level."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-foreground">$20</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <ul className="space-y-2">
            {proFeatures.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleUpgrade} disabled={isCheckingOut} className="w-full">
            {isCheckingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Upgrade Now <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, ArrowRight } from "lucide-react";
import { useCheckoutEntry } from "@/hooks/useCheckoutEntry";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  // Retained for backward compat with callers passing 'advanced' before the
  // 3-tier consolidation. Both values now route to the Pro upsell.
  targetTier?: 'pro' | 'advanced';
}

const proFeatures = [
  "Unlimited projects",
  "Unlimited AI content ideas",
  "Unlimited saved drafts",
  "Full sales copy builder",
  "Multiple offers per sales page",
  "Relaunch mode",
  "Insights & analytics",
  "Export phase snapshot",
  "Content Vault access",
  "Social media scheduling",
  "Cross-project content visibility",
  "Campaigns manager",
  "Social Planner",
  "AI Studio",
  "Marketing Analytics",
  "Priority support",
];

export const UpgradeDialog = ({ open, onOpenChange, feature }: UpgradeDialogProps) => {
  const { goToCheckout } = useCheckoutEntry();

  const handleUpgrade = () => {
    onOpenChange(false);
    goToCheckout({ tier: 'pro' });
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
              ? `${feature} is a Pro feature. Upgrade to unlock it and the full launch + marketing suite.`
              : "Unlock every feature — projects, AI, marketing, the full launch suite — at one price."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pricing Display */}
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold text-foreground">$49</span>
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
          <Button onClick={handleUpgrade} className="w-full">
            Upgrade Now <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

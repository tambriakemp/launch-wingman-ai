import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, ArrowRight } from "lucide-react";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
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
  "Priority support",
];

const advancedFeatures = [
  "Everything in Pro",
  "Campaigns manager",
  "Social Planner",
  "Ideas Bank",
  "AI Studio",
  "Marketing Analytics",
  "Advanced marketing tools",
];

export const UpgradeDialog = ({ open, onOpenChange, feature, targetTier = 'pro' }: UpgradeDialogProps) => {
  const navigate = useNavigate();

  const isAdvanced = targetTier === 'advanced';
  const features = isAdvanced ? advancedFeatures : proFeatures;
  const price = isAdvanced ? 49 : 25;
  const tierName = isAdvanced ? 'Advanced' : 'Pro';
  const checkoutLink = isAdvanced ? '/checkout?tier=advanced' : '/checkout?upgrade=true';

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate(checkoutLink);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Upgrade to {tierName}</DialogTitle>
          <DialogDescription>
            {feature 
              ? `${feature} is ${isAdvanced ? 'an Advanced' : 'a Pro'} feature. Upgrade to unlock it and more!`
              : `Unlock all ${isAdvanced ? 'marketing tools and ' : ''}features and take your launches to the next level.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Pricing Display */}
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold text-foreground">${price}</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <ul className="space-y-2">
            {features.map((item, i) => (
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

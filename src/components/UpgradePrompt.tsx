import { useState } from "react";
import { Crown, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeDialog } from "./UpgradeDialog";
import { FEATURE_DISPLAY_NAMES, FeatureKey } from "@/hooks/useFeatureAccess";

interface UpgradePromptProps {
  feature: FeatureKey;
  variant?: "inline" | "card" | "banner";
  className?: string;
}

export const UpgradePrompt = ({ feature, variant = "inline", className = "" }: UpgradePromptProps) => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const featureName = FEATURE_DISPLAY_NAMES[feature];

  if (variant === "banner") {
    return (
      <>
        <div className={`bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between gap-4 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Crown className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{featureName} is a Pro feature</p>
              <p className="text-sm text-muted-foreground">Upgrade to unlock this and more</p>
            </div>
          </div>
          <Button onClick={() => setShowUpgrade(true)} size="sm">
            Upgrade <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} feature={featureName} />
      </>
    );
  }

  if (variant === "card") {
    return (
      <>
        <div className={`bg-card border border-border rounded-xl p-6 text-center ${className}`}>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Pro Feature</h3>
          <p className="text-muted-foreground mb-4">
            {featureName} is available on the Pro plan. Upgrade to unlock all features.
          </p>
          <Button onClick={() => setShowUpgrade(true)} className="w-full">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
        <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} feature={featureName} />
      </>
    );
  }

  // Inline variant (default)
  return (
    <>
      <button 
        onClick={() => setShowUpgrade(true)}
        className={`inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors ${className}`}
      >
        <Crown className="w-3.5 h-3.5" />
        <span>Upgrade to unlock</span>
      </button>
      <UpgradeDialog open={showUpgrade} onOpenChange={setShowUpgrade} feature={featureName} />
    </>
  );
};

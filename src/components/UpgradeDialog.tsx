import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Check, Loader2, ArrowRight, Tag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

interface CouponInfo {
  coupon_id: string;
  name: string;
  percent_off: number | null;
  amount_off: number | null;
  duration: string;
  duration_in_months: number | null;
  discount_description: string;
  discounted_price: number;
  original_price: number;
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

export const UpgradeDialog = ({ open, onOpenChange, feature }: UpgradeDialogProps) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null);
  const [promoError, setPromoError] = useState("");

  const handleValidateCoupon = async () => {
    if (!promoCode.trim()) return;
    
    setIsValidating(true);
    setPromoError("");
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { coupon_code: promoCode.trim().toUpperCase() }
      });
      
      if (error) throw error;
      
      if (data?.valid) {
        setAppliedCoupon(data as CouponInfo);
        toast.success("Coupon applied!");
      } else {
        setPromoError(data?.error || "Invalid coupon code");
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      setPromoError("Failed to validate coupon");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setPromoCode("");
    setPromoError("");
  };

  const handleUpgrade = async () => {
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: appliedCoupon ? { coupon_code: appliedCoupon.coupon_id } : undefined
      });
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setShowPromoInput(false);
      setPromoCode("");
      setPromoError("");
      setAppliedCoupon(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          {/* Pricing Display */}
          <div className="flex items-baseline justify-center gap-2">
            {appliedCoupon ? (
              <>
                <span className="text-2xl text-muted-foreground line-through">$25</span>
                <span className="text-4xl font-bold text-foreground">
                  ${appliedCoupon.discounted_price.toFixed(2)}
                </span>
                <span className="text-muted-foreground">/month</span>
              </>
            ) : (
              <>
                <span className="text-4xl font-bold text-foreground">$25</span>
                <span className="text-muted-foreground">/month</span>
              </>
            )}
          </div>

          {/* Applied Coupon Badge */}
          {appliedCoupon && (
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                <Tag className="w-3.5 h-3.5" />
                {appliedCoupon.discount_description}
                <button 
                  onClick={handleRemoveCoupon}
                  className="ml-1 hover:text-accent/70"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            </div>
          )}

          {/* Promo Code Section */}
          {!appliedCoupon && (
            <div className="space-y-2">
              {!showPromoInput ? (
                <button
                  onClick={() => setShowPromoInput(true)}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto transition-colors"
                >
                  <Tag className="w-3.5 h-3.5" />
                  Have a promo code?
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError("");
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                      className="uppercase"
                    />
                    <Button 
                      onClick={handleValidateCoupon}
                      disabled={isValidating || !promoCode.trim()}
                      variant="outline"
                    >
                      {isValidating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                  {promoError && (
                    <p className="text-sm text-destructive text-center">{promoError}</p>
                  )}
                </div>
              )}
            </div>
          )}

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
          <Button variant="ghost" onClick={() => handleOpenChange(false)} className="w-full">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

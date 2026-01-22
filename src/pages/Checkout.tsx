import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Check, 
  Loader2, 
  ArrowLeft, 
  Shield, 
  CreditCard,
  Sparkles,
  Tag,
  X,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight
} from "lucide-react";
import { z } from "zod";

// Validation schemas
const newUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const upgradeSchema = z.object({
  // No fields needed for upgrade - user is already authenticated
});

interface CouponInfo {
  coupon_id: string;
  name: string;
  percent_off: number | null;
  amount_off: number | null;
  discount_description: string;
  discounted_price: number;
  original_price: number;
}

const proFeatures = [
  "Unlimited projects",
  "Unlimited AI content ideas",
  "Full sales copy builder",
  "Social media scheduling",
  "Relaunch mode",
  "Insights & analytics",
  "Content Vault access",
  "Priority support",
];

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isUpgrade = searchParams.get("upgrade") === "true" || !!user;
  
  // Form state
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  // Coupon state
  const [promoCode, setPromoCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null);
  const [promoError, setPromoError] = useState("");
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Pre-fill name from profile if upgrading
  useEffect(() => {
    if (isUpgrade && user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
        }
      };
      fetchProfile();
    }
  }, [isUpgrade, user]);

  const handleValidateCoupon = async () => {
    if (!promoCode.trim()) return;
    
    setIsValidatingCoupon(true);
    setPromoError("");
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-surecart-coupon', {
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
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setPromoCode("");
    setPromoError("");
  };

  const validateForm = (): boolean => {
    try {
      if (isUpgrade) {
        upgradeSchema.parse({});
      } else {
        newUserSchema.parse({
          email,
          firstName,
          lastName,
        });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setIsProcessing(true);

    try {
      // For upgrade, use the user's email; for new users, use the form email
      const checkoutEmail = isUpgrade ? user?.email : email;
      
      if (!checkoutEmail) {
        toast.error("Email is required");
        setIsProcessing(false);
        return;
      }

      // Call edge function to create hosted checkout session
      const { data, error } = await supabase.functions.invoke('surecart-create-checkout', {
        body: {
          email: checkoutEmail,
          firstName: firstName || user?.user_metadata?.first_name || '',
          lastName: lastName || user?.user_metadata?.last_name || '',
          couponCode: appliedCoupon?.coupon_id,
          isUpgrade,
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Failed to create checkout");
      }

      if (!data.checkout_url) {
        throw new Error("Checkout URL not returned");
      }

      // Redirect to SureCart hosted checkout
      window.location.href = data.checkout_url;

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout. Please try again.");
      setIsProcessing(false);
    }
  };

  const displayPrice = appliedCoupon ? appliedCoupon.discounted_price : 25;

  return (
    <div className="min-h-screen bg-background">
      {/* Back link */}
      <div className="absolute top-4 left-4 z-10">
        <Link
          to={isUpgrade ? "/settings" : "/pricing"}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left Panel - Order Summary */}
        <div className="gradient-hero p-8 lg:p-16 flex flex-col justify-center text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-md mx-auto lg:mx-0"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary-foreground/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">Launchely</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              {isUpgrade ? "Upgrade to Pro" : "Complete Your Order"}
            </h1>
            
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-6 mb-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">Pro Plan</h2>
                  <p className="text-primary-foreground/70 text-sm">Billed monthly</p>
                </div>
                <div className="text-right">
                  {appliedCoupon ? (
                    <>
                      <span className="text-lg line-through opacity-60">${appliedCoupon.original_price}</span>
                      <div className="text-2xl font-bold">${displayPrice.toFixed(2)}<span className="text-sm font-normal">/mo</span></div>
                    </>
                  ) : (
                    <div className="text-2xl font-bold">$25<span className="text-sm font-normal">/mo</span></div>
                  )}
                </div>
              </div>

              {appliedCoupon && (
                <div className="flex items-center gap-2 text-sm bg-accent/20 text-accent-foreground px-3 py-2 rounded-lg mb-4">
                  <Tag className="w-4 h-4" />
                  <span>{appliedCoupon.discount_description}</span>
                </div>
              )}

              <ul className="space-y-3">
                {proFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-primary-foreground/90">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <Shield className="w-4 h-4" />
              <span>Secure checkout powered by 256-bit encryption</span>
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Form */}
        <div className="p-8 lg:p-16 flex items-center justify-center bg-card">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-md"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Fields - Only for new users */}
              {!isUpgrade && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Your Information
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                      />
                      {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                      />
                      {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="pl-10"
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                </div>
              )}

              {/* Upgrade greeting for existing users */}
              {isUpgrade && (
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Upgrading as <span className="font-medium text-foreground">{user?.email}</span>
                  </p>
                </div>
              )}

              {/* Payment Info Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment
                </h2>

                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    You'll enter your card details on the next page
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Secure checkout powered by SureCart</span>
                  </div>
                </div>
              </div>

              {/* Promo Code Section */}
              <div className="space-y-2">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError("");
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleValidateCoupon())}
                      className="uppercase"
                    />
                    <Button 
                      type="button"
                      onClick={handleValidateCoupon}
                      disabled={isValidatingCoupon || !promoCode.trim()}
                      variant="outline"
                    >
                      {isValidatingCoupon ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-accent/10 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">{appliedCoupon.discount_description}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-sm text-destructive">{promoError}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting to payment...
                  </>
                ) : (
                  <>
                    Continue to Payment - ${displayPrice.toFixed(2)}/month
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By subscribing, you agree to our{" "}
                <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>
                {" "}and{" "}
                <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
                Cancel anytime.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

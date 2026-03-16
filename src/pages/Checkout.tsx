import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { stripePromise } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { 
  Check, 
  Loader2, 
  ArrowLeft, 
  Shield, 
  CreditCard,
  Sparkles,
  Tag,
  X,
  Mail,
  User,
  Eye,
  EyeOff,
  KeyRound
} from "lucide-react";
import { z } from "zod";

// Validation schemas
const newUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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

const contentVaultFeatures = [
  "Content Vault access",
  "Organize your launch assets",
  "Template library",
  "Resource downloads",
];

// Plan configuration
const PLAN_CONFIG = {
  content_vault: {
    name: "Content Vault",
    price: 7,
    features: contentVaultFeatures,
    headline: "Get Content Vault Access",
    upgradeHeadline: "Upgrade to Content Vault",
  },
  pro: {
    name: "Pro Plan",
    price: 25,
    features: proFeatures,
    headline: "Start Your Pro Journey",
    upgradeHeadline: "Upgrade to Pro",
  },
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isUpgrade = searchParams.get("upgrade") === "true" || !!user;
  
  // Determine which tier to checkout
  const tierParam = searchParams.get("tier");
  const selectedTier = tierParam === 'content_vault' ? 'content_vault' : 'pro';
  const planConfig = PLAN_CONFIG[selectedTier];
  
  // Form state
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Email existence check state
  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  
  // Coupon state
  const [promoCode, setPromoCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null);
  const [promoError, setPromoError] = useState("");
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Payment intent state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
   const [isCreatingIntent, setIsCreatingIntent] = useState(false);
   const isCreatingIntentRef = useRef(false);
  const [intentError, setIntentError] = useState<string | null>(null);

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

  // Create payment intent immediately on page load
  const createPaymentIntent = useCallback(async (couponCode?: string) => {
    if (isCreatingIntent) return;
    
    setIsCreatingIntent(true);
    setIntentError(null);

    try {
      console.log("[Checkout] Creating payment intent on mount...", { tier: selectedTier });
      const { data, error } = await supabase.functions.invoke('create-payment-intent-only', {
        body: { couponCode, tier: selectedTier }
      });

      if (error) {
        console.error("[Checkout] Intent creation error:", error);
        throw new Error(error.message);
      }

      if (!data?.success || !data?.clientSecret) {
        throw new Error(data?.error || "Failed to initialize payment");
      }

      // Handle free subscription (100% discount coupon)
      if (data.clientSecret === "free_subscription") {
        console.log("[Checkout] Free subscription detected");
        setClientSecret("free_subscription");
        return;
      }

      console.log("[Checkout] Payment intent created successfully");
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (err) {
      console.error("[Checkout] Error creating payment intent:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to initialize payment";
      setIntentError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsCreatingIntent(false);
    }
  }, [isCreatingIntent]);

  // Create payment intent on page load
  useEffect(() => {
    if (!clientSecret && !isCreatingIntent && !intentError) {
      createPaymentIntent(appliedCoupon?.coupon_id);
    }
  }, []); // Run once on mount

  const handleValidateCoupon = async () => {
    if (!promoCode.trim()) return;
    
    setIsValidatingCoupon(true);
    setPromoError("");
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { coupon_code: promoCode.trim(), tier: selectedTier }
      });
      
      if (error) throw error;
      
      if (data?.valid) {
        setAppliedCoupon(data as CouponInfo);
        toast.success("Coupon applied!");
        // Reset clientSecret and recreate with new coupon
        setClientSecret(null);
        setPaymentIntentId(null);
        createPaymentIntent(data.coupon_id);
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
    // Reset clientSecret and recreate without coupon
    setClientSecret(null);
    setPaymentIntentId(null);
    createPaymentIntent();
  };

  // Check if email already exists (for new users only)
  const checkEmailExists = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || isUpgrade) {
      setEmailExists(false);
      return;
    }
    
    // Basic email validation before checking
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToCheck)) {
      return;
    }
    
    setIsCheckingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-email-exists', {
        body: { email: emailToCheck }
      });
      
      if (error) {
        console.error("Email check error:", error);
        return;
      }
      
      setEmailExists(data?.exists || false);
    } catch (err) {
      console.error("Email check error:", err);
    } finally {
      setIsCheckingEmail(false);
    }
  }, [isUpgrade]);

  const validateForm = useCallback((): boolean => {
    // Check if email exists (for new users only)
    if (!isUpgrade && emailExists) {
      toast.error("An account with this email already exists. Please log in instead.");
      return false;
    }
    
    try {
      if (isUpgrade) {
        // No validation needed for upgrade - user is already authenticated
        setErrors({});
        return true;
      } else {
        newUserSchema.parse({
          email,
          firstName,
          lastName,
          password,
          confirmPassword,
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
  }, [isUpgrade, email, firstName, lastName, password, confirmPassword, emailExists]);

  const handlePaymentSuccess = async () => {
    // After payment succeeds, complete the subscription checkout
    try {
      console.log("[Checkout] Payment succeeded, completing checkout...");
      
      // Handle free subscription
      if (clientSecret === "free_subscription") {
        navigate("/checkout/success");
        return;
      }

      const { data, error } = await supabase.functions.invoke('complete-subscription-checkout', {
        body: {
          paymentIntentId,
          email: isUpgrade ? user?.email : email,
          firstName,
          lastName,
          password: isUpgrade ? undefined : password,
          couponCode: appliedCoupon?.coupon_id,
          isUpgrade,
          userId: user?.id,
        }
      });

      if (error || !data?.success) {
        let errorMessage = "Failed to complete subscription";
        if (error?.message) errorMessage = error.message;
        if (data?.error) errorMessage = data.error;
        
        // Check for existing account error
        if (errorMessage.toLowerCase().includes("already exists")) {
          setIntentError("account_exists");
          toast.error("An account with this email already exists. Please log in instead.");
          return;
        }
        
        throw new Error(errorMessage);
      }

      console.log("[Checkout] Subscription completed successfully");
      navigate("/checkout/success");
    } catch (err) {
      console.error("[Checkout] Error completing checkout:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to complete subscription";
      toast.error(errorMsg);
    }
  };

  const displayPrice = appliedCoupon ? appliedCoupon.discounted_price : planConfig.price;

  // Stripe Elements options - only create when we have clientSecret
  const elementsOptions = useMemo(() => {
    if (!clientSecret || clientSecret === "free_subscription") return null;
    
    return {
      clientSecret,
      appearance: {
        theme: 'stripe' as const,
        variables: {
          colorPrimary: 'hsl(174, 100%, 29%)',
          colorBackground: 'hsl(0, 0%, 100%)',
          colorText: 'hsl(240, 10%, 3.9%)',
          colorDanger: 'hsl(0, 84.2%, 60.2%)',
          fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
          borderRadius: '8px',
        },
      },
    };
  }, [clientSecret]);

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
              {isUpgrade ? planConfig.upgradeHeadline : planConfig.headline}
            </h1>
            
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-6 mb-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{planConfig.name}</h2>
                  <p className="text-primary-foreground/70 text-sm">Billed monthly</p>
                </div>
                <div className="text-right">
                  {appliedCoupon ? (
                    <>
                      <span className="text-lg line-through opacity-60">${appliedCoupon.original_price}</span>
                      <div className="text-2xl font-bold">${displayPrice.toFixed(2)}<span className="text-sm font-normal">/mo</span></div>
                    </>
                  ) : (
                    <div className="text-2xl font-bold">${planConfig.price}<span className="text-sm font-normal">/mo</span></div>
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
                {planConfig.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-primary-foreground/90">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <Shield className="w-4 h-4" />
              <span>Secure checkout powered by Stripe</span>
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
            <div className="space-y-6">
              {/* Account Fields - Only for new users */}
              {!isUpgrade && (
                <form onSubmit={(e) => e.preventDefault()} autoComplete="on" className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Create Your Account
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="given-name"
                        autoComplete="given-name"
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
                        name="family-name"
                        autoComplete="family-name"
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
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailExists(false); // Reset on change
                        }}
                        onBlur={() => checkEmailExists(email)}
                        placeholder="you@example.com"
                        className="pl-10"
                      />
                      {isCheckingEmail && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                      )}
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    {emailExists && (
                      <div className="text-sm text-destructive flex items-center gap-2">
                        <span>This email already has an account.</span>
                        <Link to="/auth" className="underline hover:text-destructive/80 font-medium">
                          Log in instead
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="new-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirm-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>
                </form>
              )}

              {/* Upgrade greeting for existing users */}
              {isUpgrade && (
                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    Upgrading as <span className="font-medium text-foreground">{user?.email}</span>
                  </p>
                </div>
              )}

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

              {/* Payment Section - Always visible */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </h2>

                {!stripePromise ? (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                    <p className="text-sm text-destructive">
                      Stripe is not configured. Please check your environment settings.
                    </p>
                  </div>
                ) : clientSecret === "free_subscription" ? (
                  <div className="text-center space-y-4 py-6">
                    <p className="text-sm text-muted-foreground">
                      🎉 Your coupon covers the full subscription cost!
                    </p>
                    <Button onClick={handlePaymentSuccess} className="w-full">
                      Activate Free Subscription
                    </Button>
                  </div>
                ) : intentError === "account_exists" ? (
                  <div className="text-center space-y-3 py-6">
                    <p className="text-sm text-destructive">
                      An account with this email already exists.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Link to="/auth">
                        <Button variant="default" size="sm" className="w-full">
                          Log in instead
                        </Button>
                      </Link>
                      <Button 
                        onClick={() => {
                          setEmail("");
                          setIntentError(null);
                        }} 
                        variant="outline" 
                        size="sm"
                      >
                        Use a different email
                      </Button>
                    </div>
                  </div>
                ) : intentError ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-destructive mb-3">{intentError}</p>
                    <Button onClick={() => createPaymentIntent(appliedCoupon?.coupon_id)} variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                ) : clientSecret && elementsOptions ? (
                  <Elements stripe={stripePromise} options={elementsOptions}>
                    <CheckoutForm 
                      displayPrice={displayPrice}
                      onSuccess={handlePaymentSuccess}
                      validateForm={validateForm}
                    />
                  </Elements>
                ) : (
                  /* Loading/Skeleton state for payment fields */
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="space-y-3">
                        {/* Card number skeleton */}
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                          <div className="h-10 bg-muted rounded animate-pulse" />
                        </div>
                        {/* Expiry and CVC skeleton */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                            <div className="h-10 bg-muted rounded animate-pulse" />
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                            <div className="h-10 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {isCreatingIntent && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Preparing payment form...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                By subscribing, you agree to our{" "}
                <Link to="/terms" className="underline hover:text-foreground">Terms of Service</Link>
                {" "}and{" "}
                <Link to="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
                Cancel anytime.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

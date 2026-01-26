import { useState, useEffect, useMemo, useCallback } from "react";
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

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isUpgrade = searchParams.get("upgrade") === "true" || !!user;
  
  // Form state
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Coupon state
  const [promoCode, setPromoCode] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null);
  const [promoError, setPromoError] = useState("");
  
  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Payment intent state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
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

  const handleValidateCoupon = async () => {
    if (!promoCode.trim()) return;
    
    setIsValidatingCoupon(true);
    setPromoError("");
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { coupon_code: promoCode.trim().toUpperCase() }
      });
      
      if (error) throw error;
      
      if (data?.valid) {
        setAppliedCoupon(data as CouponInfo);
        toast.success("Coupon applied!");
        // Reset clientSecret so intent is recreated with new price
        setClientSecret(null);
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
    // Reset clientSecret so intent is recreated with original price
    setClientSecret(null);
  };

  const validateForm = useCallback((): boolean => {
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
  }, [isUpgrade, email, firstName, lastName, password, confirmPassword]);

  // Create subscription intent when form is valid
  const createSubscriptionIntent = useCallback(async () => {
    // Don't create if already have a valid clientSecret
    if (clientSecret) return;
    
    // Validate form first
    if (!validateForm()) {
      return;
    }

    setIsCreatingIntent(true);
    setIntentError(null);

    try {
      console.log("[Checkout] Creating subscription intent...");
      const { data, error } = await supabase.functions.invoke('create-subscription-intent', {
        body: {
          email: isUpgrade ? user?.email : email,
          firstName,
          lastName,
          password: isUpgrade ? undefined : password,
          couponCode: appliedCoupon?.coupon_id,
          isUpgrade,
          userId: user?.id,
        }
      });

      // Extract error message - supabase-js puts response body in error.context for non-2xx
      let errorMessage = "Failed to initialize payment";
      
      if (error) {
        errorMessage = error.message;
        
        // Try to get the actual response body from FunctionsHttpError
        try {
          const errorContext = error as any;
          if (errorContext.context && typeof errorContext.context.json === 'function') {
            const responseBody = await errorContext.context.json();
            if (responseBody?.error) {
              errorMessage = responseBody.error;
            }
          }
        } catch {
          // Ignore JSON parsing errors
        }
      }
      
      // Also check if data has an error (in case it was returned despite non-2xx)
      if (data?.error) {
        errorMessage = data.error;
      }
      
      if (error || !data?.success || !data?.clientSecret) {
        console.error("[Checkout] Intent creation failed:", errorMessage);
        
        // Check if this is an "account exists" error
        if (errorMessage.toLowerCase().includes("already exists") || errorMessage.toLowerCase().includes("log in")) {
          setIntentError("account_exists");
        } else {
          setIntentError(errorMessage);
        }
        toast.error(errorMessage);
        return;
      }

      // Handle free subscription (100% discount coupon)
      if (data.clientSecret === "free_subscription") {
        console.log("[Checkout] Free subscription - no payment required");
        toast.success("Subscription activated!");
        navigate("/projects?checkout=success");
        return;
      }

      console.log("[Checkout] Intent created successfully");
      setClientSecret(data.clientSecret);
    } catch (err) {
      console.error("[Checkout] Error creating intent:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to initialize payment";
      setIntentError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsCreatingIntent(false);
    }
  }, [clientSecret, validateForm, isUpgrade, user, email, firstName, lastName, password, appliedCoupon]);

  // Check if form fields are valid enough to create intent
  const isBasicFormValid = useMemo(() => {
    if (isUpgrade) {
      return !!firstName && !!lastName;
    }
    // For new users, need name, valid email, and matching passwords
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordsMatch = password.length >= 8 && password === confirmPassword;
    return !!firstName && !!lastName && emailValid && passwordsMatch;
  }, [isUpgrade, firstName, lastName, email, password, confirmPassword]);

  // Auto-create intent when form becomes valid (debounced)
  useEffect(() => {
    if (!isBasicFormValid || clientSecret || isCreatingIntent || intentError) {
      return;
    }

    const timer = setTimeout(() => {
      console.log("[Checkout] Auto-creating intent - form is valid");
      createSubscriptionIntent();
    }, 800); // Debounce to avoid rapid API calls

    return () => clearTimeout(timer);
  }, [isBasicFormValid, clientSecret, isCreatingIntent, intentError, createSubscriptionIntent]);

  const handlePaymentSuccess = () => {
    navigate("/checkout/success");
  };

  const displayPrice = appliedCoupon ? appliedCoupon.discounted_price : 25;


  // Stripe Elements options - only create when we have clientSecret
  const elementsOptions = useMemo(() => {
    if (!clientSecret) return null;
    
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
              {isUpgrade ? "Upgrade to Pro" : "Start Your Pro Journey"}
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
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Create Your Account
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setClientSecret(null); // Reset intent on change
                        }}
                        placeholder="John"
                      />
                      {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setClientSecret(null); // Reset intent on change
                        }}
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
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setClientSecret(null); // Reset intent on change
                        }}
                        placeholder="you@example.com"
                        className="pl-10"
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setClientSecret(null); // Reset intent on change
                        }}
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
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setClientSecret(null); // Reset intent on change
                        }}
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
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
                    <Button onClick={createSubscriptionIntent} variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                ) : clientSecret && elementsOptions ? (
                  <Elements stripe={stripePromise} options={elementsOptions}>
                    <CheckoutForm 
                      displayPrice={displayPrice}
                      onSuccess={handlePaymentSuccess}
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
                    {!isCreatingIntent && !isBasicFormValid && (
                      <p className="text-sm text-center text-muted-foreground">
                        Complete the form above to enable payment
                      </p>
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

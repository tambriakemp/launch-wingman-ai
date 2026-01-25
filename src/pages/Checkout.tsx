import { useState, useEffect, useMemo } from "react";
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
        toast.error("Please fix the form errors");
      }
      return false;
    }
  };

  const handlePaymentSuccess = () => {
    navigate("/checkout/success");
  };

  const displayPrice = appliedCoupon ? appliedCoupon.discounted_price : 25;

  // Stripe Elements options - memoized to prevent unnecessary re-renders
  const elementsOptions = useMemo(() => ({
    mode: 'subscription' as const,
    amount: Math.round(displayPrice * 100),
    currency: 'usd',
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
  }), [displayPrice]);

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

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
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
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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

                {stripePromise ? (
                  <Elements
                    stripe={stripePromise}
                    options={elementsOptions}
                  >
                    <CheckoutForm 
                      displayPrice={displayPrice} 
                      email={isUpgrade ? (user?.email || "") : email}
                      firstName={firstName}
                      lastName={lastName}
                      password={password}
                      couponCode={appliedCoupon?.coupon_id}
                      isUpgrade={isUpgrade}
                      userId={user?.id}
                      validateForm={validateForm}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                ) : (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                    <p className="text-sm text-destructive">
                      Stripe is not configured. Please check your environment settings.
                    </p>
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

import { useState, useEffect, useRef } from "react";
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
  AlertTriangle,
  RefreshCw,
  XCircle
} from "lucide-react";
import { z } from "zod";

const SURECART_COMPONENTS_SRC = "https://cdn.jsdelivr.net/npm/@surecart/components/dist/surecart/surecart.esm.js";

// Validation schemas
const newUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sc-payment-method': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'processor-id'?: string;
      }, HTMLElement>;
    }
  }
}

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session, checkSubscription } = useAuth();
  const isUpgrade = searchParams.get("upgrade") === "true" || !!user;

  const getSureCartScript = () => {
    if (typeof document === "undefined") return null;
    return document.querySelector(
      `script[src="${SURECART_COMPONENTS_SRC}"]`
    ) as HTMLScriptElement | null;
  };

  const logSureCartDiagnostics = (
    label: string,
    currentStoreId?: string,
    extra?: Record<string, unknown>
  ) => {
    try {
      const script = getSureCartScript();
      const hasWindow = typeof window !== "undefined";
      const hasSureCartGlobal = hasWindow && !!(window as any).SureCart;
      const sureCartKeys = hasSureCartGlobal
        ? Object.keys((window as any).SureCart).slice(0, 25)
        : [];

      const ceDefined =
        typeof customElements !== "undefined" &&
        !!customElements.get("sc-payment-method");
      const ceCtor =
        typeof customElements !== "undefined"
          ? customElements.get("sc-payment-method")
          : undefined;

      const perfEntries =
        typeof performance !== "undefined"
          ? performance.getEntriesByName(SURECART_COMPONENTS_SRC)
          : [];
      const perfLast = (perfEntries[perfEntries.length - 1] ||
        null) as PerformanceResourceTiming | null;

      const scriptInfo = script
        ? {
            src: script.src,
            type: script.type,
            async: script.async,
            defer: script.defer,
            crossOrigin: script.crossOrigin || undefined,
            referrerPolicy: script.referrerPolicy || undefined,
          }
        : null;

      const resourceTiming = perfLast
        ? {
            initiatorType: perfLast.initiatorType,
            durationMs: Math.round(perfLast.duration),
            transferSize: perfLast.transferSize,
            encodedBodySize: perfLast.encodedBodySize,
            decodedBodySize: perfLast.decodedBodySize,
            nextHopProtocol: (perfLast as any).nextHopProtocol,
          }
        : null;

      console.groupCollapsed(`[Checkout] SureCart diagnostics: ${label}`);
      console.log({
        href: hasWindow ? window.location.href : "n/a",
        origin: hasWindow ? window.location.origin : "n/a",
        isSecureContext: hasWindow ? window.isSecureContext : undefined,
        readyState: typeof document !== "undefined" ? document.readyState : "n/a",
        storeId: currentStoreId,
        script: scriptInfo,
        resourceTiming,
        hasSureCartGlobal,
        sureCartGlobalKeys: sureCartKeys,
        customElementDefined: ceDefined,
        customElementCtorName: (ceCtor as any)?.name,
        ...extra,
      });
      console.groupEnd();
    } catch (e) {
      console.warn("[Checkout] SureCart diagnostics failed", e);
    }
  };
  
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
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Payment loading state
  const [paymentState, setPaymentState] = useState<'loading' | 'ready' | 'error' | 'timeout'>('loading');
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  
  // Ref for the payment element
  const paymentRef = useRef<HTMLElement | null>(null);

  // Attach resource-load diagnostics for the SureCart components script
  useEffect(() => {
    logSureCartDiagnostics("mount");

    const script = getSureCartScript();
    if (!script) {
      console.warn("[Checkout] SureCart script tag not found in DOM", {
        expectedSrc: SURECART_COMPONENTS_SRC,
      });
    }

    const onWindowErrorCapture = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== "SCRIPT") return;
      const src = (target as HTMLScriptElement).src;
      if (src !== SURECART_COMPONENTS_SRC) return;

      console.error("[Checkout] SureCart script failed to load (captured)", {
        src,
        event,
      });
      logSureCartDiagnostics("script_error_captured");
    };

    window.addEventListener("error", onWindowErrorCapture, true);

    let cleanupScriptListeners = () => {};
    if (script) {
      const onLoad = () => {
        console.log("[Checkout] SureCart script loaded");
        logSureCartDiagnostics("script_load");
      };
      const onError = () => {
        console.error("[Checkout] SureCart script error event fired");
        logSureCartDiagnostics("script_error_element");
      };

      script.addEventListener("load", onLoad);
      script.addEventListener("error", onError);
      cleanupScriptListeners = () => {
        script.removeEventListener("load", onLoad);
        script.removeEventListener("error", onError);
      };
    }

    return () => {
      window.removeEventListener("error", onWindowErrorCapture, true);
      cleanupScriptListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if SureCart script is loaded with timeout and error handling
  useEffect(() => {
    const TIMEOUT_MS = 15000; // 15 second timeout
    const POLL_INTERVAL_MS = 500;
    let attempts = 0;
    const maxAttempts = TIMEOUT_MS / POLL_INTERVAL_MS;
    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;

    // Accept storeId as parameter to avoid closure issues
    const checkSurecart = (currentStoreId: string) => {
      if (!isMounted) return;
      
      attempts++;
      
      // Check if SureCart global exists AND component is defined
      const hasWindow = typeof window !== 'undefined';
      const hasSureCart = hasWindow && (window as any).SureCart;
      const hasCustomElement = customElements.get('sc-payment-method');
      
      console.log('[Checkout] SureCart check:', {
        attempt: attempts,
        hasWindow,
        hasSureCart: !!hasSureCart,
        hasCustomElement: !!hasCustomElement,
        storeId: currentStoreId
      });

      if (attempts === 1 || attempts % 5 === 0) {
        logSureCartDiagnostics("poll", currentStoreId, {
          attempt: attempts,
          maxAttempts,
          hasSureCart: !!hasSureCart,
          hasCustomElement: !!hasCustomElement,
        });
      }
      
      if (hasCustomElement && currentStoreId) {
        console.log('[Checkout] SureCart ready, rendering payment element');
        setPaymentState('ready');
        return;
      }
      
      if (attempts >= maxAttempts) {
        console.log('[Checkout] SureCart timeout reached');
        logSureCartDiagnostics("timeout", currentStoreId, { attempts, maxAttempts });
        setPaymentState('timeout');
        setLoadError('Payment form took too long to load. Please check your connection and try again.');
        return;
      }
      
      timeoutId = setTimeout(() => checkSurecart(currentStoreId), POLL_INTERVAL_MS);
    };

    // Fetch store ID first, then start polling
    const init = async () => {
      if (!isMounted) return;
      
      setPaymentState('loading');
      setLoadError('');
      
      try {
        console.log('[Checkout] Fetching payment config...');
        const { data, error } = await supabase.functions.invoke('get-payment-config');
        
        if (!isMounted) return;
        
        console.log('[Checkout] Payment config response:', { data, error });

        logSureCartDiagnostics("payment_config_response", data?.store_id, {
          configured: !!data?.configured,
          hasStoreId: !!data?.store_id,
        });
        
        if (error) {
          throw new Error('Failed to load payment configuration');
        }
        
        if (!data?.configured || !data?.store_id) {
          setPaymentState('error');
          setLoadError('Payment system is not configured. Please contact support.');
          return;
        }
        
        setStoreId(data.store_id);
        // Pass store_id directly to avoid closure issue
        checkSurecart(data.store_id);
      } catch (err) {
        if (!isMounted) return;
        console.error('[Checkout] Payment config error:', err);
        logSureCartDiagnostics("payment_config_error", undefined, {
          message: err instanceof Error ? err.message : String(err),
        });
        setPaymentState('error');
        setLoadError('Unable to load payment system. Please try again later.');
      }
    };

    init();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [retryCount]);

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

  const handleRetryPayment = () => {
    setPaymentState('loading');
    setLoadError('');
    setStoreId(null);
    setRetryCount(prev => prev + 1);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setIsProcessing(true);

    try {
      // Get payment method from SureCart element
      const paymentElement = document.querySelector('sc-payment-method') as any;
      
      if (!paymentElement) {
        throw new Error("Payment form not loaded. Please refresh and try again.");
      }

      // Tokenize the card - this creates a payment method
      const result = await paymentElement.createPaymentMethod();
      
      if (result.error) {
        throw new Error(result.error.message || "Card validation failed");
      }

      const paymentMethodId = result.paymentMethod?.id;
      if (!paymentMethodId) {
        throw new Error("Failed to process card. Please try again.");
      }

      // Call our edge function to process the subscription
      const { data, error } = await supabase.functions.invoke('surecart-process-subscription', {
        body: {
          email: isUpgrade ? user?.email : email,
          firstName,
          lastName,
          password: isUpgrade ? undefined : password,
          paymentMethodId,
          couponCode: appliedCoupon?.coupon_id,
          isUpgrade,
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Subscription failed");
      }

      toast.success(data.message || "Welcome to Pro!");

      // For new users, redirect to sign in
      if (data.isNewUser && data.requiresSignIn) {
        toast.info("Please sign in with your new account.");
        navigate("/auth?tab=signin&checkout=success");
        return;
      }

      // For existing users, refresh subscription status
      if (isUpgrade) {
        await checkSubscription();
      }

      // Redirect to app
      navigate("/app?checkout=success");

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
    } finally {
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

        {/* Right Panel - Payment Form */}
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
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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

              {/* Payment Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </h2>

                {/* SureCart Payment Element */}
                <div className="border border-border rounded-lg p-4 bg-background min-h-[120px]">
                  {paymentState === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mb-3" />
                      <p className="text-sm">Loading secure payment form...</p>
                      <p className="text-xs mt-1 opacity-60">This should only take a moment</p>
                    </div>
                  )}

                  {paymentState === 'ready' && storeId && (
                    <sc-payment-method 
                      ref={paymentRef as any}
                      processor-id={storeId}
                    />
                  )}

                  {paymentState === 'timeout' && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mb-3">
                        <AlertTriangle className="w-6 h-6 text-warning" />
                      </div>
                      <p className="font-medium text-foreground mb-1">Payment form didn't load</p>
                      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                        {loadError}
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleRetryPayment}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                      </Button>
                    </div>
                  )}

                  {paymentState === 'error' && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-3">
                        <XCircle className="w-6 h-6 text-destructive" />
                      </div>
                      <p className="font-medium text-foreground mb-1">Unable to load payment</p>
                      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                        {loadError}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleRetryPayment}
                          className="gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Retry
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => navigate('/pricing')}
                        >
                          Go Back
                        </Button>
                      </div>
                    </div>
                  )}
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
                disabled={isProcessing || paymentState !== 'ready'}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe - ${displayPrice.toFixed(2)}/month
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

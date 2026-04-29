import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { stripePromise } from "@/lib/stripe";
import { toast } from "sonner";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import {
  Check,
  Loader2,
  ArrowLeft,
  Lock,
  CreditCard,
  Tag,
  X,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  Star,
} from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

// Validation schemas
const newUserSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
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

type PlanId = "content_vault" | "pro" | "advanced";

interface PlanDef {
  id: PlanId;
  name: string;
  tag: string;
  price: number;
  headline: React.ReactNode;
  lede: string;
  feats: string[];
}

const PLANS: PlanDef[] = [
  {
    id: "content_vault",
    name: "Content Vault",
    tag: "Premium templates & guides",
    price: 7,
    headline: (
      <>
        Start your <em className="not-italic font-light text-terracotta italic">Vault</em> journey.
      </>
    ),
    lede: "Templates, swipes, and resources for your first launch — quietly complete.",
    feats: [
      "Everything in Free",
      "Content Vault — 200+ templates",
      "Premium swipes & guides",
      "Funnel type selection",
      "Full sales copy builder",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tag: "Everything you need to launch",
    price: 25,
    headline: (
      <>
        Start your <em className="not-italic font-light text-terracotta italic">Pro</em> journey.
      </>
    ),
    lede: "Unlimited projects, AI content, and the full launch playbook — one quiet step at a time.",
    feats: [
      "Everything in Vault",
      "Unlimited projects & drafts",
      "Unlimited AI content ideas",
      "Social media scheduling",
      "Insights & analytics",
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    tag: "Full marketing suite",
    price: 49,
    headline: (
      <>
        Start your <em className="not-italic font-light text-terracotta italic">Advanced</em> journey.
      </>
    ),
    lede: "The full marketing suite — for launches that keep growing after launch day.",
    feats: [
      "Everything in Pro",
      "Campaigns manager",
      "Social planner",
      "AI Studio — avatar video",
      "Priority support",
    ],
  },
];

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isUpgrade = searchParams.get("upgrade") === "true" || !!user;

  // Determine recommended/initial tier from URL
  const tierParam = searchParams.get("tier") as PlanId | null;
  const initialTier: PlanId =
    tierParam && PLANS.some((p) => p.id === tierParam)
      ? tierParam
      : isUpgrade
      ? "advanced"
      : "pro";

  const [selectedTier, setSelectedTier] = useState<PlanId>(initialTier);
  const recommendedTier: PlanId = "advanced";
  const planConfig = PLANS.find((p) => p.id === selectedTier)!;

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
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", user.id)
          .single();

        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
        }
      };
      fetchProfile();
    }
  }, [isUpgrade, user]);

  // Create payment intent
  const createPaymentIntent = useCallback(
    async (couponCode?: string, tier: PlanId = selectedTier) => {
      if (isCreatingIntentRef.current) return;

      isCreatingIntentRef.current = true;
      setIsCreatingIntent(true);
      setIntentError(null);

      try {
        const { data, error } = await supabase.functions.invoke(
          "create-payment-intent-only",
          {
            // Pass email + isUpgrade so the server can run pre-charge guards
            // (block existing accounts, block duplicate orphan PIs).
            body: {
              couponCode,
              tier,
              email: isUpgrade ? user?.email : email,
              isUpgrade,
            },
          }
        );

        if (error) throw new Error(error.message);
        if (!data?.success || !data?.clientSecret) {
          // Surface specific blocked-checkout codes with friendlier copy.
          if (data?.code === "account_exists") {
            setEmailExists(true);
            throw new Error(
              "An account with this email already exists. Please log in to upgrade."
            );
          }
          if (data?.code === "already_subscribed") {
            throw new Error("You already have an active subscription. Please log in.");
          }
          if (data?.code === "orphan_payment_pending") {
            throw new Error(
              "We found a recent payment from you that didn't finish setting up your subscription. Please contact support — do not pay again."
            );
          }
          throw new Error(data?.error || "Failed to initialize payment");
        }

        if (data.clientSecret === "free_subscription") {
          setClientSecret("free_subscription");
          return;
        }

        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to initialize payment";
        setIntentError(errorMsg);
        toast.error(errorMsg);
      } finally {
        isCreatingIntentRef.current = false;
        setIsCreatingIntent(false);
      }
    },
    [selectedTier, isUpgrade, user?.email, email]
  );

  // Create payment intent on initial mount
  useEffect(() => {
    if (!clientSecret && !isCreatingIntent && !intentError) {
      createPaymentIntent(appliedCoupon?.coupon_id, selectedTier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When user switches plan, recreate the payment intent
  const handlePlanChange = (newTier: PlanId) => {
    if (newTier === selectedTier) return;
    setSelectedTier(newTier);
    setClientSecret(null);
    setPaymentIntentId(null);
    setAppliedCoupon(null);
    setPromoCode("");
    setPromoError("");
    setIntentError(null);
    isCreatingIntentRef.current = false;
    // Defer to next tick so state settles, then recreate
    setTimeout(() => createPaymentIntent(undefined, newTier), 0);
  };

  const handleValidateCoupon = async () => {
    if (!promoCode.trim()) return;

    setIsValidatingCoupon(true);
    setPromoError("");

    try {
      const { data, error } = await supabase.functions.invoke("validate-coupon", {
        body: { coupon_code: promoCode.trim(), tier: selectedTier },
      });

      if (error) throw error;

      if (data?.valid) {
        setAppliedCoupon(data as CouponInfo);
        toast.success("Coupon applied!");
        setClientSecret(null);
        setPaymentIntentId(null);
        isCreatingIntentRef.current = false;
        createPaymentIntent(data.coupon_id, selectedTier);
      } else {
        setPromoError(data?.error || "Invalid coupon code");
      }
    } catch (error) {
      console.error("Coupon validation error:", error);
      setPromoError("Failed to validate coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setPromoCode("");
    setPromoError("");
    setClientSecret(null);
    setPaymentIntentId(null);
    isCreatingIntentRef.current = false;
    createPaymentIntent(undefined, selectedTier);
  };

  const checkEmailExists = useCallback(
    async (emailToCheck: string) => {
      if (!emailToCheck || isUpgrade) {
        setEmailExists(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailToCheck)) return;

      setIsCheckingEmail(true);
      try {
        const { data, error } = await supabase.functions.invoke("check-email-exists", {
          body: { email: emailToCheck },
        });
        if (error) return;
        setEmailExists(data?.exists || false);
      } catch (err) {
        console.error("Email check error:", err);
      } finally {
        setIsCheckingEmail(false);
      }
    },
    [isUpgrade]
  );

  const validateForm = useCallback((): boolean => {
    if (!isUpgrade && emailExists) {
      toast.error("An account with this email already exists. Please log in instead.");
      return false;
    }

    try {
      if (isUpgrade) {
        setErrors({});
        return true;
      } else {
        newUserSchema.parse({ email, firstName, lastName, password, confirmPassword });
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
    try {
      if (clientSecret === "free_subscription") {
        navigate("/checkout/success");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "complete-subscription-checkout",
        {
          body: {
            paymentIntentId,
            email: isUpgrade ? user?.email : email,
            firstName,
            lastName,
            password: isUpgrade ? undefined : password,
            couponCode: appliedCoupon?.coupon_id,
            isUpgrade,
            userId: user?.id,
          },
        }
      );

      if (error || !data?.success) {
        let errorMessage = "Failed to complete subscription";
        if (error?.message) errorMessage = error.message;
        if (data?.error) errorMessage = data.error;

        if (errorMessage.toLowerCase().includes("already exists")) {
          setIntentError("account_exists");
          toast.error("An account with this email already exists. Please log in instead.");
          return;
        }

        throw new Error(errorMessage);
      }

      navigate("/checkout/success");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to complete subscription";
      toast.error(errorMsg);
    }
  };

  const displayPrice = appliedCoupon ? appliedCoupon.discounted_price : planConfig.price;

  const elementsOptions = useMemo(() => {
    if (!clientSecret || clientSecret === "free_subscription") return null;

    return {
      clientSecret,
      appearance: {
        theme: "stripe" as const,
        variables: {
          colorPrimary: "hsl(13, 56%, 51%)",
          colorBackground: "hsl(0, 0%, 100%)",
          colorText: "hsl(28, 13%, 12%)",
          colorDanger: "hsl(0, 84.2%, 60.2%)",
          fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
          borderRadius: "10px",
        },
      },
    };
  }, [clientSecret]);

  return (
    <div className="min-h-screen bg-paper-100 text-ink-900 font-sans">
      {/* Back link (mobile/desktop) */}
      <div className="absolute top-4 left-4 z-20">
        <button
          type="button"
          onClick={() => {
            navigate("/");
            window.location.assign("/");
          }}
          className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>

      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* ===== LEFT: atmospheric preview ===== */}
        <aside
          className="hidden lg:block relative overflow-hidden"
          style={{
            background:
              "radial-gradient(80% 60% at 20% 10%, hsl(var(--clay-200) / 0.9) 0%, hsl(var(--clay-200) / 0) 70%), linear-gradient(160deg, hsl(var(--paper-100)) 0%, hsl(var(--clay-100)) 55%, hsl(var(--clay-200)) 100%)",
          }}
        >
          <div className="relative z-10 h-full px-14 py-12 flex flex-col gap-7">
            {/* Top: wordmark + secure chip */}
            <div className="flex items-center justify-between">
              <span className="font-display italic font-medium text-[22px] tracking-[-0.02em] text-ink-900">
                Launchely<span className="text-terracotta">.</span>
              </span>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-hairline text-[11px] text-fg-muted uppercase tracking-[0.12em] font-semibold">
                <Lock className="w-3 h-3 text-moss-500" />
                Secure checkout
              </div>
            </div>

            {/* Eyebrow + title + lede */}
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-terracotta font-semibold">
                Your quiet launch
              </div>
              <h1 className="mt-3.5 mb-1.5 font-display font-normal text-[48px] leading-[1.04] tracking-[-0.025em] text-ink-900 max-w-[14ch]">
                {planConfig.headline}
              </h1>
              <p className="mt-1 mb-7 font-display italic font-light text-[21px] leading-[1.45] text-fg-secondary max-w-[28ch]">
                {planConfig.lede}
              </p>
            </div>

            {/* Preview card */}
            <div className="bg-white border border-hairline rounded-[18px] p-7 shadow-md">
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-hairline mb-5">
                <div>
                  <h3 className="font-display font-medium text-[26px] tracking-[-0.015em] text-ink-900 m-0">
                    {planConfig.name}
                  </h3>
                  <div className="font-display italic text-[14px] text-fg-muted mt-1">
                    {planConfig.tag}
                  </div>
                </div>
                <div className="font-display font-normal text-[40px] tracking-[-0.025em] text-ink-900 leading-none whitespace-nowrap">
                  ${displayPrice}
                  <sub className="text-[14px] text-fg-muted font-normal align-baseline ml-0.5 tracking-normal">
                    /mo
                  </sub>
                </div>
              </div>
              <ul className="grid gap-2.5 m-0 p-0 list-none">
                {planConfig.feats.map((f, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[20px_1fr] gap-2.5 items-baseline text-[14px] text-ink-800 leading-relaxed"
                  >
                    <Check className="w-3.5 h-3.5 text-moss-500 mt-0.5" strokeWidth={2.5} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="mt-auto flex justify-between items-center gap-4 text-[12px] text-fg-muted">
              <div>Cancel any time · No contracts</div>
              <div className="flex gap-2.5 items-center">
                <span>Powered by</span>
                <span className="font-display font-semibold tracking-[-0.01em] text-plum-700">
                  Stripe
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ===== RIGHT: form ===== */}
        <main className="px-6 sm:px-14 pt-10 pb-20 max-w-[640px] mx-auto w-full">
          {/* Mobile wordmark */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <span className="font-display italic font-medium text-[20px] tracking-[-0.02em] text-ink-900">
              Launchely<span className="text-terracotta">.</span>
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-hairline text-[10px] text-fg-muted uppercase tracking-[0.12em] font-semibold">
              <Lock className="w-2.5 h-2.5 text-moss-500" />
              Secure
            </div>
          </div>

          {/* Header */}
          <div className="mb-7">
            <div className="text-[10.5px] uppercase tracking-[0.16em] text-fg-muted font-semibold">
              Step 1 of 1
            </div>
            <h2 className="mt-2 mb-1.5 font-display font-medium text-[26px] tracking-[-0.015em] text-ink-900">
              {isUpgrade ? "Choose your upgrade." : "Choose your plan."}
            </h2>
            <p className="m-0 text-[14px] text-fg-secondary leading-relaxed">
              You can change or cancel any time. Prices shown in USD.
            </p>
          </div>

          {/* Plan selector */}
          <div className="grid gap-2.5 mb-8">
            {PLANS.map((p) => {
              const selected = selectedTier === p.id;
              const isRec = recommendedTier === p.id;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handlePlanChange(p.id)}
                  aria-selected={selected}
                  className={cn(
                    "relative grid grid-cols-[24px_1fr_auto] gap-3.5 items-center text-left p-4 sm:px-[18px] sm:py-4 bg-white border rounded-[14px] transition-all",
                    selected
                      ? "border-ink-900 shadow-[0_0_0_3px_rgba(31,27,23,0.06)] bg-paper-50"
                      : "border-hairline hover:border-ink-300"
                  )}
                >
                  {isRec && (
                    <span className="absolute -top-[9px] right-4 inline-flex items-center gap-1 text-[9.5px] font-bold tracking-[0.14em] px-2 py-[3px] rounded-full bg-terracotta text-paper-100 uppercase">
                      <Star className="w-2.5 h-2.5" fill="currentColor" />
                      Recommended
                    </span>
                  )}
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full border-[1.5px] inline-flex items-center justify-center flex-shrink-0 transition-all",
                      selected
                        ? "border-ink-900 bg-ink-900"
                        : "border-ink-300 bg-transparent"
                    )}
                  >
                    {selected && (
                      <span className="w-2 h-2 rounded-full bg-paper-100" />
                    )}
                  </span>
                  <span>
                    <span className="flex items-baseline gap-2.5 flex-wrap">
                      <strong className="font-display font-medium text-[18px] tracking-[-0.01em] text-ink-900">
                        {p.name}
                      </strong>
                      <span className="text-[12px] text-fg-muted">{p.tag}</span>
                    </span>
                  </span>
                  <span className="font-display font-medium text-[20px] tracking-[-0.02em] text-ink-900 whitespace-nowrap">
                    ${p.price}
                    <sub className="text-[12px] text-fg-muted font-normal align-baseline ml-0.5 tracking-normal">
                      /mo
                    </sub>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Free note (only for new users) */}
          {!isUpgrade && (
            <div className="-mt-1 mb-7 flex items-center gap-2.5 px-3.5 py-2.5 bg-paper-200 rounded-[10px] text-[12.5px] text-fg-secondary">
              <Star
                className="w-3.5 h-3.5 text-terracotta flex-shrink-0"
                fill="currentColor"
              />
              <span>
                Just want to try things out?{" "}
                <Link
                  to="/auth?mode=signup"
                  className="text-terracotta font-medium hover:underline"
                >
                  Start with Free
                </Link>{" "}
                — one project, no card required.
              </span>
            </div>
          )}

          {/* Account fields - new users only */}
          {!isUpgrade && (
            <form onSubmit={(e) => e.preventDefault()} autoComplete="on">
              <div className="mb-4">
                <div className="text-[10.5px] uppercase tracking-[0.16em] text-fg-muted font-semibold">
                  Your account
                </div>
                <h3 className="mt-2 mb-0 font-display font-medium text-[20px] tracking-[-0.015em] text-ink-900">
                  Create your sign-in.
                </h3>
              </div>

              {/* First / Last */}
              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-[12.5px] font-medium text-ink-800 mb-1.5">
                    First name
                  </label>
                  <input
                    name="given-name"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jes"
                    className="w-full px-3.5 py-2.5 border border-hairline rounded-[10px] bg-white text-ink-900 text-[14px] outline-none transition-all placeholder:text-ink-300 focus:border-ink-900 focus:shadow-[0_0_0_3px_rgba(31,27,23,0.08)]"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-[12px] text-destructive">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-ink-800 mb-1.5">
                    Last name
                  </label>
                  <input
                    name="family-name"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Wilson"
                    className="w-full px-3.5 py-2.5 border border-hairline rounded-[10px] bg-white text-ink-900 text-[14px] outline-none transition-all placeholder:text-ink-300 focus:border-ink-900 focus:shadow-[0_0_0_3px_rgba(31,27,23,0.08)]"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-[12px] text-destructive">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="mb-3.5">
                <label className="block text-[12.5px] font-medium text-ink-800 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-fg-muted pointer-events-none" />
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailExists(false);
                    }}
                    onBlur={() => checkEmailExists(email)}
                    placeholder="you@yourdomain.com"
                    className="w-full pl-10 pr-3.5 py-2.5 border border-hairline rounded-[10px] bg-white text-ink-900 text-[14px] outline-none transition-all placeholder:text-ink-300 focus:border-ink-900 focus:shadow-[0_0_0_3px_rgba(31,27,23,0.08)]"
                  />
                  {isCheckingEmail && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted animate-spin" />
                  )}
                </div>
                {errors.email && (
                  <p className="mt-1 text-[12px] text-destructive">{errors.email}</p>
                )}
                {emailExists && (
                  <div className="mt-1 text-[12px] text-destructive flex items-center gap-2">
                    <span>This email already has an account.</span>
                    <Link to="/auth" className="underline font-medium">
                      Log in instead
                    </Link>
                  </div>
                )}
              </div>

              {/* Password / Confirm */}
              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="block text-[12.5px] font-medium text-ink-800 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-fg-muted pointer-events-none" />
                    <input
                      name="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-10 pr-10 py-2.5 border border-hairline rounded-[10px] bg-white text-ink-900 text-[14px] outline-none transition-all placeholder:text-ink-300 focus:border-ink-900 focus:shadow-[0_0_0_3px_rgba(31,27,23,0.08)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-ink-900"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-[12px] text-destructive">{errors.password}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[12.5px] font-medium text-ink-800 mb-1.5">
                    Confirm
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-fg-muted pointer-events-none" />
                    <input
                      name="confirm-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter"
                      className="w-full pl-10 pr-3.5 py-2.5 border border-hairline rounded-[10px] bg-white text-ink-900 text-[14px] outline-none transition-all placeholder:text-ink-300 focus:border-ink-900 focus:shadow-[0_0_0_3px_rgba(31,27,23,0.08)]"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-[12px] text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* Upgrade greeting for existing users */}
          {isUpgrade && (
            <div className="mb-5 px-4 py-3 bg-white border border-hairline rounded-[12px]">
              <p className="text-[13px] text-fg-secondary m-0">
                Upgrading as{" "}
                <span className="font-medium text-ink-900">{user?.email}</span>
              </p>
            </div>
          )}

          {/* Promo code */}
          <div className="mb-2">
            <label className="block text-[12.5px] font-medium text-ink-800 mb-1.5">
              Promo code <span className="text-fg-muted font-normal">(optional)</span>
            </label>
            {!appliedCoupon ? (
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  placeholder="QUIET25"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoError("");
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleValidateCoupon())
                  }
                  className="w-full px-3.5 py-2.5 border border-hairline rounded-[10px] bg-white text-ink-900 text-[13px] uppercase tracking-[0.05em] outline-none transition-all placeholder:text-ink-300 focus:border-ink-900 focus:shadow-[0_0_0_3px_rgba(31,27,23,0.08)]"
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  disabled={isValidatingCoupon || !promoCode.trim()}
                  className="bg-white border border-hairline rounded-[10px] px-[18px] text-[13px] text-ink-800 hover:bg-paper-200 transition-colors disabled:opacity-50"
                >
                  {isValidatingCoupon ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-clay-100 border border-terracotta/20 rounded-[10px] px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-terracotta" />
                  <span className="text-[13px] font-medium text-ink-900">
                    {appliedCoupon.discount_description}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-fg-muted hover:text-ink-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {promoError && (
              <p className="mt-1 text-[12px] text-destructive">{promoError}</p>
            )}
          </div>

          {/* Payment */}
          <div className="flex items-center gap-2.5 mt-6 mb-3">
            <CreditCard className="w-4 h-4 text-terracotta" />
            <strong className="font-display font-medium text-[17px] text-ink-900">
              Payment details
            </strong>
          </div>

          {!stripePromise ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-[10px] p-4 text-center">
              <p className="text-[13px] text-destructive m-0">
                Stripe is not configured. Please check your environment settings.
              </p>
            </div>
          ) : clientSecret === "free_subscription" ? (
            <div className="text-center space-y-4 py-6">
              <p className="text-[13px] text-fg-secondary">
                🎉 Your coupon covers the full subscription cost!
              </p>
              <button
                onClick={handlePaymentSuccess}
                className="w-full bg-ink-900 hover:bg-ink-800 text-paper-100 rounded-full px-6 py-4 text-[14.5px] font-medium transition-colors"
              >
                Activate Free Subscription
              </button>
            </div>
          ) : intentError === "account_exists" ? (
            <div className="text-center space-y-3 py-6">
              <p className="text-[13px] text-destructive">
                An account with this email already exists.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  to="/auth"
                  className="bg-ink-900 hover:bg-ink-800 text-paper-100 rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors"
                >
                  Log in instead
                </Link>
                <button
                  onClick={() => {
                    setEmail("");
                    setIntentError(null);
                  }}
                  className="bg-white border border-hairline rounded-full px-4 py-2.5 text-[13px] text-ink-800 hover:bg-paper-200 transition-colors"
                >
                  Use a different email
                </button>
              </div>
            </div>
          ) : intentError ? (
            <div className="text-center py-6">
              <p className="text-[13px] text-destructive mb-3">{intentError}</p>
              <button
                onClick={() => createPaymentIntent(appliedCoupon?.coupon_id, selectedTier)}
                className="bg-white border border-hairline rounded-full px-4 py-2 text-[13px] text-ink-800 hover:bg-paper-200 transition-colors"
              >
                Try Again
              </button>
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
            <div className="space-y-3">
              <div className="border border-hairline rounded-[10px] p-4 bg-white">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-paper-200 rounded animate-pulse" />
                    <div className="h-10 bg-paper-200 rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-paper-200 rounded animate-pulse" />
                    <div className="h-10 bg-paper-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              {isCreatingIntent && (
                <div className="flex items-center justify-center gap-2 text-[12px] text-fg-muted">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing payment form...</span>
                </div>
              )}
            </div>
          )}

          {/* Stripe security note */}
          <div className="flex items-center justify-center gap-2 text-[11.5px] text-fg-muted mt-3 tracking-[0.01em]">
            <Lock className="w-3 h-3 text-moss-500" />
            Secure payment powered by Stripe
          </div>

          {/* Terms */}
          <div className="text-center text-[11.5px] text-fg-muted mt-3 leading-relaxed">
            By subscribing, you agree to our{" "}
            <Link
              to="/terms"
              className="text-fg-secondary underline decoration-hairline hover:text-ink-900"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-fg-secondary underline decoration-hairline hover:text-ink-900"
            >
              Privacy Policy
            </Link>
            .<br />
            Cancel any time.
          </div>

          {/* Sign-in row (only for new users) */}
          {!isUpgrade && (
            <div className="mt-8 pt-6 border-t border-hairline text-center text-[13.5px] text-fg-secondary">
              Already have an account?
              <Link
                to="/auth"
                className="text-ink-900 font-medium ml-1 border-b border-ink-900 pb-px hover:opacity-80"
              >
                Sign in
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Checkout;

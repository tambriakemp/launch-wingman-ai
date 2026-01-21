import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, ArrowLeft, Mail, Lock, Loader2, User } from "lucide-react";
import { z } from "zod";
import { waitForSession, invokeCheckoutWithRetry, openCheckoutUrl } from "@/utils/authHelpers";
import { supabase } from "@/integrations/supabase/client";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [checkoutInProgress, setCheckoutInProgress] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; firstName?: string; lastName?: string }>({});
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin";
  const isProCheckoutRoute = searchParams.get("plan") === "pro";

  // Handle logged-in users on Pro checkout route - redirect them to checkout immediately
  useEffect(() => {
    const handleLoggedInProCheckout = async () => {
      if (user && isProCheckoutRoute && !checkoutInProgress) {
        setCheckoutInProgress(true);
        toast.info("Setting up checkout...");
        
        const { url, error } = await invokeCheckoutWithRetry(3);
        
        if (url) {
          openCheckoutUrl(url);
          toast.info("Complete your payment in the new tab, then return here.");
          setCheckoutInProgress(false);
        } else {
          console.error("Checkout error after retries:", error);
          toast.error("Failed to start checkout. Please go to Settings to upgrade.");
          setCheckoutInProgress(false);
          navigate("/settings");
        }
      }
    };
    
    handleLoggedInProCheckout();
  }, [user, isProCheckoutRoute, checkoutInProgress, navigate]);

  // Redirect authenticated users to app, but skip if checkout is in progress (or we're in the Pro checkout route)
  useEffect(() => {
    if (user && !checkoutInProgress && !isProCheckoutRoute) {
      navigate("/app");
    }
  }, [user, checkoutInProgress, isProCheckoutRoute, navigate]);

  // Don't render auth form if user is logged in and not in checkout flow
  if (user && !checkoutInProgress && !isProCheckoutRoute) {
    return null;
  }

  const validateSignIn = () => {
    try {
      signInSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: typeof errors = {};
        err.errors.forEach((error) => {
          if (error.path[0] === "email") fieldErrors.email = error.message;
          if (error.path[0] === "password") fieldErrors.password = error.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const validateSignUp = () => {
    try {
      signUpSchema.parse({ firstName, lastName, email, password });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: typeof errors = {};
        err.errors.forEach((error) => {
          if (error.path[0] === "firstName") fieldErrors.firstName = error.message;
          if (error.path[0] === "lastName") fieldErrors.lastName = error.message;
          if (error.path[0] === "email") fieldErrors.email = error.message;
          if (error.path[0] === "password") fieldErrors.password = error.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignIn()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to sign in");
    } else {
      toast.success("Welcome back!");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUp()) return;

    const plan = searchParams.get("plan");
    const isProSignup = plan === "pro";

    if (isProSignup) {
      // Prevent the authenticated-user redirect racing ahead of checkout
      setCheckoutInProgress(true);
    }

    setLoading(true);
    // Pass skipNavigation=true for Pro signups to prevent AuthContext from navigating before checkout
    const { error } = await signUp(email, password, firstName, lastName, isProSignup);

    if (error) {
      setLoading(false);
      if (isProSignup) setCheckoutInProgress(false);
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Try signing in instead.");
      } else {
        toast.error(error.message || "Failed to sign up");
      }
    } else {
      toast.success("Account created successfully!");

      if (isProSignup) {
        toast.info("Setting up your Pro account...");
        
        // Wait for session to be established after signup
        const sessionReady = await waitForSession(5000);
        if (!sessionReady) {
          console.error("Session not ready after signup");
          toast.error("Session not ready. Please upgrade from Settings.");
          setCheckoutInProgress(false);
          setLoading(false);
          navigate("/settings");
          return;
        }
        
        toast.info("Opening checkout...");
        
        // Invoke checkout with retry logic
        const { url, error: checkoutError } = await invokeCheckoutWithRetry(3);
        
        if (url) {
          openCheckoutUrl(url);
          toast.info("Complete your payment in the new tab, then return here.");
          setCheckoutInProgress(false);
          setLoading(false);
          return;
        } else {
          console.error("Checkout error after retries:", checkoutError);
          toast.error("Failed to start checkout. Please go to Settings to upgrade.");
          setCheckoutInProgress(false);
          navigate("/settings");
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    setResetLoading(false);

    if (error) {
      toast.error(error.message || "Failed to send reset email");
    } else {
      toast.success("Password reset email sent! Check your inbox.");
      setShowResetPassword(false);
      setResetEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/" className="flex items-center gap-3 mb-12">
              <div className="w-14 h-14 bg-primary-foreground/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-7 h-7" />
              </div>
              <span className="text-3xl font-bold">Launchely</span>
            </Link>
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Launch Your Programs<br />With Confidence
            </h1>
            <p className="text-xl opacity-90 max-w-md">
              The all-in-one platform for coaches and marketers to plan, organize, and execute successful launches.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {showResetPassword ? (
            <Card variant="elevated" className="border-0 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center mb-4 lg:hidden">
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-center">Reset Password</CardTitle>
                <CardDescription className="text-center">
                  Enter your email and we'll send you a reset link.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleResetPassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" size="lg" disabled={resetLoading}>
                    {resetLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowResetPassword(false)}
                  >
                    Back to Sign In
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <Card variant="elevated" className="border-0 shadow-xl">
              <Tabs defaultValue={defaultTab} className="w-full">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-center mb-4 lg:hidden">
                    <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                  <TabsList className="grid w-full grid-cols-2 bg-muted p-1">
                    <TabsTrigger 
                      value="signin"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn}>
                    <CardContent className="space-y-4">
                      <CardDescription className="text-center mb-4">
                        Welcome back! Sign in to continue.
                      </CardDescription>
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signin-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signin-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                      </div>
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 text-sm"
                        onClick={() => setShowResetPassword(true)}
                      >
                        Forgot password?
                      </Button>
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-4">
                      <CardDescription className="text-center mb-4">
                        Create your account to get started.
                      </CardDescription>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="signup-firstname">First Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="signup-firstname"
                              type="text"
                              placeholder="John"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-lastname">Last Name</Label>
                          <Input
                            id="signup-lastname"
                            type="text"
                            placeholder="Doe"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                          {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
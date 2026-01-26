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
import { supabase } from "@/integrations/supabase/client";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  // Sign up state
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpErrors, setSignUpErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
  }>({});
  
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "signin";

  // Show success message if coming from checkout
  useEffect(() => {
    if (checkoutSuccess) {
      toast.success("Your Pro subscription is active! Sign in to continue.");
    }
  }, [checkoutSuccess]);

  // Redirect authenticated users to app
  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  // Don't render auth form if user is logged in
  if (user) {
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
      signUpSchema.parse({ 
        email: signUpEmail, 
        firstName, 
        lastName, 
        password: signUpPassword, 
        confirmPassword 
      });
      setSignUpErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: typeof signUpErrors = {};
        err.errors.forEach((error) => {
          const path = error.path[0] as keyof typeof signUpErrors;
          fieldErrors[path] = error.message;
        });
        setSignUpErrors(fieldErrors);
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

    setSignUpLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      setSignUpLoading(false);
      toast.error(error.message || "Failed to create account");
      return;
    }

    // Create profile with first and last name
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    }

    setSignUpLoading(false);
    toast.success("Account created successfully!");
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
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center mb-4 lg:hidden">
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardHeader>
              
              <Tabs defaultValue={defaultTab} className="w-full">
                <div className="px-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                </div>

                {/* Sign In Tab */}
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn}>
                    <CardContent className="space-y-4 pt-6">
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
                    <CardFooter className="flex flex-col gap-4">
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

                {/* Sign Up Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp}>
                    <CardContent className="space-y-4 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="firstName"
                              type="text"
                              placeholder="Jane"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          {signUpErrors.firstName && <p className="text-sm text-destructive">{signUpErrors.firstName}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            type="text"
                            placeholder="Doe"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                          />
                          {signUpErrors.lastName && <p className="text-sm text-destructive">{signUpErrors.lastName}</p>}
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
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {signUpErrors.email && <p className="text-sm text-destructive">{signUpErrors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {signUpErrors.password && <p className="text-sm text-destructive">{signUpErrors.password}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {signUpErrors.confirmPassword && <p className="text-sm text-destructive">{signUpErrors.confirmPassword}</p>}
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                      <Button type="submit" className="w-full" size="lg" disabled={signUpLoading}>
                        {signUpLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Free Account"
                        )}
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        Want Pro features?{" "}
                        <Link to="/checkout" className="text-primary hover:underline font-medium">
                          Subscribe here
                        </Link>
                      </p>
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

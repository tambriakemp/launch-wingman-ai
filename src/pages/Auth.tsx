import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import "@/components/landing/landing-theme.css";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z
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

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8.1z"
    />
    <path
      fill="#34A853"
      d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.3 1.1-3.7 1.1-2.8 0-5.2-1.9-6.1-4.5H2.3v2.8A11 11 0 0 0 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.9 14.2a6.6 6.6 0 0 1 0-4.2V7.2H2.3a11 11 0 0 0 0 9.6l3.6-2.6z"
    />
    <path
      fill="#EA4335"
      d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 12 1 11 11 0 0 0 2.3 7.2l3.6 2.8C6.8 7.3 9.2 5.4 12 5.4z"
    />
  </svg>
);

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Sign-in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Sign-up state
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

  // Reset state
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Google OAuth state
  const [googleLoading, setGoogleLoading] = useState(false);
  const surecontactFiredRef = useRef(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  // Initial mode from URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup") setMode("signup");
    else if (tab === "signin") setMode("signin");
  }, [searchParams]);

  useEffect(() => {
    if (checkoutSuccess) {
      toast.success("Your Pro subscription is active! Sign in to continue.");
    }
  }, [checkoutSuccess]);

  // Redirect authenticated users + fire SureContact one-shot for new Google signups
  useEffect(() => {
    if (!user) return;

    // Detect a brand-new OAuth signup: created_at within ~30s of last_sign_in_at
    if (!surecontactFiredRef.current) {
      const created = user.created_at ? new Date(user.created_at).getTime() : 0;
      const lastSignIn = user.last_sign_in_at
        ? new Date(user.last_sign_in_at).getTime()
        : 0;
      const isBrandNew = created > 0 && Math.abs(lastSignIn - created) < 30_000;
      const provider = (user.app_metadata as { provider?: string } | undefined)?.provider;
      if (isBrandNew && provider === "google") {
        surecontactFiredRef.current = true;
        const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
        const fullName = meta.full_name ?? meta.name ?? "";
        const [first = "", ...rest] = fullName.split(" ");
        const last = rest.join(" ");
        supabase.functions
          .invoke("surecontact-webhook", {
            body: {
              action: "sync_new_signup",
              email: user.email,
              first_name: meta.given_name ?? meta.first_name ?? first,
              last_name: meta.family_name ?? meta.last_name ?? last,
            },
          })
          .catch(() => {});
      }
    }

    navigate("/app");
  }, [user, navigate]);

  if (user) return null;

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
        confirmPassword,
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
    if (error) toast.error(error.message || "Failed to sign in");
    else toast.success("Welcome back!");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUp()) return;
    setSignUpLoading(true);
    const { error } = await signUp(signUpEmail, signUpPassword, firstName, lastName);
    setSignUpLoading(false);
    if (error) {
      toast.error(error.message || "Failed to create account");
      return;
    }
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
    if (error) toast.error(error.message || "Failed to send reset email");
    else {
      toast.success("Password reset email sent! Check your inbox.");
      setShowResetPassword(false);
      setResetEmail("");
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in failed");
        setGoogleLoading(false);
        return;
      }
      if (result.redirected) return;
      // tokens received → AuthContext picks it up
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="app-cream min-h-screen">
      <style>{`
        .auth-shell { display: grid; grid-template-columns: 1fr 1.1fr; min-height: 100vh; }
        @media (max-width: 920px) { .auth-shell { grid-template-columns: 1fr; } .brand-side { display: none; } }

        .brand-side {
          background: hsl(var(--paper-100));
          padding: 32px 56px 48px;
          display: flex; flex-direction: column; justify-content: space-between;
          position: relative; overflow: hidden;
          border-right: 1px solid hsl(var(--border-hairline));
        }
        .brand-side::before {
          content: ''; position: absolute; right: -260px; bottom: -260px;
          width: 560px; height: 560px; border-radius: 50%;
          background: radial-gradient(circle, hsla(13, 56%, 51%, 0.12), transparent 70%);
          pointer-events: none;
        }
        .brand-top { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1; }
        .wordmark { font-family: var(--font-display); font-style: italic; font-weight: 500; font-size: 22px; letter-spacing: -0.02em; color: hsl(var(--ink-900)); text-decoration: none; }
        .wordmark .dot { color: hsl(var(--terracotta-500)); }
        .back-link { font-family: var(--font-body); font-size: 13px; color: hsl(var(--fg-muted)); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: color 140ms ease; }
        .back-link:hover { color: hsl(var(--ink-900)); }

        .brand-body { max-width: 460px; position: relative; z-index: 1; }
        .brand-eyebrow { font-family: var(--font-body); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: hsl(var(--terracotta-500)); font-weight: 600; margin-bottom: 20px; }
        .brand-headline { font-family: var(--font-display); font-weight: 400; font-size: 56px; line-height: 1.02; letter-spacing: -0.025em; color: hsl(var(--ink-900)); margin: 0; }
        .brand-headline em { font-style: italic; font-weight: 300; color: hsl(var(--terracotta-500)); }
        .brand-sub { font-family: var(--font-body); font-size: 16px; line-height: 1.6; color: hsl(var(--fg-secondary)); margin: 20px 0 0; max-width: 400px; }

        .brand-pull {
          margin-top: 40px; padding: 22px 24px 22px 26px;
          background: #fff; border: 1px solid hsl(var(--border-hairline));
          border-radius: 14px; max-width: 440px; position: relative;
        }
        .brand-pull::before {
          content: ''; position: absolute; left: 0; top: 22px; bottom: 22px; width: 3px;
          background: hsl(var(--terracotta-500)); border-radius: 999px;
        }
        .brand-pull .quote { font-family: var(--font-display); font-style: italic; font-weight: 400; font-size: 17px; line-height: 1.45; color: hsl(var(--ink-900)); }
        .brand-pull .attr { font-family: var(--font-body); font-size: 12px; color: hsl(var(--fg-muted)); margin-top: 10px; letter-spacing: 0.02em; }

        .brand-footer { font-family: var(--font-body); font-size: 12px; color: hsl(var(--fg-muted)); display: flex; align-items: center; gap: 10px; position: relative; z-index: 1; }
        .brand-footer .avatar { width: 22px; height: 22px; border-radius: 999px; border: 2px solid hsl(var(--paper-100)); margin-left: -6px; display: inline-block; }
        .brand-footer .avatar:first-child { margin-left: 0; }

        .form-side {
          padding: 56px 72px;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          background: hsl(var(--paper-50));
        }
        @media (max-width: 920px) { .form-side { padding: 40px 24px; } }

        .form-card { width: 100%; max-width: 460px; }

        .auth-tabs {
          display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
          padding: 4px; background: hsl(var(--paper-200)); border-radius: 999px;
          margin-bottom: 28px;
        }
        .auth-tab {
          padding: 10px 0; border: 0; background: transparent; cursor: pointer;
          font-family: var(--font-body); font-size: 13.5px; font-weight: 500;
          color: hsl(var(--fg-secondary)); border-radius: 999px;
          transition: all 180ms var(--ease-out);
        }
        .auth-tab.active { background: #fff; color: hsl(var(--ink-900)); font-weight: 600; box-shadow: 0 1px 2px rgba(31,27,23,0.06); }

        .form-title {
          font-family: var(--font-display); font-weight: 500; font-size: 28px;
          letter-spacing: -0.02em; color: hsl(var(--ink-900)); margin: 0; line-height: 1.15;
        }
        .form-sub { font-family: var(--font-body); font-size: 14px; color: hsl(var(--fg-secondary)); margin: 6px 0 24px; }

        .social-row { display: grid; grid-template-columns: 1fr; gap: 10px; margin-bottom: 20px; }
        .social-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 14px; border: 1px solid hsl(var(--border-default)); border-radius: 10px;
          background: #fff; cursor: pointer;
          font-family: var(--font-body); font-size: 13.5px; font-weight: 500; color: hsl(var(--ink-900));
          transition: border-color 140ms var(--ease-out);
        }
        .social-btn:hover:not(:disabled) { border-color: hsl(var(--ink-900)); }
        .social-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .auth-divider { display: flex; align-items: center; gap: 12px; margin: 22px 0; }
        .auth-divider .line { flex: 1; height: 1px; background: hsl(var(--border-hairline)); }
        .auth-divider .txt { font-family: var(--font-body); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: hsl(var(--fg-muted)); font-weight: 600; white-space: nowrap; }

        .auth-row { display: grid; gap: 16px; }
        .auth-row.two { grid-template-columns: 1fr 1fr; }

        .auth-field { display: flex; flex-direction: column; gap: 6px; }
        .auth-field label { font-family: var(--font-body); font-size: 12.5px; font-weight: 500; color: hsl(var(--ink-800)); }
        .input-wrap { position: relative; }
        .input-wrap .ico { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: hsl(var(--fg-muted)); pointer-events: none; }
        .input-wrap input {
          width: 100%; box-sizing: border-box;
          padding: 11px 14px 11px 40px;
          border: 1px solid hsl(var(--border-default)); border-radius: 10px;
          background: #fff; font-family: var(--font-body); font-size: 14px; color: hsl(var(--ink-900));
          transition: border-color 140ms var(--ease-out), box-shadow 140ms var(--ease-out);
        }
        .input-wrap input::placeholder { color: hsl(var(--fg-muted)); }
        .input-wrap input:focus { outline: 0; border-color: hsl(var(--terracotta-500)); box-shadow: 0 0 0 3px hsla(13, 56%, 51%, 0.12); }
        .field-error { font-family: var(--font-body); font-size: 12px; color: hsl(var(--terracotta-500)); margin-top: 2px; }

        .helper-row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; font-family: var(--font-body); font-size: 13px; }
        .helper-row label { display: inline-flex; align-items: center; gap: 8px; color: hsl(var(--fg-secondary)); cursor: pointer; }
        .helper-row input[type="checkbox"] { width: 15px; height: 15px; accent-color: hsl(var(--terracotta-500)); }
        .helper-row a, .helper-row button.linklike { color: hsl(var(--terracotta-500)); text-decoration: none; background: none; border: 0; padding: 0; cursor: pointer; font: inherit; }
        .helper-row a:hover, .helper-row button.linklike:hover { text-decoration: underline; }

        .cta {
          width: 100%; margin-top: 20px;
          padding: 14px 20px; border: 0; border-radius: 999px;
          background: hsl(var(--terracotta-500)); color: hsl(var(--paper-50));
          font-family: var(--font-body); font-size: 14.5px; font-weight: 500;
          cursor: pointer;
          transition: background 160ms var(--ease-out), transform 160ms var(--ease-out);
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
        }
        .cta:hover:not(:disabled) { background: #B24F36; }
        .cta:active { transform: translateY(1px); }
        .cta:disabled { opacity: 0.7; cursor: not-allowed; }

        .pro-upsell {
          margin-top: 18px; padding: 16px 18px;
          background: linear-gradient(135deg, #F8E9C5 0%, #F2D9A8 100%);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: space-between; gap: 14px;
        }
        .pro-upsell .txt { font-family: var(--font-body); font-size: 13px; color: hsl(var(--ink-800)); }
        .pro-upsell .txt strong { color: hsl(var(--ink-900)); font-weight: 600; }
        .pro-upsell .link {
          font-family: var(--font-body); font-size: 12.5px; font-weight: 600;
          text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
          padding: 7px 12px; background: hsl(var(--ink-900)); color: hsl(var(--paper-100));
          border-radius: 999px; white-space: nowrap; flex-shrink: 0;
          transition: background 140ms ease;
        }
        .pro-upsell .link:hover { background: #000; }

        .legal { font-family: var(--font-body); font-size: 12px; color: hsl(var(--fg-muted)); text-align: center; margin-top: 28px; line-height: 1.55; }
      `}</style>

      <div className="auth-shell">
        {/* Brand side */}
        <aside className="brand-side">
          <div className="brand-top">
            <Link to="/" className="wordmark">
              Launchely<span className="dot">.</span>
            </Link>
            <Link to="/" className="back-link">
              ← Back to home
            </Link>
          </div>

          <div className="brand-body">
            <div className="brand-eyebrow">{isSignup ? "New here" : "Welcome back"}</div>
            {isSignup ? (
              <h1 className="brand-headline">
                Your next launch
                <br />
                starts <em>here.</em>
              </h1>
            ) : (
              <h1 className="brand-headline">
                Ready to keep
                <br />
                going, <em>friend?</em>
              </h1>
            )}
            <p className="brand-sub">
              {isSignup
                ? "Skip the $2,000 courses. Launchely walks you through the whole thing — offer, messaging, content, launch — in six quiet weeks."
                : "Your launch is waiting. Let's pick up where you left off — we've been keeping things warm."}
            </p>

            <div className="brand-pull">
              <div className="quote">
                "It's the first tool that felt like a calm collaborator instead of another dashboard. I actually finished my launch."
              </div>
              <div className="attr">— Maya Lindgren · Course creator · Joined March 2026</div>
            </div>
          </div>

          <div className="brand-footer">
            <div>
              <span className="avatar" style={{ background: "linear-gradient(135deg, #E8D9C6, #C65A3E)" }} />
              <span className="avatar" style={{ background: "linear-gradient(135deg, #D9C6A4, #8A6A3D)" }} />
              <span className="avatar" style={{ background: "linear-gradient(135deg, #F2D9A8, #D9B35B)" }} />
              <span className="avatar" style={{ background: "linear-gradient(135deg, #C8D4BE, #6B8860)" }} />
            </div>
            Already helping 1,200+ coaches, creators, and small teams launch.
          </div>
        </aside>

        {/* Form side */}
        <main className="form-side">
          <div className="form-card">
            {showResetPassword ? (
              <form onSubmit={handleResetPassword}>
                <h2 className="form-title">Reset your password.</h2>
                <p className="form-sub">Enter your email and we'll send you a reset link.</p>

                <div className="auth-row">
                  <div className="auth-field">
                    <label htmlFor="reset-email">Email</label>
                    <div className="input-wrap">
                      <Mail className="ico" size={16} strokeWidth={1.6} />
                      <input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="cta" disabled={resetLoading}>
                  {resetLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      Send reset link <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="helper-row" style={{ justifyContent: "center", marginTop: 16 }}>
                  <button
                    type="button"
                    className="linklike"
                    onClick={() => setShowResetPassword(false)}
                  >
                    ← Back to sign in
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="auth-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    className={`auth-tab ${!isSignup ? "active" : ""}`}
                    onClick={() => setMode("signin")}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    role="tab"
                    className={`auth-tab ${isSignup ? "active" : ""}`}
                    onClick={() => setMode("signup")}
                  >
                    Sign up
                  </button>
                </div>

                <h2 className="form-title">
                  {isSignup ? "Create your free account." : "Welcome back."}
                </h2>
                <p className="form-sub">
                  {isSignup
                    ? "No credit card. Five minutes to your first launch brief."
                    : "Sign in to continue your launch."}
                </p>

                <div className="social-row">
                  <button
                    type="button"
                    className="social-btn"
                    onClick={handleGoogle}
                    disabled={googleLoading}
                  >
                    {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
                    Continue with Google
                  </button>
                </div>

                <div className="auth-divider">
                  <span className="line" />
                  <span className="txt">or use email</span>
                  <span className="line" />
                </div>

                {isSignup ? (
                  <form onSubmit={handleSignUp}>
                    <div className="auth-row">
                      <div className="auth-row two">
                        <div className="auth-field">
                          <label htmlFor="firstName">First name</label>
                          <div className="input-wrap">
                            <User className="ico" size={16} strokeWidth={1.6} />
                            <input
                              id="firstName"
                              type="text"
                              placeholder="Tambra"
                              autoComplete="given-name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                            />
                          </div>
                          {signUpErrors.firstName && (
                            <span className="field-error">{signUpErrors.firstName}</span>
                          )}
                        </div>
                        <div className="auth-field">
                          <label htmlFor="lastName">Last name</label>
                          <div className="input-wrap">
                            <User className="ico" size={16} strokeWidth={1.6} />
                            <input
                              id="lastName"
                              type="text"
                              placeholder="Rivera"
                              autoComplete="family-name"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                            />
                          </div>
                          {signUpErrors.lastName && (
                            <span className="field-error">{signUpErrors.lastName}</span>
                          )}
                        </div>
                      </div>

                      <div className="auth-field">
                        <label htmlFor="signup-email">Email</label>
                        <div className="input-wrap">
                          <Mail className="ico" size={16} strokeWidth={1.6} />
                          <input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                          />
                        </div>
                        {signUpErrors.email && (
                          <span className="field-error">{signUpErrors.email}</span>
                        )}
                      </div>

                      <div className="auth-field">
                        <label htmlFor="signup-password">Password</label>
                        <div className="input-wrap">
                          <Lock className="ico" size={16} strokeWidth={1.6} />
                          <input
                            id="signup-password"
                            type="password"
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                          />
                        </div>
                        {signUpErrors.password && (
                          <span className="field-error">{signUpErrors.password}</span>
                        )}
                      </div>

                      <div className="auth-field">
                        <label htmlFor="confirmPassword">Confirm password</label>
                        <div className="input-wrap">
                          <Lock className="ico" size={16} strokeWidth={1.6} />
                          <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Repeat password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                        {signUpErrors.confirmPassword && (
                          <span className="field-error">{signUpErrors.confirmPassword}</span>
                        )}
                      </div>
                    </div>

                    <button type="submit" className="cta" disabled={signUpLoading}>
                      {signUpLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Creating account...
                        </>
                      ) : (
                        <>
                          Create free account <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    <div className="pro-upsell">
                      <div className="txt">
                        Want <strong>Pro</strong> — AI Studio + unlimited projects? Upgrade at checkout.
                      </div>
                      <Link to="/checkout" className="link">
                        Subscribe
                      </Link>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn}>
                    <div className="auth-row">
                      <div className="auth-field">
                        <label htmlFor="signin-email">Email</label>
                        <div className="input-wrap">
                          <Mail className="ico" size={16} strokeWidth={1.6} />
                          <input
                            id="signin-email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        {errors.email && <span className="field-error">{errors.email}</span>}
                      </div>

                      <div className="auth-field">
                        <label htmlFor="signin-password">Password</label>
                        <div className="input-wrap">
                          <Lock className="ico" size={16} strokeWidth={1.6} />
                          <input
                            id="signin-password"
                            type="password"
                            placeholder="Your password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                        {errors.password && <span className="field-error">{errors.password}</span>}
                      </div>
                    </div>

                    <div className="helper-row">
                      <label>
                        <input
                          type="checkbox"
                          checked={keepSignedIn}
                          onChange={(e) => setKeepSignedIn(e.target.checked)}
                        />
                        Keep me signed in
                      </label>
                      <button
                        type="button"
                        className="linklike"
                        onClick={() => setShowResetPassword(true)}
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button type="submit" className="cta" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Signing in...
                        </>
                      ) : (
                        <>
                          Sign in <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                )}

                <div className="legal">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Auth;

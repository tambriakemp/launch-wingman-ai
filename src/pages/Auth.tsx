import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

/* ════════════════════════════════════════════════════════════
   Cre8 Brain — Auth + Confirmation
   Web: dark top nav + centered column, ~480px wide.
   Native (Capacitor): dark brand backdrop with bottom-sheet card.
   Design tokens are scoped to `.cb-shell` so the new palette
   doesn't leak into the rest of the app while the redesign
   rolls out page-by-page.
   ════════════════════════════════════════════════════════════ */

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/* ── Brand glyphs ────────────────────────────────────────── */

const BrainMark = ({ size = 22, color = "#B5985A" }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    aria-hidden
  >
    <circle cx="7" cy="8" r="2.4" stroke={color} strokeWidth="1.5" />
    <circle cx="16.5" cy="6.5" r="2.1" stroke={color} strokeWidth="1.5" />
    <circle cx="15" cy="16" r="2.4" stroke={color} strokeWidth="1.5" />
    <circle cx="6" cy="16.5" r="1.7" stroke={color} strokeWidth="1.5" />
    <path
      d="M9.2 8.8 14.4 6.9M9 9.6 13 14.6M8.6 14.9 12.7 16M6.2 14.8 6.8 10.3"
      stroke={color}
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

const BrainWordmark = ({ size = 14, color }: { size?: number; color: string }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 9,
      whiteSpace: "nowrap",
    }}
  >
    <BrainMark size={Math.round(size * 1.2)} color="#B5985A" />
    <span
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontWeight: 500,
        fontSize: size,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color,
        lineHeight: 1,
      }}
    >
      Cre8 Brain
    </span>
  </span>
);

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.7 7l7.2 5.6c4.2-3.9 6.6-9.6 6.6-16.6z" />
    <path fill="#FBBC05" d="M10.5 19.4l-7.9-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.2c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6z" />
    <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7.2-5.6c-2 1.4-4.6 2.2-8.3 2.2-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1B1915" aria-hidden>
    <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.7 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.4 1.2-.1 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.8 0 .1-.2.1-.2 0zM14.2 5.6c.7-.8 1.1-2 1-3.1-1 0-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3z" />
  </svg>
);

const ArrowIcon = ({ color = "currentColor" }: { color?: string }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EnvelopeIcon = ({ size = 48, color = "#B5985A" }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="#F4EFE9"
    stroke={color}
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="5" y="11" width="38" height="26" rx="4" />
    <path d="M6 14l18 13L42 14" fill="none" />
  </svg>
);

/* ── Decorative network nodes for native backdrop ─────────── */

const NETWORK_NODES: Array<[number, number]> = [
  [50, 16], [22, 30], [78, 28], [14, 55], [50, 46],
  [86, 54], [32, 72], [68, 74], [50, 90], [40, 38],
];
const NETWORK_LINKS: Array<[number, number]> = [
  [0, 1], [0, 2], [1, 9], [9, 4], [2, 5], [1, 3], [4, 5],
  [3, 6], [4, 7], [6, 8], [7, 8], [5, 7], [3, 4], [9, 0], [6, 4],
];
const NodeNetwork = ({ size = 130, opacity = 0.34 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", opacity }} aria-hidden>
    {NETWORK_LINKS.map(([a, b], i) => {
      const p = NETWORK_NODES[a];
      const q = NETWORK_NODES[b];
      return <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#B5985A" strokeWidth="0.5" strokeOpacity="0.55" />;
    })}
    {NETWORK_NODES.map((n, i) => (
      <circle key={i} cx={n[0]} cy={n[1]} r="2" fill="#B5985A" fillOpacity="0.1" stroke="#B5985A" strokeWidth="0.7" />
    ))}
  </svg>
);

/* ════════════════════════════════════════════════════════════
   Main Auth component
   ════════════════════════════════════════════════════════════ */

type AuthMode = "signin" | "signup" | "confirm" | "reset";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [confirmEmail, setConfirmEmail] = useState("");

  // Sign-in / sign-up shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Reset
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // OAuth + resend loaders
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const surecontactFiredRef = useRef(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  /* Initial mode from URL */
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

  /* Redirect signed-in users + fire SureContact one-shot for new Google signups */
  useEffect(() => {
    if (!user) return;
    if (!surecontactFiredRef.current) {
      const created = user.created_at ? new Date(user.created_at).getTime() : 0;
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0;
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

  /* ── Handlers ──────────────────────────────────────────── */

  const validate = (kind: "signin" | "signup") => {
    const schema = kind === "signin" ? signInSchema : signUpSchema;
    try {
      schema.parse({ email, password });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: typeof errors = {};
        err.errors.forEach((e) => {
          if (e.path[0] === "email") fieldErrors.email = e.message;
          if (e.path[0] === "password") fieldErrors.password = e.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate("signin")) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast.error(error.message || "Failed to sign in");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate("signup")) return;
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message || "Failed to create account");
      return;
    }
    setConfirmEmail(email);
    setMode("confirm");
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
      setMode("signin");
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  const handleApple = async () => {
    setAppleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) {
        toast.error(result.error.message || "Apple sign-in failed");
        setAppleLoading(false);
        return;
      }
      if (result.redirected) return;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Apple sign-in failed");
      setAppleLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!confirmEmail) return;
    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: confirmEmail,
    } as { type: "signup"; email: string });
    setResendLoading(false);
    if (error) toast.error(error.message || "Failed to resend email");
    else toast.success("Confirmation email sent!");
  };

  const handleUseDifferentEmail = () => {
    setConfirmEmail("");
    setEmail("");
    setPassword("");
    setMode("signup");
  };

  const handleOpenEmailApp = () => {
    // mailto: with no recipient opens the user's default mail client / app.
    window.location.href = "mailto:";
  };

  /* Detect Capacitor / native app shell */
  const isNativeApp =
    typeof window !== "undefined" &&
    (((window as any).Capacitor?.isNativePlatform?.() ?? false) ||
      /(Median|MedianJS|gonative|capacitor)/i.test(window.navigator.userAgent));

  /* ── Sub-renderers ─────────────────────────────────────── */

  /** Signup or signin form body (shared on web + native). */
  const renderAuthForm = (variant: "web" | "native") => {
    const isSignup = mode === "signup";
    const sansSize = variant === "native" ? 16 : 15;
    return (
      <>
        {variant === "native" && (
          <div className="cb-segment" role="tablist">
            <button
              type="button"
              role="tab"
              className={`cb-seg ${isSignup ? "active" : ""}`}
              onClick={() => setMode("signup")}
            >
              Create account
            </button>
            <button
              type="button"
              role="tab"
              className={`cb-seg ${!isSignup ? "active" : ""}`}
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
          </div>
        )}

        <form onSubmit={isSignup ? handleSignUp : handleSignIn} className="cb-form">
          <div className="cb-field">
            <label htmlFor="cb-email">Email</label>
            <input
              id="cb-email"
              type="email"
              inputMode="email"
              placeholder="you@yourbusiness.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ fontSize: sansSize }}
            />
            {errors.email && <span className="cb-err">{errors.email}</span>}
          </div>

          <div className="cb-field">
            <label htmlFor="cb-password">Password</label>
            <div className="cb-input-wrap">
              <input
                id="cb-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ fontSize: sansSize }}
              />
              <button
                type="button"
                className="cb-show-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <span className="cb-err">{errors.password}</span>}
          </div>

          {!isSignup && (
            <button
              type="button"
              className="cb-forgot"
              onClick={() => setMode("reset")}
            >
              Forgot password?
            </button>
          )}

          <button type="submit" className="cb-btn ink" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {isSignup ? "Creating account…" : "Signing in…"}
              </>
            ) : (
              <>{isSignup ? "Create account" : "Sign in"}</>
            )}
          </button>

          <div className="cb-divider">
            <span className="line" />
            <span className="txt">or</span>
            <span className="line" />
          </div>

          <button type="button" className="cb-btn social" onClick={handleGoogle} disabled={googleLoading}>
            {googleLoading ? <Loader2 size={14} className="animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>
          <button type="button" className="cb-btn social" onClick={handleApple} disabled={appleLoading}>
            {appleLoading ? <Loader2 size={14} className="animate-spin" /> : <AppleIcon />}
            Continue with Apple
          </button>
        </form>

        <div className="cb-legal">
          By {isSignup ? "creating an account" : "continuing"} you agree to our{" "}
          <a
            href="https://launchely.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="cb-legal-link"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="https://launchely.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="cb-legal-link"
          >
            Privacy Policy
          </a>
          .
        </div>

        {variant === "web" && (
          <div className="cb-footer-link">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <button type="button" className="link" onClick={() => setMode("signin")}>
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button type="button" className="link" onClick={() => setMode("signup")}>
                  Create an account
                </button>
              </>
            )}
          </div>
        )}
      </>
    );
  };

  const renderConfirm = (variant: "web" | "native") => {
    const titleSize = variant === "native" ? 34 : 44;
    return (
      <div className="cb-confirm">
        <EnvelopeIcon size={48} />
        <h1 className="cb-confirm-title" style={{ fontSize: titleSize }}>
          Check your inbox.
        </h1>
        <p className="cb-confirm-body">
          We sent a confirmation link to{" "}
          <span className="email">{confirmEmail || "your email"}</span>. Click the link to activate your account and continue.
        </p>
        <button type="button" className="cb-btn ink" onClick={handleOpenEmailApp}>
          {variant === "native" ? (
            <>I've confirmed my email <ArrowIcon color="#F9F6F1" /></>
          ) : (
            <>Open your email app</>
          )}
        </button>
        <button
          type="button"
          className="cb-resend"
          onClick={handleResendConfirmation}
          disabled={resendLoading}
        >
          {resendLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Resending…
            </>
          ) : (
            "Resend confirmation email"
          )}
        </button>
        <button type="button" className="cb-different" onClick={handleUseDifferentEmail}>
          Use a different email
        </button>
        {variant === "web" && (
          <p className="cb-confirm-foot">
            Once you confirm, return here to continue building your brain.
          </p>
        )}
      </div>
    );
  };

  const renderReset = () => (
    <form onSubmit={handleResetPassword} className="cb-form">
      <div className="cb-field">
        <label htmlFor="cb-reset-email">Email</label>
        <input
          id="cb-reset-email"
          type="email"
          inputMode="email"
          placeholder="you@yourbusiness.com"
          autoComplete="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
        />
      </div>
      <button type="submit" className="cb-btn ink" disabled={resetLoading}>
        {resetLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Sending…
          </>
        ) : (
          <>Send reset link</>
        )}
      </button>
      <button
        type="button"
        className="cb-forgot center"
        onClick={() => setMode("signin")}
      >
        ← Back to sign in
      </button>
    </form>
  );

  /* ── Layout shells ─────────────────────────────────────── */

  const isSignup = mode === "signup";
  const isConfirm = mode === "confirm";
  const isReset = mode === "reset";

  const webEyebrow = isConfirm
    ? "Email Confirmation"
    : isReset
      ? "Password reset"
      : isSignup
        ? "Cre8 Brain"
        : "Welcome back";

  const webTitle = isConfirm
    ? null
    : isReset
      ? "Reset your password."
      : isSignup
        ? "Create your account."
        : "Welcome back.";

  const webSub = isReset
    ? "Enter your email and we'll send you a reset link."
    : isSignup
      ? "Build the brain that runs your business."
      : isConfirm
        ? null
        : "Sign in to continue building your brain.";

  return (
    <div className="cb-shell">
      <style>{`
        .cb-shell {
          --cb-ink: #1B1915;
          --cb-warm: #F9F6F1;
          --cb-bronze: #B5985A;
          --cb-bronze-d: #9F8348;
          --cb-taupe: #A39E97;
          --cb-cream: #F4EFE9;
          --cb-mist: #E4DFD9;
          --cb-char: #2B2926;
          --cb-dline: #3A3733;
          --cb-sub: #6E6456;
          --cb-line: #E7DFD2;
          --cb-serif: Georgia, "Times New Roman", serif;
          --cb-sans: Arial, Helvetica, sans-serif;
          --cb-mono: "DM Mono", ui-monospace, "SF Mono", Menlo, monospace;
          min-height: 100vh;
          background: var(--cb-warm);
          font-family: var(--cb-sans);
          color: var(--cb-ink);
        }

        /* ── Web shell ── */
        .cb-web-nav {
          height: 60px;
          background: var(--cb-ink);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
        }
        .cb-web-nav-actions { display: flex; align-items: center; gap: 14px; }
        .cb-web-nav-actions .ghost {
          font-family: var(--cb-sans);
          font-size: 13px;
          color: var(--cb-taupe);
          background: transparent;
          border: 0;
          cursor: pointer;
          padding: 0;
        }
        .cb-web-nav-actions .ghost:hover { color: var(--cb-warm); }
        .cb-web-nav-actions .pill {
          font-family: var(--cb-sans);
          font-size: 13px;
          font-weight: 600;
          color: var(--cb-warm);
          background: transparent;
          border: 1px solid var(--cb-dline);
          border-radius: 999px;
          padding: 8px 16px;
          cursor: pointer;
        }
        .cb-web-nav-actions .pill:hover { background: rgba(255,255,255,0.04); }

        .cb-web-center {
          min-height: calc(100vh - 60px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 56px 24px;
        }
        .cb-web-column {
          width: 100%;
          max-width: 480px;
        }
        .cb-web-column.confirm { max-width: 440px; text-align: center; }

        .cb-rule {
          width: 48px;
          height: 1px;
          background: var(--cb-bronze);
          margin: 0 0 20px;
        }
        .cb-web-column.confirm .cb-rule { margin: 0 auto 20px; }
        .cb-eyebrow {
          font-family: var(--cb-mono);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--cb-taupe);
          margin: 0 0 14px;
        }
        .cb-title {
          font-family: var(--cb-serif);
          font-weight: 400;
          font-size: 48px;
          line-height: 1.02;
          letter-spacing: -0.005em;
          color: var(--cb-ink);
          margin: 0;
        }
        .cb-sub {
          font-family: var(--cb-sans);
          font-size: 15px;
          color: var(--cb-taupe);
          margin: 10px 0 0;
        }

        /* ── Form fields ── */
        .cb-form { display: grid; gap: 12px; margin-top: 36px; }
        .cb-field { display: grid; gap: 8px; }
        .cb-field label {
          font-family: var(--cb-sans);
          font-size: 12px;
          font-weight: 600;
          color: var(--cb-ink);
        }
        .cb-field input {
          height: 52px;
          padding: 0 16px;
          border: 1px solid var(--cb-mist);
          border-radius: 10px;
          background: #fff;
          font-family: var(--cb-sans);
          font-size: 15px;
          color: var(--cb-ink);
          box-sizing: border-box;
          outline: none;
          transition: border-color 140ms ease, box-shadow 140ms ease;
        }
        .cb-field input::placeholder { color: var(--cb-taupe); }
        .cb-field input:focus {
          border-color: var(--cb-ink);
          box-shadow: 0 0 0 3px rgba(27,25,21,0.06);
        }
        .cb-input-wrap { position: relative; }
        .cb-input-wrap input { width: 100%; padding-right: 60px; }
        .cb-show-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-family: var(--cb-sans);
          font-size: 13px;
          color: var(--cb-taupe);
          background: transparent;
          border: 0;
          cursor: pointer;
          padding: 0;
        }
        .cb-show-toggle:hover { color: var(--cb-ink); }
        .cb-err {
          font-family: var(--cb-sans);
          font-size: 12px;
          color: #B24F36;
        }
        .cb-forgot {
          font-family: var(--cb-sans);
          font-size: 13px;
          font-weight: 500;
          color: var(--cb-bronze-d);
          background: transparent;
          border: 0;
          padding: 0;
          cursor: pointer;
          justify-self: end;
        }
        .cb-forgot.center { justify-self: center; }
        .cb-forgot:hover { color: var(--cb-ink); }

        /* ── Buttons ── */
        .cb-btn {
          width: 100%;
          height: 52px;
          border-radius: 999px;
          font-family: var(--cb-sans);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: background 150ms ease, opacity 150ms ease;
          margin-top: 10px;
        }
        .cb-btn:disabled { cursor: not-allowed; opacity: 0.6; }
        .cb-btn.ink { background: var(--cb-ink); color: var(--cb-warm); border: 0; }
        .cb-btn.ink:hover:not(:disabled) { background: #322C24; }
        .cb-btn.social {
          background: var(--cb-cream);
          color: var(--cb-ink);
          border: 1px solid var(--cb-mist);
          font-size: 14px;
        }
        .cb-btn.social:hover:not(:disabled) { background: #FBF8F3; }

        /* ── Divider ── */
        .cb-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 22px 0 12px;
        }
        .cb-divider .line { flex: 1; height: 1px; background: var(--cb-mist); }
        .cb-divider .txt {
          font-family: var(--cb-sans);
          font-size: 12px;
          color: var(--cb-taupe);
        }

        /* ── Legal copy ── */
        .cb-legal {
          font-family: var(--cb-sans);
          font-size: 11px;
          color: var(--cb-taupe);
          text-align: center;
          margin-top: 22px;
          line-height: 1.6;
        }
        .cb-legal-link {
          color: var(--cb-bronze-d);
          text-decoration: none;
          font-weight: 500;
        }
        .cb-legal-link:hover { text-decoration: underline; }

        /* ── Footer link ── */
        .cb-footer-link {
          font-family: var(--cb-sans);
          font-size: 13px;
          color: var(--cb-taupe);
          text-align: center;
          margin-top: 32px;
        }
        .cb-footer-link .link {
          color: var(--cb-bronze-d);
          font-weight: 600;
          background: transparent;
          border: 0;
          padding: 0;
          cursor: pointer;
          font-size: inherit;
        }
        .cb-footer-link .link:hover { text-decoration: underline; }

        /* ── Confirm screen ── */
        .cb-confirm { text-align: center; display: flex; flex-direction: column; align-items: center; }
        .cb-confirm-title {
          font-family: var(--cb-serif);
          font-weight: 400;
          color: var(--cb-ink);
          margin: 24px 0 0;
          line-height: 1.05;
        }
        .cb-confirm-body {
          font-family: var(--cb-sans);
          font-size: 15px;
          color: var(--cb-taupe);
          margin: 12px 0 0;
          line-height: 1.6;
          max-width: 360px;
        }
        .cb-confirm-body .email { color: var(--cb-ink); }
        .cb-confirm .cb-btn { width: 100%; margin-top: 30px; max-width: 360px; }
        .cb-resend {
          font-family: var(--cb-sans);
          font-size: 13px;
          font-weight: 600;
          color: var(--cb-bronze-d);
          background: transparent;
          border: 0;
          margin-top: 16px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .cb-resend:hover:not(:disabled) { color: var(--cb-ink); }
        .cb-resend:disabled { cursor: not-allowed; opacity: 0.6; }
        .cb-different {
          font-family: var(--cb-sans);
          font-size: 13px;
          color: var(--cb-taupe);
          background: transparent;
          border: 0;
          margin-top: 8px;
          cursor: pointer;
        }
        .cb-different:hover { color: var(--cb-ink); }
        .cb-confirm-foot {
          font-family: var(--cb-sans);
          font-size: 12px;
          color: var(--cb-taupe);
          margin-top: 36px;
        }

        /* ── Native bottom-sheet shell ── */
        .cb-native-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--cb-ink);
          overflow: hidden;
        }
        .cb-native-backdrop {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 40px 24px;
        }
        .cb-native-sheet {
          flex-shrink: 0;
          background: var(--cb-cream);
          border-top-left-radius: 26px;
          border-top-right-radius: 26px;
          box-shadow: 0 -24px 60px rgba(0,0,0,0.45);
          display: flex;
          flex-direction: column;
          padding-bottom: max(28px, env(safe-area-inset-bottom));
          animation: cbSheet 360ms cubic-bezier(0.2,0.85,0.2,1);
        }
        @keyframes cbSheet {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .cb-native-handle {
          display: flex;
          justify-content: center;
          padding-top: 10px;
        }
        .cb-native-handle span {
          width: 38px;
          height: 4px;
          border-radius: 999px;
          background: #D8CFC1;
        }
        .cb-native-sheet-body { padding: 12px 28px 28px; }
        .cb-native-title {
          font-family: var(--cb-serif);
          font-weight: 400;
          font-size: 32px;
          color: var(--cb-ink);
          line-height: 1.02;
          margin: 4px 0 0;
        }
        .cb-native-sub {
          font-family: var(--cb-sans);
          font-size: 13px;
          color: var(--cb-taupe);
          margin: 8px 0 0;
        }

        /* ── Native segmented control ── */
        .cb-segment {
          display: flex;
          background: var(--cb-mist);
          border-radius: 999px;
          padding: 4px;
          margin-top: 22px;
        }
        .cb-seg {
          flex: 1;
          padding: 9px 0;
          border-radius: 999px;
          font-family: var(--cb-sans);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--cb-sub);
          background: transparent;
          border: 0;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease;
        }
        .cb-seg.active { background: var(--cb-ink); color: var(--cb-warm); }

        /* ── Native input variant ── */
        .cb-native-shell .cb-field input {
          height: 54px;
          background: #fff;
          border: 1px solid rgba(27,25,21,0.07);
          border-radius: 13px;
          box-shadow: 0 1px 2px rgba(27,25,21,0.035);
          font-size: 16px;
        }
        .cb-native-shell .cb-field label { font-weight: 500; color: var(--cb-sub); font-size: 13px; }

        /* ── Mobile-narrow web fallback ── */
        @media (max-width: 480px) {
          .cb-web-nav { padding: 0 20px; }
          .cb-web-center { padding: 36px 20px; }
          .cb-title { font-size: 36px; }
        }
      `}</style>

      {isNativeApp ? (
        <div className="cb-native-shell">
          {/* Brand backdrop above the sheet */}
          <div className="cb-native-backdrop">
            <NodeNetwork size={150} opacity={0.34} />
            <BrainWordmark size={13} color="var(--cb-warm)" />
          </div>

          {/* Sheet */}
          <div className="cb-native-sheet">
            <div className="cb-native-handle"><span /></div>
            <div className="cb-native-sheet-body">
              {mode === "reset" ? (
                <>
                  <h1 className="cb-native-title">Reset your password.</h1>
                  <p className="cb-native-sub">
                    Enter your email and we'll send you a reset link.
                  </p>
                  {renderReset()}
                </>
              ) : mode === "confirm" ? (
                renderConfirm("native")
              ) : (
                <>
                  <h1 className="cb-native-title">
                    {isSignup ? "Create your account." : "Welcome back."}
                  </h1>
                  <p className="cb-native-sub">
                    {isSignup
                      ? "Build the brain that runs your business."
                      : "Sign in to continue building your brain."}
                  </p>
                  {renderAuthForm("native")}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Web ink top nav */}
          <nav className="cb-web-nav">
            <BrainWordmark size={14} color="var(--cb-warm)" />
            <div className="cb-web-nav-actions">
              {!isConfirm && !isReset && (
                <>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => setMode("signin")}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    className="pill"
                    onClick={() => setMode("signup")}
                  >
                    Create account
                  </button>
                </>
              )}
            </div>
          </nav>

          <div className="cb-web-center">
            <div className={`cb-web-column ${isConfirm ? "confirm" : ""}`}>
              {isConfirm ? (
                renderConfirm("web")
              ) : (
                <>
                  <div className="cb-rule" />
                  <p className="cb-eyebrow">{webEyebrow}</p>
                  {webTitle && <h1 className="cb-title">{webTitle}</h1>}
                  {webSub && <p className="cb-sub">{webSub}</p>}
                  {isReset ? renderReset() : renderAuthForm("web")}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Auth;

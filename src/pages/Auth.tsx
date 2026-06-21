import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

/* ---------------- Cre8 Brain palette (matches Onboarding) ---------------- */
const C = {
  cream: "#FAF9F5",
  ink: "#1C1A17",
  gold: "#B5985A",
  goldSoft: "#D9C690",
  hairline: "rgba(28,26,23,0.10)",
  mute: "rgba(28,26,23,0.62)",
};
const fontMono = `"JetBrains Mono", ui-monospace, monospace`;
const fontSerifIt = `"Fraunces", Georgia, serif`;

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    firstName: z.string().min(1, "First name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8.1z" />
    <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.3 1.1-3.7 1.1-2.8 0-5.2-1.9-6.1-4.5H2.3v2.8A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.9 14.2a6.6 6.6 0 0 1 0-4.2V7.2H2.3a11 11 0 0 0 0 9.6l3.6-2.6z" />
    <path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 12 1 11 11 0 0 0 2.3 7.2l3.6 2.8C6.8 7.3 9.2 5.4 12 5.4z" />
  </svg>
);
const AppleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M16.365 1.43c0 1.14-.42 2.23-1.24 3.04-.83.83-2.18 1.47-3.27 1.38-.13-1.1.43-2.27 1.2-3.05.86-.86 2.34-1.5 3.31-1.37zM20.5 17.27c-.55 1.27-.81 1.83-1.51 2.95-.98 1.57-2.36 3.52-4.07 3.54-1.52.01-1.91-.99-3.97-.97-2.06.01-2.49.99-4.01.97-1.71-.02-3.02-1.78-4-3.34C.27 15.97-.04 10.84 1.95 8.04 3.4 6.04 5.7 4.86 7.86 4.86c2.2 0 3.59 1.21 5.41 1.21 1.77 0 2.85-1.21 5.4-1.21 1.92 0 3.96 1.05 5.41 2.86-4.76 2.6-3.99 9.4-3.58 9.55z" />
  </svg>
);

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  // signup stage: 1 = name/email, 2 = password confirmation
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [showReset, setShowReset] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpErrors, setSignUpErrors] = useState<{
    email?: string; password?: string; confirmPassword?: string; firstName?: string;
  }>({});

  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const surecontactFiredRef = useRef(false);

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup") setMode("signup");
    else if (tab === "signin") setMode("signin");
  }, [searchParams]);

  useEffect(() => {
    if (checkoutSuccess) toast.success("Your Pro subscription is active! Sign in to continue.");
  }, [checkoutSuccess]);

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
        supabase.functions.invoke("surecontact-webhook", {
          body: {
            action: "sync_new_signup",
            email: user.email,
            first_name: meta.given_name ?? meta.first_name ?? first,
            last_name: meta.family_name ?? meta.last_name ?? last,
          },
        }).catch(() => {});
      }
    }
    navigate("/app");
  }, [user, navigate]);

  if (user) return null;

  const validateStep1 = () => {
    try {
      z.object({
        email: z.string().email("Please enter a valid email address"),
        firstName: z.string().min(1, "First name is required"),
      }).parse({ email: signUpEmail, firstName });
      setSignUpErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const f: typeof signUpErrors = {};
        err.errors.forEach((e) => {
          const p = e.path[0] as keyof typeof signUpErrors;
          f[p] = e.message;
        });
        setSignUpErrors(f);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      signInSchema.parse({ email, password });
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const f: typeof errors = {};
        err.errors.forEach((er) => {
          if (er.path[0] === "email") f.email = er.message;
          if (er.path[0] === "password") f.password = er.message;
        });
        setErrors(f);
      }
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast.error(error.message || "Failed to sign in");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      signUpSchema.parse({ email: signUpEmail, firstName, password: signUpPassword, confirmPassword });
      setSignUpErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const f: typeof signUpErrors = {};
        err.errors.forEach((er) => {
          const p = er.path[0] as keyof typeof signUpErrors;
          f[p] = er.message;
        });
        setSignUpErrors(f);
      }
      return;
    }
    setSignUpLoading(true);
    const { error } = await signUp(signUpEmail, signUpPassword, firstName, "");
    setSignUpLoading(false);
    if (error) {
      toast.error(error.message || "Failed to create account");
      return;
    }
    toast.success("Account created successfully!");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error("Please enter your email address"); return; }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    setResetLoading(false);
    if (error) toast.error(error.message || "Failed to send reset email");
    else { toast.success("Password reset email sent!"); setShowReset(false); setResetEmail(""); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) { toast.error(result.error.message || "Google sign-in failed"); setGoogleLoading(false); return; }
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
      if (result.error) { toast.error(result.error.message || "Apple sign-in failed"); setAppleLoading(false); return; }
      if (result.redirected) return;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Apple sign-in failed");
      setAppleLoading(false);
    }
  };

  /* ---------------- Shared screen shell (matches Onboarding SetupScreen) ---------------- */
  const Shell = ({
    eyebrow, stepNum, title, hint, children, onBack,
  }: {
    eyebrow: string; stepNum: 1 | 2; title: React.ReactNode; hint: string;
    children: React.ReactNode; onBack?: () => void;
  }) => (
    <div style={{ background: C.cream, color: C.ink, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${C.hairline}` }}>
        {onBack ? (
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink }} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        ) : <div style={{ width: 20 }} />}
        <div style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: 2, color: C.mute, textTransform: "uppercase" }}>
          Step {stepNum} of 2
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 24, maxWidth: 640, margin: "0 auto", width: "100%" }}>
        <div style={{ width: 40, height: 1, background: C.ink, marginBottom: 20 }} />
        <div style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: 2, color: C.mute, textTransform: "uppercase", marginBottom: 16 }}>{eyebrow}</div>
        <h1 style={{ fontFamily: fontMono, fontWeight: 500, fontSize: "clamp(34px,5vw,52px)", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 16 }}>{title}</h1>
        <p style={{ color: C.mute, fontSize: 15, lineHeight: 1.6, marginBottom: 32, fontFamily: fontMono }}>{hint}</p>

        {children}
      </div>
    </div>
  );

  const Dots = ({ active }: { active: 1 | 2 }) => (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 28 }}>
      {[1, 2].map((i) => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: 99, background: i === active ? C.gold : C.hairline }} />
      ))}
    </div>
  );

  const inputBase: React.CSSProperties = {
    width: "100%", background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 14,
    padding: "18px 20px", fontFamily: fontMono, fontSize: 16, color: C.ink, outline: "none",
  };
  const errStyle: React.CSSProperties = { fontFamily: fontMono, fontSize: 12, color: "#B25438", marginTop: 6 };
  const labelStyle: React.CSSProperties = { fontFamily: fontMono, fontSize: 11, letterSpacing: 2, color: C.mute, textTransform: "uppercase", marginBottom: 8, display: "block" };

  const primaryBtn = (isLast: boolean, disabled: boolean): React.CSSProperties => ({
    marginTop: 24, width: "100%", background: isLast ? C.gold : C.ink,
    color: isLast ? C.ink : C.cream, border: "none", padding: "18px 24px",
    borderRadius: 999, fontFamily: fontMono, fontSize: 15, fontWeight: 600,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
  });

  const socialBtn: React.CSSProperties = {
    flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "14px 16px", background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 999,
    fontFamily: fontMono, fontSize: 13, fontWeight: 500, color: C.ink, cursor: "pointer",
  };

  const linkBtn: React.CSSProperties = {
    background: "none", border: "none", color: C.gold, fontFamily: fontMono, fontSize: 13,
    cursor: "pointer", padding: 0, textDecoration: "none",
  };

  /* ---------------- Reset password (uses same shell, treated as step 1) ---------------- */
  if (showReset) {
    return (
      <Shell
        eyebrow="Reset access"
        stepNum={1}
        title="Forgot your password?"
        hint="Enter your email and we'll send a secure link to reset it."
        onBack={() => setShowReset(false)}
      >
        <form onSubmit={handleReset}>
          <label style={labelStyle}>Email</label>
          <input
            autoFocus type="email" value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="you@example.com" style={inputBase}
          />
          <Dots active={1} />
          <button type="submit" disabled={resetLoading || !resetEmail.trim()} style={primaryBtn(false, resetLoading || !resetEmail.trim())}>
            {resetLoading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <>Send reset link <ArrowRight size={16} /></>}
          </button>
        </form>
      </Shell>
    );
  }

  /* ---------------- Sign in (single screen, step 1) ---------------- */
  if (mode === "signin") {
    return (
      <Shell
        eyebrow="Welcome back"
        stepNum={1}
        title="Sign in to your brain."
        hint="Pick up right where you left off. Your documents, briefs, and progress are waiting."
      >
        <form onSubmit={handleSignIn}>
          <label style={labelStyle}>Email</label>
          <input
            autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" autoComplete="email" style={inputBase}
          />
          {errors.email && <div style={errStyle}>{errors.email}</div>}

          <div style={{ height: 16 }} />

          <label style={labelStyle}>Password</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password" autoComplete="current-password" style={inputBase}
          />
          {errors.password && <div style={errStyle}>{errors.password}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button type="button" style={linkBtn} onClick={() => setShowReset(true)}>Forgot password?</button>
          </div>

          <Dots active={1} />
          <button type="submit" disabled={loading} style={primaryBtn(false, loading)}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <>Sign in <ArrowRight size={16} /></>}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.hairline }} />
          <span style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: 2, color: C.mute, textTransform: "uppercase" }}>or</span>
          <div style={{ flex: 1, height: 1, background: C.hairline }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={handleGoogle} disabled={googleLoading} style={socialBtn}>
            {googleLoading ? <Loader2 size={14} className="animate-spin" /> : <GoogleIcon />} Google
          </button>
          <button type="button" onClick={handleApple} disabled={appleLoading} style={socialBtn}>
            {appleLoading ? <Loader2 size={14} className="animate-spin" /> : <AppleIcon />} Apple
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontFamily: fontMono, fontSize: 13, color: C.mute }}>
          New here?{" "}
          <button type="button" style={{ ...linkBtn, color: C.gold }} onClick={() => { setMode("signup"); setSignupStep(1); }}>
            Create an account
          </button>
        </p>
      </Shell>
    );
  }

  /* ---------------- Sign up step 1 ---------------- */
  if (signupStep === 1) {
    return (
      <Shell
        eyebrow="Let's start"
        stepNum={1}
        title="Create your account."
        hint="Tell us who you are. This is how your brain will greet you and sign every document it builds."
      >
        <form onSubmit={(e) => { e.preventDefault(); if (validateStep1()) setSignupStep(2); }}>
          <label style={labelStyle}>First name</label>
          <input
            autoFocus value={firstName} onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g., Tambra" autoComplete="given-name" style={inputBase}
          />
          {signUpErrors.firstName && <div style={errStyle}>{signUpErrors.firstName}</div>}

          <div style={{ height: 16 }} />

          <label style={labelStyle}>Email</label>
          <input
            type="email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)}
            placeholder="you@example.com" autoComplete="email" style={inputBase}
          />
          {signUpErrors.email && <div style={errStyle}>{signUpErrors.email}</div>}

          <Dots active={1} />
          <button
            type="submit" disabled={!firstName.trim() || !signUpEmail.trim()}
            style={primaryBtn(false, !firstName.trim() || !signUpEmail.trim())}
          >
            Next <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.hairline }} />
          <span style={{ fontFamily: fontMono, fontSize: 11, letterSpacing: 2, color: C.mute, textTransform: "uppercase" }}>or</span>
          <div style={{ flex: 1, height: 1, background: C.hairline }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={handleGoogle} disabled={googleLoading} style={socialBtn}>
            {googleLoading ? <Loader2 size={14} className="animate-spin" /> : <GoogleIcon />} Google
          </button>
          <button type="button" onClick={handleApple} disabled={appleLoading} style={socialBtn}>
            {appleLoading ? <Loader2 size={14} className="animate-spin" /> : <AppleIcon />} Apple
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontFamily: fontMono, fontSize: 13, color: C.mute }}>
          Already have an account?{" "}
          <button type="button" style={{ ...linkBtn, color: C.gold }} onClick={() => setMode("signin")}>
            Sign in
          </button>
        </p>
      </Shell>
    );
  }

  /* ---------------- Sign up step 2 (confirmation) ---------------- */
  return (
    <Shell
      eyebrow="Almost there"
      stepNum={2}
      title={<>Set a password, <em style={{ fontFamily: fontSerifIt, fontStyle: "italic", color: C.goldSoft }}>{firstName || "friend"}</em>.</>}
      hint="Choose something memorable. You'll use this to unlock your brain across web and mobile."
      onBack={() => setSignupStep(1)}
    >
      <form onSubmit={handleSignUp}>
        <label style={labelStyle}>Password</label>
        <input
          autoFocus type="password" value={signUpPassword}
          onChange={(e) => setSignUpPassword(e.target.value)}
          placeholder="At least 8 characters" autoComplete="new-password" style={inputBase}
        />
        {signUpErrors.password && <div style={errStyle}>{signUpErrors.password}</div>}

        <div style={{ height: 16 }} />

        <label style={labelStyle}>Confirm password</label>
        <input
          type="password" value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat password" autoComplete="new-password" style={inputBase}
        />
        {signUpErrors.confirmPassword && <div style={errStyle}>{signUpErrors.confirmPassword}</div>}

        <Dots active={2} />
        <button
          type="submit"
          disabled={signUpLoading || !signUpPassword.trim() || !confirmPassword.trim()}
          style={primaryBtn(true, signUpLoading || !signUpPassword.trim() || !confirmPassword.trim())}
        >
          {signUpLoading
            ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
            : <><Sparkles size={16} /> Build my brain</>}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 24, fontFamily: fontMono, fontSize: 12, color: C.mute, lineHeight: 1.6 }}>
        By continuing, you agree to our{" "}
        <a href="https://launchely.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: C.ink, textDecoration: "underline" }}>Terms</a>{" "}
        and{" "}
        <a href="https://launchely.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: C.ink, textDecoration: "underline" }}>Privacy Policy</a>.
      </p>
    </Shell>
  );
};

export default Auth;



## Rebuild `/auth` to match the uploaded design + add Google sign-in

Rebuild `src/pages/Auth.tsx` so it matches the uploaded `Launchely_Design_System_Auth.html` exactly (cream brand-side, pill tabs, social row, editorial inputs, terracotta CTA, Pro upsell). Add Google sign-in / sign-up via Lovable Cloud's managed OAuth. Apple is intentionally omitted. All existing functionality (email/password sign-in + sign-up, validation, password reset, checkout success toast, `?tab=signup` deep-link, post-auth redirect) is preserved.

---

### 1. Visual rebuild — exact match to the mockup

Replace the current two-panel auth screen with this layout, using the existing `--paper-50/100/200`, `--ink-800/900`, `--terracotta-500`, `--border-hairline`, `--font-display`, `--font-body` tokens (already defined in `landing-theme.css`). The page is wrapped in `<div className="app-cream">` so the tokens apply.

**Left brand side** (`.brand-side`, `1fr` column, hidden under 920px)
- Cream `--paper-100` background, hairline right border.
- Decorative terracotta radial-gradient blob bottom-right.
- Top row: `Launchely.` wordmark (Playfair italic 22px, terracotta period) + `← Back to home` link → `/`.
- Body:
  - Eyebrow (terracotta uppercase tracked): `New here` (signup mode) / `Welcome back` (signin mode).
  - Headline (Playfair 56px, line-height 1.02, `-0.025em`):
    - signup: `Your next launch starts here.` (`here.` italic, terracotta).
    - signin: `Ready to keep going, friend?` (`friend?` italic, terracotta).
  - Sub copy (16px, 1.6, max-width 400px) — mode-aware copy from the mockup.
  - Pull-quote card: white, hairline border, 14px radius, terracotta 3px left bar, Playfair italic 17px quote + 12px attribution.
- Footer: 4 gradient avatar dots + `Already helping 1,200+ coaches, creators, and small teams launch.`

**Right form side** (`.form-side`, `1.1fr` column, full width on mobile)
- `--paper-50` background, padding `56px 72px` desktop / `40px 24px` mobile, centered card max-width 460px.
- **Pill tab switcher**: 1fr/1fr grid in a 999px `--paper-200` capsule, active tab = white pill with subtle shadow + `--ink-900` text.
- **Form title** (Playfair 28px, weight 500): `Create your free account.` / `Welcome back.`
- **Sub** (14px muted): `No credit card. Five minutes to your first launch brief.` / `Sign in to continue your launch.`
- **Social row** (1fr/1fr grid): single `Continue with Google` button (Apple removed → Google button spans full width via `grid-template-columns: 1fr`). White bg, hairline border, 10px radius, hover border `--ink-900`. Multicolor Google `<svg>` from the mockup.
- **`OR USE EMAIL` divider**: hairline lines + tracked uppercase label.
- **Sign-up form** (when active):
  - Two-column row: First name + Last name (User icon left).
  - Email (Mail icon).
  - Password (Lock icon, "At least 8 characters").
  - Confirm password (Lock icon, "Repeat password").
  - All inputs: 11×14 padding, 40px left padding for icon, 10px radius, hairline border, focus = terracotta border + 3px terracotta-12% ring.
  - **CTA**: full-width terracotta pill button `Create free account →` (14.5px, 999px radius, terracotta hover `#B24F36`).
  - **Pro upsell**: amber gradient card (`#F8E9C5 → #F2D9A8`), `Want Pro — AI Studio + unlimited projects? Upgrade at checkout.` + ink-900 pill `Subscribe` link → `/checkout`.
- **Sign-in form** (when active):
  - Email + Password fields (same input style).
  - Helper row: `Keep me signed in` checkbox (terracotta accent) + `Forgot password?` terracotta link → toggles existing reset flow.
  - **CTA**: full-width terracotta pill `Sign in →`.
- **Legal**: 12px muted centered: `By continuing, you agree to our Terms of Service and Privacy Policy.` (existing copy).

**Reset password view**
- Stays in the form-side column (hides tabs/social/forms when active).
- Same input styling, terracotta CTA `Send reset link`, `Back to sign in` ghost link. Functionality unchanged (uses `supabase.auth.resetPasswordForEmail`).

---

### 2. Google sign-in / sign-up

Add managed Google OAuth via Lovable Cloud. This requires the `@/integrations/lovable` module — it is not currently in the project, so we'll generate it via the Configure Social Login tool when implementation begins (no manual edits to that folder).

**On the `Continue with Google` button click:**
```ts
const result = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: `${window.location.origin}/projects`,
});
if (result.error) { toast.error(result.error.message); return; }
if (result.redirected) return; // browser navigates to Google
// tokens received → AuthContext's onAuthStateChange picks it up and redirects
```

- Same button is used for sign-in and sign-up (Google handles both — new accounts auto-create).
- The existing `AuthContext` `onAuthStateChange` listener will receive the `SIGNED_IN` event and trigger the standard post-auth flow (subscription check, navigate to most-recent project). No `AuthContext` changes required.
- Welcome email + SureContact sync on first Google signup: handled out-of-band by the existing `handle_new_user` DB trigger (creates the profile). To match the email/password signup path, add a one-shot effect in `Auth.tsx` that — when a brand-new user lands back on `/auth` after OAuth — fires `surecontact-webhook` `sync_new_signup` once. (Detected by checking `created_at === last_sign_in_at` on the user.)

**Apple**: not added. The single Google button takes the full social-row width.

---

### 3. State, validation, behavior

- Tab state: `useState<"signin" | "signup">(defaultTab)`. Driven by `?tab=signup` URL param (existing behavior).
- Mode-aware brand copy (eyebrow, headline, sub) reads from `mode`.
- Existing zod schemas (`signInSchema`, `signUpSchema`) reused exactly — same validation + error rendering under each field.
- Existing handlers (`handleSignIn`, `handleSignUp`, `handleResetPassword`) unchanged in logic; only re-themed.
- Existing `checkout=success` toast preserved.
- Existing `if (user) navigate("/app")` redirect preserved.
- "Keep me signed in" checkbox is cosmetic for parity with the mockup (Supabase JS already persists the session via `localStorage` — toggling this off is not wired since it would require swapping client storage at runtime; we keep it visually present, default-checked, no-op).

---

### 4. Files

**Modified**
- `src/pages/Auth.tsx` — full visual rewrite, Google button wired via `lovable.auth.signInWithOAuth`, post-OAuth SureContact one-shot. All existing email/password handlers, validation, reset flow, redirect, and `?tab=signup` deep-link preserved.

**Generated (by Configure Social Login tool, do not hand-edit)**
- `src/integrations/lovable/` module + `@lovable.dev/cloud-auth-js` package.

**Unchanged**
- `src/contexts/AuthContext.tsx` — `onAuthStateChange` handles the OAuth return automatically.
- `src/components/landing/landing-theme.css` — all required tokens already exist.
- All other routes, AuthContext methods, post-auth navigation, subscription checks.

### Out of scope

- Apple sign-in (explicitly skipped).
- Sidebar / topbar / dashboard (already redone).
- "Keep me signed in" runtime behavior — checkbox is cosmetic.


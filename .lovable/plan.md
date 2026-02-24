

# Pre-Launch Feature Gap Analysis for Launchely

## Critical Issues (Must Fix Before Launch)

### 1. Stale OG Image and Canonical URL
The `index.html` file has an OG image pointing to `lovable.dev/opengraph-image-p98pqg.png` (a generic Lovable placeholder) and the canonical URL is set to `https://coachhub.app` -- an old brand name. The Twitter handle is also `@CoachHub`. These need to be updated to use Launchely's actual branding, domain, and social handles.

**Fix:** Update `index.html` with correct OG image URL (host on your own domain), canonical URL (`https://launch-wingman-ai.lovable.app` or your custom domain), and Twitter handle.

---

### 2. No Error Boundary
There is no React Error Boundary anywhere in the app. If any component throws an unhandled error, the entire app will white-screen with no recovery path. This is a critical gap for a production app.

**Fix:** Add a global `<ErrorBoundary>` component wrapping the app in `App.tsx` that catches render errors and shows a friendly "Something went wrong" screen with a "Reload" button.

---

### 3. Duplicate Sign-Up Logic (Auth Page vs AuthContext)
The Auth page (`Auth.tsx`) has its own `handleSignUp` that calls `supabase.auth.signUp()` directly and creates a profile manually. Meanwhile, `AuthContext.signUp()` also calls `supabase.auth.signUp()` with different logic (welcome email, UTM tracking, SureContact sync, GA tracking, admin notification). The Auth page's signup **skips all of that**. This means users signing up via `/auth` won't get:
- Welcome email
- Activity tracking
- UTM campaign attribution
- SureContact sync
- Google Analytics signup tracking

**Fix:** Refactor `Auth.tsx` to use `AuthContext.signUp()` instead of directly calling supabase.auth.signUp.

---

### 4. Missing `sitemap.xml`
There is no `sitemap.xml` in the `public/` folder. This hurts SEO for the landing page, feature pages, blog, pricing, and other public routes.

**Fix:** Create a `public/sitemap.xml` listing all public routes.

---

### 5. Leaked Password Protection Disabled
The database linter flagged that leaked password protection is currently disabled. This means users can sign up with passwords that have been exposed in data breaches.

**Fix:** Enable leaked password protection in the authentication settings.

---

### 6. No CAPTCHA or Bot Protection on Public Forms
The contact form (`Contact.tsx`) and signup forms have no CAPTCHA, honeypot fields, or rate limiting on the client side. These are vulnerable to spam bots.

**Fix:** Add a honeypot field to the contact form at minimum. Consider adding rate limiting on the edge function side for `send-contact-form`.

---

## High Priority (Should Fix Before Launch)

### 7. Marketing Hub Visible to All Pro Users
The Marketing Hub section (Campaigns, Analytics, UTM Builder) is gated behind `isPro` in the sidebar, meaning any paying Pro user can see admin-only marketing tools. The routes themselves are behind `ProtectedAdminRoute`, but the sidebar items are misleadingly visible to non-admin Pro users who will get a permissions error when clicking them.

**Fix:** Gate Marketing Hub sidebar section behind `hasAdminAccess` instead of `isPro`.

---

### 8. Many "Coming Soon" Placeholder Nav Items
The Marketing Hub sidebar shows 5 disabled placeholder items: Content Engine, Experiments, Automations, Integrations, Library. These show "Coming soon" tooltips. For a public launch, having this many placeholders can make the product feel incomplete.

**Fix:** Either hide these items entirely for launch, or reduce to 1-2 that are actually planned next.

---

### 9. No Mobile Responsiveness Verification
The sidebar uses `useIsMobile()` for Sheet-based mobile nav, but there's no evidence of systematic mobile testing across all pages. The content planner weekly view, campaign detail tabs, and dashboard may have overflow issues on small screens.

**Fix:** Test all major flows on 375px viewport width and fix any overflow/layout issues.

---

### 10. Free Plan Sign-Up Path Doesn't Create a Profile Correctly
When a user signs up via Auth.tsx, the code manually inserts a profile but does NOT pass `first_name` and `last_name` in the auth metadata (unlike `AuthContext.signUp()`). The `handle_new_user` database trigger also creates a profile from `raw_user_meta_data`, potentially causing a duplicate insert conflict.

**Fix:** Consolidate signup to use `AuthContext.signUp()` (fixes issue #3) and ensure metadata is passed consistently.

---

### 11. No 404 Back-to-App Link for Logged-In Users
The `NotFound` page only has a "Return to Home" link pointing to `/`. For logged-in users, this should point to `/app` instead.

**Fix:** Check auth state in NotFound and conditionally link to `/app`.

---

## Medium Priority (Nice to Have for Launch)

### 12. Missing Loading States on Some Pages
While some pages use Skeletons (Insights, PhaseSnapshot), others like the main dashboard rely on spinners only. Consistent skeleton loading would improve perceived performance.

### 13. No Password Reset Completion Handler
The auth page handles sending reset emails but there's no dedicated handler for when users click the reset link and need to set a new password. The `redirectTo` is set to `/auth?reset=true` but there's no code checking for that parameter to show a password update form.

### 14. `robots.txt` Allows Everything
The robots.txt allows all bots to crawl all routes, including authenticated routes like `/projects/*`, `/settings`, `/admin/*`. While these require auth to access, they shouldn't be crawled.

**Fix:** Add `Disallow` rules for `/projects/`, `/settings`, `/admin/`, `/app`, `/onboarding`, `/content-vault`.

### 15. No Cookie Consent Banner
There are GTM and Sigmize scripts loading on every page. For GDPR compliance (especially if targeting EU users), a cookie consent banner may be needed.

### 16. Social Platform Gating
Instagram, Facebook, Threads, and TikTok integrations are gated to admin-only (`GATED_PLATFORMS` in Settings.tsx). If these are intended for launch, the gates need to be removed. If they're not ready, they should be hidden entirely rather than shown as locked.

---

## Summary of Recommended Actions

| Priority | Issue | Effort |
|----------|-------|--------|
| Critical | Fix OG image, canonical URL, Twitter handle | Low |
| Critical | Add Error Boundary | Low |
| Critical | Fix duplicate signup logic (Auth.tsx vs AuthContext) | Medium |
| Critical | Create sitemap.xml | Low |
| Critical | Enable leaked password protection | Low |
| Critical | Add bot protection to contact form | Low |
| High | Gate Marketing Hub to admins only in sidebar | Low |
| High | Remove or reduce "Coming Soon" placeholders | Low |
| High | Mobile responsiveness testing | Medium |
| High | Fix profile creation on signup | Medium |
| High | Fix 404 page for logged-in users | Low |
| Medium | Consistent loading skeletons | Medium |
| Medium | Password reset completion flow | Medium |
| Medium | Update robots.txt disallow rules | Low |
| Medium | Cookie consent banner | Medium |
| Medium | Clean up gated social platforms | Low |

---

## Technical Details

**Files requiring changes:**
- `index.html` -- OG tags, canonical, twitter handle
- `src/App.tsx` -- Add ErrorBoundary wrapper
- `src/pages/Auth.tsx` -- Use AuthContext.signUp instead of direct supabase call
- `src/components/layout/ProjectSidebar.tsx` -- Gate Marketing Hub behind admin access
- `src/pages/NotFound.tsx` -- Context-aware home link
- `public/robots.txt` -- Add Disallow rules
- `public/sitemap.xml` -- New file
- `src/pages/Contact.tsx` -- Add honeypot field
- New file: `src/components/ErrorBoundary.tsx`


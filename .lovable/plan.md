## Goal
In native shells (Capacitor / AppMySite / Mobiloud), hide the in-app top bar and the mobile bottom tab bar so the native chrome is the only navigation. Also stop iOS from zooming the page when tapping into form fields (notably on `/auth`).

## Changes

### 1. Hide the TopBar on native (mobile only)
`src/components/layout/TopBar.tsx`
- Import `useIsNativeApp`.
- If `isNative && isMobile`, return `null`. (Desktop preview/web behavior is unchanged; native apps are mobile-only.)

This removes the bar across every screen wrapped in `ProjectLayout` / `AdminLayout` when running in AppMySite, Mobiloud, or Capacitor.

### 2. Make `MobileTabBar` self-hide on native
`src/components/planner/mobile/MobileTabBar.tsx`
- Inside the component, call `useIsNativeApp()` and `return null` when native.

`MobileDashboard` and `MobilePlanner` already gate it, but a defensive guard inside the component itself catches any other current/future render sites and matches the user's report that it's still showing.

### 3. Prevent iOS input-zoom
Two complementary fixes:

a. `index.html` viewport meta — add `viewport-fit=cover` and keep `initial-scale=1`. (Do not add `user-scalable=no` — bad for accessibility and not needed once fonts are sized correctly.)

b. `src/index.css` — add a global rule so all form controls render at ≥16px on small screens, which is what stops iOS Safari / WKWebView from auto-zooming on focus:

```css
@media (max-width: 768px) {
  input, select, textarea {
    font-size: 16px;
  }
}
```

This fixes the `/auth` sign-in fields and every other form in the app without changing desktop typography.

## Files touched
- `src/components/layout/TopBar.tsx` — early return on native+mobile
- `src/components/planner/mobile/MobileTabBar.tsx` — early return on native
- `src/index.css` — mobile input font-size rule
- `index.html` — minor viewport meta tweak

## Out of scope
- No changes to `ProjectLayout` / `AdminLayout` structure (TopBar handles its own visibility).
- No changes to the FAB or safe-area padding (already handled via `env(safe-area-inset-*)`).

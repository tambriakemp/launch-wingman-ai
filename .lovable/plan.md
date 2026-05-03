## Goal

On phones, the `/planner` page should look exactly like the attached `MobileTodo.jsx` mock — large editorial "To do." title, segmented Open/Mine/Today/Done filter, horizontal Spaces chips, terracotta "overdue" callout, grouped white card sections with circular checkboxes and swipe-to-act, terracotta FAB, and a 5-tab bottom bar (Today / Plan / Craft / Library / Me). Desktop (`md+`) is unchanged. When the app is running inside Capacitor (native iOS/Android), the bottom tab bar is hidden so the device's own native nav is used.

## Scope

- Planner page (`/planner` and `/planner/tasks`) only. Other pages keep current responsive behavior.
- Wired to real Supabase data already loaded in `Planner.tsx` (tasks, spaces, sections by Overdue / Today / This week).
- Tap a row → opens existing `PlannerTaskDialog`. FAB → opens same dialog (new task).
- Swipe-to-act and AI composer sheet are visual / interactive shells that reuse existing handlers (toggle complete, delete). The "AI parse" composer copy is shown but submits via the standard dialog for now (no new AI endpoint).

## Files to add

1. `src/components/planner/mobile/MobilePlanner.tsx` — port of `MobileTodo.jsx` to TSX + Tailwind/inline styles, fed real data.
   - Subcomponents inlined: `MTNavBar`, `MTSegmented`, `MTSpaceChip`, `MTOverdueCard`, `MTSection`, `MTTaskRow` (with swipe gesture using touch events), `MTFAB`, `MTTabBar`.
   - Sections built from `tasks`: Overdue (due_at < today & !done), Today (due today & !done), This week (rest of ISO week & !done). Counts come from the same arrays.
   - Filter chips (Open/Mine/Today/Done) filter the same lists client-side.
   - Spaces chips use `usePlannerSpaces()` data with task counts; clicking sets `selectedSpaceId`.
   - Checkbox calls existing `onToggleComplete`. Swipe-left reveals green check (complete) + terracotta trash (delete) actions.
2. `src/components/planner/mobile/MobileTabBar.tsx` — 5-icon bottom nav. Routes:
   - Today → `/dashboard`, Plan → `/planner` (active), Craft → `/marketing-hub`, Library → `/content-vault`, Me → `/settings`.
3. `src/hooks/useIsNativeApp.ts` — returns `true` when `window.Capacitor?.isNativePlatform?.()` is true (safe-checked, SSR-safe). Used to hide the custom tab bar on native.

## Files to edit

- `src/pages/Planner.tsx`
  - On `<md` viewports render `<MobilePlanner …/>` instead of the current desktop chrome (header strip, week pill, view toggle, week board / list / month).
  - Pass through: `tasks`, `spaces`, `selectedSpaceId`, `setSelectedSpaceId`, `handleEditTask`, `handleToggleComplete`, `handleDeleteTask`, `handleAddTask`.
  - Keep `PlannerTaskDialog` mounted (shared between mobile & desktop).
- `src/components/layout/ProjectLayout.tsx`
  - When the route is `/planner*` AND viewport is mobile AND not native, add bottom padding so content clears the 64px tab bar; otherwise no change. (Tab bar itself is rendered inside `MobilePlanner` so layout stays simple.)
- `src/components/layout/TopBar.tsx` (read-only check first) — hide the existing mobile top bar on `/planner` so the native-style large title isn't doubled up.

## Design fidelity

- Cream background `#FBF7F1`, ink `#1F1B17`, terracotta `#C65A3E` (already in palette via `--paper-100`, `--ink-900`, `--terracotta-500`).
- Headlines in Fraunces italic (already loaded). Body in `-apple-system, "SF Pro Text", system-ui`.
- Card sections: white, `rounded-2xl`, subtle shadow, hairline divider at `marginLeft: 52px`.
- Status pills (`IN PROGRESS`, `BLOCKED`, etc.) only shown when status ≠ TO DO/DONE.
- FAB: 56×56 terracotta, fixed `right:18, bottom:92` (above tab bar) — `bottom:24` when native (no tab bar).
- Sticky nav bar fades in title + adds blur when scrolled (scroll listener on the scroller div).
- Safe-area insets respected on tab bar (`env(safe-area-inset-bottom)`).

## Native detection

```ts
// src/hooks/useIsNativeApp.ts
export function useIsNativeApp() {
  const [isNative, setIsNative] = useState(false);
  useEffect(() => {
    const cap = (window as any).Capacitor;
    setIsNative(!!cap?.isNativePlatform?.());
  }, []);
  return isNative;
}
```

In `MobilePlanner`: `{!isNative && <MobileTabBar active="plan" />}`.

## Out of scope (this pass)

- Implementing AI natural-language task parsing in the add sheet (uses existing dialog instead).
- Applying the iOS treatment to other pages (Dashboard, Vault, etc.) — only Planner per request.
- Capacitor project bootstrap (`npx cap init`, native projects). The native-detection hook is forward-compatible; setup is a separate task when you're ready.

## Verification

- Resize preview to 390×844 on `/planner`: matches the "At rest · large title" artboard.
- Scroll the list: top nav bar gains blur + shows "To do" inline title.
- Swipe a row left: reveals green check + red trash actions.
- Tap FAB: existing task dialog opens.
- Resize to ≥768px: original desktop calendar/week board returns unchanged.

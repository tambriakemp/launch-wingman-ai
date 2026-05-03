# Mobile Dashboard Redesign

Apply the attached `MobileDashboard.jsx` design to the project's `/projects/:id/dashboard` route on mobile, using the same native-vs-web pattern already in `MobilePlanner` (no `MobileTabBar` when running inside a Capacitor native shell).

## Approach

1. **Create `src/components/dashboard/mobile/MobileDashboard.tsx`**
   Faithful port of the uploaded `MobileDashboard.jsx`, using lucide-react icons in place of the inline SF SVGs, and our existing semantic tokens where reasonable. Sections, in order:
   - Sticky collapsing nav (italic Fraunces "Today" appears on scroll, bell + avatar pill)
   - Greeting block (uppercase date, large serif greeting with terracotta first name, project status pill)
   - `NextStepHero` — cream gradient card with drag handle, eyebrow, serif headline, dark "Start this step" CTA, time + AI hints
   - `PhaseCarousel` — horizontal snap of 6 phase cards (active = ink, done = check, others = white)
   - `TodayWidget` — two stat tiles (Due today / Upcoming) tapping through to `/planner`
   - `UpcomingList` — inset white card with date column, title, type dot
   - `CheckInBanner` — warm gold banner with mic icon and Start button
   - `AINudge` — dark inverted card with terracotta glow
   - "Feeling stuck?" footer
   - Terracotta FAB (bottom-right) → `/planner`
   - `<MobileTabBar active="home" />` rendered **only when `useIsNativeApp()` is false**, mirroring the planner pattern.

2. **Wire data in `FunnelOverviewContent.tsx`**
   Add `useIsMobile()` at the top. When mobile and `dashboardViewType === "in_progress"`, render `<MobileDashboard … />` with the props it already computes (`nextBestTask`, `activePhase`, `phaseStatuses`, `activePhasePct`, `stepIndex`, `stepTotal`, `todayPlannerCount`, `upcomingPlannerCount`, derived `upcomingContent`, `profile.first_name`, `project.name`, `projectState`) plus `onStartCheckIn={() => setCheckInOpen(true)}` and `onStuck={() => setStuckModalOpen(true)}`. Continue to render the existing `CheckInFlow` and `StuckHelpDialog` Suspense blocks below so dialogs work on mobile too.
   The paused/completed/launched lifecycle branches stay on the existing desktop views (they already read fine on mobile and aren't covered by the mockup).

3. **Strip extra page chrome on mobile**
   In `ProjectLayout.tsx` the `<main>` has `px-2.5 py-4`. The new mobile dashboard is `position: fixed` and full-bleed, so the surrounding padding/topbar is fine — `MobileDashboard` overlays it. No layout changes needed beyond ensuring it sits above the sidebar trigger (z-index 30 already matches planner).

## Native-vs-web rule

Same as planner:
```tsx
{!isNative && <MobileTabBar active="home" />}
```
And FAB / scroller bottom padding switches: `isNative ? 24 : 92` for FAB, `isNative ? 24 : 88` for scroller.

## Files

- **New:** `src/components/dashboard/mobile/MobileDashboard.tsx`
- **Edit:** `src/pages/project/plan/FunnelOverviewContent.tsx` — add `useIsMobile` branch returning `<MobileDashboard … />` for the in-progress view
- **No edits** to `MobileTabBar`, `useIsNativeApp`, or shared dashboard components

## Out of scope

- No backend / schema changes
- Desktop dashboard untouched
- Notifications bell is visual only (no panel wired yet)

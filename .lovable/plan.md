

## Dashboard cleanup, perf, and timeline polish

Four small focused changes — no data-shape, route, or schema changes.

### 1. Remove MemoryReviewBanner & PhaseCelebrationCard

Both are dashboard-only — not tied to anything else functional.
- `MemoryReviewBanner` is purely a "post-relaunch reminder" UI shown above the greeting. It reads from `project_memory` (used elsewhere — table stays). The `MemoryReviewSheet` it opens is **only** opened from this banner, so it goes too. The `useMemoryReview` hook isn't used anywhere else either.
- `PhaseCelebrationCard` is purely a celebration card shown when a phase completes. The `dismissed_celebrations` profile field, the load/dismiss effects, and the `mostRecentlyCompletedPhase` calculation also become dead code on the dashboard. The "Planning complete" / `PhaseCompleteCard` (the small left-column card with the moss check pill) **stays** — it's a different component and still gives a sense of progress.

**Files removed:**
- `src/components/relaunch/MemoryReviewBanner.tsx`
- `src/components/relaunch/MemoryReviewSheet.tsx`
- `src/hooks/useMemoryReview.ts`
- `src/components/dashboard/PhaseCelebrationCard.tsx`

**Files updated:**
- `src/components/relaunch/index.ts` — drop the two exports
- `src/components/dashboard/index.ts` — drop `PhaseCelebrationCard`
- `src/pages/project/plan/FunnelOverviewContent.tsx` — remove imports, JSX, the `dismissedPhases` state, the load `useEffect`, the `handleDismissCelebration` callback, and the dismissed-celebrations profile read/write

### 2. Dashboard performance cleanup

The dashboard is slow because it runs many serial Supabase queries on first paint and imports a lot of unused code. Plan:

- **Parallelize the 5 dashboard queries** by giving them all `staleTime: 60_000` (so navigation back doesn't refetch) and `refetchOnWindowFocus: false`. They already start in parallel; this fixes the "every tab-back is a refetch" stall.
- **Remove the eager profile-load `useEffect`** (replaced by deletion above) — one fewer round-trip on mount.
- **Delete unused dashboard components** that are exported but never imported anywhere (confirmed via project search):
  - `src/components/dashboard/StuckHelpCard.tsx` (only `StuckHelpDialog` is used)
  - `src/components/dashboard/DailyMotivationCard.tsx`
  - `src/components/dashboard/ProgressSnapshotCard.tsx`
  - `src/components/dashboard/LaunchSnapshotCard.tsx` (replaced by inline `YourLaunchCard`)
  - `src/components/dashboard/index.ts` — drop their exports
- **Lazy-load the `CheckInFlow` dialog** (`React.lazy` + `Suspense`) so the heavy check-in modal isn't in the dashboard's first JS chunk; only loads when the user clicks "Start check-in".
- **Lazy-load the `StuckHelpDialog`** the same way.
- **Trim the snapshot query**: the `dashboard-snapshot-mini` query already only fetches what it needs; keep as-is but limit `upcoming-content` query select to fewer columns (`title, content_type, scheduled_at` only — drop `scheduled_platforms` since it isn't displayed).

Result: smaller dashboard JS chunk, fewer mounted-but-hidden subtrees, no refetch flicker on tab-focus.

### 3. "Today" card — add Planner link to Due today

In `TodayStatsCard` (inside `FunnelOverviewContent.tsx`), under the "Due today" row, add a small terracotta `View Planner →` link styled identically to the existing `Go to Planner →` link in the Content row. Routes to `/planner`. The huge numeral stays linked too.

### 4. Launch Timeline — drop total + swap week labels for phase icons

In `LaunchTimelineEditorial`:
- Remove the right-side meta block ("`6–7 weeks total · ends May 28`") entirely. Keep the left-side eyebrow + `Halfway through {Phase}.` headline.
- Drop the `weekCursor` / `PHASE_WEEK_ESTIMATES` / `totalWeeks` logic.
- Replace the mono `W 1` / `W 1–2` label in each phase card with a small phase icon (16×16, terracotta when active, muted when upcoming, ink-900 when done). Mapping:
  - planning → `Compass`
  - messaging → `MessageCircle`
  - build → `Hammer`
  - content → `PenTool`
  - pre-launch → `Megaphone`
  - launch → `Rocket`
- Card layout otherwise unchanged: icon left, status indicator (check / dot) right, phase name below, progress bar at the bottom.

### Files to change

- `src/pages/project/plan/FunnelOverviewContent.tsx` — banner removal, celebration removal, dead-state cleanup, lazy-loaded dialogs, query stale-time, TodayStatsCard link, LaunchTimelineEditorial icon swap
- `src/components/dashboard/index.ts` — remove dead exports
- `src/components/relaunch/index.ts` — remove memory-review exports
- **Deleted:** `MemoryReviewBanner.tsx`, `MemoryReviewSheet.tsx`, `useMemoryReview.ts`, `PhaseCelebrationCard.tsx`, `StuckHelpCard.tsx`, `DailyMotivationCard.tsx`, `ProgressSnapshotCard.tsx`, `LaunchSnapshotCard.tsx`

### Out of scope

- The `project_memory` table and the rest of the relaunch flow (`RelaunchSelectionScreen`, `RelaunchSummaryScreen`, `ProjectLineageView`) stay intact.
- No changes to other pages or to the sidebar.


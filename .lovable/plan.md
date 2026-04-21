

## Eliminate the grey "blank screen" between page navigations

### What's happening

There are **two distinct sources** of the grey/blank screen between clicks, and both need to be fixed:

**1. Lazy-route Suspense gap (every navigation)**
Every page uses `lazy()` in `App.tsx`. When you click a nav link, React must download the destination page's JS chunk before it can render anything. Since `RouteFallback = null`, *nothing* paints during that download — the screen goes blank/grey for ~200–800ms. The previous page does NOT stay visible because each page renders its own `<ProjectLayout>` which unmounts on route change.

**2. Page-level loaders that render only a tiny centered spinner**
Several pages (the ones the user is most likely to hit) early-return a *bare spinner inside ProjectLayout* with no header/title visible — making it look like the dashboard "broke." Examples:

| Page | Current loading state |
|---|---|
| `ProjectExecute` (Launch Tasks) | `TasksBoard` shows just `animate-spin` circle, no page header above |
| `DailyPage` | Centered spinner only |
| `WeeklyReview` | Centered spinner only |
| `Planner` (Calendar) | Centered spinner only |
| `Relaunch` | Centered spinner only |
| `CampaignDetail` | Centered spinner only |
| `PhaseSnapshot` | Skeleton block only |
| `GoalDetail` / `GoalFolderDetail` | "Loading..." text only |
| `ContentVault` / `ContentVaultCategory` | Skeleton-only, no header |
| `Playbook` | `PlaybookSkeleton` only |

The dashboard (`FunnelOverviewContent`) the user wants to match shows a **terracotta spinner inside the already-rendered ProjectLayout shell** — the sidebar + topbar are visible the whole time and only the content body shows the spinner.

### The fix

**A. Persist the layout shell during route transitions** — so the sidebar + topbar never blink out:

1. Add a new component `AppShellFallback` used as the global `Suspense fallback` in `App.tsx`. It renders `<ProjectLayout>` with a centered terracotta `Loader2` (matching the dashboard's loader exactly). Use it only for protected `/app`-style routes (not for marketing pages like `/`, `/auth`, `/go`).
2. Split routes into two `<Suspense>` blocks:
   - **Public/marketing routes** → keep `fallback={null}` (those pages have their own full-screen layouts).
   - **Protected app routes** → wrap in a second `<Suspense fallback={<AppShellFallback />}>` so during lazy chunk download the user sees sidebar + topbar + dashboard-style spinner instead of a blank screen.

**B. Standardize every page's loading state** to match the dashboard pattern:
   - Always render `<ProjectLayout>` and the **page header** (icon + title + subtitle) immediately, even while data is loading.
   - Replace bare spinners and "Loading..." text with the same `<Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" />` inside a `flex items-center justify-center h-64` container, placed *below* the header.
   - Pages to update:
     - `ProjectExecute.tsx` — pass an `isLoading` flag so `TasksBoard` renders the spinner *under* the rendered "Launch Tasks" header (or move the loader from `TasksBoard` up to the page).
     - `DailyPage.tsx`, `WeeklyReview.tsx`, `Planner.tsx`, `Relaunch.tsx`, `CampaignDetail.tsx`, `PhaseSnapshot.tsx`, `GoalDetail.tsx`, `GoalFolderDetail.tsx`, `ContentVault.tsx`, `ContentVaultCategory.tsx`, `Playbook.tsx` — render the page header above the loader.

**C. Create a single shared `<PageLoader />` component** at `src/components/ui/page-loader.tsx` so all pages use the exact same dashboard-style spinner (terracotta, sized `w-8 h-8`, container `flex items-center justify-center h-64`). Reuse it everywhere instead of bespoke spinners.

### Result

- Clicking *any* nav link → sidebar + topbar stay painted continuously.
- During lazy chunk load → the destination page's shell is already showing the dashboard-style terracotta spinner.
- Once the page mounts → the page header appears immediately; only the content area below shows the spinner until data resolves.
- Smooth, dashboard-like transitions everywhere — no grey screens.

### Files to change

- `src/App.tsx` — add second `<Suspense>` block with `<AppShellFallback />` for protected routes.
- `src/components/ui/page-loader.tsx` — **new** shared loader.
- `src/components/layout/AppShellFallback.tsx` — **new** ProjectLayout + PageLoader wrapper.
- `src/components/TasksBoard.tsx` — slimmer inline loader (header stays in `ProjectExecute`).
- `src/pages/DailyPage.tsx`, `WeeklyReview.tsx`, `Planner.tsx`, `project/Relaunch.tsx`, `CampaignDetail.tsx`, `project/PhaseSnapshot.tsx`, `GoalDetail.tsx`, `GoalFolderDetail.tsx`, `ContentVault.tsx`, `ContentVaultCategory.tsx`, `project/Playbook.tsx` — render page header during loading + use shared `<PageLoader />`.


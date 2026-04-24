
## Fix: Planner Tasks list isn't scrollable in production

### Problem
On `/planner` → **Tasks** view, you can see the first ~14 tasks ("Overdue" group) but cannot scroll to reach the rest of the list (This Week, Done, Blocked, etc.), and the status column appears cut off near the page edge.

### Root cause
`Planner.tsx` wraps the view area in:
```
<div className="flex-1 overflow-hidden flex">
  <SpacesSidebar ... />
  <div className="flex-1 overflow-hidden">   ← clips overflow
    <PlannerListView ... />
```

But `PlannerListView`'s root is just `<div className="px-4 pb-4 relative">` — it has **no `h-full`** and **no `overflow-y-auto`**, so:
1. Anything past the viewport height gets clipped by the parent's `overflow-hidden` (no scrollbar appears).
2. The "sticky top-0" column header has no scrolling ancestor inside the list view, so it doesn't behave correctly either.

The Calendar and Board views don't have this problem because their roots use `h-full overflow-hidden` with an inner `overflow-y-auto` / `overflow-x-auto` scroll container.

### The fix (one file, ~5 lines)

Update `src/components/planner/PlannerListView.tsx`:

1. Change the root wrapper from `px-4 pb-4 relative` to `h-full overflow-y-auto px-4 pb-4 relative` so the list owns its own scroll container — matching the Calendar/Board pattern.
2. The existing `sticky top-0` on the column header will now work correctly because it has a real scrolling ancestor.
3. Keep the floating bulk-action bar `fixed` positioning (already correct — sits above the scroll area).

### What you'll see after
- Vertical scrollbar inside the tasks list — you can reach every group (Overdue, Today, This Week, Anytime, In Review, Done, Blocked, Abandoned).
- Column headers (Name / Due Date / Category / Status) stay pinned at the top while you scroll.
- No layout shift in Calendar or Board views (only the list view changes).
- Floating "X tasks selected" bar still anchored to the bottom of the screen.

### Files touched
- `src/components/planner/PlannerListView.tsx` (single className change on the outer `<div>`)

### Risk
Minimal — purely a CSS containment fix. No data, query, or behavior changes.



# Fix Sidebar Card Background & Week Grid Alignment

## Changes in `src/components/planner/PlannerCalendarView.tsx`

### 1. Card background color
Change `bg-sidebar` on the three card containers (Mini Calendar, My List, Categories) to match the main navigation background. The nav uses `bg-sidebar` too — so the cards blend in. Use a slightly lighter shade like `bg-sidebar-accent` (which is `40 6% 15%`) to make cards distinct from the nav, or use `bg-[hsl(40,6%,12%)]` for a subtle lift.

Lines affected: ~205, ~273, ~295 — the three `rounded-xl bg-sidebar p-4` divs.

### 2. Vertical line alignment fix
The day column headers are a fixed row above the scrollable time grid. The scrollbar in the time grid area takes up space, causing the columns below to be narrower than the headers. Fix by adding `overflow-y-scroll` (always show scrollbar space) to the scroll container, or better, add a matching right padding/margin to the header row to account for scrollbar width. The cleanest approach: wrap both header and grid in the same scroll container so they share the same width context.

**Approach**: Move the day column headers inside the `overflow-y-auto` scroll container (before the grid div), and make them sticky at top with `sticky top-0 z-10 bg-background`. This ensures headers and grid columns share the exact same width.


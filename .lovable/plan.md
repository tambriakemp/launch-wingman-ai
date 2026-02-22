

## Fix Goal Progress Bar Color

### Problem
The progress bar at 0% still appears green because `bg-primary/70` is just a slightly transparent version of the primary color (teal/green), which still looks green and gives the impression the goal is complete.

### Solution
Change the "in-progress" color to a neutral tone that clearly communicates work-in-progress, and only switch to green when complete.

### Changes

**File:** `src/components/campaigns/CampaignDetailSidebar.tsx` (line 121)

- Change `bg-primary/70` to `bg-muted-foreground/30` (a neutral gray) for the in-progress state
- Keep `bg-emerald-500` for the completed state (>= 100%)

This ensures the bar looks neutral/gray while in progress and only turns green upon goal completion, eliminating the false "complete" impression.


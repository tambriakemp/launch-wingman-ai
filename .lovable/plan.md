

# Separate Sidebar Sections into Rounded Cards with Launchely Black Background

## What Changes

The sidebar currently has sections (Mini Calendar, My List, Categories) separated by thin border dividers within a single `bg-gray-900` column. Instead, each section should be its own **rounded card** using the Launchely brand black (`hsl(var(--sidebar-background))` which is `40 6% 7%`).

## File: `src/components/planner/PlannerCalendarView.tsx`

**Sidebar container** (line ~192): Change from `bg-gray-900` to a slightly lighter dark background (e.g., `bg-gray-900/50` or `bg-[hsl(40,6%,12%)]`) so the cards stand out against it. Or use a transparent/subtle background.

**Wrap each section in a card div** with `rounded-xl bg-sidebar p-4` (where `bg-sidebar` maps to `hsl(var(--sidebar-background))` = Launchely black `40 6% 7%`):

1. **Mini Calendar card** — wrap the Calendar component (lines ~205-233) in a rounded card
2. **Upcoming Event card** — already has its own card styling, adjust to use `bg-sidebar` base
3. **My List card** — wrap the Collapsible (lines ~277-294) in a rounded card
4. **Categories card** — wrap the Collapsible (lines ~299-332) in a rounded card

**Remove** the `<div className="border-t border-gray-700/50 mx-4" />` dividers between sections (lines ~235, 274, 296) since the cards will create visual separation via gaps.

**Add spacing** between cards using `space-y-3` or `gap-3` on the sidebar's inner content area.




# Planner Calendar — Premium UI Overhaul

## Overview

Transform the calendar view from a single full-width grid into a 3-panel layout with a left sidebar (mini calendar + filter toggles), center canvas (week/month grid with rich event cards), and right sidebar (unscheduled items). Event cards get pastel color palettes based on type and category. All existing data logic preserved.

---

## Layout Structure

```text
┌──────────────┬─────────────────────────────┬──────────────┐
│  Left Sidebar │      Main Calendar Canvas   │ Right Sidebar│
│  (~220px)     │      (flex-1)                │  (~260px)    │
│               │                              │              │
│ Mini Calendar │  Header: Month + nav + toggle│ Unscheduled  │
│               │                              │ items list   │
│ My Calendars  │  Week grid / Month grid      │ with count   │
│  ☑ Tasks      │  (soft pastel event blocks)  │ badge        │
│  ☑ Events     │                              │              │
│               │                              │              │
│ Categories    │                              │              │
│  ● Work       │                              │              │
│  ● Personal   │                              │              │
│               │                              │              │
│ Coming Soon   │                              │              │
│  ○ Content    │                              │              │
└──────────────┴─────────────────────────────┴──────────────┘
```

On screens < lg: left sidebar collapses (hidden), right sidebar moves below calendar.

---

## Files to Modify

### `src/components/planner/PlannerCalendarView.tsx` — Full rewrite

**Props**: Add `onToggleComplete` prop for task completion from calendar cards.

**State additions**:
- `showTasks` / `showEvents` (boolean toggles, default true)
- `showBusiness` / `showLife` (category toggles, default true)
- `selectedMiniDate` (for mini calendar navigation sync)

**Left Sidebar** (`w-56 border-r`, collapsible on mobile):
- Mini month calendar using shadcn `<Calendar>` component with `pointer-events-auto`, synced to navigate the main view when a date is clicked
- "My Calendars" section with checkbox toggles for Tasks and Events
- "Categories" section with colored dot + checkbox for Work (blue) and Personal (green)
- "Content" placeholder toggle (disabled, "Coming Soon" badge)
- All sections collapsible with chevrons

**Center Canvas**:
- Header row: month/year title, Today button, prev/next arrows, Week|Month toggle
- **Week view**: Same time grid structure (6AM-10PM) but with upgraded event cards:
  - Pastel backgrounds by category: business = blue-50/blue-100 border-blue-200, life = green-50/green-100 border-green-200
  - Events get a calendar icon, tasks get a check circle icon
  - Cards show title (bold, truncated) + time range below
  - Hover: slight elevation + quick action icons (edit)
  - Click: opens edit modal
- **Month view**: Modern grid with rounded cells, hover states, "+N more" chips, today highlighted with primary pill
- Current time indicator (red line with dot) preserved

**Right Sidebar** (`w-64 border-l`, moves below on mobile):
- "Unscheduled" header with count badge
- Scrollable list of unscheduled tasks (filtered by sidebar toggles)
- Each item shows title, category dot, type badge
- Click opens edit modal

**Filtering logic** (client-side, applied to `scheduledTasks` and `unscheduledTasks` memos):
- If `showTasks` false → hide task_type='task'
- If `showEvents` false → hide task_type='event'  
- If `showBusiness` false → hide category='business'
- If `showLife` false → hide category='life'

**Event card color palette**:
```tsx
const CARD_STYLES = {
  "event-business": "bg-blue-50 border-blue-200 text-blue-700",
  "event-life": "bg-emerald-50 border-emerald-200 text-emerald-700",
  "task-business": "bg-amber-50 border-amber-200 text-amber-700",
  "task-life": "bg-purple-50 border-purple-200 text-purple-700",
};
```

### `src/pages/Planner.tsx` — Minor update
- Pass `onToggleComplete` to `PlannerCalendarView` so tasks can be completed from calendar cards.

### No other files changed
- PlannerTaskDialog, PlannerListView, PlannerBoardView remain untouched.
- No database changes needed.


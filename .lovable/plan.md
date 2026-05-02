## Goal

Mimic Sunsama's "Board + Calendar in one" experience on `/planner`. The default view becomes a horizontal **Board** (one column per day of the week), with a `Board` ↔ `Calendar · Month` toggle in the top-right (matches the second screenshot). The standalone Week/Day calendar grid and the existing multi-status Kanban are removed from this page. Status only appears on the dedicated Tasks (To do) page.

## Sidebar changes (`src/components/layout/ProjectSidebar.tsx`)

Reorder the **Planner** section so Calendar comes first and Tasks (renamed) sits underneath it:

```text
Planner
  My Planner
  Calendar          → /planner
    To do           → /planner/tasks   (renamed from “Tasks”, nested visually under Calendar)
  Daily Page
  Habits
  Goals
  Weekly Review
```

Implementation notes:
- Add a new item `{ id: "todo", label: "To do", icon: ListTodo, href: "/planner/tasks", isProOnly: true }` directly after the `calendar` item.
- Slight left indent for the To do row (e.g. `pl-6` when not collapsed) to visually nest it under Calendar.
- The current `/planner` route already exists; add a new `/planner/tasks` route in `src/App.tsx` pointing to the existing `Planner` page but forced into list/tasks mode (see below).

## `/planner` becomes Sunsama-style (Board + Month only)

In `src/pages/Planner.tsx`:
- Remove the `Tabs` ("Tasks / Calendar / Board") and the `StatusVisibilitySettings` button from this page.
- Replace with a single top-right view toggle: **Board** | **Calendar · Month** (dropdown styled like screenshot 2, default = Board).
- Keep `SpacesSidebar` as the embedded collapsible left panel above "Upcoming" (already in place).
- Always render the new `PlannerWeekBoardView` for "Board", and a trimmed `PlannerCalendarView` (month-only) for "Calendar · Month".
- Drop the `kanban` view path entirely from this page.

### New component: `src/components/planner/PlannerWeekBoardView.tsx`

A horizontal day-board mimicking Sunsama:
- Columns: 7 days starting from today (Sat May 2 … Fri May 8 in screenshot 1). `Today` button + prev/next week navigation in the existing header row.
- Each column header: weekday name (bold) + date (muted), thin progress bar showing % of that day's tasks completed.
- Each card shows: time (e.g. "6:00 am") if scheduled, title, space color dot/tag, completion checkbox, recurring icon if applicable. **No status pills** — completion is a single checkbox (done vs not done), matching Sunsama.
- Empty state per column: `+ Add task` button that calls `onCreateTask({ due_at: <that day at 9am> })`.
- Drag-and-drop a card between day columns updates `due_at` (and `start_at`/`end_at` preserving duration if scheduled). Reuse `@hello-pangea/dnd` already used in the kanban.
- Pull tasks from `filteredTasks` for the visible 7-day window (use `expandAllRecurring` like the calendar view does for recurring tasks).

### Trimmed Calendar view

`PlannerCalendarView` already supports `month | week | day`. For the merged page, render it with `viewMode` locked to `month` and hide its internal mode switcher when used here. Add an optional prop `lockedView?: "month"` to suppress the `month/week/day` pill row.

## Status visibility scoping

`StatusVisibilitySettings` and the "in-progress / in-review / blocked / abandoned" status pills currently bleed into the calendar/board. Remove them from `/planner` entirely. They remain on the new `/planner/tasks` page (existing `PlannerListView` + Kanban behaviour stays intact there).

In `Planner.tsx`, branch on the route:
- `/planner` → render Sunsama header (Board / Calendar · Month toggle), no status filter, no Tabs.
- `/planner/tasks` → render the existing Tasks UI: `PlannerListView` with `StatusVisibilitySettings`, the Kanban "Board" tab if you want to keep it here, page title becomes **"To do"**.

Simplest implementation: keep one `Planner.tsx` and read `useLocation()` — if pathname ends with `/tasks` use the To-do mode, otherwise the Sunsama mode. Page heading and icon switch accordingly (`CalendarDays` → "Calendar" vs `ListTodo` → "To do").

## Routing (`src/App.tsx`)

Add a new lazy route alongside the existing `/planner`:
```tsx
<Route path="/planner/tasks" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
```
(Reuses the same `Planner` component, which switches mode based on pathname.)

## Out of scope (per request)

- Week / Three-day / Weekdays / One-day calendar variants from the screenshot dropdown — only **Board** and **Calendar · Month** for now.
- Sunsama's left-side "Daily rituals / Weekly rituals / Backlog" rail — not requested.
- Time-tracking pills (`0:20`, `2:00`) on cards.

## Files touched

- `src/components/layout/ProjectSidebar.tsx` — reorder Planner items, add nested "To do" row.
- `src/App.tsx` — add `/planner/tasks` route.
- `src/pages/Planner.tsx` — remove Tabs, add Board/Month toggle, branch on pathname for Tasks vs Sunsama mode, drop status filter from `/planner`.
- `src/components/planner/PlannerCalendarView.tsx` — accept `lockedView` prop, hide mode switcher when locked.
- `src/components/planner/PlannerWeekBoardView.tsx` — **new** Sunsama-style day-column board with DnD between days.

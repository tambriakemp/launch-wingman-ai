

## Plan: Add New Task Statuses (Blocked, In Review, Abandoned) with Visibility Settings

### Summary
Add three new task statuses -- **Blocked**, **In Review**, and **Abandoned** -- across the entire Planner suite. Blocked and Abandoned tasks will be hidden from the calendar and collapsed by default on the kanban board (ClickUp-style). A settings popover will let users toggle which statuses are visible across all three views.

### Technical Details

**1. Update Status Definitions (3 files)**

Add the new statuses to the `STATUSES` arrays in:
- `PlannerTaskDialog.tsx` (line ~99): Add `{ id: "blocked", label: "Blocked" }`, `{ id: "in-review", label: "In Review" }`, `{ id: "abandoned", label: "Abandoned" }`
- `PlannerListView.tsx` (line ~93): Same additions
- `PlannerKanbanView.tsx` (line ~21, `COLUMNS` array): Add three new column definitions with appropriate colors (red for blocked, purple for in-review, gray for abandoned)

Update `getStatusBadge()` in `PlannerListView.tsx` to render badges for the new statuses.

**2. Kanban Board -- Collapsed Columns (PlannerKanbanView.tsx)**

- Add a `collapsedColumns` state tracking which columns are collapsed (default: `blocked` and `abandoned` collapsed)
- When collapsed, render the column as a narrow vertical bar showing only the status name rotated 90 degrees and a task count badge (matching the ClickUp screenshot)
- Clicking the collapsed bar expands it to a full column
- Add a collapse toggle button in the column header

**3. Calendar View -- Hide Blocked/Abandoned (PlannerCalendarView.tsx)**

- Filter out tasks with `column_id` of `blocked` or `abandoned` from calendar rendering by default
- This filtering will be controlled by the new visibility settings (see step 5)

**4. List View -- Group Blocked/Abandoned (PlannerListView.tsx)**

- Add `blocked` and `abandoned` as new `GroupKey` values
- Add them to `GROUP_CONFIG` with `defaultOpen: false` so they appear collapsed like the "Done" group
- Update `groupTasks()` to route tasks with these statuses into their respective groups

**5. Status Visibility Settings (New Component + State)**

- Create `src/components/planner/StatusVisibilitySettings.tsx` -- a popover triggered by a `Settings2` (ellipsis/gear) icon
- Contains a list of all statuses with toggle switches to show/hide each one
- Store preferences in `localStorage` (key: `planner_status_visibility`) as a simple `Record<string, boolean>`
- Create a shared hook `useStatusVisibility()` that provides the visibility map and a toggle function
- Pass visibility state into all three views (Calendar, List, Board) via the `Planner.tsx` parent

**6. Wire Up in Planner.tsx**

- Import and use the `useStatusVisibility` hook
- Render the `StatusVisibilitySettings` popover next to the view tabs
- Filter `filteredTasks` through the visibility settings before passing to child views
- Update `handleMoveTask` to accept new status IDs

### Files to Create
- `src/hooks/useStatusVisibility.ts`
- `src/components/planner/StatusVisibilitySettings.tsx`

### Files to Modify
- `src/components/planner/PlannerTaskDialog.tsx` -- add statuses to STATUSES array
- `src/components/planner/PlannerKanbanView.tsx` -- add columns, collapsed state, collapsed UI
- `src/components/planner/PlannerCalendarView.tsx` -- respect visibility filter
- `src/components/planner/PlannerListView.tsx` -- add status badges, groups, STATUSES
- `src/pages/Planner.tsx` -- add settings button, wire visibility hook

No database changes required -- `column_id` is already a free-text string field.


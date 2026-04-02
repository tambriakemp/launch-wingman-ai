

## Calendar: All-Day Section, Remove Event Type & Location

### Changes

**1. `src/components/planner/PlannerCalendarView.tsx`**
- **Add "All day" row** above the hourly grid in week/day views. Tasks with `due_at` but no `start_at`/`end_at` (or tasks with a date but no specific time) render as chips in this row, grouped by day column — matching the ClickUp screenshot.
- **Update `scheduledTasks` logic** to include tasks that have `due_at` but no time range, splitting them into "all-day" vs "timed" buckets.
- **Remove location display** from calendar task cards (the `MapPin` line around line 649-653).
- **Update `getCardColors`** to remove `event-business` and `event-life` keys, treating everything as tasks.

**2. `src/components/planner/PlannerTaskDialog.tsx`**
- **Remove "Event" from the Type selector** — only "Task" remains, so remove the Type dropdown entirely (it's now always "task").
- **Remove the `location` field** (state, input, and submission).
- **Remove event-specific validation** (the check at line 206 requiring date+times for events).
- **Update `handleUnschedule`** to stop referencing event type.
- **Default `task_type` to "task"** always; remove `defaultTaskType` prop.

**3. `src/components/planner/PlannerListView.tsx`**
- Remove the "Event" badge rendering (line 186-188).

### All-Day Section Design
- A horizontal row between the day headers and the hourly grid, labeled "All day" in the time gutter.
- Tasks without start/end times appear as colored chips (similar to timed task cards but compact, single-line).
- Clicking a chip opens the edit dialog; clicking empty space in the all-day row triggers task creation for that day without a time.
- The row auto-expands vertically if multiple all-day tasks exist on the same day.

### Technical Details
- Split filtered tasks into two groups: `allDayTasks` (have `due_at` but no `start_at`/`end_at`) and `timedTasks` (have both `start_at` and `end_at`).
- The all-day section sits inside the scroll container but above the time grid, rendered as a sticky or static row.
- The `PlannerTask` interface keeps `location` for backward compatibility but it won't be editable or displayed.

### Files
- `src/components/planner/PlannerCalendarView.tsx`
- `src/components/planner/PlannerTaskDialog.tsx`
- `src/components/planner/PlannerListView.tsx`


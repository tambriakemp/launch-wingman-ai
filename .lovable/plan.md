

## Fix: Date Picker, Calendar Time Display, and Bulk Category

### Bug 1: "12:00" showing in task title on calendar
**Root cause**: `PlannerCalendarView.tsx` line 593-595 prepends `format(parseISO(task.start_at), "h:mm")` before the title in the month view. Since tasks are saved with `startOfDay` (midnight), it always shows "12:00".

**Fix**: Only show the time prefix when the task has explicit start/end times that aren't midnight. Check if hours or minutes are non-zero before rendering the time span. Apply the same logic in the weekly/day view time display (line 540).

### Bug 2: Quick date picks (Today, Tomorrow, etc.) not clickable
**Root cause**: The `DatePickerPanel` renders inside a `PopoverContent` but the left sidebar buttons likely lack `pointer-events-auto`. The calendar has it but the surrounding panel does not.

**Fix**: Add `pointer-events-auto` to the `DatePickerPanel` root `<div className="flex">` wrapper, or to the `PopoverContent` itself.

### Bug 3: Defaulting to recurring even when turned off
**Root cause**: The `showRepeat` state controls visibility of the repeat section but doesn't reset `recurrenceFreq` when repeat is toggled off. When `showRepeat` is true, whatever `recurrenceFreq` was set persists. Additionally, clicking "Set Recurring" toggles `showRepeat` but doesn't clear `recurrenceFreq` to `"none"` when hiding.

**Fix**: When `setShowRepeat(false)`, also reset `recurrenceFreq` to `"none"` and clear related fields. Ensure the submit handler only builds a recurrence rule when `recurrenceFreq !== "none"` (already done, but the freq might not be reset).

### Bug 4: Category option showing in bulk action bar under "All Spaces"
**Root cause**: The `BulkCategoryPicker` always renders in the floating action bar regardless of `selectedSpaceId`.

**Fix**: In `PlannerListView.tsx`, conditionally render the `BulkCategoryPicker` only when `selectedSpaceId` is not null (i.e., user is inside a specific space).

### Files to modify
- `src/components/planner/PlannerCalendarView.tsx` — remove time prefix for midnight times
- `src/components/planner/PlannerTaskDialog.tsx` — add `pointer-events-auto` to date picker panel, reset recurrence when toggling repeat off
- `src/components/planner/PlannerListView.tsx` — hide category bulk action when `selectedSpaceId` is null


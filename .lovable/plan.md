

## Plan: Sync Recurring Task Occurrences to Google Tasks

### Problem
Recurring tasks are stored as a single parent record with a `recurrence_rule` JSON field. The client expands them into virtual instances for display, but `bulk-sync-calendar` and `sync-calendar-event` only see the one parent row. Result: only one Google Task is created instead of one per occurrence.

### Approach
Port the recurrence expansion logic (currently in `src/components/planner/recurrenceUtils.ts`) into the edge functions so they can generate individual Google Tasks for each occurrence within a reasonable window (e.g., 90 days ahead).

### Implementation

**File: `supabase/functions/sync-calendar-event/index.ts`**

1. Add a server-side `expandRecurrences(task, windowStart, windowEnd)` function (simplified port of `recurrenceUtils.ts` logic) that:
   - Reads `recurrence_rule` (freq, interval, days, end_type, end_date, count)
   - Reads `recurrence_exception_dates` to skip exceptions
   - Generates occurrence dates within the window
   - Returns an array of `{ occurrenceDate, virtualId }` objects

2. Modify the main handler: when the task has a `recurrence_rule`, expand it into occurrences. For each occurrence:
   - Use a composite mapping key: `task_id::YYYY-MM-DD` in `calendar_sync_mappings`
   - Build a Google Task with the occurrence date as `due`
   - Create/update/delete each occurrence independently

3. For `action === "delete"` on a recurring parent: delete ALL mappings with `task_id` prefix match

**File: `supabase/functions/bulk-sync-calendar/index.ts`**

1. When fetching tasks, also select `recurrence_rule, recurrence_exception_dates, title` columns
2. For recurring tasks, expand occurrences server-side (next 90 days from today)
3. Sync each occurrence as a separate call with a virtual task ID (`taskId::YYYY-MM-DD`)

**New helper: recurrence expansion (inside sync-calendar-event)**

Simplified Deno-compatible version — no date-fns dependency, uses native `Date`:
- `addDays`, `addWeeks`, `addMonths`, `addYears` as simple date arithmetic functions
- Weekly frequency with specific days (e.g., MO, WE, FR) handled separately
- Respects `end_type` (never, on_date, after_n) and `recurrence_exception_dates`

**Calendar sync mappings changes**

The `task_id` field in `calendar_sync_mappings` currently references `tasks.id` (UUID). For virtual occurrences, we'll store the composite ID `parentTaskId::2026-04-07` as a text identifier. Need to verify the column type supports this — if it's a UUID foreign key, we'll need a migration to change it to `text` or add a separate `occurrence_date` column.

### Migration (if needed)
- Add `occurrence_date` column (text, nullable) to `calendar_sync_mappings`
- Keep `task_id` as the parent UUID reference
- Use `(task_id, occurrence_date, calendar_connection_id)` as the unique key for recurring mappings

### Technical details
- Expansion window: today to +90 days (configurable)
- Max 500 occurrences per task to prevent runaway loops
- Each occurrence syncs as an independent Google Task with title including the parent task's title
- Exception dates are respected (skipped)
- Non-recurring tasks continue to work exactly as before


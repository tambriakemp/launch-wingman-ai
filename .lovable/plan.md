
Goal: fully fix the Planner month/calendar rendering so due-only and all-day tasks show as true all-day items with no time prefix and no “past/greyed” appearance unless they are actually completed or outside the current month.

What I found
- This is not a production-only issue. It should work in preview/dev.
- The backend data is already correct in dev: the live task request shows due-only tasks coming back as:
  - `due_at` = set
  - `start_at` = `null`
  - `end_at` = `null`
- So the remaining problem is in the front-end calendar rendering/styling, not in saving or environment setup.

Why it is still happening
1. The calendar uses multiple different checks for “all-day” instead of one shared rule.
   - `scheduledTasks`
   - `allDayTasks`
   - month-view time prefix rendering
   - timed grid rendering
   Each branch decides slightly differently.
2. The month view still decides whether to show time using:
   - `task.start_at`
   - plus an `allDayTasks.some(...)` lookup
   That lookup is brittle. A task can still render through the wrong path even if it should be treated as all-day.
3. The “greyed out” look has two possible sources:
   - actual cell dimming for non-current-month days: `!isCurrentMonth && "opacity-35"`
   - the task chip styling itself, which uses a very light alpha background (`rgba(..., 0.18)`) and can visually read as faded/grey even when the day is current
4. Done tasks are also intentionally faded, so if a task is completed it will still look muted regardless of date.

Answer to your question
- No, you should not need to “add the date in production.”
- Yes, this should work in dev/preview the same way.
- The evidence points to a rendering logic issue in `PlannerCalendarView.tsx`, not a dev vs production mismatch.

Implementation plan

1. Unify all-day detection in `src/components/planner/PlannerCalendarView.tsx`
- Add one shared helper such as:
  - `isAllDayTask(task)`
  - `getTaskDisplayDate(task)`
- Use that same helper everywhere instead of repeating separate logic.
- Rules:
  - due-only (`due_at` with no `start_at`/`end_at`) = all-day
  - same start/end timestamp = all-day
  - timed range with real duration = timed

2. Remove the time prefix from all all-day tasks in month view
- Replace the current inline month-cell condition with the shared `isAllDayTask(task)` helper.
- Do not rely on `allDayTasks.some(...)`.
- Result:
  - due-only tasks show title only
  - same-time start/end tasks show title only
  - only true timed events show `h:mm`

3. Make date matching timezone-safe and consistent
- Keep date-only matching based on the calendar date key, not mixed `parseISO/isSameDay` behavior in different places.
- Normalize both the task date and cell date to the same local date-key format before matching.
- This avoids tasks being treated as adjacent-month or wrong-day items because of timezone offsets.

4. Fix the “greyed out” appearance for active all-day tasks
- Keep cell dimming only for actual non-current-month cells.
- Keep faded styling only for `done` tasks.
- Strengthen the default task-chip styling for active all-day tasks so it looks intentional, not washed out:
  - slightly stronger background opacity
  - preserve colored left border / readable text
- This addresses the visual issue even when the cell itself is not dimmed.

5. Verify all calendar branches use the same classification
- Month view task pills
- Week/day all-day row
- Week/day timed grid
- Upcoming list behavior should stay unchanged since the data is already correct

Files to update
- `src/components/planner/PlannerCalendarView.tsx`

Expected result
- Due-only tasks display as all-day
- No `12am` or other time prefix for all-day tasks
- Current-month tasks no longer look grey unless:
  - they are completed, or
  - they are truly outside the active month grid
- Behavior works in dev/preview and production the same way

Technical details
- Confirmed from network data that the task payload is already valid in dev:
  - example task had `due_at` set and `start_at/end_at` null
- Current weak spots in code:
  - `scheduledTasks` and `allDayTasks` are derived separately
  - month view time label suppression is based on `allDayTasks.some(t => t.id === task.id)` instead of a direct task classification helper
  - chip color styling uses a low-opacity background that can read as “greyed out” even when the day cell is not dimmed

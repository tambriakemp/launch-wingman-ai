Plan to fix the three planner issues:

1. Allow completing one recurring occurrence from Weekly view
- Remove the current block that says recurring instances cannot be completed.
- When a virtual recurring instance is checked, create a real task occurrence for that specific date only:
  - Copy the parent task’s title, dates, space, category, priority, etc.
  - Set `recurrence_parent_id` to the parent recurring task.
  - Set `recurrence_rule` to `null` so this row is only that one date.
  - Set `column_id` to `done` for that occurrence.
- Add that occurrence date to the parent task’s `recurrence_exception_dates` so the virtual version for that same date is hidden and replaced by the real completed occurrence.
- If that completed occurrence is later unchecked, only that occurrence row changes back to `todo`; the recurring series remains unchanged.
- Keep editing behavior as-is: clicking a virtual recurring task opens the parent series, while clicking the real checked occurrence edits only that occurrence.

2. Restore subtasks when creating a new task
- Update the desktop task sheet so the Subtasks section appears during task creation, not only while editing an existing task.
- Match the existing mobile behavior:
  - New subtasks entered before the parent task exists will be stored locally in the sheet.
  - After the task is created, those subtasks will be inserted and linked to the new task.
- Keep existing edit-mode subtask behavior unchanged.
- Update the task dialog submit contract so task creation can return the new task id, allowing the dialog to save the buffered subtasks immediately after the parent task is created.

3. Fix Weekly view snapping to today
- The likely root cause is in `PlannerWeekBoardView`: the scroll-to-today effect runs while the weekly board is still in its loading state, before the day columns exist. Because the effect only depends on the anchor date, it does not reliably rerun after loading finishes.
- Update the scroll effect to wait until loading is complete and the day refs are rendered before attempting to scroll.
- Include loading/day changes in the effect dependencies so it retries after data loads.
- Scroll today into a clear visible position, preferably centered or near the left with padding, instead of relying on an early one-time left-edge calculation.
- Ensure pressing the Today button still forces a fresh snap.

Technical notes
- No new database table should be needed. The existing `tasks.recurrence_parent_id` and `tasks.recurrence_exception_dates` fields can support one-off recurring occurrence overrides.
- Changes will be focused in:
  - `src/pages/Planner.tsx`
  - `src/components/planner/PlannerWeekBoardView.tsx`
  - `src/components/planner/PlannerTaskDialog.tsx`
- I will not edit the auto-generated backend client/type files.

After implementation, I’ll verify the intended flows:
- Checking a weekly recurring task marks only that date done.
- Future/past recurring instances remain unchanged.
- New task creation shows subtasks and saves them with the created task.
- Weekly view snaps to today after loading and when Today is clicked.
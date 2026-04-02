
Update the planner calendar time range so week/day views show the full day from 12 AM through 11 PM instead of starting at 6 AM and ending at 10 PM.

What to change

1. Expand the calendar hour window in `src/components/planner/PlannerCalendarView.tsx`
- Change:
  - `START_HOUR = 6` → `0`
  - `END_HOUR = 22` → `24`
- This will generate 24 hourly rows and allow the grid to render midnight through 11 PM.

2. Fix all logic tied to the old range
- `TOTAL_HOURS` will automatically become 24.
- `getTaskPosition()` will stop clipping early-morning and late-night events.
- The red “current time” line logic will remain valid once the new bounds are used.
- `hours` array will then render labels from `12 AM` through `11 PM`.

3. Improve initial scroll behavior
- Right now the calendar auto-scrolls to ~8 AM using:
  - `scrollTop = (8 - START_HOUR) * HOUR_HEIGHT`
- Keep the same “land around morning hours” behavior for week/day, but compute it against the new midnight-based range so the top of the day still exists above it.
- This preserves usability while making 12 AM–7 AM accessible.

4. Verify day and week layouts still fit cleanly
- The main grid height will become `24 * HOUR_HEIGHT`, so confirm:
  - sticky day header still works
  - internal vertical scroll remains on the calendar body
  - time gutter labels align with rows
  - no extra clipping at the bottom around 10–11 PM

Technical details
- Root cause: the calendar is explicitly hardcoded to a partial-day range:
  - `const START_HOUR = 6;`
  - `const END_HOUR = 22;`
- Event positioning and the now-line are both based on those constants, so changing container height alone cannot fix this.
- Using `END_HOUR = 24` is correct here because the rendered labels are built from `hours = Array.from({ length: TOTAL_HOURS }, ...)`, which will produce `0..23`, ending at 11 PM.

Files
- `src/components/planner/PlannerCalendarView.tsx`

Expected result
- Week and day views start at 12 AM
- Last visible hour is 11 PM
- Early and late scheduled items are no longer clipped
- Users can scroll the full day range reliably



## Plan: Fix Calendar All-Day Task Display

### Issues
1. **"12 AM" time prefix**: Tasks set to midnight show "12:00 AM" or similar time prefix in month view instead of displaying cleanly as all-day events
2. **Grayed-out past days**: Days earlier in the current month appear dimmed even though they're in the current month — only non-current-month days should be dimmed

### Changes — `src/components/planner/PlannerCalendarView.tsx`

**Fix 1: Remove midnight time prefix in month view (lines 626-630)**
- The current check `s.getHours() === 0 && s.getMinutes() === 0` only catches exact UTC midnight
- Replace with a broader check: if the task is in the `allDayTasks` list, skip the time prefix entirely
- Alternatively, also skip the time when the formatted time is "12:00 AM" (local midnight)

**Fix 2: Stop graying current-month past days (line 606)**
- Currently `!isCurrentMonth && "opacity-35"` — this is correct for non-current-month days
- Verify no additional opacity/graying is applied to past days within the current month
- If the user's tasks appear grayed because they're due-date-only with `start_at = null` and falling through to timed rendering with faded styling, ensure they route to the all-day row properly

**Fix 3: Ensure due-only tasks render in all-day section without time labels**
- In the all-day row (line 478), task titles already render without time — no change needed
- In month view, add a guard: if task has no `start_at` (due-only), skip the time prefix block entirely

### Summary
- 1 file changed
- Month view: skip time prefix for all-day/midnight/due-only tasks
- No opacity changes to current-month days regardless of whether they're in the past


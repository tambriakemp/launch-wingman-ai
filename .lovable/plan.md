

# Planner Polish, Correctness, and QA Hardening

## Summary of Changes

The Planner is structurally complete. This plan focuses on validation guardrails, UX polish (empty states, unschedule action, day-click quick-create), dashboard link fixes, database indexes, and diagnostic logging.

---

## 1. Database Migration — Indexes + Validation Trigger Update

**New migration** to add:

**Indexes** for common Planner queries:
```sql
CREATE INDEX IF NOT EXISTS idx_tasks_user_scope_due ON public.tasks (user_id, task_scope, due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_scope_start ON public.tasks (user_id, task_scope, start_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_scope_column ON public.tasks (user_id, task_scope, column_id);
```

**Validation trigger update** — add `end_at >= start_at` check and enforce `start_at`+`end_at` pair consistency:
```sql
-- Add to validate_task_fields():
IF NEW.start_at IS NOT NULL AND NEW.end_at IS NULL THEN
  RAISE EXCEPTION 'end_at required when start_at is set';
END IF;
IF NEW.end_at IS NOT NULL AND NEW.start_at IS NULL THEN
  RAISE EXCEPTION 'start_at required when end_at is set';
END IF;
IF NEW.start_at IS NOT NULL AND NEW.end_at IS NOT NULL AND NEW.end_at < NEW.start_at THEN
  RAISE EXCEPTION 'end_at must be >= start_at';
END IF;
IF NEW.task_type = 'event' AND (NEW.start_at IS NULL OR NEW.end_at IS NULL) THEN
  RAISE EXCEPTION 'Events require start_at and end_at';
END IF;
```

---

## 2. PlannerTaskDialog — Validation & Unschedule

**File: `src/components/planner/PlannerTaskDialog.tsx`**

- Add `end_at >= start_at` validation before submit (toast error if violated).
- Add validation: if `start_at` is set, `end_at` is required (and vice versa).
- When editing a scheduled task, add an **"Unschedule"** button that clears `start_at`, `end_at`, and `location`, then submits.
- Fix timezone display: when loading `start_at`/`end_at` for the datetime-local input, convert ISO string to local datetime string properly.

---

## 3. PlannerCalendarView — Day Click Quick-Create + Overdue Sidebar

**File: `src/components/planner/PlannerCalendarView.tsx`**

- Accept new prop: `onCreateTask: (defaults: Partial<PlannerTask>) => void`
- Clicking an empty day cell calls `onCreateTask` with `due_at` prefilled to that date.
- Add "Overdue" count section in sidebar below Unscheduled (tasks with `due_at` in past and not done).
- Pass `onCreateTask` from `Planner.tsx`.

---

## 4. PlannerListView — Schedule Action + Better Empty States

**File: `src/components/planner/PlannerListView.tsx`**

- In `TaskRow`, add a "Schedule" button (clock icon) in the hover actions for unscheduled tasks — clicking opens the edit modal (already wired via `onEdit`).
- Improve empty state: when all groups are empty, show a more prominent CTA with "Add your first task" button.
- When Today group is empty but others have items, show a small "All clear for today" inline message.

---

## 5. Dashboard YourDaySection — Link Fixes

**File: `src/components/dashboard/YourDaySection.tsx`**

- "Due Today" link: change to `/planner` (already correct, no query params needed since the list view groups by today automatically).
- "Scheduled" link: keep as `/planner` (calendar tab can't be deep-linked without URL state, which is acceptable for MVP).
- Add `limit(50)` to the planner tasks query to prevent huge fetches.

---

## 6. Planner.tsx — Wire Day-Click + Query Limit

**File: `src/pages/Planner.tsx`**

- Add `handleQuickCreate` function that opens the dialog with prefilled defaults (date from calendar click).
- Pass it to `PlannerCalendarView` as `onCreateTask`.
- Add `.limit(500)` to the fetch query as a safety net.

---

## 7. Console Diagnostics

**File: `src/pages/Planner.tsx`**

- After fetching tasks, log diagnostic counts to console:
  ```
  [Planner] Total: X, Scheduled: Y, Unscheduled: Z
  ```
- This is lightweight, always-on, and sufficient for QA without a separate admin panel.

---

## Files to Modify
- `src/components/planner/PlannerTaskDialog.tsx` — validation, unschedule button, timezone fix
- `src/components/planner/PlannerCalendarView.tsx` — day click, overdue sidebar section
- `src/components/planner/PlannerListView.tsx` — schedule action, empty states
- `src/components/dashboard/YourDaySection.tsx` — query limit
- `src/pages/Planner.tsx` — quick-create handler, query limit, diagnostics

## Database Migration
- Add 3 indexes on `tasks` table
- Update `validate_task_fields()` trigger function with date pair and event validation


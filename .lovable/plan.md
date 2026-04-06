
Fix the remaining due-date-only update bug in the planner by aligning the dialog’s date model with the database rules.

### What’s actually broken
The update request is still sending:
```text
due_at = set
start_at = null
end_at = set
```
The database rejects that with:
```text
start_at required when end_at is set
```

From the current code:
- `PlannerTaskDialog` uses `startDate` for Start and `endDate` for Due
- On edit, if a task only has `due_at`, it hydrates that value into `startDate`
- But the UI still allows a “due-only” state via the Due tab
- On submit, `end_at` is always derived from `endDate`, even when there is no real scheduled start, which creates an invalid payload

### Files to update

#### 1. `src/components/planner/PlannerTaskDialog.tsx`
Adjust the submit logic so the payload follows one of these valid shapes only:

- Unscheduled due-only task:
  - `due_at = selected date`
  - `start_at = null`
  - `end_at = null`

- All-day scheduled task:
  - `due_at = selected date`
  - `start_at = selected date`
  - `end_at = same selected date`

- Timed task:
  - `due_at = start or due date`
  - `start_at` and `end_at` both set

Implementation plan:
- Normalize dates before `onSubmit`
- Detect whether the user truly has a start date vs only a due date
- Stop using `endDate` as `end_at` when no `startDate` exists
- Prefer explicit logic like:
  - if only due exists → `due_at = due`, `start_at = null`, `end_at = null`
  - if only start exists → `due_at = start`, `start_at = start`, `end_at = start`
  - if both exist → keep both, but ensure `end_at >= start_at`

Also adjust edit-state initialization:
- For tasks that only have `due_at` and no `start_at`, hydrate the value into the Due field, not the Start field
- This keeps the UI consistent with the stored task type and prevents accidental conversion into a scheduled task

#### 2. `src/pages/Planner.tsx`
Make update handling preserve nullability correctly during edits:
- avoid forcing date fields into invalid combinations
- keep the update payload consistent with the normalized output from the dialog
- if needed, add a small defensive normalization before `.update(...)` so `end_at` cannot be sent without `start_at`

### Why this fixes it
Right now the dialog treats the “Due” field like database `end_at`, but the database trigger treats `end_at` as the end of a scheduled event. A due date is not the same thing as an event end time. The fix is to separate:
- due date = `due_at`
- schedule start = `start_at`
- schedule end = `end_at`

### Technical notes
- The calendar and upcoming widget logic already supports:
  - `due_at` with no `start_at/end_at` as all-day
  - same-time `start_at/end_at` as all-day
- So this bug is mainly a submit/hydration mismatch, not a calendar rendering problem
- The console/network logs confirm the exact invalid payload currently being sent:
```text
start_at: null
end_at: "2026-04-06T05:00:00.000Z"
```

### Expected result after implementation
- Updating a task with only a due date succeeds
- Due-only tasks keep showing as all-day/upcoming
- Editing an existing due-only task shows the date in the Due slot, not as a Start date
- No more `start_at required when end_at is set` errors for due-date-only updates

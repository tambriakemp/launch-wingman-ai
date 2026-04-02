

## Calendar Breathing Room + Category Fix

### 1. Increase spacing and font sizes in calendar tasks

**`src/components/planner/PlannerCalendarView.tsx`**

- **All-day chips**: Change `text-[10px]` → `text-xs`, `px-2 py-0.5` → `px-2.5 py-1`, `gap-0.5` → `gap-1`, `min-h-[32px]` → `min-h-[40px]`
- **Timed task cards**: Change `px-3 py-2` → `px-3 py-2.5`, font from `text-xs` → `text-sm` for title
- **Hour row height**: Increase `HOUR_HEIGHT` from `64` → `72` for more breathing room between time slots
- **Time labels**: Change `text-[10px]` → `text-xs`

### 2. Fix custom categories not showing in task edit dialog

**`src/components/planner/PlannerTaskDialog.tsx`**

The Select component silently fails when the task's `category` value doesn't match any `SelectItem` value. This happens when a task was saved with an old/mismatched category ID.

- When setting the category from `editTask.category`, validate it exists in `plannerCategories`. If not found, fall back to the first available category.
- Ensure the `useEffect` that reads categories runs before the one that sets the edit values (move category loading above edit-population, or combine them).

### Files
- `src/components/planner/PlannerCalendarView.tsx`
- `src/components/planner/PlannerTaskDialog.tsx`


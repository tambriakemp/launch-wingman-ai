

# Planner Feature Implementation Plan

## Overview

Add a full Planner feature with List + Calendar views, extend the existing `tasks` table with new columns, migrate custom "My ToDo List" tasks to planner scope, add a "Your Day" section to the Dashboard, and add a single "Planner" nav item under the Plan section.

---

## 1. Database Migration

**Add columns to existing `public.tasks` table:**

```sql
ALTER TABLE public.tasks
  ADD COLUMN task_origin TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN task_scope TEXT NOT NULL DEFAULT 'funnel_build',
  ADD COLUMN task_type TEXT NOT NULL DEFAULT 'task',
  ADD COLUMN category TEXT NULL,
  ADD COLUMN due_at TIMESTAMPTZ NULL,
  ADD COLUMN start_at TIMESTAMPTZ NULL,
  ADD COLUMN end_at TIMESTAMPTZ NULL,
  ADD COLUMN location TEXT NULL,
  ADD COLUMN linked_entity_type TEXT NULL,
  ADD COLUMN linked_entity_id UUID NULL;
```

**Data migration** — existing custom tasks (those without a `phase` value, i.e. user-created "My ToDo List" tasks) become planner tasks:

```sql
UPDATE public.tasks
SET task_origin = 'user', task_scope = 'planner', category = 'business'
WHERE phase IS NULL;

UPDATE public.tasks
SET task_origin = 'system', task_scope = 'funnel_build'
WHERE phase IS NOT NULL;
```

RLS policies remain unchanged — they already enforce `auth.uid() = user_id` for all CRUD.

---

## 2. Sidebar Navigation

**File: `src/components/layout/ProjectSidebar.tsx`**

Add "Planner" nav item to the Plan section (after Tasks, before Playbook):

```typescript
{ id: "planner", label: "Planner", icon: CalendarCheck, href: "/planner" },
```

Import `CalendarCheck` from lucide-react.

---

## 3. New Route

**File: `src/App.tsx`**

Add route: `/planner` → new `Planner` page component, wrapped in `ProtectedRoute`.

---

## 4. Planner Page (`src/pages/Planner.tsx`)

Single page with top view tabs: **List | Calendar | Board**

### Shared state:
- Fetch tasks where `task_scope = 'planner'` and `user_id = auth.uid()`
- Search, filter by category (business/life), status, labels
- "+ Add" dropdown: Add Task / Add Event

### A) List View (default) — `src/components/planner/PlannerListView.tsx`

Groups (collapsible):
- **Overdue** — `due_at < now AND column_id != 'done'`
- **Today** — `due_at` is today
- **This Week** — `due_at` within current week
- **Anytime** — no `due_at`
- **Completed** — `column_id = 'done'`

Each row: checkbox, title, type icon (task/event), due date, category chip, linked entity chip, status badge.

### B) Calendar View — `src/components/planner/PlannerCalendarView.tsx`

- Month grid (week view optional for later)
- Shows ONLY items where `start_at IS NOT NULL AND end_at IS NOT NULL`
- Right sidebar: "Unscheduled" list (items with no `start_at`)
- Click unscheduled item → opens edit modal to add times

### C) Board View (optional MVP+) — `src/components/planner/PlannerBoardView.tsx`

- Columns: To Do / Doing / Done
- Task cards only (exclude events)
- Drag between columns using `@hello-pangea/dnd` (already installed)

### Create/Edit Dialog — `src/components/planner/PlannerTaskDialog.tsx`

Fields: title (required), task_type (task/event), status (todo/doing/done), category (business/life), due_at, start_at/end_at (required if event), location, linked_entity_type/id, description, labels.

Validation: if `task_type = 'event'`, require `start_at` and `end_at`.

---

## 5. Dashboard Enhancement — "Your Day" Section

**File: `src/pages/project/plan/FunnelOverviewContent.tsx`**

Add a `YourDaySection` component rendered below the greeting header.

### Cards:
1. **Top Priorities** — up to 3 planner tasks due today, with inline checkbox completion
2. **Due Today** — count of today + overdue planner tasks, show top 5
3. **Scheduled** — next 3 scheduled items (`start_at >= now`), link to `/planner`
4. **Content Shipping** — count of scheduled social posts this week (from `content_planner` table), link to Social Planner

Component: `src/components/dashboard/YourDaySection.tsx`

---

## 6. Existing Tasks Page Update

**File: `src/components/TasksBoard.tsx`**

- Remove the entire "My ToDo List" section (lines ~680-814)
- Remove the "Add Task" button that created custom tasks
- Add an info card at the bottom: "Your personal tasks have moved to Planner" with a link to `/planner`
- Ensure all data queries filter by `task_scope = 'funnel_build'` (or simply continue using `phase IS NOT NULL` which is equivalent post-migration)

---

## 7. Type Updates

**File: `src/components/TaskDialog.tsx`** — Update the `Task` interface:

```typescript
export interface Task {
  // ... existing fields
  task_origin: string;
  task_scope: string;
  task_type: string;
  category: string | null;
  due_at: string | null;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
}
```

---

## Files to Create
- `src/pages/Planner.tsx` — main page with view tabs
- `src/components/planner/PlannerListView.tsx`
- `src/components/planner/PlannerCalendarView.tsx`
- `src/components/planner/PlannerBoardView.tsx` (optional)
- `src/components/planner/PlannerTaskDialog.tsx`
- `src/components/dashboard/YourDaySection.tsx`

## Files to Modify
- `src/components/layout/ProjectSidebar.tsx` — add Planner nav item
- `src/App.tsx` — add `/planner` route
- `src/components/TasksBoard.tsx` — remove My ToDo List, add redirect card
- `src/components/TaskDialog.tsx` — extend Task interface
- `src/pages/project/plan/FunnelOverviewContent.tsx` — add YourDaySection

## Database Migration
- Add 10 new columns to `public.tasks`
- Backfill `task_origin`/`task_scope` on existing rows


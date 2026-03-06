

# Planner: Make Fully Functional End-to-End

## Current State

The Planner feature is **already 90% implemented**:
- Database migration applied (all new columns exist on `tasks` table)
- Types synced in `types.ts`
- Planner page at `/planner` with List, Calendar, Board views — all wired to Supabase
- PlannerTaskDialog with create/edit/validation logic
- YourDaySection on Dashboard
- Sidebar nav item added
- Route registered in App.tsx
- "My ToDo List" replaced with redirect card in TasksBoard

## Remaining Gap

**One critical issue**: `TasksBoard.tsx` (funnel Tasks page) fetches ALL tasks for a project without filtering by `task_scope`. When a user creates planner tasks, they will also appear on the funnel Tasks page.

**Line 93-97 in TasksBoard.tsx** currently:
```typescript
const { data: tasksData } = await supabase
  .from("tasks")
  .select("*")
  .eq("project_id", projectId)
  .order("position", { ascending: true });
```

Needs `.eq("task_scope", "funnel_build")` added.

## Plan

### 1. Fix TasksBoard query filter
Add `.eq("task_scope", "funnel_build")` to the fetchTasks query in `TasksBoard.tsx` so planner tasks never appear on the funnel Tasks page.

### 2. Add CHECK constraints (optional hardening)
Run a migration to add validation triggers for `task_scope`, `task_origin`, `task_type`, and `category` columns to prevent invalid values from being inserted.

### Files to modify
- `src/components/TasksBoard.tsx` — add `task_scope` filter to query (1 line)
- Database migration — add validation triggers for allowed values


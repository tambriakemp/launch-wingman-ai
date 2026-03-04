

## Plan: Merge Phases into Labels + Add "My ToDo List" Section

### What Changes

**1. TaskDialog — Remove Phase, Expand Labels**
- Remove the Phase `<Select>` dropdown entirely from the form
- Remove `selectedPhase` state and all phase-related logic from `onSubmit`
- Add all 10 TASK_PHASES entries into the TASK_LABELS array (keeping their colors)
- Remove the `TASK_PHASES` export (or keep as empty for backward compat)
- Update the `onSubmit` signature to remove `phase` parameter

**2. TasksBoard — Add "My ToDo List" Section**
- After the last PhaseSection ("Post-Launch"), add a new section that renders custom tasks from the `tasks` table
- This section will display tasks with their labels, status badges, due dates, and action menus (edit/delete)
- Styled consistently with the existing PhaseSection collapsible pattern but for user-created tasks
- Tasks will be filterable by the search/filter toolbar already in place

**3. TasksBoard — Update create/update handlers**
- Remove `phase` from the `handleCreateTask` and `handleUpdateTask` data objects (pass `null` or omit)

### Files to Modify
- `src/components/TaskDialog.tsx` — merge phases into labels, remove phase UI
- `src/components/TasksBoard.tsx` — add "My ToDo List" section rendering custom tasks, update handlers


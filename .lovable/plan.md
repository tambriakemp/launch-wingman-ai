

## Spaces System for Planner

This introduces "Spaces" as a top-level organizational concept (replacing "Categories"), with each Space having its own categories. The Tasks list view gets a collapsible sidebar showing all Spaces, and the Calendar gets a Space filter.

### Database

**New `planner_spaces` table:**
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users, not null)
- `name` (text, not null)
- `color` (text, default `#3b82f6`)
- `position` (int, default 0)
- `created_at`, `updated_at` (timestamptz)
- RLS: users can only CRUD their own spaces

**New `space_categories` table:**
- `id` (uuid, PK)
- `space_id` (uuid, references planner_spaces on delete cascade)
- `user_id` (uuid, references auth.users)
- `name` (text, not null)
- `color` (text, default `#f5c842`)
- `position` (int, default 0)
- `created_at` (timestamptz)
- RLS: users can only CRUD their own

**Modify `tasks` table:**
- Add `space_id` (uuid, nullable, references planner_spaces on delete set null) — nullable for backward compatibility

### Architecture

```text
┌─────────────────────────────────────────────────┐
│  Planner Page                                   │
│  ┌──────────┬──────────────────────────────────┐│
│  │ Spaces   │  Tasks List / Calendar           ││
│  │ Sidebar  │                                  ││
│  │          │  (filtered by selected space)     ││
│  │ + Add    │                                  ││
│  │ Space A  │                                  ││
│  │ Space B  │                                  ││
│  │ Space C  │                                  ││
│  └──────────┴──────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Files to Create

1. **`src/hooks/usePlannerSpaces.ts`** — Hook for CRUD operations on `planner_spaces` and `space_categories` tables. Fetches spaces + categories, provides create/update/delete functions. Replaces localStorage-based category management.

2. **`src/components/planner/SpacesSidebar.tsx`** — Collapsible left panel listing all spaces with colored dots. Includes:
   - "All Spaces" option at top (shows all tasks)
   - Each space name with task count
   - `+` button to add a new space (inline input)
   - Right-click or `...` menu for edit/delete on each space
   - "Manage Categories" option per space (opens category editor scoped to that space)
   - Collapsible via a toggle button

### Files to Modify

3. **`src/pages/Planner.tsx`** — Add `usePlannerSpaces` hook. Pass `selectedSpaceId` state. Filter tasks by `space_id` before passing to list/calendar views. Wrap the content area in a flex layout with `SpacesSidebar` on the left. Pass `spaceId` when creating tasks.

4. **`src/components/planner/PlannerTaskDialog.tsx`**:
   - Replace localStorage categories with categories from the selected space (passed as prop)
   - Add a Space selector dropdown (so user can assign/move tasks between spaces)
   - Rename "Category" label; categories are now space-scoped
   - Submit includes `space_id` in the task data

5. **`src/components/planner/PlannerListView.tsx`** — Receive `categories` as prop instead of reading from localStorage. Update `getCategoryName` to use prop data.

6. **`src/components/planner/PlannerCalendarView.tsx`**:
   - Remove the `CategoryManager` component (moved to SpacesSidebar)
   - Receive `categories` as prop
   - Add a Space filter dropdown in the calendar header (multi-select checkboxes to show/hide spaces)
   - Remove "Manage Categories" gear icon from calendar header
   - Categories passed as prop from parent based on all spaces or selected space

7. **`src/pages/Planner.tsx` task creation/update** — Include `space_id` in insert/update calls. Default new tasks to the currently selected space.

### Behavior

- **"All Spaces"** selected: Tasks list shows all planner tasks, calendar shows all tasks. Category colors resolve across all spaces.
- **Specific space selected**: Tasks list filters to that space. Calendar still shows all by default but has a filter dropdown.
- **Calendar filter**: Multi-select dropdown with space names + colors. Persists in component state.
- **Backward compatibility**: Existing tasks with `space_id = null` show under "All Spaces" and can be assigned to a space via edit.
- **Default space**: On first load, if user has no spaces, auto-create one called "Personal" with the default categories (Work, Personal, Health, Finance migrated as categories under it).


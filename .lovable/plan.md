

## Multi-Select Tasks + Category Search/Create

### 1. Multi-select checkboxes in PlannerListView

**`src/components/planner/PlannerListView.tsx`**

Add selection state and a floating action bar:

- Add `selectedIds: Set<string>` state to `PlannerListView`
- Each `TaskRow` gets a checkbox that is invisible by default, shows on hover (`opacity-0 group-hover:opacity-100`), and stays visible when checked
- The checkbox replaces the current completion circle on the left when hovered/selected — or sits to its left
- When `selectedIds.size > 0`, render a fixed bottom action bar (like ClickUp's screenshot) with:
  - "N tasks selected" label + "×" to clear
  - **Move to Space** — dropdown listing all spaces, on click calls bulk update
  - **Category** — dropdown with category search/create (see below)
  - **Delete** — bulk delete with confirmation
  - **Status** — quick status change
- New props needed: `spaces`, `onBulkMoveSpace`, `onBulkDelete`, `onBulkUpdateCategory`, `onBulkUpdateStatus`

### 2. Bulk action handlers in Planner.tsx

**`src/pages/Planner.tsx`**

Add handler functions:

- `handleBulkDelete(ids: string[])` — delete multiple tasks
- `handleBulkMoveSpace(ids: string[], spaceId: string)` — update `space_id` for multiple tasks
- `handleBulkUpdateCategory(ids: string[], categoryId: string)` — update `category` for multiple tasks  
- `handleBulkUpdateStatus(ids: string[], status: string)` — update `column_id` for multiple tasks
- Pass these + `spaces` to `PlannerListView`

### 3. Category search/create (combobox-style)

**`src/components/planner/PlannerTaskDialog.tsx`** and the bulk action bar:

Replace the category `<Select>` with a searchable input (Popover + Input + filtered list):

- Text input filters categories by name
- If no match, show "Create [typed name]" option at bottom
- Clicking "Create" calls `createCategory(spaceId, name)` then selects it
- Works both in the task dialog and in the bulk action bar's category dropdown
- New prop on `PlannerTaskDialog`: `onCreateCategory: (spaceId: string, name: string) => Promise<SpaceCategory>`

### Files to modify
- `src/components/planner/PlannerListView.tsx` — selection state, hover checkboxes, floating action bar
- `src/pages/Planner.tsx` — bulk action handlers, pass new props
- `src/components/planner/PlannerTaskDialog.tsx` — replace category Select with searchable combobox + create option

### Technical details
- Bulk updates use `supabase.from("tasks").update({...}).in("id", ids)` for efficiency
- Selection clears when space changes or after a bulk action completes
- The action bar is `fixed bottom-0` with a backdrop blur, similar to ClickUp's "N Task selected" bar
- Category creation in the combobox reuses the existing `createCategory` function from `usePlannerSpaces`


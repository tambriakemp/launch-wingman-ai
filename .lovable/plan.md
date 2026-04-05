

## ClickUp-Style Goals Redesign

Based on the screenshots, the Goals section needs three key views: a **Folders grid** (top-level), a **Folder detail** (showing goal cards in a 3-column grid with progress rings), and a **Goal detail** page (with breadcrumbs, progress ring, description, and targets list). The current implementation has a flat list of goals with filter pills -- this needs to become a folder-based hierarchy.

### Database Changes

**New `goal_folders` table:**
- `id` (uuid, PK), `user_id` (uuid, FK auth.users), `name` (text), `position` (int, default 0), `created_at` (timestamptz)
- RLS: users can CRUD their own rows

**Add `folder_id` column to `goals` table:**
- `folder_id` (uuid, nullable, FK goal_folders.id ON DELETE SET NULL)
- Existing goals get `folder_id = null` (shown as unfiled)

### Page Structure

**1. Goals landing page (`/goals`) — Folders grid view**
- Header: "Goals" title, toggle buttons for "Folders: Show/Hide" and "Archived: Show/Hide", "+ NEW GOAL" button
- Grid of folder cards (like the first screenshot): each card shows a folder icon, folder name, and goal count in parentheses
- Last card is always a "+ New Folder" card to create folders
- Clicking a folder navigates to `/goals/folder/:folderId`
- If folders are hidden, show the flat goal cards grid directly (like screenshot 2 but without folder context)

**2. Folder detail page (`/goals/folder/:folderId`)**
- Breadcrumb: "All Goals > [Folder icon] [Folder Name]" with "..." menu for rename/delete
- Toolbar: "Sort by: Updated", "Archived: Hide", "Sharing & Permissions" (decorative), "+ NEW GOAL" button
- 3-column grid of goal cards, each showing:
  - Colored top bar (from goal.color)
  - Circular progress ring with percentage in center
  - Goal title below the ring
  - "[N] targets" link in accent color
  - Timestamp at bottom-left, status icon at bottom-right
- Clicking a goal card navigates to `/goals/:goalId` (existing detail page)

**3. Goal detail page (`/goals/:goalId`) — Redesign**
- Breadcrumb: "All Goals > [Folder icon] [Folder Name]" at top
- Full-width dark card header with:
  - Target date at top-left
  - Large progress ring on the left with percentage
  - Goal title next to ring with "..." menu
  - Description/notes area below title (placeholder: "Write or type '/' for commands and AI actions")
- "Targets" section with "+ Add" button
- Each target row: icon, name, timestamp, "..." menu, progress fraction (e.g. "0/1"), progress bar
- Keep existing activity timeline below

### Files to Create
- `src/components/goals/GoalFolderCard.tsx` — folder card with icon + name + count
- `src/components/goals/GoalGridCard.tsx` — ClickUp-style goal card with progress ring (replaces GoalCard in folder view)
- `src/pages/GoalFolderDetail.tsx` — folder detail page with goal grid

### Files to Modify
- `src/pages/Goals.tsx` — Replace current list view with folders grid + flat goals view
- `src/pages/GoalDetail.tsx` — Redesign header to match screenshot 3 (progress ring left, title right, breadcrumb, description area, cleaner target rows)
- `src/App.tsx` — Add route for `/goals/folder/:folderId`

### Technical Details
- Folder CRUD: create/rename/delete folders via inline dialogs
- Goal creation dialog gets a "Folder" selector dropdown (defaults to current folder if inside one)
- Moving goals between folders via the goal edit dialog or a context menu
- Progress ring SVG uses `strokeDasharray` calculation based on targets completed percentage (already exists in GoalDetail, reuse for grid cards)
- Sort options: "Updated", "Created", "Name" — stored in component state
- Archived toggle filters goals with `status === 'archived'`


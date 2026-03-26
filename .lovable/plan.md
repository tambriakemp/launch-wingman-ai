

## Fix: Route "New Project" button to 2-step wizard

### Problem
The `ProjectSelector` component has its own inline dialog that creates a project with just a name — it never uses the 2-step wizard in `AppRedirect.tsx`. When clicking "New Project" in the dropdown, users get a simple name-only dialog instead of the full wizard (name → funnel type selection).

### Solution
Change `handleOpenCreateDialog` in `ProjectSelector.tsx` to navigate to `/app?new=1` instead of opening the inline dialog. Remove the now-unused inline create dialog.

### Changes

**`src/components/ProjectSelector.tsx`**
1. In `handleOpenCreateDialog`, after the upgrade gate check, replace `setShowNameDialog(true)` with `navigate('/app?new=1')`
2. Remove the `showNameDialog` state, `projectName` state, `createProjectMutation`, `resetDialog`, `handleCreateProject` function, and the `<Dialog>` JSX block — all are now unused since project creation is handled by `AppRedirect.tsx`
3. Keep the upgrade dialog logic intact (free users with 1+ projects still get gated)


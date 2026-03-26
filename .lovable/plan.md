

## Offer Tab → Smart Redirect with Dependency Gate

### What happens now
The `/projects/:id/offer` route redirects to `/projects/:id/dashboard` (legacy redirect in App.tsx).

### What we'll build
When the user clicks "Offer" in the sidebar:
1. **If all dependencies for `planning_offer_stack` are completed** → redirect to `/projects/:id/tasks/planning_offer_stack` (the offer stack task page)
2. **If dependencies are NOT met** → show a dialog explaining they need to complete prerequisite tasks first, with a button that navigates to the next task they need to complete

### Changes

**1. Create `src/pages/project/OfferGate.tsx`** (new file)
- A small page component that uses `useTaskEngine` to check the status of `planning_offer_stack` dependencies
- On mount:
  - Get the `planning_offer_stack` template and its dependencies
  - Check if all dependency tasks have `status === 'completed'` in `projectTasks`
  - If yes → `navigate` to `/projects/${id}/tasks/planning_offer_stack`, replace: true
  - If no → render an `AlertDialog` (auto-open) with:
    - Title: "Complete previous tasks first"
    - Description: "You need to finish the prerequisite tasks before you can access your Offer Stack."
    - A "Go to Next Task" button that navigates to `nextBestTask.route`
    - A "Back" button that navigates back / closes

**2. Update `src/App.tsx`**
- Replace the existing `/projects/:id/offer` route (currently `<Navigate to="../dashboard" replace />`) with the new `OfferGate` component wrapped in `ProtectedRoute`

### Technical details
- `useTaskEngine` already provides `projectTasks`, `nextBestTask`, and `getTaskTemplate` — all needed for the dependency check
- The `planning_offer_stack` task has `dependencies: ['planning_choose_launch_path']`, so the gate checks if that setup task is done
- Uses existing `AlertDialog` components from `@/components/ui/alert-dialog`


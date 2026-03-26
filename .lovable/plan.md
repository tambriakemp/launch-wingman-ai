

## Simplify Project Creation: Remove Funnel Selection from Wizard

### Problem
The 2-step project creation wizard asks users to pick a funnel type before they even have a project. Users who want marketing features or other non-funnel features get stuck or skip, and when they skip, the project name doesn't get created (bug). The funnel selection already exists as a task (`planning_choose_launch_path`) inside the Planning phase — it should be the only place to choose.

### Solution
1. **Simplify `AppRedirect.tsx`** — Remove step 2 entirely. The wizard becomes a single-step "name your project" flow. On submit, create the project with `selected_funnel_type: null` and navigate to the dashboard. No funnel tasks are injected at creation time (they get injected later when the user completes the `planning_choose_launch_path` task, which already works via `useTaskEngine`).

2. **No changes needed to TasksBoard or PhaseSection** — The existing flow already handles the "no funnel selected" state correctly: it shows the Planning phase with the "Choose how you'll sell" task, and once that task is completed, the `useTaskEngine` hook injects the funnel-specific tasks. The callout banner at line 626-635 already tells users to complete Planning first.

### Changes

**`src/pages/AppRedirect.tsx`**
- Remove all step 2 code: the `step` state, `selectedFunnelType` state, `FUNNEL_OPTIONS` array, `FREE_FUNNEL_TYPES`, `isPro`, the `FunnelDiagram` / `RadioGroup` / `Crown` imports, and the entire step 2 JSX block
- Remove funnel-related logic from `handleCreateProject`: no more `funnelToUse`, no `planning_choose_launch_path` insert, no `funnels` insert, no delta task injection
- The "Next" button on step 1 becomes "Create Project" and directly calls `handleCreateProject`
- Keep everything else: onboarding check, redirect logic, localStorage, notification email

**`src/components/ProjectSelector.tsx`**
- No changes needed (already navigates to `/app?new=1`)

### What stays the same
- The `planning_choose_launch_path` task in the Planning phase still handles funnel selection
- `useTaskEngine` still handles task injection when that task is completed
- The TasksBoard still shows the "Complete Planning" callout when no funnel is selected
- Pro gating on funnel types still works inside the task detail page


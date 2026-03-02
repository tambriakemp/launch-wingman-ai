

## Remove Launch Date Screen from Project Creation

The launch timeline picker (step 2) appears in two places during project creation. Both will be simplified to a single-step flow: enter name, create project.

### Changes

**1. `src/pages/AppRedirect.tsx`** (first-time user project creation)
- Remove the `LaunchDates` interface, date state, `programWeeks`/`restWeeks` state, `calculateDatesFromPrelaunch` logic, and the `DatePickerField` component
- Remove `step` state -- no longer needed since there's only one step
- Remove `handleNextStep` and `handleSkipTimeline` functions
- Remove the `launch_events` insert from `handleCreateProject`
- Remove unused imports: `Calendar`, `Popover`, `PopoverContent`, `PopoverTrigger`, `CalendarIcon`, `Clock`, `Coffee`, `Package`, `Sparkles`, `format`, `addWeeks`, `subWeeks`, `cn`
- The "Continue" button now directly calls `handleCreateProject` instead of advancing to step 2

**2. `src/components/ProjectSelector.tsx`** (sidebar "New Project" dialog)
- Same cleanup: remove `LaunchDates`, date state, `programWeeks`/`restWeeks`, `calculateDatesFromPrelaunch`, `DatePickerField`, `step` state
- Remove `handleNextStep` and `handleSkipTimeline`
- Remove `launch_events` insert from the mutation
- Remove unused imports
- Dialog footer simplifies to just "Cancel" and "Create Project" buttons (no Back/Skip/Next)
- The "Next" button becomes "Create Project" and calls the mutation directly

### What's preserved
- Project name input and validation
- Project creation logic (insert into `projects` table)
- localStorage save of last project
- Navigation to the new project's dashboard
- Notification email on project creation
- Upgrade dialog for free-user project limits


Goal
- Fix the “tasks look complete but the ‘This step is complete when’ checkboxes and niche/audience context don’t persist” problem.
- Ensure the Offer Stack slideout shows the “Generate Examples” button reliably once an offer type is selected, and that it has the planning-phase context needed to generate good ideas.

What’s happening (root causes)
1) “This step is complete when” checkboxes are being overwritten
- In TaskDetail, completion criteria are saved via handleCriteriaToggle(), but:
  - Auto-save (saveInputData) writes input_data WITHOUT completedCriteria.
  - “Save & mark complete” (handleSaveAndComplete) also writes input_data WITHOUT completedCriteria.
- Because completeTask() overwrites the task’s input_data, the saved criteria get erased even if they were checked.

2) Offer Stack “Generate Examples” button is hidden because audienceData is undefined
- OfferSnapshotTask builds audienceData from the funnels table.
- Your project currently has 0 rows in funnels for this project, so audienceData becomes undefined.
- OfferSlotSheet currently renders the button only if (audienceData && offerType). With no funnel row, audienceData is undefined → button never appears.

3) “Niche not saved” is (mostly) a sync issue, not a UI input issue
- Planning tasks store values in project_tasks.input_data (e.g., audience_description, niche_context).
- Offer Stack and other funnel-aware features read from funnels.niche / funnels.target_audience.
- With no funnels row (and no syncing), the app behaves like the niche/audience isn’t saved even though the planning task may have captured it.

Implementation approach (high level)
- Make task completion criteria persist by including completedCriteria in ALL task saves (auto-save + complete).
- Ensure a funnel context record exists for every project after a launch path is selected (funnel_type is required), and backfill it from completed planning tasks.
- Add a fallback/backfill on the Offer Stack page so that if funnels is missing, it is created from existing planning task data automatically.
- Improve the Offer Slot slideout UX: show “Generate Examples” as soon as an offer type is selected; if audience context is missing, keep it visible but disabled and explain what to complete.

Files to update
1) src/pages/project/TaskDetail.tsx
Changes:
- Persist completion criteria everywhere:
  - Update saveInputData() to include completedCriteria in the input_data payload.
  - Update handleSaveAndComplete() to include completedCriteria in the inputData passed to completeTask().
  - Ensure auto-save “hasData” logic remains correct (it can ignore completedCriteria for deciding whether to save, but completedCriteria should still be included once saving happens).
- Optional robustness:
  - After handleCriteriaToggle() write, call refreshTasks() (from useTaskEngine) or invalidate local state so the in-memory projectTasks doesn’t lag behind DB (helps edge cases when navigating quickly).

2) src/hooks/useTaskEngine.ts
Changes:
- Prevent accidental data loss:
  - In completeTask(), when setting input_data, merge new inputData with existingTask.inputData instead of overwriting blindly (at minimum preserve completedCriteria).
    - Example approach: const merged = { ...(existingTask.inputData||{}), ...(inputData||{}) }.
- Ensure a funnels row exists once launch path is chosen:
  - In the existing special-case for planning_choose_launch_path, after updating projects.selected_funnel_type:
    - Upsert into funnels on conflict(project_id) with:
      - project_id, user_id, funnel_type = selectedType
      - plus a “backfill” of planning context gathered from projectTasks (audience/problem/outcome/time-effort/belief-building).
- Add a small helper inside this file (or extracted to a lib util) to build funnel updates from projectTasks:
  - planning_define_audience:
    - target_audience <- audience_description
    - niche <- map niche_context to its label if present (or store the raw value as fallback)
  - planning_define_problem:
    - primary_pain_point <- primary_problem
  - planning_define_dream_outcome:
    - desired_outcome <- dream_outcome
  - planning_time_effort_perception:
    - time_effort_elements <- [{type:'quick_win',content:quick_wins},{type:'friction_reducer',content:friction_reducers},{type:'effort_reframe',content:effort_reframe?}]
  - planning_perceived_likelihood:
    - main_objections <- belief_blockers
    - likelihood_elements <- [{type:'past_attempts',content:past_attempts},{type:'belief_builders',content:belief_builders}]

3) src/pages/project/OfferSnapshotTask.tsx
Changes:
- Add a “ensure funnel context exists” backfill:
  - If funnel query returns null AND selectedFunnelType exists:
    - Build funnel context from projectTasks (already available via useTaskEngine) using the same mapping helper idea.
    - Upsert into funnels with project_id/user_id/funnel_type + mapped fields.
    - Invalidate/refetch the funnel query so audienceData becomes available immediately.
- (Optional) Improve resilience:
  - If funnel still missing after refetch, show a small inline callout explaining “Complete the audience tasks to unlock AI examples” (but ideally it won’t be needed once backfill works).

4) src/components/funnel/OfferSlotSheet.tsx
Changes:
- Make the button visible in the slideout as requested:
  - Render “Generate Examples” whenever data.offerType is selected (not dependent on audienceData existing).
  - Disable it when audienceData is missing OR when required context like target audience is missing.
  - Add a small helper line under the button when disabled:
    - “Complete ‘Define your target audience’ to unlock examples.”
- Keep the generated cards placement exactly as you requested (already correct): below pricing row, above Save button.

Validation / testing checklist
- Task criteria persistence:
  1) Open “Define your target audience”.
  2) Check a criterion, refresh page → stays checked.
  3) Check all criteria + Save & mark complete, reopen task → still checked.
- Funnel context persistence:
  1) Complete the planning tasks (audience/problem/outcome/etc.).
  2) Go to “Map your offer stack” → the app should auto-create funnel context and the Offer Stack should now have audienceData.
  3) Verify that other funnel-based summaries now show niche/target audience (no longer “Not set”).
- Offer slot slideout:
  1) Open an offer slot.
  2) Select Offer Type → “Generate Examples” appears under Description (right-aligned).
  3) If audience data exists: click Generate Examples → 3 cards appear between pricing row and Save; “Generate More” works.
  4) If audience data missing: button remains visible but disabled with guidance.

Notes / edge cases
- funnels.funnel_type is required, so we only create the funnels row once a funnel type exists (after “Choose how you’ll sell your offer”).
- The backfill in OfferSnapshotTask is important for existing projects that already have completed tasks but no funnels row (like yours right now).

Out of scope (for this iteration)
- Reworking the entire planning flow to use only the newer Plan pages; this plan focuses on making the current Tasks flow consistent and reliable.

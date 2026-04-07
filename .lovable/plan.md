

## Plan: Fix Navigation Block & Remove "Set Your Price" Task

### Problem 1: Broken Dependency Blocking Navigation
The "Define your ongoing promise" task (and similar delta tasks for Challenge and Launch funnel types) depends on `planning_offer_snapshot` — **a task that doesn't exist**. This means the dependency can never be satisfied, permanently blocking progression.

**Affected tasks** (all in `src/data/funnelDeltaTasks.ts`):
- `planning_ongoing_promise` (membership, order 6.1)
- `planning_challenge_focus` (challenge, order 6.1)  
- `planning_launch_window` (launch, order 6.1)

**Fix**: Change their dependency from `planning_offer_snapshot` to `planning_perceived_likelihood` (the last completed universal task at order 5, which is "Increase belief that this will work").

### Problem 2: Remove "Set Your Price" Task
The `planning_set_price` task (order 7.5) is a duplicate since pricing is handled within the offer builder.

**Changes needed in `src/data/taskTemplates.ts`**:
- Remove the entire `planning_set_price` task definition
- Update `planning_phase_review` (order 8) which depends on `planning_set_price` → change its dependency to `planning_offer_stack`

**Changes needed in `src/data/voiceScripts.ts`**:
- Remove the `planning_set_price` voice script entry

### Files to Modify
- `src/data/funnelDeltaTasks.ts` — fix 3 broken dependencies (`planning_offer_snapshot` → `planning_perceived_likelihood`)
- `src/data/taskTemplates.ts` — remove `planning_set_price` task, update `planning_phase_review` dependency
- `src/data/voiceScripts.ts` — remove `planning_set_price` script

No database changes needed.



# Fix: SimpleLaunchPageTask Cannot Be Completed

## Problem Identified

The SimpleLaunchPageTask has a **conflicting validation** issue:

1. The task has `hasCustomCompletionUI = true`, which **hides** the standard "This step is complete when" checklist
2. However, the `isTaskComplete` check in `handleSaveAndComplete` still requires `allCriteriaComplete` to be true
3. Since the completion criteria checkboxes are hidden, users cannot check them
4. Result: Users see "Please complete the required fields before continuing" but cannot see any fields to complete

### The Two Validation Layers

| Validation | Visible to User? | Current State |
|------------|------------------|---------------|
| `checklistItems.length >= 3` (YOUR PROGRESS section) | YES | User checked all 3 |
| `completedCriteria` (This step is complete when) | HIDDEN | Empty - users can't check it |

Both are required by `isTaskComplete`, but only one is visible.

---

## Solution

For `SimpleLaunchPageTask`, the internal checklist ("YOUR PROGRESS") serves the same purpose as the completion criteria. The fix is to skip the `allCriteriaComplete` requirement for this custom component.

### File: `src/pages/project/TaskDetail.tsx`

**Change the `isTaskComplete` logic (around lines 658-690)**

Current logic:
```typescript
const isTaskComplete = useMemo(() => {
  // ... input checks ...
  
  // Task is only complete when both input is filled AND all criteria are checked
  return inputComplete && allCriteriaComplete;  // ← Problem: always checks allCriteriaComplete
}, [...]);
```

New logic:
```typescript
const isTaskComplete = useMemo(() => {
  // ... input checks (unchanged) ...
  
  // For SimpleLaunchPageTask, the internal checklist IS the completion criteria
  // so we skip the allCriteriaComplete check (those checkboxes are hidden anyway)
  if (taskTemplate.inputType === 'custom' && 
      taskTemplate.inputSchema?.customComponent === 'SimpleLaunchPageTask') {
    return inputComplete; // Only need the 3 checklist items checked
  }
  
  // For all other tasks, require both input AND all criteria checked
  return inputComplete && allCriteriaComplete;
}, [...]);
```

---

## Why This Is Correct

The `SimpleLaunchPageTask` component already has its own completion validation:
- The internal `isComplete` checks `checklistItems.length === 3`
- The "Save & mark complete" button is disabled until all 3 items are checked
- The component confirmation dialog adds a final check

The task template's `completionCriteria` array was designed for the standard completion UI, which this custom component intentionally replaces.

---

## Technical Summary

| File | Change |
|------|--------|
| `src/pages/project/TaskDetail.tsx` | Modify `isTaskComplete` useMemo to skip `allCriteriaComplete` check for `SimpleLaunchPageTask` |

---

## Expected Behavior After Fix

1. User checks all 3 items in "YOUR PROGRESS" section
2. "Save & mark complete" button becomes enabled
3. User clicks button → Confirmation dialog appears
4. User confirms → Task saves and marks complete
5. User navigates to dashboard

No other validation changes needed.

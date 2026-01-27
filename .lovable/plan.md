

# Display Actual User Responses in Planning Review Checklist

## What We're Changing
Replace the generic descriptions in the "Your Response" checklist (e.g., "I know exactly who this is for") with the actual user inputs from completed planning tasks.

---

## Current Behavior vs. New Behavior

| Checklist Item | Current Description | New Description (Example) |
|----------------|--------------------|--------------------|
| Target audience defined | "I know exactly who this is for" | "Busy professionals feeling overwhelmed by money decisions" |
| Main problem identified | "The problem feels specific and real" | "They struggle to make confident financial choices" |
| Dream outcome clear | "I can describe success in human terms" | "Feeling in control and at peace with their finances" |
| Time & effort defined | "Early relief - Reduced friction - Realistic effort" | Bullet list of quick wins and friction reducers |
| Trust factors identified | "I know how to address skepticism" | Bullet list of belief blockers and builders |
| Offer stack mapped | "I can see my offer ecosystem" | List of configured offers with titles |
| Launch path selected | "I know how I'll sell this" | "Freebie to Email to Offer" (the selected path name) |

---

## Implementation Approach

### Step 1: Create Helper Function
Add a function in `TaskDetail.tsx` that maps each checklist option value to the corresponding user response from `projectTasks`:

```typescript
const getChecklistItemDescription = (optionValue: string): string | React.ReactNode => {
  // Map checklist values to their source task IDs and extract actual user data
  switch (optionValue) {
    case 'audience_reviewed': {
      const task = projectTasks.find(t => t.taskId === 'planning_define_audience');
      const inputData = task?.inputData as Record<string, unknown> | undefined;
      return inputData?.audience_description 
        ? String(inputData.audience_description)
        : "Not yet defined";
    }
    case 'problem_reviewed': {
      const task = projectTasks.find(t => t.taskId === 'planning_define_problem');
      // ... extract primary_problem
    }
    // ... etc for each option
  }
};
```

### Step 2: Handle Multi-Input Tasks with Bullet Points
For tasks with multiple inputs (time/effort perception, perceived likelihood), render as a formatted list:

```tsx
case 'time_effort_reviewed': {
  const task = projectTasks.find(t => t.taskId === 'planning_time_effort_perception');
  const inputData = task?.inputData as Record<string, unknown> | undefined;
  const items = [
    inputData?.quick_wins && `Quick wins: ${inputData.quick_wins}`,
    inputData?.friction_reducers && `Friction reducers: ${inputData.friction_reducers}`,
  ].filter(Boolean);
  
  if (items.length === 0) return "Not yet defined";
  
  return (
    <ul className="list-disc list-inside space-y-1">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}
```

### Step 3: Fetch Offers for "Offer Stack Mapped"
Query configured offers from the database or existing state:

```tsx
case 'offer_reviewed': {
  // Use offers data from query or projectTasks
  // Show list of offer titles like:
  // - Lead Magnet: "Free Budget Template"
  // - Core Offer: "Money Mastery Course"
}
```

### Step 4: Update Checklist Rendering
Replace the static description with the dynamic content:

```tsx
{/* Current */}
<p className="text-sm text-muted-foreground leading-relaxed">
  {option.description}
</p>

{/* Updated */}
<div className="text-sm text-muted-foreground leading-relaxed">
  {getChecklistItemDescription(option.value)}
</div>
```

---

## Data Mapping Reference

| Checklist Value | Source Task | Input Field(s) |
|-----------------|-------------|----------------|
| `audience_reviewed` | `planning_define_audience` | `audience_description` |
| `problem_reviewed` | `planning_define_problem` | `primary_problem` |
| `outcome_reviewed` | `planning_define_dream_outcome` | `dream_outcome` |
| `time_effort_reviewed` | `planning_time_effort_perception` | `quick_wins`, `friction_reducers`, `effort_reframe` |
| `belief_reviewed` | `planning_perceived_likelihood` | `past_attempts`, `belief_blockers`, `belief_builders` |
| `offer_reviewed` | Offers table query | `title`, `offer_type` for each slot |
| `path_reviewed` | `planning_choose_launch_path` | `selected` |

---

## Files to Update

| File | Change |
|------|--------|
| `src/pages/project/TaskDetail.tsx` | Add `getChecklistItemDescription` function and update checklist rendering to use dynamic content |

---

## Visual Result

**Before:**
```
☐ Target audience defined
   I know exactly who this is for

☐ Time & effort perception defined
   Early relief • Reduced friction • Realistic effort
```

**After:**
```
☐ Target audience defined
   Busy professionals feeling overwhelmed by money decisions

☐ Time & effort perception defined
   • Quick wins: See your spending breakdown in 5 minutes
   • Friction reducers: No complex spreadsheets needed
```

---

## Edge Cases

1. **Task not completed yet**: Show "Not yet defined" in muted/italic style
2. **Empty response**: Show "Not yet defined"
3. **Very long responses**: Truncate to ~120 characters with "..." for readability
4. **Offers not configured**: Show "No offers configured yet"


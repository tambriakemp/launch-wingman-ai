

## Context-Aware Check-In Orientation Options

### Problem
Currently, the check-in orientation options are hardcoded in `CheckInOrientation.tsx`, showing all 5 options regardless of user history. This means new users with no past projects see "Revisit a past project" and "Plan a relaunch" - options that don't make sense for them.

### Solution Overview
Make the orientation options context-aware by:
1. Querying the user's project history in the `useCheckIn` hook
2. Passing a `hasPastProjects` flag through the component chain
3. Filtering displayed options based on user context

---

## Implementation Details

### 1. Update `src/hooks/useCheckIn.ts`

Add a new query to check if the user has any past/completed projects:

```typescript
// Add query for project history (around line 77)
const { data: projects = [] } = useQuery({
  queryKey: ["user-projects-for-checkin", user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, status")
      .eq("user_id", user!.id);

    if (error) throw error;
    return data || [];
  },
  enabled: !!user,
});

// Compute hasPastProjects (projects that are completed/archived OR more than 1 project)
const hasPastProjects = projects.some(p => 
  ['completed', 'archived', 'launched'].includes(p.status)
) || projects.length > 1;
```

Update the return statement to include:
```typescript
return {
  // ... existing returns
  hasPastProjects,
};
```

---

### 2. Update `src/components/check-in/CheckInFlow.tsx`

Pass `hasPastProjects` from the hook to the `CheckInOrientation` component:

```tsx
// Get hasPastProjects from hook
const { currentPrompt, submitCheckIn, isSubmitting, snoozeCheckIn, hasPastProjects } = useCheckIn();

// Pass to CheckInOrientation (around line 141-144)
<CheckInOrientation
  onSelect={handleOrientationSelect}
  isSubmitting={isSubmitting}
  hasPastProjects={hasPastProjects}
/>
```

---

### 3. Update `src/components/check-in/CheckInOrientation.tsx`

Modify the component to accept and use `hasPastProjects`:

**Update interface:**
```typescript
interface CheckInOrientationProps {
  onSelect: (choice: OrientationChoice) => void;
  isSubmitting: boolean;
  hasPastProjects: boolean;  // NEW
}
```

**Split options into two sets:**
```typescript
// Options for users WITH past projects
const EXPERIENCED_USER_OPTIONS: { value: OrientationChoice; label: string }[] = [
  { value: "continue_current", label: "Continue with my current project" },
  { value: "revisit_past", label: "Revisit a past project" },
  { value: "plan_relaunch", label: "Plan a relaunch" },
  { value: "start_new", label: "Start something new" },
  { value: "not_sure", label: "I'm not sure yet" },
];

// Simplified options for NEW users (no past projects)
const NEW_USER_OPTIONS: { value: OrientationChoice; label: string }[] = [
  { value: "continue_current", label: "Continue with my project" },
  { value: "start_new", label: "Start something new" },
  { value: "not_sure", label: "I'm not sure yet" },
];
```

**Use context to select options:**
```typescript
export function CheckInOrientation({ onSelect, isSubmitting, hasPastProjects }: CheckInOrientationProps) {
  const [selected, setSelected] = useState<OrientationChoice | null>(null);
  
  // Select appropriate options based on user context
  const options = hasPastProjects ? EXPERIENCED_USER_OPTIONS : NEW_USER_OPTIONS;
  
  // ... rest of component uses `options` instead of `ORIENTATION_OPTIONS`
}
```

---

## Option Labels by User Type

| User Type | Options Shown |
|-----------|---------------|
| **New User** (no past projects) | Continue with my project, Start something new, I'm not sure yet |
| **Experienced User** (has past/completed projects) | Continue with my current project, Revisit a past project, Plan a relaunch, Start something new, I'm not sure yet |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useCheckIn.ts` | Add projects query, compute and export `hasPastProjects` |
| `src/components/check-in/CheckInFlow.tsx` | Pass `hasPastProjects` to `CheckInOrientation` |
| `src/components/check-in/CheckInOrientation.tsx` | Accept prop, define two option sets, conditionally render |

---

## Expected Result
- New users with no completed/archived projects will see 3 simplified, relevant options
- Users with project history will see all 5 options including "Revisit a past project" and "Plan a relaunch"
- The check-in flow feels more personalized and contextually appropriate


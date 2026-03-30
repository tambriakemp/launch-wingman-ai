

## Revamp Goals into Quantifiable Targets (ClickUp-style)

### Summary
Transform the Goals feature from simple checkbox milestones into measurable targets with types (Number, Currency, True/False, Tasks). Each goal gets its own detail page showing progress toward each target, with a timeline of updates.

### Database changes

**1. Evolve `goal_milestones` → `goal_targets` (new table, keep old for backward compat)**

```sql
CREATE TABLE public.goal_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  target_type text NOT NULL DEFAULT 'number',  -- 'number' | 'currency' | 'true_false' | 'tasks'
  unit text DEFAULT NULL,                       -- e.g. 'shares', 'USD', '%'
  start_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 1,
  current_value numeric NOT NULL DEFAULT 0,
  is_done boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.goal_target_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid NOT NULL REFERENCES public.goal_targets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  previous_value numeric NOT NULL,
  new_value numeric NOT NULL,
  note text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

RLS: same pattern — `auth.uid() = user_id` for both tables.

**2. Drop `quarter` column from `goals`**

```sql
ALTER TABLE public.goals DROP COLUMN IF EXISTS quarter;
```

### Frontend changes

**3. New route: `/goals/:goalId`**
- Add `<Route path="/goals/:goalId" element={<GoalDetail />} />` in App.tsx

**4. New page: `src/pages/GoalDetail.tsx`**
- Breadcrumb: Goals → Goal Name
- Goal header (title, description, why, category, target date, overall progress ring)
- **Targets section** with "+ Add" button — each target shows:
  - Name, type badge, progress bar, current/target values
  - Click to expand and log an update (increment value + optional note)
- **Timeline section** — chronological list of all updates across targets

**5. Update `GoalCard.tsx`**
- Replace milestone list with target progress bars
- Show overall goal progress (% of targets completed)
- Click on card navigates to `/goals/${goal.id}` instead of expanding inline
- Remove quarter badge

**6. Update `GoalDialog.tsx`**
- Remove Sprint/Quarter field
- Replace milestones section with **Targets** builder:
  - Each target: name, type selector (Number / Currency / True/False / Tasks), start value, target value, optional unit
  - For True/False: auto-set start=0, target=1
  - For Tasks: target_value = number of sub-tasks

**7. Update `Goals.tsx` (list page)**
- Remove quarter from interfaces and filters
- Replace `GoalMilestone` with `GoalTarget` type
- Fetch from `goal_targets` instead of `goal_milestones`
- Goal cards link to detail page

### Data model

```text
Goal
 ├── Target: "TSLA" (Number, 0→85 shares)
 │    ├── Update: +10 on Jan 15
 │    └── Update: +5 on Feb 20
 ├── Target: "150K" (Currency, $0→$125,000)
 │    └── Update: +$79,000 on Jan 27
 └── Target: "5k Cash" (Currency, $0→$5,000)

Overall progress = avg(target progresses)
```

### Technical notes
- Old `goal_milestones` data stays in DB but code stops using it — no data loss
- Target progress auto-calculated: `current_value / target_value * 100`
- A target is "done" when `current_value >= target_value`
- Goal overall progress = percentage of targets marked done


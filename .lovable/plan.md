

# Phase Review Tasks Enhancement

## Overview
This plan implements three major changes:
1. **Reorder review tasks** to be the last task in each phase (Messaging, Build, Content)
2. **Add dynamic user responses** to review task checklists (like planning phase review)
3. **Add export PDF functionality** to each review task

---

## Part 1: Reorder Review Tasks

### Current Order Issues

| Phase | Review Task | Current Order | Tasks After It | New Order |
|-------|-------------|---------------|----------------|-----------|
| Messaging | `messaging_phase_review` | 5 | social_bio (6), visual_direction (7) | **8** |
| Build | `build_phase_review` | 4 | None - already last | 4 (no change) |
| Content | `content_phase_review` | 5 | None - already last | 5 (no change) |

### Changes Required

**File:** `src/data/taskTemplates.ts`

Update `messaging_phase_review` to `order: 8` and change its dependencies to include the last task (`messaging_visual_direction`):

```typescript
{
  taskId: 'messaging_phase_review',
  title: 'Review your messaging',
  phase: 'messaging',
  funnelTypes: ['all'],
  order: 8, // Changed from 5 to 8
  priority: 2,
  dependencies: ['messaging_visual_direction'], // Changed from messaging_common_objections
  // ... rest unchanged
}
```

---

## Part 2: Add Dynamic User Responses to Checklists

### Data Mapping for Each Phase

**Messaging Phase Review** (`messaging_phase_review`)

| Checklist Value | Source Task | Input Field(s) |
|-----------------|-------------|----------------|
| `core_message_reviewed` | `messaging_core_message` | `core_message` |
| `transformation_reviewed` | `messaging_transformation_statement` | `transformation_statement` |
| `talking_points_reviewed` | `messaging_talking_points` | `talking_point_1`, `talking_point_2`, `talking_point_3`, `talking_point_4`, `talking_point_5` |
| `objections_reviewed` | `messaging_common_objections` | `objection_1`, `objection_2`, `objection_3`, `objection_4`, `objection_5` |

**Build Phase Review** (`build_phase_review`)

| Checklist Value | Source Task | Input Field(s) |
|-----------------|-------------|----------------|
| `platform_chosen` | `build_simple_launch_page` | Custom component data (page exists) |
| `page_ready` | `build_simple_launch_page` | Custom component data |
| `ready_to_share` | N/A | User confirmation only |

**Content Phase Review** (`content_phase_review`)

| Checklist Value | Source Task | Input Field(s) |
|-----------------|-------------|----------------|
| `platforms_chosen` | `content_choose_platforms` | `platforms` |
| `themes_defined` | `content_define_themes` | `theme_1`, `theme_2`, `theme_3`, `theme_4`, `theme_5` |
| `posts_planned` | `content_plan_launch_window` | `launch_window_days`, `planned_posts_summary` |
| `captions_drafted` | `content_write_captions` | `captions_written`, `sample_caption` |
| `ready_to_share` | N/A | User confirmation only |

### Implementation

**File:** `src/pages/project/TaskDetail.tsx`

Extend the `getChecklistItemDescription` function to handle all three review tasks:

```typescript
const getChecklistItemDescription = useCallback((optionValue: string): React.ReactNode => {
  const notDefinedText = <span className="italic text-muted-foreground/70">Not yet defined</span>;

  // Planning phase review (existing logic)
  if (taskId === 'planning_phase_review') {
    // ... existing planning logic
  }

  // Messaging phase review
  if (taskId === 'messaging_phase_review') {
    switch (optionValue) {
      case 'core_message_reviewed': {
        const task = projectTasks.find(t => t.taskId === 'messaging_core_message');
        const inputData = task?.inputData as Record<string, unknown> | undefined;
        return inputData?.core_message ? String(inputData.core_message) : notDefinedText;
      }
      case 'transformation_reviewed': {
        const task = projectTasks.find(t => t.taskId === 'messaging_transformation_statement');
        const inputData = task?.inputData as Record<string, unknown> | undefined;
        return inputData?.transformation_statement ? String(inputData.transformation_statement) : notDefinedText;
      }
      case 'talking_points_reviewed': {
        const task = projectTasks.find(t => t.taskId === 'messaging_talking_points');
        const inputData = task?.inputData as Record<string, unknown> | undefined;
        const items: string[] = [];
        for (let i = 1; i <= 5; i++) {
          const point = inputData?.[`talking_point_${i}`];
          if (point) items.push(String(point));
        }
        if (items.length === 0) return notDefinedText;
        return (
          <ul className="list-disc list-inside space-y-0.5 mt-1">
            {items.map((item, i) => <li key={i} className="text-sm">{item}</li>)}
          </ul>
        );
      }
      case 'objections_reviewed': {
        const task = projectTasks.find(t => t.taskId === 'messaging_common_objections');
        const inputData = task?.inputData as Record<string, unknown> | undefined;
        const items: string[] = [];
        for (let i = 1; i <= 5; i++) {
          const objection = inputData?.[`objection_${i}`];
          if (objection) items.push(String(objection));
        }
        if (items.length === 0) return notDefinedText;
        return (
          <ul className="list-disc list-inside space-y-0.5 mt-1">
            {items.map((item, i) => <li key={i} className="text-sm">{item}</li>)}
          </ul>
        );
      }
    }
  }

  // Build phase review
  if (taskId === 'build_phase_review') {
    // Similar pattern for build tasks
  }

  // Content phase review
  if (taskId === 'content_phase_review') {
    // Similar pattern for content tasks
  }

  return null;
}, [taskId, projectTasks, projectOffers]);
```

---

## Part 3: Add Export PDF for Each Phase

### New Components

Create three new export button components following the existing `ExportPlanButton.tsx` pattern:

| Component | Location | Phase Data |
|-----------|----------|------------|
| `ExportMessagingButton.tsx` | `src/components/messaging/` | Core message, transformation, talking points, objections |
| `ExportBuildButton.tsx` | `src/components/build/` | Platform, launch page, email, payments |
| `ExportContentButton.tsx` | `src/components/content/` | Platforms, themes, posts, captions |

Each component will:
1. Accept `projectName`, `projectTasks` as props
2. Extract relevant task data for that phase
3. Generate a branded, print-optimized HTML document
4. Open browser print dialog for PDF export

### PDF Template Structure

**Messaging PDF:**
```text
+--------------------------------------------------+
|           [Project Name]                         |
|        Messaging Foundation                      |
|        Exported [Date]                           |
+--------------------------------------------------+
|                                                  |
|  CORE MESSAGE                                    |
|  ┌──────────────────────────────────────────┐   |
|  │ [Full user response]                     │   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  TRANSFORMATION STATEMENT                        |
|  ┌──────────────────────────────────────────┐   |
|  │ [Full user response]                     │   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  TALKING POINTS                                  |
|  ┌──────────────────────────────────────────┐   |
|  │ • Point 1                                │   |
|  │ • Point 2                                │   |
|  │ • Point 3                                │   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  COMMON OBJECTIONS                               |
|  ┌──────────────────────────────────────────┐   |
|  │ • Objection 1                            │   |
|  │ • Objection 2                            │   |
|  │ • Objection 3                            │   |
|  └──────────────────────────────────────────┘   |
|                                                  |
+--------------------------------------------------+
|           Generated by Launchely                 |
+--------------------------------------------------+
```

### TaskDetail Integration

**File:** `src/pages/project/TaskDetail.tsx`

Add conditional rendering for each phase's export button:

```tsx
<div className="flex items-center gap-3">
  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
    Your response
  </h2>
  {taskId === 'planning_phase_review' && project && (
    <ExportPlanButton {...} />
  )}
  {taskId === 'messaging_phase_review' && project && (
    <ExportMessagingButton 
      projectName={project.name}
      projectTasks={projectTasks}
    />
  )}
  {taskId === 'build_phase_review' && project && (
    <ExportBuildButton 
      projectName={project.name}
      projectTasks={projectTasks}
    />
  )}
  {taskId === 'content_phase_review' && project && (
    <ExportContentButton 
      projectName={project.name}
      projectTasks={projectTasks}
    />
  )}
</div>
```

---

## Files to Create/Update

| File | Action | Description |
|------|--------|-------------|
| `src/data/taskTemplates.ts` | Update | Change `messaging_phase_review` order to 8 and update dependencies |
| `src/pages/project/TaskDetail.tsx` | Update | Extend `getChecklistItemDescription` for messaging, build, content phases; add export button imports and rendering |
| `src/components/messaging/ExportMessagingButton.tsx` | Create | Export PDF for messaging phase |
| `src/components/build/ExportBuildButton.tsx` | Create | Export PDF for build phase |
| `src/components/content/ExportContentButton.tsx` | Create | Export PDF for content phase |

---

## Phase Color Scheme for PDFs

Each PDF will use the phase-specific accent color for section headers:

| Phase | Color | Hex |
|-------|-------|-----|
| Planning | Blue | #3b82f6 |
| Messaging | Purple | #8b5cf6 |
| Build | Emerald | #10b981 |
| Content | Amber | #f59e0b |

---

## Edge Cases

1. **Task not completed**: Show "Not yet defined" in italic muted text
2. **Empty arrays (talking points, objections, themes)**: Show "Not yet defined"
3. **Build phase custom component**: Show task completion status rather than extracted data since `SimpleLaunchPageTask` uses custom storage
4. **Popup blocked**: Show toast with instructions


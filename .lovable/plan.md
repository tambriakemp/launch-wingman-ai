
# Fix Messaging Phase Review Task Issues

## Issues Identified

### Issue 1: Task Order Not Applied
The `messaging_phase_review` task has `order: 8` in the template, but the `getMessagingTasks()` function does NOT sort the results by order. This means tasks are returned in their array definition order, not by the `order` property.

**Current Code:**
```typescript
export function getMessagingTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === 'messaging');
  // Missing: .sort((a, b) => a.order - b.order)
}
```

### Issue 2: Missing Checklist Items
The `messaging_phase_review` checklist only has 4 items but is missing:
- Social media bio (`messaging_social_bio`)
- Visual direction (`messaging_visual_direction`)

### Issue 3: Missing Dynamic Data Rendering
The `getChecklistItemDescription` function in `TaskDetail.tsx` doesn't handle the two new checklist values for social bio and visual direction.

### Issue 4: Missing Export Data
The `ExportMessagingButton.tsx` component doesn't include social bio and visual direction in the PDF export.

---

## Fix Summary

| File | Change |
|------|--------|
| `src/data/taskTemplates.ts` | 1) Add `.sort()` to `getMessagingTasks()` 2) Add 2 new checklist options to `messaging_phase_review` |
| `src/pages/project/TaskDetail.tsx` | Add cases for `social_bio_reviewed` and `visual_direction_reviewed` in `getChecklistItemDescription` |
| `src/components/messaging/ExportMessagingButton.tsx` | Add Social Bio and Visual Direction sections to PDF export |

---

## Detailed Changes

### 1. Fix Task Sorting in `getMessagingTasks()`

**File:** `src/data/taskTemplates.ts` (around line 1208)

```typescript
// Before
export function getMessagingTasks(): TaskTemplate[] {
  return TASK_TEMPLATES.filter(task => task.phase === 'messaging');
}

// After
export function getMessagingTasks(): TaskTemplate[] {
  return TASK_TEMPLATES
    .filter(task => task.phase === 'messaging')
    .sort((a, b) => a.order - b.order);
}
```

### 2. Add Missing Checklist Options

**File:** `src/data/taskTemplates.ts` (messaging_phase_review inputSchema)

Add two new options to the checklist:
```typescript
options: [
  { value: 'core_message_reviewed', label: 'Core message defined', description: 'I can explain my offer simply' },
  { value: 'transformation_reviewed', label: 'Transformation statement written', description: 'The change feels clear and real' },
  { value: 'talking_points_reviewed', label: 'Talking points identified', description: 'I have 3+ ideas to repeat' },
  { value: 'objections_reviewed', label: 'Common objections listed', description: 'I know what might hold them back' },
  // New items:
  { value: 'social_bio_reviewed', label: 'Social media bio created', description: 'My bio sets the right first impression' },
  { value: 'visual_direction_reviewed', label: 'Visual direction set', description: 'I have a simple visual style for this launch' },
],
```

### 3. Add Dynamic Data Rendering for New Items

**File:** `src/pages/project/TaskDetail.tsx` (inside messaging_phase_review switch)

```typescript
case 'social_bio_reviewed': {
  const task = projectTasks.find(t => t.taskId === 'messaging_social_bio');
  if (!task || task.status !== 'completed') return notDefinedText;
  // Social bio uses custom component, show completion status
  return 'Social bio configured';
}
case 'visual_direction_reviewed': {
  const task = projectTasks.find(t => t.taskId === 'messaging_visual_direction');
  if (!task || task.status !== 'completed') return notDefinedText;
  // Visual direction uses custom component, show completion status
  return 'Visual direction configured';
}
```

### 4. Add Export Sections for Social Bio and Visual Direction

**File:** `src/components/messaging/ExportMessagingButton.tsx`

Add extraction and rendering of social bio and visual direction data:
```typescript
// Extract social bio data
const socialBioTask = projectTasks.find(t => t.taskId === 'messaging_social_bio');
const socialBioCompleted = socialBioTask?.inputData ? true : false;
const socialBioData = socialBioTask?.inputData as Record<string, unknown> || null;

// Extract visual direction data  
const visualDirectionTask = projectTasks.find(t => t.taskId === 'messaging_visual_direction');
const visualDirectionCompleted = visualDirectionTask?.inputData ? true : false;

// Add to HTML output
${renderSection('Social Media Bio', socialBioCompleted ? 'Bio configured (see app for details)' : null)}
${renderSection('Visual Direction', visualDirectionCompleted ? 'Visual direction set (see app for details)' : null)}
```

---

## Expected Result

After these changes:
1. **Task list order**: "Review your messaging" will appear LAST in the Messaging phase (after "Set your launch visual direction")
2. **Checklist completeness**: All 6 messaging tasks will appear as checkboxes in the review
3. **Dynamic data**: Each checkbox will show actual user responses or completion status
4. **PDF export**: Will include all 6 sections including social bio and visual direction

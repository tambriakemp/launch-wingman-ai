# Comprehensive Relaunch Feature Enhancement Plan

## Overview

This plan addresses 9 gaps and enhancements for the relaunch feature, organized by priority and implementation complexity.

---

## 1. `needs_review` Flag UI Integration

**Priority: High | Complexity: Medium**

The `project_memory` table has a `needs_review` flag that is currently never surfaced in the UI.

### Database Schema (Existing)
```
project_memory:
  - id: uuid
  - project_id: uuid
  - memory_key: text (e.g., "messaging", "funnel_type")
  - needs_review: boolean (default true for adaptive memory)
  - reviewed_at: timestamp
```

### Implementation

**A. Create Review Banner Component**

File: `src/components/relaunch/MemoryReviewBanner.tsx`
- Query `project_memory` for current project where `needs_review = true`
- Display a subtle banner: "You have X items to review from your last launch"
- Clicking opens a review sheet/dialog

**B. Create Memory Review Sheet**

File: `src/components/relaunch/MemoryReviewSheet.tsx`
- List each memory item needing review with its current value
- For each item, show:
  - Memory label (from MEMORY_LABELS)
  - Current value (fetched from related table based on memory_key)
  - "Looks good" button (marks as reviewed)
  - "Edit" button (navigates to relevant task/section)
- Mark reviewed: `UPDATE project_memory SET needs_review = false, reviewed_at = now()`

**C. Integration Points**

- Add `MemoryReviewBanner` to `ProjectPlan.tsx` or dashboard
- Hook: `useMemoryReview(projectId)` to fetch and manage review state

### Memory Key to Data Mapping
| memory_key | Data Source |
|------------|-------------|
| messaging | project_tasks where task_id = 'messaging_core_message' |
| transformation_statement | projects.transformation_statement |
| funnel_type | funnels.funnel_type |
| content_themes | content_planner.labels |
| launch_window_length | launch_events |

---

## 2. Child Projects Display on Parent

**Priority: High | Complexity: Low**

Show relaunched versions on the parent project.

### Implementation

**A. Query Child Projects**

Add to `useProjectSummary.ts` or create `useChildProjects.ts`:
```typescript
const { data: childProjects } = useQuery({
  queryKey: ['child-projects', projectId],
  queryFn: async () => {
    const { data } = await supabase
      .from('projects')
      .select('id, name, created_at, status')
      .eq('parent_project_id', projectId)
      .order('created_at', { ascending: false });
    return data || [];
  },
});
```

**B. Create Child Projects Card**

File: `src/components/dashboard/ChildProjectsCard.tsx`
- Display only when `childProjects.length > 0`
- Show list with: project name, created date, status badge
- Each item links to that project

**C. Integration**

- Add to `ProjectLaunchedView.tsx` and `ProjectCompletedView.tsx`
- Show below main content: "This project was relaunched as..."

---

## 3. Admin Relaunch Analytics

**Priority: Medium | Complexity: Medium**

Add visibility into relaunch patterns for admin dashboard.

### Implementation

**A. Database Query for Stats**

Create admin function or query:
```sql
SELECT
  COUNT(*) FILTER (WHERE is_relaunch = true) as total_relaunches,
  COUNT(*) FILTER (WHERE skip_memory = true) as fresh_starts,
  AVG(array_length(relaunch_kept_sections, 1)) as avg_kept_sections,
  AVG(array_length(relaunch_revisit_sections, 1)) as avg_revisit_sections
FROM projects
WHERE is_relaunch = true
```

**B. Update admin-platform-stats Edge Function**

File: `supabase/functions/admin-platform-stats/index.ts`
- Add relaunch stats to response:
  - Total relaunches
  - Fresh starts vs memory-based
  - Most commonly kept sections
  - Most commonly revisited sections
  - Relaunch conversion rate (projects relaunched / completed projects)

**C. Create Admin Widget**

File: `src/components/admin/RelaunchStatsCard.tsx`
- Display relaunch metrics with charts
- Show trends over time

**D. Integration**

- Add to `AdminDashboard.tsx` Overview or Analytics tab

---

## 4. Relaunch History/Lineage View

**Priority: Medium | Complexity: Medium**

Visualize the genealogy of relaunched projects.

### Implementation

**A. Create Lineage Hook**

File: `src/hooks/useProjectLineage.ts`
```typescript
interface ProjectNode {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  children: ProjectNode[];
}

// Recursively fetch parent chain and children
```

**B. Create Lineage Component**

File: `src/components/project/ProjectLineageView.tsx`
- Tree visualization showing:
  - Root project (original)
  - Chain of relaunches
  - Current project highlighted
- Simple vertical timeline or tree view

**C. Integration**

- Add to Settings dialog or Phase Snapshot
- Link from parent project badge in GreetingHeader

---

## 5. Comparison View Between Parent and Child

**Priority: Low | Complexity: High**

Side-by-side comparison of project data.

### Implementation

**A. Create Comparison Hook**

File: `src/hooks/useProjectComparison.ts`
- Fetch both project summaries using `useProjectSummary`
- Compute differences in metrics

**B. Create Comparison Dialog**

File: `src/components/project/ProjectComparisonDialog.tsx`
- Two-column layout
- Compare:
  - Funnel type
  - Offers
  - Launch window
  - Metrics from snapshots (if available)
  - Task completion rates

**C. Integration**

- Button in ChildProjectsCard: "Compare with this version"
- Button in parent project link

---

## 6. Branding Assets Migration

**Priority: High | Complexity: Medium**

Copy branding elements during relaunch.

### Branding Tables
- `brand_colors`: hex_color, name, position
- `brand_fonts`: font_category, font_family, font_source, custom_font_path
- `brand_photos`: file_name, file_path, file_size
- `brand_logos`: file_name, file_path, file_size

### Implementation

**A. Add "Branding" to RelaunchSection Type**

File: `src/components/relaunch/RelaunchSelectionScreen.tsx`
- Add "branding" to KEEP_SECTIONS array

**B. Update copyProjectData in RelaunchFlow**

File: `src/components/relaunch/RelaunchFlow.tsx`

Add branding copy logic:
```typescript
if (keptSections.includes('branding')) {
  // Copy brand_colors
  const { data: colors } = await supabase
    .from('brand_colors')
    .select('hex_color, name, position')
    .eq('project_id', projectId);
  
  if (colors?.length) {
    await supabase.from('brand_colors').insert(
      colors.map(c => ({
        ...c,
        id: undefined,
        project_id: newProjectId,
        user_id: user.id,
      }))
    );
  }
  
  // Similarly for brand_fonts, brand_photos, brand_logos
  // Note: For photos/logos, files are in storage - just copy references
}
```

**C. Update Types**

File: `src/types/projectMemory.ts`
- Add 'branding' to memory keys if needed

---

## 7. Email Notification on Relaunch

**Priority: Low | Complexity: Low**

Send optional email when relaunch is created.

### Implementation

**A. Add Email Type**

Already exists in `send-notification-email`: `relaunch_invitation`

**B. Create New Email Type for Relaunch Created**

File: `supabase/functions/send-notification-email/index.ts`
- Add `relaunch_created` email type:
```typescript
case "relaunch_created":
  return {
    subject: "Your new launch is ready",
    html: `... New project "${data?.newProjectName}" created from "${data?.parentProjectName}" ...`
  };
```

**C. Trigger Email**

File: `src/components/relaunch/RelaunchFlow.tsx`
- After successful creation:
```typescript
await sendEmail({
  emailType: 'relaunch_created',
  data: {
    newProjectName,
    parentProjectName: projectName,
    projectId: newProjectId,
  }
});
```

---

## 8. Undo/Delete Relaunch Project

**Priority: Low | Complexity: Low**

Easy way to delete a relaunched project.

### Implementation

**A. Add Delete Button to New Project**

Already exists via project settings, but enhance:

File: `src/components/ProjectSettingsDialog.tsx`
- If project is a relaunch and < 24 hours old, show prominent "Undo Relaunch" option
- Deletes the new project
- Shows confirmation with warning

**B. Post-Relaunch Toast**

File: `src/components/relaunch/RelaunchFlow.tsx`
- After navigation to new project, show toast:
```typescript
toast({
  title: "Project created",
  description: "Changed your mind?",
  action: <Button onClick={handleUndo}>Undo</Button>,
  duration: 10000,
});
```

---

## 9. Keyboard Shortcuts and Quick Actions

**Priority: Low | Complexity: Low**

Add keyboard navigation to relaunch flow.

### Implementation

**A. Add Keyboard Handlers**

File: `src/components/relaunch/RelaunchSelectionScreen.tsx`
- Enter key: Continue to next step
- Escape key: Go back / Cancel
- Number keys: Toggle section selection

File: `src/components/relaunch/RelaunchFlow.tsx`
- Add useEffect with keydown listener
- Handle arrow keys for step navigation

**B. Add Quick Select Buttons**

File: `src/components/relaunch/RelaunchSelectionScreen.tsx`
- "Keep All" button - selects all foundational
- "Revisit All" button - selects all adaptive
- "Clear All" button - deselects all

---

## Implementation Order (Recommended)

### Phase 1: Core Functionality
1. `needs_review` Flag UI Integration
2. Child Projects Display on Parent
3. Branding Assets Migration

### Phase 2: Analytics and Insights
4. Admin Relaunch Analytics
5. Relaunch History/Lineage View

### Phase 3: Polish and UX
6. Comparison View Between Parent and Child
7. Email Notification on Relaunch
8. Undo/Delete Relaunch Project
9. Keyboard Shortcuts and Quick Actions

---

## Critical Files for Implementation

| File | Purpose |
|------|---------|
| `src/components/relaunch/RelaunchFlow.tsx` | Main relaunch logic, add branding copy |
| `src/components/relaunch/RelaunchSelectionScreen.tsx` | Add branding section, keyboard shortcuts |
| `src/hooks/useProjectSummary.ts` | Extend with child projects query |
| `supabase/functions/admin-platform-stats/index.ts` | Add relaunch statistics |
| `src/pages/AdminDashboard.tsx` | Display relaunch analytics widget |

---

## Database Changes Required

### No New Tables Needed

All required columns exist:
- `projects.is_relaunch`
- `projects.parent_project_id`
- `projects.skip_memory`
- `projects.relaunch_kept_sections`
- `projects.relaunch_revisit_sections`
- `project_memory` table with `needs_review` flag

### Potential Index Addition
```sql
CREATE INDEX idx_projects_parent_project_id ON projects(parent_project_id) WHERE parent_project_id IS NOT NULL;
```

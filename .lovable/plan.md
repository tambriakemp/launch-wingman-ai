
# Exportable PDF Design for Planning Phase Review

## Overview
Create a professionally designed, exportable PDF of the full planning phase responses. This includes:
1. **Removing text truncation** in the on-screen checklist so users see full responses
2. **Creating a new Export Plan PDF button** with a beautifully designed print-optimized layout

---

## Part 1: Remove Text Truncation (On-Screen)

### Current Behavior
The `truncateText()` helper limits responses to 80-120 characters with "..." appended.

### Change
Remove all `truncateText()` calls in `getChecklistItemDescription` so the full user response is displayed on screen.

### File: `src/pages/project/TaskDetail.tsx`
- Line 150: Change `truncateText(String(value))` to just `String(value)`
- Line 156: Change `truncateText(String(value))` to just `String(value)`  
- Line 162: Change `truncateText(String(value))` to just `String(value)`
- Lines 168-170: Remove `truncateText(..., 80)` wrappers for quick_wins, friction_reducers, effort_reframe
- Lines 183-185: Remove `truncateText(..., 80)` wrappers for belief_blockers, belief_builders, past_attempts

---

## Part 2: Create Export Plan PDF Button

### Design Approach
Create a polished, branded PDF using the existing HTML-to-print pattern (matching `ExportSnapshotButton.tsx`), but with a more refined visual design:

**Visual Design Features:**
- Clean header with project name and "Planning Foundation" title
- Export date stamp
- Section cards with subtle backgrounds and proper spacing
- Visual hierarchy with clear labels vs content
- Accent color for section headers (using a blue tone for consistency with the app's "planning" phase color)
- Professional footer with branding
- Print-optimized with proper page breaks

### PDF Layout Structure

```text
+--------------------------------------------------+
|                                                  |
|           [Project Name]                         |
|        Planning Foundation                       |
|        Exported January 27, 2026                 |
|                                                  |
+--------------------------------------------------+
|                                                  |
|  TARGET AUDIENCE                                 |
|  ┌──────────────────────────────────────────┐   |
|  │ Busy professionals feeling overwhelmed   │   |
|  │ by money decisions                       │   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  MAIN PROBLEM                                    |
|  ┌──────────────────────────────────────────┐   |
|  │ Trying to manage finances feels like     │   |
|  │ another full-time job.                   │   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  DREAM OUTCOME                                   |
|  ┌──────────────────────────────────────────┐   |
|  │ Individuals experience a sense of        │   |
|  │ control and understanding regarding      │   |
|  │ their financial landscape.               │   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  TIME & EFFORT PERCEPTION                        |
|  ┌──────────────────────────────────────────┐   |
|  │ Quick wins:                              │   |
|  │ • Discovering that reviewing monthly...  │   |
|  │                                          │   |
|  │ Friction reducers:                       │   |
|  │ • Discovering that reviewing monthly...  │   |
|  │                                          │   |
|  │ Effort reframe:                          │   |
|  │ • Discovering that reviewing monthly...  │   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  TRUST FACTORS                                   |
|  ┌──────────────────────────────────────────┐   |
|  │ Belief blockers:                         │   |
|  │ • [full text]                            │   |
|  │                                          │   |
|  │ Belief builders:                         │   |
|  │ • [full text]                            │   |
|  │                                          │   |
|  │ Past attempts:                           │   |
|  │ • [full text]                            │   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  OFFER STACK                                     |
|  ┌──────────────────────────────────────────┐   |
|  │ Core: The 'Wealth Without Worry'         │   |
|  │       Playbook: Your Essential Guide...  │   |
|  └──────────────────────────────────────────┘   |
|                                                  |
|  LAUNCH PATH                                     |
|  ┌──────────────────────────────────────────┐   |
|  │ Content → Offer                          │   |
|  └──────────────────────────────────────────┘   |
|                                                  |
+--------------------------------------------------+
|           Generated by Launchbox                 |
+--------------------------------------------------+
```

### New Component: `ExportPlanButton.tsx`

**Location:** `src/components/planning/ExportPlanButton.tsx`

**Props:**
```typescript
interface ExportPlanButtonProps {
  projectName: string;
  projectTasks: ProjectTaskData[];
  offers: Offer[];
  selectedFunnelType: string | null;
}
```

**Styling (CSS-in-HTML for print):**
- **Header**: Centered, large title, subtle separator line
- **Section labels**: Uppercase, small, blue-tinted, with letter-spacing
- **Content cards**: Light gray background (#f8f9fa), rounded corners, good padding
- **Multi-item sections**: Sub-labels in bold, content indented with bullet markers
- **Typography**: System fonts for reliability, 15px body text, 1.7 line-height for readability
- **Print rules**: `page-break-inside: avoid` on content cards

### Button Placement
Add the button to the `TaskDetail.tsx` page, only visible when viewing `planning_phase_review` task. Place it near the top of the task content area (perhaps in the header section or as a secondary action).

---

## Files to Create/Update

| File | Action | Description |
|------|--------|-------------|
| `src/components/planning/ExportPlanButton.tsx` | **Create** | New component with PDF generation logic and professional HTML template |
| `src/pages/project/TaskDetail.tsx` | **Update** | 1) Remove truncation from `getChecklistItemDescription` 2) Import and render `ExportPlanButton` for planning_phase_review task |

---

## Technical Details

### Data Extraction for PDF
The component will receive `projectTasks` (already available in TaskDetail) and `projectOffers` and extract:

```typescript
// Target Audience
const audienceTask = projectTasks.find(t => t.taskId === 'planning_define_audience');
const audience = (audienceTask?.inputData as any)?.audience_description || null;

// Problem
const problemTask = projectTasks.find(t => t.taskId === 'planning_define_problem');
const problem = (problemTask?.inputData as any)?.primary_problem || null;

// Dream Outcome
const outcomeTask = projectTasks.find(t => t.taskId === 'planning_define_dream_outcome');
const outcome = (outcomeTask?.inputData as any)?.dream_outcome || null;

// Time & Effort (multi-field)
const timeEffortTask = projectTasks.find(t => t.taskId === 'planning_time_effort_perception');
const timeEffort = {
  quickWins: (timeEffortTask?.inputData as any)?.quick_wins || null,
  frictionReducers: (timeEffortTask?.inputData as any)?.friction_reducers || null,
  effortReframe: (timeEffortTask?.inputData as any)?.effort_reframe || null,
};

// Trust Factors (multi-field)
const beliefTask = projectTasks.find(t => t.taskId === 'planning_perceived_likelihood');
const trustFactors = {
  beliefBlockers: (beliefTask?.inputData as any)?.belief_blockers || null,
  beliefBuilders: (beliefTask?.inputData as any)?.belief_builders || null,
  pastAttempts: (beliefTask?.inputData as any)?.past_attempts || null,
};

// Offers
const offersList = offers.filter(o => o.offer_type?.trim()).map(o => ({
  slotType: o.slot_type,
  title: o.title || o.offer_type,
}));

// Launch Path
const pathTask = projectTasks.find(t => t.taskId === 'planning_choose_launch_path');
const launchPath = FUNNEL_TYPE_LABELS[(pathTask?.inputData as any)?.selected] || null;
```

### HTML Template Highlights

```html
<style>
  body { 
    font-family: 'Segoe UI', system-ui, sans-serif;
    max-width: 700px; 
    margin: 0 auto; 
    padding: 48px 40px;
    color: #1f2937;
  }
  .header { 
    text-align: center; 
    margin-bottom: 48px; 
    padding-bottom: 24px;
    border-bottom: 2px solid #e5e7eb;
  }
  .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
  .header h2 { font-size: 16px; color: #6b7280; font-weight: 400; }
  .header .date { font-size: 13px; color: #9ca3af; margin-top: 12px; }
  
  .section { margin-bottom: 28px; page-break-inside: avoid; }
  .section-label { 
    font-size: 11px; 
    font-weight: 600; 
    text-transform: uppercase; 
    letter-spacing: 0.05em;
    color: #3b82f6; 
    margin-bottom: 8px;
  }
  .section-content { 
    background: #f8fafc; 
    border: 1px solid #e2e8f0;
    border-radius: 8px; 
    padding: 16px 20px;
    font-size: 15px;
    line-height: 1.7;
    color: #374151;
  }
  .sub-label { font-weight: 600; color: #1f2937; margin-top: 12px; }
  .sub-label:first-child { margin-top: 0; }
  .sub-content { margin-left: 0; margin-top: 4px; }
  
  .footer { 
    margin-top: 48px; 
    padding-top: 20px; 
    border-top: 1px solid #e5e7eb;
    text-align: center; 
    font-size: 12px; 
    color: #9ca3af;
  }
  
  @media print {
    body { padding: 24px; }
    .section { page-break-inside: avoid; }
  }
</style>
```

---

## Edge Cases

1. **Missing data**: If a section has no user response, show "Not yet defined" in muted italic text
2. **Very long responses**: Let them flow naturally since this is for export (no truncation)
3. **No offers configured**: Show "No offers configured yet"
4. **Popup blocked**: Show toast with instructions to allow popups

---

## Access Control
Following the existing pattern in `ExportSnapshotButton.tsx`, the export feature could optionally be gated behind the `export_snapshot` feature access check (or a new `export_plan` feature). For now, we can make it available to all users since it's their own planning data.

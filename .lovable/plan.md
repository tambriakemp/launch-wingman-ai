
# Move Sales Copy to Messaging Phase Task

## Overview

This change converts the Sales Page Copy feature from a tab on the Content page into a proper task within the Messaging phase. The task will be positioned right before the "Review your messaging" task and will follow the same format as other custom tasks like Social Bio and Visual Direction.

---

## What Will Change

| Current State | New State |
|--------------|-----------|
| Sales Copy lives on Content page as a tab | Sales Copy becomes a Messaging phase task |
| Accessed via `/projects/:id/content` tab | Accessed via `/projects/:id/tasks/messaging_sales_copy` |
| No task completion tracking | Full task completion with criteria checkboxes |
| No "Listen to explanation" option | Voice snippet support enabled |
| Content page has 2 tabs | Content page has 1 tab (Social Media Schedule only) |

---

## Implementation Details

### 1. Add New Task Template

**File:** `src/data/taskTemplates.ts`

Add a new task definition in the messaging phase with `order: 7.5` to place it between Visual Direction (order 7) and Phase Review (order 8):

```text
Task ID: messaging_sales_copy
Title: Write your sales page copy
Phase: messaging
Funnel Types: ['all']
Order: 7.5
Priority: 2
Estimated Time: 20-45 min
Blocking: false
Dependencies: ['messaging_visual_direction']
Can Skip: true
Input Type: custom
Custom Component: SalesCopyBuilder
```

Completion Criteria:
- You've written copy for at least one offer
- Your messaging aligns with your transformation statement

Why It Matters:
"Your sales page is where you make the case for your offer. But you don't need to be a professional copywriter to write something that connects. This section-by-section approach helps you build momentum — one block at a time."

Instructions:
1. Select an offer to write copy for
2. Work through each section at your own pace
3. Use AI suggestions when you need inspiration

---

### 2. Add Voice Script

**File:** `src/data/voiceScripts.ts`

Add a new entry:

```typescript
messaging_sales_copy:
  "Your sales page is where everything comes together — your message, your offer, and your audience. You don't need to be a copywriter to write something meaningful. This section-by-section approach breaks it down into manageable pieces. Focus on one block at a time, and trust that clarity sells better than clever tricks."
```

---

### 3. Create Dedicated Task Page

**File:** `src/pages/project/SalesCopyTask.tsx` (new file)

Create a new task page following the same pattern as `SocialBioTask.tsx`:

```text
Structure:
┌────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                │
│                                                    │
│ [Messaging Phase]  [Estimated: 20-45 minutes]      │
│                                                    │
│ Write your sales page copy                         │
│                                                    │
├────────────────────────────────────────────────────┤
│ WHY THIS MATTERS                                   │
│ <Voice snippet button>                             │
│ <Task explanation text>                            │
├────────────────────────────────────────────────────┤
│ WHAT TO DO                                         │
│ 1. Select an offer to write copy for               │
│ 2. Work through each section at your own pace      │
│ 3. Use AI suggestions when you need inspiration    │
├────────────────────────────────────────────────────┤
│ YOUR RESPONSE                                      │
│ <Embedded SalesPageCopyTab component>              │
├────────────────────────────────────────────────────┤
│ BEFORE YOU FINISH                                  │
│ ☐ You've written copy for at least one offer       │
│ ☐ Your messaging aligns with your transformation   │
├────────────────────────────────────────────────────┤
│ [Save & Complete]    [Save for Later]              │
└────────────────────────────────────────────────────┘
```

Key Features:
- Uses `useTaskEngine` hook for task state management
- Includes `VoiceSnippetButton` for "Listen to explanation"
- Embeds `SalesPageCopyTab` component
- Tracks completion via `sales_page_copy` table (existing)
- Auto-saves progress to `project_tasks.input_data`

---

### 4. Add Route

**File:** `src/App.tsx`

Add a new protected route:

```typescript
<Route
  path="/projects/:id/tasks/messaging_sales_copy"
  element={
    <ProtectedRoute>
      <SalesCopyTask />
    </ProtectedRoute>
  }
/>
```

---

### 5. Update Messaging Phase Review Dependency

**File:** `src/data/taskTemplates.ts`

Update `messaging_phase_review` task:
- Change dependency from `['messaging_visual_direction']` to `['messaging_sales_copy']`

---

### 6. Simplify Content Page

**File:** `src/components/content/ContentTab.tsx`

Changes:
- Remove the Sales Page Copy tab from the tab navigation
- Remove the `SalesPageCopyTab` import and rendering
- Since only one tab remains (Social Media Schedule), remove the tab navigation entirely
- Show the social media schedule content directly

---

### 7. Update Sidebar Navigation (if needed)

If the Content section's Sales Copy tab appears in the sidebar, remove that reference.

---

## File Changes Summary

| File | Action |
|------|--------|
| `src/data/taskTemplates.ts` | Add `messaging_sales_copy` task, update `messaging_phase_review` dependency |
| `src/data/voiceScripts.ts` | Add voice script for `messaging_sales_copy` |
| `src/pages/project/SalesCopyTask.tsx` | Create new file (task page) |
| `src/App.tsx` | Add route for the new task page |
| `src/components/content/ContentTab.tsx` | Remove Sales Page Copy tab, simplify to single view |

---

## Task Ordering After Change

**Messaging Phase Tasks:**
1. Clarify your core message (order: 1)
2. Write your transformation statement (order: 2)
3. Define your key talking points (order: 3)
4. Identify common objections (order: 4)
5. Create your social media bio (order: 6)
6. Set your launch visual direction (order: 7)
7. **Write your sales page copy (order: 7.5)** ← NEW
8. Review your messaging (order: 8)

---

## Completion Tracking Logic

The task will track completion based on:
1. Whether at least one offer has sales copy saved (check `sales_page_copy` table)
2. User-confirmed completion criteria checkboxes

The task will query the existing `sales_page_copy` table to determine if there's content saved for the project's offers.

---

## Voice Snippet Integration

The task page will include the `VoiceSnippetButton` component with:
- `taskId`: "messaging_sales_copy"
- `script`: The voice script from `voiceScripts.ts`

This enables the "Listen to explanation" feature that appears on other tasks.

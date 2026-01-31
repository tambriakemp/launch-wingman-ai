
# Add Delivery Asset Tasks to Build Phase

## Overview

This change adds **3 new tasks** to the Build phase, positioned **before** the existing "Set up a simple launch page" task. These tasks help users define and prepare their delivery assets before setting up their launch page.

The new tasks are:
1. **Choose Your Delivery Asset** - Select the delivery format (selection task)
2. **Create or Select the Asset** - Prepare the actual deliverable (form task)
3. **Define the First Access Moment** - Define how delivery happens (selection task)

---

## New Task Sequence (Build Phase)

| Order | Task ID | Title | Type |
|-------|---------|-------|------|
| 1 | `build_choose_delivery_asset` | Choose Your Delivery Asset | selection |
| 2 | `build_create_asset` | Create or Select the Asset | form |
| 3 | `build_define_access_moment` | Define the First Access Moment | selection |
| 4 | `build_simple_launch_page` | Set up a simple launch page | custom (existing) |
| 5 | `build_email_platform` | Connect your email platform | form (existing) |
| 6 | `build_payments_setup` | Set up payments | form (existing) |
| 7 | `build_phase_review` | Review your setup | checklist (existing) |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/data/taskTemplates.ts` | Add 3 new task definitions, update order numbers for existing tasks, update `build_phase_review` checklist options |
| `src/pages/project/TaskDetail.tsx` | Add `getChecklistItemDescription` cases for the new build_phase_review items |
| `src/hooks/usePhaseSnapshot.ts` | Add task label mappings and content extraction for new tasks |
| `src/components/phase-snapshot/SummaryCard.tsx` | Add icon mappings for new tasks |
| `src/components/phase-snapshot/SummaryBlock.tsx` | Add icon mappings for new tasks |
| `src/components/build/ExportBuildButton.tsx` | Add new tasks to PDF export |

---

## Detailed Implementation

### 1. Task Templates (`src/data/taskTemplates.ts`)

#### New Task 1: Choose Your Delivery Asset

```typescript
{
  taskId: 'build_choose_delivery_asset',
  title: 'Choose Your Delivery Asset',
  phase: 'build',
  funnelTypes: ['all'],
  order: 1,
  priority: 1,
  estimatedMinutesMin: 5,
  estimatedMinutesMax: 10,
  blocking: true,
  dependencies: ['messaging_phase_review'],
  canSkip: false,
  skipReasonRequired: false,
  completionCriteria: [
    'You\'ve selected one delivery option',
    'It feels simple and doable right now',
  ],
  whyItMatters: 'This task helps you decide what someone will receive when they say yes to your offer. You already know who this is for and what outcome you\'re helping them achieve. Now we\'re making the offer real by choosing how it\'s delivered.',
  instructions: [
    'Choose the option that best describes what someone receives first',
    'You are not building anything yet',
    'Simply choose the delivery format',
  ],
  inputType: 'selection',
  inputSchema: {
    type: 'radio',
    options: [
      { value: 'live_session', label: 'A live session or workshop', description: 'Real-time interaction with your audience' },
      { value: 'downloadable', label: 'A downloadable resource', description: 'Guide, planner, workbook, or similar' },
      { value: 'access_page', label: 'Access to a page or portal', description: 'Online space where they access content' },
      { value: 'curated_bundle', label: 'A curated bundle of resources', description: 'Collection of materials packaged together' },
      { value: 'affiliate_product', label: 'An affiliate product you recommend', description: 'Product from another creator you promote' },
      { value: 'mrr_plr_product', label: 'An MRR or PLR-based product', description: 'Master resell rights or private label product' },
    ],
  },
  aiAssistModes: ['help_me_choose'],
  route: '/projects/:id/tasks/build_choose_delivery_asset',
}
```

#### New Task 2: Create or Select the Asset

```typescript
{
  taskId: 'build_create_asset',
  title: 'Create or Select the Asset',
  phase: 'build',
  funnelTypes: ['all'],
  order: 2,
  priority: 1,
  estimatedMinutesMin: 15,
  estimatedMinutesMax: 45,
  blocking: true,
  dependencies: ['build_choose_delivery_asset'],
  canSkip: false,
  skipReasonRequired: false,
  completionCriteria: [
    'You have a specific asset chosen or created',
    'You could deliver this today if needed',
  ],
  whyItMatters: 'This task helps you create or select the actual thing you\'re delivering — without starting from scratch. You don\'t need to make this perfect. You just need something real.',
  instructions: [
    'Based on your chosen delivery format, decide on the specific asset',
    'If using a live session, decide the topic and format',
    'If delivering a resource, choose or create the file',
    'If using affiliate, MRR, or PLR, select the product you\'ll use',
    'Pro plan users can use Content Vault templates to speed this up',
  ],
  inputType: 'form',
  inputSchema: {
    type: 'form',
    fields: [
      { 
        name: 'asset_name', 
        label: 'What is the name or title of your asset?', 
        type: 'text', 
        required: true, 
        placeholder: 'e.g., "Getting Started Guide", "90-Minute Strategy Session"...' 
      },
      { 
        name: 'asset_description', 
        label: 'Briefly describe what this asset includes or covers', 
        type: 'textarea', 
        required: true, 
        placeholder: 'Describe the content, format, or what makes it valuable...' 
      },
      { 
        name: 'asset_source', 
        label: 'Where is this asset coming from?', 
        type: 'select', 
        required: false,
        sectionLabel: 'Optional: Helpful context',
        helperText: 'This helps us understand your workflow.',
        options: [
          { value: '', label: 'Select an option...' },
          { value: 'creating_new', label: 'Creating it myself' },
          { value: 'existing_resource', label: 'Using something I already have' },
          { value: 'content_vault', label: 'Using a Content Vault template (Pro)' },
          { value: 'affiliate', label: 'Affiliate product' },
          { value: 'mrr_plr', label: 'MRR/PLR product' },
        ]
      },
    ],
  },
  aiAssistModes: ['help_me_choose', 'examples'],
  route: '/projects/:id/tasks/build_create_asset',
}
```

#### New Task 3: Define the First Access Moment

```typescript
{
  taskId: 'build_define_access_moment',
  title: 'Define the First Access Moment',
  phase: 'build',
  funnelTypes: ['all'],
  order: 3,
  priority: 1,
  estimatedMinutesMin: 5,
  estimatedMinutesMax: 15,
  blocking: true,
  dependencies: ['build_create_asset'],
  canSkip: false,
  skipReasonRequired: false,
  completionCriteria: [
    'You know what happens after someone joins',
    'You know where they go next',
  ],
  whyItMatters: 'This task connects your offer to your tech setup. It answers the question: how does someone receive this after they say yes? You don\'t need automation yet — you\'re simply choosing the first access point.',
  instructions: [
    'Decide how the delivery happens',
    'Choose the first access point after someone says yes',
    'You don\'t need automation set up yet',
  ],
  inputType: 'selection',
  inputSchema: {
    type: 'radio',
    options: [
      { value: 'email_delivery', label: 'Email delivery', description: 'Asset is sent directly to their inbox' },
      { value: 'download_link', label: 'Download link', description: 'They receive a link to download the asset' },
      { value: 'access_page', label: 'Access page', description: 'They\'re directed to a page where they can access content' },
      { value: 'live_session_confirmation', label: 'Live session confirmation', description: 'They receive calendar invite or session details' },
      { value: 'affiliate_redirect', label: 'Affiliate redirect', description: 'They\'re sent to the affiliate product page' },
    ],
  },
  aiAssistModes: ['help_me_choose'],
  route: '/projects/:id/tasks/build_define_access_moment',
}
```

#### Update Existing Task Orders

The following existing tasks need their `order` values updated:

- `build_simple_launch_page`: order 1 → **order 4**
- `build_email_platform`: order 2 → **order 5**
- `build_payments_setup`: order 3 → **order 6**
- `build_phase_review`: order 4 → **order 7**

#### Update `build_phase_review` Checklist

Add new checklist options to reflect the new tasks:

```typescript
inputSchema: {
  type: 'checkbox',
  options: [
    { value: 'delivery_asset_chosen', label: 'Delivery asset chosen', description: 'I know what I\'m delivering' },
    { value: 'asset_ready', label: 'Asset ready', description: 'I have something I could deliver today' },
    { value: 'access_defined', label: 'First access defined', description: 'I know how they\'ll receive it' },
    { value: 'platform_chosen', label: 'Platform chosen', description: 'I know where my offer lives' },
    { value: 'page_ready', label: 'Main page ready', description: 'People can find and understand my offer' },
    { value: 'ready_to_share', label: 'Ready to share', description: 'I\'m ready to tell people about it' },
  ],
}
```

---

### 2. TaskDetail.tsx - Add Review Descriptions

Add cases to `getChecklistItemDescription` for the build_phase_review task:

```typescript
// Build phase review
if (taskId === 'build_phase_review') {
  switch (optionValue) {
    case 'delivery_asset_chosen': {
      const task = projectTasks.find(t => t.taskId === 'build_choose_delivery_asset');
      const inputData = task?.inputData as Record<string, unknown> | undefined;
      const deliveryLabels: Record<string, string> = {
        'live_session': 'Live session or workshop',
        'downloadable': 'Downloadable resource',
        'access_page': 'Access page or portal',
        'curated_bundle': 'Curated bundle',
        'affiliate_product': 'Affiliate product',
        'mrr_plr_product': 'MRR/PLR product',
      };
      const selected = inputData?.selectedOption as string | undefined;
      if (selected && deliveryLabels[selected]) return deliveryLabels[selected];
      if (task?.status === 'completed') return 'Delivery format selected';
      return notDefinedText;
    }
    case 'asset_ready': {
      const task = projectTasks.find(t => t.taskId === 'build_create_asset');
      const inputData = task?.inputData as Record<string, unknown> | undefined;
      if (inputData?.asset_name) return String(inputData.asset_name);
      if (task?.status === 'completed') return 'Asset ready';
      return notDefinedText;
    }
    case 'access_defined': {
      const task = projectTasks.find(t => t.taskId === 'build_define_access_moment');
      const inputData = task?.inputData as Record<string, unknown> | undefined;
      const accessLabels: Record<string, string> = {
        'email_delivery': 'Email delivery',
        'download_link': 'Download link',
        'access_page': 'Access page',
        'live_session_confirmation': 'Live session confirmation',
        'affiliate_redirect': 'Affiliate redirect',
      };
      const selected = inputData?.selectedOption as string | undefined;
      if (selected && accessLabels[selected]) return accessLabels[selected];
      if (task?.status === 'completed') return 'Access method defined';
      return notDefinedText;
    }
    // ... existing cases for platform_chosen, page_ready, ready_to_share
  }
}
```

---

### 3. usePhaseSnapshot.ts - Add Task Mappings

Add content extraction for new tasks:

```typescript
// After build_payments_setup case
case "build_choose_delivery_asset":
  contentType = "paragraph";
  structuredContent.type = "paragraph";
  const deliveryLabels: Record<string, string> = {
    'live_session': 'Live session or workshop',
    'downloadable': 'Downloadable resource',
    'access_page': 'Access page or portal',
    'curated_bundle': 'Curated bundle',
    'affiliate_product': 'Affiliate product',
    'mrr_plr_product': 'MRR/PLR product',
  };
  if (inputData.selectedOption) {
    const label = deliveryLabels[String(inputData.selectedOption)] || String(inputData.selectedOption);
    bullets.push(label);
    fullContent = label;
    structuredContent.items = [{ value: label }];
  }
  break;

case "build_create_asset":
  contentType = "key-value";
  structuredContent.type = "key-value";
  if (inputData.asset_name) {
    bullets.push(String(inputData.asset_name));
    structuredContent.items.push({ label: "Asset", value: String(inputData.asset_name) });
  }
  if (inputData.asset_description) {
    structuredContent.items.push({ label: "Description", value: String(inputData.asset_description) });
  }
  fullContent = [
    inputData.asset_name && `Asset: ${inputData.asset_name}`,
    inputData.asset_description && `Description: ${inputData.asset_description}`,
  ].filter(Boolean).join("\n\n");
  break;

case "build_define_access_moment":
  contentType = "paragraph";
  structuredContent.type = "paragraph";
  const accessLabels: Record<string, string> = {
    'email_delivery': 'Email delivery',
    'download_link': 'Download link',
    'access_page': 'Access page',
    'live_session_confirmation': 'Live session confirmation',
    'affiliate_redirect': 'Affiliate redirect',
  };
  if (inputData.selectedOption) {
    const label = accessLabels[String(inputData.selectedOption)] || String(inputData.selectedOption);
    bullets.push(label);
    fullContent = label;
    structuredContent.items = [{ value: label }];
  }
  break;
```

Add label mappings:

```typescript
const TASK_LABELS: Record<string, string> = {
  // ... existing mappings
  build_choose_delivery_asset: "Delivery Asset",
  build_create_asset: "Asset Details",
  build_define_access_moment: "First Access",
  // ... rest of mappings
};
```

---

### 4. SummaryCard.tsx & SummaryBlock.tsx - Add Icon Mappings

Add icons for the new tasks (using existing Lucide icons):

```typescript
// In both files
const TASK_ICONS: Record<string, LucideIcon> = {
  // ... existing mappings
  build_choose_delivery_asset: Package, // or Gift
  build_create_asset: FileText,
  build_define_access_moment: ArrowRightCircle, // or Send
  // ... rest of mappings
};
```

---

### 5. ExportBuildButton.tsx - Add New Tasks to Export

Update the export to include the new task data:

```typescript
// Add extraction for new tasks
const deliveryAssetTask = projectTasks.find(t => t.taskId === 'build_choose_delivery_asset');
const deliveryAssetData = deliveryAssetTask?.inputData as Record<string, unknown> || {};
const deliveryType = deliveryAssetData.selectedOption as string || null;

const createAssetTask = projectTasks.find(t => t.taskId === 'build_create_asset');
const createAssetData = createAssetTask?.inputData as Record<string, unknown> || {};
const assetName = createAssetData.asset_name as string || null;
const assetDescription = createAssetData.asset_description as string || null;

const accessMomentTask = projectTasks.find(t => t.taskId === 'build_define_access_moment');
const accessMomentData = accessMomentTask?.inputData as Record<string, unknown> || {};
const accessMethod = accessMomentData.selectedOption as string || null;

// Add to HTML output (before Launch Page section)
${renderSection('Delivery Asset', deliveryLabels[deliveryType] || deliveryType)}

${renderMultiSection('Asset Details', [
  { sublabel: 'Name', content: assetName },
  { sublabel: 'Description', content: assetDescription },
])}

${renderSection('First Access Method', accessLabels[accessMethod] || accessMethod)}
```

---

## Updated build_phase_review Checklist

The review task will now show these items:

| Item | Description | Data Source |
|------|-------------|-------------|
| Delivery asset chosen | I know what I'm delivering | `build_choose_delivery_asset` |
| Asset ready | I have something I could deliver today | `build_create_asset` |
| First access defined | I know how they'll receive it | `build_define_access_moment` |
| Platform chosen | I know where my offer lives | `build_simple_launch_page` |
| Main page ready | People can find and understand my offer | `build_simple_launch_page` |
| Ready to share | I'm ready to tell people about it | User confirmation |

---

## Summary

- **3 new task templates** added to Build phase with proper dependencies
- **Existing task orders** updated (4 → 7 for original tasks)
- **Build phase review** updated with 3 new checklist items
- **Phase snapshot** updated for PDF exports and summary views
- **Icon mappings** added for visual consistency
- **Export functionality** updated to include new tasks

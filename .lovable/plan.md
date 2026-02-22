

# Fix "Demo campaigns cannot be deleted" Error

## Problem
The campaigns page merges hardcoded demo campaigns (IDs like `camp-1`, `camp-2`) with your real database campaigns. When you try to delete one of these demo entries, the code detects it's not a real database record and shows the confusing error.

## Solution
Hide the dropdown actions (Edit, Duplicate, Archive, Delete) for demo campaigns so you never see options that won't work. Additionally, once you have real campaigns in the database, stop showing the demo data entirely so there's no confusion.

## Changes

**File: `src/pages/CampaignPlanner.tsx`**
- Only include demo campaigns when there are zero real campaigns from the database, so they serve as placeholder/example data only

**File: `src/components/campaigns/CampaignTable.tsx`**
- Hide the actions dropdown (three-dot menu) for demo campaigns so Edit/Duplicate/Archive/Delete buttons are not shown for non-database entries
- Make demo campaign rows non-clickable (or show a subtle "demo" indicator) so users know these are example data

## Technical Detail

```text
CampaignPlanner.tsx:
  const allCampaigns = (dbCampaigns?.length ?? 0) > 0
    ? dbCampaigns
    : demoCampaigns;   // only show demos when no real data

CampaignTable.tsx:
  // Hide actions column for demo entries
  {isDbCampaign(c) && (
    <DropdownMenu>...</DropdownMenu>
  )}
```

This eliminates the confusing error entirely -- demo campaigns won't have action buttons, and once you create real campaigns the demos disappear.

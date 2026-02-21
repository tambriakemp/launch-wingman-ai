
# Attach UTM Links to Campaigns -- Implementation Plan

## Overview
Build a complete UTM link management experience for campaigns: create, auto-generate, attach existing links, and enforce a "Live gate" requiring at least 1 link before going live. This leverages the existing `utm_links` table by adding `campaign_id`, `channel`, and `status` columns.

---

## 1. Database Migration

Add 3 new columns to the existing `utm_links` table:

```sql
ALTER TABLE public.utm_links
  ADD COLUMN campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  ADD COLUMN channel text NOT NULL DEFAULT 'other',
  ADD COLUMN status text NOT NULL DEFAULT 'active';
```

- `campaign_id` is nullable (links can exist unassigned)
- `channel` defaults to 'other' so existing rows aren't broken
- `status` defaults to 'active' (values: active, paused, archived)

No new RLS policies needed -- existing `utm_links` RLS already scopes to `user_id`.

---

## 2. Updated Types

**`src/types/campaign.ts`** -- Add a `CampaignUTMLink` interface:

```
- id, campaign_id, label (name), base_url, full_url
- utm_source, utm_medium, utm_campaign, utm_content, utm_term
- short_code, channel, status, click_count
- created_at, updated_at
```

---

## 3. New Components

### `src/components/campaigns/links/AddUTMLinkModal.tsx`
Manual link creation modal with:
- Link Name, Channel dropdown, Destination URL
- UTM Source (auto-suggested from channel), UTM Medium (auto-suggested), UTM Campaign (auto-filled from campaign name slug)
- Optional: UTM Content, UTM Term, Notes
- "Generate Link" validates URL, builds `final_url`, shows preview
- "Save and Attach" inserts into `utm_links` with `campaign_id`
- "Save and Create Another" resets form after save

### `src/components/campaigns/links/AutoGeneratePanel.tsx`
Expandable panel with:
- Base destination URL input
- Campaign slug (auto-filled, editable)
- Channel checkboxes (Instagram, Facebook, TikTok, YouTube, Email, Skool, Other)
- Variant count toggle: 1 per channel or 3 per channel
- Auto-fill rules for utm_source/utm_medium/utm_content per the spec
- "Preview Links" shows generated links in a table before saving
- "Generate and Attach" bulk-inserts all links

### `src/components/campaigns/links/AttachExistingModal.tsx`
Modal to search and attach existing unassigned UTM links:
- Search input filtering existing `utm_links` where `campaign_id IS NULL`
- Filter by channel
- Multi-select checkboxes
- "Attach Selected" updates `campaign_id` on selected links
- Warning if a link is already assigned to another campaign with options to Duplicate or Reassign

### `src/components/campaigns/links/CampaignLinksToolbar.tsx`
Top toolbar with:
- "+ Add UTM Link" button (opens AddUTMLinkModal)
- "Attach Existing" button (opens AttachExistingModal)
- "Auto-Generate" toggle (shows/hides AutoGeneratePanel)
- Search input for filtering links within campaign
- Channel and Status filter chips

### `src/components/campaigns/links/LiveGateModal.tsx`
Warning modal shown when admin tries to set campaign status to "Live" with 0 UTM links:
- Message: "Before you launch, attach at least 1 tracking link."
- Buttons: "Create a UTM link now", "Attach existing link", "Cancel"

---

## 4. Rebuilt LinksTab

**`src/components/campaigns/tabs/LinksTab.tsx`** -- Complete rewrite:
- Uses `useQuery` to fetch `utm_links` where `campaign_id = campaignId`
- Renders `CampaignLinksToolbar` at top
- Conditionally shows `AutoGeneratePanel`
- Displays links table with columns: Name, Channel, Destination URL (truncated + copy), UTM Preview, Clicks, Leads (placeholder), Revenue (placeholder), CVR (placeholder), Status badge, Actions menu
- Each row has: Copy Final URL, Copy UTM Params, Open in new tab, Edit, Duplicate, Pause, Archive
- Empty state with CTA to create first link

---

## 5. Campaign Detail Page Updates

**`src/pages/CampaignDetail.tsx`**:
- Also fetch campaign from DB (not just demo data) so real campaigns work on the detail page

**`src/components/campaigns/CampaignDetailHeader.tsx`**:
- When status badge dropdown changes to "Live", check UTM link count first
- If 0 links, show LiveGateModal instead of updating status
- If links exist, proceed with status update and show confirmation toast

---

## 6. New Campaign Modal (Step 2) Enhancement

**`src/components/campaigns/NewCampaignModal.tsx`**:
- After campaign creation, if `autoUtm` is enabled and platforms are selected, auto-generate UTM links for the new campaign using the same logic as AutoGeneratePanel
- Uses the campaign name slugified as `utm_campaign`

---

## Files Summary

| File | Action |
|------|--------|
| Migration SQL | Create -- add columns to `utm_links` |
| `src/types/campaign.ts` | Edit -- add `CampaignUTMLink` interface |
| `src/components/campaigns/links/AddUTMLinkModal.tsx` | Create |
| `src/components/campaigns/links/AutoGeneratePanel.tsx` | Create |
| `src/components/campaigns/links/AttachExistingModal.tsx` | Create |
| `src/components/campaigns/links/CampaignLinksToolbar.tsx` | Create |
| `src/components/campaigns/links/LiveGateModal.tsx` | Create |
| `src/components/campaigns/tabs/LinksTab.tsx` | Rewrite |
| `src/pages/CampaignDetail.tsx` | Edit -- fetch from DB |
| `src/components/campaigns/CampaignDetailHeader.tsx` | Edit -- live gate logic |
| `src/components/campaigns/NewCampaignModal.tsx` | Edit -- auto-generate on create |

---

## Technical Notes

- Reuses existing `utm_links` table and RLS policies (already scoped to `user_id`)
- Short codes for new links generated client-side (random 8-char alphanumeric)
- `final_url` is built client-side by appending UTM params to `base_url`
- Click tracking continues to work via existing `utm-redirect` edge function
- Leads/Revenue/CVR columns show placeholder demo values for now, designed for real data later
- Channel auto-fill mapping: Instagram/Facebook/TikTok/YouTube use "social" medium; Email uses "email"; Skool uses "community"
- Duplicate action copies the link with "(Copy)" suffix and increments utm_content version
- Pause sets status to "paused"; Archive sets to "archived" (hidden by default)



# Modernize New Campaign Modal + Implement Funnel Selection

## Overview
Three changes: (1) Clean up and modernize the 4-step campaign creation modal with more space and no owner field, (2) implement Step 3 with a real funnel selector pulling from the database, and (3) redesign Step 4 confirmation layout.

---

## 1. Modal UI Cleanup and Modernization

### Changes to `src/components/campaigns/NewCampaignModal.tsx`

**Larger modal**: Change `sm:max-w-lg` to `sm:max-w-2xl` for more breathing room.

**Remove owner field** everywhere in the modal:
- Remove `owner` state variable
- Remove owner input from Step 1
- Remove owner row from Step 4 review
- Remove from `reset()` function

**Step indicator redesign**: Replace the cramped numbered circles with a cleaner horizontal stepper using a progress line between steps, with completed steps showing a checkmark and current step highlighted with primary color.

**Step 1 (Basics)**: 
- Add proper spacing between form groups (`space-y-5` instead of `space-y-3`)
- Add subtle section descriptions under labels
- Budget field gets full width now that owner is removed
- Cleaner label styling with `text-sm font-medium` and `mt-1` gap before inputs

**Step 2 (Attribution)**:
- Better spacing and layout
- Platform selector chips get slightly larger with icons (using simple emoji/text icons for each platform)
- Add a subtle description paragraph explaining UTM auto-generation

---

## 2. Implement Step 3 -- Funnel Selector

### Data Fetching
- Import `useAuth` from AuthContext and `supabase` client
- Import `useQuery` from TanStack Query
- Query the `funnels` table joined with `projects` to get all funnels for the current user:
  ```sql
  SELECT f.id, f.funnel_type, f.niche, f.target_audience, p.name as project_name
  FROM funnels f
  JOIN projects p ON f.project_id = p.id
  WHERE f.user_id = <current_user_id>
  ```
- Use `FUNNEL_TYPE_TO_CONFIG` mapping from `funnelUtils.ts` to get display names from `FUNNEL_CONFIGS`

### UI Layout
- Show a list of available funnels as selectable cards (radio-style, single select)
- Each card shows:
  - Funnel type label (e.g., "Freebie Funnel") 
  - Project name it belongs to (smaller text)
  - Target audience snippet (truncated)
  - Niche badge
- A "Skip" option at the bottom for campaigns without a funnel
- Selected funnel gets a primary border highlight
- If no funnels exist, show an empty state message ("No funnels found. Create a project with a funnel first.")

### State
- Add `selectedFunnelId` state (string | null)
- Store selected funnel data for display in Step 4

---

## 3. Modernize Step 4 (Confirm)

### Redesign from grid to card-based review
- Replace the plain 2-column grid with a clean card layout
- Group related info into visual sections:
  - **Campaign Details** section: Name, Goal, Dates, Budget in a bordered card
  - **Attribution** section: UTM setting and selected platforms as badges
  - **Funnel** section: Selected funnel name and type (or "None" if skipped)
- Each section has a subtle header and clean key-value pairs with proper spacing
- Add a subtle divider between sections
- "Create Campaign" button is more prominent (full width, slightly larger)

---

## 4. Remove Owner from Other Campaign Components

### `src/types/campaign.ts`
- Remove `owner` from the Campaign interface

### `src/components/campaigns/campaignDemoData.ts`
- Remove `owner` field from all 6 demo campaign objects

### `src/components/campaigns/CampaignTable.tsx`
- Remove the Owner column header and data cell from the table

### `src/components/campaigns/CampaignDetailHeader.tsx`
- Remove the owner display from the header

---

## Files Changed Summary

| File | Action |
|------|--------|
| `src/components/campaigns/NewCampaignModal.tsx` | Major rewrite -- modernized UI, funnel selector, cleaned confirm step |
| `src/types/campaign.ts` | Edit -- remove `owner` field |
| `src/components/campaigns/campaignDemoData.ts` | Edit -- remove `owner` from demo data |
| `src/components/campaigns/CampaignTable.tsx` | Edit -- remove Owner column |
| `src/components/campaigns/CampaignDetailHeader.tsx` | Edit -- remove owner display |

---

## Technical Notes

- Funnel data is fetched via Supabase query using the authenticated user's ID
- Uses existing `FUNNEL_CONFIGS` and `FUNNEL_TYPE_TO_CONFIG` for display labels
- No new database tables or migrations needed
- No new dependencies required
- The funnel selector gracefully handles loading and empty states

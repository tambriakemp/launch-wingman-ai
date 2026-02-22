

# Fix: Add Campaign ID to Manually Created UTM Links

## Problem
When you create a UTM link from within a campaign using the "Add UTM Link" modal, the generated URL is missing the `&c=CAMPAIGN_ID` parameter. This is because `UTMForm.tsx` has its own internal URL builder (`generateFullUrl`) that does not include the campaign ID.

The auto-generate panel was updated to use the shared `buildFinalUrl` helper (which supports campaign IDs), but the manual link creation form was missed.

## Solution
Pass the `campaignId` into `UTMForm` as an optional prop, and use it when building the URL so the `&c=` parameter is appended automatically.

## Changes

**File: `src/components/marketing-hub/UTMForm.tsx`**
- Add an optional `campaignId?: string` prop
- Update the internal `generateFullUrl` function to append `&c=campaignId` when provided

**File: `src/components/campaigns/links/AddUTMLinkModal.tsx`**
- Pass `campaignId={campaignId}` to the `UTMForm` component

No changes needed to the standalone UTM Builder page (`/marketing-hub/utm-builder`) since links created there are not tied to a campaign.


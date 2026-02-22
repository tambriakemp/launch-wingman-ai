

# Universal Smart Pixel — Auto-Detect Campaign from URL

## What Changes

Right now, every pixel snippet hardcodes `c=CAMPAIGN_ID`. This means users need a different pixel per campaign, and it breaks on shared landing pages.

The fix: make the pixel snippets read the campaign ID dynamically from the page URL at runtime. Users paste one snippet and it works for all campaigns automatically.

## How It Works

1. When a user creates a UTM link for a campaign, the link already contains the campaign's UUID (we will add `&c=CAMPAIGN_UUID` to UTM links automatically).
2. When a visitor lands on the page via that link, the URL contains `?c=...`.
3. The pixel snippet on the thank-you/landing page reads `c` from the URL and passes it to the tracking endpoint.
4. If no `c` param is found in the URL, it falls back to the current campaign's ID (so per-campaign pixels still work).

## Changes

### 1. Pixel Snippets — `src/components/campaigns/tabs/PixelTab.tsx`

Update all three snippet templates:

- **JS Pixel (Recommended)**: Instead of hardcoding `c=CAMPAIGN_ID`, the script reads `c` from `location.search` and falls back to the current campaign ID.
- **Image Pixel**: Since `<img>` can't run JS, keep the hardcoded campaign ID but add a note that it only tracks this specific campaign.
- **JS + UTM Passthrough**: Already reads URL params — extend it to also grab `c` from the URL, falling back to the campaign ID.
- Update descriptions to explain the "universal" behavior.

### 2. UTM Link Builder — `src/components/campaigns/links/utmHelpers.ts`

Update `buildFinalUrl` to automatically append `c=CAMPAIGN_ID` as an extra query param when a campaign ID is provided. This ensures every UTM link carries the campaign identifier to the destination page.

### 3. UTM Link Creation UI

Where UTM links are created for a campaign, pass the `campaign_id` into `buildFinalUrl` so the `c` parameter is included in every generated link.

## Technical Detail

**Updated JS Pixel snippet (example):**
```text
<script>
const p = new URLSearchParams(location.search);
const cid = p.get("c") || "FALLBACK_CAMPAIGN_ID";
fetch("BASE_URL?c=" + cid + "&revenue=AMOUNT");
</script>
```

**Updated `buildFinalUrl` signature:**
```text
buildFinalUrl(baseUrl, params, campaignId?)
  -> if campaignId, appends &c=campaignId to the URL
```

**Image pixel stays per-campaign** (no JS available), with a note explaining this limitation.

## Result

- Users paste one JS pixel on their landing page and it tracks conversions for any campaign automatically.
- UTM links automatically carry the campaign ID to the destination.
- Existing per-campaign pixels continue to work as a fallback.
- No backend changes needed — the edge function already accepts `c` from query params.

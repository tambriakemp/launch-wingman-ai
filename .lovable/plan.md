
# Add Conversion Pixel to /go Landing Page

## What This Does
Adds the UTM-tracking conversion pixel to the `/go` sales funnel page so every visit is tracked as a conversion event for campaign `777b05de-3810-45d0-a317-c107e883b2f9`. UTM parameters from the URL are automatically captured for attribution.

## Changes

**File: `src/pages/SalesFunnel.tsx`**
- Convert the `SalesFunnel` component from an arrow-function expression to include a `useEffect` hook
- On mount, fire the pixel fetch with campaign ID `777b05de-3810-45d0-a317-c107e883b2f9` and pass through any `utm_source`, `utm_medium`, `utm_campaign` query params from the current URL
- Revenue is set to `0` since this tracks page visits (leads), not purchases

## Technical Detail

```text
useEffect (runs once on mount)
  --> Read UTM params from window.location.search
  --> Build pixel URL with campaign ID + UTMs
  --> fetch(url) silently in background
```

The pixel will fire once per page load. No visible UI changes -- the tracking is invisible to visitors.

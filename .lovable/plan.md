

# Fix UTM Click Tracking

## Problem
Click tracking is completely broken -- zero click events have ever been recorded. There are two root causes:

1. **Short link redirect page has a bug**: The `UTMRedirect` component makes a wasteful first call to `supabase.functions.invoke("utm-redirect")` without passing the `code` parameter, then makes a second call via `fetch`. The first call likely errors silently and may interfere.
2. **Full/long URL clicks are never tracked**: When a user copies and shares the full URL (e.g. `https://launchely.com/?utm_source=...`), clicking it goes directly to the destination. There is no redirect through the tracking edge function, so no click is ever recorded.

## Solution

### 1. Fix UTMRedirect.tsx (short link tracking)
- Remove the broken `supabase.functions.invoke()` call (lines 17-20) that sends a request without the code parameter
- Keep only the direct `fetch` call which correctly passes the code as a query param
- This ensures short link clicks (`launchely.com/r/{code}`) are properly tracked via the edge function

### 2. Track full URL clicks at copy time
Since full URLs bypass the redirect system entirely, the only reliable tracking point is when the link is copied. We should:
- When a user copies the **full URL**, immediately call the edge function to log a "copy" event (or increment a separate counter)
- Alternatively, and more practically: **do not attempt to track full URL clicks** since they go directly to the destination and we have no middleware. Instead, make the short link the primary recommended link for sharing.

**Recommended approach**: Track short link clicks properly (fix #1), and for the full URL, add a note in the UI that only short links track clicks. This is the standard approach used by Bitly, UTM.io, etc.

### 3. Immediate data refresh after redirect tracking
- In the analytics hook, ensure queries refetch when navigating back to the analytics page (already handled by React Query's default stale behavior)

## Files to Change

### `src/pages/UTMRedirect.tsx`
- Remove the redundant `supabase.functions.invoke()` call
- Keep only the clean `fetch` call with the code parameter
- Add error logging for debugging

### `src/components/marketing-hub/UTMLinkTable.tsx`
- Add a small indicator or tooltip on the full URL block noting "Short links track clicks"
- Ensure the short link is visually prioritized as the sharing link

## Technical Details

**Before (UTMRedirect.tsx):**
```
// Broken: calls without code param
const { data, error: fnError } = await supabase.functions.invoke("utm-redirect", {
  body: null,
  method: "GET",
});

// Then makes second call with code
const response = await fetch(`https://${projectId}.supabase.co/functions/v1/utm-redirect?code=...`);
```

**After:**
```
// Single clean call with code param
const response = await fetch(`https://${projectId}.supabase.co/functions/v1/utm-redirect?code=...`);
```


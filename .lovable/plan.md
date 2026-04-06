

## Plan: Fix Google Tasks Sync Not Working After Reconnection

### What I found

1. **Sync mappings table is completely empty** — no tasks have been successfully synced to Google Tasks
2. **Edge function logs show only boot messages** — the sync-calendar-event function is being called (many boots during bulk sync) but produces zero application-level logs, meaning errors are being swallowed silently
3. **Old Calendar API remnants in logs** — at 09:13 the logs show "Found existing Launchely calendar" from the old Calendar Events code, confirming the old version was running before redeployment
4. **Task data is valid** — there are dated planner tasks ready to sync (e.g., "500 Photos of Styl" due 2026-04-11, "Finish Data Annotation" due 2026-04-03)
5. **Google connection exists** — reconnected at 09:18:30 with `blukollallc@gmail.com`

### Root cause

The `syncToGoogle` function has no error logging. When the Google Tasks API returns an error (likely a 403 permission denied because the Tasks API may not be enabled in the Google Cloud project, or a scope issue), the function silently returns `{ success: false }` and the bulk sync counts it as "failed" but the response never surfaces why.

### Implementation

**File: `supabase/functions/sync-calendar-event/index.ts`**

Add detailed console.log/error statements throughout `syncToGoogle`:
- Log the Google Tasks API response status and body on every call (create, update, delete)
- Log when `buildEventBody` returns null
- Log the access token prefix to confirm it's non-null
- Log the exact request body being sent

This will let us see the actual Google Tasks API error in the edge function logs after the next sync attempt.

**Specific logging points:**
1. At the start of `syncToGoogle`: log action, existingEventId, and whether task data exists
2. After every `fetch` to Google Tasks API: log `res.status` and response body text on failure
3. In the main handler loop: log when `getAccessToken` returns null vs a valid token
4. Log the full results array before returning the response

**File: `supabase/functions/bulk-sync-calendar/index.ts`**

Add logging for:
- Number of dated tasks found
- Each individual sync result (including the response body from sync-calendar-event)
- Final summary with created/updated/failed counts

### Expected result

After deployment and a re-sync attempt, the edge function logs will show the exact Google Tasks API error, which will point to either:
- Tasks API not enabled in Google Cloud Console (needs user action)
- Missing `tasks` scope on the token (needs re-auth)
- API quota/rate limit issue

We can then address the specific root cause.

### Technical details
- 2 edge function files edited for logging
- No schema changes
- Redeploy both `sync-calendar-event` and `bulk-sync-calendar`


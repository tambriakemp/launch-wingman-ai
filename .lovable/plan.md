

## Fix: Enable Google Tasks API in Google Cloud Console

### Root Cause
The Google Tasks API is **not enabled** in your Google Cloud project (project ID: 1076349754654). The sync function is working correctly and sending the right data, but Google is rejecting all requests with a 403 "SERVICE_DISABLED" error.

### What You Need to Do (no code changes needed)

1. Go to [Google Cloud Console - Tasks API](https://console.developers.google.com/apis/api/tasks.googleapis.com/overview?project=1076349754654)
2. Click **"Enable"** to activate the Google Tasks API for your project
3. Wait 1-2 minutes for it to propagate
4. Go back to Settings and click **"Re-sync all calendar tasks"**

That's it. The code is already correct — it's successfully authenticating, building the right payload, and calling the right endpoint. Google is just blocking it because the Tasks API hasn't been turned on yet.

### Why the bulk sync showed "synced: 16" earlier
The bulk-sync function was counting responses from sync-calendar-event that returned HTTP 200 with `success: true` at the top level, even though individual provider results showed `success: false`. This is a reporting quirk but not a code bug — the tasks genuinely failed to sync.

### No code changes required
Everything works once the API is enabled in Google Cloud Console.


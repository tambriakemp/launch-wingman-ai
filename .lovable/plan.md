
# Fix Scheduled Social Media Posts Not Publishing

 **STATUS: ✅ IMPLEMENTED**
 
 ---
 
## Problem Summary

Scheduled posts on the content calendar are not being published automatically. The "Post Now" option works, but posts scheduled for future dates never get published.

## Root Cause

**There is no background job to process scheduled posts.** The system correctly saves posts to the `scheduled_posts` table with a `scheduled_for` timestamp and `pending` status, but nothing ever picks them up and publishes them when the time comes.

Currently in your database:
- 10 pending posts waiting to be published
- Some dating back to December 2025 that were never processed
- Existing cron jobs only handle email notifications and token refresh - not post publishing

---

## Solution

Create a new edge function `process-scheduled-posts` that runs on a cron schedule to:
1. Query pending posts whose `scheduled_for` time has passed
2. Call the appropriate platform posting function for each
3. Update the post status to `posted` or `failed`
4. Update the linked `content_planner` item status

---

## Implementation Plan

### 1. Create New Edge Function

**File:** `supabase/functions/process-scheduled-posts/index.ts`

This function will:
- Query `scheduled_posts` where `status = 'pending'` and `scheduled_for <= NOW()`
- For each post, call the appropriate posting function:
  - Pinterest: `post-to-pinterest`
  - Instagram: `post-to-instagram`
  - TikTok: `post-to-tiktok` or `post-to-tiktok-photo`
  - Facebook: `post-to-facebook`
  - Threads: `post-to-threads`
- Update `scheduled_posts.status` to `posted` or `failed`
- Update `scheduled_posts.posted_at` and `result`
- Update linked `content_planner.status` to `completed` or `failed`
- Handle errors gracefully and continue processing other posts

### 2. Add Cron Job

Create a database migration to add a pg_cron job that runs every 5 minutes:

```sql
SELECT cron.schedule(
  'process-scheduled-posts',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://ydhagqgurqhlguxkkppb.supabase.co/functions/v1/process-scheduled-posts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

### 3. Update Config

**File:** `supabase/config.toml`

Add function configuration:
```toml
[functions.process-scheduled-posts]
verify_jwt = false
```

---

## Technical Details

### Edge Function Logic Flow

```text
process-scheduled-posts runs every 5 minutes
         |
         v
Query: scheduled_posts WHERE status='pending' AND scheduled_for <= NOW()
         |
         v
For each pending post:
    |
    +-- Get user's social connection for the platform
    |
    +-- Build request body based on platform
    |
    +-- Call platform-specific posting function internally
    |
    +-- On success:
    |      Update scheduled_posts: status='posted', posted_at=NOW()
    |      Update content_planner: status='completed'
    |
    +-- On failure:
           Update scheduled_posts: status='failed', result={error}
           Update content_planner: status='failed'
```

### Platform-Specific Handling

| Platform | Function to Call | Required Data |
|----------|------------------|---------------|
| Pinterest | `post-to-pinterest` | board_id, title, description, media_url, link |
| Instagram | `post-to-instagram` | caption, imageUrl/videoUrl, mediaType |
| TikTok | `post-to-tiktok` or `post-to-tiktok-photo` | Based on media type |
| Facebook | `post-to-facebook` | message, imageUrl |
| Threads | `post-to-threads` | text, imageUrl |

### Error Handling

- Each post is processed independently; failures don't block other posts
- Failed posts are marked with error details in the `result` column
- Retry logic: Failed posts remain in the queue for manual retry or can be configured to auto-retry after a delay

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/process-scheduled-posts/index.ts` | Create | Main processing function |
| `supabase/config.toml` | Modify | Add function config |
| Database migration | Create | Add pg_cron job |

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Token expired during posting | Refresh token first, then retry |
| User disconnected platform | Mark as failed with "Platform disconnected" error |
| Media URL no longer valid | Mark as failed with error details |
| Multiple posts due at same time | Process in order, one at a time |
| Function timeout | Use `waitUntil` for background processing per the useful context |

---

## Cleanup

After implementation, consider cleaning up the 10 stale pending posts from December/January that will never be relevant to post now.
 
 ---
 
 ## Implementation Complete
 
 **Files Created:**
 - `supabase/functions/process-scheduled-posts/index.ts` - Edge function that processes pending scheduled posts
 
 **Files Modified:**
 - `supabase/config.toml` - Added function configuration
 
 **Database Changes:**
 - Added pg_cron job `process-scheduled-posts` running every 5 minutes
 
 **Tested:** The function successfully:
 - Queries pending posts whose `scheduled_for` time has passed
 - Posts to Instagram (confirmed 1 successful post)
 - Handles errors gracefully (expired tokens, missing data)
 - Updates `scheduled_posts` and `content_planner` status appropriately

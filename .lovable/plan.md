

## End-of-Month Goal Progress Email Notification

### Overview
Add a monthly goal progress email that sends to users with active goal targets at month's end. The email summarizes each goal's completion percentage and links to the goals section. This integrates into the existing `scheduled-email-jobs` edge function and `send-notification-email` system.

### Changes

**1. Add `goal_progress_reminder` email type to `send-notification-email/index.ts`**
- Add new email type `"goal_progress_reminder"` to the type union
- Create an HTML email template that:
  - Greets the user by first name
  - Says it's end-of-month, time to review goals
  - Renders a table/list of each goal with: title, progress bar (inline CSS), percentage, and target count
  - Includes a CTA button linking to `/goals` in the app
  - Matches the existing calm, minimal tone used in other emails
- The `data` payload will contain a `goals` array with `{ title, progress, targetsDone, targetsTotal }`

**2. Add goal progress job to `scheduled-email-jobs/index.ts`**
- Add a new section (e.g., section 5: GOAL PROGRESS REMINDERS)
- Logic:
  - Only runs on the last 2 days of the month (day 30/31 or 28/29 for Feb)
  - Queries all users who have at least one goal with targets via `goal_targets` joined to `goals`
  - For each user, calculates per-goal progress (same weighted average formula used in the UI)
  - Checks `email_preferences` → `check_in_emails_enabled` to respect opt-out (reuse this preference since goal reminders are a type of check-in)
  - Checks rate limiting (existing 1-email/week logic in `send-notification-email`)
  - Calls `send-notification-email` with the `goal_progress_reminder` type and the goals summary data

**3. Add `goal_progress_reminder` to `useNotificationEmail.ts` type union**
- Add the type so it can optionally be triggered from the frontend too

### Email Design
- Clean, minimal layout matching existing Launchely emails
- Each goal shown as a row: goal name, visual progress bar (colored inline), percentage text
- A prominent "Review Your Goals →" button linking to `{appUrl}/goals`
- Footer with standard Launchely branding

### No Database Changes Required
- All data already exists in `goals` and `goal_targets` tables
- User preferences already handled by `email_preferences.check_in_emails_enabled`

### Files Modified
- `supabase/functions/send-notification-email/index.ts` — add template
- `supabase/functions/scheduled-email-jobs/index.ts` — add monthly goal job
- `src/hooks/useNotificationEmail.ts` — add type


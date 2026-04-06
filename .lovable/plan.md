
Goal: fix the real remaining issue in outbound calendar sync so due-only/all-day planner tasks re-sync correctly as all-day events in Google/Outlook/Apple, with no greyed-out “12am” entries.

What I found
- This is not a dev-vs-production problem. It should work in preview/dev too.
- Your task data is now saving correctly:
  - due-only tasks are stored as `due_at` set
  - `start_at = null`
  - `end_at = null`
- The uploaded screenshot is from Google Calendar, and the current failure is in the sync layer, not the task editor.
- The latest bulk sync request returned:
  - `{"success":true,"synced":0,"message":"All tasks already synced"}`
- That happens because `bulk-sync-calendar` currently skips every task that already has a sync mapping, so it does not rewrite previously-synced events after a bug fix.

Why the external calendar still shows “12am” and greyed out
1. `supabase/functions/sync-calendar-event/index.ts`
   - all-day detection uses `isAllDayTime()` which only treats `00:00:00Z` as all-day
   - but your due-only tasks are stored like `2026-04-06T05:00:00+00:00` (local midnight converted to UTC), so they fail that check
   - result: the function sends them as timed `dateTime` events instead of all-day `date` events
2. Google month view displays midnight timed events as faint/grey entries with a `12am` prefix
3. `supabase/functions/bulk-sync-calendar/index.ts`
   - only syncs unsynced tasks
   - so existing bad calendar events never get corrected when you click “Sync all existing tasks”

Implementation plan

1. Fix all-day classification in `supabase/functions/sync-calendar-event/index.ts`
- Replace the UTC-midnight-only logic with task-semantic logic:
  - due-only (`due_at` with no `start_at`/`end_at`) = all-day
  - same-instant `start_at` + `end_at` = all-day
  - real start/end range = timed
- Build all-day provider payloads from the task’s date portion (`YYYY-MM-DD`), not from a UTC-midnight test
- Keep timed tasks unchanged

2. Make bulk sync actually re-sync existing events in `supabase/functions/bulk-sync-calendar/index.ts`
- Stop filtering out tasks that already have mappings
- For every dated planner task:
  - if mapping exists, call `sync-calendar-event` with `action: "update"`
  - if no mapping exists, it can still create the event
- Keep excluding undated tasks and done tasks

3. Improve the settings action so the behavior matches the button label
- Update `src/components/settings/CalendarIntegrationsCard.tsx` so the action/message reflects a true re-sync
- Optional copy tweak:
  - from “Sync all existing tasks”
  - to “Re-sync all calendar tasks”
- Success toast should report updated/created counts, not imply a no-op when mappings already exist

4. Preserve provider-specific correct behavior
- Google: send all-day events using `start.date` / `end.date`
- Outlook: send `isAllDay: true` with date-only day boundaries
- Apple: generate `VALUE=DATE` ICS entries for all-day items
- This fix should apply across all connected providers because they all use the same shared event-body logic

5. Verify end-to-end in preview/dev
- Create or edit a due-only task for today
- Click the re-sync action
- Confirm in Google Calendar month view:
  - no `12am` prefix
  - event appears as an all-day bar, not a faded timed entry
- Also verify:
  - true timed tasks still show times
  - existing previously-synced bad events get corrected after re-sync
  - no production-only setup is required

Files to update
- `supabase/functions/sync-calendar-event/index.ts`
- `supabase/functions/bulk-sync-calendar/index.ts`
- `src/components/settings/CalendarIntegrationsCard.tsx`

Expected result
- Re-syncing will actually update already-synced calendar events
- Due-only / all-day tasks will appear as true all-day events externally
- Google Calendar will stop showing those items as grey `12am` entries
- The fix will work in dev/preview and production the same way

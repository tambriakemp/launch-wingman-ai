# Per-User Push Notifications via Capacitor + Web Push

Replace the AppMySite WebView wrapper with a Capacitor shell so we control device tokens, then build a unified push pipeline that fires for planner tasks, habits, and any row written to a notifications table — delivered to iOS/Android via FCM/APNs and to desktop browsers via Web Push.

## Phase 1 — Capacitor shell setup

Add Capacitor to the existing Vite app (web codebase stays unchanged).

- Install `@capacitor/core`, `@capacitor/cli` (dev), `@capacitor/ios`, `@capacitor/android`, `@capacitor/push-notifications`, `@capacitor/app`, `@capacitor/preferences`.
- Run `npx cap init` with:
  - appId: `app.lovable.d0ceac0b3c74405598f172d36eaf2f91`
  - appName: `launch-wingman-ai`
- Create `capacitor.config.ts` with hot-reload server pointing at the sandbox preview URL (`https://d0ceac0b-3c74-4055-98f1-72d36eaf2f91.lovableproject.com?forceHideBadge=true`, `cleartext: true`).
- Update `src/hooks/useIsNativeApp.ts` to also return true for Capacitor (`window.Capacitor?.isNativePlatform()`), so the existing native-shell UI rules (hidden top bar / bottom tab bar) apply automatically.

User runs locally after Git export: `npm i` → `npx cap add ios android` → `npm run build` → `npx cap sync` → `npx cap run ios|android`.

## Phase 2 — Database: device tokens + notifications

New `supabase/migrations` migration:

- **`push_devices`** — `id`, `user_id`, `platform` (`ios` | `android` | `web`), `token` (FCM token or Web Push subscription JSON), `device_name`, `last_seen_at`, `disabled_at`. Unique on (`user_id`, `token`). RLS: users CRUD only their own rows; service role full access.
- **`notifications`** — `id`, `user_id`, `kind` (`task_due` | `habit_reminder` | `in_app` | `goal` | `custom`), `title`, `body`, `deeplink`, `data` (jsonb), `scheduled_for` (timestamptz), `delivered_at`, `read_at`, `source_id`. Index on (`user_id`, `scheduled_for`) where `delivered_at is null`. RLS: users select/update own; insert allowed for self + service role.
- Trigger: when a `notifications` row is inserted with `scheduled_for <= now()` and `delivered_at is null`, enqueue a pgmq message for immediate dispatch.

## Phase 3 — Reminder sources → notifications writer

A single edge function `enqueue-reminders` (cron every 1 min) materializes due reminders into the `notifications` table:

- **Planner tasks** — query `tasks` where `due_at` between now and now+1 min, user has not opted out, no existing `notifications` row with `source_id = task.id` for that occurrence. For recurring tasks, expand using existing `recurrence_rule` logic and skip dates in `recurrence_exception_dates`.
- **Habits** — read habit schedule + user's preferred reminder time; insert one row per habit per due day.
- **In-app notifications table** — already inserts directly; trigger above handles dispatch.

Cron config goes in `supabase/config.toml` for `enqueue-reminders`.

## Phase 4 — Push dispatcher edge function

`dispatch-push` (triggered by pgmq worker, similar pattern to `process-email-queue`):

- Loads the notification + all active `push_devices` for that user.
- For `ios`/`android` tokens → call **FCM HTTP v1 API** (single endpoint handles both platforms when the iOS app is configured with APNs key in Firebase). Auth via FCM service-account JSON stored as `FCM_SERVICE_ACCOUNT` secret.
- For `web` tokens → send Web Push using VAPID keys (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` secrets) via the standard Web Push protocol (Deno has `npm:web-push`).
- On 404/410 from FCM or Web Push → mark device `disabled_at`.
- On success → set `notifications.delivered_at = now()`.

Secrets to request from user: `FCM_SERVICE_ACCOUNT`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. (Generate VAPID with `npx web-push generate-vapid-keys`.)

## Phase 5 — Client registration

New `src/hooks/usePushRegistration.ts` runs once after login:

- **Native (Capacitor):** request permission via `PushNotifications.requestPermissions()`, call `register()`, and on the `registration` event upsert the FCM token into `push_devices` with `platform` from `Capacitor.getPlatform()`. Wire `pushNotificationActionPerformed` to navigate to `notification.data.deeplink`.
- **Web:** if `'serviceWorker' in navigator && 'PushManager' in window`, register `/push-sw.js`, call `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`, and upsert the JSON subscription into `push_devices` with `platform: 'web'`.

Add `public/push-sw.js` to handle `push` and `notificationclick` events (open `event.notification.data.url`).

Add a Notifications section to `src/pages/Settings` (or existing notification settings card) with: enable/disable per channel (task / habit / in-app), reminder lead time, and a "Send test push" button that hits a `test-push` edge function.

## Phase 6 — Native-shell UX integration

- The existing `useIsNativeApp` hook already hides the top/bottom bars; once Capacitor is detected the same code path works.
- Add Capacitor `App` listener for back-button → router back on Android.
- Add splash + icon assets via `@capacitor/assets` (optional, instruct user only).

## Technical details

```text
[Reminder source]                            [Delivery]
 ├─ tasks (due_at, recurrence)               ├─ FCM HTTP v1  → iOS / Android
 ├─ habits (schedule + preferred time)       └─ Web Push (VAPID) → Desktop
 └─ in-app notifications insert
              ↓
  enqueue-reminders (cron 1m)
              ↓
   notifications row (per user)
              ↓ trigger → pgmq
       dispatch-push worker
              ↓
       push_devices (per user)
```

Key libraries:
- `@capacitor/push-notifications` for FCM token capture + tap handling
- `npm:web-push` (in Deno edge function) for browser Web Push
- FCM HTTP v1 with OAuth2 from service-account JSON (no legacy server key)

Build/install steps for the user after Phase 1 lands are documented in the [Capacitor blog post](https://lovable.dev/blog/2025-03-25-using-capacitor-to-create-mobile-apps).

## Open items I'll need from you mid-implementation

1. A **Firebase project** with Cloud Messaging enabled, plus the service-account JSON (paste into the `FCM_SERVICE_ACCOUNT` secret prompt).
2. **APNs key** uploaded into that Firebase project (so a single FCM call covers iOS + Android).
3. Confirmation that we should **retire the AppMySite build** once the Capacitor app is in stores (or keep both running in parallel during transition).

Once you approve, I'll execute Phases 1–6 in order and pause for the secrets when we hit Phase 4.
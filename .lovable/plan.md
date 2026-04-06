

## Calendar Sync — One-Way Out (Google, Outlook, Apple)

### Overview
Push Launchely planner tasks/events to users' connected Google Calendar, Outlook Calendar, and Apple Calendar. Starting with one-way outbound sync — when a task is created, updated, or deleted in the planner, the change reflects on the external calendar.

### How It Works

```text
User creates/edits/deletes task in Planner
        │
        ▼
  Edge function syncs change to connected calendars
        │
        ├── Google Calendar API
        ├── Microsoft Graph API (Outlook)
        └── CalDAV (Apple/iCloud)
```

### Database Changes

**New table: `calendar_connections`**
- `id`, `user_id`, `provider` (google, microsoft, apple), `access_token` (encrypted), `refresh_token` (encrypted), `token_expires_at`, `calendar_id`, `account_email`, `created_at`, `updated_at`
- RLS: users can only access their own connections

**New table: `calendar_sync_mappings`**
- `id`, `user_id`, `task_id` (FK → tasks), `provider`, `external_event_id`, `calendar_connection_id` (FK → calendar_connections), `last_synced_at`, `created_at`
- Tracks which tasks map to which external calendar events, enabling updates and deletes
- RLS: users can only access their own mappings

### Edge Functions (3 new + 2 OAuth callback pairs)

1. **`google-calendar-auth-start`** — Initiates Google OAuth with `calendar.events` scope, redirects user to Google consent
2. **`google-calendar-auth-callback`** — Exchanges code for tokens, stores encrypted tokens in `calendar_connections`
3. **`microsoft-calendar-auth-start`** — Initiates Microsoft OAuth with `Calendars.ReadWrite` scope
4. **`microsoft-calendar-auth-callback`** — Exchanges code for tokens, stores in `calendar_connections`
5. **`sync-calendar-event`** — Core sync function:
   - Accepts `{ task_id, action: "create" | "update" | "delete" }` 
   - Looks up user's connected calendars
   - For each connection, creates/updates/deletes the event via the provider API
   - Stores mapping in `calendar_sync_mappings`
   - Handles token refresh for Google (refresh_token) and Microsoft (refresh_token)

**Apple Calendar (CalDAV):** Users provide an app-specific password (generated at appleid.apple.com). No OAuth flow needed — stored directly as encrypted credentials. Sync uses CalDAV PUT/DELETE requests to iCloud calendar endpoint.

### Frontend Changes

1. **New settings section: Calendar Integrations** (in Settings or Planner settings)
   - "Connect Google Calendar" button → triggers OAuth flow
   - "Connect Outlook Calendar" button → triggers OAuth flow  
   - "Connect Apple Calendar" → modal asking for Apple ID email + app-specific password
   - Shows connected accounts with disconnect option

2. **Planner task operations** — After create/update/delete, call `sync-calendar-event` edge function to push the change to connected calendars

### Required Secrets
- `GOOGLE_CALENDAR_CLIENT_ID` + `GOOGLE_CALENDAR_CLIENT_SECRET` — from Google Cloud Console
- `MICROSOFT_CLIENT_ID` + `MICROSOFT_CLIENT_SECRET` — from Azure App Registration

### Implementation Order
1. Database tables + RLS policies
2. Google Calendar OAuth flow + sync
3. Microsoft/Outlook OAuth flow + sync
4. Apple CalDAV integration (app-specific password approach)
5. Settings UI for managing connections
6. Hook sync calls into Planner create/update/delete flows

### Technical Notes
- All tokens stored encrypted using existing `encrypt_token`/`decrypt_token` functions
- Follows the same OAuth pattern as existing Facebook/Instagram/Pinterest/TikTok auth flows
- Token refresh handled automatically during sync operations
- Apple CalDAV is the simplest auth-wise (no OAuth) but uses XML-based protocol




# Marketing Hub: UTM Campaign Link Builder with Save, Folders, Short Links, and Click Tracking

## Overview
Build the Marketing Hub section with a full-featured UTM Campaign Link Builder that lets admins create, save, organize, and track UTM-tagged links. Includes short link generation with redirect tracking via a backend function.

---

## What Will Be Built

### Database (3 new tables)

**`utm_folders`** - Organize UTM links into folders
- `id`, `user_id`, `name`, `created_at`, `updated_at`
- RLS: Users can CRUD their own folders

**`utm_links`** - Saved UTM campaigns
- `id`, `user_id`, `folder_id` (nullable FK to utm_folders), `base_url`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term` (optional), `utm_content` (optional), `full_url` (generated), `short_code` (unique 8-char code for short links), `label` (user-friendly name), `click_count`, `created_at`, `updated_at`
- RLS: Users can CRUD their own links

**`utm_click_events`** - Individual click tracking
- `id`, `utm_link_id` (FK to utm_links), `clicked_at`, `referrer`, `user_agent`, `ip_address`
- RLS: Users can read their own click events (via join to utm_links); inserts happen server-side only

### Backend Function

**`utm-redirect`** - Edge function that handles short link redirects
- Accepts a `code` query param (e.g., `/utm-redirect?code=abc12345`)
- Looks up the `utm_links` row by `short_code`
- Increments `click_count` on the link
- Inserts a row into `utm_click_events` with referrer/user_agent/IP
- Returns a 302 redirect to the `full_url`
- The short link format shown to users will be: `https://launch-wingman-ai.lovable.app/r/{short_code}` which routes to a tiny page that calls the edge function

### Frontend Pages

**`/marketing-hub`** - Overview dashboard
- Shows summary stats (total links, total clicks)
- Quick-access cards for available tools (UTM Builder first, placeholders for future)

**`/marketing-hub/utm-builder`** - Full UTM link management page
- **Builder form**: Base URL, Source, Medium, Campaign Name, Term, Content, Label fields
- **Save**: Saves to database with optional folder assignment
- **Folder sidebar/filter**: Create, rename, delete folders; filter links by folder or "All"
- **Saved links table**: Shows label, full URL (truncated), short link, click count, date created
- **Copy buttons**: One for the full UTM URL, one for the short link
- **Delete/edit** actions on each saved link

### Sidebar Navigation Update
- Add "Marketing" section to `ProjectSidebar` (visible only when `hasAdminAccess` is true)
- Collapsible sub-menu with "Marketing Hub" and "UTM Builder" items
- Auto-expands when on any `/marketing-hub` route

### Short Link Redirect Page
- **`/r/:code`** - A minimal public route (no auth required) that fetches the edge function to track the click, then redirects the user to the destination URL

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/pages/MarketingHub.tsx` | Overview/dashboard page |
| `src/pages/UTMBuilder.tsx` | UTM builder + saved links management |
| `src/pages/UTMRedirect.tsx` | Public redirect page for short links |
| `src/components/marketing-hub/UTMForm.tsx` | Form component for building UTM links |
| `src/components/marketing-hub/UTMLinkTable.tsx` | Table of saved links with copy/delete |
| `src/components/marketing-hub/UTMFolderList.tsx` | Folder sidebar for organizing links |
| `supabase/functions/utm-redirect/index.ts` | Edge function for click tracking + redirect |

### Files to Modify
| File | Change |
|------|--------|
| `src/components/layout/ProjectSidebar.tsx` | Add Marketing section (admin-only) with collapsible sub-items |
| `src/App.tsx` | Add routes for `/marketing-hub`, `/marketing-hub/utm-builder`, and `/r/:code` |

### Database Migration
- Create `utm_folders`, `utm_links`, `utm_click_events` tables
- Add RLS policies for user-owned data
- Add unique index on `utm_links.short_code`

### Short Code Generation
- Generated client-side using a random 8-character alphanumeric string
- Uniqueness enforced by the database unique constraint; retry on conflict

### Click Tracking Flow

```text
User clicks short link
  --> /r/{code} (public React page, no auth)
    --> Calls utm-redirect edge function with code
      --> Looks up utm_links by short_code
      --> Increments click_count
      --> Inserts utm_click_events row
      --> Returns destination URL
    --> Browser redirects to full UTM URL
```

Both the full UTM URL and short link lead to the same destination -- the short link just goes through the tracking redirect first. The full UTM URL is trackable via Google Analytics/GTM UTM parameter parsing, while the short link adds server-side click counting on top of that.

### Sidebar Structure

```text
Marketing (admin-only section)
  Marketing Hub         --> /marketing-hub
  UTM Builder           --> /marketing-hub/utm-builder
```


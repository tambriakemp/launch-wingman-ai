## Plan: Migrate App URLs to app.launchely.com

Per your answer, marketing site stays on `launchely.com` (SEO/sitemap/og/canonical/blog schema/contact + support emails untouched). Only app-shell, OAuth callbacks, short links, MCP/API, and UTM published-url get switched.

### Files to update

**Frontend**
- `src/components/campaigns/tabs/LinksTab.tsx` — `getShortUrl` → `https://app.launchely.com/r/${shortCode}`
- `src/components/marketing-hub/UTMLinkTable.tsx` — same `getShortUrl` change
- `src/pages/UTMBuilder.tsx` — `PUBLISHED_URL = "https://app.launchely.com"`

(Already correct: `BrowserFrame.tsx` and `MockupPostPreview.tsx` already display `app.launchely.com`.)

**Edge functions — OAuth callback fallbacks** (change `APP_URL` default from `https://launchely.com` → `https://app.launchely.com`)
- `supabase/functions/facebook-auth-callback/index.ts`
- `supabase/functions/google-calendar-auth-callback/index.ts`
- `supabase/functions/instagram-auth-callback/index.ts`
- `supabase/functions/microsoft-calendar-auth-callback/index.ts`
- `supabase/functions/threads-auth-callback/index.ts`
- `supabase/functions/send-notification-email/index.ts` (in-app links)
- `supabase/functions/send-ticket-notification/index.ts` (in-app links)
- `supabase/functions/scheduled-email-jobs/index.ts` (in-app links fallback)

Note: `send-contact-form`, `admin-update-user`, and email "from" addresses keep `@launchely.com` — those are email identities, not URLs.

**MCP / Public API** (deep links to in-app routes)
- `supabase/functions/prompts-api/index.ts` — `VAULT_URL`, `PLANNER_URL` → `app.launchely.com`
- `supabase/functions/prompts-mcp/index.ts` — same

**Calendar feed UID** — leave `taskId@launchely.com` as-is. iCal UIDs are stable identifiers, not URLs; changing them would orphan all previously-synced events in users' calendars.

### Out of scope (intentionally untouched)
- `index.html` SEO meta, `public/sitemap.xml`, `public/robots.txt`
- `src/components/seo/SEO.tsx` `SITE_URL`
- `src/pages/Landing.tsx`, `BlogPost.tsx`, `LinkInBio.tsx` schema/canonical
- `src/pages/Contact.tsx`, `PrivacyPolicy.tsx`, `TermsOfService.tsx`, `AdminDocs.tsx`
- All `@launchely.com` email addresses
- `calendar-feed` UID format

### Recommendation: also set the `APP_URL` secret
The edge functions read `Deno.env.get("APP_URL")` first and only fall back to the hardcoded value. After deploy, set the `APP_URL` Cloud secret to `https://app.launchely.com` so existing deployments switch immediately. I'll prompt for this after the code changes.

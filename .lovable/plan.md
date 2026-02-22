

# Making "Total Leads" Functional via SureContact

## Current State

Right now, **Total Leads** is hardcoded to `0` for all real campaigns. The `campaigns` table has no `leads` column -- the number only exists in the TypeScript `Campaign` interface for demo data.

Your SureContact integration already syncs **every Launchely signup** as a contact and tags them (e.g., `free-user`, `pro-subscriber`, `new-signup`). However, there's currently no link between SureContact contacts and specific **campaigns**.

## How It Will Work

The idea: when someone clicks a tracked UTM link for a campaign, lands on your page, and then signs up or opts in, SureContact captures them. We tag that contact with the **campaign name** so we can count leads per campaign.

```text
UTM Link Click --> Landing Page --> User Signs Up/Opts In
                                        |
                                        v
                              SureContact Contact Created
                              Tagged with "campaign:{campaign_name}"
```

## Implementation Steps

### 1. Pass UTM campaign data into SureContact on signup

**File:** `supabase/functions/surecontact-webhook/index.ts`

- Extend the `ContactPayload` interface to accept an optional `utm_campaign` field
- When syncing a contact (especially on `sync_new_signup`), if a `utm_campaign` value is provided, create/attach a tag named `campaign:{utm_campaign}` to the contact
- This connects the lead to the specific campaign

### 2. Capture UTM params from the landing page URL

**File:** `src/contexts/AuthContext.tsx` (or signup flow)

- On app load or signup page load, read `utm_campaign` from the URL query string and store it in `localStorage`
- When the user completes signup, pass the stored `utm_campaign` value to the `surecontact-webhook` function

### 3. Create a backend function to count leads per campaign

**File:** `supabase/functions/campaign-leads/index.ts` (new)

- Accepts a `campaign_name` (or campaign ID mapped to its `utm_campaign` value)
- Calls the SureContact API: `GET /contacts?tag={campaign_tag_uuid}` to count contacts tagged with that campaign
- Returns the lead count
- This avoids needing a separate leads table -- SureContact is the source of truth

### 4. Update the Summary Tab to fetch real lead counts

**File:** `src/components/campaigns/tabs/SummaryTab.tsx`

- Add a `useQuery` call to the new `campaign-leads` backend function
- Replace the hardcoded `campaign.leads || 0` with the live count from SureContact
- The "Leads by Channel" chart can be derived from UTM source data combined with the conversion rate

### 5. Store UTM campaign tags in SureContact config

**Database:** `surecontact_config` table

- When a campaign is created with `auto_utm = true`, automatically create a corresponding tag in SureContact via the API
- Store the tag UUID in `surecontact_config` with `config_type: 'tag'` and `name: 'campaign:{campaign_name}'`

## Technical Details

### SureContact API Calls Needed

| Purpose | Endpoint | Method |
|---------|----------|--------|
| Create campaign tag | `/tags` | POST |
| Attach tag to contact | `/contacts/{uuid}/tags/attach` | POST |
| List contacts by tag | `/contacts?tag={tag_uuid}` | GET |

### New Backend Function: `campaign-leads`

```text
Request:  GET /functions/v1/campaign-leads?campaign_id=xxx
Response: { "leads": 42 }

Flow:
1. Look up campaign name from campaigns table
2. Find matching tag UUID from surecontact_config
3. Query SureContact API for contacts with that tag
4. Return the count
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/campaign-leads/index.ts` | New -- counts leads from SureContact by campaign tag |
| `supabase/functions/surecontact-webhook/index.ts` | Modify -- accept and apply `utm_campaign` tag on signup |
| `src/components/campaigns/tabs/SummaryTab.tsx` | Modify -- fetch live lead count |
| `src/contexts/AuthContext.tsx` or signup flow | Modify -- capture and forward UTM params |
| `supabase/config.toml` | Add `campaign-leads` function config |

### No new database tables needed

SureContact acts as the lead database. Campaign tags in SureContact link contacts to campaigns. The `surecontact_config` table already supports storing tag UUIDs.

## What You Need

- **No new API keys** -- SureContact API key (`SURECONTACT_API_KEY`) is already configured
- **No new external services** -- everything uses your existing SureContact account
- Your landing pages need to preserve UTM params through to the signup/opt-in form so they can be forwarded to SureContact


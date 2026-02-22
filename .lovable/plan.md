

## Use Real Data in Campaign Overview Page

Right now the overview page has two problems: the metric cards at the top always show demo data, and the campaign table shows `0` for leads/revenue/ROI even when real conversion data exists. Here's how to fix both.

### What Changes

**1. Enrich campaigns with real conversion data (CampaignPlanner.tsx)**
- After fetching campaigns from the database, also fetch all conversion records from `campaign_conversions` for the user's campaigns
- Group conversions by `campaign_id` and calculate `leads` (count of rows) and `revenue` (sum of revenue) per campaign
- Compute `roi` as `(revenue / budget) * 100` when budget exists
- Compute `conversion_rate` from UTM link click data if available, otherwise leave at 0
- Populate the `Campaign` objects with these real values instead of hardcoded zeros

**2. Pass real campaigns into the overview cards (CampaignOverviewCards.tsx)**
- Change the component to accept a `campaigns` prop instead of importing `demoCampaigns` directly
- Compute the four card values (Active Campaigns, Total Leads, Revenue Generated, Avg Conversion Rate) from the passed-in campaigns array
- Remove the "% change" trend indicator since there's no historical comparison data yet -- show a neutral dash or hide it
- Keep the sparkline visual but base it on the campaign's `sparkline_data` field (which can be enhanced later)

**3. Update CampaignPlanner to wire it together**
- Pass `allCampaigns` as a prop to `CampaignOverviewCards`
- Remove demo fallback logic so the overview always reflects real state (show zeros when no campaigns exist, not demo data)

### Technical Details

**Files changed:**

- `src/pages/CampaignPlanner.tsx` -- add a second query for `campaign_conversions`, merge results into campaign objects, pass campaigns to overview cards, remove demo fallback
- `src/components/campaigns/CampaignOverviewCards.tsx` -- accept `campaigns: Campaign[]` prop, compute card values dynamically, remove static `demoCampaigns` import

**New query in CampaignPlanner:**
```sql
SELECT campaign_id, count(*) as leads, coalesce(sum(revenue), 0) as revenue
FROM campaign_conversions
WHERE campaign_id IN (...)
GROUP BY campaign_id
```

This will be done via the Supabase JS client by fetching all conversions for the user's campaign IDs and aggregating in JS (since the client doesn't support GROUP BY directly).

**No database changes needed** -- all required data already exists in the `campaigns` and `campaign_conversions` tables.

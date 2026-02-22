

## Add Conversion Data and Info Tooltips to Analytics Dashboard

### Overview
Integrate the `campaign_conversions` table data into the Analytics Dashboard, adding new KPI cards, a "Conversions Over Time" chart, and informational tooltips on every card/chart explaining where the data comes from.

### Changes

#### 1. Add glossary entries for analytics terms
**File: `src/data/marketingGlossary.ts`**

Add new entries for analytics-specific terms:
- `total-clicks` -- "Total number of times your UTM links were clicked. Tracked via the UTM link shortener redirect."
- `top-link` -- "The UTM link with the most clicks in the selected time period."
- `traffic-sources` -- "Websites or platforms that referred visitors to your links. Parsed from the HTTP referrer header on each click."
- `total-conversions` -- "Actions tracked by your Smart Pixel snippet placed on landing/thank-you pages. Each pixel fire = one conversion."
- `conversion-rate` -- "Percentage of clicks that resulted in a conversion. Formula: (Conversions / Clicks) x 100."
- `total-revenue` -- "Sum of all revenue values passed via the Smart Pixel's data-revenue attribute on conversion events."
- `clicks-over-time` -- "Daily click counts from the UTM click events table, filtered by date range and campaign."
- `conversions-over-time` -- "Daily conversion counts from the Smart Pixel tracking table, filtered by date range and campaign."
- `clicks-by-campaign` / `clicks-by-source-medium` / `device-breakdown` / `browser-breakdown` / `click-timing` -- brief descriptions of data source

#### 2. Fetch conversion data in the analytics hook
**File: `src/hooks/useCampaignAnalytics.ts`**

- Add a new query to fetch from `campaign_conversions` table, filtered by date range and optionally by `campaign_id`
- Derive:
  - `totalConversions` -- count of conversion rows
  - `totalRevenue` -- sum of `revenue` column
  - `conversionRate` -- `(totalConversions / totalClicks) * 100`
  - `conversionsOverTime` -- daily counts grouped by `created_at`
  - `revenueOverTime` -- daily revenue sums grouped by `created_at`
- Return all new values from the hook

#### 3. Add new summary KPI cards
**File: `src/pages/CampaignAnalytics.tsx`**

Expand the summary cards row from 3 to 6 (2 rows of 3):
- **Row 1** (existing): Total Clicks, Top Performing Link, Traffic Sources
- **Row 2** (new): Total Conversions, Conversion Rate, Total Revenue

Each card title gets an `InfoTooltip` using the glossary keys above so users can hover to learn what the metric means and where the data comes from.

#### 4. Create ConversionsOverTimeChart component
**New file: `src/components/marketing-hub/analytics/ConversionsOverTimeChart.tsx`**

- Dual-area chart showing conversions and revenue over time (two Y-axes)
- Same styling pattern as `ClicksOverTimeChart`
- Card title includes an `InfoTooltip`

#### 5. Add tooltips to all existing chart cards
Update each chart component to include an `InfoTooltip` next to the `CardTitle`:
- `ClicksOverTimeChart.tsx` -- tooltip for `clicks-over-time`
- `TopLinksChart.tsx` -- tooltip for `top-link`
- `TrafficSourcesChart.tsx` -- tooltip for `traffic-sources`
- `ClicksByCampaignChart.tsx` -- tooltip for `clicks-by-campaign`
- `ClicksBySourceMediumChart.tsx` -- tooltip for `clicks-by-source-medium`
- `ClickTimingChart.tsx` -- tooltip for `click-timing`
- `DeviceBreakdownChart.tsx` -- tooltip for `device-breakdown`

Pattern: wrap title in `LabelWithTooltip` from the existing `info-tooltip` component.

#### 6. Place new chart on the page
**File: `src/pages/CampaignAnalytics.tsx`**

Add `ConversionsOverTimeChart` below the existing `ClicksOverTimeChart`.

### Technical Details

- The `campaign_conversions` query uses `.eq("campaign_id", campaignId)` when a campaign is selected, otherwise fetches all for the user's campaigns (joined via campaign IDs from the campaigns query)
- Revenue is formatted as currency with `toLocaleString`
- Conversion rate displays as percentage with one decimal
- All new data respects the existing date range filter
- No database changes needed -- `campaign_conversions` table already exists with the right schema and RLS policies

### Files Modified
1. `src/data/marketingGlossary.ts` -- add ~12 new glossary entries
2. `src/hooks/useCampaignAnalytics.ts` -- add conversions query + derived metrics
3. `src/pages/CampaignAnalytics.tsx` -- add 3 KPI cards, new chart, tooltips on existing cards
4. `src/components/marketing-hub/analytics/ConversionsOverTimeChart.tsx` -- new component
5. `src/components/marketing-hub/analytics/ClicksOverTimeChart.tsx` -- add tooltip
6. `src/components/marketing-hub/analytics/TopLinksChart.tsx` -- add tooltip
7. `src/components/marketing-hub/analytics/TrafficSourcesChart.tsx` -- add tooltip
8. `src/components/marketing-hub/analytics/ClicksByCampaignChart.tsx` -- add tooltip
9. `src/components/marketing-hub/analytics/ClicksBySourceMediumChart.tsx` -- add tooltip
10. `src/components/marketing-hub/analytics/ClickTimingChart.tsx` -- add tooltip
11. `src/components/marketing-hub/analytics/DeviceBreakdownChart.tsx` -- add tooltip

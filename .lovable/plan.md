
# Campaign Analytics Dashboard

## Overview
Create a new Campaign Analytics page at `/marketing-hub/analytics` with UTM click data visualizations, and update the Marketing Hub landing page to remove the "Saved Links" and "Total Clicks" stat cards.

## Page Layout (matching the screenshot reference)

### Header
- Back arrow linking to `/marketing-hub`
- "Analytics Dashboard" title + subtitle
- Date range selector dropdown (Last 7 days, Last 30 days, Last 90 days, All time)

### Summary Cards (3 across)
1. **Total Clicks** - total click count in selected period, with period label
2. **Top Performing Link** - link label with most clicks, showing click count
3. **Traffic Sources** - count of unique referrer domains

### Clicks Over Time Chart
- Area/line chart showing daily click counts for the selected period
- Uses recharts via the existing `GrowthChart` component pattern (or a new reusable chart)

### Bottom Row (2 columns)
1. **Top Performing Links** - horizontal bar chart showing top 10 links by click count
2. **Traffic Sources** - donut/pie chart showing referrer breakdown (direct vs referrer domains)

### Additional Sections (below)
3. **Clicks by Campaign** - bar chart grouping clicks by `utm_campaign`
4. **Clicks by Source / Medium** - bar chart grouping by `utm_source` and `utm_medium`
5. **Click Timing Patterns** - heatmap or bar chart showing best day of week and best hour of day
6. **Device / Browser Breakdown** - pie chart parsing `user_agent` into device categories

## Data Fetching Strategy
- Fetch all `utm_links` for the user (label, campaign, source, medium, click_count)
- Fetch `utm_click_events` joined with `utm_links` (via utm_link_id) to get timestamps, referrers, user_agents
- Filter by date range client-side (or with `.gte`/`.lte` on `clicked_at`)
- Parse `user_agent` strings client-side into broad categories (Mobile/Desktop/Tablet, Chrome/Safari/Firefox/Other)

## Marketing Hub Landing Page Changes
- Remove the "Saved Links" and "Total Clicks" stat cards grid
- Remove the `useQuery` for `utm-stats`
- Update the "Campaign Analytics" tool card to link to `/marketing-hub/analytics` with `available: true`

## Technical Details

### New Files
- `src/pages/CampaignAnalytics.tsx` - main page component with data fetching, date range state, and layout
- `src/components/marketing-hub/analytics/ClicksOverTimeChart.tsx` - time series area chart
- `src/components/marketing-hub/analytics/TopLinksChart.tsx` - horizontal bar chart
- `src/components/marketing-hub/analytics/TrafficSourcesChart.tsx` - donut chart
- `src/components/marketing-hub/analytics/ClicksByCampaignChart.tsx` - bar chart
- `src/components/marketing-hub/analytics/ClicksBySourceMediumChart.tsx` - bar chart
- `src/components/marketing-hub/analytics/ClickTimingChart.tsx` - day-of-week / hour bar charts
- `src/components/marketing-hub/analytics/DeviceBreakdownChart.tsx` - pie chart
- `src/hooks/useCampaignAnalytics.ts` - custom hook fetching utm_links + utm_click_events with date filtering

### Modified Files
- `src/pages/MarketingHub.tsx` - remove stat cards, enable Campaign Analytics link
- `src/App.tsx` - add route `/marketing-hub/analytics` wrapped in `ProtectedAdminRoute`

### Data Processing
- **Referrer parsing**: Extract domain from referrer URL, group nulls as "Direct"
- **User agent parsing**: Simple regex-based categorization (Mobile vs Desktop, browser name extraction)
- **Time grouping**: Group `clicked_at` timestamps by day for the time series, by hour/day-of-week for timing patterns

### Extensibility
- The page structure uses a modular card-based layout so future data types (social post performance, landing page metrics, conversion tracking) can be added as new chart cards without restructuring
- The date range filter will apply globally to all charts on the page

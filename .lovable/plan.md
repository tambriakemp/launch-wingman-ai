

## Remove Campaign Analytics Tab and Enhance Summary Tab

### Why
The campaign-level Analytics tab uses entirely hardcoded demo data and duplicates what the Summary tab already shows with real data. Removing it simplifies navigation and reduces confusion. The two unique features from the Analytics tab (Attribution Table and time-based analysis) will be added to the Summary tab with real data.

### Changes

#### 1. Remove the Analytics tab from the campaign detail view
**File: `src/components/campaigns/CampaignDetailTabs.tsx`**
- Remove the `AnalyticsTab` import
- Remove `{ id: "analytics", label: "Analytics", icon: BarChart3 }` from `tabItems`
- Remove the `<TabsContent value="analytics">` block

#### 2. Delete the Analytics tab component
**File: `src/components/campaigns/tabs/AnalyticsTab.tsx`**
- Delete this file entirely (it only contains hardcoded demo data)

#### 3. Add Attribution Table to Summary tab
**File: `src/components/campaigns/tabs/SummaryTab.tsx`**
- Build a real attribution table by cross-referencing UTM links (clicks by source/medium) with conversion data (leads and revenue by source/medium)
- Columns: Source, Medium, Clicks, Leads, Revenue, CVR
- Placed below the existing Source Performance card
- Uses the same `dbLinks` and `conversionData` queries already in the component

#### 4. Add Click Timing chart to Summary tab
**File: `src/components/campaigns/tabs/SummaryTab.tsx`**
- Fetch click events for this campaign from the `utm_click_events` table
- Derive day-of-week and hour-of-day distributions
- Reuse the existing `ClickTimingChart` component (already built for the main dashboard)
- Placed at the bottom of the Summary tab

### Technical Details

**Attribution table data derivation (no new queries needed):**
- Group existing `dbLinks` by `utm_source + utm_medium` to get click totals
- Group existing `conversionData` by `utm_source + utm_medium` to get lead counts and revenue sums
- Merge into a single table with CVR = leads / clicks x 100

**Click timing data (one new query):**
- Fetch `utm_click_events` where `link_id` is in the campaign's link IDs
- Parse `clicked_at` timestamps to extract day-of-week and hour-of-day
- Pass derived arrays to the existing `ClickTimingChart` component

### Files Modified
1. `src/components/campaigns/CampaignDetailTabs.tsx` -- remove analytics tab entry
2. `src/components/campaigns/tabs/AnalyticsTab.tsx` -- delete file
3. `src/components/campaigns/tabs/SummaryTab.tsx` -- add attribution table and click timing chart


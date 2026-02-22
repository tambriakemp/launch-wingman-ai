

## Make Analytics Layouts More Responsive on Smaller Screens

Based on the screenshot and code review, several analytics components overflow or feel cramped on mobile/tablet. Here are the targeted fixes:

### 1. Campaign Detail Summary Tab (SummaryTab.tsx)

**KPI Cards grid**: Currently `grid-cols-2 md:grid-cols-4`. On small screens, 4 KPI cards in 2 columns can overflow text (especially "Revenue" and "Conversion" labels with trend badges). Fix:
- Change to `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` so cards stack single-column on very small screens
- Make the KPI card value + trend badge wrap more gracefully with `flex-wrap`

**Traffic breakdown row**: Currently `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`. This is OK but the charts inside have fixed heights that can feel tight. Minor tweaks to ensure pie chart legends don't overflow.

**Source Performance table**: The 4-column grid can be tight on mobile. Add horizontal scroll wrapper for very small screens.

### 2. Campaign Analytics Dashboard (CampaignAnalytics.tsx)

**Summary cards**: Currently `grid-cols-1 sm:grid-cols-3`. This works but the header layout could be tighter on mobile.
- Stack the header title and date range selector vertically on mobile

### 3. Analytics Chart Components

**ClickTimingChart**: Already uses `md:grid-cols-2` -- this is fine.

**DeviceBreakdownChart**: Already uses `md:grid-cols-2` -- this is fine.

**All chart cards**: Reduce minimum chart heights on small screens so they don't force excessive scrolling.

### 4. Campaign Overview Cards (CampaignOverviewCards.tsx)

Already responsive with `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` -- no changes needed.

### 5. KPICard Component in SummaryTab

- Reduce padding on mobile
- Allow value text to scale down slightly on small screens (`text-xl` on mobile, `text-2xl` on desktop)
- Ensure the trend badge doesn't overflow next to the value

---

### Technical Details

**Files to modify:**

- **`src/components/campaigns/tabs/SummaryTab.tsx`**
  - KPI grid: `grid-cols-1 sm:grid-cols-2 md:grid-cols-4`
  - KPICard: Add `flex-wrap` to value row, responsive text sizing (`text-xl sm:text-2xl`), reduce card padding on mobile (`p-3 sm:p-4`)
  - Traffic breakdown: Ensure charts use responsive heights
  - Source table: Add `overflow-x-auto` wrapper

- **`src/pages/CampaignAnalytics.tsx`**
  - Header: ensure title text is `text-xl sm:text-2xl` 
  - Date range selector: full width on mobile with `w-full sm:w-[160px]`

- **`src/components/marketing-hub/analytics/ClicksOverTimeChart.tsx`**
  - Reduce chart height on mobile: `h-[200px] sm:h-[260px]` via responsive container

- **`src/components/marketing-hub/analytics/TopLinksChart.tsx`**
  - Reduce left margin on mobile, smaller chart height

- **`src/components/marketing-hub/analytics/ClickTimingChart.tsx`**
  - Reduce chart height on mobile

- **`src/components/marketing-hub/analytics/DeviceBreakdownChart.tsx`**
  - Reduce chart height on mobile

- **`src/components/marketing-hub/analytics/TrafficSourcesChart.tsx`**
  - Reduce chart height on mobile

- **`src/components/marketing-hub/analytics/ClicksByCampaignChart.tsx`** and **`ClicksBySourceMediumChart.tsx`**
  - Reduce chart height on mobile

No database changes needed. All changes are CSS/layout adjustments using Tailwind responsive prefixes.

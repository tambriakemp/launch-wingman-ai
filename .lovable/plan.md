

# Campaign Detail Page -- Layout and Design Overhaul

## Problem
The current page is a long single-column scroll with a dense header, followed by 6 horizontal tabs. On desktop it underuses horizontal space, on mobile the tabs overflow and tables are cramped. The header mixes too many concerns (title, status, meta, warnings, actions) in a single vertical stack.

## Proposed Layout

### Desktop (lg and above): Two-Zone Layout

```text
+-------------------------------------------------------+
| < Campaigns    [Duplicate] [Archive]                   |
+-------------------------------------------------------+
| Campaign Name (editable)          Status | Goal | Tags |
| Mar 1 - Apr 15 · Budget: $5,000                       |
+-------------------+-----------------------------------+
|                   |                                   |
|  SIDEBAR          |  MAIN CONTENT AREA                |
|  (220px fixed)    |  (flex-1)                         |
|                   |                                   |
|  Navigation       |  Tab content renders here         |
|  - Summary        |                                   |
|  - Links          |                                   |
|  - Assets         |                                   |
|  - Funnel         |                                   |
|  - Analytics      |                                   |
|  - Notes          |                                   |
|                   |                                   |
|  Quick Stats      |                                   |
|  (mini KPIs)      |                                   |
|                   |                                   |
+-------------------+-----------------------------------+
```

- Left sidebar contains: vertical nav tabs, quick-glance KPIs (traffic, leads, revenue, CVR as compact stats), and health indicators
- Main content area gets full width for charts, tables, and grids
- Warning banners (no links, ended campaign) appear as a slim bar between header and content zones

### Tablet (md): Collapsed sidebar
- Sidebar becomes a horizontal scrollable tab bar (same as current but refined)
- Quick stats move to a compact row above tab content

### Mobile (below md): Stacked
- Header compresses: name + status on one line, meta below, actions in a dropdown menu (three-dot)
- Tabs become horizontally scrollable pills
- All grids collapse to single column
- Tables switch to card-based layouts

## Detailed Changes

### 1. CampaignDetail.tsx -- New two-zone layout
- Wrap content in a flex container: `flex flex-col lg:flex-row`
- Left zone: `w-full lg:w-56 lg:shrink-0` for the sidebar nav
- Right zone: `flex-1 min-w-0` for the content

### 2. New Component: CampaignDetailSidebar.tsx
- Vertical nav list with icons for each tab (LayoutDashboard, Link2, Image, GitBranch, BarChart3, StickyNote)
- Active tab highlighted with left border accent + bg tint
- Below nav: compact stat cards showing 4 key metrics as small number + label pairs
- Below stats: health indicators (link health, tracking confidence)
- Only visible on `lg:` breakpoint; hidden on smaller screens

### 3. CampaignDetailHeader.tsx -- Simplified
- Compact single-row layout: back button, name, status badge, goal badge, tags inline
- Actions (Duplicate, Archive) move into a `DropdownMenu` on mobile, stay as buttons on desktop
- Meta row (dates, budget) as subtle text below the title
- Warning banners remain below header but get a slimmer profile

### 4. CampaignDetailTabs.tsx -- Responsive tab bar
- On `lg:` screens: tabs hidden (navigation is in sidebar)
- On smaller screens: horizontal scrollable tab pills with `overflow-x-auto`
- Each pill uses the same icon from the sidebar for visual consistency

### 5. SummaryTab.tsx -- Modernized grid
- KPI cards: `grid-cols-2 md:grid-cols-4` (reduced from 6 to 4 primary KPIs; CPL and ROI become secondary)
- Cards get a subtle left-border color accent based on metric type
- Charts section: 2-column grid on desktop, stacked on mobile
- Source performance table: responsive with horizontal scroll on mobile
- Health indicators removed from Summary (moved to sidebar)

### 6. LinksTab.tsx -- Mobile cards
- Desktop: keep table layout
- Mobile (below md): each link renders as a card with stacked fields instead of table row
- Toolbar buttons stack vertically on mobile with full-width

### 7. AssetsTab.tsx -- Consistent grid
- `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` (unchanged but ensure cards don't overflow)

### 8. FunnelTab.tsx -- Responsive funnel
- Desktop: horizontal flow (current)
- Mobile: vertical flow with downward arrows instead of right arrows
- Step cards get full width on mobile

### 9. AnalyticsTab.tsx -- Better chart layout
- Charts: `grid-cols-1 lg:grid-cols-2` (already correct)
- ROI summary: horizontal on desktop, 2x2 grid on mobile
- Attribution table: horizontal scroll wrapper on mobile

### 10. NotesTab.tsx -- Full width
- Remove `max-w-3xl` constraint so it uses available space in the new layout

## Files to Create
| File | Purpose |
|------|---------|
| `src/components/campaigns/CampaignDetailSidebar.tsx` | Vertical nav + quick stats for desktop |

## Files to Modify
| File | Changes |
|------|---------|
| `src/pages/CampaignDetail.tsx` | Two-zone flex layout, integrate sidebar |
| `src/components/campaigns/CampaignDetailHeader.tsx` | Compact single-row, mobile dropdown actions |
| `src/components/campaigns/CampaignDetailTabs.tsx` | Hide on lg, scrollable pills on mobile |
| `src/components/campaigns/tabs/SummaryTab.tsx` | Remove health indicators (moved to sidebar), 4-col KPIs |
| `src/components/campaigns/tabs/LinksTab.tsx` | Card layout on mobile |
| `src/components/campaigns/tabs/FunnelTab.tsx` | Vertical flow on mobile |
| `src/components/campaigns/tabs/NotesTab.tsx` | Remove max-w constraint |

## Technical Notes
- No new dependencies needed
- Sidebar nav uses the same `activeTab` / `onTabChange` state already in CampaignDetail
- `useIsMobile` hook available but not required -- all responsive behavior via Tailwind breakpoints
- No data model changes, no database migrations
- Demo data and real data paths remain unchanged


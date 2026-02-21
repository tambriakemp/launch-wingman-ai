

# Campaign Planner Dashboard -- Implementation Plan

## Overview
Build an admin-only Campaign Planner Dashboard under the Marketing Hub. This is a professional, data-first marketing command center with campaign management, metric cards, timeline views, detailed campaign pages, and a structured creation flow. All data will initially use realistic placeholder/demo data (no new database tables in Phase 1).

---

## Phase 1: Foundation (Static UI with Demo Data)

Since this is a large feature, we will build it with hardcoded demo data first to nail the UI, then wire up database persistence in a follow-up.

---

## 1. New Files to Create

### Pages
- `src/pages/CampaignPlanner.tsx` -- Main dashboard page (overview cards + campaign table + timeline toggle)
- `src/pages/CampaignDetail.tsx` -- Campaign detail page with tabbed interface

### Components
- `src/components/campaigns/CampaignOverviewCards.tsx` -- 4 metric cards with sparklines
- `src/components/campaigns/CampaignTable.tsx` -- Sortable, filterable, paginated table
- `src/components/campaigns/CampaignTimelineView.tsx` -- Horizontal timeline with campaign bars
- `src/components/campaigns/CampaignDetailHeader.tsx` -- Editable campaign header
- `src/components/campaigns/CampaignDetailTabs.tsx` -- Tab container (Summary, Links, Assets, Funnel, Analytics, Notes)
- `src/components/campaigns/tabs/SummaryTab.tsx` -- Goal progress, revenue, traffic breakdown
- `src/components/campaigns/tabs/LinksTab.tsx` -- UTM links table for the campaign
- `src/components/campaigns/tabs/AssetsTab.tsx` -- Card grid of assets
- `src/components/campaigns/tabs/FunnelTab.tsx` -- Visual funnel map
- `src/components/campaigns/tabs/AnalyticsTab.tsx` -- Charts (traffic, leads, revenue)
- `src/components/campaigns/tabs/NotesTab.tsx` -- Notes textarea + AI retrospective button
- `src/components/campaigns/NewCampaignModal.tsx` -- Multi-step creation modal (4 steps)
- `src/components/campaigns/campaignDemoData.ts` -- Hardcoded demo data for 6 campaigns

### Data/Types
- `src/types/campaign.ts` -- TypeScript interfaces for Campaign, CampaignAsset, etc.

---

## 2. Sidebar Navigation Update

**File: `src/components/layout/ProjectSidebar.tsx`**

Expand the Marketing section to show the full navigation list when active on any `/marketing-hub/*` route:

- Overview (`/marketing-hub`)
- Campaigns (`/marketing-hub/campaigns`) -- **new**
- UTM Builder (`/marketing-hub/utm-builder`)
- Content Engine (coming soon, disabled)
- Funnels and Offers (coming soon, disabled)
- Analytics (`/marketing-hub/analytics`)
- Experiments (coming soon, disabled)
- Automations (coming soon, disabled)
- Integrations (coming soon, disabled)
- Library (coming soon, disabled)

Items marked "coming soon" will be visually muted with a tooltip.

---

## 3. Routing

**File: `src/App.tsx`**

Add two new routes under `ProtectedAdminRoute`:
- `/marketing-hub/campaigns` -> `CampaignPlanner`
- `/marketing-hub/campaigns/:campaignId` -> `CampaignDetail`

---

## 4. Campaign Planner Page Layout

### Section 1: Overview Cards (Top Row)
4 cards in a grid:
- **Active Campaigns** -- count, % change, sparkline
- **Total Leads** -- sum for date range, % change, sparkline
- **Revenue Generated** -- dollar amount, % change, sparkline
- **Avg Conversion Rate** -- percentage, % change, sparkline

Each card uses Recharts `<Sparkline>` (tiny area chart) for the trend line.

### Section 2: Campaign List Table
- Table/Timeline toggle above the table
- Sortable columns: Name, Status (badge), Goal, Start Date, End Date, Leads, Revenue, ROI %, Owner, Last Updated
- Search input + status filter dropdown
- Pagination (10 per page)
- Row click navigates to `/marketing-hub/campaigns/:id`
- Three-dot action menu per row (Edit, Duplicate, Archive)
- "+ New Campaign" button in header

### Section 3: Timeline View (Toggle)
- Horizontal Gantt-style timeline
- Campaign bars color-coded by status (Draft=gray, Live=green, Evergreen=purple, Ended=red)
- Hover tooltip shows quick metrics

---

## 5. Campaign Detail Page

### Header
- Back arrow to campaigns list
- Campaign name (inline editable)
- Status badge (with dropdown to change)
- Goal label
- Owner
- Tags
- Edit button

### Tabs
1. **Summary** -- Goal progress bar, revenue progress, conversion rate, traffic breakdown pie chart (Recharts), top 3 assets, top 3 links
2. **Links** -- Table of UTM links with clicks, leads, revenue, conversion rate columns
3. **Assets** -- Card grid with asset type icons, performance stats, "+ Add Asset" button
4. **Funnel** -- Visual step diagram: Landing Page -> Lead Capture -> Checkout -> Upsell, each showing visitors, conversion %, drop-off %
5. **Analytics** -- Line charts for traffic and leads over time, revenue bar chart by source, ROI summary
6. **Notes** -- Textarea for notes, "Generate Launch Retrospective" button (placeholder), edit timeline

---

## 6. New Campaign Modal (4 Steps)

Step-by-step modal using existing Dialog component:

1. **Basics** -- Name, Goal (dropdown), Start/End dates, Budget (optional), Owner, Tags
2. **Attribution Setup** -- Auto-generate UTM links toggle, platform checkboxes
3. **Attach Offer/Funnel** -- Select existing or create new (placeholder)
4. **Confirm + Create** -- Review summary, create button

---

## 7. Demo Data

6 campaigns with mixed statuses and realistic numbers:

| Name | Status | Goal | Leads | Revenue |
|------|--------|------|-------|---------|
| Spring Launch 2026 | Live | Revenue | 1,247 | $34,500 |
| Email List Growth Q1 | Evergreen | Leads | 3,891 | $0 |
| Webinar Funnel Beta | Draft | Leads | 0 | $0 |
| Black Friday Flash | Ended | Revenue | 5,612 | $89,200 |
| App Install Push | Live | App Installs | 892 | $12,400 |
| Challenge Funnel v2 | Draft | Challenge Signups | 0 | $0 |

---

## 8. Style Guidelines
- Clean, professional SaaS aesthetic consistent with existing app
- Use existing Tailwind classes and component library (Card, Table, Badge, Tabs, Dialog, Button)
- No decorative elements -- data-first presentation
- Clear typography hierarchy using existing font (Plus Jakarta Sans)
- Status badge colors: Draft=gray, Live=green, Evergreen=purple, Ended=red
- Consistent spacing using existing p-4/p-6 patterns

---

## Technical Notes

- All data is hardcoded demo data in this phase (no database tables yet)
- Recharts is already installed for sparklines and charts
- Uses existing `ProjectLayout` for consistent page structure
- Uses existing `ProtectedAdminRoute` for access control
- Campaign detail page uses React Router params (`:campaignId`)
- The NewCampaignModal uses controlled state with step tracking
- Table sorting/filtering/pagination is client-side over demo data
- No new dependencies required

---

## Files Changed (Summary)

| File | Action |
|------|--------|
| `src/types/campaign.ts` | Create |
| `src/components/campaigns/campaignDemoData.ts` | Create |
| `src/components/campaigns/CampaignOverviewCards.tsx` | Create |
| `src/components/campaigns/CampaignTable.tsx` | Create |
| `src/components/campaigns/CampaignTimelineView.tsx` | Create |
| `src/components/campaigns/NewCampaignModal.tsx` | Create |
| `src/components/campaigns/CampaignDetailHeader.tsx` | Create |
| `src/components/campaigns/CampaignDetailTabs.tsx` | Create |
| `src/components/campaigns/tabs/SummaryTab.tsx` | Create |
| `src/components/campaigns/tabs/LinksTab.tsx` | Create |
| `src/components/campaigns/tabs/AssetsTab.tsx` | Create |
| `src/components/campaigns/tabs/FunnelTab.tsx` | Create |
| `src/components/campaigns/tabs/AnalyticsTab.tsx` | Create |
| `src/components/campaigns/tabs/NotesTab.tsx` | Create |
| `src/pages/CampaignPlanner.tsx` | Create |
| `src/pages/CampaignDetail.tsx` | Create |
| `src/App.tsx` | Edit -- add 2 routes |
| `src/components/layout/ProjectSidebar.tsx` | Edit -- expand marketing nav |


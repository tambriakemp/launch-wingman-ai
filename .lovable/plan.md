

## Funnel Step Tracking via Smart Pixel

### Overview
Extend the existing campaign pixel system to support funnel step tracking. This enables real conversion funnel visualization with actual drop-off data, replacing the current hardcoded demo. The system works on any platform that allows custom HTML -- including Systeme.io, Kajabi, ClickFunnels, WordPress, Shopify, Kartra, Squarespace, Wix, and more.

### Platform Compatibility

The pixel uses a simple HTTP request, making it work on virtually any platform:

| Platform | JS Pixel | IMG Pixel | Notes |
|----------|----------|-----------|-------|
| Systeme.io | Yes | Yes | Custom code on thank-you pages |
| Kajabi | Yes | Yes | Custom tracking code area |
| ClickFunnels | Yes | Yes | Custom scripts per page |
| WordPress | Yes | Yes | HTML blocks or header scripts |
| Shopify | Yes | Yes | Order status page scripts |
| Stan Store | Limited | Yes | IMG pixel recommended |
| Kartra | Yes | Yes | Custom tracking code areas |
| Leadpages | Yes | Yes | Custom script support |
| Squarespace | Yes | Yes | Code injection feature |
| ThriveCart | Yes | Yes | Success page scripts |
| Thinkific | Yes | Yes | Custom code on thank-you pages |
| Gumroad | Limited | Yes | IMG pixel on custom receipts |

The IMG pixel (`<img src="...">`) is the most universal fallback since it requires zero JavaScript.

---

### What Changes

#### 1. Database: Add `step` column to `campaign_conversions`

Add a nullable `step` text column to categorize each conversion event by funnel stage:
- `"landing"` -- Visitor arrived on the page
- `"engage"` -- Scrolled past a key section or clicked a CTA
- `"lead"` -- Submitted email / opted in
- `"checkout"` -- Reached checkout or payment page
- `"purchase"` -- Completed payment (has revenue > 0)
- Custom values allowed for flexibility

#### 2. Edge Function: Accept `step` parameter

Update `campaign-pixel/index.ts` to:
- Parse a new `step` (or `s`) URL parameter
- Validate it (max 50 chars, alphanumeric + underscores/hyphens)
- Insert it into the `campaign_conversions` row

#### 3. Pixel Tab: Add funnel step pixel snippets

Update `PixelTab.tsx` to include a new section showing step-aware pixel snippets users can paste on different pages of their funnel:

```
Landing page:   ...?c=CAMPAIGN_ID&step=landing
Opt-in page:    ...?c=CAMPAIGN_ID&step=lead
Checkout page:  ...?c=CAMPAIGN_ID&step=checkout
Thank-you page: ...?c=CAMPAIGN_ID&step=purchase&revenue=AMOUNT
```

Each step gets a copyable snippet (both JS and IMG variants) with clear labels explaining where to paste it.

#### 4. `/go` Sales Page: Fire step events

Update `SalesFunnel.tsx` to fire multiple pixel events:
- `step=landing` on page load (already partially done)
- `step=engage` when user scrolls to a key section (e.g., the CTA area)
- `step=lead` when the user clicks a signup CTA (before navigating to auth)

#### 5. Funnel Tab: Real data visualization

Replace `FunnelTab.tsx` hardcoded demo data with real aggregated data:
- Query `campaign_conversions` grouped by `step`
- Count unique `ip_hash` values per step to get visitor counts
- Calculate conversion and drop-off percentages between steps
- Display using the existing funnel flow UI (horizontal cards with arrows)
- Show "No funnel data yet" with a link to the Pixel tab when no step data exists

#### 6. Remove the disabled "Funnels and Offers" nav item

The Marketing Hub sidebar currently has a disabled "Funnels & Offers" placeholder. Remove it since:
- The main Plan section already handles funnel/offer configuration
- The campaign-level Funnel tab now shows real tracking data
- Having both is redundant

---

### Technical Details

**Database migration:**
```sql
ALTER TABLE campaign_conversions 
ADD COLUMN step text DEFAULT NULL;

CREATE INDEX idx_campaign_conversions_step 
ON campaign_conversions(campaign_id, step);
```

**Pixel URL with step:**
```
.../campaign-pixel?c=CAMPAIGN_ID&step=landing
.../campaign-pixel?c=CAMPAIGN_ID&step=lead
.../campaign-pixel?c=CAMPAIGN_ID&step=purchase&revenue=49.99
```

**Funnel aggregation query pattern:**
```sql
SELECT step, COUNT(DISTINCT ip_hash) as visitors
FROM campaign_conversions
WHERE campaign_id = ? AND step IS NOT NULL
GROUP BY step
```

**Files to modify:**
1. `supabase/functions/campaign-pixel/index.ts` -- accept and store `step` param
2. `src/components/campaigns/tabs/PixelTab.tsx` -- add funnel step snippet section
3. `src/components/campaigns/tabs/FunnelTab.tsx` -- replace demo data with real aggregation
4. `src/pages/SalesFunnel.tsx` -- fire step-aware pixel events
5. `src/components/layout/ProjectSidebar.tsx` -- remove disabled "Funnels & Offers" nav item
6. Database migration -- add `step` column and index


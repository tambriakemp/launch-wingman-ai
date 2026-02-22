

## Goal-Aware Conversion Calculation

### Current Problem
The "Conversion" KPI always shows `leads / clicks x 100`, which is misleading for revenue-focused campaigns -- it goes up when leads come in even if zero revenue has been earned.

### New Logic

The conversion KPI card will adapt based on the campaign's goal:

| Campaign Goal | Label | Formula | What it means |
|---|---|---|---|
| leads | Click-to-Lead | leads / clicks x 100 | % of visitors who became leads |
| app_installs | Click-to-Lead | leads / clicks x 100 | Same as above |
| challenge_signups | Click-to-Lead | leads / clicks x 100 | Same as above |
| revenue | Lead-to-Sale | paid_conversions / leads x 100 | % of leads that generated revenue |

Where `paid_conversions` = count of records in `campaign_conversions` where `revenue > 0`.

### Secondary Metric
Regardless of goal, a small secondary line will show the "other" conversion rate beneath the primary one:
- Revenue campaigns: secondary shows "Click-to-Lead: X%"
- Lead campaigns: secondary shows "Lead-to-Sale: X%" (if any conversions with revenue exist)

This gives full context without cluttering the UI.

### Tooltip Updates
The tooltip text on the Conversion KPI card will also adapt to explain the formula being used for the current goal.

### Technical Details

**File:** `src/components/campaigns/tabs/SummaryTab.tsx`

Changes:
1. Compute `paidConversions` = count of conversions where `revenue > 0`
2. Compute `clickToLeadRate` = `totalLeads / totalTraffic * 100`
3. Compute `leadToSaleRate` = `paidConversions / totalLeads * 100` (guard against divide-by-zero)
4. Set primary conversion value based on `campaign.goal`:
   - `"revenue"` -> use `leadToSaleRate`, label "Lead-to-Sale"
   - all others -> use `clickToLeadRate`, label "Click-to-Lead"
5. Update the Conversion KPI card to use the dynamic label, value, and tooltip
6. Add a secondary line of text below the "vs. last period" showing the alternate metric

No database changes required -- all data is already available from existing queries.


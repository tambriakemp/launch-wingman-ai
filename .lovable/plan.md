

## Add Referral Source Tracking to Analytics Dashboard

### What it does
Adds a new "Signups by Referral Source" chart to the `/marketing-hub/analytics` page that shows how many users signed up from each `?ref=` parameter (e.g., `producthunt`, `twitter`, `newsletter`). This gives you visibility into which referral links are actually converting into signups.

### What you'll see
- A new summary card in the conversions row showing **Total Referral Signups** (count of profiles with a `ref_source`)
- A new horizontal bar chart titled **Signups by Referral Source** showing each `ref_source` value and its signup count, placed alongside the existing Device/Browser breakdown

### Changes

#### 1. Update the analytics hook (`src/hooks/useCampaignAnalytics.ts`)
Add a new query that fetches `ref_source` counts from the `profiles` table:
- Query all profiles where `ref_source IS NOT NULL`
- Group and count by `ref_source` value
- Apply date range filter using `created_at`
- Return `referralSignups` array (e.g., `[{ source: "producthunt", count: 5 }, ...]`) and `totalReferralSignups` count

#### 2. Create a new chart component (`src/components/marketing-hub/analytics/ReferralSourcesChart.tsx`)
A horizontal bar chart (matching the existing style of TopLinksChart/TrafficSourcesChart) that displays each referral source and its signup count. Shows an empty state message when no referral data exists yet.

#### 3. Update the analytics page (`src/pages/CampaignAnalytics.tsx`)
- Add a "Referral Signups" summary card with a Users icon showing the total count
- Add the ReferralSourcesChart in a new row at the bottom of the dashboard

### Technical details

**Hook query (profiles table):**
```typescript
const referralsQuery = useQuery({
  queryKey: ["referral-sources-analytics", user?.id, dateRange],
  queryFn: async () => {
    const rangeStart = getRangeStart(dateRange);
    let query = supabase
      .from("profiles")
      .select("ref_source, created_at")
      .not("ref_source", "is", null);
    if (rangeStart) {
      query = query.gte("created_at", rangeStart.toISOString());
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  enabled: !!user,
});
```

Note: This query only works for admin users since profiles RLS only allows viewing your own profile. We'll need to add an RLS policy so admins can read all profiles for this aggregation.

**Database change:**
Add an RLS SELECT policy on `profiles` for admins:
```sql
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
```

### Files to modify
1. Database migration -- add admin SELECT policy on profiles
2. `src/hooks/useCampaignAnalytics.ts` -- add referral source query and aggregation
3. `src/components/marketing-hub/analytics/ReferralSourcesChart.tsx` -- new chart component
4. `src/pages/CampaignAnalytics.tsx` -- add summary card and chart to the page

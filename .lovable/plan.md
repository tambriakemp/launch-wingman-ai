

## Track `?ref=` Referral Parameter

### Problem
The landing page doesn't capture or store the `?ref=` query parameter. Visitors arriving from `https://launchely.com/?ref=producthunt` are indistinguishable from direct traffic.

### Solution
Capture the `ref` parameter on landing, persist it through signup, and store it on the user's profile so you can see which users came from Product Hunt (or any other referral source).

### Changes

#### 1. Capture `ref` param alongside UTM params (AuthContext.tsx)
Extend the existing `useEffect` that already captures `utm_campaign` from the URL to also capture `ref`:

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const utmCampaign = params.get('utm_campaign');
  const refSource = params.get('ref');
  if (utmCampaign) localStorage.setItem('launchely_utm_campaign', utmCampaign);
  if (refSource) localStorage.setItem('launchely_ref_source', refSource);
}, []);
```

#### 2. Add `ref_source` column to profiles table
Store the referral source on the user's profile for admin reporting:

```sql
ALTER TABLE profiles ADD COLUMN ref_source text DEFAULT NULL;
```

#### 3. Save ref_source on signup (AuthContext.tsx)
In the `signUp` function, after successful registration, read the stored ref and save it to the profile:

```typescript
const storedRef = localStorage.getItem('launchely_ref_source');
if (storedRef) {
  await supabase.from('profiles')
    .update({ ref_source: storedRef })
    .eq('user_id', newUser.id);
  localStorage.removeItem('launchely_ref_source');
}
```

Also forward it to the SureContact webhook alongside `utm_campaign` for lead attribution.

#### 4. Forward to SureContact webhook (AuthContext.tsx)
Include `ref_source` in the existing SureContact sync call so the referral source is tagged on the contact record too.

### Files to modify
1. `src/contexts/AuthContext.tsx` -- capture `ref` param, save to profile on signup, forward to SureContact
2. Database migration -- add `ref_source` column to `profiles` table

### How to use
Simply share the link `https://launchely.com/?ref=producthunt` on Product Hunt. When someone clicks it, lands on the site, and eventually signs up, their profile will have `ref_source = "producthunt"`. You'll be able to query or filter users by referral source in the admin dashboard.

You can use any value: `?ref=twitter`, `?ref=friend`, `?ref=newsletter`, etc.

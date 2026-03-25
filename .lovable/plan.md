

## Add "Advanced" Tier ($49/month)

### What changes
A new **Advanced** subscription tier at $49/month is added. Advanced users get access to everything. **Pro users lose access to the Marketing section** — only Advanced (and Admin) users can access Campaigns, Social Planner, Ideas Bank, AI Studio, and Analytics.

### Step 1: Create Stripe Product & Price
Use the Stripe tool to create a new product "Launchely Advanced" with a $49/month recurring price. The resulting `price_id` is used everywhere below.

### Step 2: Update tier definitions
**`src/lib/subscriptionTiers.ts`**
- Add `advanced` price ID to `SUBSCRIPTION_PRICE_IDS`
- Expand `SubscriptionTier` type to `'free' | 'content_vault' | 'pro' | 'advanced' | 'admin'`
- Update `getTierFromPriceId` to map the new price
- Add `advanced: 'Advanced'` to display names

### Step 3: Update feature access gating
**`src/hooks/useFeatureAccess.ts`**
- Add marketing feature keys: `'campaigns'`, `'ideas_bank'`, `'ai_studio'`, `'marketing_analytics'`, `'social_planner'`
- Create `ADVANCED_ONLY_FEATURES` array with those marketing keys
- Update `hasAccess`:
  - `advanced` / `admin` → full access
  - `pro` → access to PRO_FEATURES but **not** ADVANCED_ONLY_FEATURES
  - `content_vault` → only content_vault feature
  - `free` → no gated features
- Update tier resolution to handle `'advanced'` from subscription response

### Step 4: Update sidebar gating
**`src/components/layout/ProjectSidebar.tsx`**
- Add `isAdvancedOnly?: boolean` flag to `SectionItem`
- Mark all Marketing section items with `isAdvancedOnly: true` instead of `isProOnly: true`
- Update `FlyoutNavItem` to check `isAdvancedOnly` — locked unless tier is `advanced` or `admin`
- Lock tooltip: "Advanced feature — Upgrade to access"
- Clicking a locked marketing item opens upgrade dialog targeting Advanced tier

### Step 5: Update UpgradeDialog
**`src/components/UpgradeDialog.tsx`**
- Accept optional `targetTier` prop (`'pro' | 'advanced'`)
- When `targetTier === 'advanced'`, show "Upgrade to Advanced" at $49/month with marketing features listed
- Default behavior (Pro upgrade) unchanged

### Step 6: Update Pricing page
**`src/pages/Pricing.tsx`**
- Add 4th plan card: "Advanced" at $49/month with all features included
- Move "popular" badge from Pro to Advanced
- Pro card: mark marketing features (Campaigns, Social Planner, AI Studio, Analytics, Ideas Bank) as `included: false`
- Update grid from `md:grid-cols-3` to `md:grid-cols-4`
- Update FAQ billing answer to mention Advanced ($49/month)

### Step 7: Update Checkout page
**`src/pages/Checkout.tsx`**
- Add `advanced` to `PLAN_CONFIG` with name "Advanced Plan", price 49, features list, headlines
- Update tier selection: `tier=advanced` → use advanced price ID
- Update `selectedTier` logic to handle three values: `content_vault`, `advanced`, `pro`

### Step 8: Update edge functions

**`supabase/functions/check-subscription/index.ts`**
- Add `advanced` price ID to `PRICE_IDS`
- Update `getTierFromPriceId` to return `'advanced'`
- Update tier priority: `advanced > pro > content_vault > free`

**`supabase/functions/create-payment-intent-only/index.ts`**
- Add `advanced` price ID to `PRICE_IDS`
- Handle `tier === 'advanced'` in selection logic
- Update original price to 49 for advanced in amount calc

**`supabase/functions/validate-coupon/index.ts`**
- Add `advanced` tier with `originalPrice = 49`

**`supabase/functions/create-subscription-intent/index.ts`**
- Accept `tier` param and select correct price ID (currently hardcoded to PRO_PRICE_ID)
- Add advanced price ID

**`supabase/functions/admin-manage-subscription/index.ts`**
- Add `advanced` price ID
- Add actions: `grant_advanced`, `upgrade_to_advanced`, `downgrade_from_advanced_to_pro`
- Update `findUserSubscription` tier priority

### Step 9: Update admin subscription toggle
**`src/components/admin/SubscriptionTierToggle.tsx`**
- Add `'advanced'` to `currentTier` type
- Add new actions: `grant_advanced`, `upgrade_to_advanced`, `downgrade_to_pro` (from advanced)
- Add dropdown menu items for all tier transitions involving advanced

### Files modified
- `src/lib/subscriptionTiers.ts`
- `src/hooks/useFeatureAccess.ts`
- `src/components/layout/ProjectSidebar.tsx`
- `src/components/UpgradeDialog.tsx`
- `src/pages/Pricing.tsx`
- `src/pages/Checkout.tsx`
- `src/components/admin/SubscriptionTierToggle.tsx`
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/create-payment-intent-only/index.ts`
- `supabase/functions/validate-coupon/index.ts`
- `supabase/functions/create-subscription-intent/index.ts`
- `supabase/functions/admin-manage-subscription/index.ts`


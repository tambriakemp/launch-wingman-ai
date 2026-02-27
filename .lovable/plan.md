

## Show "Paying with Card" vs "Coupon/Manual" in Admin Users

### Problem
All Pro users look the same in the admin panel. You can't tell who is actually being charged on a real credit card vs. who got access via a 100% coupon or manual upgrade. This makes it hard to know your real paying customer count and actual revenue.

### Solution
Add a "payment source" indicator to each user in the admin dashboard that shows one of:
- **Card on file** (green badge) -- user has an active subscription with actual charges (discount < 100%)
- **100% Coupon** (orange badge) -- user has an active subscription but pays $0 due to a full discount coupon
- **Manual/Granted** (blue badge) -- user was manually upgraded (subscription created via admin action, identifiable by metadata or $0 amount with no coupon)
- **Free** -- no active subscription

Also add a new filter option in the Users tab so you can quickly filter to see only "Card on file" users.

### Changes

#### 1. Update the `admin-list-users` edge function
For each user with an active Stripe subscription, fetch additional data:
- **`subscription.discount`** -- check if a coupon is applied and whether it's 100% off
- **`subscription.default_payment_method`** or check if the customer has a payment method on file
- **Net amount being charged** -- the actual amount after discounts

Return two new fields per user:
- `payment_source`: `'card'` | `'coupon_full'` | `'coupon_partial'` | `'manual'` | `'none'`
- `has_payment_method`: boolean (whether the Stripe customer has a card on file)
- `coupon_name`: string or null (the coupon name if one is applied)
- `net_amount_cents`: number (actual amount charged after discounts)

#### 2. Update the `User` interface in AdminDashboard.tsx
Add the new fields to the TypeScript interface.

#### 3. Add payment source badge to the user table and mobile cards
Display a small colored badge next to the subscription status:
- Green "Card" badge for real paying customers
- Orange "Coupon" badge for 100% coupon users
- Blue "Manual" badge for admin-granted access
- Show the coupon name on hover/tooltip

#### 4. Add a "Payment Type" filter
Add a new dropdown filter alongside the existing Status filter with options:
- All
- Card on File (real paying customers)
- Coupon (100% discount)
- Manual/Granted

#### 5. Update stats in the Overview tab
Add a "Paying Customers" stat card that only counts users with `payment_source === 'card'`, giving you the real number of paying customers at a glance.

### Technical Details

**Edge function changes (`admin-list-users/index.ts`):**
```typescript
// For each active subscription, check discount and payment method
const discount = subscription.discount;
const couponPercentOff = discount?.coupon?.percent_off;
const couponAmountOff = discount?.coupon?.amount_off;

const priceAmount = subscription.items.data[0]?.price?.unit_amount || 0;
let netAmount = priceAmount;
if (couponPercentOff === 100) {
  netAmount = 0;
} else if (couponPercentOff) {
  netAmount = Math.round(priceAmount * (1 - couponPercentOff / 100));
} else if (couponAmountOff) {
  netAmount = Math.max(0, priceAmount - couponAmountOff);
}

// Determine payment source
let paymentSource = 'none';
if (subscriptionStatus !== 'free') {
  if (netAmount === 0 && discount?.coupon) {
    paymentSource = 'coupon_full';
  } else if (netAmount === 0) {
    paymentSource = 'manual';
  } else {
    paymentSource = discount?.coupon ? 'coupon_partial' : 'card';
  }
}
```

**Files to modify:**
1. `supabase/functions/admin-list-users/index.ts` -- add discount/payment method detection
2. `src/pages/AdminDashboard.tsx` -- add `payment_source` to User interface, add badge rendering, add filter dropdown, update stats




## Checkout Flow Bug Analysis and Fixes

### Root Cause Found

The `create-subscription-intent` edge function has a critical architectural bug: it creates **both** a standalone PaymentIntent **and** a Subscription with `payment_behavior: 'default_incomplete'` in the same call. These two objects are completely disconnected in Stripe:

1. The PaymentIntent charges the card successfully ($25)
2. The Subscription creates its own invoice expecting a separate payment
3. That invoice never gets paid → subscription stays `incomplete` → eventually expires to `incomplete_expired`

**This is exactly what happened to bree33@cre8visions.com**: she was charged 3 times via standalone PaymentIntents, but no active subscription was ever created because the subscription's invoice was never fulfilled.

### Current vs Old Flow

The **current** checkout flow (in `Checkout.tsx`) uses the correct two-step approach:
1. `create-payment-intent-only` → just creates a PaymentIntent
2. `complete-subscription-checkout` → after payment succeeds, attaches payment method and creates a subscription properly

The **old** `create-subscription-intent` function is still deployed and could still be called. It should be removed or disabled.

### Cancellation Analysis

Cancellation is working correctly:
- **User-initiated**: `customer-portal` opens Stripe Billing Portal → user cancels → Stripe fires `customer.subscription.deleted` webhook → `stripe-webhook` logs `plan_cancelled` activity and notifies admins
- **Admin-initiated**: `admin-manage-subscription` with `action: 'cancel'` calls `stripe.subscriptions.cancel()` directly, logs to `admin_action_logs` and `user_activity`

No bugs found in the cancellation flow.

### Proposed Changes

#### 1. Delete `create-subscription-intent` edge function
Remove `supabase/functions/create-subscription-intent/index.ts` entirely. It is no longer used by the current checkout flow and creates broken subscription states when called.

#### 2. Add subscription validation to `complete-subscription-checkout`
Add a check at the end to verify the created subscription is actually `active` (not `incomplete`). If it's not active, log an error with details so failed completions are visible.

#### 3. Fix for bree33 specifically
This is a data issue, not a code fix. You should:
- Either refund the 3 standalone payments and have her re-subscribe through the current (fixed) checkout flow
- Or manually create an active subscription for her in Stripe via the admin panel's "Grant Pro" action

### Technical Detail

The disconnect happens at line 176-194 of `create-subscription-intent`:
```
// Creates subscription with payment_behavior: 'default_incomplete'
// This generates its own invoice that expects payment
// But the PaymentIntent created at line 152 is NOT linked to this invoice
```

The `complete-subscription-checkout` function (the current flow) avoids this by:
1. First attaching the payment method to the customer
2. Setting it as the default payment method
3. Creating the subscription WITHOUT `payment_behavior: 'default_incomplete'` — so Stripe auto-charges the default payment method


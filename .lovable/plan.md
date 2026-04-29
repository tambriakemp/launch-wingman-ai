# Ghost Recurring Charges — Root Cause & Fix

## What's actually happening to bree33@cre8visions.com

Stripe customer `cus_TqHAXATzr9eIqR` has been charged **$25 every month** (Sept, Oct, Nov 2026) via standalone PaymentIntents — but there is **no active subscription** in Stripe driving them. The only subscription on file (`sub_1StbnQF2gaEq7adwL2u9ufkr`) is `incomplete_expired` and only generated one invoice (`in_1StbnQF…`) in early September. The subsequent monthly charges are **not linked to any invoice or subscription**.

## Root cause

The bug is in our **two-step checkout flow** (`create-payment-intent-only` → `complete-subscription-checkout`).

```text
Step 1: create-payment-intent-only
   → Creates a standalone $25 PaymentIntent (NOT attached to any subscription)
   → User confirms card → PI succeeds → $25 charged immediately

Step 2: complete-subscription-checkout
   → Attaches PM to customer
   → Calls stripe.subscriptions.create(...)
   → If this call fails OR the subscription enters `incomplete_expired`,
     the $25 from Step 1 is NEVER REFUNDED and NEVER LINKED to a sub.
```

Bree's first PI succeeded but the subscription Stripe created went `incomplete_expired` (likely 3DS / SCA failure on the off-session attempt right after creation). The frontend caught the failure and showed her an error — but the $25 stayed charged.

**Then the smoking gun:** there are **two more identical $25 PaymentIntents** one month and two months later. The only way that happens with no subscription on file is:

1. **She retried checkout each month** — opening `/checkout`, completing card entry, Step 1 succeeded ($25 charged), Step 2 failed again. The UI never warned her she was about to be double/triple-charged because it has no idea past PIs exist for her email until *after* it tries to create the user/subscription.
2. Step 2's "user already exists" check throws an error *after* the money is taken, rather than blocking the PaymentIntent from being created in the first place.

So the design flaw is: **we charge the card before we validate that the subscription can actually be created.** Any failure in Step 2 = orphaned charge with no automatic refund.

## What to fix

### 1. Refund Bree's three orphan charges
Issue refunds for the 3 succeeded $25 PaymentIntents on `cus_TqHAXATzr9eIqR` (`pi_3TPvL0…`, `pi_3TEgZ0…`, and the September one). Reason: `requested_by_customer`.

### 2. Make `complete-subscription-checkout` self-healing
Wrap the subscription-creation block in try/catch. If subscription creation fails OR the resulting subscription is not `active`/`trialing` after retry, **automatically refund the PaymentIntent** before returning the error to the client. No more orphan charges, ever.

```text
try { create subscription }
catch / not-active:
   stripe.refunds.create({ payment_intent: paymentIntentId,
                            reason: "requested_by_customer",
                            metadata: { auto_refund: "subscription_creation_failed" } })
   throw error
```

### 3. Block double-charging on retry
In `create-payment-intent-only`, accept an optional `email` parameter and:
- Look up the Stripe customer by email
- Check for `succeeded` PaymentIntents in the last 35 days with metadata `type: "subscription_checkout"` and **no linked active subscription**
- If found → return `409 already_paid_pending_subscription` instead of creating a new PI

The frontend should surface this as: "We found a recent payment that didn't finish setting up your subscription. Contact support — do not pay again."

### 4. Move the "user already exists" check to BEFORE charging
`complete-subscription-checkout` currently checks `existingUser` *after* the PaymentIntent succeeded. Move that check into `create-payment-intent-only` (it already calls `check-email-exists` from the client, but server-side enforcement is missing). If email exists and `isUpgrade=false`, refuse to create the PI.

### 5. Audit other affected users
Run a one-off script to find every Stripe customer with succeeded PaymentIntents in the last 90 days where:
- `metadata.type = "subscription_checkout"` AND
- The customer has **no active/trialing subscription** AND
- The PI is **not linked to any invoice**

Output a CSV at `/mnt/documents/orphan-charges-audit.csv` with: email, customer_id, payment_intent_id, amount, created_at. Review with you before issuing bulk refunds.

### 6. Add a Stripe webhook safety net
Subscribe `stripe-webhook` to `customer.subscription.deleted` and `customer.subscription.updated` (status → `incomplete_expired`). When fired, look up the most recent succeeded PI for that customer in the past hour with `metadata.type=subscription_checkout` and auto-refund if it has no invoice link. (Belt-and-suspenders for case #2 above.)

## Technical details

**Files to modify:**
- `supabase/functions/complete-subscription-checkout/index.ts` — add refund-on-failure, return refund_id in error response
- `supabase/functions/create-payment-intent-only/index.ts` — add email param, server-side existing-user check, duplicate-recent-PI guard
- `supabase/functions/stripe-webhook/index.ts` — handle `customer.subscription.updated` → `incomplete_expired` status with auto-refund of the most recent unlinked PI
- `src/pages/Checkout.tsx` — pass `email` (and `isUpgrade`/`userId`) to `create-payment-intent-only`; handle new `409 already_paid_pending_subscription` response with a clear support-contact message

**One-off scripts (not deployed):**
- Audit script using Stripe API to find orphan PIs (writes CSV to `/mnt/documents/`)
- Refund script for Bree's 3 PIs (run once, with confirmation)

**No DB schema changes required.**

## Order of operations

1. Refund Bree's 3 charges immediately
2. Deploy fix to `complete-subscription-checkout` (auto-refund on subscription failure) — closes the bleed
3. Deploy fix to `create-payment-intent-only` (block duplicates + existing-user check) — closes the door
4. Run audit script, share CSV with you
5. Process bulk refunds for any other affected users you approve
6. Deploy webhook safety net

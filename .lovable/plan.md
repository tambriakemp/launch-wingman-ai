

## Fix Coupon Application on Checkout

### Problem 1: Case Sensitivity
The `validate-coupon` edge function sends the coupon code exactly as typed to `stripe.coupons.retrieve()`. Stripe coupon IDs are case-sensitive. The coupon exists as `stephanie` but the user typed `STEPHANIE`.

**Fix**: In `validate-coupon/index.ts`, convert the coupon code to lowercase before calling Stripe (since all your coupon IDs appear to be lowercase).

### Problem 2: Stale Closure on Payment Intent Recreation
In `Checkout.tsx`, `createPaymentIntent` uses `isCreatingIntent` state in its guard check. When called from `handleValidateCoupon`, the closure may have a stale `true` value, causing it to silently return without creating a new intent with the coupon applied.

**Fix**: Use a `useRef` to track `isCreatingIntent` so the guard always reads the latest value regardless of closure staleness.

### Changes

**`supabase/functions/validate-coupon/index.ts`**
- Convert `coupon_code` to lowercase before calling `stripe.coupons.retrieve()`

**`src/pages/Checkout.tsx`**
- Add `isCreatingIntentRef = useRef(false)` 
- Use the ref for the guard check in `createPaymentIntent` instead of the state variable
- Update ref alongside state changes


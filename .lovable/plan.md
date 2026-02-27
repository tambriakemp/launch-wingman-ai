

## Fix Signup Activity Tracking + Add Cancellation Events

### Problem 1: Signup tracking is broken for checkout users
Users who sign up through the checkout page (which is most new signups) are created server-side by the `complete-subscription-checkout` backend function using `admin.createUser()`. They never go through the frontend `signUp()` function, so the `trackActivity('signup')` call never fires. This is why no signup events have been recorded since January 21.

### Problem 2: No cancellation event in activity logs
When a user cancels their plan (via Stripe portal or admin action), the `stripe-webhook` function processes the `customer.subscription.deleted` event but only sends admin notifications and SureContact syncs -- it never writes a record to the `user_activity` table.

### Solution

#### 1. Track signup activity from `complete-subscription-checkout`
After successfully creating a new user account in the backend function, insert a `signup` event directly into the `user_activity` table using the service role client. This catches all checkout-based signups that bypass the frontend.

**File:** `supabase/functions/complete-subscription-checkout/index.ts`
- After the user is created (around line 101), insert into `user_activity`:
```typescript
await supabaseClient.from('user_activity').insert({
  user_id: supabaseUserId,
  event_type: 'signup',
  metadata: { source: 'checkout', is_upgrade: false },
});
```

#### 2. Track cancellation events from `stripe-webhook`
When the webhook receives a `customer.subscription.deleted` event, look up the user by email and insert a `plan_cancelled` event into `user_activity`.

**File:** `supabase/functions/stripe-webhook/index.ts`
- In the `customer.subscription.deleted` case (around line 260), after getting the customer email:
```typescript
// Find the Supabase user by email and log cancellation activity
if (customerEmail) {
  const { data: userData } = await supabaseClient.auth.admin.listUsers();
  const matchedUser = userData?.users?.find(u => u.email === customerEmail);
  if (matchedUser) {
    await supabaseClient.from('user_activity').insert({
      user_id: matchedUser.id,
      event_type: 'plan_cancelled',
      metadata: { subscription_id: subscription.id },
    });
  }
}
```

#### 3. Also track admin-initiated cancellations
When an admin cancels a user's subscription through the dashboard, the `admin-manage-subscription` function handles it. Add an activity log entry there as well for the target user.

**File:** `supabase/functions/admin-manage-subscription/index.ts`
- After a successful cancel action, insert a `plan_cancelled` event for the target user.

#### 4. Update the `AdminActionLogs` component to show the new event type
Add a label/badge mapping for `plan_cancelled` so it renders nicely in the Activity Logs tab.

**File:** `src/components/admin/AdminActionLogs.tsx`
- Add to the action config map:
```typescript
plan_cancelled: { label: 'Plan Cancelled', variant: 'destructive', category: 'subscriptions' },
```

### Files to modify
1. `supabase/functions/complete-subscription-checkout/index.ts` -- add signup activity insert
2. `supabase/functions/stripe-webhook/index.ts` -- add plan_cancelled activity insert on subscription deletion
3. `supabase/functions/admin-manage-subscription/index.ts` -- add plan_cancelled activity on admin cancel
4. `src/components/admin/AdminActionLogs.tsx` -- add plan_cancelled badge mapping


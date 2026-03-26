

## Add Card-on-File Indicator to Admin User Detail

### Overview
Show the last 4 digits and brand of the credit card on file in the Subscription section of the admin user detail page. This provides a quick visual indicator that a user is genuinely paying vs. manually upgraded.

### Changes

#### 1. Edge function: `supabase/functions/admin-list-users/index.ts`
After fetching subscriptions for a user, also retrieve the default payment method from the Stripe customer to get card details.

- After finding `stripeCustomerId`, fetch default payment method: `stripe.customers.retrieve(stripeCustomerId, { expand: ['default_source', 'invoice_settings.default_payment_method'] })`
- Extract `card_last4` and `card_brand` from the payment method or default source
- Add both fields to the returned user object (default `null`)

#### 2. Hook: `src/hooks/useAdminUsers.ts`
Add `card_last4: string | null` and `card_brand: string | null` to the `AdminUser` interface.

#### 3. UI: `src/pages/admin/AdminUserDetail.tsx`
In the Subscription card, after the Payment row and before the Amount row, add a new row:

```tsx
{user.card_last4 && (
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">Card on File</span>
    <span className="text-sm font-mono flex items-center gap-1.5">
      <CreditCard className="h-3.5 w-3.5" />
      {user.card_brand ? `${user.card_brand} ` : ''}•••• {user.card_last4}
    </span>
  </div>
)}
```

### Technical detail
The Stripe API exposes card info via `customer.invoice_settings.default_payment_method` (expanded) or `customer.default_source`. We expand both and check for card details. If no payment method is on file, the fields remain `null` and nothing renders in the UI.


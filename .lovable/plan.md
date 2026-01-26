

## Remove Legacy SureCart References

### Problem
The security scan is flagging the `profiles` table because it still contains three legacy SureCart columns that are no longer used:
- `surecart_customer_id`
- `surecart_subscription_id`  
- `surecart_subscription_status`

Additionally, the Admin Docs page still references SureCart integration details that are outdated since Stripe is now the exclusive payment system.

### Solution Overview

#### 1. Database Migration - Remove SureCart Columns

Create a migration to drop the unused columns from the `profiles` table:

```sql
-- Remove legacy SureCart columns from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS surecart_customer_id,
  DROP COLUMN IF EXISTS surecart_subscription_id,
  DROP COLUMN IF EXISTS surecart_subscription_status;
```

**Impact**: 
- All existing data in these columns is `NULL` (verified), so no data loss
- The auto-generated `types.ts` will automatically update after the migration
- This resolves the security finding about SureCart customer data exposure

---

#### 2. Update AdminDocs.tsx - Replace SureCart with Stripe

**File**: `src/pages/AdminDocs.tsx`

**Section: External Integrations (lines 1042-1060)**

Change from:
```text
"SureCart Integration" with surecart-checkout, surecart-portal, surecart-webhook
```

To:
```text
"Stripe Integration" with create-checkout, customer-portal, stripe-webhook
```

**Section: Environment Variables (lines 1122-1129)**

Change from:
```text
SURECART_API_KEY — SureCart API
SURECART_WEBHOOK_SECRET — Webhook verification
```

To:
```text
STRIPE_SECRET_KEY — Stripe API
STRIPE_WEBHOOK_SECRET — Webhook verification
```

---

### Files to Modify

| File | Action |
|------|--------|
| Database migration | Drop 3 SureCart columns from profiles |
| `src/pages/AdminDocs.tsx` | Update integration docs (Stripe replaces SureCart) |

### Expected Result
- Security scan will no longer flag SureCart-related columns
- Admin documentation accurately reflects current Stripe integration
- Types will auto-regenerate without SureCart fields


-- Remove legacy SureCart columns from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS surecart_customer_id,
  DROP COLUMN IF EXISTS surecart_subscription_id,
  DROP COLUMN IF EXISTS surecart_subscription_status;
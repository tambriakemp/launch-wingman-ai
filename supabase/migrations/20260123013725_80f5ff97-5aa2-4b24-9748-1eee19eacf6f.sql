-- Add checkout_base_url to payment_config for WordPress-hosted SureCart checkout
INSERT INTO payment_config (provider, key, value) 
VALUES ('surecart', 'checkout_base_url', 'https://store.launchely.com')
ON CONFLICT (provider, key) DO UPDATE SET value = EXCLUDED.value;
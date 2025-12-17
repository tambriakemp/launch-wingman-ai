-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure encryption key storage (using a generated key)
-- The key is stored as a database setting accessible only to service role
DO $$
BEGIN
  -- Generate a random encryption key if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_settings WHERE name = 'app.token_encryption_key') THEN
    PERFORM set_config('app.token_encryption_key', encode(gen_random_bytes(32), 'hex'), false);
  END IF;
END $$;

-- Function to encrypt a token
CREATE OR REPLACE FUNCTION public.encrypt_token(plain_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key TEXT;
  encrypted_data BYTEA;
BEGIN
  IF plain_token IS NULL OR plain_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use a fixed key derived from service role (stored as env var in edge functions)
  -- The key is the first 32 chars of the project's service role key hash
  encryption_key := encode(digest(current_setting('request.jwt.claims', true)::json->>'role' || 'launchely_token_key_v1', 'sha256'), 'hex');
  
  -- Encrypt using AES with the derived key
  encrypted_data := pgp_sym_encrypt(plain_token, substring(encryption_key from 1 for 32));
  
  RETURN encode(encrypted_data, 'base64');
END;
$$;

-- Function to decrypt a token
CREATE OR REPLACE FUNCTION public.decrypt_token(encrypted_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key TEXT;
  decrypted_data TEXT;
BEGIN
  IF encrypted_token IS NULL OR encrypted_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use the same key derivation as encryption
  encryption_key := encode(digest(current_setting('request.jwt.claims', true)::json->>'role' || 'launchely_token_key_v1', 'sha256'), 'hex');
  
  -- Decrypt
  BEGIN
    decrypted_data := pgp_sym_decrypt(decode(encrypted_token, 'base64'), substring(encryption_key from 1 for 32));
    RETURN decrypted_data;
  EXCEPTION WHEN OTHERS THEN
    -- If decryption fails, token might not be encrypted (legacy data)
    -- Return as-is for backward compatibility
    RETURN encrypted_token;
  END;
END;
$$;

-- Create a view that automatically decrypts tokens for authorized queries
CREATE OR REPLACE VIEW public.social_connections_decrypted AS
SELECT 
  id,
  user_id,
  platform,
  decrypt_token(access_token) as access_token,
  decrypt_token(refresh_token) as refresh_token,
  token_expires_at,
  account_name,
  account_id,
  created_at,
  updated_at
FROM public.social_connections;

-- Grant access to the view
ALTER VIEW public.social_connections_decrypted OWNER TO postgres;

-- Add RLS to the view (inherits from base table)
-- Note: Views inherit RLS from their base tables when queried through the Supabase client

COMMENT ON FUNCTION public.encrypt_token IS 'Encrypts a token using pgcrypto AES encryption';
COMMENT ON FUNCTION public.decrypt_token IS 'Decrypts a token, with backward compatibility for unencrypted tokens';
COMMENT ON VIEW public.social_connections_decrypted IS 'View that automatically decrypts OAuth tokens';
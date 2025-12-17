-- Drop and recreate encrypt_token with stable key derivation
CREATE OR REPLACE FUNCTION public.encrypt_token(plain_token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key TEXT;
  encrypted_data BYTEA;
BEGIN
  IF plain_token IS NULL OR plain_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use a stable key derived from database name (always available)
  encryption_key := encode(digest('launchely_' || current_database() || '_token_key_v1', 'sha256'), 'hex');
  
  -- Encrypt using AES with the derived key
  encrypted_data := pgp_sym_encrypt(plain_token, substring(encryption_key from 1 for 32));
  
  RETURN encode(encrypted_data, 'base64');
END;
$function$;

-- Drop and recreate decrypt_token with matching key derivation
CREATE OR REPLACE FUNCTION public.decrypt_token(encrypted_token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key TEXT;
  decrypted_data TEXT;
BEGIN
  IF encrypted_token IS NULL OR encrypted_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use the same stable key derivation as encryption
  encryption_key := encode(digest('launchely_' || current_database() || '_token_key_v1', 'sha256'), 'hex');
  
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
$function$;
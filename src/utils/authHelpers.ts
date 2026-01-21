import { supabase } from "@/integrations/supabase/client";

/**
 * Waits for a valid Supabase session to be established.
 * This is useful after signup when the session may take a moment to be ready.
 * @param maxWaitMs Maximum time to wait in milliseconds (default: 5000)
 * @param pollIntervalMs Interval between checks in milliseconds (default: 200)
 * @returns true if session is established, false if timeout reached
 */
export async function waitForSession(maxWaitMs = 5000, pollIntervalMs = 200): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  
  return false;
}

/**
 * Invokes the SureCart checkout with retry logic.
 * Handles transient auth errors by retrying with exponential backoff.
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param couponCode Optional coupon code to apply at checkout
 * @returns The checkout URL if successful, null otherwise
 */
export async function invokeCheckoutWithRetry(
  maxRetries = 3,
  couponCode?: string
): Promise<{ url: string | null; error: Error | null }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke("surecart-checkout", {
        body: couponCode ? { coupon_code: couponCode } : {}
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.url) {
        return { url: data.url, error: null };
      }
      
      throw new Error("No checkout URL returned");
    } catch (err) {
      lastError = err as Error;
      console.error(`Checkout attempt ${attempt} failed:`, err);
      
      // Don't retry on the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
  }
  
  return { url: null, error: lastError };
}

/**
 * Opens checkout URL, handling popup blockers
 * @param url The checkout URL to open
 * @returns true if opened successfully
 */
export function openCheckoutUrl(url: string): boolean {
  const checkoutWindow = window.open(url, "_blank");
  if (!checkoutWindow) {
    // Fallback if popup blocked - redirect current page
    window.location.href = url;
    return false;
  }
  return true;
}

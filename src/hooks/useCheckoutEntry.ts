import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp, openExternalUrl } from "@/lib/nativeBridge";

export type CheckoutTier = "content_vault" | "pro" | "advanced";

interface CheckoutEntryOptions {
  tier?: CheckoutTier;
  upgrade?: boolean;
  couponCode?: string;
}

const NATIVE_RETURN_BASE = "https://app.launchely.com";

// Tiers Stripe Hosted Checkout can serve from native today. Keep in sync with
// TIER_PRICE_MAP in supabase/functions/create-checkout/index.ts. Until other
// tiers are added there, native flows fall back to Pro.
const NATIVE_HOSTED_TIERS = new Set<CheckoutTier>(["pro"]);

export function useCheckoutEntry() {
  const navigate = useNavigate();

  const goToCheckout = useCallback(
    async (opts: CheckoutEntryOptions = {}) => {
      const { tier, upgrade, couponCode } = opts;

      if (!isNativeApp()) {
        const params = new URLSearchParams();
        if (tier) params.set("tier", tier);
        if (upgrade) params.set("upgrade", "true");
        const q = params.toString();
        navigate(`/checkout${q ? `?${q}` : ""}`);
        return;
      }

      const resolvedTier: CheckoutTier =
        tier && NATIVE_HOSTED_TIERS.has(tier) ? tier : "pro";

      try {
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: {
            tier: resolvedTier,
            coupon_code: couponCode,
            success_url: `${NATIVE_RETURN_BASE}/checkout/success`,
            cancel_url: `${NATIVE_RETURN_BASE}/checkout/canceled`,
          },
        });
        if (error) throw error;
        if (!data?.url) throw new Error("No checkout URL returned");
        await openExternalUrl(data.url);
      } catch (err) {
        console.error("[useCheckoutEntry] native checkout failed", err);
        toast.error("Could not start checkout. Please try again.");
      }
    },
    [navigate]
  );

  return { goToCheckout };
}

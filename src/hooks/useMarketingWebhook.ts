import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type MarketingEventType =
  | "user_signup"
  | "subscription_started"
  | "subscription_cancelled"
  | "manual_sync";

interface TriggerWebhookOptions {
  userId: string;
  eventType: MarketingEventType;
}

/**
 * Hook for triggering marketing webhook events.
 * Sends contact data to the marketing platform when specific events occur.
 */
export function useMarketingWebhook() {
  const triggerWebhook = useCallback(
    async ({ userId, eventType }: TriggerWebhookOptions): Promise<boolean> => {
      try {
        const { error } = await supabase.functions.invoke("marketing-webhook", {
          body: {
            action: "sync_user",
            user_id: userId,
            event_type: eventType,
          },
        });

        if (error) {
          console.error("[useMarketingWebhook] Error:", error);
          return false;
        }

        console.log(`[useMarketingWebhook] ${eventType} webhook sent for user ${userId}`);
        return true;
      } catch (err) {
        console.error("[useMarketingWebhook] Exception:", err);
        return false;
      }
    },
    []
  );

  return { triggerWebhook };
}

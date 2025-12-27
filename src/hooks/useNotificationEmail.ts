import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type NotificationEmailType =
  | "welcome"
  | "project_created"
  | "launch_completed"
  | "project_completed"
  | "relaunch_invitation"
  | "check_in_reminder"
  | "playbook_ready"
  | "paused_project_reminder";

interface SendEmailOptions {
  emailType: NotificationEmailType;
  userId?: string;
  data?: Record<string, any>;
}

/**
 * Hook for sending notification emails via edge function.
 * Respects user preferences and 1 email/week rate limit.
 */
export function useNotificationEmail() {
  const { user } = useAuth();

  const sendEmail = useCallback(
    async ({ emailType, userId, data }: SendEmailOptions): Promise<boolean> => {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        console.warn("[useNotificationEmail] No user ID provided");
        return false;
      }

      try {
        const { data: response, error } = await supabase.functions.invoke(
          "send-notification-email",
          {
            body: {
              email_type: emailType,
              user_id: targetUserId,
              data,
            },
          }
        );

        if (error) {
          console.error("[useNotificationEmail] Error:", error);
          return false;
        }

        if (response?.success) {
          console.log(`[useNotificationEmail] ${emailType} email sent`);
          return true;
        }

        if (response?.reason === "rate_limited") {
          console.log(`[useNotificationEmail] ${emailType} rate limited`);
        } else if (response?.reason === "blocked_by_preferences") {
          console.log(`[useNotificationEmail] ${emailType} blocked by preferences`);
        }

        return false;
      } catch (err) {
        console.error("[useNotificationEmail] Exception:", err);
        return false;
      }
    },
    [user?.id]
  );

  return { sendEmail };
}

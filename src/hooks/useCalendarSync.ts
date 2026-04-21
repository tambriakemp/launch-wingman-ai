import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const useCalendarSync = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: hasConnections = false } = useQuery({
    queryKey: ["calendar-connections-exist", userId],
    queryFn: async () => {
      if (!userId) return false;
      const { count } = await supabase
        .from("calendar_connections")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count || 0) > 0;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });

  const syncTask = useCallback(
    async (taskId: string, action: "create" | "update" | "delete") => {
      if (!hasConnections || !userId) return;

      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) return;

        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        // Fire and forget — don't block the UI
        fetch(
          `https://${projectId}.supabase.co/functions/v1/sync-calendar-event`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.session.access_token}`,
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ task_id: taskId, action }),
          }
        ).catch((err) => console.error("Calendar sync error:", err));
      } catch (err) {
        console.error("Calendar sync error:", err);
      }
    },
    [hasConnections, userId]
  );

  return { syncTask, hasConnections };
};

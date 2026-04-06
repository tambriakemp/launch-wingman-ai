import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const useCalendarSync = () => {
  const { user } = useAuth();

  // Check if user has any calendar connections
  const { data: hasConnections = false } = useQuery({
    queryKey: ["calendar-connections-exist", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { count } = await supabase
        .from("calendar_connections")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      return (count || 0) > 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const syncTask = useCallback(
    async (taskId: string, action: "create" | "update" | "delete") => {
      if (!hasConnections || !user) return;

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
    [hasConnections, user]
  );

  return { syncTask, hasConnections };
};

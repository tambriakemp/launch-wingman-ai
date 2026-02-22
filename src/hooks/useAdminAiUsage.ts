import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, subDays } from "date-fns";

interface AdminAiUsageStats {
  totalCalls: number;
  totalCallsLast7Days: number;
  byFunction: Record<string, number>;
  topUsers: { userId: string; email: string; name: string; callCount: number }[];
}

export function useAdminAiUsage() {
  const { session } = useAuth();
  
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const last7Days = subDays(now, 7).toISOString();

  return useQuery({
    queryKey: ["admin-ai-usage", monthStart],
    queryFn: async (): Promise<AdminAiUsageStats> => {
      // Fetch all usage logs for the month
      const { data: allLogs, error: logsError } = await supabase
        .from("ai_usage_logs")
        .select("user_id, function_name, created_at")
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd);

      if (logsError) throw logsError;

      const totalCalls = allLogs?.length || 0;
      
      // Count last 7 days
      const totalCallsLast7Days = allLogs?.filter(
        (log) => new Date(log.created_at) >= new Date(last7Days)
      ).length || 0;

      // Group by function
      const byFunction: Record<string, number> = {};
      allLogs?.forEach((log) => {
        byFunction[log.function_name] = (byFunction[log.function_name] || 0) + 1;
      });

      // Group by user for top users
      const userCounts: Record<string, number> = {};
      allLogs?.forEach((log) => {
        userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
      });

      // Get top 10 users by call count
      const topUserIds = Object.entries(userCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([userId]) => userId);

      // Fetch user details for top users
      let topUsers: AdminAiUsageStats["topUsers"] = [];
      if (topUserIds.length > 0 && session?.access_token) {
        try {
          const { data: usersData } = await supabase.functions.invoke('admin-list-users');
          
          const usersMap = new Map(
            usersData?.users?.map((u: any) => [
              u.id, 
              { email: u.email, name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "—" }
            ]) || []
          );

          topUsers = topUserIds.map((userId) => ({
            userId,
            email: (usersMap.get(userId) as any)?.email || userId,
            name: (usersMap.get(userId) as any)?.name || "—",
            callCount: userCounts[userId],
          }));
        } catch (e) {
          // Fallback if user fetch fails
          topUsers = topUserIds.map((userId) => ({
            userId,
            email: userId,
            name: "—",
            callCount: userCounts[userId],
          }));
        }
      }

      return { totalCalls, totalCallsLast7Days, byFunction, topUsers };
    },
    enabled: !!session?.access_token,
  });
}

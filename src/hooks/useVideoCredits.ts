import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth } from "date-fns";

interface VideoCreditsData {
  balance: number;
  monthlyFreeRemaining: number;
  monthlyFreeTotal: number;
  videoGenerationsThisMonth: number;
}

export function useVideoCredits() {
  const { user } = useAuth();

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  return useQuery({
    queryKey: ["video-credits", user?.id, monthStart],
    queryFn: async (): Promise<VideoCreditsData> => {
      // Fetch credits balance
      const { data: credits } = await supabase
        .from("video_credits")
        .select("balance, monthly_free_remaining")
        .maybeSingle();

      // Count video generations this month
      const { count } = await supabase
        .from("video_credit_transactions")
        .select("*", { count: "exact", head: true })
        .eq("type", "used")
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd);

      return {
        balance: credits?.balance ?? 0,
        monthlyFreeRemaining: credits?.monthly_free_remaining ?? 10,
        monthlyFreeTotal: 10,
        videoGenerationsThisMonth: count ?? 0,
      };
    },
    enabled: !!user,
  });
}

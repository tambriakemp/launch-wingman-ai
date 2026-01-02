import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth } from "date-fns";

interface AiUsageStats {
  totalCalls: number;
  byFunction: Record<string, number>;
  byDay: { date: string; count: number }[];
}

export function useAiUsage() {
  const { user } = useAuth();
  
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  return useQuery({
    queryKey: ["ai-usage", user?.id, monthStart],
    queryFn: async (): Promise<AiUsageStats> => {
      const { data, error } = await supabase
        .from("ai_usage_logs")
        .select("function_name, created_at")
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const totalCalls = data?.length || 0;
      
      // Group by function
      const byFunction: Record<string, number> = {};
      data?.forEach((log) => {
        byFunction[log.function_name] = (byFunction[log.function_name] || 0) + 1;
      });

      // Group by day
      const byDayMap: Record<string, number> = {};
      data?.forEach((log) => {
        const date = log.created_at.split("T")[0];
        byDayMap[date] = (byDayMap[date] || 0) + 1;
      });
      const byDay = Object.entries(byDayMap).map(([date, count]) => ({ date, count }));

      return { totalCalls, byFunction, byDay };
    },
    enabled: !!user,
  });
}

// Function name to friendly label mapping
export const FUNCTION_LABELS: Record<string, string> = {
  "generate-content-draft": "Content Drafts",
  "generate-talking-points": "Talking Points",
  "generate-timeline-suggestions": "Timeline Suggestions",
  "generate-sales-copy": "Sales Copy",
  "generate-offer-ideas": "Offer Ideas",
  "generate-offer-transformation": "Transformations",
  "generate-audience-refinements": "Audience Refinements",
  "generate-sub-audiences": "Sub-Audiences",
  "generate-problem-statement": "Problem Statements",
  "generate-dream-outcome": "Dream Outcomes",
  "generate-pain-symptoms": "Pain Symptoms",
  "generate-likelihood-elements": "Likelihood Elements",
  "generate-time-effort": "Time & Effort",
  "task-ai-assist": "Task Assist",
  "get-stuck-help": "Stuck Help",
};

export function getFunctionLabel(functionName: string): string {
  return FUNCTION_LABELS[functionName] || functionName;
}

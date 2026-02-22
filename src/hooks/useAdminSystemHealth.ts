import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FunctionHealth {
  name: string;
  calls: number;
  errors: number;
  avgLatencyMs: number;
}

interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  metrics: {
    totalCalls24h: number;
    errorRate24h: number;
    avgLatencyMs: number;
    failedEmails24h: number;
    totalEmails24h: number;
  };
  database: {
    healthy: boolean;
    latencyMs: number;
  };
  functions: FunctionHealth[];
  lastChecked: string;
}

export function useAdminSystemHealth() {
  const { session } = useAuth();

  return useQuery<SystemHealthData>({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('No session');
      }

      const { data, error } = await supabase.functions.invoke('admin-system-health');

      if (error) throw error;
      return data;
    },
    enabled: !!session?.access_token,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 4 * 60 * 1000, // Consider stale after 4 minutes
  });
}

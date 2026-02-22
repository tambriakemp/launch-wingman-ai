import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AtRiskUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  lastActive: string | null;
  daysInactive: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  subscriptionStatus: 'pro' | 'free';
  subscriptionAmount: number;
}

interface ChurnRiskData {
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    totalAtRiskPro: number;
    potentialMrrAtRisk: number;
  };
  atRiskUsers: AtRiskUser[];
}

export function useAdminChurnRisk() {
  const { session } = useAuth();

  return useQuery<ChurnRiskData>({
    queryKey: ['admin-churn-risk'],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('No session');
      }

      const { data, error } = await supabase.functions.invoke('admin-churn-risk');

      if (error) throw error;
      return data;
    },
    enabled: !!session?.access_token,
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
    staleTime: 9 * 60 * 1000, // Consider stale after 9 minutes
  });
}

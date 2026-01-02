import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProjectStats {
  total: number;
  byPhase: {
    clarity: number;
    strategy: number;
    build: number;
    launch: number;
    maintain: number;
  };
  byState: {
    draft: number;
    in_progress: number;
    launched: number;
    completed: number;
    paused: number;
    archived: number;
  };
  avgCompletionPercent: number;
}

export interface ContentStats {
  scheduledPosts: number;
  contentDrafts: number;
  contentIdeas: number;
  socialConnections: number;
}

export interface EngagementStats {
  avgProjectsPerUser: number;
  usersWithProjects: number;
  usersWithMultipleProjects: number;
  projectsPerUser: Record<string, number>;
}

export interface OfferStats {
  totalOffers: number;
  avgOfferPrice: number;
}

export interface AdminPlatformStats {
  projectStats: ProjectStats;
  contentStats: ContentStats;
  engagementStats: EngagementStats;
  offerStats: OfferStats;
  generatedAt: string;
}

export function useAdminPlatformStats() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: async (): Promise<AdminPlatformStats> => {
      if (!session?.access_token) {
        throw new Error('No session available');
      }

      const { data, error } = await supabase.functions.invoke('admin-platform-stats', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

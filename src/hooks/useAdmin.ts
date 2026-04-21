import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AdminRole = 'admin' | 'manager' | null;

const ADMIN_CACHE_KEY = 'launchely_admin_status_cache';
const ADMIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface AdminCache {
  userId: string;
  isAdmin: boolean;
  isManager: boolean;
  role: AdminRole;
  timestamp: number;
}

const getCachedAdminStatus = (userId: string): AdminCache | null => {
  try {
    const cached = localStorage.getItem(ADMIN_CACHE_KEY);
    if (!cached) return null;
    
    const data: AdminCache = JSON.parse(cached);
    const isValid = data.userId === userId && 
                    (Date.now() - data.timestamp) < ADMIN_CACHE_TTL;
    
    return isValid ? data : null;
  } catch {
    return null;
  }
};

interface AdminStatusResult {
  isAdmin: boolean;
  isManager: boolean;
  role: AdminRole;
}

const EMPTY_ADMIN_STATUS: AdminStatusResult = {
  isAdmin: false,
  isManager: false,
  role: null,
};

const cacheAdminStatus = (userId: string, isAdmin: boolean, isManager: boolean, role: AdminRole) => {
  try {
    const data: AdminCache = {
      userId,
      isAdmin,
      isManager,
      role,
      timestamp: Date.now()
    };
    localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
};

export const useAdmin = () => {
  const { session, loading: authLoading } = useAuth();
  const cached = session?.user ? getCachedAdminStatus(session.user.id) : null;

  const fetchAdminStatus = useCallback(async (): Promise<AdminStatusResult> => {
    if (!session?.user) {
      return EMPTY_ADMIN_STATUS;
    }

    const userId = session.user.id;

    try {
      let freshToken = session.access_token;
      const expiresAtMs = (session.expires_at ?? 0) * 1000;
      const isExpiringSoon = expiresAtMs > 0 && expiresAtMs < Date.now() + 60_000;

      if (!freshToken || isExpiringSoon) {
        console.log('[useAdmin] Token expiring soon, refreshing...');
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshed?.session) {
          console.warn('[useAdmin] Session recovery failed');
          return cached ?? EMPTY_ADMIN_STATUS;
        }
        freshToken = refreshed.session.access_token;
      }

      if (!freshToken) {
        console.warn('[useAdmin] No fresh token available');
        return cached ?? EMPTY_ADMIN_STATUS;
      }

      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        try {
          const { data, error } = await supabase.functions.invoke('check-admin', {
            headers: {
              Authorization: `Bearer ${freshToken}`,
            },
          });

          if (error) {
            console.error(`[useAdmin] Attempt ${attempts + 1} error:`, error);
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(r => setTimeout(r, 500 * attempts));
              continue;
            }
          } else {
            console.log('[useAdmin] Admin check result:', data);
            const adminStatus = !!data?.isAdmin;
            const managerStatus = !!data?.isManager;
            const roleValue = (data?.role || null) as AdminRole;

            cacheAdminStatus(userId, adminStatus, managerStatus, roleValue);

            return {
              isAdmin: adminStatus,
              isManager: managerStatus,
              role: roleValue,
            };
          }
        } catch (err) {
          console.error(`[useAdmin] Attempt ${attempts + 1} exception:`, err);
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 500 * attempts));
          }
        }
      }

      return cached ?? EMPTY_ADMIN_STATUS;
    } catch (error) {
      console.error('[useAdmin] Error checking admin status:', error);
      return cached ?? EMPTY_ADMIN_STATUS;
    }
  }, [cached, session]);

  const query = useQuery({
    queryKey: ['admin-status', session?.user?.id],
    queryFn: fetchAdminStatus,
    enabled: !authLoading && !!session?.user,
    staleTime: ADMIN_CACHE_TTL,
    gcTime: ADMIN_CACHE_TTL * 2,
    initialData: cached
      ? {
          isAdmin: cached.isAdmin,
          isManager: cached.isManager,
          role: cached.role,
        }
      : undefined,
    refetchOnWindowFocus: false,
  });

  const adminState = session?.user ? (query.data ?? EMPTY_ADMIN_STATUS) : EMPTY_ADMIN_STATUS;
  const loading = authLoading || (!!session?.user && query.isLoading);
  const hasAdminAccess = adminState.isAdmin || adminState.isManager;

  const checkAdmin = useCallback(async () => {
    if (!session?.user) return EMPTY_ADMIN_STATUS;
    const result = await query.refetch();
    return result.data ?? EMPTY_ADMIN_STATUS;
  }, [query, session?.user]);

  return {
    isAdmin: adminState.isAdmin,
    isManager: adminState.isManager,
    hasAdminAccess,
    role: adminState.role,
    loading,
    checkAdmin,
  };
};

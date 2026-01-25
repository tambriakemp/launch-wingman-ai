import { useState, useEffect, useCallback } from 'react';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [role, setRole] = useState<AdminRole>(null);
  const [loading, setLoading] = useState(true);

  // Has access to admin dashboard (admin or manager)
  const hasAdminAccess = isAdmin || isManager;

  const checkAdmin = useCallback(async () => {
    if (!session?.user) {
      setIsAdmin(false);
      setIsManager(false);
      setRole(null);
      setLoading(false);
      return;
    }

    const userId = session.user.id;

    // Check cache first for quick recovery from session hiccups
    const cached = getCachedAdminStatus(userId);
    if (cached) {
      console.log('[useAdmin] Using cached admin status');
      setIsAdmin(cached.isAdmin);
      setIsManager(cached.isManager);
      setRole(cached.role);
      // Continue to verify in background, but don't show loading
    }

    try {
      // Step 1: Ensure we have a valid, non-expired session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        console.warn('[useAdmin] Session invalid, attempting refresh...');
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshed?.session) {
          console.error('[useAdmin] Session recovery failed');
          // If we have cached data, keep using it
          if (!cached) {
            setIsAdmin(false);
            setIsManager(false);
            setRole(null);
          }
          setLoading(false);
          return;
        }
      }

      // Step 2: Get fresh token
      const currentSession = sessionData?.session || (await supabase.auth.getSession()).data.session;
      let freshToken = currentSession?.access_token;
      const expiresAtMs = (currentSession?.expires_at ?? 0) * 1000;
      const isExpiringSoon = expiresAtMs > 0 && expiresAtMs < Date.now() + 60_000;

      if (!freshToken || isExpiringSoon) {
        console.log('[useAdmin] Token expiring soon, refreshing...');
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('[useAdmin] Failed to refresh session:', refreshError);
        }
        freshToken = refreshed?.session?.access_token ?? freshToken;
      }

      if (!freshToken) {
        console.warn('[useAdmin] No fresh token available');
        if (!cached) {
          setIsAdmin(false);
          setIsManager(false);
          setRole(null);
        }
        setLoading(false);
        return;
      }

      // Step 3: Call check-admin with retry logic
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
            const adminStatus = data?.isAdmin || false;
            const managerStatus = data?.isManager || false;
            const roleValue = data?.role || null;
            
            setIsAdmin(adminStatus);
            setIsManager(managerStatus);
            setRole(roleValue);
            
            // Cache successful result
            cacheAdminStatus(userId, adminStatus, managerStatus, roleValue);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error(`[useAdmin] Attempt ${attempts + 1} exception:`, err);
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 500 * attempts));
          }
        }
      }

      // All attempts failed - use cache if available, otherwise reset
      if (!cached) {
        setIsAdmin(false);
        setIsManager(false);
        setRole(null);
      }
    } catch (error) {
      console.error('[useAdmin] Error checking admin status:', error);
      if (!cached) {
        setIsAdmin(false);
        setIsManager(false);
        setRole(null);
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    // Don't check admin status until auth is done loading
    if (authLoading) {
      setLoading(true);
      return;
    }

    checkAdmin();
  }, [authLoading, checkAdmin]);

  return { isAdmin, isManager, hasAdminAccess, role, loading, checkAdmin };
};

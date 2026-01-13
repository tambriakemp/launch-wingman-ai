import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AdminRole = 'admin' | 'manager' | null;

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

    try {
      // Ensure we have a non-expired access token (auto-refresh may pause in inactive tabs)
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('[useAdmin] Failed to get session:', sessionError);
      }

      let freshToken = sessionData?.session?.access_token;
      const expiresAtMs = (sessionData?.session?.expires_at ?? 0) * 1000;
      const isExpiringSoon = expiresAtMs > 0 && expiresAtMs < Date.now() + 60_000;

      if (!freshToken || isExpiringSoon) {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('[useAdmin] Failed to refresh session:', refreshError);
        }
        freshToken = refreshed?.session?.access_token ?? freshToken;
      }

      if (!freshToken) {
        console.warn('[useAdmin] No fresh token available');
        setIsAdmin(false);
        setIsManager(false);
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-admin', {
        headers: {
          Authorization: `Bearer ${freshToken}`,
        },
      });

      if (error) {
        console.error('[useAdmin] Error checking admin status:', error);
        setIsAdmin(false);
        setIsManager(false);
        setRole(null);
      } else {
        console.log('[useAdmin] Admin check result:', data);
        setIsAdmin(data?.isAdmin || false);
        setIsManager(data?.isManager || false);
        setRole(data?.role || null);
      }
    } catch (error) {
      console.error('[useAdmin] Error checking admin status:', error);
      setIsAdmin(false);
      setIsManager(false);
      setRole(null);
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

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
      // Get fresh session to ensure we have the latest token
      const { data: sessionData } = await supabase.auth.getSession();
      const freshToken = sessionData?.session?.access_token;
      
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

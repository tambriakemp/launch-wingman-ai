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
    if (!session?.access_token) {
      setIsAdmin(false);
      setIsManager(false);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-admin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setIsManager(false);
        setRole(null);
      } else {
        setIsAdmin(data?.isAdmin || false);
        setIsManager(data?.isManager || false);
        setRole(data?.role || null);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setIsManager(false);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

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

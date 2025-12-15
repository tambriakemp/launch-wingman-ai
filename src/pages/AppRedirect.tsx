import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface LastProjectInfo {
  id: string;
  name: string;
}

const AppRedirect = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const redirectToProject = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      // Check localStorage for last project
      const stored = localStorage.getItem('lastProjectInfo');
      if (stored) {
        try {
          const lastProject: LastProjectInfo = JSON.parse(stored);
          if (lastProject.id) {
            navigate(`/projects/${lastProject.id}/offer`, { replace: true });
            return;
          }
        } catch (e) {
          // Invalid JSON, continue to fetch
        }
      }

      // No stored project - fetch most recent project
      try {
        const { data: projects, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (projects && projects.length > 0) {
          // Save to localStorage for next time
          localStorage.setItem('lastProjectInfo', JSON.stringify({
            id: projects[0].id,
            name: projects[0].name
          }));
          navigate(`/projects/${projects[0].id}/offer`, { replace: true });
        } else {
          // No projects exist - go to projects list to create one
          navigate('/projects', { replace: true });
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        navigate('/projects', { replace: true });
      } finally {
        setChecking(false);
      }
    };

    redirectToProject();
  }, [user, authLoading, navigate]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
};

export default AppRedirect;

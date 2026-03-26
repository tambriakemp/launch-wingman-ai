import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Rocket } from 'lucide-react';
import { toast } from 'sonner';

interface LastProjectInfo {
  id: string;
  name: string;
}

const AppRedirect = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(searchParams.get('new') === '1');
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Routing logic

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading) return;

      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking onboarding status:', error);
        }

        if (!profile?.onboarding_completed_at) {
          navigate('/onboarding', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const redirectToProject = async () => {
      if (authLoading || checkingOnboarding) return;
      if (searchParams.get('new') === '1') { setChecking(false); return; }
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      const stored = localStorage.getItem('lastProjectInfo');
      if (stored) {
        try {
          const lastProject: LastProjectInfo = JSON.parse(stored);
          if (lastProject.id) {
            const { data: existingProject } = await supabase
              .from('projects')
              .select('id')
              .eq('id', lastProject.id)
              .eq('user_id', user.id)
              .maybeSingle();

            if (existingProject) {
              navigate(`/projects/${lastProject.id}/dashboard`, { replace: true });
              return;
            } else {
              localStorage.removeItem('lastProjectInfo');
            }
          }
        } catch (e) {
          // Invalid JSON, continue to fetch
        }
      }

      try {
        const { data: projects, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (projects && projects.length > 0) {
          localStorage.setItem('lastProjectInfo', JSON.stringify({
            id: projects[0].id,
            name: projects[0].name
          }));
          navigate(`/projects/${projects[0].id}/dashboard`, { replace: true });
        } else {
          setShowCreateProject(true);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setShowCreateProject(true);
      } finally {
        setChecking(false);
      }
    };

    redirectToProject();
  }, [user, authLoading, navigate, checkingOnboarding]);

  // Project creation

  const handleCreateProject = async () => {
    if (!projectName.trim() || !user) return;

    setIsCreating(true);
    try {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          name: projectName.trim(),
          user_id: user.id,
          status: 'active',
          project_type: 'launch',
          selected_funnel_type: null,
        })
        .select('id, name')
        .single();

      if (error) throw error;

      localStorage.setItem('lastProjectInfo', JSON.stringify({
        id: newProject.id,
        name: newProject.name,
      }));

      toast.success('Project created!');

      supabase.functions.invoke('send-notification-email', {
        body: {
          email_type: 'project_created',
          user_id: user.id,
          data: { projectId: newProject.id, projectName: newProject.name },
        },
      }).catch((err) => console.error('Failed to send project created email:', err));

      navigate(`/projects/${newProject.id}/dashboard`, { replace: true });
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  // Loading state

  if (authLoading || checking || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Project creation form

  if (showCreateProject) {
    return (
      <ProjectLayout>
        <div className="flex-1 flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="text-center max-w-md space-y-6"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Rocket className="w-7 h-7 text-primary" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Let's set up your launch</h1>
                <p className="text-muted-foreground">
                  Give your project a name — this is just for you.
                </p>
              </div>

              <div className="space-y-3 w-full">
                <Input
                  placeholder="e.g., Q1 Launch, Coaching Program"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && projectName.trim() && handleCreateProject()}
                  autoFocus
                />
                <Button
                  className="w-full"
                  onClick={handleCreateProject}
                  disabled={!projectName.trim() || isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Create Project
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </ProjectLayout>
    );
  }

  return null;
};

export default AppRedirect;

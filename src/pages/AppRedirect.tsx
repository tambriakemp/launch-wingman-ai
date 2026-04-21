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
  const [showCreateProject, setShowCreateProject] = useState(searchParams.get('new') === '1');
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const redirect = async () => {
      if (authLoading) return;
      if (!user) { navigate('/auth', { replace: true }); return; }
      if (searchParams.get('new') === '1') { setChecking(false); return; }

      // Check localStorage cache first for instant redirect
      const stored = localStorage.getItem('lastProjectInfo');
      if (stored) {
        try {
          const lastProject: LastProjectInfo = JSON.parse(stored);
          if (lastProject.id) {
            // Fire both validation + onboarding check in parallel
            const [{ data: existingProject }, { data: profile }] = await Promise.all([
              supabase.from('projects').select('id').eq('id', lastProject.id).eq('user_id', user.id).maybeSingle(),
              supabase.from('profiles').select('onboarding_completed_at').eq('user_id', user.id).maybeSingle(),
            ]);

            if (!profile?.onboarding_completed_at) { navigate('/onboarding', { replace: true }); return; }
            if (existingProject) { navigate(`/projects/${lastProject.id}/dashboard`, { replace: true }); return; }
            localStorage.removeItem('lastProjectInfo');
          }
        } catch (e) { /* Invalid JSON */ }
      }

      // No cache — run onboarding + project fetch in parallel
      try {
        const [{ data: profile }, { data: projects }] = await Promise.all([
          supabase.from('profiles').select('onboarding_completed_at').eq('user_id', user.id).maybeSingle(),
          supabase.from('projects').select('id, name').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(1),
        ]);

        if (!profile?.onboarding_completed_at) { navigate('/onboarding', { replace: true }); return; }

        if (projects && projects.length > 0) {
          localStorage.setItem('lastProjectInfo', JSON.stringify({ id: projects[0].id, name: projects[0].name }));
          navigate(`/projects/${projects[0].id}/dashboard`, { replace: true });
        } else {
          setShowCreateProject(true);
        }
      } catch (error) {
        console.error('Error in redirect:', error);
        setShowCreateProject(true);
      } finally {
        setChecking(false);
      }
    };
    redirect();
  }, [user, authLoading, navigate, searchParams]);

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
        })
        .select('id, name')
        .single();
      if (error) throw error;

      localStorage.setItem('lastProjectInfo', JSON.stringify({ id: newProject.id, name: newProject.name }));
      toast.success('Project created!');

      supabase.functions.invoke('send-notification-email', {
        body: { email_type: 'project_created', user_id: user.id, data: { projectId: newProject.id, projectName: newProject.name } },
      }).catch((err) => console.error('Failed to send project created email:', err));

      navigate(`/projects/${newProject.id}/dashboard`, { replace: true });
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showCreateProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md space-y-6">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Rocket className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Welcome to Launchely!</h1>
            <p className="text-muted-foreground">Let's set up your first launch project to get started.</p>
          </div>
          <div className="space-y-3 w-full">
            <Input
              placeholder="e.g., Q1 Launch, Coaching Program"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              autoFocus
            />
            <Button className="w-full" onClick={handleCreateProject} disabled={!projectName.trim() || isCreating}>
              {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AppRedirect;

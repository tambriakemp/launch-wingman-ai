import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ProjectLayout } from '@/components/layout/ProjectLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, Rocket, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LastProjectInfo {
  id: string;
  name: string;
}

const AppRedirect = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
          project_type: 'launch'
        })
        .select('id, name')
        .single();

      if (error) throw error;

      localStorage.setItem('lastProjectInfo', JSON.stringify({
        id: newProject.id,
        name: newProject.name
      }));

      toast.success('Project created!');
      
      supabase.functions.invoke("send-notification-email", {
        body: {
          email_type: "project_created",
          user_id: user.id,
          data: { projectId: newProject.id, projectName: newProject.name },
        },
      }).catch((err) => console.error("Failed to send project created email:", err));
      
      navigate(`/projects/${newProject.id}/dashboard`, { replace: true });
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || checking || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showCreateProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-6 h-6 text-accent-foreground" />
            </div>
            <CardTitle className="text-2xl">Welcome to Launchely!</CardTitle>
            <CardDescription>
              Let's create your first project to get started.
            </CardDescription>
            <a
              href={`https://docs.lovable.dev`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors inline-flex items-center gap-1 mt-2"
            >
              <HelpCircle className="w-3 h-3" />
              How Launchely works
            </a>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="e.g., Q1 Launch, Coaching Program"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                autoFocus
              />
            </div>
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default AppRedirect;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LastProjectInfo {
  id: string;
  name: string;
}

const AppRedirect = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
            // Verify project still exists
            const { data: existingProject } = await supabase
              .from('projects')
              .select('id')
              .eq('id', lastProject.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (existingProject) {
              navigate(`/projects/${lastProject.id}/offer`, { replace: true });
              return;
            } else {
              // Clear invalid localStorage
              localStorage.removeItem('lastProjectInfo');
            }
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
          // No projects exist - show create project UI
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
  }, [user, authLoading, navigate]);

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

      // Save to localStorage
      localStorage.setItem('lastProjectInfo', JSON.stringify({
        id: newProject.id,
        name: newProject.name
      }));

      toast.success('Project created!');
      navigate(`/projects/${newProject.id}/offer`, { replace: true });
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Welcome to Coach Hub!</CardTitle>
            <CardDescription>
              Let's create your first project to get started.
            </CardDescription>
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

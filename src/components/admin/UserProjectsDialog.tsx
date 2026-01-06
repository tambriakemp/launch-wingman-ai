import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FolderKanban, RefreshCw, Calendar, Layers } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  status: string;
  project_type: string;
  created_at: string;
  active_phase: string | null;
  selected_funnel_type: string | null;
  offer_count: number;
  content_count: number;
}

interface UserProjectsDialogProps {
  userId: string;
  userEmail: string;
  userName: string;
  accessToken: string;
}

export function UserProjectsDialog({
  userId,
  userEmail,
  userName,
  accessToken,
}: UserProjectsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-get-user-projects', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: { user_id: userId },
      });

      if (error) throw error;
      setProjects(data?.projects || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="text-emerald-600 border-emerald-600/50">Active</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-blue-600 border-blue-600/50">Completed</Badge>;
      case 'launched':
        return <Badge variant="outline" className="text-purple-600 border-purple-600/50">Launched</Badge>;
      case 'paused':
        return <Badge variant="outline" className="text-amber-600 border-amber-600/50">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="View user's projects"
        >
          <FolderKanban className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Projects for {userName || userEmail}
          </DialogTitle>
          <DialogDescription>
            View all projects created by this user
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No projects found for this user
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        {project.selected_funnel_type && (
                          <p className="text-xs text-muted-foreground capitalize">
                            {project.selected_funnel_type.replace(/_/g, ' ')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell className="capitalize">{project.project_type}</TableCell>
                    <TableCell className="capitalize">
                      {project.active_phase?.replace(/_/g, ' ') || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {project.offer_count} offers
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {project.content_count} content
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(project.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

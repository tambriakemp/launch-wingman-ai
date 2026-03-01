import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, FolderOpen, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { format } from 'date-fns';

interface SavedProject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  character_preview_url: string | null;
  config: any;
  storyboard: any;
}

interface SavedProjectsGridProps {
  onLoad: (projectId: string) => void;
}

const SavedProjectsGrid: React.FC<SavedProjectsGridProps> = ({ onLoad }) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<SavedProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_studio_projects')
        .select('id, name, created_at, updated_at, character_preview_url, config, storyboard')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (e: any) {
      console.error('Failed to fetch saved projects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('ai_studio_projects')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
      toast({ title: "Project deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (projects.length === 0) return null;

  return (
    <section className="mb-10">
      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <FolderOpen className="h-5 w-5 text-primary" />
        Saved Projects
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => {
          const sceneCount = (project.storyboard as any)?.steps?.length || 0;
          return (
            <Card
              key={project.id}
              className="group cursor-pointer hover:border-primary/50 transition-all overflow-hidden"
              onClick={() => onLoad(project.id)}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {project.character_preview_url ? (
                  <img
                    src={project.character_preview_url}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              {/* Info */}
              <div className="p-4 flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h4 className="font-semibold text-foreground truncate text-sm">{project.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sceneCount} scenes · {format(new Date(project.updated_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Delete Project"
        description={`This will permanently delete "${deleteTarget?.name}". All saved images and settings will be lost.`}
        isDeleting={isDeleting}
      />
    </section>
  );
};

export default SavedProjectsGrid;

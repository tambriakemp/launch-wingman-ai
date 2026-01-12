import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Video, Search, Save, Trash2, ExternalLink, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { TASK_TEMPLATES } from '@/data/taskTemplates';
import { PHASE_LABELS, Phase } from '@/types/tasks';

interface VideoInstruction {
  id: string;
  task_id: string;
  video_url: string;
  updated_at: string | null;
}

const AdminVideoInstructions = () => {
  const [videoInstructions, setVideoInstructions] = useState<VideoInstruction[]>([]);
  const [editingUrls, setEditingUrls] = useState<Record<string, string>>({});
  const [savingTasks, setSavingTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');

  // Get unique phases from task templates
  const phases = useMemo(() => {
    const uniquePhases = [...new Set(TASK_TEMPLATES.map(t => t.phase))];
    return uniquePhases;
  }, []);

  // Filter and organize tasks
  const filteredTasks = useMemo(() => {
    return TASK_TEMPLATES.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPhase = phaseFilter === 'all' || task.phase === phaseFilter;
      return matchesSearch && matchesPhase;
    });
  }, [searchQuery, phaseFilter]);

  // Group tasks by phase
  const tasksByPhase = useMemo(() => {
    const grouped: Record<string, typeof TASK_TEMPLATES> = {};
    filteredTasks.forEach(task => {
      if (!grouped[task.phase]) {
        grouped[task.phase] = [];
      }
      grouped[task.phase].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  // Stats
  const stats = useMemo(() => {
    const totalTasks = TASK_TEMPLATES.length;
    const tasksWithVideo = videoInstructions.length;
    const tasksWithoutVideo = totalTasks - tasksWithVideo;
    return { totalTasks, tasksWithVideo, tasksWithoutVideo };
  }, [videoInstructions]);

  useEffect(() => {
    fetchVideoInstructions();
  }, []);

  const fetchVideoInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from('task_video_instructions')
        .select('*');

      if (error) throw error;
      setVideoInstructions(data || []);
      
      // Initialize editing URLs
      const urls: Record<string, string> = {};
      data?.forEach(vi => {
        urls[vi.task_id] = vi.video_url;
      });
      setEditingUrls(urls);
    } catch (error) {
      console.error('Error fetching video instructions:', error);
      toast.error('Failed to load video instructions');
    } finally {
      setLoading(false);
    }
  };

  const getVideoUrl = (taskId: string) => {
    return editingUrls[taskId] || '';
  };

  const hasVideo = (taskId: string) => {
    return videoInstructions.some(vi => vi.task_id === taskId);
  };

  const handleUrlChange = (taskId: string, url: string) => {
    setEditingUrls(prev => ({ ...prev, [taskId]: url }));
  };

  const handleSave = async (taskId: string) => {
    const url = editingUrls[taskId]?.trim();
    if (!url) {
      toast.error('Please enter a video URL');
      return;
    }

    setSavingTasks(prev => new Set(prev).add(taskId));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('task_video_instructions')
        .upsert({
          task_id: taskId,
          video_url: url,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'task_id',
        });

      if (error) throw error;

      // Update local state
      setVideoInstructions(prev => {
        const existing = prev.find(vi => vi.task_id === taskId);
        if (existing) {
          return prev.map(vi => vi.task_id === taskId ? { ...vi, video_url: url } : vi);
        }
        return [...prev, { id: '', task_id: taskId, video_url: url, updated_at: new Date().toISOString() }];
      });

      toast.success('Video URL saved');
    } catch (error) {
      console.error('Error saving video URL:', error);
      toast.error('Failed to save video URL');
    } finally {
      setSavingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleDelete = async (taskId: string) => {
    setSavingTasks(prev => new Set(prev).add(taskId));

    try {
      const { error } = await supabase
        .from('task_video_instructions')
        .delete()
        .eq('task_id', taskId);

      if (error) throw error;

      setVideoInstructions(prev => prev.filter(vi => vi.task_id !== taskId));
      setEditingUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[taskId];
        return newUrls;
      });

      toast.success('Video URL removed');
    } catch (error) {
      console.error('Error deleting video URL:', error);
      toast.error('Failed to remove video URL');
    } finally {
      setSavingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Admin
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Video className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Video Instructions Manager</h1>
          </div>
          <p className="text-muted-foreground">
            Add video instruction URLs for each task. Videos will appear on the task detail pages for all users.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Video className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalTasks}</p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.tasksWithVideo}</p>
                  <p className="text-sm text-muted-foreground">With Video</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <XCircle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.tasksWithoutVideo}</p>
                  <p className="text-sm text-muted-foreground">Without Video</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={phaseFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPhaseFilter('all')}
                >
                  All Phases
                </Button>
                {phases.map(phase => (
                  <Button
                    key={phase}
                    variant={phaseFilter === phase ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPhaseFilter(phase)}
                  >
                    {PHASE_LABELS[phase as Phase]}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Phase */}
        {Object.entries(tasksByPhase).map(([phase, tasks]) => (
          <Card key={phase} className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {PHASE_LABELS[phase as Phase]}
                    <Badge variant="secondary">{tasks.length} tasks</Badge>
                  </CardTitle>
                  <CardDescription>
                    {tasks.filter(t => hasVideo(t.taskId)).length} of {tasks.length} tasks have videos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map(task => {
                  const isSaving = savingTasks.has(task.taskId);
                  const taskHasVideo = hasVideo(task.taskId);
                  const currentUrl = getVideoUrl(task.taskId);
                  const originalUrl = videoInstructions.find(vi => vi.task_id === task.taskId)?.video_url || '';
                  const hasChanges = currentUrl !== originalUrl;

                  return (
                    <div
                      key={task.taskId}
                      className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{task.title}</h3>
                          {taskHasVideo && (
                            <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-500/10">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Has Video
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{task.taskId}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          placeholder="Enter video URL (YouTube, Vimeo, Loom...)"
                          value={currentUrl}
                          onChange={(e) => handleUrlChange(task.taskId, e.target.value)}
                          className="flex-1"
                          disabled={isSaving}
                        />
                        {currentUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="shrink-0"
                          >
                            <a href={currentUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleSave(task.taskId)}
                          disabled={isSaving || !currentUrl?.trim() || (!hasChanges && taskHasVideo)}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                        {taskHasVideo && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(task.taskId)}
                            disabled={isSaving}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tasks match your search.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminVideoInstructions;

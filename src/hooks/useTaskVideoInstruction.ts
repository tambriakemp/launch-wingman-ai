import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useTaskVideoInstruction(taskId: string) {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchVideoUrl = useCallback(async () => {
    if (!taskId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('task_video_instructions')
        .select('video_url')
        .eq('task_id', taskId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching video instruction:', error);
      } else if (data) {
        setVideoUrl(data.video_url);
      }
    } catch (error) {
      console.error('Error fetching video instruction:', error);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchVideoUrl();
  }, [fetchVideoUrl]);

  const saveVideoUrl = async (url: string) => {
    if (!taskId) return false;

    setIsSaving(true);
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

      if (error) {
        console.error('Error saving video instruction:', error);
        toast({
          title: 'Error',
          description: 'Failed to save video URL. Please try again.',
          variant: 'destructive',
        });
        return false;
      }

      setVideoUrl(url);
      toast({
        title: 'Video saved',
        description: 'Video instruction URL has been saved successfully.',
      });
      return true;
    } catch (error) {
      console.error('Error saving video instruction:', error);
      toast({
        title: 'Error',
        description: 'Failed to save video URL. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteVideoUrl = async () => {
    if (!taskId) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('task_video_instructions')
        .delete()
        .eq('task_id', taskId);

      if (error) {
        console.error('Error deleting video instruction:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete video URL. Please try again.',
          variant: 'destructive',
        });
        return false;
      }

      setVideoUrl('');
      toast({
        title: 'Video removed',
        description: 'Video instruction has been removed.',
      });
      return true;
    } catch (error) {
      console.error('Error deleting video instruction:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete video URL. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    videoUrl,
    isLoading,
    isSaving,
    saveVideoUrl,
    deleteVideoUrl,
    refetch: fetchVideoUrl,
  };
}

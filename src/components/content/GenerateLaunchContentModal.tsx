import { useState } from "react";
import { format, addDays } from "date-fns";
import { CalendarIcon, Sparkles, Loader2, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { mapTemplatesToDates, TIMELINE_TEMPLATES } from "@/data/timelineTemplates";
import { trackTimelineSuggestion, trackContentGeneration } from "@/lib/analytics";

interface GenerateLaunchContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const MODEL_META: Record<string, { label: string; emoji: string; duration: string; description: string }> = {
  pre_launch: {
    label: 'Pre-Launch + Launch',
    emoji: '🚀',
    duration: '5 weeks',
    description: '4 weeks of warm-up content + launch week. ~35 posts scheduled.',
  },
  story_arc: {
    label: '30-Day Story Arc',
    emoji: '🎬',
    duration: '30 days',
    description: 'Origin → How → Build → Momentum. ~20 episodes across 4 arcs.',
  },
  evergreen: {
    label: 'Evergreen Authority',
    emoji: '🌱',
    duration: '30 days',
    description: 'Teaching, tools, behind-the-scenes, and soft promo. ~17 posts.',
  },
  episode_series: {
    label: 'Episode Series',
    emoji: '📺',
    duration: '4 weeks',
    description: 'A recurring numbered series. ~16 episodes, every 2 days.',
  },
};

function build30DayArcDates(startDate: Date) {
  const slots = [
    { day: 1, type: 'origin', phase: 'arc-origin' },
    { day: 3, type: 'story', phase: 'arc-origin' },
    { day: 5, type: 'lesson', phase: 'arc-origin' },
    { day: 7, type: 'behind-the-scenes', phase: 'arc-origin' },
    { day: 9, type: 'lesson', phase: 'arc-how' },
    { day: 11, type: 'behind-the-scenes', phase: 'arc-how' },
    { day: 13, type: 'lesson', phase: 'arc-how' },
    { day: 14, type: 'story', phase: 'arc-how' },
    { day: 16, type: 'win', phase: 'arc-build' },
    { day: 18, type: 'win', phase: 'arc-build' },
    { day: 20, type: 'lesson', phase: 'arc-build' },
    { day: 21, type: 'behind-the-scenes', phase: 'arc-build' },
    { day: 23, type: 'story', phase: 'arc-momentum' },
    { day: 25, type: 'engagement', phase: 'arc-momentum' },
    { day: 27, type: 'engagement', phase: 'arc-momentum' },
    { day: 29, type: 'offer', phase: 'arc-momentum' },
    { day: 30, type: 'story', phase: 'arc-momentum' },
  ];
  return slots.map(s => {
    const d = addDays(startDate, s.day - 1);
    d.setHours(9, 0, 0, 0);
    return { ...s, scheduledAt: d };
  });
}

function buildEvergreenDates(startDate: Date) {
  const slots = [
    { day: 1, type: 'lesson', phase: 'evergreen' },
    { day: 3, type: 'behind-the-scenes', phase: 'evergreen' },
    { day: 5, type: 'lesson', phase: 'evergreen' },
    { day: 7, type: 'story', phase: 'evergreen' },
    { day: 9, type: 'engagement', phase: 'evergreen' },
    { day: 11, type: 'lesson', phase: 'evergreen' },
    { day: 13, type: 'win', phase: 'evergreen' },
    { day: 14, type: 'offer', phase: 'evergreen' },
    { day: 16, type: 'lesson', phase: 'evergreen' },
    { day: 18, type: 'story', phase: 'evergreen' },
    { day: 20, type: 'engagement', phase: 'evergreen' },
    { day: 21, type: 'lesson', phase: 'evergreen' },
    { day: 23, type: 'lesson', phase: 'evergreen' },
    { day: 25, type: 'behind-the-scenes', phase: 'evergreen' },
    { day: 27, type: 'story', phase: 'evergreen' },
    { day: 28, type: 'offer', phase: 'evergreen' },
    { day: 30, type: 'story', phase: 'evergreen' },
  ];
  return slots.map(s => {
    const d = addDays(startDate, s.day - 1);
    d.setHours(9, 0, 0, 0);
    return { ...s, scheduledAt: d };
  });
}

function buildEpisodeDates(startDate: Date) {
  return Array.from({ length: 16 }, (_, i) => {
    const types = ['origin', 'lesson', 'behind-the-scenes', 'win'];
    const week = Math.ceil((i + 1) / 4);
    const d = addDays(startDate, i * 2);
    d.setHours(9, 0, 0, 0);
    return { day: i * 2 + 1, type: types[i % 4], phase: `series-week-${week}`, scheduledAt: d };
  });
}

export const GenerateLaunchContentModal = ({
  open,
  onOpenChange,
  projectId,
}: GenerateLaunchContentModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Fetch content strategy from completed tasks
  const { data: contentStrategy } = useQuery({
    queryKey: ['content-strategy-tasks', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_tasks')
        .select('task_id, input_data')
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .in('task_id', ['content_choose_model', 'content_define_themes']);
      const modelTask = data?.find(t => t.task_id === 'content_choose_model');
      const themesTask = data?.find(t => t.task_id === 'content_define_themes');
      return {
        model: (modelTask?.input_data as any)?.selected || null,
        pillars: [
          (themesTask?.input_data as any)?.pillar_1,
          (themesTask?.input_data as any)?.pillar_2,
          (themesTask?.input_data as any)?.pillar_3,
          (themesTask?.input_data as any)?.pillar_4,
          (themesTask?.input_data as any)?.pillar_5,
        ].filter(Boolean) as string[],
        voice: (themesTask?.input_data as any)?.content_voice || null,
        hasThemes: !!themesTask,
        hasModel: !!modelTask,
      };
    },
    enabled: open,
  });

  // Check planning context
  const { data: planningDone } = useQuery({
    queryKey: ['planning-context-check', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_tasks')
        .select('task_id')
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .in('task_id', ['planning_define_audience', 'messaging_core_message']);
      return (data?.length || 0) > 0;
    },
    enabled: open,
  });

  const { data: existingContent = [] } = useQuery({
    queryKey: ['content-planner-launch', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('content_planner')
        .select('id, status')
        .eq('project_id', projectId);
      return data || [];
    },
    enabled: open,
  });

  const nonCompletedCount = existingContent.filter(
    c => c.status !== 'completed' && c.status !== 'posted'
  ).length;

  const activeModel = contentStrategy?.model || 'pre_launch';
  const modelInfo = MODEL_META[activeModel] || MODEL_META.pre_launch;

  const handleGenerate = async () => {
    if (!user || !selectedDate) return;
    setIsGenerating(true);

    try {
      if (nonCompletedCount > 0) {
        const ids = existingContent
          .filter(c => c.status !== 'completed' && c.status !== 'posted')
          .map(c => c.id);
        await supabase.from('content_planner').delete().in('id', ids);
      }

      if (activeModel === 'pre_launch') {
        const templatesWithDates = mapTemplatesToDates(selectedDate);
        setProgress({ current: 0, total: templatesWithDates.length });
        let count = 0;
        for (let i = 0; i < templatesWithDates.length; i += 3) {
          const batch = templatesWithDates.slice(i, i + 3);
          await Promise.all(batch.map(async item => {
            try {
              const { data } = await supabase.functions.invoke('generate-timeline-suggestions', {
                body: { projectId, template: item.template },
              });
              const scheduledAt = new Date(item.date);
              scheduledAt.setHours(item.template.time_of_day === 'morning' ? 9 : 18, 0, 0, 0);
              await supabase.from('content_planner').insert({
                project_id: projectId, user_id: user.id,
                phase: item.template.phase, day_number: item.template.day_number,
                time_of_day: item.template.time_of_day,
                content_type: data?.content_type || item.template.content_type,
                title: data?.title || item.template.title_template,
                description: data?.description || item.template.description_template,
                status: 'draft', scheduled_at: scheduledAt.toISOString(),
              });
              count++;
              trackTimelineSuggestion('generate');
              trackContentGeneration(data?.content_type || 'general');
            } catch (e) { console.error(e); }
          }));
          setProgress(p => ({ ...p, current: Math.min(i + 3, templatesWithDates.length) }));
        }
        toast.success(`Generated ${count} content ideas!`);
      } else {
        let slots: any[] = [];
        if (activeModel === 'story_arc') slots = build30DayArcDates(selectedDate);
        if (activeModel === 'evergreen') slots = buildEvergreenDates(selectedDate);
        if (activeModel === 'episode_series') slots = buildEpisodeDates(selectedDate);
        setProgress({ current: 0, total: slots.length });
        let count = 0;
        for (let i = 0; i < slots.length; i += 3) {
          const batch = slots.slice(i, i + 3);
          await Promise.all(batch.map(async (slot) => {
            try {
              const template = {
                phase: slot.phase, day_number: slot.day, time_of_day: 'morning',
                template_type: slot.type,
                content_type: slot.type === 'offer' ? 'offer' : slot.type === 'engagement' ? 'stories' : 'general',
                title_template: `${modelInfo.label} — ${slot.type} post, day ${slot.day}`,
                description_template: '',
              };
              const { data } = await supabase.functions.invoke('generate-timeline-suggestions', {
                body: { projectId, template, contentModel: activeModel },
              });
              await supabase.from('content_planner').insert({
                project_id: projectId, user_id: user.id,
                phase: slot.phase, day_number: slot.day, time_of_day: 'morning',
                content_type: data?.content_type || 'general',
                title: data?.title || template.title_template,
                description: data?.description || '',
                status: 'draft', scheduled_at: slot.scheduledAt.toISOString(),
              });
              count++;
            } catch (e) { console.error(e); }
          }));
          setProgress(p => ({ ...p, current: Math.min(i + 3, slots.length) }));
        }
        toast.success(`Generated ${count} content ideas for your ${modelInfo.label}!`);
      }

      queryClient.invalidateQueries({ queryKey: ['content-planner', projectId] });
      onOpenChange(false);
      setSelectedDate(undefined);
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSelectedDate(undefined); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Content Plan
          </DialogTitle>
          <DialogDescription>
            AI will generate personalized content ideas based on your launch tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">

          {/* Planning context nudge */}
          {!planningDone && (
            <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-muted-foreground leading-relaxed">
                Works best after completing your Launch tasks. Finishing your audience, problem, and messaging tasks gives the AI your specific language — making generated content sound like you, not generic copy.
              </p>
            </div>
          )}

          {/* Active content model display */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Your content model</p>
            {contentStrategy?.hasModel ? (
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="text-2xl">{modelInfo.emoji}</span>
                <div>
                  <p className="text-sm font-medium">{modelInfo.label}</p>
                  <p className="text-xs text-muted-foreground">{modelInfo.description}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                <p className="text-muted-foreground leading-relaxed">
                  No content model selected yet. Complete the <strong>Choose your content model</strong> task in your Content phase first. Defaulting to Pre-Launch + Launch.
                </p>
              </div>
            )}
          </div>

          {/* Pillars summary */}
          {contentStrategy?.pillars && contentStrategy.pillars.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Content pillars detected</p>
              <div className="flex flex-wrap gap-1.5">
                {contentStrategy.pillars.map((p, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <CheckCircle2 className="h-3 w-3" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Date picker */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              When do you want to start posting?
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Pick a start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => date < new Date()} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Timeline preview */}
          {selectedDate && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-0.5">
              <p className="text-sm font-medium">Timeline</p>
              <p className="text-xs text-muted-foreground">
                {format(selectedDate, 'MMM d')} → {format(addDays(selectedDate, activeModel === 'pre_launch' ? 31 : 29), 'MMM d, yyyy')}
                {' '}· {modelInfo.duration}
              </p>
            </div>
          )}

          {/* Existing content warning */}
          {nonCompletedCount > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
              <p className="text-muted-foreground leading-relaxed">
                {nonCompletedCount} draft/planned items will be replaced. Posted content is kept.
              </p>
            </div>
          )}

          {/* Progress */}
          {isGenerating && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Generating ideas...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isGenerating}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={!selectedDate || isGenerating}>
            {isGenerating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />Generate {modelInfo.label}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

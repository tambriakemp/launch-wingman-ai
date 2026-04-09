import React from 'react';
import { VideoShot } from './types';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Film } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MultiShotEditorProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  shots: VideoShot[];
  onShotsChange: (shots: VideoShot[]) => void;
  defaultPrompt?: string;
}

const DURATION_OPTIONS = Array.from({ length: 15 }, (_, i) => String(i + 1));

export const MultiShotEditor: React.FC<MultiShotEditorProps> = ({
  enabled, onToggle, shots, onShotsChange, defaultPrompt,
}) => {
  const addShot = () => {
    onShotsChange([...shots, { prompt: '', duration: '5' }]);
  };

  const removeShot = (index: number) => {
    if (shots.length <= 1) return;
    onShotsChange(shots.filter((_, i) => i !== index));
  };

  const updateShot = (index: number, field: keyof VideoShot, value: string) => {
    const updated = [...shots];
    updated[index] = { ...updated[index], [field]: value };
    onShotsChange(updated);
  };

  const totalDuration = shots.reduce((sum, s) => sum + parseInt(s.duration || '5', 10), 0);

  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-card/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase text-foreground">Multi-Shot</span>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {enabled && (
        <>
          <p className="text-[10px] text-muted-foreground">
            Split the video into multiple shots with different prompts and durations. Total: {totalDuration}s
          </p>

          <div className="space-y-2">
            {shots.map((shot, idx) => (
              <div key={idx} className="bg-muted/50 border border-border rounded-md p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">
                      Shot {idx + 1}
                    </span>
                    <Select value={shot.duration} onValueChange={(v) => updateShot(idx, 'duration', v)}>
                      <SelectTrigger className="h-6 w-16 text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map(d => (
                          <SelectItem key={d} value={d}>{d}s</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {shots.length > 1 && (
                    <button onClick={() => removeShot(idx)} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <AutoResizeTextarea
                  value={shot.prompt}
                  onChange={(e) => updateShot(idx, 'prompt', e.target.value)}
                  placeholder="Describe the shot: who is where and what is happening..."
                  className="text-xs bg-background min-h-[60px]"
                  minRows={2}
                />
              </div>
            ))}
          </div>

          <Button size="sm" variant="outline" onClick={addShot} className="w-full text-xs">
            <Plus className="h-3 w-3 mr-1" /> Shot
          </Button>
        </>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Film, Clock, RotateCcw, Scissors } from 'lucide-react';

interface ClipInfo {
  index: number;
  imageUrl?: string;
  stepName: string;
}

export type TrimDirection = 'start' | 'end';

interface ReelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clips: ClipInfo[];
  onGenerate: (clipDurations: (number | null)[], trimDirection: TrimDirection) => void;
  isGenerating: boolean;
}

const PRESETS = [
  { label: '7s', seconds: 7 },
  { label: '10s', seconds: 10 },
  { label: '15s', seconds: 15 },
  { label: '30s', seconds: 30 },
  { label: 'Full Length', seconds: null },
];

const ReelSettingsDialog: React.FC<ReelSettingsDialogProps> = ({
  open, onOpenChange, clips, onGenerate, isGenerating
}) => {
  const [mode, setMode] = useState<'target' | 'perclip'>('target');
  const [targetSeconds, setTargetSeconds] = useState<number | null>(null);
  const [trimDirection, setTrimDirection] = useState<TrimDirection>('end');
  const [perClipDurations, setPerClipDurations] = useState<(number | null)[]>(
    () => clips.map(() => null)
  );

  React.useEffect(() => {
    setPerClipDurations(clips.map(() => null));
  }, [clips.length]);

  const perClipFromTarget = useMemo(() => {
    if (targetSeconds === null || clips.length === 0) return null;
    return Math.round((targetSeconds / clips.length) * 10) / 10;
  }, [targetSeconds, clips.length]);

  const handleGenerate = () => {
    if (mode === 'target') {
      if (targetSeconds === null) {
        onGenerate(clips.map(() => null), trimDirection);
      } else {
        const each = targetSeconds / clips.length;
        onGenerate(clips.map(() => each), trimDirection);
      }
    } else {
      onGenerate(perClipDurations, trimDirection);
    }
  };

  const handlePerClipChange = (idx: number, value: string) => {
    const num = parseFloat(value);
    setPerClipDurations(prev => {
      const next = [...prev];
      next[idx] = isNaN(num) || num <= 0 ? null : num;
      return next;
    });
  };

  const totalEstimate = useMemo(() => {
    if (mode === 'target') {
      return targetSeconds ? `~${targetSeconds}s` : 'Full length';
    }
    const hasCustom = perClipDurations.some(d => d !== null);
    if (!hasCustom) return 'Full length';
    const sum = perClipDurations.reduce((acc, d) => acc + (d || 0), 0);
    const unsetCount = perClipDurations.filter(d => d === null).length;
    return unsetCount > 0 ? `~${sum.toFixed(1)}s + ${unsetCount} full clips` : `~${sum.toFixed(1)}s`;
  }, [mode, targetSeconds, perClipDurations]);

  const showTrimOption = mode === 'target' ? targetSeconds !== null : perClipDurations.some(d => d !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            Reel Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'target' | 'perclip')}>
          <TabsList className="w-full">
            <TabsTrigger value="target" className="flex-1">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              Target Duration
            </TabsTrigger>
            <TabsTrigger value="perclip" className="flex-1">
              Per-Clip Control
            </TabsTrigger>
          </TabsList>

          <TabsContent value="target" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Choose a total reel length. Time will be divided evenly across {clips.length} clips.
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  size="sm"
                  variant={targetSeconds === p.seconds ? 'default' : 'outline'}
                  onClick={() => setTargetSeconds(p.seconds)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            {perClipFromTarget !== null && (
              <p className="text-xs text-muted-foreground">
                Each clip will play for ~{perClipFromTarget}s
              </p>
            )}
          </TabsContent>

          <TabsContent value="perclip" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Set duration per clip. Leave empty for full length.
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPerClipDurations(clips.map(() => null))}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
            <div className="grid gap-2 max-h-[40vh] overflow-y-auto pr-1">
              {clips.map((clip, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-muted/40 rounded-lg p-2">
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
                    {clip.imageUrl ? (
                      <img src={clip.imageUrl} alt={clip.stepName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium truncate block">
                      Scene {idx + 1}: {clip.stepName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Input
                      type="number"
                      min={0.5}
                      step={0.5}
                      placeholder="Full"
                      value={perClipDurations[idx] ?? ''}
                      onChange={(e) => handlePerClipChange(idx, e.target.value)}
                      className="w-20 h-8 text-xs text-center"
                    />
                    <span className="text-xs text-muted-foreground">sec</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {showTrimOption && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Scissors className="h-3.5 w-3.5" />
              Trim from
            </div>
            <div className="flex gap-[2px] p-[3px] bg-muted rounded-lg border border-border/50">
              <button
                onClick={() => setTrimDirection('end')}
                className={`flex-1 py-2 text-[11.5px] font-medium rounded-md transition-all duration-150 ${
                  trimDirection === 'end' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground/70'
                }`}
              >
                End (keep start)
              </button>
              <button
                onClick={() => setTrimDirection('start')}
                className={`flex-1 py-2 text-[11.5px] font-medium rounded-md transition-all duration-150 ${
                  trimDirection === 'start' ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground/70'
                }`}
              >
                Start (keep end)
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/60">
              {trimDirection === 'end'
                ? 'Plays from the beginning and cuts early — keeps the opening action.'
                : 'Skips the beginning and plays the final portion — keeps the best movement.'}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Estimated: {totalEstimate}
          </span>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Generate Reel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReelSettingsDialog;

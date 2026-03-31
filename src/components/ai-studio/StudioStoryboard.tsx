import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppConfig, VlogStep, VlogStoryboard, GeneratedMedia, QueueItem } from './types';
import SceneCard from './SceneCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, ImageIcon, Video, RefreshCw, ZapIcon, Trash2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface StudioStoryboardProps {
  config: AppConfig;
  storyboard: VlogStoryboard;
  generatedMedia: Record<number, GeneratedMedia>;
  onToggleSelect: (index: number) => void;
  onToggleLock: (index: number, type: 'character' | 'outfit' | 'environment') => void;
  onEnlarge: (index: number) => void;
  onAddToQueue: (items: QueueItem[]) => void;
  onUpdatePrompt: (index: number, newPrompt: string) => void;
  onUpdateVideoPrompt: (index: number, newPrompt: string) => void;
  onUpdateScript?: (index: number, newScript: string) => void;
  onUpdateAction?: (index: number, newAction: string) => void;
  onUpdateDetail?: (index: number, newDetail: string) => void;
  onBatchRegenerate: () => void;
  onBatchUpscale: () => void;
  onBatchGenerateVideo: () => void;
  onBatchDelete: () => void;
  onAddBlankScene: () => void;
  selectionCount: number;
}

const StudioStoryboard: React.FC<StudioStoryboardProps> = ({
  config, storyboard, generatedMedia,
  onToggleSelect, onToggleLock, onEnlarge,
  onAddToQueue, onUpdatePrompt, onUpdateVideoPrompt,
  onUpdateScript, onUpdateAction, onUpdateDetail,
  onBatchRegenerate, onBatchUpscale, onBatchGenerateVideo, onBatchDelete,
  onAddBlankScene, selectionCount
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const filmstripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentSceneIndex >= storyboard.steps.length) {
      setCurrentSceneIndex(Math.max(0, storyboard.steps.length - 1));
    }
  }, [storyboard.steps.length, currentSceneIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    if (e.key === 'ArrowLeft') setCurrentSceneIndex(prev => Math.max(0, prev - 1));
    if (e.key === 'ArrowRight') setCurrentSceneIndex(prev => Math.min(storyboard.steps.length - 1, prev + 1));
  }, [storyboard.steps.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (filmstripRef.current) {
      const thumb = filmstripRef.current.children[currentSceneIndex] as HTMLElement;
      if (thumb) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentSceneIndex]);

  const step = storyboard.steps[currentSceneIndex];
  const media = generatedMedia[currentSceneIndex];
  const totalScenes = storyboard.steps.length;

  if (!step || !media) return null;

  return (
    <div className="flex flex-col gap-0">
      {/* Batch Toolbar (when items selected) */}
      {selectionCount > 0 && (
        <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl p-3 flex items-center justify-between shadow-lg mb-4">
          <span className="text-sm font-bold text-foreground">{selectionCount} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onBatchRegenerate}>
              <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
            </Button>
            <Button size="sm" variant="outline" onClick={onBatchUpscale}>
              <ZapIcon className="h-3 w-3 mr-1" /> Upscale
            </Button>
            <Button size="sm" variant="outline" onClick={onBatchGenerateVideo}>
              <Video className="h-3 w-3 mr-1" /> Video
            </Button>
            <Button size="sm" variant="destructive" onClick={onBatchDelete}>
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Thumbnail Filmstrip + Navigation */}
      <div className="mb-4">
        <ScrollArea className="w-full">
          <div ref={filmstripRef} className="flex items-center gap-2 pb-2 px-1">
            {storyboard.steps.map((s, idx) => {
              const m = generatedMedia[idx];
              const isActive = idx === currentSceneIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentSceneIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    isActive
                      ? 'border-primary ring-2 ring-primary/30 scale-105'
                      : m?.imageUrl
                      ? 'border-border hover:border-primary/50'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  {m?.imageUrl ? (
                    <img src={m.imageUrl} alt={s.step_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-[10px] font-bold text-muted-foreground">{idx + 1}</span>
                    </div>
                  )}
                  {m?.isGeneratingImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1 rounded ${
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-black/50 text-white'
                  }`}>
                    {idx + 1}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => { onAddBlankScene(); setCurrentSceneIndex(totalScenes); }}
              className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-colors"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="flex items-center justify-between mt-2">
          <Button
            variant="outline" size="sm"
            disabled={currentSceneIndex === 0}
            onClick={() => setCurrentSceneIndex(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
          </Button>
          <span className="text-xs text-muted-foreground font-medium">
            Scene {currentSceneIndex + 1} of {totalScenes}
          </span>
          <Button
            variant="outline" size="sm"
            disabled={currentSceneIndex >= totalScenes - 1}
            onClick={() => setCurrentSceneIndex(prev => prev + 1)}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Scene Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
        <SceneCard
          key={currentSceneIndex}
          index={currentSceneIndex}
          step={step}
          media={media}
          aspectRatio={config.aspectRatio}
          onGenerateImage={() => {
            onAddToQueue([{
              id: Math.random().toString(),
              type: 'generate',
              index: currentSceneIndex,
              step,
              config: { ...config }
            }]);
          }}
          onUpscale={() => {
            onAddToQueue([{
              id: Math.random().toString(),
              type: 'upscale',
              index: currentSceneIndex,
              step,
              config: { ...config },
              baseImageUrl: generatedMedia[currentSceneIndex]?.imageUrl
            }]);
          }}
          onGenerateVideo={() => {
            if (!generatedMedia[currentSceneIndex]?.imageUrl) return;
            onAddToQueue([{
              id: Math.random().toString(),
              type: 'generate_video',
              index: currentSceneIndex,
              step,
              config: { ...config },
              baseImageUrl: generatedMedia[currentSceneIndex].imageUrl
            }]);
          }}
          onToggleSelect={() => onToggleSelect(currentSceneIndex)}
          onToggleLock={(type) => onToggleLock(currentSceneIndex, type)}
          onEnlarge={() => onEnlarge(currentSceneIndex)}
          onUpdatePrompt={(newPrompt) => onUpdatePrompt(currentSceneIndex, newPrompt)}
          onUpdateVideoPrompt={(newPrompt) => onUpdateVideoPrompt(currentSceneIndex, newPrompt)}
          onUpdateScript={(newScript) => onUpdateScript?.(currentSceneIndex, newScript)}
          onUpdateAction={(newAction) => onUpdateAction?.(currentSceneIndex, newAction)}
          onUpdateDetail={(newDetail) => onUpdateDetail?.(currentSceneIndex, newDetail)}
        />
      </div>
    </div>
  );
};

export default StudioStoryboard;

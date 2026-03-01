import React, { useState, useEffect, useCallback } from 'react';
import { AppConfig, VlogStep, VlogStoryboard, GeneratedMedia, QueueItem } from './types';
import SceneCard from './SceneCard';
import { Button } from '@/components/ui/button';
import { Download, FileText, Save, Loader2, ChevronLeft, ChevronRight, Plus, ImageIcon, Video, RefreshCw, ZapIcon, Trash2 } from 'lucide-react';

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
  onBatchRegenerate: () => void;
  onBatchUpscale: () => void;
  onBatchGenerateVideo: () => void;
  onBatchDelete: () => void;
  onAddBlankScene: () => void;
  selectionCount: number;
  renderMode?: 'full' | 'navigation-only' | 'scene-content';
  currentSceneIndex?: number;
  onSceneChange?: (index: number) => void;
}

const StudioStoryboard: React.FC<StudioStoryboardProps> = ({
  config, storyboard, generatedMedia,
  onToggleSelect, onToggleLock, onEnlarge,
  onAddToQueue, onUpdatePrompt, onUpdateVideoPrompt,
  onBatchRegenerate, onBatchUpscale, onBatchGenerateVideo, onBatchDelete,
  onAddBlankScene, selectionCount, renderMode = 'full',
  currentSceneIndex: controlledIndex, onSceneChange
}) => {
  const [internalIndex, setInternalIndex] = useState(0);
  const currentSceneIndex = controlledIndex ?? internalIndex;
  const setCurrentSceneIndex = (valOrFn: number | ((prev: number) => number)) => {
    const newVal = typeof valOrFn === 'function' ? valOrFn(currentSceneIndex) : valOrFn;
    if (onSceneChange) onSceneChange(newVal);
    else setInternalIndex(newVal);
  };

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
    if (renderMode === 'scene-content') return; // only one instance handles keyboard
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, renderMode]);

  const step = storyboard.steps[currentSceneIndex];
  const media = generatedMedia[currentSceneIndex];
  const totalScenes = storyboard.steps.length;

  if (!step || !media) return null;

  // Navigation-only mode: renders scene dots, prev/next, and add blank shot for the left column
  if (renderMode === 'navigation-only') {
    return (
      <div className="flex flex-col gap-3">
        {/* Batch Toolbar */}
        {selectionCount > 0 && (
          <div className="bg-muted/80 border border-border rounded-lg p-2 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">{selectionCount} selected</span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={onBatchRegenerate} className="h-7 text-[10px]">
                <RefreshCw className="h-3 w-3 mr-1" /> Regen
              </Button>
              <Button size="sm" variant="outline" onClick={onBatchUpscale} className="h-7 text-[10px]">
                <ZapIcon className="h-3 w-3 mr-1" /> Upscale
              </Button>
              <Button size="sm" variant="destructive" onClick={onBatchDelete} className="h-7 text-[10px]">
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        )}

        {/* Scene dots + counter */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" className="h-7" disabled={currentSceneIndex === 0} onClick={() => setCurrentSceneIndex(prev => prev - 1)}>
            <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Prev
          </Button>
          <div className="flex items-center gap-1.5">
            {storyboard.steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSceneIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentSceneIndex ? 'bg-primary w-4' : generatedMedia[idx]?.imageUrl ? 'bg-primary/40' : 'bg-border'}`}
              />
            ))}
            <span className="text-[10px] text-muted-foreground font-medium ml-1.5">
              {currentSceneIndex + 1}/{totalScenes}
            </span>
          </div>
          <Button variant="outline" size="sm" className="h-7" disabled={currentSceneIndex >= totalScenes - 1} onClick={() => setCurrentSceneIndex(prev => prev + 1)}>
            Next <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        </div>

        {/* Current scene info */}
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">{step.step_number}</span>
            {step.step_name}
          </h4>
          {step.script && <p className="text-[10px] text-muted-foreground mt-1.5 italic line-clamp-2">"{step.script}"</p>}
        </div>

        {/* Add Blank Shot */}
        <Button variant="ghost" size="sm" onClick={() => { onAddBlankScene(); setCurrentSceneIndex(totalScenes); }}
          className="text-muted-foreground hover:text-foreground text-xs h-7">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Blank Shot
        </Button>
      </div>
    );
  }

  // Scene-content mode: renders just the SceneCard content for the right column
  if (renderMode === 'scene-content') {
    return (
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
        />
      </div>
    );
  }

  // Full mode (legacy fallback)
  return (
    <div className="flex flex-col gap-0">
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

      <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
        <SceneCard
          key={currentSceneIndex}
          index={currentSceneIndex}
          step={step}
          media={media}
          aspectRatio={config.aspectRatio}
          onGenerateImage={() => {
            onAddToQueue([{ id: Math.random().toString(), type: 'generate', index: currentSceneIndex, step, config: { ...config } }]);
          }}
          onUpscale={() => {
            onAddToQueue([{ id: Math.random().toString(), type: 'upscale', index: currentSceneIndex, step, config: { ...config }, baseImageUrl: generatedMedia[currentSceneIndex]?.imageUrl }]);
          }}
          onGenerateVideo={() => {
            if (!generatedMedia[currentSceneIndex]?.imageUrl) return;
            onAddToQueue([{ id: Math.random().toString(), type: 'generate_video', index: currentSceneIndex, step, config: { ...config }, baseImageUrl: generatedMedia[currentSceneIndex].imageUrl }]);
          }}
          onToggleSelect={() => onToggleSelect(currentSceneIndex)}
          onToggleLock={(type) => onToggleLock(currentSceneIndex, type)}
          onEnlarge={() => onEnlarge(currentSceneIndex)}
          onUpdatePrompt={(newPrompt) => onUpdatePrompt(currentSceneIndex, newPrompt)}
          onUpdateVideoPrompt={(newPrompt) => onUpdateVideoPrompt(currentSceneIndex, newPrompt)}
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <Button variant="outline" size="sm" disabled={currentSceneIndex === 0} onClick={() => setCurrentSceneIndex(prev => prev - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {storyboard.steps.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentSceneIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentSceneIndex ? 'bg-primary w-4' : generatedMedia[idx]?.imageUrl ? 'bg-primary/40' : 'bg-border'}`} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground font-medium ml-2">{currentSceneIndex + 1} / {totalScenes}</span>
        </div>
        <Button variant="outline" size="sm" disabled={currentSceneIndex >= totalScenes - 1} onClick={() => setCurrentSceneIndex(prev => prev + 1)}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="flex justify-center mt-4">
        <Button variant="ghost" size="sm" onClick={() => { onAddBlankScene(); setCurrentSceneIndex(totalScenes); }}
          className="text-muted-foreground hover:text-foreground">
          <Plus className="h-4 w-4 mr-1" /> Add Blank Shot
        </Button>
      </div>
    </div>
  );
};

export default StudioStoryboard;

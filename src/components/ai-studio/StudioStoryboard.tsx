import React, { useState, useEffect, useCallback } from 'react';
import { AppConfig, VlogStep, VlogStoryboard, GeneratedMedia, QueueItem } from './types';
import SceneCard from './SceneCard';
import { Button } from '@/components/ui/button';
import { Download, FileText, Save, Loader2, ChevronLeft, ChevronRight, Plus, ImageIcon, Video, RefreshCw, ZapIcon, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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
}

const StudioStoryboard: React.FC<StudioStoryboardProps> = ({
  config, storyboard, generatedMedia,
  onToggleSelect, onToggleLock, onEnlarge,
  onAddToQueue, onUpdatePrompt, onUpdateVideoPrompt,
  onBatchRegenerate, onBatchUpscale, onBatchGenerateVideo, onBatchDelete,
  onAddBlankScene, selectionCount
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

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
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <Button
          variant="outline" size="sm"
          disabled={currentSceneIndex === 0}
          onClick={() => setCurrentSceneIndex(prev => prev - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {storyboard.steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSceneIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentSceneIndex ? 'bg-primary w-4' : generatedMedia[idx]?.imageUrl ? 'bg-primary/40' : 'bg-border'}`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground font-medium ml-2">
            {currentSceneIndex + 1} / {totalScenes}
          </span>
        </div>

        <Button
          variant="outline" size="sm"
          disabled={currentSceneIndex >= totalScenes - 1}
          onClick={() => setCurrentSceneIndex(prev => prev + 1)}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Add Blank Shot */}
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

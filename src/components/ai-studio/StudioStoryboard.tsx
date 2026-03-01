import React, { useState, useEffect, useCallback } from 'react';
import { AppConfig, VlogStep, VlogStoryboard, GeneratedMedia, QueueItem } from './types';
import SceneCard from './SceneCard';
import StoryboardToolbar from './StoryboardToolbar';
import { Button } from '@/components/ui/button';
import { Download, FileText, Save, Loader2, ChevronLeft, ChevronRight, Plus, ImageIcon, Video, RefreshCw, ZapIcon, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface StudioStoryboardProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
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
  onDownloadScript: () => void;
  onDownloadAll: () => void;
  onSaveProject: (name: string) => Promise<void>;
  onAddBlankScene: () => void;
  selectionCount: number;
  currentProjectName?: string;
  isSaving?: boolean;
  isGeneratingTopic?: boolean;
  onGenerateTopicIdeas?: () => void;
}

const StudioStoryboard: React.FC<StudioStoryboardProps> = ({
  config, setConfig, storyboard, generatedMedia,
  onToggleSelect, onToggleLock, onEnlarge,
  onAddToQueue, onUpdatePrompt, onUpdateVideoPrompt,
  onBatchRegenerate, onBatchUpscale, onBatchGenerateVideo, onBatchDelete,
  onDownloadScript, onDownloadAll, onSaveProject, onAddBlankScene,
  selectionCount, currentProjectName, isSaving,
  isGeneratingTopic, onGenerateTopicIdeas
}) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectName, setProjectName] = useState(currentProjectName || '');

  // Clamp scene index when steps change
  useEffect(() => {
    if (currentSceneIndex >= storyboard.steps.length) {
      setCurrentSceneIndex(Math.max(0, storyboard.steps.length - 1));
    }
  }, [storyboard.steps.length, currentSceneIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    if (e.key === 'ArrowLeft') setCurrentSceneIndex(prev => Math.max(0, prev - 1));
    if (e.key === 'ArrowRight') setCurrentSceneIndex(prev => Math.min(storyboard.steps.length - 1, prev + 1));
  }, [storyboard.steps.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSave = async () => {
    const name = projectName.trim() || currentProjectName || 'Untitled Project';
    await onSaveProject(name);
    setShowSaveDialog(false);
  };

  const handleSaveClick = () => {
    if (currentProjectName) {
      onSaveProject(currentProjectName);
    } else {
      setProjectName('');
      setShowSaveDialog(true);
    }
  };

  const step = storyboard.steps[currentSceneIndex];
  const media = generatedMedia[currentSceneIndex];
  const totalScenes = storyboard.steps.length;
  const imagesGenerated = Object.values(generatedMedia).filter(m => !!m.imageUrl).length;

  if (!step || !media) return null;

  return (
    <div className="flex flex-col gap-0 pb-24">
      {/* Top Bar: Save + Downloads */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-foreground">
            <span className="text-primary">
              {config.creationMode === 'vlog' ? config.vlogCategory : 'UGC'}
            </span>
            {' '}Storyboard
          </h2>
          <span className="text-xs text-muted-foreground">
            {imagesGenerated}/{totalScenes} images
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveClick} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            {currentProjectName ? 'Save' : 'Save Project'}
          </Button>
          <Button variant="outline" size="sm" onClick={onDownloadScript}>
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Script
          </Button>
          <Button variant="outline" size="sm" onClick={onDownloadAll}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> All
          </Button>
        </div>
      </div>

      {/* Settings Toolbar */}
      <StoryboardToolbar
        config={config}
        setConfig={setConfig}
        isGeneratingTopic={isGeneratingTopic}
        onGenerateTopicIdeas={onGenerateTopicIdeas}
      />

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Project</DialogTitle>
            <DialogDescription>Give your storyboard a name so you can find it later.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="e.g. Morning Routine GRWM"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          {/* Scene dots */}
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

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border p-3 flex justify-center gap-3">
        <Button size="sm" variant="outline" onClick={() => {
          const tasks: QueueItem[] = storyboard.steps
            .map((s, idx) => ({ id: Math.random().toString(), type: 'generate' as const, index: idx, step: s, config: { ...config } }))
            .filter(t => !generatedMedia[t.index]?.imageUrl);
          if (tasks.length > 0) onAddToQueue(tasks);
        }}>
          <ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Generate All Images
        </Button>
        <Button size="sm" variant="outline" onClick={() => {
          const tasks: QueueItem[] = storyboard.steps
            .map((s, idx) => ({ id: Math.random().toString(), type: 'generate_video' as const, index: idx, step: s, config: { ...config }, baseImageUrl: generatedMedia[idx]?.imageUrl }))
            .filter(t => t.baseImageUrl && !generatedMedia[t.index]?.videoUrl);
          if (tasks.length > 0) onAddToQueue(tasks);
        }}>
          <Video className="h-3.5 w-3.5 mr-1.5" /> Generate All Videos
        </Button>
      </div>
    </div>
  );
};

export default StudioStoryboard;

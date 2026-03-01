import React, { useState } from 'react';
import { AppConfig, VlogStoryboard, GeneratedMedia, QueueItem } from './types';
import SceneCard from './SceneCard';
import { Button } from '@/components/ui/button';
import { Download, FileText, RefreshCw, ZapIcon, Trash2, Save, Loader2 } from 'lucide-react';
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
  onDownloadScript: () => void;
  onDownloadAll: () => void;
  onSaveProject: (name: string) => Promise<void>;
  selectionCount: number;
  currentProjectName?: string;
  isSaving?: boolean;
}

const StudioStoryboard: React.FC<StudioStoryboardProps> = ({
  config, storyboard, generatedMedia,
  onToggleSelect, onToggleLock, onEnlarge,
  onAddToQueue, onUpdatePrompt, onUpdateVideoPrompt,
  onBatchRegenerate, onBatchUpscale, onBatchGenerateVideo, onBatchDelete,
  onDownloadScript, onDownloadAll, onSaveProject,
  selectionCount, currentProjectName, isSaving
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectName, setProjectName] = useState(currentProjectName || '');

  const handleSave = async () => {
    const name = projectName.trim() || currentProjectName || 'Untitled Project';
    await onSaveProject(name);
    setShowSaveDialog(false);
  };

  const handleSaveClick = () => {
    if (currentProjectName) {
      // Already saved before — just re-save silently
      onSaveProject(currentProjectName);
    } else {
      setProjectName('');
      setShowSaveDialog(true);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-primary">
              {config.creationMode === 'vlog' ? config.vlogCategory : 'UGC Campaign'}
            </span>
            Storyboard
          </h2>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            {config.creationMode === 'vlog' ? config.vlogTopic : config.ugcPrompt}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleSaveClick} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {currentProjectName ? 'Save' : 'Save Project'}
          </Button>
          <Button variant="outline" size="sm" onClick={onDownloadScript}>
            <FileText className="h-4 w-4 mr-2" /> Download Script
          </Button>
          <Button variant="outline" size="sm" onClick={onDownloadAll}>
            <Download className="h-4 w-4 mr-2" /> Download All
          </Button>
        </div>
      </div>

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

      {/* Batch Toolbar */}
      {selectionCount > 0 && (
        <div className="sticky top-16 z-40 bg-card/95 backdrop-blur-md border border-border rounded-xl p-4 flex items-center justify-between shadow-lg">
          <span className="text-sm font-bold text-foreground">{selectionCount} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onBatchRegenerate}>
              <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
            </Button>
            <Button size="sm" variant="outline" onClick={onBatchUpscale}>
              <ZapIcon className="h-3 w-3 mr-1" /> Upscale
            </Button>
            <Button size="sm" variant="outline" onClick={onBatchGenerateVideo}>
              <ZapIcon className="h-3 w-3 mr-1" /> Video
            </Button>
            <Button size="sm" variant="destructive" onClick={onBatchDelete}>
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {storyboard.steps.map((step, index) => (
          <SceneCard
            key={index}
            index={index}
            step={step}
            media={generatedMedia[index]}
            aspectRatio={config.aspectRatio}
            onGenerateImage={() => {
              onAddToQueue([{
                id: Math.random().toString(),
                type: 'generate',
                index,
                step,
                config: { ...config }
              }]);
            }}
            onUpscale={() => {
              onAddToQueue([{
                id: Math.random().toString(),
                type: 'upscale',
                index,
                step,
                config: { ...config },
                baseImageUrl: generatedMedia[index]?.imageUrl
              }]);
            }}
            onGenerateVideo={() => {
              if (!generatedMedia[index]?.imageUrl) return;
              onAddToQueue([{
                id: Math.random().toString(),
                type: 'generate_video',
                index,
                step,
                config: { ...config },
                baseImageUrl: generatedMedia[index].imageUrl
              }]);
            }}
            onToggleSelect={() => onToggleSelect(index)}
            onToggleLock={(type) => onToggleLock(index, type)}
            onEnlarge={() => onEnlarge(index)}
            onUpdatePrompt={(newPrompt) => onUpdatePrompt(index, newPrompt)}
            onUpdateVideoPrompt={(newPrompt) => onUpdateVideoPrompt(index, newPrompt)}
          />
        ))}
      </div>
    </div>
  );
};

export default StudioStoryboard;

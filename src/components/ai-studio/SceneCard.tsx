import React, { useState, useEffect } from 'react';
import { VlogStep, AspectRatio, GeneratedMedia } from './types';
import { Download, RefreshCw, Loader2, AlertCircle, ImageIcon, Video, ChevronDown, Copy, Pencil, Check, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea';
import FalKeyWarning from './FalKeyWarning';

const EditableField = ({
  label, value, editedValue, isFieldEditing, colorClass,
  onEdit, onSave, onCancel, onChange
}: {
  label: string; value: string; editedValue: string; isFieldEditing: boolean; colorClass?: string;
  onEdit: () => void; onSave: () => void; onCancel: () => void; onChange: (v: string) => void;
}) => (
  <div>
    <div className="flex justify-between items-center mb-0.5">
      <span className={`text-[10px] uppercase font-bold ${colorClass || 'text-primary'}`}>{label}</span>
      {!isFieldEditing ? (
        <button onClick={onEdit} className="text-[10px] text-muted-foreground hover:text-foreground uppercase font-bold flex items-center gap-1">
          <Pencil className="h-3 w-3" /> Edit
        </button>
      ) : (
        <div className="flex gap-1">
          <button onClick={onSave} className="text-[10px] text-primary hover:text-foreground uppercase font-bold flex items-center gap-1">
            <Check className="h-3 w-3" /> Save
          </button>
          <button onClick={onCancel} className="text-[10px] text-muted-foreground hover:text-foreground uppercase font-bold flex items-center gap-1">
            <X className="h-3 w-3" /> Cancel
          </button>
        </div>
      )}
    </div>
    {isFieldEditing ? (
      <AutoResizeTextarea
        value={editedValue}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-background border-primary"
        minRows={2}
      />
    ) : (
      <p className="text-sm text-foreground/80 leading-relaxed">{value || <span className="italic text-muted-foreground">Empty</span>}</p>
    )}
  </div>
);

interface SceneCardProps {
  step: VlogStep;
  index: number;
  media: GeneratedMedia;
  aspectRatio: AspectRatio;
  onGenerateImage: () => void;
  onUpscale: () => void;
  onGenerateVideo: () => void;
  onToggleSelect: () => void;
  onEnlarge: () => void;
  onUpdatePrompt: (newPrompt: string) => void;
  onUpdateVideoPrompt: (newPrompt: string) => void;
  onUpdateScript?: (newScript: string) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({
  step, index, media, aspectRatio,
  onGenerateImage, onUpscale, onGenerateVideo,
  onToggleSelect, onEnlarge,
  onUpdatePrompt, onUpdateVideoPrompt,
  onUpdateScript
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(step.image_prompt);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [editedVideoPrompt, setEditedVideoPrompt] = useState(step.video_prompt);
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState(step.script);
  const [promptModalOpen, setPromptModalOpen] = useState(false);

  useEffect(() => { setEditedPrompt(step.image_prompt); }, [step.image_prompt]);
  useEffect(() => { setEditedVideoPrompt(step.video_prompt); }, [step.video_prompt]);
  useEffect(() => { setEditedScript(step.script); }, [step.script]);

  const handleSavePrompt = () => { onUpdatePrompt(editedPrompt); setIsEditing(false); };
  const handleSaveVideoPrompt = () => { onUpdateVideoPrompt(editedVideoPrompt); setIsEditingVideo(false); };

  const handleGenerateWithAutoSave = () => {
    if (isEditing && editedPrompt !== step.image_prompt) {
      onUpdatePrompt(editedPrompt);
      setIsEditing(false);
    }
    onGenerateImage();
  };

  const handleGenerateVideoWithAutoSave = () => {
    if (isEditingVideo && editedVideoPrompt !== step.video_prompt) {
      onUpdateVideoPrompt(editedVideoPrompt);
      setIsEditingVideo(false);
    }
    onGenerateVideo();
  };

  const downloadMedia = async (url: string, ext: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `scene-${step.step_number}-${step.step_name.replace(/\s+/g, '-').toLowerCase()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.location.href = url;
    }
  };

  const downloadImage = (e: React.MouseEvent) => { e.stopPropagation(); if (media.imageUrl) downloadMedia(media.imageUrl, 'png'); };
  const downloadVideo = (e: React.MouseEvent) => { e.stopPropagation(); if (media.videoUrl) downloadMedia(media.videoUrl, 'mp4'); };

  const [imageBroken, setImageBroken] = useState(false);
  useEffect(() => { setImageBroken(false); }, [media.imageUrl]);
  const handleImageError = () => { setImageBroken(true); };
  const handleImageLoad = () => { setImageBroken(false); };

  const isLoading = media.isGeneratingImage || media.isUpscaling;
  const isVideoLoading = media.isGeneratingVideo;
  const cssAspectRatio = aspectRatio.replace(':', '/');
  const hasValidImage = !!media.imageUrl && !imageBroken;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
          <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs font-bold shadow-lg">
            {step.step_number}
          </span>
          <span className="truncate text-base">{step.step_name}</span>
        </h3>
        <label className="relative flex items-center justify-center p-1.5 rounded bg-muted cursor-pointer border border-border">
          <input type="checkbox" checked={media.isSelected || false} onChange={onToggleSelect} className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-muted cursor-pointer" />
        </label>
      </div>

      {/* Image + Video Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Image Panel */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase">Image Reference</h4>
          <div
            className={`relative w-full bg-muted group overflow-hidden rounded-lg border border-border ${hasValidImage && !isLoading ? 'cursor-zoom-in' : ''}`}
            style={{ aspectRatio: cssAspectRatio }}
            onClick={() => { if (hasValidImage && !isLoading) onEnlarge(); }}
          >
            {hasValidImage ? (
              <img src={media.imageUrl} alt={step.step_name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" onError={handleImageError} onLoad={handleImageLoad} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                {!isLoading && !media.error && (
                  <>
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleGenerateWithAutoSave(); }}>Generate Image</Button>
                    <p className="text-[9px] text-muted-foreground mt-2">May take 1–3 minutes</p>
                  </>
                )}
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                <Loader2 className="h-6 w-6 text-white animate-spin" />
                <p className="mt-2 text-xs text-white animate-pulse uppercase font-bold tracking-wider">
                  {media.isUpscaling ? 'Upscaling...' : 'Rendering...'}
                </p>
              </div>
            )}

            {media.error && !isLoading && !media.imageUrl && (
              <div className="absolute inset-0 bg-destructive/80 flex flex-col items-center justify-center p-3 text-center z-30 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                <AlertCircle className="h-6 w-6 text-destructive-foreground mb-1" />
                <p className="text-xs font-bold text-destructive-foreground mb-1">Failed</p>
                <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleGenerateWithAutoSave(); }}>Retry</Button>
              </div>
            )}

            {hasValidImage && !isLoading && (
              <TooltipProvider delayDuration={300}>
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-40 pointer-events-none">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={downloadImage} className="pointer-events-auto p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg active:scale-95">
                        <Download className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>Download</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={(e) => { e.stopPropagation(); handleGenerateWithAutoSave(); }} className="pointer-events-auto p-2 bg-black/60 hover:bg-primary text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg active:scale-95">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>Regenerate</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={(e) => { e.stopPropagation(); setPromptModalOpen(true); }} className="pointer-events-auto p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg active:scale-95">
                        <FileText className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>Edit Prompts</p></TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            )}

            {/* Show prompt icon even when no image */}
            {!hasValidImage && !isLoading && !media.error && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={(e) => { e.stopPropagation(); setPromptModalOpen(true); }} className="absolute top-2 right-2 z-40 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg active:scale-95">
                      <FileText className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left"><p>Edit Prompts</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Video Panel */}
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold text-muted-foreground uppercase">Generated Video</h4>
          <FalKeyWarning />
          <div className="relative w-full bg-muted overflow-hidden rounded-lg border border-border" style={{ aspectRatio: cssAspectRatio }}>
            {media.videoUrl ? (
              <video src={media.videoUrl} controls autoPlay loop muted className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                {!isVideoLoading && !media.videoError && (
                  <>
                    <Video className="h-8 w-8 text-muted-foreground mb-2" />
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleGenerateVideoWithAutoSave(); }} disabled={!media.imageUrl}>Generate Video</Button>
                    {!media.imageUrl ? <p className="text-[9px] text-muted-foreground mt-2">Requires image first</p> : <p className="text-[9px] text-muted-foreground mt-2">May take 3–5 minutes</p>}
                  </>
                )}
              </div>
            )}
            {isVideoLoading && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
                <p className="mt-2 text-xs text-white animate-pulse uppercase font-bold tracking-wider">Generating Video...</p>
              </div>
            )}
            {media.videoError && !isVideoLoading && !media.videoUrl && (
              <div className="absolute inset-0 bg-destructive/80 flex flex-col items-center justify-center p-3 text-center z-30 backdrop-blur-sm">
                <AlertCircle className="h-6 w-6 text-destructive-foreground mb-1" />
                <p className="text-xs font-bold text-destructive-foreground mb-0.5">Video Failed</p>
                <p className="text-[10px] text-destructive-foreground/90 mb-2 max-w-[90%] line-clamp-2">{media.videoError}</p>
                <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleGenerateVideoWithAutoSave(); }}>Retry</Button>
              </div>
            )}
            {media.videoUrl && !isVideoLoading && (
              <TooltipProvider delayDuration={300}>
                <div className="absolute top-2 right-2 flex flex-col gap-2 z-40 pointer-events-none">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={downloadVideo} className="pointer-events-auto p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg active:scale-95">
                        <Download className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>Download</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={(e) => { e.stopPropagation(); handleGenerateVideoWithAutoSave(); }} className="pointer-events-auto p-2 bg-black/60 hover:bg-primary text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg active:scale-95">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>Regenerate</p></TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>

      {/* Prompts Modal */}
      <Dialog open={promptModalOpen} onOpenChange={setPromptModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Scene {step.step_number} — {step.step_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <EditableField
                label="Script / Voiceover"
                value={step.script}
                editedValue={editedScript}
                isFieldEditing={isEditingScript}
                onEdit={() => setIsEditingScript(true)}
                onSave={() => { onUpdateScript?.(editedScript); setIsEditingScript(false); }}
                onCancel={() => { setIsEditingScript(false); setEditedScript(step.script); }}
                onChange={setEditedScript}
              />
            </div>


            {/* Image Prompt */}
            <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-primary font-bold uppercase">Image Prompt</span>
                <div className="flex gap-2">
                  {!isEditing && <button onClick={() => setIsEditing(true)} className="text-[10px] text-primary hover:text-foreground uppercase font-bold">Edit</button>}
                  <button onClick={() => navigator.clipboard.writeText(step.image_prompt)} className="text-[10px] text-muted-foreground hover:text-foreground uppercase font-bold flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</button>
                </div>
              </div>
              {isEditing ? (
                <div>
                  <textarea value={editedPrompt} onChange={(e) => setEditedPrompt(e.target.value)} className="w-full h-32 bg-background border border-primary rounded p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-2 font-mono leading-relaxed" />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditedPrompt(step.image_prompt); }}>Cancel</Button>
                    <Button size="sm" onClick={handleSavePrompt}>Save</Button>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground font-mono break-words leading-tight bg-muted p-2 rounded border border-border">{step.image_prompt}</p>
              )}
            </div>

            {/* Video Prompt */}
            <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-primary font-bold uppercase">Video Prompt</span>
                <div className="flex gap-2">
                  {!isEditingVideo && <button onClick={() => setIsEditingVideo(true)} className="text-[10px] text-primary hover:text-foreground uppercase font-bold">Edit</button>}
                  <button onClick={() => navigator.clipboard.writeText(step.video_prompt)} className="text-[10px] text-muted-foreground hover:text-foreground uppercase font-bold flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</button>
                </div>
              </div>
              {isEditingVideo ? (
                <div>
                  <textarea value={editedVideoPrompt} onChange={(e) => setEditedVideoPrompt(e.target.value)} className="w-full h-32 bg-background border border-primary rounded p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-2 font-mono leading-relaxed" />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setIsEditingVideo(false); setEditedVideoPrompt(step.video_prompt); }}>Cancel</Button>
                    <Button size="sm" onClick={handleSaveVideoPrompt}>Save</Button>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground font-mono break-words leading-tight bg-muted p-2 rounded border border-border">{step.video_prompt}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SceneCard;

import React, { useState, useEffect } from 'react';
import { VlogStep, AspectRatio, GeneratedMedia } from './types';
import { Download, RefreshCw, User, ShoppingBag, Landmark, Loader2, AlertCircle, ImageIcon, Video, ChevronDown, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SceneCardProps {
  step: VlogStep;
  index: number;
  media: GeneratedMedia;
  aspectRatio: AspectRatio;
  onGenerateImage: () => void;
  onUpscale: () => void;
  onGenerateVideo: () => void;
  onToggleSelect: () => void;
  onToggleLock: (type: 'character' | 'outfit' | 'environment') => void;
  onEnlarge: () => void;
  onUpdatePrompt: (newPrompt: string) => void;
  onUpdateVideoPrompt: (newPrompt: string) => void;
}

const SceneCard: React.FC<SceneCardProps> = ({
  step, index, media, aspectRatio,
  onGenerateImage, onUpscale, onGenerateVideo,
  onToggleSelect, onToggleLock, onEnlarge,
  onUpdatePrompt, onUpdateVideoPrompt
}) => {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(step.image_prompt);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [editedVideoPrompt, setEditedVideoPrompt] = useState(step.video_prompt);

  useEffect(() => { setEditedPrompt(step.image_prompt); }, [step.image_prompt]);
  useEffect(() => { setEditedVideoPrompt(step.video_prompt); }, [step.video_prompt]);

  const copyPrompt = (text: string) => navigator.clipboard.writeText(text);
  const handleSavePrompt = () => { onUpdatePrompt(editedPrompt); setIsEditing(false); };
  const handleSaveVideoPrompt = () => { onUpdateVideoPrompt(editedVideoPrompt); setIsEditingVideo(false); };

  const downloadImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (media.imageUrl) {
      const link = document.createElement('a');
      link.href = media.imageUrl;
      link.download = `scene-${step.step_number}-${step.step_name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isLoading = media.isGeneratingImage || media.isUpscaling;
  const isVideoLoading = media.isGeneratingVideo;
  const cssAspectRatio = aspectRatio.replace(':', '/');

  return (
    <div className={`bg-card border rounded-xl overflow-hidden shadow-lg flex flex-col lg:flex-row transition-all duration-300 w-full ${media.isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}>
      {/* Image Side */}
      <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r border-border flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-bold text-muted-foreground">Image Reference</h4>
          <label className="relative flex items-center justify-center p-1.5 rounded bg-muted cursor-pointer border border-border">
            <input type="checkbox" checked={media.isSelected || false} onChange={onToggleSelect} className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-muted cursor-pointer" />
          </label>
        </div>
        <div
          className="relative w-full bg-black group cursor-zoom-in overflow-hidden rounded-lg border border-border flex-1 min-h-[200px]"
          style={{ aspectRatio: cssAspectRatio }}
          onClick={onEnlarge}
        >
          {/* Lock Controls */}
          {media.imageUrl && !isLoading && (
            <div className="absolute top-2 right-2 flex flex-col gap-2 z-[60]" onClick={(e) => e.stopPropagation()}>
              <button onClick={(e) => { e.stopPropagation(); onToggleLock('character'); }} title="Character Lock"
                className={`p-1.5 rounded-full border shadow-xl transition-all active:scale-95 ${media.lockedCharacter ? 'bg-primary border-primary text-primary-foreground' : 'bg-black/70 border-border text-muted-foreground hover:text-primary'}`}>
                <User className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onToggleLock('outfit'); }} title="Outfit Lock"
                className={`p-1.5 rounded-full border shadow-xl transition-all active:scale-95 ${media.lockedOutfit ? 'bg-accent border-accent text-accent-foreground' : 'bg-black/70 border-border text-muted-foreground hover:text-accent-foreground'}`}>
                <ShoppingBag className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onToggleLock('environment'); }} title="Environment Lock"
                className={`p-1.5 rounded-full border shadow-xl transition-all active:scale-95 ${media.lockedEnvironment ? 'bg-green-600 border-green-400 text-white' : 'bg-black/70 border-border text-muted-foreground hover:text-green-400'}`}>
                <Landmark className="w-4 h-4" />
              </button>
            </div>
          )}

          {media.imageUrl ? (
            <img src={media.imageUrl} alt={step.step_name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              {!isLoading && !media.error && (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onGenerateImage(); }}>
                    Generate Image
                  </Button>
                </>
              )}
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="mt-2 text-xs text-primary animate-pulse uppercase font-bold tracking-wider">
                {media.isUpscaling ? 'Upscaling...' : 'Rendering...'}
              </p>
            </div>
          )}

          {media.error && !isLoading && !media.imageUrl && (
            <div className="absolute inset-0 bg-destructive/80 flex flex-col items-center justify-center p-3 text-center z-30 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
              <AlertCircle className="h-6 w-6 text-destructive-foreground mb-1" />
              <p className="text-xs font-bold text-destructive-foreground mb-1">Failed</p>
              <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onGenerateImage(); }}>Retry</Button>
            </div>
          )}

          {media.imageUrl && !isLoading && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-40 px-2 pointer-events-none">
              <button onClick={downloadImage} title="Download" className="pointer-events-auto p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg active:scale-95">
                <Download className="h-3 w-3" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onGenerateImage(); }} title="Regenerate" className="pointer-events-auto p-1.5 bg-black/60 hover:bg-primary text-white rounded-full backdrop-blur-md border border-white/10 shadow-lg active:scale-95">
                <RefreshCw className="h-3 w-3" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onUpscale(); }} title="Upscale" className="pointer-events-auto px-2 py-1 bg-gradient-to-r from-primary/90 to-accent/90 hover:from-primary hover:to-accent text-white text-[9px] font-bold uppercase rounded-full backdrop-blur-md border border-white/20 shadow-lg active:scale-95">
                Upscale
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Video Side */}
      <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r border-border flex flex-col">
        <h4 className="text-sm font-bold text-muted-foreground mb-3">Generated Video</h4>
        <div className="relative w-full bg-black overflow-hidden rounded-lg border border-border flex-1 min-h-[200px]" style={{ aspectRatio: cssAspectRatio }}>
          {media.videoUrl ? (
            <video src={media.videoUrl} controls autoPlay loop muted className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              {!isVideoLoading && !media.videoError && (
                <>
                  <Video className="h-8 w-8 text-muted-foreground mb-2" />
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onGenerateVideo(); }} disabled={!media.imageUrl}>
                    Generate Video
                  </Button>
                  {!media.imageUrl && <p className="text-[9px] text-muted-foreground mt-2">Requires image first</p>}
                </>
              )}
            </div>
          )}
          {isVideoLoading && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="mt-2 text-xs text-primary animate-pulse uppercase font-bold tracking-wider">Generating Video...</p>
            </div>
          )}
          {media.videoError && !isVideoLoading && !media.videoUrl && (
            <div className="absolute inset-0 bg-destructive/80 flex flex-col items-center justify-center p-3 text-center z-30 backdrop-blur-sm">
              <AlertCircle className="h-6 w-6 text-destructive-foreground mb-1" />
              <p className="text-xs font-bold text-destructive-foreground mb-1">Video Failed</p>
              <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onGenerateVideo(); }}>Retry</Button>
            </div>
          )}
        </div>
      </div>

      {/* Content Side */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs shadow-lg">
                {step.step_number}
              </span>
              <span className="truncate leading-tight text-base">{step.step_name}</span>
            </h3>
          </div>

          {step.script && (
            <div className="mb-4 bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase text-primary font-bold">Script / Voiceover</span>
                <button onClick={() => copyPrompt(step.script)} className="text-[10px] text-muted-foreground hover:text-foreground uppercase font-bold flex items-center gap-1">
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <p className="text-sm text-foreground/80 italic leading-relaxed">"{step.script}"</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-muted-foreground text-sm leading-relaxed border-l-2 border-primary pl-3">
              <span className="text-[10px] uppercase text-primary font-bold block mb-0.5">Action</span>
              {step.a_roll}
            </p>
            <p className="text-muted-foreground text-xs">
              <span className="text-[10px] uppercase text-muted-foreground font-bold block mb-0.5">Detail</span>
              {step.close_up_details}
            </p>
          </div>
        </div>

        {/* Prompts Dropdown */}
        <div className="mt-6 pt-4 border-t border-border">
          <button onClick={() => setIsPromptOpen(!isPromptOpen)} className="w-full flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground transition-colors bg-muted p-2 rounded">
            <span>View AI Prompts</span>
            <ChevronDown className={`w-4 h-4 transform transition-transform ${isPromptOpen ? 'rotate-180' : ''}`} />
          </button>

          {isPromptOpen && (
            <div className="mt-2 space-y-3 bg-muted/30 p-3 rounded-lg border border-border">
              {/* Image Prompt */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-primary font-bold uppercase">Image Prompt</span>
                  <div className="flex gap-2">
                    {!isEditing && <button onClick={() => setIsEditing(true)} className="text-[10px] text-primary hover:text-foreground uppercase font-bold">Edit</button>}
                    <button onClick={() => copyPrompt(step.image_prompt)} className="text-[10px] text-muted-foreground hover:text-foreground uppercase font-bold">Copy</button>
                  </div>
                </div>
                {isEditing ? (
                  <div>
                    <textarea value={editedPrompt} onChange={(e) => setEditedPrompt(e.target.value)} className="w-full h-32 bg-background border border-primary rounded p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-2 font-mono leading-relaxed" />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditedPrompt(step.image_prompt); }}>Cancel</Button>
                      <Button size="sm" onClick={handleSavePrompt}>Save & Regenerate</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground font-mono break-words leading-tight bg-muted p-2 rounded border border-border">{step.image_prompt}</p>
                )}
              </div>

              {/* Video Prompt */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-primary font-bold uppercase">Video Prompt</span>
                  <div className="flex gap-2">
                    {!isEditingVideo && <button onClick={() => setIsEditingVideo(true)} className="text-[10px] text-primary hover:text-foreground uppercase font-bold">Edit</button>}
                    <button onClick={() => copyPrompt(step.video_prompt)} className="text-[10px] text-muted-foreground hover:text-foreground uppercase font-bold">Copy</button>
                  </div>
                </div>
                {isEditingVideo ? (
                  <div>
                    <textarea value={editedVideoPrompt} onChange={(e) => setEditedVideoPrompt(e.target.value)} className="w-full h-32 bg-background border border-primary rounded p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary mb-2 font-mono leading-relaxed" />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setIsEditingVideo(false); setEditedVideoPrompt(step.video_prompt); }}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveVideoPrompt}>Save & Regenerate Video</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground font-mono break-words leading-tight bg-muted p-2 rounded border border-border">{step.video_prompt}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SceneCard;

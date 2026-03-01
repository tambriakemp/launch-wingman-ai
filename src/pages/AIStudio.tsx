import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, VlogStoryboard, GeneratedMedia, QueueItem, AppPhase } from '@/components/ai-studio/types';
import { INITIAL_CONFIG, DEFAULT_MEDIA, getUserFriendlyErrorMessage } from '@/components/ai-studio/constants';
import StudioSetup from '@/components/ai-studio/StudioSetup';
import StudioPreview from '@/components/ai-studio/StudioPreview';
import StudioStoryboard from '@/components/ai-studio/StudioStoryboard';
import StudioHelp from '@/components/ai-studio/StudioHelp';
import ImageLightbox from '@/components/ai-studio/ImageLightbox';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, HelpCircle, RotateCcw, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { ProjectLayout } from '@/components/layout/ProjectLayout';

const AIStudio = () => {
  const [appPhase, setAppPhase] = useState<AppPhase>('setup');
  const [config, setConfig] = useState<AppConfig>({ ...INITIAL_CONFIG });
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [environmentImage, setEnvironmentImage] = useState<string | null>(null);
  const [environmentImages, setEnvironmentImages] = useState<string[]>([]);
  const [previewCharacterImage, setPreviewCharacterImage] = useState<string | null>(null);
  const [previewFinalLookImage, setPreviewFinalLookImage] = useState<string | null>(null);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);
  const [storyboard, setStoryboard] = useState<VlogStoryboard | null>(null);
  const [generatedMedia, setGeneratedMedia] = useState<Record<number, GeneratedMedia>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [showSafetyTerms, setShowSafetyTerms] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const processingRef = useRef(false);

  // Queue processor
  useEffect(() => {
    const processQueue = async () => {
      if (processingRef.current || queue.length === 0) return;
      processingRef.current = true;
      const currentBatch = queue;
      setQueue([]);
      setIsProcessing(true);

      setGeneratedMedia(prev => {
        const next = { ...prev };
        currentBatch.forEach(task => {
          next[task.index] = {
            ...prev[task.index],
            isGeneratingImage: task.type === 'generate',
            isUpscaling: task.type === 'upscale',
            isGeneratingVideo: task.type === 'generate_video',
            ...(task.type === 'generate_video' ? { videoError: undefined } : { error: undefined })
          };
        });
        return next;
      });

      try {
        // Process sequentially so each scene can use the previous as anchor
        let lastGeneratedUrl: string | undefined;
        for (const task of currentBatch) {
          try {
            if (task.type === 'generate' || task.type === 'upscale') {
              const lockedRefs: { type: string; base64: string }[] = [];
              Object.values(generatedMedia).forEach((m) => {
                if (m.imageUrl) {
                  const base64 = m.imageUrl.includes(',') ? m.imageUrl.split(',')[1] : m.imageUrl;
                  if (m.lockedCharacter) lockedRefs.push({ type: 'character', base64 });
                  if (m.lockedOutfit) lockedRefs.push({ type: 'outfit', base64 });
                  if (m.lockedEnvironment) lockedRefs.push({ type: 'environment', base64 });
                }
              });

              // Use the last sequentially generated image as anchor, or fall back to first available
              let anchorImageUrl: string | undefined = lastGeneratedUrl;
              if (!anchorImageUrl) {
                const hasOutfitLock = lockedRefs.some(r => r.type === 'outfit');
                const hasCharacterLock = lockedRefs.some(r => r.type === 'character');
                if (!hasOutfitLock || !hasCharacterLock) {
                  const firstGenerated = Object.values(generatedMedia).find(
                    m => m.imageUrl && !m.imageUrl.startsWith('data:')
                  );
                  if (firstGenerated?.imageUrl) {
                    anchorImageUrl = firstGenerated.imageUrl;
                  }
                }
              }

              const activePreview = task.step.is_final_look && previewFinalLookImage
                ? previewFinalLookImage : previewCharacterImage;

              // Build scene context from storyboard for continuity
              let previousScenePrompt: string | undefined;
              let nextScenePrompt: string | undefined;
              if (storyboard) {
                if (task.index > 0) previousScenePrompt = storyboard.steps[task.index - 1]?.image_prompt;
                if (task.index < storyboard.steps.length - 1) nextScenePrompt = storyboard.steps[task.index + 1]?.image_prompt;
              }

              // STRICT IDENTITY GATE: If preview exists, it is the ONLY character reference.
              // Raw selfies are NOT sent to avoid competing identity signals.
              const { data, error } = await supabase.functions.invoke('generate-scene-image', {
                body: {
                  prompt: task.step.image_prompt,
                  referenceImage: activePreview ? undefined : referenceImage,
                  referenceImages: activePreview ? undefined : (referenceImages.length > 0 ? referenceImages : undefined),
                  productImage,
                  environmentImage,
                  environmentImages: environmentImages.length > 0 ? environmentImages : undefined,
                  previewCharacter: activePreview,
                  config: task.config,
                  lockedRefs,
                  isFinalLook: task.step.is_final_look,
                  isUpscale: task.type === 'upscale',
                  baseImageUrl: task.baseImageUrl,
                  anchorImageUrl,
                  previousScenePrompt,
                  nextScenePrompt,
                  sceneNumber: task.index + 1,
                  totalScenes: storyboard?.steps.length
                }
              });

              if (error) throw error;
              if (data?.error) throw new Error(data.error);

              // Track for next scene's anchor
              if (data.imageUrl) lastGeneratedUrl = data.imageUrl;

              setGeneratedMedia(prev => ({
                ...prev,
                [task.index]: { ...prev[task.index], imageUrl: data.imageUrl, isGeneratingImage: false, isUpscaling: false, error: undefined }
              }));
            } else if (task.type === 'generate_video') {
              // Video generation placeholder - mark as coming soon
              throw new Error("Video generation coming soon");
            }
          } catch (error: any) {
            setGeneratedMedia(prev => ({
              ...prev,
              [task.index]: {
                ...prev[task.index],
                isGeneratingImage: false,
                isUpscaling: false,
                isGeneratingVideo: false,
                ...(task.type === 'generate_video' ? { videoError: getUserFriendlyErrorMessage(error) } : { error: getUserFriendlyErrorMessage(error) })
              }
            }));
          }
        }
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    };
    processQueue();
  }, [queue]);

  const addToQueue = (items: QueueItem[]) => setQueue(prev => [...prev, ...items]);

  const clearQueue = () => {
    setQueue([]);
    processingRef.current = false;
    setIsProcessing(false);
    setGeneratedMedia(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        const k = parseInt(key);
        if (next[k].isGeneratingImage || next[k].isUpscaling) {
          next[k] = { ...next[k], isGeneratingImage: false, isUpscaling: false };
        }
      });
      return next;
    });
  };

  const handleGenerateTopicIdeas = async () => {
    if (!config.vlogCategory) return;
    setIsGeneratingTopic(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-storyboard', {
        body: { action: 'brainstorm', config }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setConfig(prev => ({ ...prev, vlogTopic: data.topic }));
    } catch (e: any) {
      toast({ title: "Error", description: getUserFriendlyErrorMessage(e), variant: "destructive" });
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!referenceImage) { toast({ title: "Upload Required", description: "Please upload a reference avatar first.", variant: "destructive" }); return; }
    setIsPreviewGenerating(true);
    try {
      const previewBody = {
        referenceImage,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        environmentImage,
        environmentImages: environmentImages.length > 0 ? environmentImages : undefined,
        config,
        isFinalLook: false
      };
      const promises = [
        supabase.functions.invoke('generate-character-preview', { body: previewBody })
      ];
      if (config.vlogCategory === 'Get Ready With Me' && config.creationMode === 'vlog') {
        promises.push(supabase.functions.invoke('generate-character-preview', { body: { ...previewBody, isFinalLook: true } }));
      }
      const results = await Promise.all(promises);
      if (results[0].error) throw results[0].error;
      if (results[0].data?.error) throw new Error(results[0].data.error);
      setPreviewCharacterImage(results[0].data.imageUrl);
      if (results[1]?.data?.imageUrl) setPreviewFinalLookImage(results[1].data.imageUrl);
      setAppPhase('preview');
    } catch (e: any) {
      toast({ title: "Error", description: getUserFriendlyErrorMessage(e), variant: "destructive" });
    } finally {
      setIsPreviewGenerating(false);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!referenceImage) return;
    // STRICT GATE: Require a validated character preview before storyboard generation
    if (!previewCharacterImage) {
      toast({ title: "Character Preview Required", description: "Please generate and review the character preview before creating the storyboard.", variant: "destructive" });
      return;
    }
    setIsGeneratingStoryboard(true);
    try {
      // Safety check
      const { data: safetyData } = await supabase.functions.invoke('generate-storyboard', {
        body: { action: 'validate_safety', referenceImage }
      });
      if (safetyData && !safetyData.safe) {
        toast({ title: "Safety Check Failed", description: safetyData.error || "Content violation detected.", variant: "destructive" });
        setIsGeneratingStoryboard(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-storyboard', {
        body: { action: 'generate', referenceImage, productImage, environmentImage, environmentImages: environmentImages.length > 0 ? environmentImages : undefined, config }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const board = data.storyboard as VlogStoryboard;
      setStoryboard(board);
      setAppPhase('storyboard');

      const initialMedia: Record<number, GeneratedMedia> = {};
      board.steps.forEach((_, idx) => { initialMedia[idx] = { ...DEFAULT_MEDIA }; });
      setGeneratedMedia(initialMedia);

      // Start generating all scenes
      const tasks: QueueItem[] = board.steps.map((step, index) => ({
        id: Math.random().toString(36).slice(2, 9),
        type: 'generate',
        index,
        step,
        config: { ...config }
      }));
      addToQueue(tasks);
    } catch (e: any) {
      toast({ title: "Error", description: getUserFriendlyErrorMessage(e), variant: "destructive" });
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setGeneratedMedia(prev => ({ ...prev, [index]: { ...prev[index], isSelected: !prev[index]?.isSelected } }));
  };

  const handleToggleLock = (index: number, type: 'character' | 'outfit' | 'environment') => {
    setGeneratedMedia(prev => {
      const next = { ...prev };
      const key = type === 'character' ? 'lockedCharacter' : type === 'outfit' ? 'lockedOutfit' : 'lockedEnvironment';
      const currentIsLocked = next[index]?.[key];
      if (!currentIsLocked) {
        Object.keys(next).forEach(k => {
          const i = parseInt(k);
          next[i] = { ...next[i], [key]: false };
        });
      }
      next[index] = { ...next[index], [key]: !currentIsLocked };
      return next;
    });
  };

  const handleUpdatePrompt = (index: number, newPrompt: string) => {
    if (!storyboard) return;
    const updatedSteps = [...storyboard.steps];
    updatedSteps[index] = { ...updatedSteps[index], image_prompt: newPrompt };
    setStoryboard({ ...storyboard, steps: updatedSteps });
    addToQueue([{ id: Math.random().toString(), type: 'generate', index, step: updatedSteps[index], config: { ...config } }]);
  };

  const handleUpdateVideoPrompt = (index: number, newPrompt: string) => {
    if (!storyboard) return;
    const updatedSteps = [...storyboard.steps];
    updatedSteps[index] = { ...updatedSteps[index], video_prompt: newPrompt };
    setStoryboard({ ...storyboard, steps: updatedSteps });
  };

  const getSelectionCount = () => Object.values(generatedMedia).filter(m => m.isSelected).length;

  const handleBatchAction = (type: 'regenerate' | 'upscale' | 'video' | 'delete') => {
    if (!storyboard) return;
    const selectedIndices = Object.keys(generatedMedia).map(k => parseInt(k)).filter(i => generatedMedia[i]?.isSelected);
    const clearedMedia = { ...generatedMedia };
    selectedIndices.forEach(i => { if (clearedMedia[i]) clearedMedia[i] = { ...clearedMedia[i], isSelected: false }; });
    setGeneratedMedia(clearedMedia);

    if (type === 'delete') {
      setGeneratedMedia(prev => {
        const next = { ...prev };
        selectedIndices.forEach(i => { next[i] = { ...next[i], imageUrl: undefined, isSelected: false, lockedCharacter: false, lockedOutfit: false, lockedEnvironment: false, error: undefined }; });
        return next;
      });
      return;
    }

    const tasks: QueueItem[] = selectedIndices
      .filter(i => type !== 'upscale' && type !== 'video' || generatedMedia[i]?.imageUrl)
      .map(index => ({
        id: Math.random().toString(36).slice(2, 9),
        type: type === 'regenerate' ? 'generate' : type === 'upscale' ? 'upscale' : 'generate_video',
        index,
        step: storyboard.steps[index],
        config: { ...config },
        baseImageUrl: generatedMedia[index]?.imageUrl
      }));
    addToQueue(tasks);
  };

  const generateScriptContent = () => {
    if (!storyboard) return "";
    let content = `PROJECT: ${config.creationMode === 'vlog' ? config.vlogCategory : 'UGC'}\nTOPIC: ${config.creationMode === 'vlog' ? config.vlogTopic : config.ugcPrompt}\nDATE: ${new Date().toLocaleDateString()}\n\n`;
    storyboard.steps.forEach(step => {
      content += `SCENE ${step.step_number}: ${step.step_name}\n[VISUAL] ${step.a_roll}\n[SCRIPT] ${step.script}\n[CAMERA] ${step.camera_direction}\n[IMAGE PROMPT] ${step.image_prompt}\n[VIDEO PROMPT] ${step.video_prompt}\n\n`;
    });
    return content;
  };

  const handleDownloadScript = () => {
    const content = generateScriptContent();
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `script-${config.vlogCategory.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    let count = 0;
    for (const [index, media] of Object.entries(generatedMedia)) {
      const m = media as GeneratedMedia;
      if (m.imageUrl && !m.imageUrl.startsWith('data:')) {
        try {
          const resp = await fetch(m.imageUrl);
          const blob = await resp.blob();
          zip.file(`scene-${parseInt(index) + 1}.png`, blob);
          count++;
        } catch { /* skip */ }
      } else if (m.imageUrl?.startsWith('data:')) {
        const imgData = m.imageUrl.split(',')[1];
        zip.file(`scene-${parseInt(index) + 1}.jpg`, imgData, { base64: true });
        count++;
      }
    }
    const scriptText = generateScriptContent();
    if (scriptText) zip.file("full_script.txt", scriptText);
    if (count === 0 && !storyboard) { toast({ title: "Nothing to download" }); return; }
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `ai-studio-assets.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmNewProject = () => {
    setConfig({ ...INITIAL_CONFIG });
    setReferenceImage(null);
    setReferenceImages([]);
    setProductImage(null);
    setEnvironmentImage(null);
    setEnvironmentImages([]);
    setPreviewCharacterImage(null);
    setPreviewFinalLookImage(null);
    setStoryboard(null);
    setGeneratedMedia({});
    setQueue([]);
    setEnlargedImageIndex(null);
    setIsProcessing(false);
    setShowSafetyTerms(false);
    setAppPhase('setup');
    setShowResetConfirmation(false);
  };

  const queueStatusText = () => {
    if (!storyboard) return "";
    const total = storyboard.steps.length;
    const completed = Object.values(generatedMedia).filter(m => !!m.imageUrl).length;
    return completed === total && queue.length === 0 && !isProcessing
      ? `All scenes generated: ${completed}/${total}`
      : `Generating scenes: ${completed}/${total}`;
  };

  return (
    <ProjectLayout>
      <div className="min-h-screen pb-20 relative">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border py-3 px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent tracking-tight">
              AI Studio
            </h1>
            {(queue.length > 0 || isProcessing) && (
              <div className="flex items-center gap-3 px-3 py-1 bg-muted rounded-full border border-border">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-mono">{queueStatusText()}</span>
                <button onClick={clearQueue} className="text-xs text-destructive hover:text-destructive/80 underline uppercase font-bold ml-2">Cancel</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowHelp(true)}><HelpCircle className="h-5 w-5" /></Button>
            <Button variant="outline" size="sm" onClick={() => setShowResetConfirmation(true)}>
              <RotateCcw className="h-4 w-4 mr-1" /> New Project
            </Button>
          </div>
        </header>

        <StudioHelp open={showHelp} onClose={() => setShowHelp(false)} />

        {/* Reset Confirmation */}
        {showResetConfirmation && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-foreground mb-2">Start New Project?</h3>
              <p className="text-muted-foreground mb-6">All current progress and generated images will be lost.</p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowResetConfirmation(false)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmNewProject}>Start New</Button>
              </div>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 py-8">
          {appPhase === 'setup' && (
            <StudioSetup
              config={config} setConfig={setConfig}
              referenceImage={referenceImage} setReferenceImage={setReferenceImage}
              setReferenceImages={setReferenceImages}
              environmentImage={environmentImage} setEnvironmentImage={setEnvironmentImage}
              setEnvironmentImages={setEnvironmentImages}
              productImage={productImage} setProductImage={setProductImage}
              isProcessing={isProcessing} isPreviewGenerating={isPreviewGenerating}
              showSafetyTerms={showSafetyTerms} setShowSafetyTerms={setShowSafetyTerms}
              isGeneratingTopic={isGeneratingTopic}
              onGeneratePreview={handleGeneratePreview}
              onGenerateTopicIdeas={handleGenerateTopicIdeas}
            />
          )}

          {appPhase === 'preview' && (
            <StudioPreview
              config={config}
              previewCharacterImage={previewCharacterImage}
              previewFinalLookImage={previewFinalLookImage}
              isGeneratingStoryboard={isGeneratingStoryboard}
              onBack={() => setAppPhase('setup')}
              onGenerateStoryboard={handleGenerateStoryboard}
            />
          )}

          {appPhase === 'storyboard' && storyboard && (
            <StudioStoryboard
              config={config} storyboard={storyboard} generatedMedia={generatedMedia}
              onToggleSelect={handleToggleSelect}
              onToggleLock={handleToggleLock}
              onEnlarge={(i) => setEnlargedImageIndex(i)}
              onAddToQueue={addToQueue}
              onUpdatePrompt={handleUpdatePrompt}
              onUpdateVideoPrompt={handleUpdateVideoPrompt}
              onBatchRegenerate={() => handleBatchAction('regenerate')}
              onBatchUpscale={() => handleBatchAction('upscale')}
              onBatchGenerateVideo={() => handleBatchAction('video')}
              onBatchDelete={() => handleBatchAction('delete')}
              onDownloadScript={handleDownloadScript}
              onDownloadAll={handleDownloadAll}
              selectionCount={getSelectionCount()}
            />
          )}
        </main>

        {enlargedImageIndex !== null && (
          <ImageLightbox
            index={enlargedImageIndex}
            media={generatedMedia}
            onClose={() => setEnlargedImageIndex(null)}
            onNavigate={(i) => setEnlargedImageIndex(i)}
          />
        )}
      </div>
    </ProjectLayout>
  );
};

export default AIStudio;
